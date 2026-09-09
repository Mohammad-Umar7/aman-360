"""AMAN 360 district generator — streets, landscaping, props, vehicles, people, corniche (v2)."""

EXTENT = 150
ROAD_W_MAIN = 16
ROAD_W_SEC = 14
ROAD_W_CROSS = 12
ROAD_Z = 0.06
SIDEWALK_W = 3.2
SIDEWALK_H = 0.18
SOUTH_END = -70.0          # north-south streets stop at the Corniche
DIP_DEPTH = 2.2
DIP_START, DIP_FLAT_A, DIP_FLAT_B, DIP_END = -48.0, -32.0, 42.0, 58.0
NODES_EW = (0.0, 64.0, -64.0)
NODES_NS = (-72.0, 72.0)


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


def M(n):
    return MATS[n]


# ----------------------------------------------------------------------------
# Ground, sea, beach, promenade
# ----------------------------------------------------------------------------

def build_ground(coll):
    """Ground plane with the sunken underpass left open (otherwise it would cap the trough at street level)."""
    mb = MB()
    e = EXTENT + 40
    hw = ROAD_W_MAIN / 2
    x0, x1 = DIP_START - 3, DIP_END + 3
    g = M('Ground_Sand')
    mb.quad((-e, hw, 0), (e, hw, 0), (e, e, 0), (-e, e, 0), g)          # north of Al Majaz Road
    mb.quad((-e, -81, 0), (e, -81, 0), (e, -hw, 0), (-e, -hw, 0), g)    # south of Al Majaz Road
    mb.quad((-e, -hw, 0), (x0, -hw, 0), (x0, hw, 0), (-e, hw, 0), g)    # under the road, west of the dip
    mb.quad((x1, -hw, 0), (e, -hw, 0), (e, hw, 0), (x1, hw, 0), g)      # under the road, east of the dip
    mb.build('Ground', coll)
    b = MB()
    b.box(0, -84.5, -0.12, 2 * e, 7, 0.12, M('Beach'))
    b.box(0, -76, 0, 2 * e, 10, 0.16, M('Paving'))          # promenade
    b.box(0, -80.8, 0, 2 * e, 0.8, 1.0, M('Concrete'))      # sea wall
    b.build('Promenade', coll)
    s = MB()
    s.quad((-e, -200, -0.35), (e, -200, -0.35), (e, -88, -0.35), (-e, -88, -0.35), M('Sea'))
    s.build('Sea', coll)


# ----------------------------------------------------------------------------
# Roads
# ----------------------------------------------------------------------------

def _dashes_x(mb, y, x0, x1, z_fn, m, dash=3.0, gap=3.0, w=0.18):
    x = x0
    while x < x1 - 1:
        mb.box(x + dash / 2, y, z_fn(x + dash / 2) + 0.004, dash, w, 0.006, m)
        x += dash + gap


def _dashes_y(mb, x, y0, y1, m, dash=3.0, gap=3.0, w=0.18):
    y = y0
    while y < y1 - 1:
        mb.box(x, y + dash / 2, ROAD_Z + 0.004, w, dash, 0.006, m)
        y += dash + gap


def _zebra(mb, cx, cy, along='x', width=14.0, offset=0.0):
    """Zebra crossing centred at (cx, cy); bars run across the road."""
    for k in range(int(width / 1.4)):
        t = -width / 2 + 0.7 + k * 1.4
        if along == 'x':
            mb.box(cx + offset, cy + t, ROAD_Z + 0.004, 3.0, 0.7, 0.006, M('Marking_White'))
        else:
            mb.box(cx + t, cy + offset, ROAD_Z + 0.004, 0.7, 3.0, 0.006, M('Marking_White'))


def _jersey_profile(z):
    return [(-0.35, z), (0.35, z), (0.28, z + 0.35), (0.12, z + 0.85), (-0.12, z + 0.85), (-0.28, z + 0.35)]


def build_roads(coll):
    e = EXTENT
    # --- Al Majaz Road strip with the sunken underpass
    mb = MB()
    step = 2.0
    xs = [-e + i * step for i in range(int(2 * e / step) + 1)]
    hw = ROAD_W_MAIN / 2.0
    verts, faces = [], []
    for x in xs:
        z = ROAD_Z + dip(x)
        verts.append((x, -hw, z))
        verts.append((x, hw, z))
    for i in range(len(xs) - 1):
        a = 2 * i
        faces.append((a, a + 2, a + 3, a + 1))
    mb.add(verts, faces, M('Asphalt'))
    mb.build('Road_AlMajaz', coll)

    wb = MB()
    wall_top = ROAD_Z + 0.02
    for i in range(len(xs) - 1):
        x0, x1 = xs[i], xs[i + 1]
        z0, z1 = ROAD_Z + dip(x0), ROAD_Z + dip(x1)
        if z0 > ROAD_Z - 0.001 and z1 > ROAD_Z - 0.001:
            continue
        wb.quad((x0, -hw, z0), (x1, -hw, z1), (x1, -hw, wall_top), (x0, -hw, wall_top), M('Concrete'))
        wb.quad((x1, hw, z1), (x0, hw, z0), (x0, hw, wall_top), (x1, hw, wall_top), M('Concrete'))
    for sy in (-1, 1):
        wb.box((DIP_START + DIP_END) / 2, sy * (hw + 0.35), ROAD_Z, DIP_END - DIP_START, 0.7, 1.0, M('Concrete'))
        # railing on top of the coping
        x = DIP_START + 1
        while x < DIP_END:
            wb.box(x, sy * (hw + 0.35), ROAD_Z + 1.0, 0.08, 0.08, 1.0, M('Metal_Dark'))
            x += 2.5
        wb.box((DIP_START + DIP_END) / 2, sy * (hw + 0.35), ROAD_Z + 1.95, DIP_END - DIP_START, 0.1, 0.08, M('Metal_Dark'))
        wb.box((DIP_START + DIP_END) / 2, sy * (hw + 0.35), ROAD_Z + 1.5, DIP_END - DIP_START, 0.06, 0.06, M('Metal_Dark'))
        # wall panel joints and wall-mounted lights
        x = DIP_START + 4
        while x < DIP_END - 2:
            z = ROAD_Z + dip(x)
            if z < ROAD_Z - 0.6:
                wb.box(x, sy * (hw - 0.03), z + 0.2, 0.08, 0.06, ROAD_Z - z - 0.3, M('Metal_Dark'))
                if int(x) % 12 == 0:
                    wb.box(x, sy * (hw - 0.12), ROAD_Z - 0.8, 1.4, 0.22, 0.28, M('Lamp'))
            x += 4
    # central jersey barrier following the dip
    rings = []
    for x in xs:
        if x < DIP_START - 10 or x > DIP_END + 10:
            continue
        z = ROAD_Z + dip(x)
        rings.append([(x, y, zz) for (y, zz) in _jersey_profile(z)])
    wb.loft(rings, M('Concrete'), smooth=False, cap_start=True, cap_end=True)
    # drainage grates at the low point, and gantry signs at each approach
    for gx in (-20, -8, 4, 16, 28):
        for sy in (-1, 1):
            wb.box(gx, sy * 5.5, ROAD_Z - DIP_DEPTH + 0.002, 1.6, 0.6, 0.02, M('Metal_Dark'))
    for gx in (DIP_START - 14, DIP_END + 14):
        for sy in (-1, 1):
            wb.cyl(gx, sy * (hw + 1.2), SIDEWALK_H, 0.25, 0.25, 6.5, M('Metal_Grey'), segs=10)
        wb.box(gx, 0, SIDEWALK_H + 6.5, 0.5, 2 * hw + 2.4, 0.5, M('Metal_Grey'))
        wb.box(gx, 0, SIDEWALK_H + 5.2, 0.12, 6.0, 1.3, M('Sign_Green'))
        wb.box(gx, 0, SIDEWALK_H + 5.2, 0.12, 6.0, 1.3, M('Sign_Green'))
    wb.build('Underpass_Walls', coll)

    # --- flat roads
    rb = MB()
    rb.box(0, 64, 0.0, 2 * e, ROAD_W_SEC, ROAD_Z, M('Asphalt'))
    rb.box(0, -64, 0.0, 2 * e, ROAD_W_SEC, ROAD_Z, M('Asphalt'))
    for xx in NODES_NS:
        rb.box(xx, (SOUTH_END + e) / 2, 0.0, ROAD_W_CROSS, e - SOUTH_END, ROAD_Z, M('Asphalt'))
    rb.build('Roads', coll)

    # --- medians (raised, landscaped) on the boulevards
    md = MB()
    mw = 3.6

    def median_x(y, x0, x1):
        md.box((x0 + x1) / 2, y, 0.0, x1 - x0, mw, 0.28, M('Curb'))
        md.box((x0 + x1) / 2, y, 0.28, x1 - x0 - 0.6, mw - 0.6, 0.08, M('Grass'))
        x = x0 + 3
        while x < x1 - 2:
            md.box(x, y, 0.36, 2.2, 1.0, 0.7, M('Hedge'))
            x += 6
        x = x0 + 4.5
        while x < x1 - 3:
            for k in range(3):
                md.sphere(x + RND.uniform(-0.8, 0.8), y + RND.uniform(-1.1, 1.1), 0.5, 0.22, M(('Flower_Red', 'Flower_Yellow', 'Flower_Pink')[k]), segs=6, rings=4)
            x += 6

    for y in (64, -64):
        for (x0, x1) in ((-e, -84), (-60, 60), (84, e)):
            median_x(y, x0, x1)
    for (x0, x1) in ((-e, -84), (84, e)):
        median_x(0, x0, x1)
    md.build('Medians', coll)

    # --- markings
    mk = MB()
    mw_ = M('Marking_White')
    _dashes_x(mk, 0, -e + 2, e - 2, lambda x: ROAD_Z + dip(x), mw_)
    for yy in (4.2, -4.2):
        _dashes_x(mk, yy, -e + 2, e - 2, lambda x: ROAD_Z + dip(x), mw_, dash=2.0, gap=4.0, w=0.14)
    for yy in (64, -64):
        for ly in (yy - 3.6, yy + 3.6):
            _dashes_x(mk, ly, -e + 2, e - 2, lambda x: ROAD_Z, mw_, dash=2.0, gap=4.0, w=0.14)
    for xx in NODES_NS:
        _dashes_y(mk, xx, SOUTH_END + 2, e - 2, mw_)
        for lx in (xx - 3.0, xx + 3.0):
            _dashes_y(mk, lx, SOUTH_END + 2, e - 2, mw_, dash=2.0, gap=4.0, w=0.14)
    # edge lines on Al Majaz (follow the dip)
    for yy in (-hw + 0.4, hw - 0.4):
        x = -e
        while x < e:
            mk.box(x + 1, yy, ROAD_Z + dip(x + 1) + 0.004, 2.0, 0.15, 0.006, M('Marking_Yellow'))
            x += 2.0
    # zebra crossings at every intersection
    for yy in NODES_EW:
        for xx in NODES_NS:
            _zebra(mk, xx, yy, along='x', width=ROAD_W_MAIN if yy == 0 else ROAD_W_SEC, offset=-(ROAD_W_CROSS / 2 + 2.2))
            _zebra(mk, xx, yy, along='x', width=ROAD_W_MAIN if yy == 0 else ROAD_W_SEC, offset=(ROAD_W_CROSS / 2 + 2.2))
            _zebra(mk, xx, yy, along='y', width=ROAD_W_CROSS, offset=-((ROAD_W_MAIN if yy == 0 else ROAD_W_SEC) / 2 + 2.2))
            _zebra(mk, xx, yy, along='y', width=ROAD_W_CROSS, offset=((ROAD_W_MAIN if yy == 0 else ROAD_W_SEC) / 2 + 2.2))
    mk.build('Markings', coll)


# ----------------------------------------------------------------------------
# Sidewalks, verges, crossings furniture, signals, lamps
# ----------------------------------------------------------------------------

def build_sidewalks(coll):
    e = EXTENT
    sb = MB()
    m = M('Sidewalk')
    w = SIDEWALK_W
    hw = ROAD_W_MAIN / 2
    for sy in (-1, 1):
        sb.box(0, sy * (hw + w / 2), 0, 2 * e, w, SIDEWALK_H, m)
        sb.box(0, sy * (hw + 0.1), 0, 2 * e, 0.2, SIDEWALK_H + 0.02, M('Curb'))
        sb.box(0, sy * (hw + w + 0.9), 0, 2 * e, 1.8, 0.14, M('Grass'))
    hs = ROAD_W_SEC / 2
    for yy in (64, -64):
        for sy in (-1, 1):
            sb.box(0, yy + sy * (hs + w / 2), 0, 2 * e, w, SIDEWALK_H, m)
            sb.box(0, yy + sy * (hs + 0.1), 0, 2 * e, 0.2, SIDEWALK_H + 0.02, M('Curb'))
            if not (yy == -64 and sy == -1):
                sb.box(0, yy + sy * (hs + w + 0.9), 0, 2 * e, 1.8, 0.14, M('Grass'))
    hc = ROAD_W_CROSS / 2
    L = e - SOUTH_END
    for xx in NODES_NS:
        for sx in (-1, 1):
            sb.box(xx + sx * (hc + w / 2), (SOUTH_END + e) / 2, 0, w, L, SIDEWALK_H, m)
            sb.box(xx + sx * (hc + 0.1), (SOUTH_END + e) / 2, 0, 0.2, L, SIDEWALK_H + 0.02, M('Curb'))
    sb.build('Sidewalks', coll)

    # pedestrian bridge over the underpass with stairs and railings
    pb = MB()
    c = M('Concrete')
    span = 2 * (hw + w) + 2
    pb.box(6, 0, 6.0, 3.6, span, 0.45, c)
    for sy in (-1, 1):
        pb.box(6, sy * (hw + w + 0.6), 0, 3.6, 1.2, 6.0, c)
        y0 = sy * (hw + w + 1.2)
        for k in range(8):
            pb.box(6, y0 + sy * (0.9 + k * 1.1), 0, 3.6, 1.1, 0.75 * (k + 1), c)
        for x in (4.3, 7.7):
            for k in range(int(span / 1.5) + 1):
                pb.box(x, -span / 2 + k * 1.5, 6.45, 0.07, 0.07, 1.1, M('Metal_Dark'))
            pb.box(x, 0, 7.5, 0.06, span, 0.06, M('Metal_Dark'))
            pb.box(x, 0, 7.0, 0.05, span, 0.05, M('Metal_Dark'))
    pb.build('Pedestrian_Bridge', coll)

    # traffic signals + street-name signs at every intersection
    ts = MB()
    for yy in NODES_EW:
        for xx in NODES_NS:
            rw = (ROAD_W_MAIN if yy == 0 else ROAD_W_SEC) / 2
            for sx in (-1, 1):
                for sy in (-1, 1):
                    px, py = xx + sx * (hc + 1.0), yy + sy * (rw + 1.0)
                    ts.cyl(px, py, SIDEWALK_H, 0.16, 0.12, 6.2, M('Metal_Dark'), segs=10)
                    # arm over the road toward the intersection
                    ax = -sx
                    ts.box(px + ax * 2.6, py, SIDEWALK_H + 5.9, 5.4, 0.16, 0.16, M('Metal_Dark'))
                    hx = px + ax * 5.0
                    ts.box(hx, py, SIDEWALK_H + 4.4, 0.45, 0.35, 1.3, M('Metal_Dark'))
                    ts.box(hx, py - sy * 0.19, SIDEWALK_H + 5.4, 0.28, 0.04, 0.28, M('Signal_Red'))
                    ts.box(hx, py - sy * 0.19, SIDEWALK_H + 5.0, 0.28, 0.04, 0.28, M('Signal_Amber'))
                    ts.box(hx, py - sy * 0.19, SIDEWALK_H + 4.6, 0.28, 0.04, 0.28, M('Signal_Green'))
                    ts.box(px + sx * 0.4, py, SIDEWALK_H + 2.6, 0.7, 0.06, 0.3, M('Sign_Blue'))
    ts.build('Signals', coll)

    # lamps: double-arm on medians, single-arm on sidewalks, globe lamps on the promenade
    lb = MB()
    pm, lm = M('Metal_Grey'), M('Lamp')

    def lamp_single(x, y, toward, h=9.5):
        lb.lathe([(0.32, 0), (0.32, 0.5), (0.18, 0.7), (0.14, h)], x, y, SIDEWALK_H, pm, segs=10)
        dx, dy = toward
        lb.box(x + dx * 1.3, y + dy * 1.3, SIDEWALK_H + h - 0.2, 2.8 if dx else 0.14, 2.8 if dy else 0.14, 0.14, pm)
        lb.box(x + dx * 2.5, y + dy * 2.5, SIDEWALK_H + h - 0.55, 1.0, 0.5, 0.32, lm)

    def lamp_double(x, y, along='x', h=11.0):
        lb.lathe([(0.34, 0), (0.34, 0.5), (0.2, 0.7), (0.15, h)], x, y, 0.36, pm, segs=10)
        if along == 'x':
            lb.box(x, y, 0.36 + h - 0.2, 0.14, 5.6, 0.14, pm)
            for s in (-1, 1):
                lb.box(x, y + s * 2.6, 0.36 + h - 0.55, 0.5, 1.0, 0.32, lm)

    x = -e + 12
    while x < e - 8:
        if not (-56 < x < 66):
            lamp_single(x, -(hw + w - 0.6), (0, 1))
            lamp_single(x + 12, (hw + w - 0.6), (0, -1))
        x += 24
    for yy in (64, -64):
        x = -e + 14
        while x < e - 8:
            if abs(x - 72) > 10 and abs(x + 72) > 10:
                lamp_double(x, yy, 'x')
            x += 22
    for xx in NODES_NS:
        y = SOUTH_END + 12
        while y < e - 8:
            if abs(y) > 10 and abs(abs(y) - 64) > 10:
                lamp_single(xx - (hc + w - 0.6), y, (1, 0))
                lamp_single(xx + (hc + w - 0.6), y + 12, (-1, 0))
            y += 24
    x = -e + 8
    while x < e:
        lb.lathe([(0.3, 0), (0.3, 0.4), (0.14, 0.6), (0.1, 4.6), (0.22, 4.7)], x, -79.3, 0.16, pm, segs=10)
        lb.sphere(x, -79.3, 5.2, 0.45, M('Lamp_Globe'), segs=12, rings=8)
        x += 24
    lb.build('Streetlights', coll)


# ----------------------------------------------------------------------------
# Vegetation
# ----------------------------------------------------------------------------

def palm(mb, x, y, h=None, lean=0.0):
    h = h or RND.uniform(6.5, 10.0)
    tm, lm = M('Palm_Trunk'), M('Palm_Leaf')
    prof = []
    n = 9
    for k in range(n + 1):
        t = k / n
        r = 0.42 * (1 - 0.35 * t) * (1.0 + (0.12 if k % 2 else 0.0))
        prof.append((r, h * t))
    mb.lathe(prof, x, y, SIDEWALK_H, tm, segs=8, cap=True)
    mb.sphere(x, y, SIDEWALK_H + h + 0.1, 0.5, M('Dates'), segs=8, rings=5)
    fronds = 11
    for i in range(fronds):
        yaw = i * (2 * math.pi / fronds) + RND.uniform(-0.15, 0.15)
        pitch = math.radians(RND.uniform(8, 22))
        seg_len = 1.35
        px, py, pz = x, y, SIDEWALK_H + h + 0.25
        wid = 0.95
        for s in range(4):
            pitch += math.radians(11 + s * 5)
            dx, dy, dz = math.cos(yaw) * math.cos(pitch), math.sin(yaw) * math.cos(pitch), -math.sin(pitch)
            cx_, cy_, cz_ = px + dx * seg_len / 2, py + dy * seg_len / 2, pz + dz * seg_len / 2
            mb.boxc(cx_, cy_, cz_, seg_len, wid * (1 - s * 0.2), 0.06, lm if s % 2 else M('Palm_Leaf2'), yaw=yaw, pitch=pitch)
            px, py, pz = px + dx * seg_len, py + dy * seg_len, pz + dz * seg_len


def tree(mb, x, y, h=None):
    h = h or RND.uniform(4.5, 6.5)
    mb.lathe([(0.35, 0), (0.28, h * 0.55), (0.18, h * 0.7)], x, y, SIDEWALK_H, M('Palm_Trunk'), segs=8)
    for k in range(3):
        a = k * 2.1
        mb.sphere(x + math.cos(a) * 1.1, y + math.sin(a) * 1.1, SIDEWALK_H + h * 0.72 + k * 0.5, h * 0.36, M('Tree_Leaf') if k % 2 else M('Tree_Leaf2'), segs=10, rings=7, sz=0.85)
    mb.sphere(x, y, SIDEWALK_H + h * 0.9, h * 0.34, M('Tree_Leaf'), segs=10, rings=7, sz=0.8)


def build_vegetation(coll):
    e = EXTENT
    mb = MB()
    hw = ROAD_W_MAIN / 2 + SIDEWALK_W + 0.9
    x = -e + 20
    while x < e - 10:
        if not (-56 < x < 66):
            palm(mb, x, -hw)
            palm(mb, x + 8, hw)
        x += 20
    hs = ROAD_W_SEC / 2 + SIDEWALK_W + 0.9
    for yy in (64, -64):
        x = -e + 6
        while x < e - 10:
            if abs(x - 72) > 12 and abs(x + 72) > 12:
                palm(mb, x, yy - hs)
                if yy == 64 or True:
                    palm(mb, x + 10, yy + hs)
            x += 20
    # medians: palms every 18 m
    for yy in (64, -64):
        x = -e + 9
        while x < e - 5:
            if abs(x - 72) > 14 and abs(x + 72) > 14:
                palm(mb, x, yy, h=RND.uniform(5.5, 7.5))
            x += 18
    for x0 in (-e + 9, 84 + 9):
        x = x0
        while x < (x0 + 57):
            palm(mb, x, 0, h=RND.uniform(5.5, 7.5))
            x += 18
    # promenade rows
    x = -e + 4
    while x < e:
        palm(mb, x, -74, h=RND.uniform(8, 11))
        x += 12
    # trees along the cross streets and in the tower plazas
    for xx in NODES_NS:
        y = SOUTH_END + 20
        while y < e - 10:
            if abs(y) > 14 and abs(abs(y) - 64) > 14:
                tree(mb, xx - (ROAD_W_CROSS / 2 + SIDEWALK_W + 1.2), y)
                tree(mb, xx + (ROAD_W_CROSS / 2 + SIDEWALK_W + 1.2), y + 10)
            y += 20
    for (tx, ty) in ((-30, 82), (30, 82), (-128, 84), (128, 84), (-72 + 22, 132), (72 - 22, 132), (-40, -100), (0, -104)):
        tree(mb, tx, ty)
    mb.build('Palms', coll)


# ----------------------------------------------------------------------------
# Props: bus stop, VMS, barriers, benches, bins, corniche pier, boats, rocks
# ----------------------------------------------------------------------------

def build_props(coll):
    pm = M('Metal_Grey')
    mb = MB()
    bx, by = -40, -13.5
    mb.box(bx, by, SIDEWALK_H + 2.7, 5.4, 2.2, 0.16, M('Sign_Blue'))
    for dx in (-2.4, 2.4):
        mb.box(bx + dx, by + 0.9, SIDEWALK_H, 0.12, 0.12, 2.7, pm)
        mb.box(bx + dx, by - 0.9, SIDEWALK_H, 0.12, 0.12, 2.7, pm)
    mb.box(bx, by + 0.95, SIDEWALK_H + 0.3, 5.2, 0.05, 2.3, M('Glass_Dark'))
    mb.box(bx, by + 0.4, SIDEWALK_H + 0.45, 3.4, 0.5, 0.08, M('Bench'))
    mb.box(bx + 3.2, by + 0.9, SIDEWALK_H, 0.1, 0.1, 3.2, pm)
    mb.box(bx + 3.2, by + 0.9, SIDEWALK_H + 3.2, 0.6, 0.08, 0.5, M('Sign_Blue'))
    mb.build('BusStop', coll)

    sb = MB()
    sx, sy = -104, -12.5
    for yy in (sy, sy + 3.0):
        sb.lathe([(0.34, 0), (0.34, 0.3), (0.26, 0.5), (0.26, 6.5)], sx, yy, SIDEWALK_H, pm, segs=10)
    sb.box(sx, sy + 1.5, SIDEWALK_H + 6.5, 0.9, 3.4, 0.4, pm)
    sb.box(sx, sy + 1.5, SIDEWALK_H + 6.9, 0.6, 7.0, 3.0, M('Metal_Grey'))
    sb.build('VMS_Frame', coll)
    scr = MB()
    scr.box(sx - 0.34, sy + 1.5, SIDEWALK_H + 7.15, 0.04, 6.4, 2.5, M('Screen'))
    scr.build('VMS_Screen', coll)

    for name, xx in (('Barrier_W', DIP_START - 6), ('Barrier_E', DIP_END + 6)):
        b = MB()
        for i, yy in enumerate((-5.4, -1.8, 1.8, 5.4)):
            m = M('Barrier_Red') if i % 2 == 0 else M('Barrier_White')
            b.box(xx, yy, ROAD_Z, 0.5, 3.4, 1.1, m)
            b.box(xx, yy, ROAD_Z + 1.1, 0.4, 3.4, 0.08, M('Barrier_White'))
            b.box(xx, yy - 1.5, ROAD_Z, 0.6, 0.3, 0.3, M('Metal_Dark'))
            b.box(xx, yy + 1.5, ROAD_Z, 0.6, 0.3, 0.3, M('Metal_Dark'))
        b.box(xx, 0, ROAD_Z + 1.2, 0.3, 4.0, 0.9, M('Sign_Blue'))
        b.box(xx, 0, ROAD_Z + 2.1, 0.32, 1.2, 0.5, M('Barrier_Red'))
        ob = b.build(name, coll)
        ob.hide_render = True
        ob.hide_viewport = True

    # corniche furniture: benches, bins, railing
    cb = MB()
    x = -EXTENT + 10
    while x < EXTENT:
        cb.box(x, -73.5, 0.16 + 0.42, 2.0, 0.5, 0.06, M('Bench'))
        cb.box(x, -73.25, 0.16 + 0.48, 2.0, 0.06, 0.5, M('Bench'))
        for dx in (-0.8, 0.8):
            cb.box(x + dx, -73.5, 0.16, 0.08, 0.5, 0.42, M('Metal_Dark'))
        cb.cyl(x + 3, -78.5, 0.16, 0.28, 0.28, 0.9, M('Metal_Dark'), segs=10)
        x += 20
    for k in range(int(2 * EXTENT / 1.8) + 1):
        cb.box(-EXTENT + k * 1.8, -80.5, 1.0, 0.06, 0.06, 1.05, M('Metal_Dark'))
    cb.box(0, -80.5, 2.02, 2 * EXTENT, 0.06, 0.06, M('Metal_Dark'))
    cb.box(0, -80.5, 1.55, 2 * EXTENT, 0.04, 0.04, M('Metal_Dark'))
    # pier with kiosk
    px = -40
    cb.box(px, -96, 0.35, 6.0, 32, 0.4, M('Paving'))
    for y in range(-84, -112, -6):
        for dx in (-2.4, 2.4):
            cb.cyl(px + dx, y, -0.4, 0.3, 0.3, 0.8, M('Concrete'), segs=8)
    for dx in (-2.9, 2.9):
        for k in range(18):
            cb.box(px + dx, -82 - k * 1.7, 0.75, 0.06, 0.06, 1.0, M('Metal_Dark'))
        cb.box(px + dx, -96, 1.72, 0.06, 32, 0.06, M('Metal_Dark'))
    cb.box(px, -108, 0.75, 4.6, 4.6, 3.0, M('Facade_White'))
    cb.box(px, -108, 3.75, 5.2, 5.2, 0.3, M('Trim'))
    cb.dome(px, -108, 4.05, 2.0, M('Trim'), segs=20)
    # boats
    for (bxx, byy, yaw) in ((-26, -98, 0.3), (-16, -104, -0.4), (12, -96, 1.2)):
        hull = [(-3.0, -1.0), (2.0, -1.0), (3.4, 0.0), (2.0, 1.0), (-3.0, 1.0)]
        cb.prism(hull, -0.45, 1.0, M('Boat'), cx=bxx, cy=byy, yaw=yaw)
        cb.boxc(bxx - 0.5 * math.cos(yaw), byy - 0.5 * math.sin(yaw), 0.95, 1.8, 1.4, 0.8, M('Boat_Trim'), yaw=yaw)
    # breakwater rocks
    for k in range(34):
        rx = RND.uniform(96, 150)
        ry = RND.uniform(-100, -90)
        r = RND.uniform(0.9, 2.2)
        cb.sphere(rx, ry, -0.4 + r * 0.3, r, M('Rock'), segs=7, rings=5, sz=0.6)
    cb.build('Corniche_Props', coll)


# ----------------------------------------------------------------------------
# Vehicles
# ----------------------------------------------------------------------------

def _placer(mb, cx, cy, yaw, z0):
    def b(ox, oy, oz, sx, sy, sz, m, pitch=0.0):
        rx = cx + ox * math.cos(yaw) - oy * math.sin(yaw)
        ry = cy + ox * math.sin(yaw) + oy * math.cos(yaw)
        mb.boxc(rx, ry, z0 + oz, sx, sy, sz, m, yaw=yaw, pitch=pitch)
    return b


def wheel(mb, x, y, z, yaw, r=0.34, w=0.24):
    n = 14
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
    mb.add(verts, faces, M('Tyre'), smooth=True)
    # rim disc slightly proud of the tyre on both sides
    rr = r * 0.62
    for k in (-w / 2 - 0.01, w / 2 + 0.01):
        ring = []
        for i in range(n):
            th = 2 * math.pi * i / n
            lx, ly, lz = rr * math.cos(th), k, rr * math.sin(th)
            ring.append((x + lx * math.cos(yaw) - ly * math.sin(yaw), y + lx * math.sin(yaw) + ly * math.cos(yaw), z + lz))
        mb.add(ring, [tuple(range(n)) if k > 0 else tuple(reversed(range(n)))], M('Rim'))


def sedan(mb, cx, cy, yaw, paint, z0=ROAD_Z, taxi=False):
    b = _placer(mb, cx, cy, yaw, z0)
    b(0, 0, 0.55, 4.5, 1.85, 0.5, paint)
    b(1.35, 0, 0.93, 1.75, 1.75, 0.26, paint, pitch=math.radians(-6))
    b(-1.55, 0, 0.95, 1.35, 1.75, 0.32, paint)
    b(-0.25, 0, 1.2, 2.3, 1.65, 0.46, paint)
    b(-0.25, 0, 1.47, 2.1, 1.6, 0.08, paint)
    b(0.98, 0, 1.2, 0.42, 1.55, 0.6, M('Glass_Dark'), pitch=math.radians(32))
    b(-1.42, 0, 1.2, 0.4, 1.5, 0.55, M('Glass_Dark'), pitch=math.radians(-34))
    for s in (-1, 1):
        b(-0.25, s * 0.83, 1.22, 2.0, 0.04, 0.38, M('Glass_Dark'))
        b(0.78, s * 1.0, 1.05, 0.2, 0.14, 0.12, paint)
        b(2.26, s * 0.62, 0.78, 0.08, 0.42, 0.2, M('Headlight'))
        b(-2.27, s * 0.62, 0.82, 0.08, 0.42, 0.18, M('Taillight'))
    b(2.3, 0, 0.5, 0.12, 1.8, 0.3, M('Metal_Dark'))
    b(-2.3, 0, 0.5, 0.12, 1.8, 0.3, M('Metal_Dark'))
    b(2.34, 0, 0.55, 0.02, 0.5, 0.12, M('Marking_White'))
    if taxi:
        b(-0.3, 0, 1.63, 0.6, 0.28, 0.22, M('Taxi_Sign'))
    for ox in (1.45, -1.45):
        for oy in (0.93, -0.93):
            rx = cx + ox * math.cos(yaw) - oy * math.sin(yaw)
            ry = cy + ox * math.sin(yaw) + oy * math.cos(yaw)
            wheel(mb, rx, ry, z0 + 0.34, yaw)


def suv(mb, cx, cy, yaw, paint, z0=ROAD_Z, police=False):
    b = _placer(mb, cx, cy, yaw, z0)
    b(0, 0, 0.72, 4.8, 1.95, 0.72, paint)
    b(-0.35, 0, 1.45, 2.9, 1.8, 0.75, paint)
    b(-0.35, 0, 1.86, 2.7, 1.75, 0.08, paint)
    b(1.25, 0, 1.45, 0.42, 1.7, 0.7, M('Glass_Dark'), pitch=math.radians(30))
    b(-1.82, 0, 1.45, 0.3, 1.7, 0.7, M('Glass_Dark'), pitch=math.radians(-12))
    for s in (-1, 1):
        b(-0.35, s * 0.9, 1.5, 2.6, 0.04, 0.55, M('Glass_Dark'))
        b(0.9, s * 1.06, 1.3, 0.22, 0.14, 0.14, paint)
        b(2.42, s * 0.65, 0.95, 0.08, 0.45, 0.22, M('Headlight'))
        b(-2.42, s * 0.7, 1.0, 0.08, 0.4, 0.28, M('Taillight'))
        if police:
            b(0, s * 0.99, 0.72, 4.6, 0.02, 0.22, M('Stripe_Red'))
            b(0, s * 0.99, 0.5, 4.6, 0.02, 0.1, M('Stripe_Blue'))
    b(2.45, 0, 0.55, 0.14, 1.9, 0.35, M('Metal_Dark'))
    b(-2.45, 0, 0.55, 0.14, 1.9, 0.35, M('Metal_Dark'))
    if police:
        b(-0.4, 0, 1.98, 1.3, 1.4, 0.16, M('Metal_Dark'))
        b(-0.4, 0.42, 2.1, 0.6, 0.42, 0.14, M('Light_Red'))
        b(-0.4, -0.42, 2.1, 0.6, 0.42, 0.14, M('Light_Blue'))
    for ox in (1.55, -1.55):
        for oy in (0.98, -0.98):
            rx = cx + ox * math.cos(yaw) - oy * math.sin(yaw)
            ry = cy + ox * math.sin(yaw) + oy * math.cos(yaw)
            wheel(mb, rx, ry, z0 + 0.4, yaw, r=0.4, w=0.28)


def bus(mb, cx, cy, yaw, z0=ROAD_Z):
    b = _placer(mb, cx, cy, yaw, z0)
    b(0, 0, 1.85, 11.5, 2.5, 2.7, M('Bus_White'))
    b(0, 0, 0.75, 11.4, 2.45, 0.5, M('Bus_Blue'))
    for s in (-1, 1):
        b(0.6, s * 1.26, 2.35, 9.8, 0.04, 1.1, M('Glass_Dark'))
        b(5.72, s * 0.7, 1.1, 0.08, 0.5, 0.3, M('Headlight'))
        b(-5.72, s * 0.9, 1.4, 0.08, 0.3, 0.5, M('Taillight'))
    b(5.75, 0, 2.3, 0.06, 2.2, 1.6, M('Glass_Dark'))
    b(-5.75, 0, 2.3, 0.06, 2.2, 1.2, M('Glass_Dark'))
    b(-1.5, 0, 3.32, 3.0, 1.6, 0.3, M('Metal_Grey'))
    for ox in (3.6, -3.4):
        for oy in (1.2, -1.2):
            rx = cx + ox * math.cos(yaw) - oy * math.sin(yaw)
            ry = cy + ox * math.sin(yaw) + oy * math.cos(yaw)
            wheel(mb, rx, ry, z0 + 0.5, yaw, r=0.5, w=0.32)


def ambulance(mb, cx=0, cy=0, yaw=0.0, z0=0.0):
    b = _placer(mb, cx, cy, yaw, z0)
    wm, rm = M('Car_White'), M('Hospital_Red')
    b(0, 0, 0.95, 5.9, 2.15, 1.0, wm)
    b(-1.0, 0, 2.05, 3.7, 2.2, 1.6, wm)
    b(1.7, 0, 1.85, 1.6, 2.05, 1.1, wm)
    b(2.35, 0, 1.9, 0.3, 1.9, 0.9, M('Glass_Dark'), pitch=math.radians(28))
    b(1.55, 0, 1.87, 1.5, 2.06, 0.08, wm)
    for s in (-1, 1):
        b(-1.0, s * 1.11, 2.1, 3.6, 0.02, 0.32, rm)
        b(1.7, s * 1.04, 1.9, 1.2, 0.04, 0.6, M('Glass_Dark'))
        b(2.96, s * 0.72, 0.95, 0.08, 0.45, 0.28, M('Headlight'))
        b(-2.87, s * 0.85, 1.1, 0.08, 0.3, 0.6, M('Taillight'))
        # red crescent decal (flat ring of quads)
        n = 16
        for i in range(n):
            a0, a1 = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
            pts = []
            for (r, off, a) in ((0.42, 0.0, a0), (0.42, 0.0, a1), (0.32, 0.12, a1), (0.32, 0.12, a0)):
                ox = -0.9 + off + r * math.cos(a)
                oz = 2.15 + r * math.sin(a)
                oy = s * 1.125
                pts.append((cx + ox * math.cos(yaw) - oy * math.sin(yaw), cy + ox * math.sin(yaw) + oy * math.cos(yaw), z0 + oz))
            if s < 0:
                pts.reverse()
            mb.ngon(pts, rm)
    b(-0.9, 0, 2.97, 1.8, 1.5, 0.16, M('Metal_Dark'))
    b(-0.9, 0.48, 3.1, 0.7, 0.45, 0.16, M('Light_Red'))
    b(-0.9, -0.48, 3.1, 0.7, 0.45, 0.16, M('Light_Blue'))
    b(2.98, 0, 0.6, 0.14, 2.1, 0.35, M('Metal_Dark'))
    b(-2.98, 0, 0.6, 0.14, 2.1, 0.35, M('Metal_Dark'))
    for ox in (1.95, -1.75):
        for oy in (1.08, -1.08):
            rx = cx + ox * math.cos(yaw) - oy * math.sin(yaw)
            ry = cy + ox * math.sin(yaw) + oy * math.cos(yaw)
            wheel(mb, rx, ry, z0 + 0.42, yaw, r=0.42, w=0.3)


def build_vehicles(coll):
    def one(name, fn, *a, **k):
        mb = MB()
        fn(mb, 0, 0, 0.0, *a, **k)
        return mb.build(name, coll)

    one('Car_Ahmed', sedan, M('Car_Teal'), z0=0.0).location = (-128, -3.6, ROAD_Z)
    mb = MB(); ambulance(mb); mb.build('Ambulance', coll).location = (92, -30, ROAD_Z)
    one('Police_Car', suv, M('Car_White'), z0=0.0, police=True).location = (DIP_START - 12, 3.6, ROAD_Z)
    one('Car_Traffic_1', sedan, M('Car_Silver'), z0=0.0, taxi=True).location = (110, 60, ROAD_Z)
    one('Car_Traffic_2', suv, M('Car_Navy'), z0=0.0).location = (-100, -67.5, ROAD_Z)
    one('Car_Traffic_3', bus, z0=0.0).location = (0, 67.5, ROAD_Z)

    cars = MB()
    cols = [M('Car_White'), M('Car_Silver'), M('Car_Navy'), M('Car_Black'), M('Car_Beige'), M('Car_White'), M('Car_Grey'), M('Car_Red')]
    i = 0
    for x in range(-134, -66, 8):
        (sedan if i % 3 else suv)(cars, x, -6.4, 0.0, cols[i % len(cols)]); i += 1
    for x in range(74, 140, 8):
        (sedan if i % 3 else suv)(cars, x, 6.4, math.pi, cols[i % len(cols)]); i += 1
    for y in range(-56, -12, 8):
        sedan(cars, -72 - 4.5, y, math.pi / 2, cols[i % len(cols)]); i += 1
    for y in range(80, 140, 8):
        (sedan if i % 2 else suv)(cars, 72 + 4.5, y, -math.pi / 2, cols[i % len(cols)]); i += 1
    for x in range(-140, -84, 8):
        sedan(cars, x, -64 + 5.4, math.pi, cols[i % len(cols)]); i += 1
    for x in range(90, 146, 8):
        sedan(cars, x, 64 - 5.4, 0.0, cols[i % len(cols)], taxi=(i % 4 == 0)); i += 1
    cars.build('Parked_Cars', coll)


# ----------------------------------------------------------------------------
# People (simple, kandura / abaya)
# ----------------------------------------------------------------------------

def person(mb, x, y, yaw, female=False, z0=SIDEWALK_H):
    cloth = M('Abaya') if female else M('Kandura')
    mb.lathe([(0.2, 0), (0.24, 0.9), (0.2, 1.35), (0.13, 1.45), (0.08, 1.5)], x, y, z0, cloth, segs=10)
    mb.sphere(x, y, z0 + 1.62, 0.12, M('Skin'), segs=10, rings=6)
    if female:
        mb.sphere(x, y - 0.02, z0 + 1.66, 0.14, cloth, segs=10, rings=6, sz=0.9)
    else:
        mb.sphere(x, y, z0 + 1.68, 0.14, M('Kandura'), segs=10, rings=5, sz=0.6)
    for s in (-1, 1):
        mb.boxc(x + s * 0.28 * math.cos(yaw + math.pi / 2), y + s * 0.28 * math.sin(yaw + math.pi / 2), z0 + 1.05, 0.1, 0.1, 0.55, cloth)


def build_people(coll):
    mb = MB()
    spots = [(-42, -12.5, 0.4, False), (-38.5, -12.6, 2.6, True), (-45, -11.8, 1.0, False),
             (-20, -74, 0.2, False), (-18.5, -74.6, 3.0, True), (10, -73, 1.5, False), (40, -75, 2.0, True), (42, -74.2, 0.0, False),
             (-110, -50, 1.6, False), (-104, -49, 1.2, False), (-98, -51, 1.9, True),
             (84, -33, 0.0, True), (85.5, -31, 3.1, False), (14, 44, 0.5, False), (-60, 12, 2.2, True), (100, 8, 1.0, False), (-116, 6, 0.3, False)]
    for (x, y, yaw, f) in spots:
        person(mb, x, y, yaw, female=f, z0=(0.16 if y < -70 else SIDEWALK_H))
    mb.build('People', coll)
