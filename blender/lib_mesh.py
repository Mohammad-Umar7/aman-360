"""AMAN 360 district generator — mesh builder, facade frames and materials (v2)."""

import bpy
import math
import random
from mathutils import Vector, Euler, Matrix


def srgb_to_linear(c):
    return tuple((v / 12.92) if v <= 0.04045 else (((v + 0.055) / 1.055) ** 2.4) for v in c)


def hexc(h):
    h = h.lstrip('#')
    return srgb_to_linear(tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)))


MATS = {}


def mat(name, color, rough=0.65, metal=0.0, emit=None, emit_strength=0.0, alpha=1.0, spec=0.5):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
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
    m.diffuse_color = (*col, alpha)
    MATS[name] = m
    return m


class MB:
    """Accumulates primitives into one mesh with per-face materials and smoothing."""

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

    def add(self, verts, faces, m, smooth=False):
        base = len(self.v)
        self.v.extend(verts)
        mi = self._mi(m)
        for fc in faces:
            self.f.append(tuple(base + i for i in fc))
            self.fm.append(mi)
            self.fs.append(smooth)

    # ---- boxes -----------------------------------------------------------
    BOX_FACES = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]

    def box(self, cx, cy, z0, sx, sy, sz, m, yaw=0.0, pitch=0.0, roll=0.0):
        hx, hy = sx / 2.0, sy / 2.0
        local = [(-hx, -hy, 0), (hx, -hy, 0), (hx, hy, 0), (-hx, hy, 0), (-hx, -hy, sz), (hx, -hy, sz), (hx, hy, sz), (-hx, hy, sz)]
        if yaw or pitch or roll:
            rot = Euler((roll, pitch, yaw), 'XYZ').to_matrix()
            local = [tuple(rot @ Vector(p)) for p in local]
        self.add([(cx + p[0], cy + p[1], z0 + p[2]) for p in local], self.BOX_FACES, m)

    def boxc(self, cx, cy, cz, sx, sy, sz, m, yaw=0.0, pitch=0.0, roll=0.0):
        hx, hy, hz = sx / 2.0, sy / 2.0, sz / 2.0
        local = [(-hx, -hy, -hz), (hx, -hy, -hz), (hx, hy, -hz), (-hx, hy, -hz), (-hx, -hy, hz), (hx, -hy, hz), (hx, hy, hz), (-hx, hy, hz)]
        if yaw or pitch or roll:
            rot = Euler((roll, pitch, yaw), 'XYZ').to_matrix()
            local = [tuple(rot @ Vector(p)) for p in local]
        self.add([(cx + p[0], cy + p[1], cz + p[2]) for p in local], self.BOX_FACES, m)

    def box8(self, corners, m):
        """Box from 8 corners ordered like BOX_FACES expects (bottom ring CCW then top ring)."""
        self.add(corners, self.BOX_FACES, m)

    # ---- revolved / lofted -------------------------------------------------
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
        self.add(verts, faces, m, smooth=smooth)
        if caps:
            self.add(verts[n:], [tuple(range(n))], m)
            self.add(verts[:n], [tuple(reversed(range(n)))], m)

    def loft(self, rings, m, smooth=True, close=True, cap_start=False, cap_end=False):
        """Connect successive rings (lists of 3D points, equal length) with quads."""
        n = len(rings[0])
        verts = [p for r in rings for p in r]
        faces = []
        for k in range(len(rings) - 1):
            a = k * n
            b = (k + 1) * n
            rng = range(n) if close else range(n - 1)
            for i in rng:
                j = (i + 1) % n
                faces.append((a + i, a + j, b + j, b + i))
        self.add(verts, faces, m, smooth=smooth)
        if cap_start:
            self.add(rings[0], [tuple(reversed(range(n)))], m)
        if cap_end:
            self.add(rings[-1], [tuple(range(n))], m)

    def lathe(self, profile, cx, cy, z0, m, segs=24, smooth=True, cap=True):
        """Revolve a (radius, z) profile around the vertical axis at (cx, cy)."""
        rings = []
        for (r, z) in profile:
            rr = max(r, 1e-4)
            rings.append([(cx + rr * math.cos(2 * math.pi * i / segs), cy + rr * math.sin(2 * math.pi * i / segs), z0 + z) for i in range(segs)])
        self.loft(rings, m, smooth=smooth, cap_start=cap and profile[0][0] > 1e-3, cap_end=cap and profile[-1][0] > 1e-3)

    def sphere(self, cx, cy, cz, r, m, segs=16, rings=10, smooth=True, sx=1.0, sy=1.0, sz=1.0):
        verts = []
        faces = []
        for j in range(rings + 1):
            phi = -math.pi / 2 + math.pi * j / rings
            zz = r * math.sin(phi) * sz
            rr = r * math.cos(phi)
            for i in range(segs):
                th = 2 * math.pi * i / segs
                verts.append((cx + rr * math.cos(th) * sx, cy + rr * math.sin(th) * sy, cz + zz))
        for j in range(rings):
            for i in range(segs):
                a = j * segs + i
                b = j * segs + (i + 1) % segs
                c = (j + 1) * segs + (i + 1) % segs
                d = (j + 1) * segs + i
                faces.append((a, b, c, d))
        self.add(verts, faces, m, smooth=smooth)

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
        self.add(verts, faces, m, smooth=True)

    def dome(self, cx, cy, z0, r, m, segs=28, onion=True):
        """Onion dome typical of Gulf mosques (profile in radius/height fractions)."""
        if onion:
            prof = [(1.0, 0.0), (1.04, 0.12), (1.03, 0.28), (0.96, 0.45), (0.84, 0.6), (0.68, 0.74), (0.5, 0.85), (0.3, 0.93), (0.12, 0.985), (0.0, 1.0)]
        else:
            prof = [(math.cos(a), math.sin(a)) for a in [math.pi / 2 * k / 9 for k in range(10)]]
        self.lathe([(r * a, r * 1.05 * b) for (a, b) in prof], cx, cy, z0, m, segs=segs, cap=False)

    # ---- polygons ---------------------------------------------------------
    def quad(self, p0, p1, p2, p3, m, smooth=False):
        self.add([p0, p1, p2, p3], [(0, 1, 2, 3)], m, smooth=smooth)

    def ngon(self, pts, m):
        self.add(list(pts), [tuple(range(len(pts)))], m)

    def prism(self, poly2d, z0, h, m, cx=0.0, cy=0.0, yaw=0.0, smooth_sides=False):
        """Extrude a CCW 2D polygon (x, y) from z0 to z0 + h."""
        c, s = math.cos(yaw), math.sin(yaw)
        pts = [(cx + x * c - y * s, cy + x * s + y * c) for (x, y) in poly2d]
        n = len(pts)
        bottom = [(x, y, z0) for (x, y) in pts]
        top = [(x, y, z0 + h) for (x, y) in pts]
        self.loft([bottom, top], m, smooth=smooth_sides)
        self.add(top, [tuple(range(n))], m)
        self.add(bottom, [tuple(reversed(range(n)))], m)

    # ---- output -------------------------------------------------------------
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

    def tris(self):
        return sum(max(0, len(f) - 2) for f in self.f)


class Facade:
    """Local frame on one side of a building: u along the wall, v into the wall, z up.

    side: '-y' (south), '+y' (north), '-x' (west), '+x' (east). The origin is the
    left end of the wall seen from outside, at ground level.
    """

    def __init__(self, mb, cx, cy, w, d, side, z0=0.0):
        self.mb = mb
        self.side = side
        if side == '-y':
            self.o = Vector((cx - w / 2, cy - d / 2, z0)); self.U = Vector((1, 0, 0)); self.N = Vector((0, -1, 0)); self.L = w
        elif side == '+y':
            self.o = Vector((cx + w / 2, cy + d / 2, z0)); self.U = Vector((-1, 0, 0)); self.N = Vector((0, 1, 0)); self.L = w
        elif side == '-x':
            self.o = Vector((cx - w / 2, cy + d / 2, z0)); self.U = Vector((0, -1, 0)); self.N = Vector((-1, 0, 0)); self.L = d
        else:
            self.o = Vector((cx + w / 2, cy - d / 2, z0)); self.U = Vector((0, 1, 0)); self.N = Vector((1, 0, 0)); self.L = d
        self.V = -self.N

    def pt(self, u, v, z):
        p = self.o + self.U * u + self.V * v + Vector((0, 0, z))
        return (p.x, p.y, p.z)

    def box(self, u0, u1, v0, v1, z0, z1, m):
        c = [self.pt(u0, v0, z0), self.pt(u1, v0, z0), self.pt(u1, v1, z0), self.pt(u0, v1, z0),
             self.pt(u0, v0, z1), self.pt(u1, v0, z1), self.pt(u1, v1, z1), self.pt(u0, v1, z1)]
        self.mb.box8(c, m)

    def panel(self, u0, u1, z0, z1, v, m):
        """Flat quad facing outward at depth v."""
        self.mb.quad(self.pt(u0, v, z0), self.pt(u1, v, z0), self.pt(u1, v, z1), self.pt(u0, v, z1), m)

    def arch_wall(self, u0, u1, z_spring, z_top, v0, v1, m, segs=12, inset=0.0):
        """Wall segment above an arched opening spanning u0..u1 (inner edges), with real thickness v0..v1."""
        uc = (u0 + u1) / 2
        r = (u1 - u0) / 2
        arc = [(uc + r * math.cos(math.pi - math.pi * i / segs), z_spring + r * math.sin(math.pi - math.pi * i / segs)) for i in range(segs + 1)]
        for depth, front in ((v0, True), (v1, False)):
            for i in range(segs):
                a, b = arc[i], arc[i + 1]
                p = [self.pt(a[0], depth, a[1]), self.pt(b[0], depth, b[1]), self.pt(b[0], depth, z_top), self.pt(a[0], depth, z_top)]
                if not front:
                    p.reverse()
                self.mb.quad(*p, m)
        # reveal along the arc (faces inward toward the opening)
        for i in range(segs):
            a, b = arc[i], arc[i + 1]
            self.mb.quad(self.pt(b[0], v0, b[1]), self.pt(a[0], v0, a[1]), self.pt(a[0], v1, a[1]), self.pt(b[0], v1, b[1]), m, smooth=True)

    def arch_recess(self, u0, u1, z0, z1, v, m_glass, m_frame, frame=0.16, segs=12):
        """Arched window: dark recessed pane + light frame ring, both flat (cheap, reads well)."""
        uc = (u0 + u1) / 2
        r = (u1 - u0) / 2
        zs = z1 - r
        inner = [(u0, z0), (u1, z0), (u1, zs)] + [(uc + r * math.cos(math.pi * i / segs), zs + r * math.sin(math.pi * i / segs)) for i in range(1, segs)] + [(u0, zs)]
        self.mb.ngon([self.pt(u, v, z) for (u, z) in inner], m_glass)
        outer = [(u0 - frame, z0), (u1 + frame, z0), (u1 + frame, zs)] + [(uc + (r + frame) * math.cos(math.pi * i / segs), zs + (r + frame) * math.sin(math.pi * i / segs)) for i in range(1, segs)] + [(u0 - frame, zs)]
        n = len(inner)
        for i in range(n):
            j = (i + 1) % n
            if i == n - 1:
                continue  # bottom edge open
            a, b = inner[i], inner[j]
            c, d = outer[j], outer[i]
            self.mb.quad(self.pt(a[0], v - 0.04, a[1]), self.pt(b[0], v - 0.04, b[1]), self.pt(c[0], v - 0.04, c[1]), self.pt(d[0], v - 0.04, d[1]), m_frame)


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


def rect(w, d):
    return [(-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2)]


def chamfered_rect(w, d, c):
    return [(-w / 2 + c, -d / 2), (w / 2 - c, -d / 2), (w / 2, -d / 2 + c), (w / 2, d / 2 - c), (w / 2 - c, d / 2), (-w / 2 + c, d / 2), (-w / 2, d / 2 - c), (-w / 2, -d / 2 + c)]


def ellipse(rx, ry, segs, rot=0.0):
    return [(rx * math.cos(2 * math.pi * i / segs + rot), ry * math.sin(2 * math.pi * i / segs + rot)) for i in range(segs)]


RND = random.Random(2026)


def make_materials():
    # streets & ground
    mat('Ground_Sand', '#D8CBAF', rough=0.95)
    mat('Plaza', '#D3CBBC', rough=0.9)
    mat('Paving', '#C7BFAF', rough=0.9)
    mat('Sidewalk', '#DAD4C8', rough=0.88)
    mat('Curb', '#E6E1D6', rough=0.8)
    mat('Asphalt', '#33363B', rough=0.92)
    mat('Concrete', '#BDB8AE', rough=0.85)
    mat('Marking_White', '#EDEBE4', rough=0.7)
    mat('Marking_Yellow', '#D9B24A', rough=0.7)
    mat('Grass', '#5E9C45', rough=0.95)
    mat('Hedge', '#3D7A38', rough=0.95)
    mat('Beach', '#EADDBD', rough=0.95)
    mat('Sea', '#1C6C8C', rough=0.05, metal=0.0, spec=1.0)
    mat('Pool', '#1B5F86', rough=0.05, spec=1.0)
    mat('Rock', '#8E8578', rough=0.95)
    # facades
    mat('Facade_White', '#F1EEE7', rough=0.75)
    mat('Facade_Cream', '#E9E0CB', rough=0.8)
    mat('Facade_Sand', '#D9C8A8', rough=0.8)
    mat('Facade_Stone', '#CFC5B3', rough=0.82)
    mat('Facade_Grey', '#B9BEC6', rough=0.7)
    mat('Facade_Terracotta', '#C9A484', rough=0.8)
    mat('Trim', '#F8F5EE', rough=0.7)
    mat('Marble', '#F5F3EE', rough=0.35, spec=0.7)
    mat('Marble_Warm', '#EFE7D6', rough=0.4)
    mat('Ledge', '#EFE9DB', rough=0.7)
    mat('Glass_Dark', '#16202C', rough=0.1, metal=0.3, spec=0.9)
    mat('Glass_Blue', '#2E5E8C', rough=0.06, metal=0.55, spec=1.0)
    mat('Glass_Teal', '#2A6C74', rough=0.08, metal=0.45, spec=1.0)
    mat('Glass_Gold', '#7A6A3A', rough=0.08, metal=0.6, spec=1.0)
    mat('Glass_Sky', '#6FA0C8', rough=0.05, metal=0.5, spec=1.0)
    mat('Mullion', '#3E4650', rough=0.4, metal=0.6)
    mat('Mullion_Light', '#C9CDD2', rough=0.35, metal=0.6)
    mat('Roof', '#8F8A80', rough=0.9)
    mat('Roof_Dark', '#4E5259', rough=0.9)
    mat('Gold', '#C9A24E', rough=0.3, metal=0.85)
    mat('Hospital_White', '#F4F4F1', rough=0.7)
    mat('Hospital_Red', '#C8322B', rough=0.5)
    mat('Metal_Grey', '#7C8288', rough=0.4, metal=0.7)
    mat('Metal_Dark', '#3A3F46', rough=0.45, metal=0.7)
    mat('Lamp', '#FFF1C8', emit='#FFE7A8', emit_strength=6.0, rough=0.3)
    mat('Lamp_Globe', '#FFF6E0', emit='#FFF0C8', emit_strength=3.0, rough=0.3)
    mat('Signal_Red', '#FF3A2E', emit='#FF3A2E', emit_strength=5.0)
    mat('Signal_Amber', '#FFB020', emit='#FFB020', emit_strength=0.5)
    mat('Signal_Green', '#2ED573', emit='#2ED573', emit_strength=0.5)
    # vegetation
    mat('Palm_Trunk', '#8A6A48', rough=0.9)
    mat('Palm_Leaf', '#3F8A3E', rough=0.8)
    mat('Palm_Leaf2', '#57A24F', rough=0.8)
    mat('Tree_Leaf', '#3B7A33', rough=0.85)
    mat('Tree_Leaf2', '#4F9440', rough=0.85)
    mat('Dates', '#C57A2E', rough=0.7)
    mat('Flower_Red', '#D64545', rough=0.7)
    mat('Flower_Yellow', '#E8C13C', rough=0.7)
    mat('Flower_Pink', '#D9569C', rough=0.7)
    # vehicles
    mat('Car_Red', '#B23A3A', rough=0.25, metal=0.5)
    mat('Car_White', '#EDEDEA', rough=0.25, metal=0.4)
    mat('Car_Silver', '#B8BCC2', rough=0.25, metal=0.7)
    mat('Car_Navy', '#213A5C', rough=0.25, metal=0.5)
    mat('Car_Black', '#1F2124', rough=0.25, metal=0.5)
    mat('Car_Teal', '#2D7D8E', rough=0.25, metal=0.5)
    mat('Car_Beige', '#C9BBA2', rough=0.25, metal=0.5)
    mat('Car_Grey', '#6E7378', rough=0.25, metal=0.6)
    mat('Bus_White', '#F2F2EE', rough=0.3, metal=0.3)
    mat('Bus_Blue', '#1F4E9C', rough=0.3, metal=0.3)
    mat('Tyre', '#141517', rough=0.9)
    mat('Rim', '#B9BEC4', rough=0.3, metal=0.8)
    mat('Headlight', '#FFFFFF', emit='#FFF6D8', emit_strength=4.0)
    mat('Taillight', '#FF3B30', emit='#FF3B30', emit_strength=3.0)
    mat('Light_Red', '#FF2D2D', emit='#FF2D2D', emit_strength=8.0)
    mat('Light_Blue', '#2D7BFF', emit='#2D7BFF', emit_strength=8.0)
    mat('Stripe_Red', '#C8322B', rough=0.5)
    mat('Stripe_Blue', '#1F4E9C', rough=0.5)
    mat('Taxi_Sign', '#F5D547', emit='#F5D547', emit_strength=1.5)
    mat('Barrier_Red', '#D42B2B', rough=0.6)
    mat('Barrier_White', '#F2F2F0', rough=0.6)
    mat('Sign_Blue', '#1C4E9C', rough=0.6)
    mat('Sign_Green', '#1E7A45', rough=0.6)
    mat('Screen', '#0B1220', emit='#0B1220', emit_strength=1.0, rough=0.3)
    mat('Water', '#2F5256', rough=0.06, alpha=0.9, spec=1.0)
    mat('Water_Murky', '#2B4340', rough=0.05, alpha=0.95, spec=1.0)
    mat('Bench', '#5B4636', rough=0.8)
    mat('Helipad', '#5B6068', rough=0.9)
    mat('Kandura', '#F4F1EA', rough=0.8)
    mat('Abaya', '#141414', rough=0.8)
    mat('Skin', '#C99A72', rough=0.7)
    mat('Boat', '#F0EEE8', rough=0.4)
    mat('Boat_Trim', '#1F4E9C', rough=0.4)
