#!/usr/bin/env python3
"""
Model a Macintosh 128K in Blender and export it as glTF.

Run with Blender-as-a-module (pip install bpy==4.2.0):

    python3 model/build_mac128k.py

Output: macintosh-history/assets/mac128k.glb

Why this exists: the first version of this site built the machine out of
three.js primitives at runtime. That works, but BoxGeometry and
ExtrudeGeometry cannot give you a proper fillet, and an edge that does not
catch a highlight is what makes CG read as plastic. Here every part gets a
real bevel, openings are boolean-cut rather than faked, and the case is one
solid that is then split — so the seam between bezel and housing is a true
seam.

Units: 1 Blender unit = 10 cm, matching the scene scale the web page already
uses, so the camera work carries over unchanged. Blender is Z-up and glTF is
Y-up; the exporter handles the conversion, so "front of the machine" is -Y
here and becomes +Z in three.js.
"""

import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector

# The real machine: 9.7" wide x 13.5" tall x 10.9" deep.
W, H, D = 2.46, 3.43, 2.77
OUT = Path(__file__).resolve().parent.parent / "macintosh-history" / "assets" / "mac128k.glb"


# --------------------------------------------------------------------------
# scene helpers
# --------------------------------------------------------------------------

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def box(name, size, loc=(0, 0, 0)):
    """An axis-aligned box, centred on loc."""
    # A size=1 cube already spans one unit, so the scale IS the dimension.
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return o


def cyl(name, r, depth, loc=(0, 0, 0), rot=(0, 0, 0), verts=32):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc,
                                        rotation=rot, vertices=verts)
    o = bpy.context.object
    o.name = name
    return o


def activate(o):
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o


def bevel(o, width=0.02, segments=3, angle=50):
    """A small bevel on every hard edge — the single biggest realism win."""
    activate(o)
    m = o.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(angle)
    # harden_normals writes custom split normals that then fight the sharp
    # edges marked below, which shows up as phantom curvature on flat panels.
    m.miter_outer = "MITER_ARC"
    bpy.ops.object.modifier_apply(modifier=m.name)
    # Shading is deliberately NOT done here: any boolean applied afterwards
    # adds new edges that default to smooth, and a smooth-shaded fan across
    # a flat panel renders as a phantom pyramid. shade_by_angle runs once at
    # the end instead, when the geometry is final.
    return o


def shade_by_angle(o, angle_deg=40):
    """Smooth across the bevel fillets, sharp across everything else.

    4.2 dropped the auto-smooth checkbox in favour of a geometry-nodes asset
    that this build of Blender does not ship, so mark the sharp edges by hand
    — which is what auto-smooth was doing anyway.
    """
    activate(o)
    bpy.ops.object.shade_smooth()
    me = o.data
    bm = bmesh.new()
    bm.from_mesh(me)
    thr = math.radians(angle_deg)
    for e in bm.edges:
        if len(e.link_faces) != 2:
            e.smooth = False
            continue
        a = e.calc_face_angle(0.0)
        # Smooth only across genuine fillet edges. Coplanar edges are the
        # internal triangulation of the n-gons a boolean leaves behind;
        # smoothing those makes a flat panel render with phantom creases.
        e.smooth = 0.02 < a <= thr
    bm.to_mesh(me)
    bm.free()
    me.update()
    return o


def boolean(target, cutter, op="DIFFERENCE"):
    activate(target)
    m = target.modifiers.new("bool", "BOOLEAN")
    m.operation = op
    m.object = cutter
    m.solver = "EXACT"
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    return target


def solidify(o, thickness, offset=-1):
    activate(o)
    m = o.modifiers.new("solid", "SOLIDIFY")
    m.thickness = thickness
    m.offset = offset
    bpy.ops.object.modifier_apply(modifier=m.name)
    return o


def join(name, objs):
    activate(objs[0])
    for o in objs[1:]:
        o.select_set(True)
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    return o


def set_origin(o, point):
    """Move the object's origin without moving its geometry."""
    prev = bpy.context.scene.cursor.location.copy()
    bpy.context.scene.cursor.location = Vector(point)
    activate(o)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    bpy.context.scene.cursor.location = prev
    return o


# --------------------------------------------------------------------------
# materials
# --------------------------------------------------------------------------

def material(name, color, rough=0.5, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    return m


def srgb(hexcode):
    """glTF wants linear base colours; convert from the sRGB hex we design in."""
    h = hexcode.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return tuple(out)


def assign(o, mat):
    o.data.materials.clear()
    o.data.materials.append(mat)
    return o


# --------------------------------------------------------------------------
# the machine
# --------------------------------------------------------------------------

def build():
    reset_scene()

    MATS = {
        "beige": material("Beige", srgb("#d8cdb6"), rough=0.52),
        "beige_dk": material("BeigeDark", srgb("#c6bb9f"), rough=0.58),
        "dark": material("Dark", srgb("#17181a"), rough=0.42),
        "rubber": material("Rubber", srgb("#26272a"), rough=0.92),
        "metal": material("Metal", srgb("#b9bec4"), rough=0.3, metal=1.0),
        "metal_dull": material("MetalDull", srgb("#8d949b"), rough=0.52, metal=0.9),
        "pcb": material("PCB", srgb("#1d5137"), rough=0.66),
        "glass": material("Glass", srgb("#0d1210"), rough=0.06),
        "screen": material("ScreenMat", srgb("#0d1310"), rough=0.25),
        "copper": material("Copper", srgb("#b87333"), rough=0.38, metal=1.0),
        "cap_blue": material("CapBlue", srgb("#25406b"), rough=0.4),
        "cap_red": material("CapRed", srgb("#7a2233"), rough=0.4),
    }

    parts = []

    # ---- the case ---------------------------------------------------------
    # Two solids rather than one solid cut in half: chaining twenty EXACT
    # booleans across a beveled mesh is fragile, and when one fails it takes
    # the whole object with it. Cutters are joined into a single object so
    # each solid needs exactly one boolean.
    seam = -D / 2 + 0.42          # where the front moulding meets the housing
    bezel_d = 0.42
    housing_d = D - bezel_d

    bezel = box("FrontBezel", (W, bezel_d, H), loc=(0, -D / 2 + bezel_d / 2, 0))
    bevel(bezel, width=0.07, segments=4, angle=30)

    # Screen recess, the opening through it, and the floppy slot.
    recess = box("cut_recess", (2.02, 0.16, 1.58), loc=(0, -D / 2 + 0.05, 0.62))
    bevel(recess, width=0.02, segments=2)
    opening = box("cut_open", (1.74, 0.9, 1.3), loc=(0, -D / 2 + 0.4, 0.62))
    bevel(opening, width=0.02, segments=2)
    slot = box("cut_slot", (0.94, 0.9, 0.11), loc=(0.02, -D / 2 + 0.3, -0.72))
    bevel(slot, width=0.025, segments=2)
    boolean(bezel, join("cut_bezel", [recess, opening, slot]))
    assign(bezel, MATS["beige"])
    parts.append(bezel)

    housing = box("RearHousing", (W, housing_d, H), loc=(0, seam + housing_d / 2, 0))
    bevel(housing, width=0.07, segments=4, angle=30)

    cutters = []
    # Hollow it out, so the teardown reveals a shell and not a brick.
    cutters.append(box("cut_hollow", (W - 0.2, housing_d, H - 0.2),
                       loc=(0, seam + housing_d / 2 - 0.1, 0)))
    # Recessed carry handle in the top.
    handle = box("cut_handle", (0.95, 0.5, 0.42), loc=(0, 0.42, H / 2 - 0.08))
    bevel(handle, width=0.05, segments=3)
    cutters.append(handle)
    # Rear vents: two banks of louvres.
    for bank, (zc, count) in enumerate([(0.95, 9), (-0.15, 7)]):
        for i in range(count):
            cutters.append(box(f"cut_vent{bank}_{i}", (1.5, 0.5, 0.055),
                               loc=(0, D / 2 - 0.15, zc - i * 0.115)))
    boolean(housing, join("cut_housing", cutters))
    assign(housing, MATS["beige_dk"])
    parts.append(housing)

    # ---- the screen -------------------------------------------------------
    # A separate plane so the page can paint the live 512x342 framebuffer onto
    # it at runtime.
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -D / 2 + 0.30, 0.62),
                                     rotation=(math.radians(90), 0, 0))
    screen = bpy.context.object
    screen.name = "Screen"
    screen.scale = (1.62, 1.08, 1)
    bpy.ops.object.transform_apply(scale=True)
    assign(screen, MATS["screen"])
    parts.append(screen)

    # ---- cathode ray tube -------------------------------------------------
    face = box("crt_face", (1.92, 0.16, 1.48), loc=(0, -D / 2 + 0.40, 0.62))
    bevel(face, width=0.05, segments=4)

    # Funnel: a square-to-round taper, built by shrinking one end of a box.
    # radius1 sits at local -Z, which the +90 deg X rotation points to the
    # BACK of the machine — so the narrow end is radius1 and the wide end,
    # against the faceplate, is radius2.
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.24, radius2=1.3,
                                    depth=1.2, location=(0, -D / 2 + 1.08, 0.62),
                                    rotation=(math.radians(90), math.radians(45), 0))
    funnel = bpy.context.object
    funnel.name = "crt_funnel"
    bevel(funnel, width=0.04, segments=3)

    neck = cyl("crt_neck", 0.1, 0.72, loc=(0, -D / 2 + 1.95, 0.62),
               rot=(math.radians(90), 0, 0), verts=20)
    yoke = cyl("crt_yoke", 0.23, 0.26, loc=(0, -D / 2 + 1.68, 0.62),
               rot=(math.radians(90), 0, 0), verts=24)
    bevel(yoke, width=0.02, segments=2)

    crt = join("CathodeRayTube", [face, funnel, neck])
    assign(crt, MATS["glass"])
    assign(yoke, MATS["copper"])
    parts += [crt, yoke]
    yoke.name = "crt_yoke_part"
    yoke.parent = crt
    yoke.matrix_parent_inverse = crt.matrix_world.inverted()

    # ---- digital logic board ---------------------------------------------
    board = box("lb_board", (2.14, 1.78, 0.05), loc=(0, 0.15, -H / 2 + 0.3))
    bevel(board, width=0.012, segments=2)
    assign(board, MATS["pcb"])
    chips = []

    def dip(w, d, x, y, name):
        c = box(name, (w, d, 0.08), loc=(x, y, -H / 2 + 0.38))
        bevel(c, width=0.012, segments=2)
        assign(c, MATS["dark"])
        chips.append(c)

    dip(0.84, 0.26, -0.42, -0.2, "chip_68000")            # the 64-pin 68000
    for r in range(2):                                     # 16 x 64Kbit DRAM
        for k in range(8):
            dip(0.17, 0.11, -0.74 + k * 0.19, 0.42 + r * 0.2, f"chip_ram{r}{k}")
    for i, y in enumerate((-0.42, -0.16, 0.14)):           # ROMs + IWM
        dip(0.34, 0.16, 0.64, y, f"chip_rom{i}")
    for k in range(4):                                     # rear connectors
        c = box(f"conn{k}", (0.28, 0.12, 0.16),
                loc=(-0.7 + k * 0.45, 0.92, -H / 2 + 0.4))
        bevel(c, width=0.015, segments=2)
        assign(c, MATS["metal_dull"])
        chips.append(c)

    logic = join("LogicBoard", [board] + chips)
    parts.append(logic)

    # ---- analog board -----------------------------------------------------
    ab = box("ab_board", (0.05, 1.72, 2.2), loc=(W / 2 - 0.3, 0.35, -0.15))
    bevel(ab, width=0.012, segments=2)
    assign(ab, MATS["pcb"])
    bits = []

    fly = box("ab_flyback", (0.36, 0.38, 0.44), loc=(W / 2 - 0.5, -0.05, 0.4))
    bevel(fly, width=0.03, segments=3)
    assign(fly, MATS["dark"])
    bits.append(fly)

    for k in range(8):
        fin = box(f"ab_fin{k}", (0.18, 0.03, 0.6), loc=(W / 2 - 0.56, 0.9 - k * 0.08, -0.3))
        assign(fin, MATS["metal_dull"])
        bits.append(fin)

    for i, (y, z) in enumerate(((-0.2, -0.75), (0.2, -0.75), (-0.3, 0.05))):
        c = cyl(f"ab_cap{i}", 0.095, 0.32, loc=(W / 2 - 0.5, y, z),
                rot=(0, math.radians(90), 0), verts=20)
        bevel(c, width=0.015, segments=2)
        assign(c, MATS["cap_red"] if i == 2 else MATS["cap_blue"])
        bits.append(c)

    analog = join("AnalogBoard", [ab] + bits)
    parts.append(analog)

    # ---- floppy drive -----------------------------------------------------
    fd_body = box("fd_body", (1.06, 1.5, 0.5), loc=(0.02, -D / 2 + 1.0, -0.72))
    bevel(fd_body, width=0.02, segments=2)
    assign(fd_body, MATS["metal_dull"])

    fd_face = box("fd_face", (1.0, 0.06, 0.42), loc=(0.02, -D / 2 + 0.26, -0.72))
    bevel(fd_face, width=0.02, segments=2)
    assign(fd_face, MATS["beige"])

    fd_motor = cyl("fd_motor", 0.2, 0.16, loc=(0.02, -D / 2 + 1.6, -0.82), verts=24)
    bevel(fd_motor, width=0.015, segments=2)
    assign(fd_motor, MATS["metal"])

    disk = box("fd_disk", (0.88, 0.9, 0.05), loc=(0.02, -D / 2 + 0.75, -0.68))
    bevel(disk, width=0.02, segments=2)
    assign(disk, MATS["dark"])

    shutter = box("fd_shutter", (0.44, 0.28, 0.055), loc=(0.02, -D / 2 + 0.36, -0.68))
    assign(shutter, MATS["metal"])

    floppy = join("FloppyDrive", [fd_body, fd_face, fd_motor, disk, shutter])
    parts.append(floppy)

    # ---- signature plate --------------------------------------------------
    # The 47 names moulded inside the rear case. The lettering itself is a
    # canvas texture applied at runtime; this is the panel it sits on.
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, D / 2 - 0.12, 0.35),
                                     rotation=(math.radians(90), 0, math.radians(180)))
    plate = bpy.context.object
    plate.name = "SignaturePlate"
    plate.scale = (W - 0.4, (W - 0.4) / 2, 1)
    bpy.ops.object.transform_apply(scale=True)
    assign(plate, MATS["beige_dk"])
    parts.append(plate)

    # ---- keyboard ---------------------------------------------------------
    kb_base = box("kb_base", (2.6, 0.98, 0.18), loc=(0, -D / 2 - 0.95, -H / 2 + 0.09))
    bevel(kb_base, width=0.05, segments=4)
    assign(kb_base, MATS["beige"])

    keys = []
    rows = [10, 10, 10, 9, 5]
    for r, count in enumerate(rows):
        y = -D / 2 - 1.28 + r * 0.17
        off = (0.08 if r == 3 else 0) + (0.5 if r == 4 else 0)
        for k in range(count):
            wide = 0.2 if (r == 4 and k == 2) else 0
            key = box(f"key{r}_{k}", (0.15 + (0.6 if wide else 0), 0.15, 0.06),
                      loc=(-1.0 + off + k * 0.175 + wide, y, -H / 2 + 0.2))
            bevel(key, width=0.018, segments=3)
            assign(key, MATS["beige_dk"])
            keys.append(key)

    keyboard = join("Keyboard", [kb_base] + keys)
    parts.append(keyboard)

    # ---- mouse ------------------------------------------------------------
    m_body = box("m_body", (0.56, 0.76, 0.26), loc=(1.75, -D / 2 - 0.7, -H / 2 + 0.13))
    bevel(m_body, width=0.1, segments=6)
    assign(m_body, MATS["beige"])

    m_btn = box("m_btn", (0.38, 0.22, 0.04), loc=(1.75, -D / 2 - 1.0, -H / 2 + 0.27))
    bevel(m_btn, width=0.015, segments=2)
    assign(m_btn, MATS["beige_dk"])

    # Coiled cable, swept along a helix.
    curve = bpy.data.curves.new("m_cable", "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.022
    curve.bevel_resolution = 4
    spline = curve.splines.new("NURBS")
    pts = 64
    spline.points.add(pts - 1)
    for i in range(pts):
        t = i / (pts - 1)
        spline.points[i].co = (
            1.75 - t * 1.5 + math.sin(t * 34) * 0.06,
            -D / 2 - 0.35 + t * 0.1,
            -H / 2 + 0.12 + math.cos(t * 34) * 0.06,
            1,
        )
    spline.use_endpoint_u = True
    cable = bpy.data.objects.new("m_cable", curve)
    bpy.context.collection.objects.link(cable)
    activate(cable)
    bpy.ops.object.convert(target="MESH")
    cable = bpy.context.object
    assign(cable, MATS["rubber"])

    mouse = join("Mouse", [m_body, m_btn, cable])
    parts.append(mouse)

    # Final pass, now that no more booleans will touch the geometry: smooth
    # the fillets, keep everything else sharp, and give each part an origin at
    # its own centre so it rotates about itself when it flies out.
    for o in parts:
        if o.type != "MESH":
            continue
        shade_by_angle(o, 40)
        activate(o)
        bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")

    return parts


def main():
    parts = build()
    print("built parts:")
    for o in sorted(parts, key=lambda o: o.name):
        d = o.dimensions
        print(f"  {o.name:18s} faces={len(o.data.polygons):6d}  "
              f"size=({d.x:.2f}, {d.y:.2f}, {d.z:.2f})")
        # Screen and SignaturePlate are single quads by design; anything
        # else this small means a boolean ate the object.
        if len(o.data.polygons) < 4 and o.name not in ("Screen", "SignaturePlate"):
            print(f"  !! {o.name} has almost no geometry — a boolean collapsed",
                  file=sys.stderr)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(OUT),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_normals=True,
        export_texcoords=True,
        export_materials="EXPORT",
        export_draco_mesh_compression_enable=False,
    )
    size = OUT.stat().st_size / 1024
    print(f"wrote {OUT}  ({size:.0f} KB)")
    if size > 4096:
        print("WARNING: model is large; consider decimating", file=sys.stderr)


if __name__ == "__main__":
    main()
