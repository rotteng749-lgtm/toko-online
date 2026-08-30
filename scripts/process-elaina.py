#!/usr/bin/env python3
"""
Blender headless script v2:
- Import VRChat Elaina FBX
- Connect textures to materials properly
- Remove hat/broom
- Set kawaii pose (more aggressive)
- Export as GLB
"""
import bpy
import math
import os

FBX_PATH = os.path.expanduser("~/project/web/toko-online/public/models/elaina-vr/Elaina sk.fbx")
OUTPUT_PATH = os.path.expanduser("~/project/web/toko-online/public/models/elaina.glb")
TEX_DIR = os.path.expanduser("~/project/web/toko-online/public/models/elaina-vr")

# === CLEAN SCENE ===
bpy.ops.wm.read_factory_settings(use_empty=True)

# === IMPORT FBX ===
print("=== IMPORTING FBX ===")
bpy.ops.import_scene.fbx(filepath=FBX_PATH, automatic_bone_orientation=True)

# === REMOVE HAT + BROOM ===
print("=== REMOVING HAT/BROOM ===")
for obj in list(bpy.data.objects):
    n = obj.name.lower()
    if any(k in n for k in ['hat', 'broom', 'wand']):
        print(f"  Removing: {obj.name}")
        bpy.data.objects.remove(obj, do_unlink=True)
for m in list(bpy.data.meshes):
    if any(k in m.name.lower() for k in ['hat', 'broom', 'wand']):
        bpy.data.meshes.remove(m)

# === FIND TEXTURE FILES ===
tex_files = {}
for f in os.listdir(TEX_DIR):
    if f.lower().endswith(('.png', '.jpg', '.jpeg')):
        tex_files[f.lower().replace('.png','').replace('.jpg','')] = os.path.join(TEX_DIR, f)
print(f"Textures found: {list(tex_files.keys())}")

# === CONNECT TEXTURES TO MATERIALS ===
print("=== CONNECTING TEXTURES ===")

# Map material name → texture file key (all lowercase)
mat_tex_map = {
    'body': 'body',
    'face': 'face',
    'hair': 'hair',
    'dress': 'dress',
    'coat': 'coat',
    'brooch': 'brooch_3',
    'broom': 'broom',
}

for mat in bpy.data.materials:
    mat_lower = mat.name.lower()
    
    # Skip outline materials
    if 'outline' in mat_lower:
        print(f"  Skipping outline: {mat.name}")
        continue
    
    if not mat.use_nodes:
        mat.use_nodes = True
    
    tree = mat.node_tree
    nodes = tree.nodes
    links = tree.links
    
    # Find Principled BSDF
    bsdf = None
    for node in nodes:
        if node.type == 'BSDF_PRINCIPLED':
            bsdf = node
            break
    
    if not bsdf:
        print(f"  No BSDF found for {mat.name}")
        continue
    
    # Check if already has texture node
    has_tex = any(n.type == 'TEX_IMAGE' for n in nodes)
    if has_tex:
        print(f"  {mat.name}: already has texture node")
        continue
    
    # Find matching texture
    tex_path = None
    for pattern, tex_key in mat_tex_map.items():
        if pattern in mat_lower:
            if tex_key in tex_files:
                tex_path = tex_files[tex_key]
            break
    
    if not tex_path:
        print(f"  {mat.name}: no matching texture, using default color")
        continue
    
    print(f"  {mat.name} → {os.path.basename(tex_path)}")
    
    # Create Image Texture node
    tex_node = nodes.new('ShaderNodeTexImage')
    tex_node.location = (-600, 0)
    try:
        img = bpy.data.images.load(tex_path)
        img.colorspace_settings.name = 'sRGB'
        tex_node.image = img
    except Exception as e:
        print(f"    ERROR loading texture: {e}")
        continue
    
    # Connect to Base Color
    links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
    print(f"    Connected!")

# === SET KAWAII POSE ===
print("=== SETTING KAWAII POSE ===")

armature_obj = None
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        armature_obj = obj
        break

if armature_obj:
    bpy.context.view_layer.objects.active = armature_obj
    armature_obj.select_set(True)
    bpy.ops.object.mode_set(mode='POSE')
    
    bones = armature_obj.pose.bones
    
    def set_bone(bone_name, rx=0, ry=0, rz=0):
        if bone_name in bones:
            b = bones[bone_name]
            b.rotation_mode = 'XYZ'
            b.rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
            print(f"  {bone_name}: ({rx}°, {ry}°, {rz}°)")
        else:
            print(f"  WARNING: {bone_name} not found!")
    
    # === HEAD: tilt right + look up slightly ===
    set_bone('Head', rx=-8, ry=0, rz=15)     # Tilt right more
    set_bone('Neck', rx=-3, ry=0, rz=5)
    
    # === BODY: cute lean ===
    set_bone('Spine', rx=-5, ry=0, rz=3)
    set_bone('Chest', rx=-3, ry=0, rz=2)
    
    # === LEFT ARM: raised high (peace/wave) ===
    set_bone('Shoulder_L', rx=-20, ry=-15, rz=-20)  # Shoulder up
    set_bone('Upper_Arm_L', rx=-30, ry=0, rz=-80)   # Arm UP high
    set_bone('Lower_Arm_L', rx=15, ry=0, rz=-40)    # Bent elbow
    set_bone('Wrist_L', rx=0, ry=0, rz=-15)
    
    # Left fingers - PEACE SIGN
    set_bone('Index_L_1', rx=-60, ry=0, rz=0)    # Index STRAIGHT UP
    set_bone('Index_L_2', rx=-30, ry=0, rz=0)
    set_bone('Index_L_3', rx=-10, ry=0, rz=0)
    set_bone('Middle_L_1', rx=40, ry=0, rz=0)    # Middle CURLED
    set_bone('Middle_L_2', rx=30, ry=0, rz=0)
    set_bone('Ring_L_1', rx=45, ry=0, rz=0)      # Ring CURLED
    set_bone('Ring_L_2', rx=35, ry=0, rz=0)
    set_bone('Little_L_1', rx=50, ry=0, rz=0)    # Pinky CURLED
    set_bone('Little_L_2', rx=40, ry=0, rz=0)
    set_bone('Thumb_L_1', rx=0, ry=20, rz=25)    # Thumb OUT
    
    # === RIGHT ARM: relaxed at hip ===
    set_bone('Shoulder_R', rx=-8, ry=10, rz=15)
    set_bone('Upper_Arm_R', rx=8, ry=0, rz=25)    # Slightly out
    set_bone('Lower_Arm_R', rx=20, ry=0, rz=15)   # Bent at elbow
    set_bone('Wrist_R', rx=0, ry=0, rz=8)
    
    # Right fingers - relaxed
    set_bone('Index_R_1', rx=5, ry=0, rz=0)
    set_bone('Middle_R_1', rx=10, ry=0, rz=0)
    set_bone('Ring_R_1', rx=12, ry=0, rz=0)
    set_bone('Little_R_1', rx=15, ry=0, rz=0)
    
    # === HIPS: subtle ===
    set_bone('Hips', rx=0, ry=0, rz=2)
    
    bpy.ops.object.mode_set(mode='OBJECT')
else:
    print("ERROR: No armature found!")

# === EXPORT GLB ===
print(f"=== EXPORTING GLB ===")
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=OUTPUT_PATH,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_texcoords=True,
    export_normals=True,
    export_materials='EXPORT',
    export_colors=True,
)

if os.path.exists(OUTPUT_PATH):
    size = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"✅ DONE: {OUTPUT_PATH} ({size:.1f} MB)")
else:
    print("❌ Export failed!")
