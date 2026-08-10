#!/usr/bin/env python3
"""Render a quick turntable of the model, to check geometry without a browser.

    python3 model/preview.py [out_dir]
"""

import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_mac128k as M   # noqa: E402


def look_at(obj, target):
    d = obj.location - target
    obj.rotation_euler = d.to_track_quat("Z", "Y").to_euler()


def render(out_dir, views=(("front", 0.6), ("side", 1.6), ("back", 3.4))):
    M.build()

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Filmic"

    world = bpy.data.worlds.new("W")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.06, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

    # Three-point-ish lighting, enough to read the silhouette and the fillets.
    for name, loc, energy in (
        ("key", (6, -7, 8), 2500),
        ("fill", (-7, -4, 3), 700),
        ("rim", (-3, 8, 5), 1400),
    ):
        light = bpy.data.lights.new(name, "AREA")
        light.energy = energy
        light.size = 6
        o = bpy.data.objects.new(name, light)
        o.location = loc
        bpy.context.collection.objects.link(o)
        look_at(o, __import__("mathutils").Vector((0, 0, 0)))

    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 62
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam

    from mathutils import Vector
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    for label, ang in views:
        r = 11.0
        cam.location = Vector((r * math.sin(ang), -r * math.cos(ang), 3.4))
        look_at(cam, Vector((0, 0, 0.1)))
        scene.render.filepath = str(out_dir / f"{label}.png")
        bpy.ops.render.render(write_still=True)
        print("rendered", label)


if __name__ == "__main__":
    render(sys.argv[1] if len(sys.argv) > 1 else "/tmp/macpreview")
