"""Five authored architectural stages per room; original Blender geometry only.
Usage: blender --background --factory-startup --python this_file -- [room ...]
"""
import sys, math, random
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import render_house_art as a
import bpy

def evolve(kind, stage):
    a.room(kind, min(2, stage))
    # The original kit is rebuilt into a rough wooden opening, a stone workshop,
    # an established hall, an inherited guildhouse and a celestial institution.
    if stage == 0:
        for o in list(bpy.data.objects):
            if any(n in o.name for n in ['Arch ', 'Capital', 'Banner', 'End pier', 'Back parapet']):
                bpy.data.objects.remove(o, do_unlink=True)
        for x in [-5.2, 0, 5.2]:
            a.cube('Rough timber upright',(x,3.8,1.4),(.28,.34,2.8),a.walnut)
        a.cube('Crooked lintel',(0,3.8,2.7),(10.7,.4,.32),a.walnut)
        for x in range(-5,6):
            a.cube('Weathered rear boards',(x,4,.75),(.94,.13,1.4),a.walnut,.012)
        for x,y in [(-4,-2),(3,2),(-2,3)]:
            a.cube('Stacked salvage',(x,y,.2),(1.15,.8,.35),a.walnut)
    if kind == 'smith':
        if stage == 0:
            for o in list(bpy.data.objects):
                if 'manuscript' in o.name and o.location.x>0: bpy.data.objects.remove(o,do_unlink=True)
        if stage >= 2:
            for x in [-4,4]:
                a.cyl('Maker trophy',(x,-1,1.4),.23,.45,a.gold)
                a.cube('Trophy pedestal',(x,-1,.55),(.75,.75,1.1),a.stone)
    if kind == 'mine' and stage >= 1:
        a.cube('Lift cage',(3,-1,1.25),(1.45,1.3,2.5),a.steel)
        a.cube('Lift opening',(3,-1.67,1.15),(1.1,.06,1.85),a.stone)
        for z in [.4,.8,1.2,1.6,2]: a.cube('Lift brass rails',(3,-1.72,z),(1.2,.07,.06),a.gold)
        if stage >= 3:
            for x in [-3,-1,1]:
                a.cyl('Survey beacon',(x,2,.8),.2,1.6,a.gold)
                a.cyl('Beacon crystal',(x,2,1.8),.13,.5,a.blue,6)
    if kind == 'forge' and stage >= 2:
        for x in [-.6,.6]:a.cube('Power hammer column',(x,-2,1),(.2,.4,2),a.steel)
        a.cube('Power hammer crossbar',(0,-2,2),(1.8,.5,.35),a.gold)
        a.cube('Power hammer head',(0,-2,1.5),(.6,.55,.5),a.steel)
    if kind == 'shop' and stage >= 2:
        for x in [-2,2]:
            a.cube('Display vitrine',(x,-1.7,1.4),(2.3,.98,.1),a.gold)
            for dx in [-1.1,1.1]:a.cube('Vitrine post',(x+dx,-1.7,1.24),(.06,.9,.4),a.gold)
    if kind == 'employees':
        if stage >= 1:
            for x in [-4,4]:
                a.cube('Resting bunk',(x,2,.55),(1.6,1,.25),a.walnut)
                a.cube('Folded quilt',(x,2,.75),(1.45,.88,.15),a.teal)
        if stage >= 3:
            for x in [-3,0,3]:
                a.cube('Apprentice writing desk',(x,3,.9),(1.5,.75,.12),a.walnut)
                a.cube('Lesson book',(x,3,1),(.6,.4,.06),a.paper)
    if kind == 'arena' and stage >= 1:
        for y in [2.4,3,3.6]:
            a.cube('Spectator terrace',(0,y,.35+(y-2.4)*.65),(9,.48,.35),a.edge)
        if stage >= 3:
            for i in range(16):
                q=i*math.tau/16
                a.cyl('Crucible rune',(3.4*math.cos(q),-.1+3.4*math.sin(q),.38),.065,.04,a.blue,6)
    if kind == 'legacy':
        for i in range(1+stage*2):
            x=-4+(i%5)*2;y=2.3-(i//5)*2
            a.cube('Ancestor memorial',(x,y,1),(.7,.55,2),a.stone)
            a.cube('Inscribed brass face',(x,y-.29,1.1),(.5,.03,.9),a.gold)
    if stage >= 3:
        for x in [-5,5]:
            for y in [-2,1]:
                a.cyl('Inherited fluted column',(x,y,2),.2,4,a.edge)
                a.cyl('Gold capital',(x,y,3.85),.34,.18,a.gold)
        a.cube('Research table',(0,3,1),(2.2,1,.16),a.walnut)
        for i in range(5):a.cube('Archive volume',(-.75+i*.34,3,1.23),(.25,.6,.28),a.teal)
    if stage >= 4:
        for i in range(16):
            q=i*math.tau/16
            a.cyl('Astral inlay',(4.5*math.cos(q),3.5*math.sin(q),.13),.085,.035,a.blue,6)
        for z,r in [(2.9,.7),(3.35,1),(3.8,.7)]:
            bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=8,location=(0,2,z),major_radius=r,minor_radius=.035)
            bpy.context.object.name='Celestial armillary';bpy.context.object.data.materials.append(a.gold)
        a.light((0,2,4),(.1,.6,1),350,2)
    scene=bpy.context.scene
    scene.cycles.samples=12
    scene.render.resolution_x=1280;scene.render.resolution_y=854
    scene.render.filepath=str(a.OUT/f'{kind}-{stage}.png')
    bpy.ops.render.render(write_still=True)
    print('EVOLUTION_READY',kind,stage,flush=True)
    if stage==4:bpy.ops.wm.save_as_mainfile(filepath=str(a.OUT/f'{kind}-evolution.blend'))

rooms=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['smith','mine','smelter','forge','shop','arena','employees','legacy']
for room in rooms:
    for stage in range(5):evolve(room,stage)
