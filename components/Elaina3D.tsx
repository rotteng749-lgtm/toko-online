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

      // ===== BRIGHT LIGHTING =====
      scene.add(new THREE.AmbientLight(0xffffff, 2.0));

      const key = new THREE.DirectionalLight(0xffffff, 3.0);
      key.position.set(4, 10, 8);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xffeef5, 1.5);
      fill.position.set(-5, 6, 4);
      scene.add(fill);

      const rim = new THREE.DirectionalLight(0xe8c0ff, 1.0);
      rim.position.set(0, 4, -8);
      scene.add(rim);

      const front = new THREE.PointLight(0xfff5f8, 1.5, 30);
      front.position.set(0, 2, 8);
      scene.add(front);

      const top = new THREE.PointLight(0xffffff, 1.0, 25);
      top.position.set(0, 12, 0);
      scene.add(top);

      // Bottom fill to illuminate face/chin area
      const bottom = new THREE.PointLight(0xffe8f0, 0.8, 20);
      bottom.position.set(0, -1, 5);
      scene.add(bottom);

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
      const texDir = '/models/elaina/';
      function loadTex(name: string): any {
        const t = tl.load(texDir + name);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }

      const texHair = loadTex('Hair_Base_Color.png');
      const texClothes = loadTex('Clothes.png');
      const texFace = loadTex('Face_Body_Base_Color.png');
      const texEye = loadTex('Eye.png');

      // ===== LOAD FBX =====
      const loader = new FBXLoader();
      let model: any | null = null;
      let headBone: any | null = null;

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

        // Debug: log all mesh names and material names
        console.log('=== ELAINA FBX DEBUG ===');
        let meshIdx = 0;

        // ===== APPLY TEXTURES =====
        fbx.traverse((child: any) => {
          if (!child.isMesh) return;
          meshIdx++;

          const srcMats = Array.isArray(child.material) ? child.material : [child.material];
          const newMats: any[] = [];

          srcMats.forEach((srcMat: any, matIdx: number) => {
            const name = (srcMat.name || '').toLowerCase();
            const meshName = (child.name || '').toLowerCase();
            console.log(`Mesh[${meshIdx}] "${child.name}" → Material[${matIdx}] "${srcMat.name}"`);

            // Determine texture and settings based on material name
            let tex: any | null = null;
            let matColor = 0xffffff;
            let emissive = 0x000000;
            let emissiveIntensity = 0;
            let isOutline = false;

            if (name.includes('hair') && !name.includes('outline')) {
              tex = texHair;
              matColor = 0xfff5ee;
            } else if (name.includes('cloth') || name.includes('clothes') || name.includes('elaina')) {
              tex = texClothes;
            } else if (name.includes('face') || name.includes('body')) {
              tex = texFace;
              emissive = 0x221111;
              emissiveIntensity = 0.3; // face slightly emissive so never dark
            } else if (name.includes('eye')) {
              tex = texEye;
            } else if (name.includes('outline')) {
              isOutline = true;
            } else {
              // Unknown material — try to guess from mesh name
              const mn = meshName;
              if (mn.includes('hair')) tex = texHair;
              else if (mn.includes('cloth') || mn.includes('elaina')) tex = texClothes;
              else tex = texFace;
            }

            if (isOutline) {
              newMats.push(new THREE.MeshBasicMaterial({
                color: 0x2a1040,
                transparent: true,
                opacity: 0.4,
                side: THREE.BackSide,
                depthWrite: false,
              }));
              return;
            }

            // Build material
            if (tex) {
              // Use MeshPhongMaterial — more compatible with FBX textures
              newMats.push(new THREE.MeshPhongMaterial({
                map: tex,
                color: matColor,
                emissive: emissive,
                emissiveIntensity: emissiveIntensity,
                specular: 0x222222,
                shininess: 15,
                side: THREE.DoubleSide,
              }));
            } else {
              // Fallback — bright flat material
              newMats.push(new THREE.MeshPhongMaterial({
                color: 0xffccdd,
                emissive: 0x110510,
                emissiveIntensity: 0.2,
                side: THREE.DoubleSide,
              }));
            }
          });

          child.material = newMats.length === 1 ? newMats[0] : newMats;
          child.geometry.computeVertexNormals();
        });

        // ===== DISCOVER BONES =====
        console.log('=== BONE DISCOVERY ===');
        const allBones: { name: string; obj: any }[] = [];
        fbx.traverse((child: any) => {
          if (child.isBone || child.type === 'Bone') {
            allBones.push({ name: child.name, obj: child });
            console.log(`Bone: "${child.name}"`);
          }
        });

        // Also check non-Bone objects that might be skeleton parts
        fbx.traverse((child: any) => {
          const n = (child.name || '').toLowerCase();
          if (n.includes('head') || n.includes('neck')) {
            headBone = child;
            console.log(`HEAD BONE FOUND: "${child.name}" type=${child.type}`);
          }
        });

        // If no head bone found, try by hierarchy position
        if (!headBone && allBones.length > 0) {
          // Try to find by common patterns
          for (const b of allBones) {
            const n = b.name.toLowerCase();
            if (n === 'head' || n.includes('head') || n === 'neck' || n.includes('neck') ||
                n === 'head.fbx' || n.includes('head.bone')) {
              headBone = b.obj;
              console.log(`HEAD BONE MATCHED: "${b.name}"`);
              break;
            }
          }
        }

        console.log(`Total bones: ${allBones.length}, Head bone: ${headBone?.name || 'NOT FOUND'}`);

        scene.add(fbx);
        if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
      }, undefined, (err) => {
        if (cancelled) return;
        console.error('FBX load error:', err);
      });

      // ===== MOUSE =====
      let mouseX = 0, mouseY = 0;
      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      };
      container.addEventListener('mousemove', onMouseMove);

      // ===== ANIMATION =====
      let time = 0;
      function animate() {
        animFrameId = requestAnimationFrame(animate);
        time += 0.016;

        if (model) {
          // Body follows mouse
          const targetRotY = mouseX * 0.3;
          model.rotation.y += (targetRotY - model.rotation.y) * 0.04;

          // Breathing float
          const baseY = model.userData.baseY ?? model.position.y;
          if (!model.userData.baseY) model.userData.baseY = model.position.y;
          model.position.y = baseY + Math.sin(time * 1.2) * 0.08;

          // Gentle sway
          model.rotation.x = Math.sin(time * 0.5) * 0.015;
          model.rotation.z = Math.sin(time * 0.7) * 0.008;

          // Head tracking
          if (headBone) {
            const targetHeadY = mouseX * 0.4;
            const targetHeadX = mouseY * -0.2;
            headBone.rotation.y += (targetHeadY - headBone.rotation.y) * 0.06;
            headBone.rotation.x += (targetHeadX - headBone.rotation.x) * 0.06;
          }

          // Procedural arm sway — find arm bones and animate them
          model.traverse((child: any) => {
            if (!child.isBone && child.type !== 'Bone') return;
            const n = (child.name || '').toLowerCase();
            // Right arm gentle sway
            if ((n.includes('right') || n.includes('.r')) && (n.includes('arm') || n.includes('shoulder') || n.includes('clavic'))) {
              child.rotation.z = Math.sin(time * 0.8 + 0.5) * 0.05;
              child.rotation.x = Math.sin(time * 0.6 + 1.0) * 0.03;
            }
            // Left arm gentle sway
            if ((n.includes('left') || n.includes('.l')) && (n.includes('arm') || n.includes('shoulder') || n.includes('clavic'))) {
              child.rotation.z = Math.sin(time * 0.8 + 2.5) * -0.05;
              child.rotation.x = Math.sin(time * 0.6 + 3.0) * 0.03;
            }
            // Spine/chest subtle sway
            if (n.includes('spine') || n.includes('chest') || n.includes('torso') || n.includes('body')) {
              child.rotation.x = Math.sin(time * 0.5) * 0.02;
              child.rotation.z = Math.sin(time * 0.3) * 0.01;
            }
          });
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
