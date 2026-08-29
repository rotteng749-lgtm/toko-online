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

      // Load FBX
      const loader = new FBXLoader();
      let model: any = null;
      let boneMap: Record<string, any> = {};
      let hasSkeleton = false;
      let eyeMeshes: any[] = [];
      let baseBoneRotations: Record<string, any> = {};

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

        // Find skeleton
        fbx.traverse((child: any) => {
          if (child.skeleton) {
            hasSkeleton = true;
            console.log('=== SKELETON FOUND ===', child.skeleton.bones.length, 'bones');
            child.skeleton.bones.forEach((b: any) => {
              boneMap[b.name] = b;
            });
          }
        });

        console.log('=== ALL BONE NAMES ===', Object.keys(boneMap).filter(k => !k.includes('end')));

        // ===== HIDE HAT/BROOCH =====
        fbx.traverse((child: any) => {
          const n = (child.name || '').toLowerCase();
          if (n.includes('brooch') || n.includes('broom') || n.includes('hat_') || n.includes('witch hat')) {
            child.visible = false;
          }
        });
        const broochBone = boneMap['Brooch'];
        if (broochBone) {
          broochBone.visible = false;
          broochBone.traverse((c: any) => { c.visible = false; });
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

            if (matName.includes('eye')) {
              eyeMeshes.push(child);
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
            else if (meshName.includes('body') || matName.includes('body')) tex = texBody;

            return new THREE.MeshBasicMaterial({
              map: tex, color: 0xffffff, side: THREE.DoubleSide,
            });
          });
        });

        // ===== LOG INITIAL BONE ROTATIONS =====
        const importantBones = ['Head', 'Neck', 'Spine', 'Chest', 'Upper_Arm_L', 'Upper_Arm_R', 'Lower_Arm_L', 'Lower_Arm_R', 'Shoulder_L', 'Shoulder_R', 'Wrist_L', 'Wrist_R', 'Hips'];
        console.log('=== INITIAL BONE ROTATIONS ===');
        importantBones.forEach(name => {
          const bone = boneMap[name];
          if (bone) {
            console.log(`  ${name}: euler(${bone.rotation.x.toFixed(2)}, ${bone.rotation.y.toFixed(2)}, ${bone.rotation.z.toFixed(2)})`);
          } else {
            console.log(`  ${name}: NOT FOUND`);
          }
        });

        // ===== SET KAWAII POSE DIRECTLY =====
        function setBoneRot(name: string, rx: number, ry: number, rz: number) {
          const bone = boneMap[name];
          if (!bone) {
            console.warn(`Bone ${name} not found!`);
            return;
          }
          bone.rotation.set(rx, ry, rz);
          console.log(`Set ${name}: euler(${rx.toFixed(2)}, ${ry.toFixed(2)}, ${rz.toFixed(2)})`);
        }

        // Head: tilt right + slight look up
        setBoneRot('Head', -0.05, 0, 0.2);

        // Neck: slight tilt
        setBoneRot('Neck', 0, 0, 0.05);

        // Spine/Chest: slight lean for cute pose
        setBoneRot('Spine', -0.08, 0.02, 0.05);
        setBoneRot('Chest', -0.04, 0, 0.03);

        // Left arm: raised UP (waving/peace)
        setBoneRot('Shoulder_L', -0.4, -0.3, -0.4);
        setBoneRot('Upper_Arm_L', -0.6, 0, -1.5);  // arm up high
        setBoneRot('Lower_Arm_L', 0.3, 0, -0.8);   // bent elbow

        // Right arm: slightly raised (cute)
        setBoneRot('Shoulder_R', -0.3, 0.3, 0.3);
        setBoneRot('Upper_Arm_R', -0.3, 0, 0.5);   // arm slightly up
        setBoneRot('Lower_Arm_R', 0.2, 0, 0.4);    // bent elbow

        // Left hand fingers — peace sign attempt
        setBoneRot('Index_L_1', -1.0, 0, 0);   // straight
        setBoneRot('Index_L_2', -0.3, 0, 0);
        setBoneRot('Middle_L_1', 0.6, 0, 0);    // curled
        setBoneRot('Middle_L_2', 0.5, 0, 0);
        setBoneRot('Ring_L_1', 0.6, 0, 0);
        setBoneRot('Ring_L_2', 0.5, 0, 0);
        setBoneRot('Little_L_1', 0.6, 0, 0);
        setBoneRot('Little_L_2', 0.5, 0, 0);

        // Right hand: relaxed
        setBoneRot('Thumb_R_1', 0.2, 0.3, 0.4);
        setBoneRot('Index_R_1', 0.3, 0, 0);
        setBoneRot('Middle_R_1', 0.4, 0, 0);

        // ===== SAVE BASE ROTATIONS (after kawaii pose) =====
        for (const [name, bone] of Object.entries(boneMap)) {
          baseBoneRotations[name] = bone.rotation.clone();
        }

        console.log('=== KAWAII POSE SET ===');
        console.log('Base rotations saved for', Object.keys(baseBoneRotations).length, 'bones');

        scene.add(fbx);
        if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);

        // Mouse
        let mouseX = 0, mouseY = 0;
        const onMouseMove = (e: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        };
        container.addEventListener('mousemove', onMouseMove);

        // ===== EYE BLINK =====
        let blinkTimer = 0;
        let nextBlinkAt = 2 + Math.random() * 3;
        let blinkPhase = -1; // -1 = not blinking

        function updateBlink(dt: number) {
          blinkTimer += dt;
          if (blinkPhase < 0 && blinkTimer >= nextBlinkAt) {
            blinkPhase = 0;
            blinkTimer = 0;
          }
          if (blinkPhase >= 0) {
            blinkPhase += dt * 10; // fast blink
            if (blinkPhase >= 4) {
              blinkPhase = -1;
              blinkTimer = 0;
              nextBlinkAt = 2 + Math.random() * 3;
              eyeMeshes.forEach(m => { m.scale.y = 1; });
            } else {
              let sy = 1;
              if (blinkPhase < 1) sy = 1 - blinkPhase;
              else if (blinkPhase < 2) sy = 0.02;
              else if (blinkPhase < 3) sy = blinkPhase - 2;
              else sy = 1 - (blinkPhase - 3);
              eyeMeshes.forEach(m => { m.scale.y = Math.max(0.02, sy); });
            }
          }
        }

        // ===== ANIMATION =====
        let time = 0;
        let lastTime = performance.now();
        let baseY = fbx.position.y;

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

            // Gentle body sway
            model.rotation.x = Math.sin(time * 0.5) * 0.012;
            model.rotation.z = Math.sin(time * 0.7) * 0.006;

            if (hasSkeleton) {
              // ===== RESET TO BASE + ADD ANIMATION DELTAS =====

              // Head: base pose + mouse tracking + tilt wobble
              const head = boneMap['Head'];
              if (head && baseBoneRotations['Head']) {
                head.rotation.copy(baseBoneRotations['Head']);
                head.rotation.y += mouseX * 0.4;   // look left/right
                head.rotation.x += mouseY * -0.2;  // look up/down
                head.rotation.z += Math.sin(time * 0.8) * 0.04; // wobble
              }

              // Neck: subtle follow
              const neck = boneMap['Neck'];
              if (neck && baseBoneRotations['Neck']) {
                neck.rotation.copy(baseBoneRotations['Neck']);
                neck.rotation.y += mouseX * 0.15;
              }

              // Left arm: wave animation on top of kawaii pose
              const upperArmL = boneMap['Upper_Arm_L'];
              if (upperArmL && baseBoneRotations['Upper_Arm_L']) {
                upperArmL.rotation.copy(baseBoneRotations['Upper_Arm_L']);
                upperArmL.rotation.z += Math.sin(time * 0.6) * 0.15; // wave
                upperArmL.rotation.x += Math.sin(time * 0.4) * 0.08;
              }

              const lowerArmL = boneMap['Lower_Arm_L'];
              if (lowerArmL && baseBoneRotations['Lower_Arm_L']) {
                lowerArmL.rotation.copy(baseBoneRotations['Lower_Arm_L']);
                lowerArmL.rotation.z += Math.sin(time * 0.6 + 0.5) * 0.1;
              }

              // Right arm: gentle sway
              const upperArmR = boneMap['Upper_Arm_R'];
              if (upperArmR && baseBoneRotations['Upper_Arm_R']) {
                upperArmR.rotation.copy(baseBoneRotations['Upper_Arm_R']);
                upperArmR.rotation.z += Math.sin(time * 0.5 + Math.PI) * 0.08;
              }

              // Spine/Chest breathing
              const spine = boneMap['Spine'];
              if (spine && baseBoneRotations['Spine']) {
                spine.rotation.copy(baseBoneRotations['Spine']);
                spine.rotation.x += Math.sin(time * 1.2) * 0.02;
              }
              const chest = boneMap['Chest'];
              if (chest && baseBoneRotations['Chest']) {
                chest.rotation.copy(baseBoneRotations['Chest']);
                chest.rotation.z += Math.sin(time * 0.8) * 0.01;
              }

              // Hair sway
              ['HairBack_01', 'HairBack_02', 'HairBack_03', 'HairFront_01', 'HairFront_02'].forEach((bname, i) => {
                const bone = boneMap[bname];
                if (bone && baseBoneRotations[bname]) {
                  bone.rotation.copy(baseBoneRotations[bname]);
                  bone.rotation.x += Math.sin(time * 0.8 + i * 0.5) * 0.04;
                  bone.rotation.z += Math.sin(time * 0.6 + i * 0.3) * 0.03;
                }
              });

              // Coat/Skirt sway
              ['Coat_L_Front', 'Coat_R_Front', 'Skirt_L_Front', 'Skirt_R_Front'].forEach((bname, i) => {
                const bone = boneMap[bname];
                if (bone && baseBoneRotations[bname]) {
                  bone.rotation.copy(baseBoneRotations[bname]);
                  bone.rotation.z += Math.sin(time * 0.5 + i * 0.8) * 0.04;
                }
              });
            }

            // Eye blink
            updateBlink(dt);
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
              mats.forEach((mt: any) => { if (mt.map) mt.map.dispose(); mt.dispose(); });
            }
          });
          if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
          if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
          if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag);
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
