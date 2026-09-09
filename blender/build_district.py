"""
AMAN 360 — Digital twin district generator (v2, Blender 4.2+ / 5.x)

Builds an Abu Dhabi-style district for the flash-flood demo: glass towers on the
skyline, arcaded mid-rise residences with balconies, Emirati villas with wind
towers, a Grand-Mosque-style complex, a medical centre, a Corniche waterfront,
landscaped boulevards, vehicles and people — plus the animated underpass flood.

Coordinate system (shared with src/lib/data/district.ts):
    X = east, Y = north, Z = up, 1 unit = 1 metre (schematic scale).

Run inside Blender (Python console or Text Editor):
    exec(compile(open(r"<repo>/blender/build_district.py").read(), "build_district.py", "exec"))
"""

import bpy
import os
import math

HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else r"C:\Users\omerj\Desktop\aman-360\blender"
for _name in ('lib_mesh.py', 'gen_buildings.py', 'gen_streets.py'):
    with open(os.path.join(HERE, _name), encoding='utf-8') as _f:
        exec(compile(_f.read(), _name, 'exec'), globals())


# ----------------------------------------------------------------------------
# Water (animated in Blender, scrubbed by the web twin)
# ----------------------------------------------------------------------------

def action_fcurves(action):
    fcs = []
    try:
        if getattr(action, 'fcurves', None) is not None:
            fcs.extend(action.fcurves)
    except Exception:
        pass
    if not fcs and hasattr(action, 'layers'):
        for layer in action.layers:
            for strip in layer.strips:
                for cb in getattr(strip, 'channelbags', []):
                    fcs.extend(cb.fcurves)
    return fcs


def set_linear(ob):
    ad = ob.animation_data
    if not ad or not ad.action:
        return
    for fc in action_fcurves(ad.action):
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def build_water(coll):
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 150
    scene.render.fps = 30
    try:
        bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
    except Exception:
        pass
    hw = ROAD_W_MAIN / 2 + 0.05
    mb = MB()
    mb.quad((DIP_START - 2, -hw, 0), (DIP_END + 2, -hw, 0), (DIP_END + 2, hw, 0), (DIP_START - 2, hw, 0), MATS['Water_Murky'])
    water = mb.build('Water_Underpass', coll)
    levels = [(1, ROAD_Z - DIP_DEPTH - 0.4), (25, ROAD_Z - DIP_DEPTH + 0.05), (60, ROAD_Z - 1.7), (100, ROAD_Z - 1.2), (135, ROAD_Z - 0.85), (150, ROAD_Z - 0.75)]
    for fr, z in levels:
        water.location.z = z
        water.keyframe_insert(data_path='location', index=2, frame=fr)
    set_linear(water)
    puddles = [(-18, 12, 9, 5), (20, -12, 11, 6), (34, 14, 7, 4), (-34, -12, 8, 4.5), (-8, 18, 6, 3.5), (48, -18, 6, 3.5), (12, 44, 7, 4), (-24, -44, 8, 4.5)]
    for i, (px, py, rx, ry) in enumerate(puddles):
        pm = MB()
        n = 24
        verts = [(rx * math.cos(2 * math.pi / n * k), ry * math.sin(2 * math.pi / n * k), 0.0) for k in range(n)]
        pm.add(verts, [tuple(range(n))], MATS['Water'])
        ob = pm.build(f'Puddle_{i + 1}', coll, location=(px, py, SIDEWALK_H + 0.02))
        ob.scale = (0.0, 0.0, 1.0)
        ob.keyframe_insert(data_path='scale', frame=1)
        ob.keyframe_insert(data_path='scale', frame=30 + i * 6)
        ob.scale = (1.0, 1.0, 1.0)
        ob.keyframe_insert(data_path='scale', frame=110 + i * 5)
        set_linear(ob)
    scene.frame_set(1)


# ----------------------------------------------------------------------------
# Lighting, cameras, render settings
# ----------------------------------------------------------------------------

def build_lighting_and_cameras(coll):
    scene = bpy.context.scene
    sun_data = bpy.data.lights.new('Sun', 'SUN')
    sun_data.energy = 3.5
    sun_data.color = (1.0, 0.94, 0.86)
    sun_data.angle = math.radians(2.5)
    sun = bpy.data.objects.new('Sun', sun_data)
    sun.rotation_euler = (math.radians(52), math.radians(12), math.radians(-38))
    coll.objects.link(sun)
    world = scene.world or bpy.data.worlds.new('World')
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.62, 0.74, 0.92, 1.0)
        bg.inputs['Strength'].default_value = 0.9

    def cam(name, loc, target, lens=35):
        cd = bpy.data.cameras.new(name)
        cd.lens = lens
        cd.clip_end = 3000
        c = bpy.data.objects.new(name, cd)
        c.location = loc
        direction = Vector(target) - Vector(loc)
        c.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        coll.objects.link(c)
        return c

    cams = [
        cam('Cam_Overview', (-150, -200, 92), (10, 5, 6), 42),
        cam('Cam_Underpass', (-98, -24, 20), (12, 0, -2), 40),
        cam('Cam_Residence', (-52, -78, 34), (-4, 12, 12), 40),
        cam('Cam_Hospital', (52, -108, 42), (104, -30, 10), 40),
        cam('Cam_Bridge', (44, -19, 9), (-24, 2, -1), 35),
        cam('Cam_Corniche', (-90, -140, 26), (10, -60, 14), 38),
        cam('Cam_Skyline', (120, -80, 60), (-10, 90, 50), 38),
    ]
    scene.camera = cams[0]
    r = scene.render
    r.engine = 'BLENDER_EEVEE'
    r.resolution_x = 1600
    r.resolution_y = 900
    r.resolution_percentage = 100
    try:
        scene.eevee.taa_render_samples = 64
    except Exception:
        pass
    try:
        scene.view_settings.view_transform = 'AgX'
        scene.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass


# ----------------------------------------------------------------------------
# Layout
# ----------------------------------------------------------------------------

def build_all():
    clear_scene()
    make_materials()
    c_env = get_coll('District')
    c_bld = get_coll('Buildings')
    c_veh = get_coll('Vehicles')
    c_wat = get_coll('Water')
    c_cam = get_coll('Cameras_Lights')

    build_ground(c_env)
    build_roads(c_env)
    build_sidewalks(c_env)
    build_vegetation(c_env)
    build_props(c_env)
    build_people(c_env)

    # --- residential core around the underpass (inside the hazard polygon)
    residential_v2('Bldg_Fatima', c_bld, 16, 32, 22, 18, 9, 'cream', arcade=('-y',), balconies=('-y', '+y'))
    residential_v2('Bldg_Yusuf', c_bld, -18, 32, 20, 18, 7, 'white', arcade=('-y',), balconies=('-y', '+y'))
    residential_v2('Bldg_N3', c_bld, -50, 34, 14, 14, 5, 'sand', arcade=(), balconies=('-y',))
    residential_v2('Bldg_N4', c_bld, 50, 34, 16, 16, 6, 'terracotta', arcade=('-y',), balconies=('-y',))
    residential_v2('Bldg_Sara', c_bld, -18, -32, 22, 18, 6, 'white', arcade=('+y',), balconies=('+y', '-y'))
    residential_v2('Bldg_S2', c_bld, 18, -34, 18, 18, 8, 'stone', arcade=('+y',), balconies=('+y', '-y'))
    community_hall('Bldg_S3', c_bld, -50, -36)
    residential_v2('Bldg_S4', c_bld, 50, -36, 16, 16, 5, 'cream', arcade=('+y',), balconies=('+y',))
    # --- villas (north-west block) and mosque complex (south-west)
    vb = MB()
    villa(vb, -126, 33, palette='cream', pool=False)
    villa(vb, -98, 33, palette='white', pool=True)
    vb.build('Bldg_NW1', c_bld)
    mosque_v2('Mosque', c_bld, -110, -32.5)
    # --- north-east: business tower (Omar), clinic, retail; south-east: medical centre
    tower_curved('Bldg_Omar', c_bld, 112, 34, 12, 10, 24, twist=18, glass='Glass_Blue', podium=True)
    residential_v2('Bldg_NE2', c_bld, 86, 22, 12, 12, 4, 'white', arcade=('-x',), balconies=())
    retail_centre('Bldg_NW2', c_bld, 139, 22, w=16, d=12)
    hospital_v2('Hospital', c_bld, 110, -34)
    # --- skyline cluster north of King Faisal Street
    tower_curved('Tower_N1', c_bld, -100, 112, 12, 9, 34, twist=35, glass='Glass_Blue')
    tower_slab('Tower_N2', c_bld, -46, 108, 24, 20, 26, glass='Glass_Sky')
    tower_curved('Tower_N3', c_bld, 2, 116, 15, 15, 42, twist=0, glass='Glass_Teal', helipad=True)
    tower_slab('Tower_N4', c_bld, 44, 106, 26, 20, 22, glass='Glass_Blue')
    tower_curved('Tower_N5', c_bld, 104, 112, 10, 8, 30, twist=-30, glass='Glass_Gold')
    residential_v2('Bldg_O1', c_bld, -136, 100, 16, 16, 8, 'sand', arcade=(), balconies=('-y',))
    residential_v2('Bldg_O2', c_bld, 136, 100, 16, 16, 10, 'white', arcade=(), balconies=('-y',))
    residential_v2('Bldg_O3', c_bld, -24, 84, 14, 12, 5, 'cream', arcade=(), balconies=('-y',))
    residential_v2('Bldg_O4', c_bld, 28, 84, 14, 12, 6, 'stone', arcade=(), balconies=('-y',))
    residential_v2('Bldg_E1', c_bld, 138, 34, 14, 14, 8, 'cream', arcade=(), balconies=('-x',))
    residential_v2('Bldg_E2', c_bld, 138, -34, 14, 14, 6, 'sand', arcade=(), balconies=('-x',))

    build_vehicles(c_veh)
    build_life(c_veh, c_env)
    build_water(c_wat)
    build_lighting_and_cameras(c_cam)


build_all()
_tris = sum(sum(max(0, len(p.vertices) - 2) for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('AMAN 360 district v2 built:', len(bpy.data.objects), 'objects,', _tris, 'triangles')
