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
      camera.position.set(0, 6.5, 15);
      camera.lookAt(0, 4, 0);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.6;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // ===== AGGRESSIVE LIGHTING =====
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));

      const key = new THREE.DirectionalLight(0xffffff, 2.5);
      key.position.set(4, 10, 8);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xddeeff, 1.2);
      fill.position.set(-5, 6, 4);
      scene.add(fill);

      const rim = new THREE.DirectionalLight(0xe8c0ff, 0.8);
      rim.position.set(0, 4, -8);
      scene.add(rim);

      const front = new THREE.PointLight(0xfff0f5, 1.0, 30);
      front.position.set(0, 2, 8);
      scene.add(front);

      const top = new THREE.PointLight(0xffffff, 0.6, 25);
      top.position.set(0, 12, 0);
      scene.add(top);

      // Loading
      const loadingDiv = document.createElement('div');
      loadingDiv.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#ffb7d5;font-size:14px;z-index:2;font-family:Inter,sans-serif;';
      loadingDiv.innerHTML = '<div style="width:40px;height:40px;border:3px solid rgba(255,183,213,0.2);border-top-color:#ffb7d5;border-radius:50%;animation:spin 0.8s linear infinite;"></div><span>Loading Elaina...</span>';
      container.appendChild(loadingDiv);

      const styleTag = document.createElement('style');
      styleTag.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(styleTag);

      // Textures
      const tl = new THREE.TextureLoader();
      const texDir = '/models/elaina/';
      function loadTex(name: string) {
        const t = tl.load(texDir + name);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }

      const texHair = loadTex('Hair_Base_Color.png');
      const texClothes = loadTex('Clothes.png');
      const texFace = loadTex('Face_Body_Base_Color.png');
      const texEye = loadTex('Eye.png');

      // Load FBX
      const loader = new FBXLoader();
      let model: any = null;
      let headBone: any = null;

      loader.load('/models/elaina/Elaina.fbx', (fbx) => {
        if (cancelled) return;
        model = fbx;

        // Scale and center
        const box = new THREE.Box3().setFromObject(fbx);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 9 / maxDim;
        fbx.scale.setScalar(scale);
        fbx.position.sub(center.multiplyScalar(scale));
        fbx.position.y -= box.min.y * scale;

        // ===== FORCE-APPLY TEXTURES TO ALL MESHES =====
        fbx.traverse((child: any) => {
          if (!child.isMesh) return;

          child.castShadow = true;

          // Create brand new materials
          const newMats: any[] = [];
          const srcMats = Array.isArray(child.material) ? child.material : [child.material];

          srcMats.forEach((srcMat: any) => {
            const name = (srcMat.name || '').toLowerCase();
            let tex = texFace; // default
            let matColor = 0xffffff;

            if (name.includes('hair')) {
              tex = texHair;
              matColor = 0xfaf0e6; // slightly warm for hair
            } else if (name.includes('cloth') || name.includes('clothes') || name.includes('elaina')) {
              tex = texClothes;
            } else if (name.includes('face') || name.includes('body')) {
              tex = texFace;
            } else if (name.includes('eye')) {
              tex = texEye;
            } else if (name.includes('outline')) {
              // Outline — keep dark
              const m = new THREE.MeshStandardMaterial({
                color: 0x1a0a2e,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide,
                depthWrite: false,
              });
              newMats.push(m);
              return;
            }

            // Create MeshStandardMaterial with proper texture
            const m = new THREE.MeshStandardMaterial({
              map: tex,
              color: matColor,
              roughness: 0.7,
              metalness: 0.0,
              side: THREE.DoubleSide,
              transparent: false,
              alphaTest: 0.01,
            });
            newMats.push(m);
          });

          child.material = newMats.length === 1 ? newMats[0] : newMats;
          child.geometry.computeVertexNormals();
        });

        // ===== FIND HEAD BONE =====
        fbx.traverse((child: any) => {
          if (child.isBone) {
            const bn = child.name.toLowerCase();
            if (bn === 'head' || bn.includes('head') || bn === 'neck' || bn.includes('neck')) {
              headBone = child;
            }
          }
        });

        scene.add(fbx);
        if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
      }, undefined, (err) => {
        if (cancelled) return;
        console.error('FBX load error:', err);
      });

      // ===== MOUSE TRACKING =====
      let mouseX = 0, mouseY = 0;
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
          // Body follows mouse
          const targetBodyY = mouseX * 0.3;
          model.rotation.y += (targetBodyY - model.rotation.y) * 0.04;

          // Breathing float
          model.position.y += Math.sin(time * 1.2) * 0.002;

          // Gentle sway
          model.rotation.x = Math.sin(time * 0.5) * 0.01;
          model.rotation.z = Math.sin(time * 0.7) * 0.005;

          // Head tracking
          if (headBone) {
            headBone.rotation.y += (mouseX * 0.4 - headBone.rotation.y) * 0.06;
            headBone.rotation.x += (mouseY * -0.2 - headBone.rotation.x) * 0.06;
          }
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
            mats.forEach((m: any) => { if (m.map) m.map.dispose(); m.dispose(); });
          }
        });
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
        if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag);
      };
    }

    init();
    return () => { cleanupRef.current?.(); };
  }, []);

  return (
    <div ref={containerRef} className="elaina-3d-container" style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
    }} />
  );
}
