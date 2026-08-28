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
      const camera = new THREE.PerspectiveCamera(25, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(0, 8, 18);
      camera.lookAt(0, 4, 0);

      // Renderer
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
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);

      // Lights — anime-style soft lighting
      const ambientLight = new THREE.AmbientLight(0xb0a0ff, 0.8);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffd4e8, 1.5);
      mainLight.position.set(5, 12, 8);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      scene.add(mainLight);

      const rimLight = new THREE.DirectionalLight(0xa0d4ff, 0.6);
      rimLight.position.set(-5, 8, -5);
      scene.add(rimLight);

      const fillLight = new THREE.PointLight(0xd4a0ff, 0.5, 30);
      fillLight.position.set(-3, 5, 5);
      scene.add(fillLight);

      // Pink accent light from below
      const accentLight = new THREE.PointLight(0xff69b4, 0.3, 20);
      accentLight.position.set(0, -2, 3);
      scene.add(accentLight);

      // Load FBX model
      const loader = new FBXLoader();
      let model: any = null;

      // Create a loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#c8b8e8;font-size:14px;font-family:Inter,sans-serif;';
      loadingDiv.innerHTML = `
        <div style="width:48px;height:48px;border:3px solid rgba(200,184,232,0.2);border-top-color:#c8b8e8;border-radius:50%;animation:spin 1s linear infinite;"></div>
        <span>Loading Elaina 3D...</span>
      `;
      container.appendChild(loadingDiv);

      // Add spin animation
      const style = document.createElement('style');
      style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);

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
          const scale = 10 / maxDim;
          fbx.scale.setScalar(scale);
          fbx.position.sub(center.multiplyScalar(scale));
          fbx.position.y -= (box.min.y * scale);

          // Apply textures to materials
          const textureLoader = new THREE.TextureLoader();
          const texDir = '/models/elaina/';

          fbx.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              if (child.material) {
                const mat = Array.isArray(child.material) ? child.material : [child.material];
                mat.forEach((m: any) => {
                  m.wireframe = false;
                  // Try to identify material by name
                  const name = (m.name || '').toLowerCase();
                  if (name.includes('hair') || name.includes('hijab') || name.includes('hodie')) {
                    const tex = textureLoader.load(texDir + 'Hair_Base_Color.png');
                    tex.colorSpace = THREE.SRGBColorSpace;
                    m.map = tex;
                  } else if (name.includes('cloth') || name.includes('body') || name.includes('outfit') || name.includes('wear')) {
                    const tex = textureLoader.load(texDir + 'Clothes.png');
                    tex.colorSpace = THREE.SRGBColorSpace;
                    m.map = tex;
                  } else if (name.includes('face') || name.includes('body') || name.includes('skin')) {
                    const tex = textureLoader.load(texDir + 'Face_Body_Base_Color.png');
                    tex.colorSpace = THREE.SRGBColorSpace;
                    m.map = tex;
                  } else if (name.includes('eye')) {
                    const tex = textureLoader.load(texDir + 'Eye.png');
                    tex.colorSpace = THREE.SRGBColorSpace;
                    m.map = tex;
                  } else {
                    // Default: try clothes texture
                    const tex = textureLoader.load(texDir + 'Clothes.png');
                    tex.colorSpace = THREE.SRGBColorSpace;
                    m.map = tex;
                  }
                  m.needsUpdate = true;
                });
              }
            }
          });

          scene.add(fbx);

          // Remove loading indicator
          if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
        },
        undefined,
        (err) => {
          if (cancelled) return;
          console.error('FBX load error:', err);
          loadingDiv.innerHTML = `
            <div style="font-size:48px;">🧹</div>
            <span style="color:#e8a0c8;">Elaina — The Mysterious Witch</span>
            <span style="font-size:12px;color:rgba(200,184,232,0.5);">3D model loading...</span>
          `;
        }
      );

      // Mouse interaction — rotate model
      let mouseX = 0;
      let targetRotY = 0;

      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        targetRotY = mouseX * 0.5;
      };
      container.addEventListener('mousemove', onMouseMove);

      // Idle floating animation
      let time = 0;

      // Animation loop
      function animate() {
        animFrameId = requestAnimationFrame(animate);
        time += 0.01;

        if (model) {
          // Smooth rotation toward mouse
          model.rotation.y += (targetRotY - model.rotation.y) * 0.03;

          // Subtle idle breathing/floating
          model.position.y += Math.sin(time * 1.5) * 0.003;
          model.rotation.z = Math.sin(time * 0.8) * 0.01;
        }

        renderer.render(scene, camera);
      }
      animate();

      // Resize handler
      const onResize = () => {
        if (!container.clientWidth) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener('resize', onResize);

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
