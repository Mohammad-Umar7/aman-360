"""AMAN 360 district generator — buildings (v2, Abu Dhabi style, higher detail)."""

FH = 3.3          # residential floor height
GF = 4.6          # ground floor / arcade height
TFH = 3.6         # tower floor height
SIDEWALK_H = 0.18
PLINTH = 0.25
T = 0.4           # wall thickness


def M(n):
    return MATS[n]


# ----------------------------------------------------------------------------
# Residential / mixed-use mid-rise with real recessed windows, balconies, arcades
# ----------------------------------------------------------------------------

def _floor_strip(F, z0, z1, fm, gm, tm, sill=0.9, lintel=0.8, balconies=False, alt=0, tall_ground=False):
    L = F.L
    nb = max(2, int(L / 3.2))
    bay = L / nb
    pw = 0.5
    zw0, zw1 = z0 + sill, z1 - lintel
    F.box(0, L, 0, T, z1 - lintel, z1, fm)  # lintel band
    for k in range(nb + 1):
        u = k * bay
        F.box(max(0, u - pw / 2), min(L, u + pw / 2), 0, T, z0, zw1, fm)  # piers (also under sills)
    for k in range(nb):
        u0, u1 = k * bay + pw / 2, (k + 1) * bay - pw / 2
        balcony = balconies and (k % 2 == alt) and 0 < k < nb - 1
        if balcony:
            F.panel(u0, u1, z0 + 0.12, zw1, 0.3, gm)                       # balcony door glass
            F.box(u0, u1, 0.26, 0.34, z0 + 0.12, zw1, M('Mullion_Light')) if False else None
            uc = (u0 + u1) / 2
            F.box(uc - 0.04, uc + 0.04, 0.24, 0.34, z0 + 0.12, zw1, M('Mullion_Light'))
            F.box(u0, u1, 0, T, z0, z0 + 0.12, fm)                          # threshold
            # balcony slab, solid parapet, top rail
            F.box(u0 - 0.15, u1 + 0.15, -1.6, 0.0, z0 - 0.08, z0 + 0.12, tm)
            F.box(u0 - 0.15, u1 + 0.15, -1.6, -1.46, z0 + 0.12, z0 + 1.1, tm)
            F.box(u0 - 0.15, u0 - 0.01, -1.6, 0.0, z0 + 0.12, z0 + 1.1, tm)
            F.box(u1 + 0.01, u1 + 0.15, -1.6, 0.0, z0 + 0.12, z0 + 1.1, tm)
            F.box(u0 - 0.18, u1 + 0.18, -1.66, -1.4, z0 + 1.1, z0 + 1.18, M('Metal_Grey'))
        else:
            F.box(u0, u1, 0, T, z0, zw0, fm)                                # sill band for this bay
            F.panel(u0, u1, zw0, zw1, 0.3, gm)                              # recessed glass
            F.box(u0 - 0.06, u1 + 0.06, -0.14, 0.04, zw0 - 0.07, zw0, tm)   # protruding sill
            if (u1 - u0) > 2.1:
                uc = (u0 + u1) / 2
                F.box(uc - 0.04, uc + 0.04, 0.24, 0.34, zw0, zw1, M('Mullion_Light'))


def _arcade(F, fm, gm, tm, depth=2.8):
    L = F.L
    nb = max(2, int(L / 3.0))
    bay = L / nb
    for k in range(nb + 1):
        u = k * bay
        F.box(max(0, u - 0.3), min(L, u + 0.3), 0.0, 0.6, 0, GF, tm)            # columns to full height
        F.box(max(0, u - 0.4), min(L, u + 0.4), -0.05, 0.65, 0, 0.5, tm)         # column base
    for k in range(nb):
        u0, u1 = k * bay + 0.3, (k + 1) * bay - 0.3
        r = (u1 - u0) / 2
        F.arch_wall(u0, u1, GF - r - 0.35, GF, 0.0, 0.6, fm)
    F.box(0, L, 0.6, depth + T, GF - 0.35, GF, fm)                               # underside of upper floor
    F.box(0, L, 0, depth + T, 0, 0.1, M('Paving'))                               # walkway
    F.box(0, L, depth, depth + T, GF - 0.9, GF - 0.35, tm)                       # shopfront fascia
    for k in range(nb):
        u0, u1 = k * bay + 0.15, (k + 1) * bay - 0.15
        F.panel(u0, u1, 0.1, GF - 0.9, depth + 0.02, gm)                          # shopfront glass
        F.box(u0 - 0.15, u0 + 0.02, depth - 0.06, depth + 0.16, 0.1, GF - 0.9, M('Mullion'))
    F.box(L - 0.17, L, depth - 0.06, depth + 0.16, 0.1, GF - 0.9, M('Mullion'))


def _rooftop(mb, cx, cy, w, d, z, fm, merlons=True, tank=True, core=True):
    mb.box(cx, cy, z - 0.1, w, d, 0.3, fm)                                      # roof slab
    mb.box(cx, cy, z + 0.2, w - 0.7, d - 0.7, 0.04, M('Roof'))
    pw = 0.35
    for (px, py, sx, sy) in ((cx, cy - d / 2 + pw / 2, w, pw), (cx, cy + d / 2 - pw / 2, w, pw), (cx - w / 2 + pw / 2, cy, pw, d), (cx + w / 2 - pw / 2, cy, pw, d)):
        mb.box(px, py, z + 0.2, sx, sy, 1.0, fm)
    if merlons:
        n = int(w / 1.4)
        for i in range(n + 1):
            x = cx - w / 2 + i * (w / n)
            mb.box(x, cy - d / 2 + pw / 2, z + 1.2, 0.6, pw + 0.1, 0.45, fm)
            mb.box(x, cy + d / 2 - pw / 2, z + 1.2, 0.6, pw + 0.1, 0.45, fm)
        n = int(d / 1.4)
        for i in range(n + 1):
            y = cy - d / 2 + i * (d / n)
            mb.box(cx - w / 2 + pw / 2, y, z + 1.2, pw + 0.1, 0.6, 0.45, fm)
            mb.box(cx + w / 2 - pw / 2, y, z + 1.2, pw + 0.1, 0.6, 0.45, fm)
    if core:
        mb.box(cx - w / 4, cy + d / 5, z + 0.2, w / 4.5, d / 3.5, 2.9, fm)
        mb.box(cx - w / 4, cy + d / 5 - d / 7 - 0.05, z + 0.2, 1.0, 0.1, 2.2, M('Glass_Dark'))
    if tank:
        for k in range(2):
            tx, ty = cx + w / 4 - k * 3.2, cy - d / 5
            mb.lathe([(1.2, 0), (1.2, 2.0), (1.0, 2.3), (0.5, 2.55), (0, 2.6)], tx, ty, z + 0.2, M('Metal_Grey'), segs=16)
    rnd = RND
    for k in range(4):
        ax = cx + rnd.uniform(-w / 2 + 2, w / 2 - 2)
        ay = cy + rnd.uniform(-d / 2 + 2, d / 2 - 2)
        mb.box(ax, ay, z + 0.2, 1.1, 0.9, 0.8, M('Metal_Grey'))
        mb.cyl(ax, ay, z + 1.0, 0.38, 0.38, 0.08, M('Metal_Dark'), segs=12)
    for k in range(2):
        dx, dy = cx + w / 2 - 1.5 - k * 2.2, cy + d / 2 - 1.5
        mb.cyl(dx, dy, z + 0.2, 0.05, 0.05, 1.6, M('Metal_Grey'), segs=6)
        mb.lathe([(0.0, 0), (0.55, 0.12), (0.62, 0.2)], dx, dy - 0.3, z + 1.6, M('Trim'), segs=14)


def residential_v2(name, coll, cx, cy, w, d, floors, palette='cream', arcade=('-y',), balconies=('-y', '+y'), merlons=True, tank=True):
    fm = M({'cream': 'Facade_Cream', 'white': 'Facade_White', 'sand': 'Facade_Sand', 'stone': 'Facade_Stone', 'terracotta': 'Facade_Terracotta', 'grey': 'Facade_Grey'}[palette])
    gm = M({'cream': 'Glass_Teal', 'white': 'Glass_Teal', 'sand': 'Glass_Dark', 'stone': 'Glass_Blue', 'terracotta': 'Glass_Dark', 'grey': 'Glass_Blue'}[palette])
    tm = M('Trim')
    mb = MB()
    z0 = SIDEWALK_H
    mb.box(cx, cy, z0, w + 3.2, d + 3.2, PLINTH, M('Plaza'))
    zb = z0 + PLINTH
    H = GF + (floors - 1) * FH
    for side in ('-y', '+y', '-x', '+x'):
        F = Facade(mb, cx, cy, w, d, side, zb)
        if side in arcade:
            _arcade(F, fm, gm, tm)
        else:
            _floor_strip(F, 0, GF, fm, gm, tm, sill=1.0, lintel=0.9)
        for f in range(1, floors):
            zf = GF + (f - 1) * FH
            _floor_strip(F, zf, zf + FH, fm, gm, tm, balconies=(side in balconies), alt=f % 2)
    for sx in (-1, 1):
        for sy in (-1, 1):
            mb.box(cx + sx * (w / 2 - 0.3), cy + sy * (d / 2 - 0.3), zb, 0.62, 0.62, H, fm)
    # floor ledges (thin, continuous)
    for f in range(1, floors):
        zf = zb + GF + (f - 1) * FH
        mb.box(cx, cy, zf - 0.1, w + 0.2, d + 0.2, 0.2, tm)
    _rooftop(mb, cx, cy, w, d, zb + H, fm, merlons=merlons, tank=tank)
    return mb.build(name, coll)


# ----------------------------------------------------------------------------
# Glass towers
# ----------------------------------------------------------------------------

def _podium(mb, cx, cy, pw, pd, floors=3, fh=4.2, glass='Glass_Blue'):
    zb = SIDEWALK_H + PLINTH
    mb.box(cx, cy, SIDEWALK_H, pw + 4, pd + 4, PLINTH, M('Plaza'))
    prof = chamfered_rect(pw, pd, 1.5)
    mb.prism(prof, zb, floors * fh, M(glass), cx=cx, cy=cy)
    for f in range(floors + 1):
        band = chamfered_rect(pw + 0.5, pd + 0.5, 1.6)
        z = zb + f * fh
        mb.loft([[(cx + x, cy + y, z - 0.2) for (x, y) in band], [(cx + x, cy + y, z + 0.2) for (x, y) in band]], M('Mullion'), smooth=False)
        mb.add([(cx + x, cy + y, z + 0.2) for (x, y) in band], [tuple(range(len(band)))], M('Mullion'))
        mb.add([(cx + x, cy + y, z - 0.2) for (x, y) in band], [tuple(reversed(range(len(band))))], M('Mullion'))
    # ground floor colonnade & canopy on the south
    for i in range(int(pw / 4) + 1):
        x = cx - pw / 2 + i * (pw / int(pw / 4))
        mb.box(x, cy - pd / 2 - 2.2, zb, 0.6, 0.6, fh, M('Mullion_Light'))
    mb.box(cx, cy - pd / 2 - 2.0, zb + fh - 0.3, pw + 1.0, 4.4, 0.4, M('Mullion_Light'))
    # podium roof garden
    zt = zb + floors * fh + 0.2
    mb.box(cx, cy, zt - 0.2, pw - 0.6, pd - 0.6, 0.3, M('Roof'))
    for k in range(3):
        mb.box(cx - pw / 3 + k * pw / 3, cy + pd / 3.2, zt, pw / 4, 2.2, 0.8, M('Facade_Grey'))
        mb.box(cx - pw / 3 + k * pw / 3, cy + pd / 3.2, zt + 0.8, pw / 4 - 0.2, 2.0, 0.25, M('Hedge'))
    return zt


def tower_curved(name, coll, cx, cy, rx, ry, floors, twist=0.0, taper=0.12, glass='Glass_Blue', podium=True, helipad=False, segs=36):
    mb = MB()
    zt = _podium(mb, cx, cy, rx * 2.6, ry * 2.6, glass=glass) if podium else SIDEWALK_H + PLINTH
    if not podium:
        mb.box(cx, cy, SIDEWALK_H, rx * 2.6, ry * 2.6, PLINTH, M('Plaza'))
    rings = []
    for f in range(floors + 1):
        s = 1 - taper * (f / floors) ** 1.6
        rot = math.radians(twist) * f / floors
        z = zt + f * TFH
        rings.append([(cx + x, cy + y, z) for (x, y) in ellipse(rx * s, ry * s, segs, rot)])
    mb.loft(rings, M(glass), smooth=True)
    for f in range(1, floors):
        s = (1 - taper * (f / floors) ** 1.6) * 1.03
        rot = math.radians(twist) * f / floors
        z = zt + f * TFH
        e = ellipse(rx * s, ry * s, segs, rot)
        mb.loft([[(cx + x, cy + y, z - 0.16) for (x, y) in e], [(cx + x, cy + y, z + 0.16) for (x, y) in e]], M('Mullion'), smooth=True)
    # vertical fins every 30 degrees (follow the twist)
    for i in range(12):
        fin = []
        for f in range(floors + 1):
            s = (1 - taper * (f / floors) ** 1.6)
            rot = math.radians(twist) * f / floors + 2 * math.pi * i / 12
            z = zt + f * TFH
            fin.append((cx + rx * s * 1.035 * math.cos(rot), cy + ry * s * 1.035 * math.sin(rot), z))
        ring_a = [(p[0], p[1], p[2]) for p in fin]
        # a fin is a thin quad strip: offset tangentially by 0.12
        strip = []
        for f, p in enumerate(fin):
            rot = math.radians(twist) * f / floors + 2 * math.pi * i / 12
            tx, ty = -math.sin(rot) * 0.12, math.cos(rot) * 0.12
            strip.append([(p[0] - tx, p[1] - ty, p[2]), (p[0] + tx, p[1] + ty, p[2])])
        mb.loft(strip, M('Mullion'), smooth=False, close=False)
    # crown
    top = rings[-1]
    s_top = 1 - taper
    z_top = zt + floors * TFH
    crown = [top,
             [(cx + x, cy + y, z_top + 2.2) for (x, y) in ellipse(rx * s_top * 0.9, ry * s_top * 0.9, segs, math.radians(twist))],
             [(cx + x, cy + y, z_top + 3.6) for (x, y) in ellipse(rx * s_top * 0.62, ry * s_top * 0.62, segs, math.radians(twist))]]
    mb.loft(crown, M('Mullion'), smooth=True, cap_end=True)
    mb.cyl(cx, cy, z_top + 3.6, rx * s_top * 0.3, rx * s_top * 0.3, 2.4, M('Roof_Dark'), segs=16)
    mb.lathe([(0.7, 0), (0.7, 5), (0.3, 5.3), (0.3, 16), (0.06, 16.3), (0, 18)], cx, cy, z_top + 6.0, M('Metal_Grey'), segs=10)
    if helipad:
        mb.cyl(cx, cy, z_top + 3.6, rx * 0.3, rx * 0.3, 0.1, M('Helipad'), segs=24)
    return mb.build(name, coll)


def tower_slab(name, coll, cx, cy, w, d, floors, chamfer=2.5, glass='Glass_Sky', podium=True, crown=True):
    mb = MB()
    zt = _podium(mb, cx, cy, w + 6, d + 6, floors=2, glass=glass) if podium else SIDEWALK_H + PLINTH
    if not podium:
        mb.box(cx, cy, SIDEWALK_H, w + 4, d + 4, PLINTH, M('Plaza'))
    prof = chamfered_rect(w, d, chamfer)
    H = floors * TFH
    mb.prism(prof, zt, H, M(glass), cx=cx, cy=cy)
    band = chamfered_rect(w + 0.36, d + 0.36, chamfer + 0.1)
    for f in range(1, floors):
        z = zt + f * TFH
        mb.loft([[(cx + x, cy + y, z - 0.16) for (x, y) in band], [(cx + x, cy + y, z + 0.16) for (x, y) in band]], M('Mullion'), smooth=False)
    # vertical mullions on the four main faces
    for (axis, length, off) in (('x', w - 2 * chamfer, d / 2), ('y', d - 2 * chamfer, w / 2)):
        n = max(2, int(length / 2.4))
        for i in range(n + 1):
            t = -length / 2 + i * (length / n)
            for sgn in (-1, 1):
                if axis == 'x':
                    mb.box(cx + t, cy + sgn * (off + 0.09), zt, 0.14, 0.18, H, M('Mullion'))
                else:
                    mb.box(cx + sgn * (off + 0.09), cy + t, zt, 0.18, 0.14, H, M('Mullion'))
    zr = zt + H
    if crown:
        mb.box(cx, cy, zr, w * 0.72, d * 0.72, 3.2, M('Mullion'))
        mb.box(cx, cy, zr + 3.2, w * 0.5, d * 0.5, 2.4, M('Roof_Dark'))
        mb.lathe([(0.4, 0), (0.4, 4), (0.15, 4.2), (0.15, 12), (0, 12.5)], cx, cy, zr + 5.6, M('Metal_Grey'), segs=8)
    else:
        mb.box(cx, cy, zr, w - 1, d - 1, 0.2, M('Roof'))
        mb.box(cx - w / 5, cy, zr + 0.2, w / 4, d / 3, 2.6, M('Roof_Dark'))
    return mb.build(name, coll)


# ----------------------------------------------------------------------------
# Emirati villa with boundary wall, barjeel (wind tower) and arched windows
# ----------------------------------------------------------------------------

def barjeel(mb, cx, cy, z0, size=3.0, h=5.0, m=None):
    m = m or M('Facade_Cream')
    mb.box(cx, cy, z0, size, size, h, m)
    for side in range(4):
        for k in range(4):
            t = -size / 2 + 0.45 + k * (size - 0.9) / 3
            if side == 0:
                mb.box(cx + t, cy - size / 2 - 0.08, z0 + 1.0, 0.18, 0.16, h - 1.6, M('Trim'))
            elif side == 1:
                mb.box(cx + t, cy + size / 2 + 0.08, z0 + 1.0, 0.18, 0.16, h - 1.6, M('Trim'))
            elif side == 2:
                mb.box(cx - size / 2 - 0.08, cy + t, z0 + 1.0, 0.16, 0.18, h - 1.6, M('Trim'))
            else:
                mb.box(cx + size / 2 + 0.08, cy + t, z0 + 1.0, 0.16, 0.18, h - 1.6, M('Trim'))
    mb.box(cx, cy, z0 + h, size + 0.4, size + 0.4, 0.3, M('Trim'))


def villa(mb, cx, cy, w=16, d=12, palette='cream', pool=False, flip=False):
    fm = M({'cream': 'Facade_Cream', 'white': 'Facade_White', 'sand': 'Facade_Sand', 'stone': 'Facade_Stone'}[palette])
    tm = M('Trim')
    gm = M('Glass_Dark')
    z0 = SIDEWALK_H
    pw, pd = w + 12, d + 12
    mb.box(cx, cy, z0, pw, pd, 0.12, M('Grass'))
    # boundary wall with piers and a gate on the south
    wh = 2.3
    for (px, py, sx, sy) in ((cx, cy + pd / 2, pw, 0.3), (cx - pw / 2, cy, 0.3, pd), (cx + pw / 2, cy, 0.3, pd)):
        mb.box(px, py, z0, sx, sy, wh, fm)
    gate_w = 4.0
    mb.box(cx - (pw / 4 + gate_w / 4), cy - pd / 2, z0, pw / 2 - gate_w / 2, 0.3, wh, fm)
    mb.box(cx + (pw / 4 + gate_w / 4), cy - pd / 2, z0, pw / 2 - gate_w / 2, 0.3, wh, fm)
    for sx in (-1, 1):
        mb.box(cx + sx * (gate_w / 2 + 0.3), cy - pd / 2, z0, 0.6, 0.6, wh + 0.5, tm)
        mb.lathe([(0.32, 0), (0.42, 0.1), (0.2, 0.5), (0, 0.6)], cx + sx * (gate_w / 2 + 0.3), cy - pd / 2, z0 + wh + 0.5, tm, segs=10)
    mb.box(cx, cy - pd / 2, z0, gate_w, 0.08, wh - 0.3, M('Metal_Dark'))
    for k in range(6):
        mb.box(cx - gate_w / 2 + 0.4 + k * (gate_w - 0.8) / 5, cy - pd / 2 - 0.05, z0 + 0.2, 0.06, 0.06, wh - 0.6, M('Metal_Grey'))
    n = int(pw / 3)
    for i in range(n + 1):
        x = cx - pw / 2 + i * (pw / n)
        mb.box(x, cy + pd / 2, z0, 0.5, 0.5, wh + 0.3, tm)
    mb.box(cx, cy - pd / 2 + 4, z0 + 0.12, gate_w + 1, 8, 0.05, M('Paving'))  # driveway
    # main house (two storeys)
    zb = z0 + 0.35
    mb.box(cx, cy + 1, z0 + 0.12, w + 2, d + 2, 0.23, M('Plaza'))
    H = 7.4
    mb.box(cx, cy + 1, zb, w, d, H, fm)
    for side in ('-y', '+y', '-x', '+x'):
        F = Facade(mb, cx, cy + 1, w, d, side, zb)
        L = F.L
        nb = max(2, int(L / 3.4))
        bay = L / nb
        for f in range(2):
            zf = f * 3.6
            for k in range(nb):
                u0 = k * bay + bay / 2 - 0.75
                u1 = u0 + 1.5
                if side == '-y' and f == 0 and k == nb // 2:
                    F.arch_recess(u0 - 0.3, u1 + 0.3, zf + 0.0, zf + 3.0, -0.02, gm, tm)   # entrance
                else:
                    F.arch_recess(u0, u1, zf + 0.9, zf + 3.0, -0.02, gm, tm)
        F.box(0, L, -0.25, 0.0, 3.55, 3.75, tm)          # string course
    # parapet with merlons
    _rooftop(mb, cx, cy + 1, w, d, zb + H, fm, merlons=True, tank=True, core=False)
    # majlis wing with dome
    mx, my = cx + w / 2 + 3.5, cy - 1
    mb.box(mx, my, zb, 7, 7, 4.2, fm)
    mb.box(mx, my, zb + 4.2, 7.4, 7.4, 0.3, tm)
    mb.cyl(mx, my, zb + 4.5, 2.6, 2.6, 0.8, tm, segs=24)
    mb.dome(mx, my, zb + 5.3, 2.5, tm, segs=24)
    mb.lathe([(0.08, 0), (0.2, 0.3), (0.06, 0.7), (0, 1.0)], mx, my, zb + 7.9, M('Gold'), segs=8)
    Fm = Facade(mb, mx, my, 7, 7, '-y', zb)
    Fm.arch_recess(1.0, 2.4, 0.9, 3.0, -0.02, gm, tm)
    Fm.arch_recess(4.6, 6.0, 0.9, 3.0, -0.02, gm, tm)
    # entrance porch with arches
    px, py = cx, cy + 1 - d / 2 - 2.2
    for sx in (-1, 1):
        mb.box(px + sx * 3.0, py, zb, 0.6, 0.6, 3.3, tm)
    Fp = Facade(mb, px, py, 6.6, 0.6, '-y', zb)
    Fp.arch_wall(0.6, 6.0, 3.3 - 2.7, 3.9, 0.0, 0.6, tm)
    mb.box(px, py + 1.1, zb + 3.6, 7.4, 3.2, 0.35, tm)
    barjeel(mb, cx - w / 2 + 2.2, cy + 1 + d / 2 - 2.2, zb + H + 0.2, m=fm)
    if pool:
        mb.box(cx - 2, cy + 1 + d / 2 + 4, z0 + 0.05, 9, 4.5, 0.3, M('Marble'))
        mb.box(cx - 2, cy + 1 + d / 2 + 4, z0 + 0.3, 8.4, 3.9, 0.06, M('Pool'))


# ----------------------------------------------------------------------------
# Mosque complex (Grand-Mosque cues: white marble, onion domes, arcaded courtyard, twin minarets)
# ----------------------------------------------------------------------------

def finial(mb, cx, cy, z, s=1.0):
    mb.lathe([(0.1 * s, 0), (0.32 * s, 0.4 * s), (0.1 * s, 0.9 * s), (0.22 * s, 1.3 * s), (0.06 * s, 1.8 * s), (0, 2.3 * s)], cx, cy, z, M('Gold'), segs=10)


def minaret(mb, cx, cy, z0):
    wm = M('Marble')
    mb.box(cx, cy, z0, 4.6, 4.6, 4.5, wm)
    mb.box(cx, cy, z0 + 4.5, 5.0, 5.0, 0.4, M('Trim'))
    prof = [(1.75, 4.9), (1.5, 15.5), (2.4, 15.8), (2.4, 16.9), (1.35, 17.2), (1.2, 27), (2.0, 27.3), (2.0, 28.3), (1.1, 28.6), (0.95, 35.5), (1.3, 35.7), (1.3, 36.5), (0.9, 36.8)]
    mb.lathe(prof, cx, cy, z0, wm, segs=24)
    for zb_, rr in ((15.8, 2.4), (27.3, 2.0)):
        for i in range(12):
            a = 2 * math.pi * i / 12
            mb.box(cx + rr * math.cos(a), cy + rr * math.sin(a), z0 + zb_ + 1.0, 0.12, 0.12, 1.1, M('Trim'), yaw=a)
    mb.dome(cx, cy, z0 + 36.8, 1.35, wm, segs=20)
    finial(mb, cx, cy, z0 + 38.2, 0.9)


def mosque_v2(name, coll, cx, cy):
    mb = MB()
    wm, tm, gm = M('Marble'), M('Trim'), M('Glass_Dark')
    z0 = SIDEWALK_H
    mb.box(cx, cy, z0, 62, 38, 0.25, M('Marble_Warm'))   # raised platform
    zb = z0 + 0.25
    # prayer hall
    hx, hy, hw, hd, hh = cx, cy + 8, 36, 16, 12
    mb.box(hx, hy, zb, hw, hd, hh, wm)
    for side in ('-x', '+x', '+y'):
        F = Facade(mb, hx, hy, hw, hd, side, zb)
        nb = int(F.L / 4.0)
        bay = F.L / nb
        for k in range(nb):
            u0 = k * bay + bay / 2 - 1.1
            F.arch_recess(u0, u0 + 2.2, 1.5, 6.5, -0.02, gm, tm)
            F.arch_recess(u0 + 0.35, u0 + 1.85, 8.0, 10.6, -0.02, gm, tm)
        F.box(0, F.L, -0.3, 0.0, 7.2, 7.6, tm)
    # south facade: arcade portal (iwan) and arches
    F = Facade(mb, hx, hy, hw, hd, '-y', zb)
    for u0 in (2.4, 6.6, 10.8, 23.0, 27.2, 31.4):
        F.arch_recess(u0, u0 + 2.2, 1.5, 6.5, -0.02, gm, tm)
        F.arch_recess(u0 + 0.35, u0 + 1.85, 8.0, 10.6, -0.02, gm, tm)
    F.box(13.5, 15.0, -1.2, 0.0, 0, 11.4, tm)
    F.box(21.0, 22.5, -1.2, 0.0, 0, 11.4, tm)
    F.arch_wall(15.0, 21.0, 5.2, 11.4, -1.2, 0.0, tm)
    F.box(13.2, 22.8, -1.3, -1.1, 11.4, 12.4, tm)
    F.panel(15.2, 20.8, 0.1, 5.2, 0.05, gm)
    # cornice + parapet
    mb.box(hx, hy, zb + hh, hw + 0.8, hd + 0.8, 0.5, tm)
    for i in range(int(hw / 1.6) + 1):
        x = hx - hw / 2 + i * 1.6
        mb.box(x, hy - hd / 2 + 0.3, zb + hh + 0.5, 0.7, 0.5, 0.6, tm)
        mb.box(x, hy + hd / 2 - 0.3, zb + hh + 0.5, 0.7, 0.5, 0.6, tm)
    # main dome on drum with arched slits
    dr = 7.4
    mb.cyl(hx, hy, zb + hh, dr, dr, 3.0, wm, segs=32)
    for i in range(16):
        a = 2 * math.pi * i / 16
        mb.box(hx + dr * math.cos(a), hy + dr * math.sin(a), zb + hh + 0.7, 0.8, 0.2, 1.6, gm, yaw=a + math.pi / 2)
    mb.dome(hx, hy, zb + hh + 3.0, 7.5, wm, segs=40)
    finial(mb, hx, hy, zb + hh + 3.0 + 7.5 * 1.05, 1.4)
    for sx in (-1, 1):
        for sy in (-1, 1):
            dx, dy = hx + sx * (hw / 2 - 3.6), hy + sy * (hd / 2 - 3.4)
            mb.cyl(dx, dy, zb + hh, 2.5, 2.5, 1.3, wm, segs=24)
            mb.dome(dx, dy, zb + hh + 1.3, 2.6, wm, segs=28)
            finial(mb, dx, dy, zb + hh + 1.3 + 2.6 * 1.05, 0.7)
    # courtyard (sahn) with arcades on east, west and south
    cw, cd = 40, 14
    cyx, cyy = cx, cy - 9
    mb.box(cyx, cyy, zb, cw, cd, 0.08, M('Marble_Warm'))
    for side in ('-x', '+x', '-y'):
        F = Facade(mb, cyx, cyy, cw, cd, side, zb)
        L = F.L
        nb = int(L / 3.6)
        bay = L / nb
        for k in range(nb + 1):
            u = k * bay
            mb.lathe([(0.5, 0), (0.5, 0.35), (0.34, 0.5), (0.34, 5.2), (0.55, 5.4), (0.55, 5.8)], *F.pt(u, 0.3, 0)[:2], zb, wm, segs=12)
        for k in range(nb):
            u0, u1 = k * bay + 0.5, (k + 1) * bay - 0.5
            r = (u1 - u0) / 2
            if side == '-y' and abs(u0 + r - L / 2) < bay:
                continue  # central gate opening
            F.arch_wall(u0, u1, 5.8 - r * 0.2, 7.6, 0.0, 0.6, wm, segs=10)
        F.box(0, L, 0, 3.2, 7.6, 8.0, tm)
        for i in range(int(L / 1.6) + 1):
            F.box(i * 1.6 - 0.3, i * 1.6 + 0.3, -0.1, 0.7, 8.0, 8.6, tm)
    # reflecting pool + planters
    mb.box(cyx, cyy, zb + 0.08, 16, 4, 0.35, M('Marble'))
    mb.box(cyx, cyy, zb + 0.43, 15.2, 3.2, 0.05, M('Pool'))
    for sx in (-1, 1):
        mb.box(cyx + sx * 13, cyy, zb + 0.08, 4, 4, 0.5, M('Marble'))
        mb.box(cyx + sx * 13, cyy, zb + 0.58, 3.4, 3.4, 0.3, M('Grass'))
    # minarets
    minaret(mb, cx - 24, cy - 14, zb)
    minaret(mb, cx + 24, cy - 14, zb)
    return mb.build(name, coll)


# ----------------------------------------------------------------------------
# Hospital
# ----------------------------------------------------------------------------

def _ribbon_block(mb, cx, cy, w, d, floors, fh, fm, gm, shade=True):
    zb = SIDEWALK_H + PLINTH
    H = floors * fh
    for side in ('-y', '+y', '-x', '+x'):
        F = Facade(mb, cx, cy, w, d, side, zb)
        L = F.L
        for f in range(floors):
            zf = f * fh
            F.box(0, L, 0, T, zf, zf + 1.0, fm)
            F.box(0, L, 0, T, zf + fh - 0.7, zf + fh, fm)
            F.panel(0.4, L - 0.4, zf + 1.0, zf + fh - 0.7, 0.3, gm)
            n = max(1, int(L / 2.0))
            for k in range(n + 1):
                u = 0.4 + k * (L - 0.8) / n
                F.box(u - 0.05, u + 0.05, 0.22, 0.34, zf + 1.0, zf + fh - 0.7, M('Mullion_Light'))
            F.box(0, 0.4, 0, T, zf, zf + fh, fm)
            F.box(L - 0.4, L, 0, T, zf, zf + fh, fm)
            if shade and f > 0:
                F.box(0.2, L - 0.2, -0.6, 0.0, zf + fh - 0.75, zf + fh - 0.6, M('Trim'))
    mb.box(cx, cy, zb + H - 0.1, w, d, 0.3, fm)
    mb.box(cx, cy, zb + H + 0.2, w - 0.6, d - 0.6, 0.04, M('Roof'))
    for (px, py, sx, sy) in ((cx, cy - d / 2 + 0.2, w, 0.4), (cx, cy + d / 2 - 0.2, w, 0.4), (cx - w / 2 + 0.2, cy, 0.4, d), (cx + w / 2 - 0.2, cy, 0.4, d)):
        mb.box(px, py, zb + H + 0.2, sx, sy, 1.1, fm)
    return zb + H


def hospital_v2(name, coll, cx, cy):
    mb = MB()
    wm, rm, gm = M('Hospital_White'), M('Hospital_Red'), M('Glass_Teal')
    mb.box(cx, cy, SIDEWALK_H, 52, 36, PLINTH, M('Plaza'))
    zc = _ribbon_block(mb, cx, cy, 22, 24, 7, 3.6, wm, gm)
    zw = _ribbon_block(mb, cx - 16, cy, 12, 26, 5, 3.6, wm, gm)
    _ribbon_block(mb, cx + 16, cy, 12, 26, 5, 3.6, wm, gm)
    # helipad on the central block
    mb.cyl(cx, cy, zc + 0.24, 7.5, 7.5, 0.12, M('Helipad'), segs=32)
    mb.cyl(cx, cy, zc + 0.36, 6.5, 6.5, 0.03, M('Marking_White'), segs=32)
    mb.cyl(cx, cy, zc + 0.39, 5.9, 5.9, 0.03, M('Helipad'), segs=32)
    mb.box(cx - 2.0, cy, zc + 0.42, 0.6, 5.0, 0.03, M('Marking_White'))
    mb.box(cx + 2.0, cy, zc + 0.42, 0.6, 5.0, 0.03, M('Marking_White'))
    mb.box(cx, cy, zc + 0.42, 3.4, 0.6, 0.03, M('Marking_White'))
    for k in range(3):
        mb.box(cx - 8 + k * 2.5, cy + 9, zc + 0.24, 1.6, 1.2, 1.3, M('Metal_Grey'))
    mb.box(cx - 8, cy - 8, zc + 0.24, 5, 4, 2.8, M('Roof_Dark'))
    # emergency entrance on the west (Al Arouba side): canopy + red band + emblem
    zb = SIDEWALK_H + PLINTH
    ex = cx - 22
    for yy in (cy - 8, cy - 2, cy + 4, cy + 10):
        mb.cyl(ex - 6, yy, zb, 0.32, 0.32, 5.0, M('Mullion_Light'), segs=12)
        mb.cyl(ex - 11.5, yy, zb, 0.32, 0.32, 5.0, M('Mullion_Light'), segs=12)
    mb.box(ex - 7.5, cy + 1, zb + 5.0, 10.5, 22, 0.5, wm)
    mb.box(ex - 7.5, cy + 1, zb + 5.5, 10.9, 22.4, 0.2, rm)
    mb.box(ex - 7.5, cy + 1, zb + 0.02, 10.5, 22, 0.1, M('Paving'))
    for k in range(4):
        mb.box(ex - 7.5, cy - 8 + k * 6, zb + 0.13, 8.5, 0.15, 0.01, M('Marking_White'))
    # red crescent emblem on the central block's west wall
    F = Facade(mb, cx, cy, 22, 24, '-x', zb)
    pts_out = [(F.L / 2 + 2.6 * math.cos(a), 20 + 2.6 * math.sin(a)) for a in [2 * math.pi * i / 28 for i in range(28)]]
    pts_in = [(F.L / 2 + 0.6 + 2.05 * math.cos(a), 20 + 2.05 * math.sin(a)) for a in [2 * math.pi * i / 28 for i in range(28)]]
    for i in range(28):
        j = (i + 1) % 28
        a, b, c, d = pts_out[i], pts_out[j], pts_in[j], pts_in[i]
        mb.quad(F.pt(a[0], -0.08, a[1]), F.pt(b[0], -0.08, b[1]), F.pt(c[0], -0.08, c[1]), F.pt(d[0], -0.08, d[1]), rm)
    mb.box(cx - 11.1, cy, zb + 22.2, 0.2, 18, 0.9, rm)
    # signage board on the roof edge
    mb.box(cx, cy - 12.4, zc + 0.3, 14, 0.4, 2.2, wm)
    mb.box(cx, cy - 12.65, zc + 1.1, 12.6, 0.1, 0.9, rm)
    return mb.build(name, coll)


# ----------------------------------------------------------------------------
# Heritage-style community hall with barjeel, and a retail centre
# ----------------------------------------------------------------------------

def community_hall(name, coll, cx, cy, w=18, d=16):
    mb = MB()
    fm, tm, gm = M('Facade_Sand'), M('Trim'), M('Glass_Dark')
    z0 = SIDEWALK_H
    mb.box(cx, cy, z0, w + 4, d + 4, PLINTH, M('Plaza'))
    zb = z0 + PLINTH
    H = 8.4
    mb.box(cx, cy, zb, w, d, H, fm)
    for side in ('-y', '+y', '-x', '+x'):
        F = Facade(mb, cx, cy, w, d, side, zb)
        nb = int(F.L / 3.4)
        bay = F.L / nb
        for f in range(2):
            for k in range(nb):
                u0 = k * bay + bay / 2 - 0.8
                if f == 0 and side == '-y' and k == nb // 2:
                    F.arch_recess(u0 - 0.6, u0 + 2.2, 0, 3.4, -0.02, gm, tm)
                else:
                    F.arch_recess(u0, u0 + 1.6, f * 4.0 + 1.0, f * 4.0 + 3.2, -0.02, gm, tm)
        F.box(0, F.L, -0.25, 0, 3.9, 4.15, tm)
    _rooftop(mb, cx, cy, w, d, zb + H, fm, merlons=True, tank=False, core=False)
    barjeel(mb, cx + w / 2 - 2.5, cy - d / 2 + 2.5, zb + H + 0.2, size=3.2, h=6.0, m=fm)
    barjeel(mb, cx - w / 2 + 2.5, cy + d / 2 - 2.5, zb + H + 0.2, size=3.2, h=6.0, m=fm)
    return mb.build(name, coll)


def retail_centre(name, coll, cx, cy, w=18, d=12):
    mb = MB()
    fm, tm, gm = M('Facade_White'), M('Trim'), M('Glass_Blue')
    z0 = SIDEWALK_H
    mb.box(cx, cy, z0, w + 4, d + 4, PLINTH, M('Plaza'))
    zb = z0 + PLINTH
    H = 9.8
    mb.box(cx, cy, zb + 4.6, w, d, H - 4.6, fm)
    for side in ('-y', '+y', '-x', '+x'):
        F = Facade(mb, cx, cy, w, d, side, zb)
        L = F.L
        nb = max(2, int(L / 4.0))
        bay = L / nb
        for k in range(nb + 1):
            u = k * bay
            F.box(max(0, u - 0.25), min(L, u + 0.25), 0, 0.5, 0, 4.6, tm)
        for k in range(nb):
            F.panel(k * bay + 0.25, (k + 1) * bay - 0.25, 0.1, 3.6, 0.25, gm)
            F.box(k * bay + 0.25, (k + 1) * bay - 0.25, -0.12, 0.25, 3.6, 4.6, M('Sign_Blue') if k % 2 else M('Sign_Green'))
        for f in range(2):
            zf = 4.6 + f * 2.6
            F.box(0, L, -0.35, 0, zf - 0.1, zf + 0.1, tm)
            for k in range(nb):
                F.panel(k * bay + 0.4, (k + 1) * bay - 0.4, zf + 0.5, zf + 2.1, 0.3, gm)
    mb.box(cx, cy, zb + H, w + 0.4, d + 0.4, 0.5, tm)
    mb.box(cx, cy, zb + H + 0.5, w - 1, d - 1, 0.04, M('Roof'))
    mb.box(cx - w / 4, cy, zb + H + 0.5, 3, 3, 2.2, M('Roof_Dark'))
    return mb.build(name, coll)
