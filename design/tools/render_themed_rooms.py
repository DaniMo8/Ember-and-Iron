"""Original themed interiors, Blender 5.x. No shared tiled diorama shell.
blender --background --factory-startup --python this_file -- mine:0 forge:0
Without arguments renders eight rooms at five stages. Keeps editable final scenes.
"""
import bpy, math, random, sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).parent))
import render_house_art as a

OUT = a.OUT
# Prefer an available CUDA device for reproducible batch rendering; CPU is a fallback.
gpu=False
try:
    devices=bpy.context.preferences.addons['cycles'].preferences
    devices.compute_device_type='CUDA';devices.get_devices()
    for device in devices.devices:device.use=device.type=='CUDA'
    gpu=any(device.type=='CUDA' for device in devices.devices)
except (TypeError, RuntimeError):pass
def textured(name, color, scale=6, rough=.85, grain=False, metal=0):
    m=a.material(name,color,metal,rough);n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
    tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=scale;tex.inputs['Detail'].default_value=3
    coord=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(1,18,4) if grain else (1,1,1)
    l.new(coord.outputs['Generated'],mapping.inputs[0]);l.new(mapping.outputs[0],tex.inputs['Vector'])
    ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(*[c*.5 for c in color],1);ramp.color_ramp.elements[1].color=(*[min(1,c*1.4) for c in color],1)
    l.new(tex.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],p.inputs['Base Color'])
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.28;bump.inputs['Distance'].default_value=.1
    l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],p.inputs['Normal']);return m

rock=textured('Fractured blue-grey bedrock',(.17,.21,.24),5)
earth=textured('Packed earth and coal dust',(.115,.086,.056),12)
plaster=textured('Lime plaster',(.46,.37,.25),7)
brick=textured('Soot-dark refractory brick',(.18,.105,.064),8)
wood=textured('Rough oak grain',(.25,.115,.045),5,grain=True)
lightwood=textured('Waxed oak grain',(.36,.20,.084),5,grain=True)
sand=textured('Trampled arena sand',(.49,.32,.14),20)
marble=textured('Ancestor blue marble',(.24,.32,.36),4,rough=.32)
coal=textured('Anthracite',(.016,.02,.024),5,metal=.3)
copper=a.material('Copper mineral',(.6,.25,.095),.65,.4)
silver=a.material('Bright tool steel',(.43,.51,.53),.8,.22)
rug=a.material('Woven indigo',(.032,.085,.14),0,.98)
warm=a.material('Warm candle flame',(1,.43,.085),0,.4,5)
water=a.material('Still underground water',(.025,.105,.12),.55,.12)

def box(name,loc,size,mat,bevel=.035):return a.cube(name,loc,size,mat,bevel)
def beam(name,start,end,width,mat):
    mid=(Vector(start)+Vector(end))/2;o=box(name,mid,(width,width,(Vector(end)-Vector(start)).length),mat)
    o.rotation_euler=(Vector(end)-Vector(start)).to_track_quat('Z','Y').to_euler();return o
def stone(name,loc,size,mat=rock):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=loc)
    o=bpy.context.object;o.name=name;o.scale=size;o.data.materials.append(mat)
    for v in o.data.vertices:v.co*=random.uniform(.85,1.15)
    return o
def point(loc,color,power,radius=.5):
    bpy.ops.object.light_add(type='POINT',location=loc);o=bpy.context.object;o.data.energy=power;o.data.color=color;o.data.shadow_soft_size=radius
def lantern(x,y,z):
    for dz in [-.27,.27]:box('Lantern iron cap',(x,y,z+dz),(.36,.36,.07),a.steel)
    for dx in [-.14,.14]:
        for dy in [-.14,.14]:beam('Lantern cage',(x+dx,y+dy,z-.28),(x+dx,y+dy,z+.28),.035,a.steel)
    a.cyl('Lantern glow',(x,y,z),.10,.4,warm,16);point((x,y,z),(1,.54,.20),110)
def barrel(x,y,z=0):
    a.cyl('Oak barrel',(x,y,z+.55),.45,1.1,wood,16)
    for h in [.15,.88]:a.cyl('Barrel hoop',(x,y,z+h),.465,.055,a.steel,24)
def bench(x,y,width=3):
    box('Oak worktop',(x,y,1.15),(width,1.15,.18),wood)
    for dx in [-width/2+.2,width/2-.2]:
        for dy in [-.4,.4]:box('Workbench leg',(x+dx,y+dy,.55),(.18,.18,1.1),wood)
def candle(x,y,z):
    a.cyl('Wax candle',(x,y,z+.18),.06,.36,a.paper,16);stone('Candle wick flame',(x,y,z+.4),(.035,.035,.1),warm)
    point((x,y,z+.45),(1,.63,.3),25,.2)
def window(x,y,z,w=2,h=3):
    box('Window darkness',(x,y,z),(w,.10,h),rug)
    for dx in [-w/2,w/2]:box('Window frame',(x+dx,y-.12,z),(.14,.2,h+.25),wood)
    for dz in [-h/2,0,h/2]:box('Window crossbar',(x,y-.14,z+dz),(w+.2,.18,.12),wood)
    box('Window mullion',(x,y-.15,z),(.1,.18,h),wood)
    a.light((x,y-1,z+1),(.63,.81,1),700,2)
def building(stage,floor='wood',wall=plaster):
    if floor=='wood':
        for x in range(-12,13):
            for y in [-6,0,6]:box('Long oak floorboard',(x*.68,y,-.12),(.66,5.97,.18),wood if stage<2 else lightwood,.008)
    elif floor=='brick':
        box('Foundry concrete bed',(0,1,-.3),(25,26,.5),brick)
        for i in range(85):
            x=random.uniform(-9,9);y=random.uniform(-8,9)
            stone('Furnace floor chips',(x,y,-.005),(random.uniform(.1,.35),.16,.02),coal)
    else:box('Floor slab',(0,0,-.2),(28,28,.3),marble)
    box('Rear wall',(0,8,3.5),(20,.45,7),wall)
    box('Left wall',(-9,1,3.5),(.45,14,7),wall)
    box('Dark timber ceiling',(0,1,7.15),(22,22,.25),wood)
    for x in [-8,-4,0,4,8]:
        box('Wall timber post',(x,7.67,3.3),(.3,.28,6.6),wood)
        beam('High roof rafter',(x,-5,6.8),(x,8,6.8),.3,wood)
    box('Wall tie beam',(0,7.6,5.8),(18,.3,.3),wood)
    for x in [-7,7]:lantern(x,7.2,3)
    if stage>=2:
        for x in [-7.5,7.5]:box('House tapestry',(x,7.32,3.7),(1,.06,2.3),a.red if floor!='wood' else a.teal)

def mine(stage):
    # A rough continuous floor and tunnel walls. No architecture, flagstones or marble.
    vertices=[];faces=[];size=24
    for y in range(size+1):
        for x in range(size+1):vertices.append((x-12,y-9,random.uniform(-.18,.10)))
    for y in range(size):
        for x in range(size):i=y*(size+1)+x;faces.append((i,i+1,i+size+2,i+size+1))
    mesh=bpy.data.meshes.new('Uneven cavern floor');mesh.from_pydata(vertices,[],faces);o=bpy.data.objects.new('Bare packed mine earth',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(earth)
    for side in [-1,1]:
        for y in range(-6,15,2):stone('Natural cavern wall',(side*(6.5+.15*y),y,2.5),(2.1,2.4,3.8))
    for x in [-5,-2,1,4,7]:stone('Rock ceiling beyond the workings',(x,11,7),(2.7,4,1.7))
    for y in [1,5,9]:
        width=4.8-y*.15
        for x in [-width,width]:beam('Pit timber support',(x,y,0),(x,y,4.2),.35,wood)
        beam('Heavy pit cap',(-width-.3,y,4.2),(width+.3,y,4.2),.42,wood)
        for side in [-1,1]:beam('Timber diagonal brace',(side*width,y,3),(side*(width-1),y,4.2),.25,wood)
        lantern(-width+.6,y,3.1)
    for x in [-.66,.66]:beam('Narrow iron mine rail',(x,-10,.12),(x,14,.12),.09,a.steel)
    for y in range(-9,14):box('Uneven sleeper',(0,y,.045),(1.8,.22,.12),wood)
    for i in range(60):
        x=random.choice([-1,1])*random.uniform(2.7,6.5);y=random.uniform(-7,12)
        stone('Loose mine rubble',(x,y,.05),(random.uniform(.15,.5),random.uniform(.2,.5),random.uniform(.1,.4)))
    for i in range(17+stage*4):
        x=random.uniform(-6,-4.6);y=random.uniform(1,8);z=random.uniform(.5,3.6)
        stone('Exposed ore vein',(x,y,z),(.15,.12,.26),copper if stage<2 else silver if stage<4 else a.blue)
    # Open cart, visibly filled with ore rather than a solid box.
    box('Cart floor',(0,-.7,.65),(1.7,2,.12),wood)
    for x in [-.85,.85]:box('Cart sideboard',(x,-.7,1),(.12,2,.7),wood)
    for y in [-1.65,.25]:box('Cart endboard',(0,y,1),(1.8,.12,.7),wood)
    for x in [-.87,.87]:
        for y in [-1.35,-.05]:a.cyl('Minecart wheel',(x,y,.45),.30,.14,a.steel).rotation_euler[1]=math.pi/2
    for i in range(15):stone('Cart ore',(random.uniform(-.6,.6),random.uniform(-1.4,0),.9),( .25,.23,.22),copper if i%3==0 else rock)
    beam('Discarded pick handle',(-3,-2,.1),(-2.2,-.4,.2),.07,wood);beam('Pick head',(-2.7,-.5,.22),(-1.7,-.8,.22),.10,silver)
    for x in [-3.8,4]:barrel(x,3)
    if stage>=1:
        box('Timber sorting bench',(3.7,3,1.1),(2.1,1,.18),wood)
        for x in [2.9,4.5]:box('Sorting bench leg',(x,3,.55),(.18,.7,1.1),wood)
    if stage>=2:
        for y in [-1,1]:beam('Ore hoist frame',(4,y,.2),(4,y,4.6),.25,a.steel)
        beam('Hoist gantry',(4,-1,4.6),(4,1,4.6),.4,a.steel)
        beam('Suspended ore chain',(4,0,4.5),(4,0,1),.05,silver)
    if stage>=3:
        stone('Underground pool',(-3,7,-.01),(1.6,2,.05),water)
        for x in [-4.5,4.5]:
            stone('Deep crystal seam',(x,8,2),(.5,.5,1.4),a.blue);point((x,7.5,2.5),(.08,.65,1),110)
    if stage==4:
        for i in range(6):stone('Ancient subterranean crystal',(random.uniform(-3,3),11,1.5),( .3,.35,random.uniform(1,2.4)),a.blue)
    a.light((2,-7,6),(.40,.56,.65),850,7);point((0,13,3),(.06,.25,.48),500,3)

def forge(stage):
    building(stage,'brick',brick)
    # A deep masonry hearth, chimney, bellows and tools distinguish this room.
    box('Hearth back',(0,6.8,1.5),(4,1,3),brick)
    for x in [-2,2]:box('Hearth cheek',(x,5.8,1.5),(.65,2,3),brick)
    box('Hearth lintel',(0,5.6,3),(4.8,2,.55),brick)
    box('Soot-black chimney',(0,6.2,5.1),(2.9,2,3.7),brick)
    box('Hearth grate',(0,5.9,.9),(3.4,1.2,.12),a.steel)
    for i in range(28):stone('Glowing forge coals',(random.uniform(-1.5,1.5),random.uniform(5.1,6.5),1.05),(.17,.18,.12),a.fire if i%3 else coal)
    point((0,5,1.6),(1,.24,.035),950,1.5)
    a.anvil(-.4,.2);bench(-5,4)
    for i in range(5):
        x=-6+i*.5;beam('Hanging tong',(x,7.1,1.7),(x,7.1,3.2),.045,a.steel)
        beam('Tong jaw',(x,7.1,3.2),(x+.12,7.1,3.5),.035,a.steel)
    a.cyl('Quenching tub',(3,.4,.55),.7,1.1,wood);a.cyl('Quench water',(3,.4,1.09),.6,.015,water)
    box('Leather bellows',(3.3,5,1.2),(1.7,1.4,.6),wood,.15)
    beam('Bellows nozzle',(2.6,5,1.2),(1.4,5.8,1.1),.2,a.steel)
    barrel(-3.5,4)
    for i in range(10):box('Stock bars',(-5+i*.12,4,1.4),(.07,1.4,.07),silver)
    if stage>=1:
        a.cyl('Grinding wheel',(-4,0,1),.8,.25,rock).rotation_euler[0]=math.pi/2
        box('Wheel trestle',(-4,0,.4),(1.4,.7,.8),wood)
    if stage>=2:
        for x in [3.7,5.5]:beam('Hammer press upright',(x,4,0),(x,4,4),.3,a.steel)
        box('Power hammer beam',(4.6,4,4),(2.4,.6,.4),a.steel)
        box('Power hammer head',(4.6,4,2.8),(.9,.7,.8),silver);a.anvil(4.6,4)
    if stage>=3:
        for x in [-6,-4]:a.cyl('Tempering vessel',(x,1.7,.75),.45,1.5,a.steel)
        for x in [-5.8,-5,-4.2]:a.sword(x,4,1.8,silver)
    if stage==4:
        for x in [-1.5,1.5]:stone('Runed heat stone',(x,5,1.25),(.15,.15,.4),a.blue)
        point((0,4.8,2),(.12,.65,1),240)
    window(-5,7.5,4.4,2.3,2.5);a.light((3,-5,7),(1,.68,.4),1500,7)

def smelter(stage):
    building(stage,'brick',brick)
    for i,x in enumerate([-4,0,4][:min(3,stage+1)]):
        box('Refractory furnace base',(x,4,.4),(2.8,2.8,.8),brick)
        a.cyl('Smelting furnace',(x,4,1.7),1.1,2.7,brick,48)
        for z in [.8,2.6]:a.cyl('Forged furnace band',(x,4,z),1.13,.14,a.steel)
        a.cyl('Open molten crucible',(x,4,3.07),.85,.07,a.fire)
        box('Furnace tap hole',(x,2.86,1.1),(.5,.04,.5),a.fire)
        box('Casting gutter',(x,1.5,.8),(.38,2.6,.14),a.fire)
        beam('Smoke flue',(x,4,3.4),(x,4,7),.8,a.steel)
        point((x,3,3.4),(1,.31,.055),500,1.4)
    bench(3,-1,4)
    for x in [1.7,2.5,3.3,4.1]:
        box('Ingot mould',(x,-1,1.3),(.65,1,.18),a.steel)
        box('Fresh ingot',(x,-1,1.41),(.4,.76,.12),copper if stage<2 else silver)
    for i in range(18):stone('Coal pile',(-5+random.uniform(-1,1),0+random.uniform(-1,1),.2),(.3,.3,.25),coal)
    for x in [-6,-4]:barrel(x,-2)
    if stage>=2:
        beam('Foundry lifting gantry',(-6,5.5,5.5),(6,5.5,5.5),.35,a.steel)
        for x in [-6,6]:beam('Gantries',(x,5.5,0),(x,5.5,5.5),.25,a.steel)
        beam('Crucible lifting chain',(0,5.5,5.4),(0,5.5,3.5),.04,silver)
    if stage>=3:
        for x in [-1,0,1]:box('Assayer stone table',(x,-2,1),(.7,.8,1.9),rock)
    if stage==4:
        a.cyl('Celestial alloy bath',(5,0,1.2),.8,2.4,a.steel);a.cyl('Blue alloy surface',(5,0,2.41),.7,.04,a.blue)
        point((5,0,3),(.1,.5,1),260)
    a.light((1,-6,8),(1,.65,.37),1700,8)

def shop(stage):
    building(stage,'wood');window(-4,7.5,3.8,3,3.6)
    for x in [-4,0,4]:
        box('Weapon rack back',(x,6.6,2),(2.6,.15,3),wood)
        for i in range(3+stage):a.sword(x-1+i*.42,6.35,1.7,silver)
    bench(0,-.8,7)
    box('Leather counter pad',(0,-.8,1.26),(5,.8,.04),rug)
    for x in [-2,0,2]:
        a.sword(x,2,1.3,silver)
        box('Display stand',(x,2,.6),(.9,.8,1.2),wood)
    for i in range(12):a.cyl('Counter coin',(1.2+random.uniform(-.3,.3),-.8+random.uniform(-.2,.2),1.31),.09,.025,a.gold,24)
    box('Sales ledger',(-2,-.8,1.31),(.9,.7,.07),a.paper)
    for x in [5.5,6.5]:barrel(x,4)
    if stage>=1:
        for x in [-6,6]:
            a.cyl('Mounted shield',(x,6.2,3),.85,.14,wood).rotation_euler[0]=math.pi/2
            a.cyl('Shield boss',(x,6.09,3),.26,.13,silver).rotation_euler[0]=math.pi/2
    if stage>=2:box('Long shop runner',(0,1,.01),(2.6,10,.03),a.red)
    if stage>=3:
        for x in [-5,5]:
            box('Mail mannequin plinth',(x,2,.2),(1.2,1.2,.4),rock)
            stone('Armoured bust',(x,2,1.6),(.65,.38,.85),silver)
    if stage==4:
        for x in [-2,2]:stone('Relic display crystal',(x,2,2.2),(.17,.17,.5),a.blue)
    a.light((4,-7,7),(1,.79,.52),1900,7)

def smith(stage):
    building(stage,'wood');window(-2.5,7.5,4,3,3.6)
    bench(-1,.1,4);box('Drafting vellum',(-1,.1,1.26),(2.6,.85,.018),a.paper)
    for i in range(8):box('Ink drawing line',(-1.7+i*.2,.1,1.275),(.018,.6,.003),a.steel,0)
    a.sword(1.2,1.8,1.6,silver);candle(-2.5,0,1.25)
    for x in [3.5,6]:
        a.shelf(x,6.6)
        for z in [.6,1.3,2]:
            for i in range(7):box('Leather-bound research volume',(x-.75+i*.23,6.6,z),(.18,.44,.4),a.teal if i%2 else a.red,.01)
    box('Smith chair',(-1,-1.5,.62),(1,.9,.17),wood);box('Chair back',(-1,-1.95,1.25),(1,.1,1.3),wood)
    for x in [-1.4,-.6]:
        for y in [-1.8,-1.2]:box('Chair leg',(x,y,.3),(.1,.1,.6),wood)
    box('Study carpet',(0,1,.005),(6,5,.015),rug)
    if stage>=1:bench(-5,4,2.6)
    if stage>=2:
        for x in [3,5]:
            a.cyl('Guild trophy',(x,2,1.1),.23,.6,a.gold)
            box('Trophy plinth',(x,2,.4),(.7,.7,.8),wood)
    if stage>=3:
        for x in [-5,-3,0,3,5]:candle(x,6.9,2.4)
    if stage==4:
        for z,r in [(2,.7),(2.35,1),(2.7,.7)]:
            bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=.035,location=(4,2,z));bpy.context.object.data.materials.append(a.gold)
        stone('Armillary heart',(4,2,2.35),(.2,.2,.2),a.blue);point((4,2,2.5),(.15,.55,1),130)
    a.light((3,-5,7),(1,.76,.5),1700,7)

def employees(stage):
    building(stage,'wood');window(-5,7.5,4,2,2.7)
    box('Common hearth',(0,7,1.5),(3.6,1.2,3),brick)
    box('Hearth opening',(0,6.35,1.1),(2.4,.08,1.7),coal)
    for i in range(8):stone('Hearth embers',(random.uniform(-.8,.8),6.2,.5),(.18,.2,.1),a.fire)
    point((0,5.8,1.1),(1,.3,.06),550)
    bench(0,.6,5)
    for y in [-.5,1.7]:
        box('Long common bench',(0,y,.5),(5,.55,.18),wood)
        for x in [-2,2]:box('Bench leg',(x,y,.23),(.18,.4,.46),wood)
    for x in [-1.7,-.5,.7,1.8]:
        a.cyl('Pewter tankard',(x,.6,1.4),.13,.28,silver,24)
        a.cyl('Supper bowl',(x,.15,1.29),.22,.05,wood,24)
    candle(0,.75,1.25)
    for x in [-6,6]:barrel(x,3.5)
    if stage>=1:
        for y in [3,5]:
            box('Rest bunk',(5,y,.5),(2.3,1.2,.25),wood)
            box('Wool bedroll',(5,y,.71),(2.1,1.05,.18),a.teal,.10)
    if stage>=2:
        box('Roster board',(-4,7.4,2.6),(2.4,.13,1.7),wood)
        for x in [-4.6,-4,-3.4]:box('Duty parchment',(x,7.3,2.6),(.4,.03,1),a.paper)
    if stage>=3:
        bench(-5,3,3);box('Apprentice handbook',(-5,3,1.3),(.8,.7,.1),a.paper)
    if stage==4:
        for x in [-6,6]:box('Master artisan pennant',(x,7.3,4),(1,.08,2),a.teal)
    a.light((2,-6,7),(1,.70,.41),1900,7)

def arena(stage):
    box('Arena earth',(0,1,-.2),(36,40,.4),sand)
    a.cyl('Circular fighting sand',(0,2,-.02),7,.08,sand,96)
    for i in range(30):
        q=i*math.tau/30;x=8*math.cos(q);y=2+8*math.sin(q)
        if y<0:continue
        box('Palisade stake' if stage<2 else 'Arena buttress',(x,y,1.6),(.36,.4,3.2),wood if stage<2 else rock)
    for z in [.7,1.7,2.6]:
        for i in range(20):
            q=math.pi*i/20;r=math.pi*(i+1)/20
            beam('Arena enclosure',(8*math.cos(q),2+8*math.sin(q),z),(8*math.cos(r),2+8*math.sin(r),z),.18,wood)
    for x in [-6,6]:
        beam('Banner pole',(x,5,0),(x,5,6),.14,wood)
        box('Rival banner',(x+.5,5,4.7),(1,.04,2),a.red if x<0 else a.teal)
    for x in [-4,4]:
        a.cyl('Practice post',(x,1,1.1),.16,2.2,wood)
        beam('Practice crossbar',(x-.7,1,1.5),(x+.7,1,1.5),.12,wood)
        stone('Straw training body',(x,1,1.3),(.45,.3,.65),a.paper)
    if stage>=1:
        for row in range(2+stage):box('Spectator timber tier',(0,9+row, .35+row*.5),(17,1,.5+row),wood if stage<3 else rock)
    if stage>=2:
        for x in [-3,3]:a.brazier(x,5)
        box('Champion gate lintel',(0,10,4),(5,1,.6),rock)
        for x in [-2.5,2.5]:box('Champion gate pier',(x,10,2),(.7,.8,4),rock)
    if stage>=3:
        for i in range(12):
            q=i*math.tau/12;a.cyl('Arena seal',(6*math.cos(q),2+6*math.sin(q),.04),.14,.02,a.gold,24)
    if stage==4:
        for i in range(12):
            q=i*math.tau/12;a.cyl('Crucible rune',(5.6*math.cos(q),2+5.6*math.sin(q),.05),.08,.03,a.blue,6)
    for i in range(8):stone('Distant mountain',(random.uniform(-20,20),random.uniform(20,30),2),(4,4,random.uniform(4,9)),rock)
    a.light((-5,-4,15),(1,.76,.46),3300,9);a.light((7,8,11),(.45,.68,1),2000,10)

def legacy(stage):
    building(stage,'marble',rock)
    for x in [-6,-3,3,6]:
        for y in [1,6]:
            a.cyl('Ancestor column',(x,y,3),.36,6,marble)
            for z in [.2,5.8]:a.cyl('Gilded capital',(x,y,z),.5,.25,a.gold)
    for r,z in [(2.2,.15),(1.8,.35),(1.4,.55)]:a.cyl('Memorial dais',(0,2,z),r,.25,marble,96)
    a.anvil(0,2);a.sword(0,2,2.8,a.gold)
    box('Ceremonial runner',(0,-2,.01),(2.5,10,.02),a.red)
    for x in [-6,-3,3,6]:
        box('Ancestor memorial',(x,7.4,2.4),(1.4,.15,2.7),a.gold)
        box('Inscribed slate',(x,7.29,2.4),(1.2,.03,2.45),rock)
        for z in [1.8,2.1,2.4,2.7,3]:box('Memorial inscription',(x,7.26,z),(.7,.025,.025),a.gold,0)
    for i in range(10+stage*5):
        q=i*2.399;x=3.5*math.cos(q);y=2+3.5*math.sin(q);candle(x,y,.05)
    if stage>=1:
        for x in [-5,5]:a.brazier(x,3)
    if stage>=2:
        for x in [-3,3]:stone('Ancestral crystal',(x,6,1.2),(.35,.35,1.1),a.blue)
    if stage>=3:
        for z,r in [(3.4,1.2),(4,1.6),(4.6,1.2)]:
            bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=.04,location=(0,2,z));bpy.context.object.data.materials.append(a.gold)
    if stage==4:
        stone('Astral inheritance',(0,2,4),(.4,.4,.4),a.blue)
        point((0,2,4),(.08,.5,1),850,1.5)
    a.light((1,-5,10),(1,.72,.42),2100,6);a.light((-5,4,9),(.24,.55,1),1400,6)

def render(kind,stage):
    a.reset()
    for mesh in list(bpy.data.meshes):
        if mesh.users==0:bpy.data.meshes.remove(mesh)
    random.seed(123+stage)
    globals()[kind](stage)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=True
    scene.cycles.device='GPU' if gpu else 'CPU'
    scene.render.resolution_x=1440;scene.render.resolution_y=960;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
    scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.12,.17,.22,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.22 if kind!='mine' else .06
    scene.view_settings.view_transform='AgX'
    camera=(8,-10,5.7) if kind!='mine' else (1,-8,3.7)
    target=(0,3,2.2) if kind!='mine' else (0,6,2.4)
    bpy.ops.object.camera_add(location=camera);c=bpy.context.object;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();c.data.lens=30 if kind!='mine' else 26;scene.camera=c
    scene.render.filepath=str(OUT/f'{kind}-{stage}.png')
    bpy.ops.render.render(write_still=True);print('THEMED_READY',kind,stage,flush=True)
    if stage==4:
        bpy.context.preferences.filepaths.save_version=0
        bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'{kind}-evolution.blend'))

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
targets=args or ['smith','mine','smelter','forge','shop','arena','employees','legacy']
for spec in targets:
    parts=spec.split(':');kind=parts[0]
    for stage in [int(parts[1])] if len(parts)>1 else range(5):render(kind,stage)
