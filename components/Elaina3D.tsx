'use client';

import { useEffect, useRef } from 'react';

export default function Elaina3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let cancelled = false;
    let animFrameId: number;

    async function init() {
      const THREE = await import('three');
      const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');

      if (cancelled) return;

      // Scene
      const scene = new THREE.Scene();

      // Camera
      const camera = new THREE.PerspectiveCamera(22, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(0, 7, 16);
      camera.lookAt(0, 4.5, 0);

      // Renderer — anime/toon style
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // ===== LIGHTING — Bright anime-style lighting =====
      // Strong ambient so model is never dark
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      // Main key light — warm pinkish
      const keyLight = new THREE.DirectionalLight(0xfff0f5, 2.0);
      keyLight.position.set(3, 10, 8);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      scene.add(keyLight);

      // Fill light — cool blue from the side
      const fillLight = new THREE.DirectionalLight(0xd4e4ff, 1.0);
      fillLight.position.set(-5, 6, 4);
      scene.add(fillLight);

      // Rim / back light — purple edge glow
      const rimLight = new THREE.DirectionalLight(0xc8a0ff, 0.8);
      rimLight.position.set(0, 5, -8);
      scene.add(rimLight);

      // Pink accent from below/front
      const accentLight = new THREE.PointLight(0xffb7d5, 0.6, 25);
      accentLight.position.set(0, 0, 6);
      scene.add(accentLight);

      // Top light for hair highlight
      const topLight = new THREE.PointLight(0xffffff, 0.4, 20);
      topLight.position.set(0, 12, 0);
      scene.add(topLight);

      // ===== Load FBX model =====
      const loader = new FBXLoader();
      let model: any = null;
      let headBone: any = null;

      // Loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#c8b8e8;font-size:14px;font-family:Inter,sans-serif;z-index:2;';
      loadingDiv.innerHTML = `
        <div style="width:48px;height:48px;border:3px solid rgba(200,184,232,0.2);border-top-color:#ffb7d5;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
        <span style="color:#ffb7d5;">Loading Elaina 3D...</span>
      `;
      container.appendChild(loadingDiv);

      const style = document.createElement('style');
      style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);

      // Texture loading
      const textureLoader = new THREE.TextureLoader();
      const texDir = '/models/elaina/';

      function loadTexture(name: string) {
        const tex = textureLoader.load(texDir + name);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        return tex;
      }

      const textures = {
        hair: loadTexture('Hair_Base_Color.png'),
        clothes: loadTexture('Clothes.png'),
        face: loadTexture('Face_Body_Base_Color.png'),
        eye: loadTexture('Eye.png'),
      };

      loader.load(
        '/models/elaina/Elaina.fbx',
        (fbx) => {
          if (cancelled) return;
          model = fbx;

          // Center and scale model
          const box = new THREE.Box3().setFromObject(fbx);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 9 / maxDim;
          fbx.scale.setScalar(scale);
          fbx.position.sub(center.multiplyScalar(scale));
          fbx.position.y -= box.min.y * scale;

          // ===== APPLY TEXTURES BY MATERIAL NAME =====
          fbx.traverse((child: any) => {
            if (!child.isMesh) return;

            child.castShadow = true;
            child.receiveShadow = true;

            const mats = Array.isArray(child.material) ? child.material : [child.material];

            mats.forEach((m: any) => {
              const name = (m.name || '').toLowerCase();

              // Match material name to texture
              if (name.includes('hair')) {
                m.map = textures.hair;
                m.color.set(0xffffff);
              } else if (name.includes('cloth') || name.includes('clothes') || name.includes('elaina')) {
                m.map = textures.clothes;
                m.color.set(0xffffff);
              } else if (name.includes('face') || name.includes('body')) {
                m.map = textures.face;
                m.color.set(0xffffff);
              } else if (name.includes('eye')) {
                m.map = textures.eye;
                m.color.set(0xffffff);
              } else {
                // Outline materials — keep dark
                if (name.includes('outline')) {
                  m.color.set(0x1a0a2e);
                  m.transparent = true;
                  m.opacity = 0.7;
                } else {
                  // Default — apply face texture
                  m.map = textures.face;
                  m.color.set(0xffffff);
                }
              }

              // Ensure materials render properly
              m.side = THREE.DoubleSide;
              m.needsUpdate = true;
            });
          });

          // ===== FIND HEAD BONE FOR TRACKING =====
          fbx.traverse((child: any) => {
            if (child.isBone) {
              const boneName = child.name.toLowerCase();
              if (boneName.includes('head') || boneName.includes('neck')) {
                headBone = child;
              }
            }
          });

          scene.add(fbx);

          // Remove loading
          if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
        },
        undefined,
        (err) => {
          if (cancelled) return;
          console.error('FBX load error:', err);
          loadingDiv.innerHTML = `<span style="color:#fb7185;">Failed to load model</span>`;
        }
      );

      // ===== MOUSE INTERACTION =====
      let mouseX = 0;
      let mouseY = 0;

      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      };
      container.addEventListener('mousemove', onMouseMove);

      // ===== ANIMATION LOOP =====
      let time = 0;

      function animate() {
        animFrameId = requestAnimationFrame(animate);
        time += 0.016;

        if (model) {
          // Smooth body rotation following mouse
          const targetRotY = mouseX * 0.3;
          model.rotation.y += (targetRotY - model.rotation.y) * 0.04;

          // Idle breathing — gentle floating
          model.position.y += Math.sin(time * 1.2) * 0.002;
          model.rotation.z = Math.sin(time * 0.7) * 0.008;

          // Head tracking — rotate head bone toward mouse
          if (headBone) {
            const headRotX = mouseY * -0.25;  // look up/down
            const headRotY = mouseX * 0.35;   // look left/right
            headBone.rotation.x += (headRotX - headBone.rotation.x) * 0.06;
            headBone.rotation.y += (headRotY - headBone.rotation.y) * 0.06;
          }

          // Gentle swaying animation
          model.rotation.x = Math.sin(time * 0.5) * 0.015;
        }

        renderer.render(scene, camera);
      }
      animate();

      // Resize
      const onResize = () => {
        if (!container.clientWidth) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener('resize', onResize);

      // Cleanup
      cleanupRef.current = () => {
        cancelled = true;
        cancelAnimationFrame(animFrameId);
        container.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        scene.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m: any) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          }
        });
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
        if (style.parentNode) style.parentNode.removeChild(style);
      };
    }

    init();

    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="elaina-3d-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    />
  );
}
