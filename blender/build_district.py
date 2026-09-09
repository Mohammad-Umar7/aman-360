"""
AMAN 360 — Digital twin district generator (Blender 4.2+ / 5.x)

Builds a small, believable UAE-style urban district used by the AMAN 360
flash-flood demo, including the animated underpass flood, and exports it
as a glTF binary for the web digital twin (React Three Fiber).

Coordinate system (shared with the web engine, src/lib/data/district.ts):
    X = east, Y = north, Z = up, 1 unit = 1 metre (schematic scale).
    The glTF exporter converts to Y-up for three.js.

Run inside Blender:
    exec(compile(open(r"<path>/build_district.py").read(), "build_district.py", "exec"))
"""

import bpy
import math
from mathutils import Vector, Euler

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def srgb_to_linear(c):
    return tuple((v / 12.92) if v <= 0.04045 else (((v + 0.055) / 1.055) ** 2.4) for v in c)


def hexc(h):
    h = h.lstrip('#')
    return srgb_to_linear(tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)))


MATS = {}


def mat(name, color, rough=0.65, metal=0.0, emit=None, emit_strength=0.0, alpha=1.0, spec=0.5):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    if bsdf is None:
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        out = nt.nodes.get('Material Output') or nt.nodes.new('ShaderNodeOutputMaterial')
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    col = hexc(color) if isinstance(color, str) else color
    bsdf.inputs['Base Color'].default_value = (*col, 1.0)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = spec
    if emit is not None:
        ecol = hexc(emit) if isinstance(emit, str) else emit
        bsdf.inputs['Emission Color'].default_value = (*ecol, 1.0)
        bsdf.inputs['Emission Strength'].default_value = emit_strength
    bsdf.inputs['Alpha'].default_value = alpha
    if alpha < 1.0:
        if hasattr(m, 'surface_render_method'):
            m.surface_render_method = 'BLENDED'
        elif hasattr(m, 'blend_method'):
            m.blend_method = 'BLEND'
        if hasattr(m, 'use_backface_culling'):
            m.use_backface_culling = False
    m.diffuse_color = (*col, alpha)
    MATS[name] = m
    return m


class MB:
    """Accumulates primitive parts into one mesh object with per-face materials."""

    def __init__(self):
        self.v = []
        self.f = []
        self.fm = []
        self.fs = []
        self.mats = []

    def _mi(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)

    def _add(self, verts, faces, m, smooth=False):
        base = len(self.v)
        self.v.extend(verts)
        mi = self._mi(m)
        for fc in faces:
            self.f.append(tuple(base + i for i in fc))
            self.fm.append(mi)
            self.fs.append(smooth)

    def box(self, cx, cy, z0, sx, sy, sz, m, yaw=0.0, pitch=0.0, roll=0.0):
        hx, hy = sx / 2.0, sy / 2.0
        local = [(-hx, -hy, 0), (hx, -hy, 0), (hx, hy, 0), (-hx, hy, 0),
                 (-hx, -hy, sz), (hx, -hy, sz), (hx, hy, sz), (-hx, hy, sz)]
        if yaw or pitch or roll:
            rot = Euler((roll, pitch, yaw), 'XYZ').to_matrix()
            local = [tuple(rot @ Vector(p)) for p in local]
        verts = [(cx + p[0], cy + p[1], z0 + p[2]) for p in local]
        faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        self._add(verts, faces, m)

    def boxc(self, cx, cy, cz, sx, sy, sz, m, yaw=0.0, pitch=0.0, roll=0.0):
        """Box positioned by its centre (rotation about the centre)."""
        hx, hy, hz = sx / 2.0, sy / 2.0, sz / 2.0
        local = [(-hx, -hy, -hz), (hx, -hy, -hz), (hx, hy, -hz), (-hx, hy, -hz),
                 (-hx, -hy, hz), (hx, -hy, hz), (hx, hy, hz), (-hx, hy, hz)]
        if yaw or pitch or roll:
            rot = Euler((roll, pitch, yaw), 'XYZ').to_matrix()
            local = [tuple(rot @ Vector(p)) for p in local]
        verts = [(cx + p[0], cy + p[1], cz + p[2]) for p in local]
        faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        self._add(verts, faces, m)

    def cyl(self, cx, cy, z0, rb, rt, h, m, segs=16, axis='z', caps=True, smooth=True):
        n = segs
        ring_b = [(rb * math.cos(2 * math.pi * i / n), rb * math.sin(2 * math.pi * i / n), 0.0) for i in range(n)]
        ring_t = [(rt * math.cos(2 * math.pi * i / n), rt * math.sin(2 * math.pi * i / n), h) for i in range(n)]
        local = ring_b + ring_t
        if axis == 'y':
            rot = Euler((math.pi / 2, 0, 0), 'XYZ').to_matrix()
            local = [tuple(rot @ Vector(p)) for p in local]
        elif axis == 'x':
            rot = Euler((0, math.pi / 2, 0), 'XYZ').to_matrix()
            local = [tuple(rot @ Vector(p)) for p in local]
        verts = [(cx + p[0], cy + p[1], z0 + p[2]) for p in local]
        faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
        self._add(verts, faces, m, smooth=smooth)
        if caps:
            self._add(verts[n:], [tuple(range(n))], m)
            self._add(verts[:n], [tuple(reversed(range(n)))], m)

    def hemisphere(self, cx, cy, cz, r, m, segs=20, rings=8):
        verts = []
        faces = []
        for j in range(rings + 1):
            phi = (math.pi / 2) * (j / rings)
            zz = r * math.sin(phi)
            rr = r * math.cos(phi)
            for i in range(segs):
                th = 2 * math.pi * i / segs
                verts.append((cx + rr * math.cos(th), cy + rr * math.sin(th), cz + zz))
        for j in range(rings):
            for i in range(segs):
                a = j * segs + i
                b = j * segs + (i + 1) % segs
                c = (j + 1) * segs + (i + 1) % segs
                d = (j + 1) * segs + i
                faces.append((a, b, c, d))
        self._add(verts, faces, m, smooth=True)

    def quad(self, p0, p1, p2, p3, m):
        self._add([p0, p1, p2, p3], [(0, 1, 2, 3)], m)

    def build(self, name, coll, location=(0, 0, 0)):
        me = bpy.data.meshes.new(name)
        me.from_pydata(self.v, [], self.f)
        me.update()
        for m in self.mats:
            me.materials.append(m)
        if self.fm:
            me.polygons.foreach_set('material_index', self.fm)
            me.polygons.foreach_set('use_smooth', self.fs)
        me.update()
        ob = bpy.data.objects.new(name, me)
        ob.location = location
        coll.objects.link(ob)
        return ob


def get_coll(name):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
    return c


def clear_scene():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.actions, bpy.data.images):
        for d in list(block):
            if d.users == 0:
                try:
                    block.remove(d)
                except Exception:
                    pass
    MATS.clear()


# --------------------------------------------------------------------------
# District definition (mirrors src/lib/data/district.ts)
# --------------------------------------------------------------------------

EXTENT = 150
ROAD_W_MAIN = 16
ROAD_W_SEC = 14
ROAD_W_CROSS = 12
ROAD_Z = 0.06
SIDEWALK_W = 3.2
SIDEWALK_H = 0.18

# Al Majaz Road underpass (sunken section with retaining walls)
DIP_DEPTH = 2.2
DIP_START, DIP_FLAT_A, DIP_FLAT_B, DIP_END = -48.0, -32.0, 42.0, 58.0


def dip(x):
    if x <= DIP_START or x >= DIP_END:
        return 0.0
    if x < DIP_FLAT_A:
        t = (x - DIP_START) / (DIP_FLAT_A - DIP_START)
    elif x > DIP_FLAT_B:
        t = (DIP_END - x) / (DIP_END - DIP_FLAT_B)
    else:
        return -DIP_DEPTH
    s = t * t * (3 - 2 * t)
    return -DIP_DEPTH * s


# --------------------------------------------------------------------------
# Materials
# --------------------------------------------------------------------------

def make_materials():
    mat('Ground_Sand', '#D9CBB0', rough=0.95)
    mat('Plaza', '#CFC6B6', rough=0.9)
    mat('Asphalt', '#3A3D42', rough=0.92)
    mat('Asphalt_Wet', '#2B2E33', rough=0.35)
    mat('Concrete', '#B9B4A8', rough=0.85)
    mat('Curb', '#D8D3C8', rough=0.8)
    mat('Marking_White', '#E8E6DF', rough=0.7)
    mat('Marking_Yellow', '#D9B24A', rough=0.7)
    mat('Facade_Sand', '#D8C7A6', rough=0.8)
    mat('Facade_Cream', '#E9E1CF', rough=0.8)
    mat('Facade_White', '#F1EEE6', rough=0.75)
    mat('Facade_Terracotta', '#C9A484', rough=0.8)
    mat('Ledge', '#EFE9DB', rough=0.7)
    mat('Glass_Dark', '#1E2A3A', rough=0.12, metal=0.2, spec=0.8)
    mat('Glass_Blue', '#3E6E8E', rough=0.1, metal=0.3, spec=0.9)
    mat('Glass_Teal', '#2F6F73', rough=0.1, metal=0.3, spec=0.9)
    mat('Mullion', '#5A6470', rough=0.4, metal=0.6)
    mat('Roof', '#9C9486', rough=0.9)
    mat('Roof_Dark', '#4E5259', rough=0.9)
    mat('Dome', '#3F8F8C', rough=0.35, metal=0.2)
    mat('Gold', '#C9A24E', rough=0.35, metal=0.8)
    mat('Hospital_White', '#F4F4F1', rough=0.7)
    mat('Hospital_Red', '#C8322B', rough=0.5)
    mat('Metal_Grey', '#7C8288', rough=0.4, metal=0.7)
    mat('Lamp', '#FFF1C8', emit='#FFE7A8', emit_strength=6.0, rough=0.3)
    mat('Palm_Trunk', '#8A6A48', rough=0.9)
    mat('Palm_Leaf', '#4F8A4B', rough=0.8)
    mat('Grass', '#7FA35A', rough=0.9)
    mat('Car_Red', '#B23A3A', rough=0.3, metal=0.4)
    mat('Car_White', '#EDEDEA', rough=0.3, metal=0.3)
    mat('Car_Silver', '#B8BCC2', rough=0.3, metal=0.6)
    mat('Car_Navy', '#213A5C', rough=0.3, metal=0.4)
    mat('Car_Black', '#1F2124', rough=0.3, metal=0.4)
    mat('Car_Teal', '#2D7D8E', rough=0.3, metal=0.4)
    mat('Tyre', '#141517', rough=0.9)
    mat('Headlight', '#FFFFFF', emit='#FFF6D8', emit_strength=4.0)
    mat('Taillight', '#FF3B30', emit='#FF3B30', emit_strength=3.0)
    mat('Light_Red', '#FF2D2D', emit='#FF2D2D', emit_strength=8.0)
    mat('Light_Blue', '#2D7BFF', emit='#2D7BFF', emit_strength=8.0)
    mat('Stripe_Green', '#0E7C4A', rough=0.5)
    mat('Barrier_Red', '#D42B2B', rough=0.6)
    mat('Barrier_White', '#F2F2F0', rough=0.6)
    mat('Sign_Blue', '#1C4E9C', rough=0.6)
    mat('Screen', '#0B1220', emit='#0B1220', emit_strength=1.0, rough=0.3)
    mat('Water', '#2F5256', rough=0.06, metal=0.0, alpha=0.9, spec=1.0)
    mat('Water_Murky', '#2B4340', rough=0.05, alpha=0.95, spec=1.0)
    mat('Bench', '#6B4F3A', rough=0.8)
    mat('Helipad', '#5B6068', rough=0.9)


# --------------------------------------------------------------------------
# Ground, roads, sidewalks
# --------------------------------------------------------------------------

def build_ground(coll):
    mb = MB()
    e = EXTENT
    mb.quad((-e, -e, 0), (e, -e, 0), (e, e, 0), (-e, e, 0), MATS['Ground_Sand'])
    mb.build('Ground', coll)


def road_box(mb, cx, cy, sx, sy, m):
    mb.box(cx, cy, 0.0, sx, sy, ROAD_Z, m)


def build_roads(coll):
    e = EXTENT
    # --- Al Majaz Road (E-W, y=0) as a strip with the sunken underpass
    mb = MB()
    step = 2.0
    xs = [-e + i * step for i in range(int(2 * e / step) + 1)]
    hw = ROAD_W_MAIN / 2.0
    verts = []
    for x in xs:
        z = ROAD_Z + dip(x)
        verts.append((x, -hw, z))
        verts.append((x, hw, z))
    faces = []
    for i in range(len(xs) - 1):
        a = 2 * i
        faces.append((a, a + 2, a + 3, a + 1))
    mb._add(verts, faces, MATS['Asphalt'])
    mb.build('Road_AlMajaz', coll)

    # retaining walls of the underpass
    wb = MB()
    wall_top = ROAD_Z + 0.02
    for i in range(len(xs) - 1):
        x0, x1 = xs[i], xs[i + 1]
        z0, z1 = ROAD_Z + dip(x0), ROAD_Z + dip(x1)
        if z0 > ROAD_Z - 0.001 and z1 > ROAD_Z - 0.001:
            continue
        # south wall (y=-hw), outward normal -y
        wb.quad((x0, -hw, z0), (x1, -hw, z1), (x1, -hw, wall_top), (x0, -hw, wall_top), MATS['Concrete'])
        # north wall (y=+hw), outward normal +y
        wb.quad((x1, hw, z1), (x0, hw, z0), (x0, hw, wall_top), (x1, hw, wall_top), MATS['Concrete'])
    # wall coping
    for sy in (-1, 1):
        wb.box((DIP_START + DIP_END) / 2, sy * (hw + 0.35), ROAD_Z, DIP_END - DIP_START, 0.7, 0.9, MATS['Concrete'])
    wb.build('Underpass_Walls', coll)

    # --- flat roads
    rb = MB()
    road_box(rb, 0, 64, 2 * e, ROAD_W_SEC, MATS['Asphalt'])      # King Faisal Street
    road_box(rb, 0, -64, 2 * e, ROAD_W_SEC, MATS['Asphalt'])     # Corniche Street
    road_box(rb, -72, 0, ROAD_W_CROSS, 2 * e, MATS['Asphalt'])   # Al Wahda Street
    road_box(rb, 72, 0, ROAD_W_CROSS, 2 * e, MATS['Asphalt'])    # Al Arouba Street
    road_box(rb, 0, 128, 2 * e, 10, MATS['Asphalt'])             # northern service road
    road_box(rb, 0, -128, 2 * e, 10, MATS['Asphalt'])            # southern service road
    rb.build('Roads', coll)

    # --- markings
    mk = MB()
    dash, gap = 3.0, 3.0
    # Al Majaz centre dashes follow the dip
    x = -e + 2
    while x < e - 2:
        z = ROAD_Z + dip(x + dash / 2) + 0.004
        mk.box(x + dash / 2, 0, z, dash, 0.18, 0.006, MATS['Marking_White'])
        x += dash + gap
    for yy in (64, -64):
        x = -e + 2
        while x < e - 2:
            mk.box(x + dash / 2, yy, ROAD_Z + 0.004, dash, 0.18, 0.006, MATS['Marking_White'])
            x += dash + gap
    for xx in (-72, 72):
        y = -e + 2
        while y < e - 2:
            mk.box(xx, y + dash / 2, ROAD_Z + 0.004, 0.18, dash, 0.006, MATS['Marking_White'])
            y += dash + gap
    # edge lines
    for yy in (-hw + 0.4, hw - 0.4):
        x = -e
        while x < e:
            z = ROAD_Z + dip(x + 1) + 0.004
            mk.box(x + 1, yy, z, 2.0, 0.15, 0.006, MATS['Marking_Yellow'])
            x += 2.0
    mk.build('Markings', coll)


def build_sidewalks(coll):
    e = EXTENT
    sb = MB()
    m = MATS['Curb']
    w = SIDEWALK_W
    # along Al Majaz (skip the underpass span where walls exist? keep at street level: walkway continues)
    hw = ROAD_W_MAIN / 2
    for sy in (-1, 1):
        sb.box(0, sy * (hw + w / 2), 0, 2 * e, w, SIDEWALK_H, m)
    hs = ROAD_W_SEC / 2
    for yy in (64, -64):
        for sy in (-1, 1):
            sb.box(0, yy + sy * (hs + w / 2), 0, 2 * e, w, SIDEWALK_H, m)
    hc = ROAD_W_CROSS / 2
    for xx in (-72, 72):
        for sx in (-1, 1):
            sb.box(xx + sx * (hc + w / 2), 0, 0, w, 2 * e, SIDEWALK_H, m)
    sb.build('Sidewalks', coll)

    # green verges / plazas in a few blocks
    gb = MB()
    g = MATS['Grass']
    gb.box(-105, -105, 0, 60, 34, 0.12, g)
    gb.box(105, 105, 0, 60, 34, 0.12, g)
    gb.box(0, -100, 0, 40, 26, 0.12, g)
    gb.build('Greens', coll)

    # pedestrian bridge over the underpass
    pb = MB()
    c = MATS['Concrete']
    pb.box(6, 0, 6.0, 4.0, 2 * (hw + w) + 2, 0.5, c)
    for sy in (-1, 1):
        pb.box(6, sy * (hw + w + 0.5), 0, 4.0, 1.0, 6.0, c)
        pb.box(6, sy * (hw + 0.2), 6.5, 4.0, 0.12, 1.1, MATS['Metal_Grey'])
    pb.build('Pedestrian_Bridge', coll)


# --------------------------------------------------------------------------
# Buildings
# --------------------------------------------------------------------------

FLOOR_H = 3.3


def building(name, coll, cx, cy, w, d, floors, style='sand', arcade=False, mashrabiya=False, tank=True):
    mb = MB()
    z0 = SIDEWALK_H
    facade = {'sand': 'Facade_Sand', 'cream': 'Facade_Cream', 'white': 'Facade_White',
              'terracotta': 'Facade_Terracotta', 'glass': 'Glass_Blue', 'hospital': 'Hospital_White'}[style]
    glass = {'sand': 'Glass_Dark', 'cream': 'Glass_Teal', 'white': 'Glass_Teal', 'terracotta': 'Glass_Dark',
             'glass': 'Glass_Blue', 'hospital': 'Glass_Teal'}[style]
    fm, gm = MATS[facade], MATS[glass]
    h = floors * FLOOR_H
    # plinth
    mb.box(cx, cy, z0, w + 3, d + 3, 0.25, MATS['Plaza'])
    zb = z0 + 0.25
    mb.box(cx, cy, zb, w, d, h, fm)

    if style == 'glass':
        # curtain wall: vertical mullions and horizontal bands
        for sx in (-1, 1):
            x = cx + sx * (w / 2 + 0.03)
            mb.box(x, cy, zb, 0.06, d - 0.4, h, gm)
            n = int(d / 2.5)
            for i in range(n + 1):
                mb.box(x + sx * 0.05, cy - d / 2 + 0.2 + i * (d - 0.4) / n, zb, 0.12, 0.12, h, MATS['Mullion'])
        for sy in (-1, 1):
            y = cy + sy * (d / 2 + 0.03)
            mb.box(cx, y, zb, w - 0.4, 0.06, h, gm)
            n = int(w / 2.5)
            for i in range(n + 1):
                mb.box(cx - w / 2 + 0.2 + i * (w - 0.4) / n, y + sy * 0.05, zb, 0.12, 0.12, h, MATS['Mullion'])
        for f in range(1, floors):
            z = zb + f * FLOOR_H
            mb.box(cx, cy, z - 0.2, w + 0.16, d + 0.16, 0.4, MATS['Mullion'])
    else:
        ww, wh = 1.5, 1.7
        for f in range(floors):
            zf = zb + f * FLOOR_H + 0.9
            if f == 0 and arcade:
                zf = zb + 0.3
                wh0 = 2.6
            else:
                wh0 = wh
            # x-facing facades (front/back along y)
            nx = max(2, int(w / 3.4))
            for i in range(nx):
                x = cx - w / 2 + (i + 0.5) * (w / nx)
                for sy in (-1, 1):
                    y = cy + sy * (d / 2 + 0.03)
                    mb.box(x, y, zf, ww, 0.07, wh0, gm)
                    if f == 0 and arcade:
                        mb.cyl(x, y, zf + wh0, ww / 2, ww / 2, 0.07, gm, segs=10, axis='y', caps=True, smooth=True)
            ny = max(2, int(d / 3.4))
            for i in range(ny):
                y = cy - d / 2 + (i + 0.5) * (d / ny)
                for sx in (-1, 1):
                    x = cx + sx * (w / 2 + 0.03)
                    mb.box(x, y, zf, 0.07, ww, wh0, gm)
                    if f == 0 and arcade:
                        mb.cyl(x, y, zf + wh0, ww / 2, ww / 2, 0.07, gm, segs=10, axis='x', caps=True, smooth=True)
            # floor ledge
            if f > 0:
                mb.box(cx, cy, zb + f * FLOOR_H - 0.12, w + 0.5, d + 0.5, 0.24, MATS['Ledge'])
        if arcade:
            # ground floor colonnade
            n = max(3, int(w / 4.0))
            for i in range(n + 1):
                x = cx - w / 2 + i * (w / n)
                for sy in (-1, 1):
                    mb.box(x, cy + sy * (d / 2 + 1.4), zb, 0.5, 0.5, FLOOR_H, MATS['Ledge'])
            for sy in (-1, 1):
                mb.box(cx, cy + sy * (d / 2 + 1.4), zb + FLOOR_H, w + 0.5, 3.0, 0.35, MATS['Ledge'])
        if mashrabiya:
            # decorative lattice screen on the south facade, floors 2..top-1
            y = cy - d / 2 - 0.25
            zs = zb + FLOOR_H * 1
            hs = FLOOR_H * max(1, floors - 2)
            cols = int(w / 0.9)
            for i in range(cols + 1):
                x = cx - w / 2 + 0.3 + i * ((w - 0.6) / cols)
                mb.box(x, y, zs, 0.08, 0.08, hs, MATS['Ledge'])
            rows = int(hs / 0.9)
            for j in range(rows + 1):
                mb.box(cx, y, zs + j * (hs / rows), w - 0.6, 0.08, 0.08, MATS['Ledge'])
    # parapet
    zt = zb + h
    pw = 0.35
    mb.box(cx, cy - d / 2 + pw / 2, zt, w, pw, 1.0, fm)
    mb.box(cx, cy + d / 2 - pw / 2, zt, w, pw, 1.0, fm)
    mb.box(cx - w / 2 + pw / 2, cy, zt, pw, d, 1.0, fm)
    mb.box(cx + w / 2 - pw / 2, cy, zt, pw, d, 1.0, fm)
    mb.box(cx, cy, zt - 0.02, w - 0.6, d - 0.6, 0.06, MATS['Roof'])
    # rooftop equipment
    mb.box(cx - w / 4, cy + d / 5, zt, w / 5, d / 4, 2.4, MATS['Roof_Dark'])
    if tank:
        mb.cyl(cx + w / 4, cy - d / 5, zt, 1.4, 1.4, 2.2, MATS['Metal_Grey'], segs=14)
    return mb.build(name, coll)


def hospital(name, coll, cx, cy):
    mb = MB()
    z0 = SIDEWALK_H
    wm, rm, gm = MATS['Hospital_White'], MATS['Hospital_Red'], MATS['Glass_Teal']
    w, d, floors = 40, 26, 5
    mb.box(cx, cy, z0, w + 8, d + 8, 0.25, MATS['Plaza'])
    zb = z0 + 0.25
    h = floors * FLOOR_H
    mb.box(cx, cy, zb, w, d, h, wm)
    # ribbon windows
    for f in range(floors):
        zf = zb + f * FLOOR_H + 1.0
        for sy in (-1, 1):
            mb.box(cx, cy + sy * (d / 2 + 0.03), zf, w - 2, 0.07, 1.6, gm)
        for sx in (-1, 1):
            mb.box(cx + sx * (w / 2 + 0.03), cy, zf, 0.07, d - 2, 1.6, gm)
        if f > 0:
            mb.box(cx, cy, zb + f * FLOOR_H - 0.12, w + 0.4, d + 0.4, 0.24, MATS['Ledge'])
    # entrance canopy + ambulance bay facing Al Arouba Street (west side)
    mb.box(cx - w / 2 - 5, cy - 4, zb + 4.2, 10, 12, 0.5, wm)
    for yy in (cy - 9, cy + 1):
        mb.box(cx - w / 2 - 9.5, yy, zb, 0.5, 0.5, 4.2, MATS['Metal_Grey'])
    # red crescent emblem + red band
    mb.box(cx, cy - d / 2 - 0.1, zb + h - 2.4, w, 0.12, 0.6, rm)
    mb.cyl(cx - w / 2 - 0.2, cy - 4, zb + h - 6.0, 2.2, 2.2, 0.25, rm, segs=24, axis='x')
    mb.cyl(cx - w / 2 - 0.25, cy - 3.3, zb + h - 5.4, 1.7, 1.7, 0.3, wm, segs=24, axis='x')
    # parapet and helipad
    zt = zb + h
    for sy in (-1, 1):
        mb.box(cx, cy + sy * (d / 2 - 0.2), zt, w, 0.4, 1.0, wm)
    for sx in (-1, 1):
        mb.box(cx + sx * (w / 2 - 0.2), cy, zt, 0.4, d, 1.0, wm)
    mb.box(cx, cy, zt - 0.02, w - 0.8, d - 0.8, 0.06, MATS['Roof'])
    mb.cyl(cx + 8, cy, zt, 7.5, 7.5, 0.12, MATS['Helipad'], segs=32)
    mb.cyl(cx + 8, cy, zt + 0.12, 6.5, 6.5, 0.02, MATS['Marking_White'], segs=32)
    mb.cyl(cx + 8, cy, zt + 0.14, 5.9, 5.9, 0.02, MATS['Helipad'], segs=32)
    mb.box(cx + 8 - 2.0, cy, zt + 0.16, 0.6, 5.0, 0.02, MATS['Marking_White'])
    mb.box(cx + 8 + 2.0, cy, zt + 0.16, 0.6, 5.0, 0.02, MATS['Marking_White'])
    mb.box(cx + 8, cy, zt + 0.16, 3.4, 0.6, 0.02, MATS['Marking_White'])
    mb.box(cx - 12, cy + 6, zt, 6, 5, 2.6, MATS['Roof_Dark'])
    return mb.build(name, coll)


def mosque(name, coll, cx, cy):
    mb = MB()
    z0 = SIDEWALK_H
    wm = MATS['Facade_White']
    w, d, h = 30, 24, 8
    mb.box(cx, cy, z0, w + 6, d + 6, 0.25, MATS['Plaza'])
    zb = z0 + 0.25
    mb.box(cx, cy, zb, w, d, h, wm)
    # arched windows
    for i in range(6):
        x = cx - w / 2 + (i + 0.5) * (w / 6)
        for sy in (-1, 1):
            y = cy + sy * (d / 2 + 0.03)
            mb.box(x, y, zb + 1.2, 1.6, 0.07, 3.0, MATS['Glass_Teal'])
            mb.cyl(x, y, zb + 4.2, 0.8, 0.8, 0.07, MATS['Glass_Teal'], segs=12, axis='y')
    for i in range(4):
        y = cy - d / 2 + (i + 0.5) * (d / 4)
        for sx in (-1, 1):
            x = cx + sx * (w / 2 + 0.03)
            mb.box(x, y, zb + 1.2, 0.07, 1.6, 3.0, MATS['Glass_Teal'])
            mb.cyl(x, y, zb + 4.2, 0.8, 0.8, 0.07, MATS['Glass_Teal'], segs=12, axis='x')
    # parapet + dome drum + dome
    zt = zb + h
    for sy in (-1, 1):
        mb.box(cx, cy + sy * (d / 2 - 0.2), zt, w, 0.4, 0.9, wm)
    for sx in (-1, 1):
        mb.box(cx + sx * (w / 2 - 0.2), cy, zt, 0.4, d, 0.9, wm)
    mb.cyl(cx, cy, zt, 7.5, 7.5, 2.0, wm, segs=24)
    mb.hemisphere(cx, cy, zt + 2.0, 7.5, MATS['Dome'])
    mb.cyl(cx, cy, zt + 9.4, 0.25, 0.25, 2.0, MATS['Gold'], segs=8)
    # minaret
    mx, my = cx + w / 2 + 4, cy - d / 2 - 2
    mb.cyl(mx, my, z0, 2.2, 1.8, 26, wm, segs=16)
    mb.cyl(mx, my, z0 + 18, 2.6, 2.6, 0.6, MATS['Ledge'], segs=16)
    mb.cyl(mx, my, z0 + 26, 1.9, 1.5, 3.0, wm, segs=16)
    mb.hemisphere(mx, my, z0 + 29, 1.6, MATS['Dome'])
    mb.cyl(mx, my, z0 + 30.5, 0.15, 0.15, 1.6, MATS['Gold'], segs=8)
    return mb.build(name, coll)


# --------------------------------------------------------------------------
# Street furniture and vegetation
# --------------------------------------------------------------------------

def streetlights(coll):
    mb = MB()
    pm, lm = MATS['Metal_Grey'], MATS['Lamp']
    e = EXTENT

    def lamp(x, y, toward):  # toward: direction vector to the road (dx, dy)
        mb.cyl(x, y, SIDEWALK_H, 0.18, 0.12, 9.0, pm, segs=8)
        dx, dy = toward
        mb.box(x + dx * 1.2, y + dy * 1.2, SIDEWALK_H + 8.7, 2.6 if dx else 0.16, 2.6 if dy else 0.16, 0.16, pm)
        mb.box(x + dx * 2.3, y + dy * 2.3, SIDEWALK_H + 8.4, 0.9, 0.5, 0.3, lm)

    hw = ROAD_W_MAIN / 2 + SIDEWALK_W - 0.6
    x = -e + 12
    while x < e - 8:
        lamp(x, -hw, (0, 1))
        lamp(x + 12, hw, (0, -1))
        x += 24
    hs = ROAD_W_SEC / 2 + SIDEWALK_W - 0.6
    for yy in (64, -64):
        x = -e + 12
        while x < e - 8:
            lamp(x, yy - hs, (0, 1))
            lamp(x + 12, yy + hs, (0, -1))
            x += 24
    hc = ROAD_W_CROSS / 2 + SIDEWALK_W - 0.6
    for xx in (-72, 72):
        y = -e + 12
        while y < e - 8:
            if abs(y) < 8 or abs(abs(y) - 64) < 8:
                y += 24
                continue
            lamp(xx - hc, y, (1, 0))
            lamp(xx + hc, y + 12, (-1, 0))
            y += 24
    mb.build('Streetlights', coll)


def palms(coll):
    mb = MB()
    tm, lm = MATS['Palm_Trunk'], MATS['Palm_Leaf']
    import random
    rnd = random.Random(7)

    def palm(x, y, h=None):
        h = h or rnd.uniform(6.0, 9.0)
        mb.cyl(x, y, SIDEWALK_H, 0.42, 0.28, h, tm, segs=8)
        for i in range(9):
            yaw = i * (2 * math.pi / 9) + rnd.uniform(-0.2, 0.2)
            pitch = math.radians(-28 + rnd.uniform(-8, 8))
            L = 3.6
            ox, oy = math.cos(yaw) * L / 2, math.sin(yaw) * L / 2
            mb.boxc(x + ox * 0.9, y + oy * 0.9, SIDEWALK_H + h + 0.2, L, 0.9, 0.08, lm, yaw=yaw, pitch=-pitch)
        mb.box(x, y, SIDEWALK_H + h - 0.2, 0.7, 0.7, 0.7, tm)

    e = EXTENT
    hw = ROAD_W_MAIN / 2 + SIDEWALK_W + 1.6
    x = -e + 20
    while x < e - 10:
        if not (-56 < x < 66):
            palm(x, -hw)
            palm(x + 8, hw)
        x += 22
    hs = ROAD_W_SEC / 2 + SIDEWALK_W + 1.6
    for yy in (64, -64):
        x = -e + 6
        while x < e - 10:
            if abs(x - 72) > 12 and abs(x + 72) > 12:
                palm(x, yy - hs)
                palm(x + 10, yy + hs)
            x += 22
    # park clusters
    for (px, py) in [(-118, -100), (-96, -112), (-84, -96), (112, 112), (96, 98), (124, 100), (-10, -104), (12, -96)]:
        palm(px, py, rnd.uniform(7, 10))
    mb.build('Palms', coll)


def props(coll):
    # bus stop near the underpass approach (Layla's location)
    mb = MB()
    pm = MATS['Metal_Grey']
    bx, by = -40, -13.5
    mb.box(bx, by, SIDEWALK_H + 2.6, 5.0, 2.0, 0.15, MATS['Sign_Blue'])
    for dx in (-2.2, 2.2):
        mb.box(bx + dx, by + 0.8, SIDEWALK_H, 0.12, 0.12, 2.6, pm)
    mb.box(bx, by + 0.9, SIDEWALK_H, 5.0, 0.06, 2.6, MATS['Glass_Dark'])
    mb.box(bx, by + 0.4, SIDEWALK_H + 0.45, 3.2, 0.5, 0.08, MATS['Bench'])
    mb.build('BusStop', coll)

    # variable message sign (digital signage) on the western approach, facing eastbound traffic
    sb = MB()
    sx, sy = -104, -12.5
    sb.cyl(sx, sy, SIDEWALK_H, 0.3, 0.3, 6.5, pm, segs=10)
    sb.cyl(sx, sy + 3.0, SIDEWALK_H, 0.3, 0.3, 6.5, pm, segs=10)
    sb.box(sx, sy + 1.5, SIDEWALK_H + 6.5, 0.9, 3.4, 0.4, pm)
    sb.box(sx, sy + 1.5, SIDEWALK_H + 6.9, 0.6, 7.0, 3.0, MATS['Metal_Grey'])
    sb.build('VMS_Frame', coll)
    scr = MB()
    scr.box(sx - 0.34, sy + 1.5, SIDEWALK_H + 7.15, 0.04, 6.4, 2.5, MATS['Screen'])
    scr.build('VMS_Screen', coll)

    # road closure barriers (hidden by default; toggled by the digital twin)
    for name, xx in (('Barrier_W', DIP_START - 6), ('Barrier_E', DIP_END + 6)):
        b = MB()
        for i, yy in enumerate((-5.4, -1.8, 1.8, 5.4)):
            m = MATS['Barrier_Red'] if i % 2 == 0 else MATS['Barrier_White']
            b.box(xx, yy, ROAD_Z, 0.5, 3.4, 1.1, m)
            b.box(xx, yy, ROAD_Z + 1.1, 0.4, 3.4, 0.08, MATS['Barrier_White'])
        b.box(xx, 0, ROAD_Z + 1.2, 0.3, 4.0, 0.9, MATS['Sign_Blue'])
        ob = b.build(name, coll)
        ob.hide_render = True
        ob.hide_viewport = True

    # parked cars along Al Majaz sidewalks (outside the underpass)
    cars = MB()
    import random
    rnd = random.Random(11)
    cols = ['Car_White', 'Car_Silver', 'Car_Navy', 'Car_Black', 'Car_Teal', 'Car_White']
    for i, x in enumerate(range(-134, -60, 9)):
        car_parts(cars, x, -6.2, 0.0, MATS[cols[i % len(cols)]])
    for i, x in enumerate(range(72, 138, 9)):
        car_parts(cars, x, 6.2, math.pi, MATS[cols[(i + 2) % len(cols)]])
    for i, y in enumerate(range(-140, -80, 9)):
        car_parts(cars, -72 - 4.6, y, math.pi / 2, MATS[cols[(i + 1) % len(cols)]])
    for i, y in enumerate(range(80, 140, 9)):
        car_parts(cars, 72 + 4.6, y, -math.pi / 2, MATS[cols[(i + 3) % len(cols)]])
    cars.build('Parked_Cars', coll)


# --------------------------------------------------------------------------
# Vehicles
# --------------------------------------------------------------------------

def car_parts(mb, cx, cy, yaw, paint, z0=ROAD_Z):
    """Compact sedan, nose along +x before yaw."""
    def b(ox, oy, oz, sx, sy, sz, m):
        rx = cx + ox * math.cos(yaw) - oy * math.sin(yaw)
        ry = cy + ox * math.sin(yaw) + oy * math.cos(yaw)
        mb.boxc(rx, ry, z0 + oz, sx, sy, sz, m, yaw=yaw)
    b(0, 0, 0.62, 4.4, 1.85, 0.6, paint)
    b(-0.25, 0, 1.18, 2.4, 1.7, 0.55, paint)
    b(-0.25, 0, 1.2, 2.2, 1.78, 0.42, MATS['Glass_Dark'])
    b(2.15, 0.6, 0.62, 0.12, 0.4, 0.22, MATS['Headlight'])
    b(2.15, -0.6, 0.62, 0.12, 0.4, 0.22, MATS['Headlight'])
    b(-2.15, 0.6, 0.66, 0.12, 0.4, 0.18, MATS['Taillight'])
    b(-2.15, -0.6, 0.66, 0.12, 0.4, 0.18, MATS['Taillight'])
    for ox in (1.4, -1.4):
        for oy in (0.95, -0.95):
            rx = cx + ox * math.cos(yaw) - oy * math.sin(yaw)
            ry = cy + ox * math.sin(yaw) + oy * math.cos(yaw)
            wheel(mb, rx, ry, z0 + 0.34, yaw)


def wheel(mb, x, y, z, yaw, r=0.34, w=0.24):
    n = 12
    verts = []
    for k in (-w / 2, w / 2):
        for i in range(n):
            th = 2 * math.pi * i / n
            lx, ly, lz = r * math.cos(th), k, r * math.sin(th)
            rx = x + lx * math.cos(yaw) - ly * math.sin(yaw)
            ry = y + lx * math.sin(yaw) + ly * math.cos(yaw)
            verts.append((rx, ry, z + lz))
    faces = [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
    faces.append(tuple(reversed(range(n))))
    faces.append(tuple(range(n, 2 * n)))
    mb._add(verts, faces, MATS['Tyre'], smooth=True)


def make_car(name, coll, paint):
    mb = MB()
    car_parts(mb, 0, 0, 0.0, MATS[paint], z0=0.0)
    return mb.build(name, coll)


def make_ambulance(name, coll):
    mb = MB()
    wm, rm = MATS['Car_White'], MATS['Hospital_Red']
    mb.boxc(0, 0, 0.75, 5.8, 2.15, 0.9, wm)
    mb.boxc(-1.0, 0, 1.95, 3.6, 2.15, 1.5, wm)
    mb.boxc(1.6, 0, 1.75, 1.7, 2.05, 1.1, wm)
    mb.boxc(2.0, 0, 1.85, 0.9, 1.9, 0.8, MATS['Glass_Dark'])
    mb.boxc(0, 0, 1.15, 5.7, 2.2, 0.28, rm)
    mb.boxc(-1.0, 1.1, 2.1, 1.4, 0.06, 1.0, rm)
    mb.boxc(-1.0, -1.1, 2.1, 1.4, 0.06, 1.0, rm)
    mb.boxc(-0.6, 0, 2.78, 1.6, 1.4, 0.16, MATS['Metal_Grey'])
    mb.boxc(-0.6, 0.45, 2.92, 0.6, 0.45, 0.16, MATS['Light_Red'])
    mb.boxc(-0.6, -0.45, 2.92, 0.6, 0.45, 0.16, MATS['Light_Blue'])
    mb.boxc(2.92, 0.7, 0.75, 0.1, 0.45, 0.25, MATS['Headlight'])
    mb.boxc(2.92, -0.7, 0.75, 0.1, 0.45, 0.25, MATS['Headlight'])
    mb.boxc(-2.92, 0.8, 0.9, 0.1, 0.3, 0.6, MATS['Taillight'])
    mb.boxc(-2.92, -0.8, 0.9, 0.1, 0.3, 0.6, MATS['Taillight'])
    for ox in (1.9, -1.7):
        for oy in (1.05, -1.05):
            wheel(mb, ox, oy, 0.42, 0.0, r=0.42, w=0.3)
    return mb.build(name, coll)


def make_police(name, coll):
    mb = MB()
    car_parts(mb, 0, 0, 0.0, MATS['Car_White'], z0=0.0)
    mb.boxc(0, 0, 0.62, 4.5, 1.9, 0.14, MATS['Stripe_Green'])
    mb.boxc(-0.3, 0, 1.52, 1.1, 1.3, 0.12, MATS['Metal_Grey'])
    mb.boxc(-0.3, 0.35, 1.62, 0.5, 0.4, 0.12, MATS['Light_Red'])
    mb.boxc(-0.3, -0.35, 1.62, 0.5, 0.4, 0.12, MATS['Light_Blue'])
    return mb.build(name, coll)


# --------------------------------------------------------------------------
# Water (animated in Blender, scrubbed by the web twin)
# --------------------------------------------------------------------------

def build_water(coll):
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 150
    scene.render.fps = 30
    hw = ROAD_W_MAIN / 2 + 0.05
    mb = MB()
    mb.quad((DIP_START - 2, -hw, 0), (DIP_END + 2, -hw, 0), (DIP_END + 2, hw, 0), (DIP_START - 2, hw, 0), MATS['Water_Murky'])
    water = mb.build('Water_Underpass', coll)
    # keyframes: below floor (invisible) -> flooded to street level
    levels = [(1, ROAD_Z - DIP_DEPTH - 0.4), (25, ROAD_Z - DIP_DEPTH + 0.05), (60, ROAD_Z - 1.7), (100, ROAD_Z - 1.2), (135, ROAD_Z - 0.85), (150, ROAD_Z - 0.75)]
    try:
        bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
    except Exception:
        pass
    for fr, z in levels:
        water.location.z = z
        water.keyframe_insert(data_path='location', index=2, frame=fr)
    set_linear(water)

    # surface-water puddles spreading across the affected blocks
    puddles = [
        (-18, 12, 9, 5), (20, -12, 11, 6), (34, 14, 7, 4), (-34, -12, 8, 4.5),
        (-8, 18, 6, 3.5), (48, -18, 6, 3.5), (12, 40, 7, 4), (-24, -40, 8, 4.5),
    ]
    for i, (px, py, rx, ry) in enumerate(puddles):
        pm = MB()
        n = 24
        verts = [(rx * math.cos(2 * math.pi / n * k), ry * math.sin(2 * math.pi / n * k), 0.0) for k in range(n)]
        pm._add(verts, [tuple(range(n))], MATS['Water'])
        ob = pm.build(f'Puddle_{i + 1}', coll, location=(px, py, SIDEWALK_H + 0.02))
        ob.scale = (0.0, 0.0, 1.0)
        ob.keyframe_insert(data_path='scale', frame=1)
        ob.keyframe_insert(data_path='scale', frame=30 + i * 6)
        ob.scale = (1.0, 1.0, 1.0)
        ob.keyframe_insert(data_path='scale', frame=110 + i * 5)
        set_linear(ob)
    scene.frame_set(1)


def action_fcurves(action):
    """F-curves of an action across legacy (<4.4) and layered (5.x) action APIs."""
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


# --------------------------------------------------------------------------
# Lighting, cameras, render settings
# --------------------------------------------------------------------------

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
        cd.clip_end = 2000
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
    ]
    scene.camera = cams[0]

    r = scene.render
    r.engine = 'BLENDER_EEVEE'
    r.resolution_x = 1600
    r.resolution_y = 900
    r.resolution_percentage = 100
    r.film_transparent = False
    try:
        scene.eevee.taa_render_samples = 64
    except Exception:
        pass
    try:
        scene.view_settings.view_transform = 'AgX'
        scene.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

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
    streetlights(c_env)
    palms(c_env)
    props(c_env)

    # --- residential core around the underpass (inside the hazard polygon)
    building('Bldg_Fatima', c_bld, 16, 32, 22, 18, 9, 'sand', arcade=True, mashrabiya=True)
    building('Bldg_Yusuf', c_bld, -18, 32, 20, 18, 7, 'cream', arcade=True)
    building('Bldg_N3', c_bld, -50, 34, 14, 14, 5, 'white')
    building('Bldg_N4', c_bld, 50, 34, 16, 16, 6, 'terracotta')
    building('Bldg_Sara', c_bld, -18, -32, 22, 18, 6, 'white', arcade=True, mashrabiya=True)
    building('Bldg_S2', c_bld, 18, -34, 18, 18, 8, 'sand')
    building('Bldg_S3', c_bld, -50, -36, 14, 14, 4, 'cream')
    building('Bldg_S4', c_bld, 50, -36, 16, 16, 5, 'white')
    # --- north-west block and south-west (mosque)
    building('Bldg_NW1', c_bld, -112, 34, 22, 18, 6, 'cream', arcade=True)
    building('Bldg_NW2', c_bld, -112, 12, 16, 10, 3, 'sand')
    mosque('Mosque', c_bld, -110, -34)
    # --- north-east office block (Omar) and south-east hospital
    building('Bldg_Omar', c_bld, 112, 34, 26, 24, 14, 'glass')
    building('Bldg_NE2', c_bld, 88, 40, 12, 12, 4, 'white')
    hospital('Hospital', c_bld, 110, -34)
    # --- outer ring for skyline depth
    outer = [
        ('Bldg_O1', -120, 100, 24, 20, 8, 'sand'), ('Bldg_O2', -80, 98, 18, 16, 5, 'white'),
        ('Bldg_O3', -30, 100, 20, 18, 10, 'glass'), ('Bldg_O4', 30, 98, 22, 18, 7, 'cream'),
        ('Bldg_O5', 120, 96, 18, 18, 5, 'terracotta'), ('Bldg_O6', 120, -100, 20, 18, 6, 'sand'),
        ('Bldg_O7', 60, -100, 24, 20, 9, 'white'), ('Bldg_O8', -40, -100, 18, 16, 5, 'cream'),
        ('Bldg_O9', -128, 62, 14, 12, 4, 'white'), ('Bldg_O10', 128, 62, 14, 12, 4, 'sand'),
        ('Bldg_O11', -128, -62, 14, 12, 3, 'cream'), ('Bldg_O12', 128, -62, 14, 12, 3, 'white'),
        ('Bldg_O13', -100, 130, 20, 16, 6, 'sand'), ('Bldg_O14', 100, 132, 22, 16, 7, 'white'),
        ('Bldg_O15', 0, 132, 26, 16, 11, 'glass'), ('Bldg_O16', 0, -132, 26, 16, 6, 'sand'),
    ]
    for (n, x, y, w, d, f, s) in outer:
        building(n, c_bld, x, y, w, d, f, s, tank=(f > 4))

    # --- hero vehicles (positioned by the web twin; origin here)
    make_car('Car_Ahmed', c_veh, 'Car_Teal').location = (-128, -3.6, ROAD_Z)
    make_ambulance('Ambulance', c_veh).location = (92, -30, ROAD_Z)
    make_police('Police_Car', c_veh).location = (DIP_START - 12, 3.6, ROAD_Z)
    mb = MB()
    car_parts(mb, 0, 0, 0.0, MATS['Car_Silver'], z0=0.0)
    mb.build('Car_Traffic_1', c_veh).location = (110, 60, ROAD_Z)
    mb = MB()
    car_parts(mb, 0, 0, 0.0, MATS['Car_Navy'], z0=0.0)
    mb.build('Car_Traffic_2', c_veh).location = (-100, -67.5, ROAD_Z)

    build_water(c_wat)
    build_lighting_and_cameras(c_cam)


build_all()
print('AMAN 360 district built:', len(bpy.data.objects), 'objects')
