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
      camera.position.set(0, 5.5, 13);
      camera.lookAt(0, 4.5, 0);

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
      const texBrooch = loadTex('brooch_3.png');
      const texBroom = loadTex('broom.png');

      // Load FBX
      const loader = new FBXLoader();
      let model: any = null;
      let boneMap: Record<string, any> = {};
      let hasSkeleton = false;
      // Track eye-related meshes for blinking
      let eyeMeshes: any[] = [];

      loader.load('/models/elaina-vr/Elaina%20sk.fbx', (fbx) => {
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

        // Find skeleton + bone map
        fbx.traverse((child: any) => {
          if (child.skeleton) {
            hasSkeleton = true;
            child.skeleton.bones.forEach((b: any) => {
              boneMap[b.name] = b;
              boneMap[b.name.toLowerCase()] = b;
            });
          }
        });

        // Apply textures + find eye meshes
        fbx.traverse((child: any) => {
          if (!child.isMesh) return;
          const meshName = (child.name || '').toLowerCase();
          const srcMats = Array.isArray(child.material) ? child.material : [child.material];

          // Track eye meshes for blinking
          if (meshName.includes('eye') || meshName.includes("'eye")) {
            eyeMeshes.push(child);
          }

          child.material = srcMats.map((m: any) => {
            const matName = (m.name || '').toLowerCase();

            if (matName.includes('outline')) {
              return new THREE.MeshBasicMaterial({
                color: 0x2a1040, transparent: true, opacity: 0.45,
                side: THREE.BackSide, depthWrite: false,
              });
            }

            if (matName.includes('eye')) {
              // Eye mesh — keep visible for blinking
              return new THREE.MeshBasicMaterial({
                color: 0xffffff, side: THREE.DoubleSide,
              });
            }

            let tex = texBody;
            if (meshName.includes('hair') || matName.includes('hair')) tex = texHair;
            else if (meshName.includes('face') || matName.includes('face')) tex = texFace;
            else if (meshName.includes('dress') || matName.includes('dress')) tex = texDress;
            else if (meshName.includes('coat') || matName.includes('coat')) tex = texCoat;
            else if (meshName.includes('brooch') || matName.includes('brooch')) tex = texBrooch;
            else if (meshName.includes('broom') || matName.includes('broom')) tex = texBroom;
            else if (meshName.includes('body') || matName.includes('body')) tex = texBody;

            return new THREE.MeshBasicMaterial({
              map: tex, color: 0xffffff, side: THREE.DoubleSide,
            });
          });
        });

        // ===== FIX BROOCH (HAT) — try multiple directions =====
        const brooch = boneMap['Brooch'] || boneMap['brooch'];
        if (brooch) {
          // The Brooch bone might be in local space
          // Try moving it along the bone's local Y axis (which might be "up" for the hat)
          // Store original
          brooch.userData.origPos = brooch.position.clone();
          brooch.userData.origRot = brooch.rotation.clone();

          // Move hat UP in world space by modifying the bone's position
          // FBX bone Y-up might be different from what we expect
          // Try: move along bone's local UP direction
          const upDir = new THREE.Vector3(0, 1, 0);
          upDir.applyQuaternion(brooch.quaternion);
          brooch.position.addScaledVector(upDir, 1.5);
        }

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

      // ===== EYE BLINK SYSTEM =====
      let blinkTimer = 0;
      let blinkInterval = 3 + Math.random() * 2; // 3-5 seconds between blinks
      let isBlinking = false;
      let blinkPhase = 0; // 0=open, 1=closing, 2=closed, 3=opening
      let blinkSpeed = 12; // speed of blink animation

      function updateBlink(dt: number) {
        blinkTimer += dt;

        if (!isBlinking && blinkTimer >= blinkInterval) {
          isBlinking = true;
          blinkPhase = 1;
          blinkTimer = 0;
          blinkInterval = 2 + Math.random() * 3; // next blink in 2-5s
        }

        if (isBlinking) {
          blinkPhase += dt * blinkSpeed;

          if (blinkPhase >= 4) {
            // Blink complete
            blinkPhase = 0;
            isBlinking = false;
            // Reset eye mesh scale
            eyeMeshes.forEach(m => {
              m.scale.y = 1;
            });
          } else {
            // Apply blink scale to eye meshes
            let scaleY = 1;
            if (blinkPhase < 1) {
              // Closing
              scaleY = 1 - blinkPhase;
            } else if (blinkPhase < 2) {
              // Closed
              scaleY = 0.05;
            } else if (blinkPhase < 3) {
              // Opening
              scaleY = blinkPhase - 2;
            } else {
              // Almost open
              scaleY = 1 - (blinkPhase - 3);
            }
            scaleY = Math.max(0.05, Math.min(1, scaleY));
            eyeMeshes.forEach(m => {
              m.scale.y = scaleY;
            });
          }
        }
      }

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

          // Eye blink
          updateBlink(dt);

          if (hasSkeleton) {
            // Head tracking
            const head = findBone(['head']);
            if (head) {
              head.rotation.y += (mouseX * 0.5 - head.rotation.y) * 0.06;
              head.rotation.x += (mouseY * -0.3 - head.rotation.x) * 0.06;
            }

            // Neck
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

            // Arms — kawaii raised pose
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

            const shoulderL = findBone(['shoulder_l']);
            const shoulderR = findBone(['shoulder_r']);
            if (shoulderL) shoulderL.rotation.z = Math.sin(time * 0.5) * 0.02;
            if (shoulderR) shoulderR.rotation.z = Math.sin(time * 0.5 + Math.PI) * 0.02;

            // Hips
            const hips = findBone(['hip']);
            if (hips) hips.rotation.z = Math.sin(time * 0.4) * 0.015;

            // Legs
            const upperLegL = findBone(['upper_leg_l']);
            const upperLegR = findBone(['upper_leg_r']);
            if (upperLegL) upperLegL.rotation.x = Math.sin(time * 0.3) * 0.02;
            if (upperLegR) upperLegR.rotation.x = Math.sin(time * 0.3 + Math.PI) * 0.02;

            // Hair sway
            ['hairback_01', 'hairback_02', 'hairback_03', 'hairfront_01', 'hairfront_02'].forEach((name, i) => {
              const bone = findBone([name]);
              if (bone) {
                bone.rotation.x = Math.sin(time * 0.8 + i * 0.5) * 0.03;
                bone.rotation.z = Math.sin(time * 0.6 + i * 0.3) * 0.02;
              }
            });

            // Coat sway
            ['coat_l_front', 'coat_r_front', 'coat_l_back_01', 'coat_r_back_01'].forEach((name, i) => {
              const bone = findBone([name]);
              if (bone) bone.rotation.z = Math.sin(time * 0.5 + i * 0.8) * 0.04;
            });

            // Skirt sway
            ['skirt_l_front', 'skirt_r_front', 'skirt_l_back', 'skirt_r_back'].forEach((name, i) => {
              const bone = findBone([name]);
              if (bone) bone.rotation.z = Math.sin(time * 0.5 + i * 0.6) * 0.03;
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
