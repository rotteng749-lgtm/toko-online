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
      renderer.toneMappingExposure = 2.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 2.5));
      const dl1 = new THREE.DirectionalLight(0xffffff, 3.5);
      dl1.position.set(4, 10, 8);
      scene.add(dl1);
      const dl2 = new THREE.DirectionalLight(0xffeef5, 2.0);
      dl2.position.set(-5, 8, 5);
      scene.add(dl2);
      const dl3 = new THREE.DirectionalLight(0xe8c0ff, 1.0);
      dl3.position.set(0, 4, -8);
      scene.add(dl3);
      const pl1 = new THREE.PointLight(0xffffff, 2.0, 40);
      pl1.position.set(0, 5, 10);
      scene.add(pl1);
      const pl2 = new THREE.PointLight(0xffe8f0, 0.8, 20);
      pl2.position.set(0, -1, 5);
      scene.add(pl2);

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
        const t = tl.load('/models/elaina/' + name);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }
      const texFace = loadTex('Face_Body_Base_Color.png');
      const texHair = loadTex('Hair_Base_Color.png');
      const texClothes = loadTex('Clothes.png');
      const texEye = loadTex('Eye.png');

      // ===== BUILD PROCEDURAL SKELETON =====
      // Bone positions based on model bounding box (will be adjusted after loading)
      const boneDefs = [
        { name: 'Root',        parent: null,           pos: [0, 0, 0] },
        { name: 'Hips',        parent: 'Root',         pos: [0, 4.0, 0] },
        { name: 'Spine',       parent: 'Hips',         pos: [0, 4.8, 0] },
        { name: 'Chest',       parent: 'Spine',        pos: [0, 5.5, 0] },
        { name: 'Neck',        parent: 'Chest',        pos: [0, 6.2, 0] },
        { name: 'Head',        parent: 'Neck',         pos: [0, 6.8, 0] },

        { name: 'ShoulderL',   parent: 'Chest',        pos: [-0.8, 6.0, 0] },
        { name: 'UpperArmL',   parent: 'ShoulderL',    pos: [-1.5, 5.8, 0] },
        { name: 'LowerArmL',   parent: 'UpperArmL',    pos: [-2.2, 5.0, 0] },
        { name: 'HandL',       parent: 'LowerArmL',    pos: [-2.6, 4.3, 0] },

        { name: 'ShoulderR',   parent: 'Chest',        pos: [0.8, 6.0, 0] },
        { name: 'UpperArmR',   parent: 'ShoulderR',    pos: [1.5, 5.8, 0] },
        { name: 'LowerArmR',   parent: 'UpperArmR',    pos: [2.2, 5.0, 0] },
        { name: 'HandR',       parent: 'LowerArmR',    pos: [2.6, 4.3, 0] },

        { name: 'UpperLegL',   parent: 'Hips',         pos: [-0.6, 3.2, 0] },
        { name: 'LowerLegL',   parent: 'UpperLegL',    pos: [-0.6, 1.8, 0] },
        { name: 'FootL',       parent: 'LowerLegL',    pos: [-0.6, 0.4, 0] },

        { name: 'UpperLegR',   parent: 'Hips',         pos: [0.6, 3.2, 0] },
        { name: 'LowerLegR',   parent: 'UpperLegR',    pos: [0.6, 1.8, 0] },
        { name: 'FootR',       parent: 'LowerLegR',    pos: [0.6, 0.4, 0] },
      ];

      function buildSkeleton(boneDefs: any[]) {
        const bones: any[] = [];
        const boneMap: Record<string, any> = {};

        // Create all bones
        for (const def of boneDefs) {
          const bone = new THREE.Bone();
          bone.name = def.name;
          bone.position.set(def.pos[0], def.pos[1], def.pos[2]);
          bones.push(bone);
          boneMap[def.name] = bone;
        }

        // Build hierarchy
        for (const def of boneDefs) {
          if (def.parent && boneMap[def.parent]) {
            boneMap[def.parent].add(boneMap[def.name]);
          }
        }

        return { bones, boneMap };
      }

      // ===== AUTO-SKINNING =====
      // Assign vertex weights based on proximity to bones
      function autoSkinMesh(geometry: any, skeleton: any, boneMap: Record<string, any>) {
        const positions = geometry.attributes.position;
        const count = positions.count;
        const boneCount = skeleton.bones.length;

        // Create skinIndex and skinWeight attributes
        const skinIndices = new Float32Array(count * 4);
        const skinWeights = new Float32Array(count * 4);

        for (let i = 0; i < count; i++) {
          const vertex = new THREE.Vector3(
            positions.getX(i),
            positions.getY(i),
            positions.getZ(i)
          );

          // Find 4 closest bones
          const distances: { idx: number; dist: number }[] = [];
          for (let b = 0; b < boneCount; b++) {
            const boneWorld = new THREE.Vector3();
            skeleton.bones[b].getWorldPosition(boneWorld);
            const dist = vertex.distanceTo(boneWorld);
            distances.push({ idx: b, dist });
          }

          // Sort by distance
          distances.sort((a, b) => a.dist - b.dist);

          // Take top 4
          const top4 = distances.slice(0, 4);
          const totalDist = top4.reduce((s, d) => s + 1 / (d.dist + 0.001), 0);

          for (let j = 0; j < 4; j++) {
            const weight = (1 / (top4[j].dist + 0.001)) / totalDist;
            skinIndices[i * 4 + j] = top4[j].idx;
            skinWeights[i * 4 + j] = weight;
          }
        }

        geometry.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(skinIndices.map(v => Math.round(v))), 4));
        geometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeights, 4));
      }

      // ===== LOAD FBX + RIG =====
      const loader = new FBXLoader();
      let model: any = null;
      let skeleton: any = null;
      let boneMap: Record<string, any> = {};

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

        // Build skeleton
        const skelData = buildSkeleton(boneDefs);
        skeleton = skelData.bones;
        boneMap = skelData.boneMap;

        // Create Skeleton for skinning
        const skeletonObj = new THREE.Skeleton(skelData.bones);

        // Apply textures + convert to SkinnedMesh
        fbx.traverse((child: any) => {
          if (!child.isMesh) return;

          const meshName = (child.name || '').toLowerCase();
          const geo = child.geometry;

          // Auto-skin this geometry
          autoSkinMesh(geo, skeletonObj, boneMap);

          // Create SkinnedMesh
          const srcMats = Array.isArray(child.material) ? child.material : [child.material];
          const newMats: any[] = [];

          srcMats.forEach((m: any) => {
            const matName = (m.name || '').toLowerCase();

            if (matName.includes('outline')) {
              newMats.push(new THREE.MeshBasicMaterial({
                color: 0x2a1040, transparent: true, opacity: 0.45,
                side: THREE.BackSide, depthWrite: false,
              }));
              return;
            }

            let tex = texFace;
            if (meshName.includes('hair')) tex = texHair;
            else if (meshName.includes('cloth')) tex = texClothes;
            else if (matName.includes('eye')) tex = texEye;

            newMats.push(new THREE.MeshBasicMaterial({
              map: tex, color: 0xffffff, side: THREE.DoubleSide,
            }));
          });

          // Replace mesh with SkinnedMesh
          const skinMesh = new THREE.SkinnedMesh(geo, newMats.length === 1 ? newMats[0] : newMats);
          skinMesh.name = child.name;
          skinMesh.add(skelData.bones[0]); // Root bone
          skinMesh.bind(skeletonObj);
          skinMesh.castShadow = true;

          // Replace in parent
          if (child.parent) {
            child.parent.add(skinMesh);
            child.parent.remove(child);
          }
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

      // ===== ANIMATE BONES =====
      let time = 0;
      let baseY = 0;
      let baseSet = false;

      function animate() {
        animFrameId = requestAnimationFrame(animate);
        time += 0.016;

        if (model && skeleton) {
          if (!baseSet) { baseY = model.position.y; baseSet = true; }

          // Body follows mouse
          model.rotation.y += (mouseX * 0.3 - model.rotation.y) * 0.04;

          // Breathing float
          model.position.y = baseY + Math.sin(time * 1.2) * 0.08;

          // Gentle sway
          model.rotation.x = Math.sin(time * 0.5) * 0.012;
          model.rotation.z = Math.sin(time * 0.7) * 0.006;

          // Head tracking
          const head = boneMap['Head'];
          if (head) {
            head.rotation.y += (mouseX * 0.5 - head.rotation.y) * 0.06;
            head.rotation.x += (mouseY * -0.3 - head.rotation.x) * 0.06;
          }

          // Neck subtle follow
          const neck = boneMap['Neck'];
          if (neck) {
            neck.rotation.y += (mouseX * 0.2 - neck.rotation.y) * 0.04;
          }

          // Spine breathing
          const spine = boneMap['Spine'];
          if (spine) {
            spine.rotation.x = Math.sin(time * 1.2) * 0.03;
          }
          const chest = boneMap['Chest'];
          if (chest) {
            chest.rotation.x = Math.sin(time * 1.2 + 0.3) * 0.02;
            chest.rotation.z = Math.sin(time * 0.8) * 0.01;
          }

          // Arm sway
          const upperArmL = boneMap['UpperArmL'];
          const lowerArmL = boneMap['LowerArmL'];
          const upperArmR = boneMap['UpperArmR'];
          const lowerArmR = boneMap['LowerArmR'];

          if (upperArmL) {
            upperArmL.rotation.z = -0.15 + Math.sin(time * 0.6) * 0.05;
            upperArmL.rotation.x = Math.sin(time * 0.4 + 0.5) * 0.04;
          }
          if (lowerArmL) {
            lowerArmL.rotation.z = -0.1 + Math.sin(time * 0.7 + 0.3) * 0.04;
          }
          if (upperArmR) {
            upperArmR.rotation.z = 0.15 + Math.sin(time * 0.6 + Math.PI) * 0.05;
            upperArmR.rotation.x = Math.sin(time * 0.4 + 2.5) * 0.04;
          }
          if (lowerArmR) {
            lowerArmR.rotation.z = 0.1 + Math.sin(time * 0.7 + 3.3) * 0.04;
          }

          // Shoulder subtle
          const shoulderL = boneMap['ShoulderL'];
          const shoulderR = boneMap['ShoulderR'];
          if (shoulderL) shoulderL.rotation.z = Math.sin(time * 0.5) * 0.02;
          if (shoulderR) shoulderR.rotation.z = Math.sin(time * 0.5 + Math.PI) * 0.02;

          // Hip sway
          const hips = boneMap['Hips'];
          if (hips) {
            hips.rotation.z = Math.sin(time * 0.4) * 0.015;
          }

          // Leg subtle
          const upperLegL = boneMap['UpperLegL'];
          const upperLegR = boneMap['UpperLegR'];
          if (upperLegL) upperLegL.rotation.x = Math.sin(time * 0.3) * 0.02;
          if (upperLegR) upperLegR.rotation.x = Math.sin(time * 0.3 + Math.PI) * 0.02;
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
