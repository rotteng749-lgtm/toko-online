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
      // Camera focused on FACE area (below hat)
      const camera = new THREE.PerspectiveCamera(22, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(0, 4.0, 12);
      camera.lookAt(0, 3.5, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // Loading
      const loadingDiv = document.createElement('div');
      loadingDiv.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#ffb7d5;font-size:14px;z-index:2;font-family:Inter,sans-serif;';
      loadingDiv.innerHTML = '<div style="width:40px;height:40px;border:3px solid rgba(255,183,213,0.2);border-top-color:#ffb7d5;border-radius:50%;animation:spin 0.8s linear infinite;"></div><span>Loading Elaina 3D...</span>';
      container.appendChild(loadingDiv);
      const styleTag = document.createElement('style');
      styleTag.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(styleTag);

      // Textures
      const tl = new THREE.TextureLoader();
      function loadTex(name: string) {
        const t = tl.load('/models/elaina-vr/' + name);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }
      const texFace = loadTex('Face.png');
      const texHair = loadTex('Hair.png');
      const texBody = loadTex('body.png');
      const texDress = loadTex('Dress.png');
      const texCoat = loadTex('Coat.png');
      const texBroom = loadTex('broom.png');

      // Load FBX
      const loader = new FBXLoader();
      let model: any = null;
      let boneMap: Record<string, any> = {};
      let hasSkeleton = false;

      loader.load('/models/elaina-vr/Elaina%20sk.fbx', (fbx) => {
        if (cancelled) return;
        model = fbx;

        const box = new THREE.Box3().setFromObject(fbx);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 9 / maxDim;
        fbx.scale.setScalar(scale);
        fbx.position.sub(center.multiplyScalar(scale));
        fbx.position.y -= box.min.y * scale;
        // Move model UP so face is centered
        fbx.position.y += 2.0;

        // Find skeleton
        fbx.traverse((child: any) => {
          if (child.skeleton) {
            hasSkeleton = true;
            child.skeleton.bones.forEach((b: any) => {
              boneMap[b.name] = b;
              boneMap[b.name.toLowerCase()] = b;
            });
          }
        });

        // ===== ULTRA-AGGRESSIVE HAT/BROOCH/BROOM HIDE =====
        // Hide by bone name
        const hideNames = ['brooch', 'broom', 'hat', 'witch hat', 'accessory'];
        fbx.traverse((child: any) => {
          const n = (child.name || '').toLowerCase();
          if (hideNames.some(h => n.includes(h))) {
            child.visible = false;
          }
        });
        // Also hide by Brooch bone children
        const broochBone = boneMap['Brooch'] || boneMap['brooch'];
        if (broochBone) {
          broochBone.visible = false;
          broochBone.traverse((c: any) => { c.visible = false; });
        }

        // Apply textures
        fbx.traverse((child: any) => {
          if (!child.isMesh || !child.visible) return;
          const meshName = (child.name || '').toLowerCase();
          const srcMats = Array.isArray(child.material) ? child.material : [child.material];

          child.material = srcMats.map((m: any) => {
            const matName = (m.name || '').toLowerCase();

            if (matName.includes('outline')) {
              return new THREE.MeshBasicMaterial({
                color: 0x2a1040, transparent: true, opacity: 0.45,
                side: THREE.BackSide, depthWrite: false,
              });
            }

            // Skip eye material (face texture has eyes)
            if (matName.includes('eye')) {
              return new THREE.MeshBasicMaterial({
                color: 0xffffff, side: THREE.DoubleSide,
                transparent: true, opacity: 0.0, depthWrite: false,
              });
            }

            let tex = texBody;
            if (meshName.includes('hair') || matName.includes('hair')) tex = texHair;
            else if (meshName.includes('face') || matName.includes('face')) tex = texFace;
            else if (meshName.includes('dress') || matName.includes('dress')) tex = texDress;
            else if (meshName.includes('coat') || matName.includes('coat')) tex = texCoat;
            else if (meshName.includes('broom') || matName.includes('broom')) tex = texBroom;
            else if (meshName.includes('body') || matName.includes('body')) tex = texBody;

            return new THREE.MeshBasicMaterial({
              map: tex, color: 0xffffff, side: THREE.DoubleSide,
            });
          });
        });

        scene.add(fbx);
        if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
      }, undefined, (err) => {
        if (!cancelled) console.error('FBX error:', err);
      });

      // Mouse
      let mouseX = 0, mouseY = 0;
      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      };
      container.addEventListener('mousemove', onMouseMove);

      // Animation
      let time = 0;
      let lastTime = performance.now();
      let baseY = 0;
      let baseSet = false;

      function findBone(keywords: string[]) {
        for (const key of keywords) {
          const lower = key.toLowerCase();
          for (const boneName of Object.keys(boneMap)) {
            if (boneName.toLowerCase().includes(lower)) return boneMap[boneName];
          }
        }
        return null;
      }

      function animate() {
        animFrameId = requestAnimationFrame(animate);
        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;
        time += dt;

        if (model) {
          if (!baseSet) { baseY = model.position.y; baseSet = true; }

          // Body follows mouse
          model.rotation.y += (mouseX * 0.3 - model.rotation.y) * 0.04;

          // Breathing float
          model.position.y = baseY + Math.sin(time * 1.2) * 0.08;

          // Gentle sway
          model.rotation.x = Math.sin(time * 0.5) * 0.012;
          model.rotation.z = Math.sin(time * 0.7) * 0.006;

          if (hasSkeleton) {
            // Head tracking (face only!)
            const head = findBone(['head']);
            if (head) {
              head.rotation.y += (mouseX * 0.5 - head.rotation.y) * 0.06;
              head.rotation.x += (mouseY * -0.3 - head.rotation.x) * 0.06;
            }

            const neck = findBone(['neck']);
            if (neck) neck.rotation.y += (mouseX * 0.2 - neck.rotation.y) * 0.04;

            // Spine/Chest breathing
            const spine = findBone(['spine']);
            if (spine) spine.rotation.x = Math.sin(time * 1.2) * 0.03;
            const chest = findBone(['chest']);
            if (chest) {
              chest.rotation.x = Math.sin(time * 1.2 + 0.3) * 0.02;
              chest.rotation.z = Math.sin(time * 0.8) * 0.01;
            }

            // Arms — gentle idle
            const upperArmL = findBone(['upper_arm_l']);
            const upperArmR = findBone(['upper_arm_r']);
            if (upperArmL) {
              upperArmL.rotation.z = -0.3 + Math.sin(time * 0.6) * 0.08;
              upperArmL.rotation.x = -0.15 + Math.sin(time * 0.4) * 0.04;
            }
            if (upperArmR) {
              upperArmR.rotation.z = 0.3 + Math.sin(time * 0.6 + Math.PI) * 0.08;
              upperArmR.rotation.x = -0.15 + Math.sin(time * 0.4 + 2.5) * 0.04;
            }

            // Hair sway
            ['hairback_01', 'hairback_02', 'hairback_03', 'hairfront_01', 'hairfront_02'].forEach((name, i) => {
              const bone = findBone([name]);
              if (bone) {
                bone.rotation.x = Math.sin(time * 0.8 + i * 0.5) * 0.03;
                bone.rotation.z = Math.sin(time * 0.6 + i * 0.3) * 0.02;
              }
            });

            // Coat/Skirt sway
            ['coat_l_front', 'coat_r_front', 'skirt_l_front', 'skirt_r_front'].forEach((name, i) => {
              const bone = findBone([name]);
              if (bone) bone.rotation.z = Math.sin(time * 0.5 + i * 0.8) * 0.04;
            });
          }
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
            mats.forEach((mt: any) => { if (mt.map) mt.map.dispose(); mt.dispose(); });
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
