"""Original architectural dioramas and interface metalwork, Blender 5.x.
Run with blender --background --factory-startup --python this_file.
No downloaded models, fonts or textures. The saved scene is editable.
"""
import bpy, math, random
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets' / 'house'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(19)

def material(name, color, metal=0, rough=.45, glow=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*color,1); p.inputs['Emission Strength'].default_value=glow
    return m

stone=material('Basalt | blue slate',(.052,.09,.115),.18)
edge=material('Cut limestone',(.26,.32,.33),.1)
gold=material('Hammered warm brass',(.62,.32,.09),.8,.28)
steel=material('Blacked steel',(.075,.105,.13),.85,.27)
walnut=material('Smoked walnut',(.115,.043,.021),.15)
red=material('House oxblood',(.26,.025,.035))
teal=material('House verdigris',(.025,.22,.21),.35)
paper=material('Vellum',(.71,.58,.38))
fire=material('Molten amber', (1,.19,.018),.1,.3,5)
blue=material('Crystal glimmer',(.08,.6,.65),.3,.2,1.4)

def cube(name,loc,scale,mat,bevel=.045):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(mat)
    if bevel:
        b=o.modifiers.new('Crafted edges','BEVEL');b.width=bevel;b.segments=3
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def cyl(name,loc,radius,depth,mat,vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=bpy.context.object;o.name=name;o.data.materials.append(mat)
    b=o.modifiers.new('Rim bevel','BEVEL');b.width=.025;b.segments=2
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o

def light(loc,color,power,size=4):
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()

def arch(x,y,z=0):
    for dx in [-1.1,1.1]:
        cube('Arch pier',(x+dx,y,z+1.2),(.35,.55,2.4),edge)
        cube('Capital',(x+dx,y,z+2.35),(.52,.66,.22),gold)
    for n in range(11):
        a=n*math.pi/10
        o=cube('Arch voussoir',(x+1.1*math.cos(a),y,z+2.4+1.1*math.sin(a)),(.37,.55,.38),edge,.018)
        o.rotation_euler[1]=a-math.pi/2

def brazier(x,y):
    cyl('Lamp plinth',(x,y,.3),.25,.6,steel)
    cyl('Bronze fire bowl',(x,y,.65),.4,.16,gold)
    for i in range(5):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.18,location=(x+random.uniform(-.19,.19),y+random.uniform(-.15,.15),.88))
        o=bpy.context.object;o.scale.z=1.9;o.data.materials.append(fire)
    light((x,y,1.5),(1,.3,.08),100,1.1)

def bench(x,y):
    cube('Workbench',(x,y,.93),(2.5,1.2,.18),walnut)
    for dx in [-1,1]:
        for dy in [-.4,.4]:cube('Table leg',(x+dx,y+dy,.42),(.16,.16,.85),steel)

def anvil(x=0,y=0):
    cyl('Anvil stump',(x,y,.4),.52,.8,walnut)
    cube('Anvil base',(x,y,.88),(1.05,.6,.14),steel)
    cube('Anvil waist',(x,y,1.08),(.52,.43,.32),steel)
    cube('Anvil face',(x,y,1.29),(1.27,.57,.21),steel,.06)
    bpy.ops.mesh.primitive_cone_add(vertices=40,radius1=.24,radius2=.035,depth=.72,location=(x-.9,y,1.25),rotation=(0,-math.pi/2,0));bpy.context.object.data.materials.append(steel)

def sword(x,y,z,mat=steel):
    cube('Sword blade',(x,y,z+.65),(.12,.07,1.3),mat,.025)
    cube('Sword guard',(x,y,z),(.52,.15,.10),gold)
    cube('Leather hilt',(x,y,z-.23),(.13,.12,.37),walnut)
    cyl('Pommel',(x,y,z-.45),.11,.12,gold)

def shelf(x,y):
    for z in [.35,1.05,1.75]:cube('Shelf',(x,y,z),(2,.65,.12),walnut)
    for dx in [-.94,.94]:cube('Shelf upright',(x+dx,y,1),(.12,.7,2),gold)

def reset():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def room(kind,stage):
    reset(); random.seed(41+stage)
    cube('Diorama foundation',(0,0,-.32),(12,9,.6),stone,.18)
    for x in range(-5,6):
        for y in range(-4,5):cube('Flagstone',(x,y,.015),(.96,.96,.075),edge if (x+y)%7==0 else stone,.025)
    for x in [-5.4,-2.7,0,2.7,5.4]:arch(x,3.75)
    for x in [-5.4,5.4]:
        cube('End pier',(x,1.2,1.25),(.42,5.4,2.5),stone)
        brazier(x,-2)
    cube('Back parapet',(0,4.12,.5),(11.8,.34,1),stone)
    for x in [-3.7,3.7]:
        cube('House banner',(x,3.28,2.6),(.85,.08,1.7),teal if kind in ['mine','smelter'] else red)
        cube('Banner clasp',(x,3.24,3.45),(1,.12,.08),gold)
    if kind in ['forge','splash']:
        cube('Furnace masonry',(-2.9,2,1.05),(2.7,2,2.1),stone)
        cube('Hot hearth',(-2.9,.97,1.12),(1.65,.07,.72),fire)
        cube('Chimney',(-2.9,2,3),(1.6,1.3,2),stone)
        light((-2.9,.2,2.5),(1,.26,.06),550,2)
        anvil(1,-.25);bench(3.3,1.7)
        for i in range(4):sword(2.5+i*.44,1.8,1.7)
        if stage>0:
            cyl('Grindstone',(-2,-1.6,.9),.64,.24,edge).rotation_euler[0]=math.pi/2
            cube('Grindstone base',(-2,-1.6,.35),(1.2,.65,.65),walnut)
        if stage>1:
            for x in [0,1.5,3]:cyl('Quenching tank',(x,2.5,.6),.48,1.2,gold)
    elif kind=='mine':
        for i in range(23):
            x=random.uniform(-4.8,4.8);y=random.uniform(1.2,3.5)
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=random.uniform(.4,1),location=(x,y,.65));o=bpy.context.object;o.scale.z=1.8;o.data.materials.append(stone)
        for i in range(10+stage*4):
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.28,location=(random.uniform(-4,4),random.uniform(1.1,2.4),.7));o=bpy.context.object;o.scale.z=2;o.data.materials.append(gold if stage==0 else blue)
        for x in [-.53,.53]:cube('Cart rail',(x,-.6,.13),(.08,5.7,.12),steel)
        for y in range(-3,3):cube('Rail tie',(0,y,.1),(1.5,.17,.14),walnut)
        cube('Ore cart',(0,-.8,.7),(1.5,1.7,.7),walnut)
        for x in [-.75,.75]:
            for y in [-1.4,-.3]:cyl('Iron wheel',(x,y,.4),.3,.14,steel).rotation_euler[1]=math.pi/2
    elif kind=='smelter':
        for x in [-3,0,3][:1+stage]:
            cyl('Crucible shell',(x,1,1),1,2,steel);cyl('Crucible molten surface',(x,1,2.02),.85,.06,fire)
            for z in [.3,1.65]:cyl('Crucible band',(x,1,z),1.05,.14,gold)
            light((x,1,2.6),(1,.32,.12),270,1.5)
        bench(2,-1.5)
        for i in range(6):cube('Cast ingot',(1.3+i%3*.52,-1.6+i//3*.36,1.1),(.45,.25,.16),gold)
    elif kind in ['smith','legacy']:
        bench(-2,-.4);cube('Unrolled plan',(-2,-.4,1.04),(1.6,.85,.02),paper)
        for x in [-3,0,3]:
            shelf(x,2.6)
            for z in [.6,1.3,2]:
                for i in range(6):cube('Bound manuscript',(x-.75+i*.25,2.6,z),(.16,.42,.42),teal if i%2 else red,.01)
        cyl('House seal plinth',(2,-.5,.5),.85,1,stone)
        sword(2,-.5,1.9,gold)
        if kind=='legacy':
            for x in [-4,4]:cyl('Memorial column',(x,0,1.5),.34,3,gold)
    elif kind=='employees':
        for x in [-2.5,2.5]:
            bench(x,.1)
            for dx in [-.7,.7]:
                for y in [-1,1.2]:cube('Bench seat',(x+dx,y,.43),(.65,.5,.2),walnut)
            for dx in [-.7,0,.7]:cyl('Pewter cup',(x+dx,.1,1.14),.12,.22,steel)
        cube('Common room fireplace',(0,2.7,1),(2.2,1,2),stone);cube('Common room fire',(0,2.16,.7),(1.3,.1,.55),fire)
    elif kind=='shop':
        bench(-2,-1.7);bench(2,-1.7)
        for x in [-3,0,3]:
            shelf(x,2.5)
            for i in range(3):sword(x-.6+i*.6,2.15,1.3)
        for x in [-2,2]:
            for i in range(3):cube('Display ingot',(x-.6+i*.5,-1.7,1.1),(.35,.2,.14),gold)
        cube('Guild ledger',(-1.6,-1.7,1.07),(.65,.7,.08),teal)
    elif kind=='arena':
        for z,r in [(.13,3.6),(.23,3.3),(.32,2.95)]:cyl('Arena ring',(0,-.1,z),r,.2,edge if z==.23 else stone,96)
        for side in [-1,1]:
            for y in [-1.3,.3,1.6]:
                x=side*2;cyl('Fighter pedestal',(x,y,.5),.32,.28,gold)
                cyl('Mail torso',(x,y,1),.22,.7,steel)
                bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.19,location=(x,y,1.57));bpy.context.object.data.materials.append(gold)
                cube('Cloak',(x,y+.15,1),(.45,.09,.7),teal if side<0 else red)
                sword(x+.32,y,1)
    if stage>0:
        for x in [-5,5]:
            for y in [-3,0,3]:cyl('Brass floor rivet',(x,y,.12),.08,.04,gold,16)
        cube('House runner',(0,1,.08),(1.1,5,.025),teal)
    if stage>1:
        for x in [-5.3,5.3]:
            for y in [-2,1,3.6]:cyl('Gilded column',(x,y,1.75),.15,3.5,gold)
    setup((13,-17,14), (0,.4,1), 15.8)

def setup(camera,target,ortho):
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
    scene.render.resolution_x=1440;scene.render.resolution_y=960;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
    scene.world.color=(.025,.025,.025);scene.view_settings.view_transform='AgX'
    bpy.ops.object.camera_add(location=camera);c=bpy.context.object;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();c.data.type='ORTHO';c.data.ortho_scale=ortho;scene.camera=c
    light((2,-6,10),(1,.73,.45),1600,8);light((-7,2,7),(.18,.6,.7),2100,7);light((5,5,9),(.68,.8,1),1300,6)

def render(name):
    bpy.context.scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
    print('HOUSE_ART_READY',name,flush=True)

for kind in ['splash','smith','mine','smelter','forge','shop','arena','employees','legacy']:
    stages=[0] if kind in ['splash','legacy'] else [0,1,2]
    for stage in stages:
        room(kind,stage);render(kind if kind in ['splash','legacy'] else kind+'-'+str(stage))
        if kind=='splash':bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'house-workshop.blend'))

# Sculpted interface surfaces; CSS keeps text and hit targets crisp and accessible.
for name,width,height in [('button',4,1),('frame',4,3)]:
    reset();cube('Brass surround',(0,0,0),(width,height,.18),gold,.09)
    cube('Inset enamel',(0,0,.12),(width-.12,height-.12,.10),stone,.065)
    for x in [-width/2+.18,width/2-.18]:
        for y in [-height/2+.18,height/2-.18]:cyl('Corner rivet',(x,y,.2),.045,.025,gold,20)
    setup((0,0,8),(0,0,0),width+.05)
    bpy.context.scene.render.resolution_x=800;bpy.context.scene.render.resolution_y=int(800*height/width)
    bpy.context.scene.render.film_transparent=True;render(name)
