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
      camera.position.set(0, 4.0, 12);
      camera.lookAt(0, 3.5, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // Loading indicator
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
      let bindPoseQuaternions: Map<string, any> = new Map();
      let hasSkeleton = false;
      let eyeMeshes: any[] = [];

      loader.load('/models/elaina-vr/Elaina%20sk.fbx', (fbx) => {
        if (cancelled) return;
        model = fbx;

        // Scale + center
        const box = new THREE.Box3().setFromObject(fbx);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 9 / maxDim;
        fbx.scale.setScalar(scale);
        fbx.position.sub(center.multiplyScalar(scale));
        fbx.position.y -= box.min.y * scale;
        fbx.position.y += 2.0;

        // Find skeleton + save bind pose quaternions
        fbx.traverse((child: any) => {
          if (child.skeleton) {
            hasSkeleton = true;
            child.skeleton.bones.forEach((b: any) => {
              boneMap[b.name] = b;
              boneMap[b.name.toLowerCase()] = b;
              // Save the initial quaternion (bind pose)
              bindPoseQuaternions.set(b.name, b.quaternion.clone());
            });
          }
        });

        // ===== HIDE HAT/BROOCH/BROOM =====
        const hideNames = ['brooch', 'broom', 'hat', 'witch hat', 'accessory', 'hat_'];
        fbx.traverse((child: any) => {
          const n = (child.name || '').toLowerCase();
          if (hideNames.some(h => n.includes(h))) {
            child.visible = false;
          }
        });
        const broochBone = boneMap['Brooch'] || boneMap['brooch'];
        if (broochBone) {
          broochBone.visible = false;
          broochBone.traverse((c: any) => { c.visible = false; });
        }
        // Also hide Hat_01 bone
        const hatBone = boneMap['Hat_01'] || boneMap['hat_01'];
        if (hatBone) {
          hatBone.visible = false;
          hatBone.traverse((c: any) => { c.visible = false; });
        }

        // ===== APPLY TEXTURES =====
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

            // Track eye meshes for blink animation
            if (matName.includes('eye')) {
              const eyeMat = new THREE.MeshBasicMaterial({
                color: 0xffffff, side: THREE.DoubleSide,
                transparent: true, opacity: 0.0, depthWrite: false,
              });
              eyeMeshes.push(child);
              return eyeMat;
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

        // ===== SET INITIAL KAWAII POSE =====
        // Use quaternion multiply to ADD rotation on top of bind pose
        function addBoneRotation(name: string, euler: { x?: number; y?: number; z?: number }) {
          const bone = boneMap[name] || boneMap[name.toLowerCase()];
          if (!bone) return;
          const bindQ = bindPoseQuaternions.get(bone.name);
          if (!bindQ) return;
          const eulerObj = new THREE.Euler(
            euler.x || 0, euler.y || 0, euler.z || 0
          );
          const additional = new THREE.Quaternion().setFromEuler(eulerObj);
          const result = bindQ.clone().multiply(additional);
          bone.quaternion.copy(result);
        }

        // KAWAII POSE:
        // - Head tilted to the side (cute tilt)
        // - Left arm raised up high (peace sign)
        // - Right arm slightly raised
        // - Fingers in cute pose

        // Head tilt
        addBoneRotation('Head', { z: 0.15, x: -0.05 }); // tilt right + slightly up

        // Left arm raised UP (like waving)
        addBoneRotation('Shoulder_L', { x: -0.3, z: -0.3 });
        addBoneRotation('Upper_Arm_L', { z: -1.2, x: -0.5 }); // arm UP
        addBoneRotation('Lower_Arm_L', { z: -0.6, x: 0.3 }); // bent elbow

        // Right arm slightly raised
        addBoneRotation('Shoulder_R', { x: -0.2, z: 0.2 });
        addBoneRotation('Upper_Arm_R', { z: 0.4, x: -0.3 }); // arm slightly up
        addBoneRotation('Lower_Arm_R', { z: 0.3, x: 0.2 }); // bent elbow

        // Left hand fingers — peace sign
        addBoneRotation('Thumb_L_1', { x: 0.3, z: -0.5 });
        addBoneRotation('Index_L_1', { x: -0.8 }); // straight up
        addBoneRotation('Index_L_2', { x: -0.2 });
        addBoneRotation('Middle_L_1', { x: 0.5 }); // curled
        addBoneRotation('Middle_L_2', { x: 0.4 });
        addBoneRotation('Ring_L_1', { x: 0.5 });
        addBoneRotation('Ring_L_2', { x: 0.4 });
        addBoneRotation('Little_L_1', { x: 0.5 });
        addBoneRotation('Little_L_2', { x: 0.4 });

        // Right hand — relaxed pose
        addBoneRotation('Thumb_R_1', { x: 0.2, z: 0.4 });
        addBoneRotation('Index_R_1', { x: 0.3 });
        addBoneRotation('Middle_R_1', { x: 0.4 });
        addBoneRotation('Ring_R_1', { x: 0.4 });
        addBoneRotation('Little_R_1', { x: 0.4 });

        // Spine — slight lean
        addBoneRotation('Spine', { x: -0.05, z: 0.03 });
        addBoneRotation('Chest', { x: -0.03, z: 0.02 });

        // Hips — slight tilt
        addBoneRotation('Hips', { z: 0.02 });

        // Save the kawaii pose quaternions as the NEW base
        const kawaiiPoseQuaternions: Map<string, any> = new Map();
        for (const [name, bone] of Object.entries(boneMap)) {
          if (bone.isBone) {
            kawaiiPoseQuaternions.set(bone.name, bone.quaternion.clone());
          }
        }

        scene.add(fbx);
        if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);

        // Store kawaiiPoseQuaternions for animation loop
        (window as any).__kawaiiPose = kawaiiPoseQuaternions;

        // ===== MOUSE =====
        let mouseX = 0, mouseY = 0;
        const onMouseMove = (e: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        };
        container.addEventListener('mousemove', onMouseMove);

        // ===== EYE BLINK =====
        let blinkTimer = 0;
        let blinkInterval = 3; // seconds between blinks
        let nextBlinkTime = 2;
        let blinkProgress = -1; // -1 = not blinking

        function updateBlink(dt: number) {
          blinkTimer += dt;
          if (blinkProgress < 0 && blinkTimer >= nextBlinkTime) {
            // Start blink
            blinkProgress = 0;
            blinkTimer = 0;
            blinkInterval = 2 + Math.random() * 3; // 2-5 seconds between blinks
          }

          if (blinkProgress >= 0) {
            blinkProgress += dt * 8; // speed of blink
            if (blinkProgress >= 4) {
              // Blink complete
              blinkProgress = -1;
              nextBlinkTime = blinkInterval;
              blinkTimer = 0;
              // Reset eye scale
              eyeMeshes.forEach(m => { m.scale.y = 1; });
            } else {
              let scaleY = 1;
              if (blinkProgress < 1) {
                scaleY = 1 - blinkProgress; // closing
              } else if (blinkProgress < 2) {
                scaleY = 0.02; // closed
              } else if (blinkProgress < 3) {
                scaleY = blinkProgress - 2; // opening
              } else {
                scaleY = 1 - (blinkProgress - 3); // settling
              }
              eyeMeshes.forEach(m => { m.scale.y = Math.max(0.02, scaleY); });
            }
          }
        }

        // ===== ANIMATION LOOP =====
        let time = 0;
        let lastTime = performance.now();
        let baseY = fbx.position.y;

        function findBone(keywords: string[]) {
          for (const key of keywords) {
            const lower = key.toLowerCase();
            for (const boneName of Object.keys(boneMap)) {
              if (boneName.toLowerCase().includes(lower)) return boneMap[boneName];
            }
          }
          return null;
        }

        // Helper: smoothly rotate bone from kawaii pose base
        function animateBone(name: string, axis: 'x' | 'y' | 'z', targetOffset: number, speed: number) {
          const bone = boneMap[name] || boneMap[name.toLowerCase()];
          if (!bone) return;
          const kawaiiBase = (window as any).__kawaiiPose?.get(bone.name);
          if (!kawaiiBase) return;
          // Create target quaternion = kawaii base * additional offset
          const offsetEuler = new THREE.Euler(
            axis === 'x' ? targetOffset : 0,
            axis === 'y' ? targetOffset : 0,
            axis === 'z' ? targetOffset : 0
          );
          const targetQ = kawaiiBase.clone().multiply(new THREE.Quaternion().setFromEuler(offsetEuler));
          // Lerp from current to target
          bone.quaternion.slerp(targetQ, speed);
        }

        function animate() {
          animFrameId = requestAnimationFrame(animate);
          const now = performance.now();
          const dt = Math.min((now - lastTime) / 1000, 0.1);
          lastTime = now;
          time += dt;

          if (model) {
            // Body follows mouse
            model.rotation.y += (mouseX * 0.3 - model.rotation.y) * 0.04;

            // Breathing float
            model.position.y = baseY + Math.sin(time * 1.2) * 0.08;

            // Gentle sway
            model.rotation.x = Math.sin(time * 0.5) * 0.012;
            model.rotation.z = Math.sin(time * 0.7) * 0.006;

            if (hasSkeleton) {
              // Head tracking — add small rotation on top of kawaii pose
              const head = findBone(['head']);
              if (head) {
                const kawaiiHead = (window as any).__kawaiiPose?.get(head.name);
                if (kawaiiHead) {
                  const headOffset = new THREE.Euler(
                    mouseY * -0.2, // look up/down
                    mouseX * 0.4,  // look left/right
                    0.15 + Math.sin(time * 0.8) * 0.03 // kawaii tilt + subtle wobble
                  );
                  const headOffsetQ = new THREE.Quaternion().setFromEuler(headOffset);
                  const targetQ = kawaiiHead.clone().multiply(headOffsetQ);
                  head.quaternion.slerp(targetQ, 0.06);
                }
              }

              const neck = findBone(['neck']);
              if (neck) {
                const kawaiiNeck = (window as any).__kawaiiPose?.get(neck.name);
                if (kawaiiNeck) {
                  const neckOffset = new THREE.Euler(0, mouseX * 0.15, 0);
                  const neckOffsetQ = new THREE.Quaternion().setFromEuler(neckOffset);
                  const targetQ = kawaiiNeck.clone().multiply(neckOffsetQ);
                  neck.quaternion.slerp(targetQ, 0.04);
                }
              }

              // Arms — gentle wave on top of kawaii pose
              animateBone('Upper_Arm_L', 'z',
                -1.2 + Math.sin(time * 0.6) * 0.15, // wave
                0.05
              );
              animateBone('Upper_Arm_L', 'x',
                -0.5 + Math.sin(time * 0.4) * 0.08,
                0.05
              );
              animateBone('Lower_Arm_L', 'z',
                -0.6 + Math.sin(time * 0.6 + 0.5) * 0.1,
                0.05
              );

              // Right arm gentle sway
              animateBone('Upper_Arm_R', 'z',
                0.4 + Math.sin(time * 0.5 + Math.PI) * 0.08,
                0.05
              );
              animateBone('Lower_Arm_R', 'x',
                0.2 + Math.sin(time * 0.4 + 1.5) * 0.05,
                0.05
              );

              // Spine/Chest breathing
              animateBone('Spine', 'x', -0.05 + Math.sin(time * 1.2) * 0.02, 0.04);
              animateBone('Chest', 'z', 0.02 + Math.sin(time * 0.8) * 0.01, 0.04);

              // Hair sway
              ['HairBack_01', 'HairBack_02', 'HairBack_03', 'HairFront_01', 'HairFront_02'].forEach((name, i) => {
                const bone = boneMap[name] || boneMap[name.toLowerCase()];
                if (bone) {
                  bone.rotation.x += Math.sin(time * 0.8 + i * 0.5) * 0.002;
                  bone.rotation.z += Math.sin(time * 0.6 + i * 0.3) * 0.001;
                }
              });

              // Coat/Skirt gentle sway
              ['Coat_L_Front', 'Coat_R_Front', 'Skirt_L_Front', 'Skirt_R_Front'].forEach((name, i) => {
                const bone = boneMap[name] || boneMap[name.toLowerCase()];
                if (bone) {
                  bone.rotation.z += Math.sin(time * 0.5 + i * 0.8) * 0.001;
                }
              });
            }

            // Eye blink
            updateBlink(dt);
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
              mats.forEach((mt: any) => { if (mt.map) mt.map.dispose(); mt.dispose(); });
            }
          });
          if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
          if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
          if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag);
          delete (window as any).__kawaiiPose;
        };
      }, undefined, (err) => {
        if (!cancelled) console.error('FBX error:', err);
      });
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
