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

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(22, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(0, 6.5, 15);
      camera.lookAt(0, 4, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.8;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // Bright lighting
      scene.add(new THREE.AmbientLight(0xffffff, 2.0));
      const dl1 = new THREE.DirectionalLight(0xffffff, 3.0);
      dl1.position.set(4, 10, 8);
      scene.add(dl1);
      const dl2 = new THREE.DirectionalLight(0xffeef5, 1.5);
      dl2.position.set(-5, 6, 4);
      scene.add(dl2);
      const dl3 = new THREE.DirectionalLight(0xe8c0ff, 1.0);
      dl3.position.set(0, 4, -8);
      scene.add(dl3);
      const pl1 = new THREE.PointLight(0xfff5f8, 1.5, 30);
      pl1.position.set(0, 2, 8);
      scene.add(pl1);
      const pl2 = new THREE.PointLight(0xffffff, 1.0, 25);
      pl2.position.set(0, 12, 0);
      scene.add(pl2);
      const pl3 = new THREE.PointLight(0xffe8f0, 0.8, 20);
      pl3.position.set(0, -1, 5);
      scene.add(pl3);

      // Loading
      const loadingDiv = document.createElement('div');
      loadingDiv.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#ffb7d5;font-size:14px;z-index:2;font-family:Inter,sans-serif;';
      loadingDiv.innerHTML = '<div style="width:40px;height:40px;border:3px solid rgba(255,183,213,0.2);border-top-color:#ffb7d5;border-radius:50%;animation:spin 0.8s linear infinite;"></div><span>Loading Elaina 3D...</span>';
      container.appendChild(loadingDiv);
      const styleTag = document.createElement('style');
      styleTag.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(styleTag);

      // ===== LOAD TEXTURES =====
      const tl = new THREE.TextureLoader();
      const texDir = '/models/elaina/';

      function loadTex(name: string): any {
        const t = tl.load(texDir + name);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }

      const texFace = loadTex('Face_Body_Base_Color.png');
      const texHair = loadTex('Hair_Base_Color.png');
      const texClothes = loadTex('Clothes.png');
      const texEye = loadTex('Eye.png');

      // ===== LOAD FBX =====
      const loader = new FBXLoader();
      let model: any = null;

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

        // ===== APPLY TEXTURES BY MESH NAME (not material name!) =====
        // From debug we know:
        // Mesh "Elaina_Clothes001" → materials: Clothes, Clothes Outline
        // Mesh "Elaina001" → materials: Face Body, Outline, Eye
        // Mesh "Hair001" → materials: Hair, Hair Outline

        fbx.traverse((child: any) => {
          if (!child.isMesh) return;

          const meshName = (child.name || '').toLowerCase();
          const srcMats = Array.isArray(child.material) ? child.material : [child.material];

          // Determine which texture this MESH should use
          let meshTex: any;
          if (meshName.includes('hair')) {
            meshTex = texHair;
          } else if (meshName.includes('cloth') || meshName.includes('elaina_cloth')) {
            meshTex = texClothes;
          } else {
            meshTex = texFace; // Elaina001 = face/body/eye
          }

          const newMats: any[] = [];

          srcMats.forEach((srcMat: any, idx: number) => {
            const matName = (srcMat.name || '').toLowerCase();

            // Outline materials — dark transparent
            if (matName.includes('outline')) {
              newMats.push(new THREE.MeshBasicMaterial({
                color: 0x1a0a2e,
                transparent: true,
                opacity: 0.45,
                side: THREE.BackSide,
                depthWrite: false,
              }));
              return;
            }

            // Eye material — on the Elaina001 mesh
            if (matName.includes('eye') && meshName.includes('elaina') && !meshName.includes('cloth')) {
              newMats.push(new THREE.MeshPhongMaterial({
                map: texEye,
                color: 0xffffff,
                specular: 0x444444,
                shininess: 30,
                side: THREE.DoubleSide,
              }));
              return;
            }

            // Face Body material — special handling (has vertex colors)
            if (matName.includes('face') || matName.includes('body')) {
              const hasVertexColors = !!child.geometry?.attributes?.color;
              newMats.push(new THREE.MeshPhongMaterial({
                map: texFace,
                color: 0xffffff,
                // If geometry has vertex colors, use them
                vertexColors: hasVertexColors,
                emissive: 0x110808,
                emissiveIntensity: 0.3,
                specular: 0x222222,
                shininess: 10,
                side: THREE.DoubleSide,
              }));
              return;
            }

            // Hair material
            if (matName.includes('hair')) {
              newMats.push(new THREE.MeshPhongMaterial({
                map: texHair,
                color: 0xffffff,
                specular: 0x333333,
                shininess: 20,
                side: THREE.DoubleSide,
              }));
              return;
            }

            // Clothes material
            if (matName.includes('cloth')) {
              newMats.push(new THREE.MeshPhongMaterial({
                map: texClothes,
                color: 0xffffff,
                specular: 0x222222,
                shininess: 10,
                side: THREE.DoubleSide,
              }));
              return;
            }

            // Fallback — use mesh texture
            newMats.push(new THREE.MeshPhongMaterial({
              map: meshTex,
              color: 0xffffff,
              side: THREE.DoubleSide,
            }));
          });

          child.material = newMats.length === 1 ? newMats[0] : newMats;
          child.geometry.computeVertexNormals();
        });

        scene.add(fbx);
        if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
      }, undefined, (err) => {
        if (!cancelled) console.error('FBX load error:', err);
      });

      // ===== MOUSE =====
      let mouseX = 0, mouseY = 0;
      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      };
      container.addEventListener('mousemove', onMouseMove);

      // ===== ANIMATION — Procedural body movement (no skeleton needed) =====
      let time = 0;
      let baseY = 0;
      let baseSet = false;

      function animate() {
        animFrameId = requestAnimationFrame(animate);
        time += 0.016;

        if (model) {
          if (!baseSet) { baseY = model.position.y; baseSet = true; }

          // Body rotation follows mouse
          model.rotation.y += (mouseX * 0.3 - model.rotation.y) * 0.04;

          // Breathing float
          model.position.y = baseY + Math.sin(time * 1.2) * 0.08;

          // Gentle sway
          model.rotation.x = Math.sin(time * 0.5) * 0.012;
          model.rotation.z = Math.sin(time * 0.7) * 0.006;
        }

        renderer.render(scene, camera);
      }
      animate();

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
