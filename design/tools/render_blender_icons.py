"""Rebuild the game's original 3D inventory atlas with Blender 5.x, in a new process.

blender --background --factory-startup --python design/tools/render_blender_icons.py
All models are created here; no downloaded assets or external textures are used.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector, Matrix, Euler

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets' / 'inventory'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
random.seed(724)
parts=[]
def mat(name, color, metal=0, rough=.38):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
    return m
bronze=mat('Burnished bronze',(.55,.25,.065),.65)
iron=mat('Wrought iron',(.24,.29,.35),.65)
steel=mat('Polished steel',(.62,.72,.79),.7)
mithril=mat('Mithril',(.10,.60,.53),.6)
star=mat('Star gold',(.88,.57,.16),.7)
metals=[bronze,iron,steel,mithril,star]
wood=mat('Oiled walnut',(.19,.075,.028)); leather=mat('Oxhide',(.31,.12,.043)); dark=mat('Charcoal',(.035,.048,.065))
gold=mat('Brass trim',(.75,.39,.085),.6); ivory=mat('Parchment',(.79,.66,.43)); cloth=mat('Indigo wool',(.08,.20,.34))
red=mat('Oxblood cloth',(.38,.038,.033)); gem=mat('Amethyst',(.42,.12,.70),.35,.21)
tin=mat('Tin',(.55,.60,.63),.6); ember=mat('Ember crystal',(.9,.17,.028),.3); frost=mat('Ice crystal',(.20,.68,.94),.3)
def finish(obj, material, bevel=0):
    obj.data.materials.append(material); parts.append(obj)
    if bevel:
        m=obj.modifiers.new('Soft crafted edges','BEVEL'); m.width=bevel; m.segments=2
        obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return obj
def box(pos, size, material, bevel=.035):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos); o=bpy.context.object
    o.data.transform(Matrix.Diagonal(Vector((*size,1)))); return finish(o,material,bevel)
def poly(points, depth, material, z=0, bevel=.025):
    n=len(points); verts=[(x,y,z+d) for d in [-depth/2,depth/2] for x,y in points]
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new('Forged mesh'); mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new('Forged part',mesh); bpy.context.collection.objects.link(o); return finish(o,material,bevel)
def rod(a,b,r,material,vertices=12):
    a,b=Vector(a),Vector(b); bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=(b-a).length,location=(a+b)/2)
    o=bpy.context.object; o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler(); return finish(o,material,.014)
def jewel(pos,r,material,scale=(1,1,1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=r,location=pos); o=bpy.context.object; o.scale=scale; return finish(o,material)
def torus(pos,major,minor,material):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=20,minor_segments=6,location=pos)
    return finish(bpy.context.object,material)
def curve(points,r,material):
    for a,b in zip(points,points[1:]): rod(a,b,r,material)
def blade(y0,y1,width,m):
    poly([(-width/2,y0),(width/2,y0),(width/2,y1-.28),(0,y1),(-width/2,y1-.28)],.10,m)
    rod((0,y0+.04,.07),(0,y1-.29,.07),.018,steel,6)
def weapon(c,v,m):
    if c in ['swords','daggers']:
        end=1.55 if c=='swords' else 1.10
        blade(-.3,end,.24+.09*v,m); rod((0,-1.15,0),(0,-.34,0),.09,leather)
        box((0,-.35,0),(.80+.13*v,.12,.17),gold if v==2 else m)
        jewel((0,-1.2,0),.14,m)
        for y in [-1,-.85,-.7,-.55]: torus((0,y,0),.086,.016,gold).rotation_euler[0]=math.pi/2
    elif c in ['axes','maces','polearms','foci']:
        rod((0,-1.45,0),(0,1.2,0),.075,wood)
        for y in [-1.2,-.95,-.7]: rod((0,y,0),(0,y+.13,0),.09,leather)
        if c=='axes':
            poly([(-.1,.50),(.65,.32),(.92,.56),(.95,1.36),(.72,1.50),(.2,1.05),(-.1,1.06)],.22,m)
            if v==2: poly([(.1,.50),(-.65,.32),(-.92,.56),(-.95,1.36),(-.72,1.5),(-.2,1.05),(.1,1.06)],.22,m)
        elif c=='maces':
            if v==2: box((0,1,0),(1.12,.62,.55),m,.06)
            else:
                jewel((0,1,0),.43,m,scale=(1,1.25,1))
                if v==1:
                    for x in [-.37,0,.37]: box((x,1,0),(.12,.8,.6),m)
        elif c=='polearms':
            blade(.75,1.9,.38,m)
            if v: poly([(0,.65),(.8,.7),(.64,1.5),(.26,1.17),(0,1.2)],.13,m)
        else:
            torus((0,1.05,0),.32,.065,m); jewel((0,1.05,.05),.24,gem)
            if v==2:
                rod((-.4,.95,0),(-.32,1.5,0),.045,gold);rod((.4,.95,0),(.32,1.5,0),.045,gold)
    elif c=='bows':
        pts=[(.6*math.sin(t),1.48*math.cos(t),0) for t in [i*math.pi/12 for i in range(13)]]
        curve(pts,.085,wood); rod(pts[0],pts[-1],.015,ivory);rod((-.7,0,.10),(1.05,0,.10),.027,wood)
        poly([(.98,-.14),(1.27,0),(.98,.14)],.06,m,.1)
        for y in [-1,0,1]:box((.6*math.sqrt(max(0,1-(y/1.48)**2)),y,0),(.14,.20,.23),m)
def equipment(c,v,m):
    if c in ['swords','daggers','axes','maces','polearms','foci','bows']:weapon(c,v,m)
    elif c in ['armor','cloth_armor','leather_armor']:
        material=m if c=='armor' else cloth if c=='cloth_armor' else leather
        length=1.0+.2*v
        poly([(-.4,1),(-.84,.77),(-1,.1),(-.65,-.02),(-.52,.38),(-.58,-length),(.58,-length),(.52,.38),(.65,-.02),(1,.1),(.84,.77),(.4,1),(.27,.74),(-.27,.74)],.28,material,bevel=.055)
        box((0,-.5,.2),(1.1,.16,.09),leather);box((0,-.5,.27),(.2,.2,.06),gold)
        if c=='armor':
            for yy in range(8):
                for xx in range(7):
                    torus((-.45+xx*.15,-.95+yy*.22,.18),.064,.019,m)
        else:
            rod((0,-length+.1,.18),(0,.72,.18),.025,gold)
            for y in [-.2,.1,.4]:jewel((0,y,.25),.06,gold)
        if v==2:
            box((-.68,.71,.1),(.48,.38,.4),m,.08);box((.68,.71,.1),(.48,.38,.4),m,.08)
    elif c=='shields':
        if v==0:
            bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.9,depth=.16);finish(bpy.context.object,m,.04);torus((0,0,.12),.83,.04,gold);jewel((0,0,.16),.23,m)
        else:
            pts=[(-.83,1),(.83,1),(.79,-.4),(0,-1.3),(-.79,-.4)] if v==1 else [(-.8,1.3),(.8,1.3),(.82,-1.15),(-.82,-1.15)]
            poly(pts,.2,m); poly([(x*.84,y*.84) for x,y in pts],.08,red,.16)
            box((0,0,.24),(.15,1.65,.06),gold);box((0,.32,.25),(1.06,.15,.06),gold)
    elif c in ['rings','charms','talismans']:
        if c=='rings':
            torus((0,-.2,0),.68,.115,m)
            if v: box((0,.43,.17),(.52,.4,.3),m);jewel((0,.48,.38),.23,gem)
        else:
            curve([(-.75,1,0),(-.45,.4,0),(0,0,0),(.45,.4,0),(.75,1,0)],.04,leather if c=='talismans' else gold)
            poly([(-.49,-.36),(0,.14),(.49,-.36),(0,-1.07)],.22,m)
            jewel((0,-.39,.20),.25,gem if c=='talismans' else frost)
            if v==2:torus((0,-.4,.1),.61,.03,gold)
    elif c=='offhands':
        box((0,0,0),(1.62,2.1,.32),leather);box((0,0,.2),(1.46,1.92,.20),ivory);box((0,0,.34),(1.64,2.12,.12),cloth if v else red)
        box((-.65,0,.42),(.15,2.12,.09),gold)
        for x in [-.65,.65]:
            for y in [-.9,.9]:box((x,y,.42),(.24,.24,.07),m)
        poly([(0,-.4),(.4,0),(0,.4),(-.4,0)],.08,m,.46)
        if v==2:jewel((0,0,.57),.18,gem)
    elif c=='tools':
        box((0,-.25,0),(1.35,1.3,.48),leather,.13);box((0,.36,.26),(1.45,.46,.16),wood,.08);box((0,-.14,.32),(.28,.3,.08),gold)
        if v:rod((-.75,-1.15,.42),(.25,1.15,.42),.07,wood);box((.22,1.08,.42),(.98,.2,.2),m)
        if v==2:rod((.76,-1.1,.44),(.55,.8,.44),.06,wood);jewel((.55,.83,.44),.29,m)
    elif c=='instruments':
        if v==0:
            rod((0,-1.1,0),(0,1.1,0),.14,wood)
            for y in [-.6,-.3,0,.3,.6]:jewel((0,y,.135),.055,dark)
        else:
            pts=[(-.7,.8,0),(-.62,.05,0),(-.3,-.6,0),(.2,-.85,0),(.65,-.66,0)]
            for i in range(4):rod(pts[i],pts[i+1],.07+i*.05,m)
            torus((.68,-.66,0),.32,.05,gold).rotation_euler[1]=math.pi/2
            if v==2:poly([(-.55,.0),(.35,-.3),(.35,-1.1),(-.3,-1.15)],.04,red,-.13)
def resource(kind,m):
    if kind=='ingot':
        for x,y,z in [(-.22,-.30,0),(.3,.26,.16)]:
            o=box((x,y,z),(1.58,.80,.42),m,.12);o.rotation_euler[2]=-.2
            box((x,y,z+.23),(.34,.20,.025),gold,.02)
    elif kind=='wood':
        for x in [-.35,.1,.55]:rod((x,-.9,0),(x,.9,.12),.22,wood)
    elif kind=='leather':
        poly([(-.8,-.7),(-.4,-1),(.8,-.5),(.7,.5),(.25,.8),(-.8,.7),(-.5,.1)],.12,leather)
    elif kind=='oil':
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.62);finish(bpy.context.object,gold)
        rod((0,.4,0),(0,.95,0),.18,dark);box((0,1,0),(.38,.18,.35),wood)
    else:
        for x,y,z,r in [(-.42,-.2,0,.67),(.38,-.17,.12,.61),(0,.36,.2,.59)]:
            jewel((x,y,z),r,dark if kind=='ore' else m,(1,.8,.7))
            if kind=='ore':
                for _ in range(3):jewel((x+random.uniform(-.25,.25),y+random.uniform(-.2,.2),z+.32),.23,m,(.7,1.3,.8))

classes=['daggers','swords','axes','maces','polearms','bows','foci','armor','shields','rings','charms','tools','cloth_armor','leather_armor','offhands','instruments','talismans']
spec=[]
for tier,m in enumerate(metals,1):
    for c in classes:
        for v in range(3):spec.append((f'item-{c}-{tier}-{v}',lambda c=c,v=v,m=m:equipment(c,v,m)))
for id,kind,m in [('fuel','rock',dark),('bronze','ore',bronze),('tin','ore',tin),('iron','ore',iron),('mithril','ore',mithril),('starforged','ore',star),('gem','crystal',gem),('ember_shard','crystal',ember),('frost_crystal','crystal',frost),('star_fragment','crystal',star),('wood','wood',wood),('leather','leather',leather),('alchemical_oil','oil',gold)]+[(id+'_ingot','ingot',m) for id,m in zip(['bronze','iron','steel','mithril','starforged'],metals)]:
    spec.append(('material-'+id,lambda kind=kind,m=m:resource(kind,m)))
COLS=16; ROWS=math.ceil(len(spec)/COLS); CELL=3.8; SIZE=192
manifest={}; tilt=Euler((math.radians(15),math.radians(-18),math.radians(-23))).to_matrix().to_4x4()
for i,(key,make) in enumerate(spec):
    parts=[]; make(); bpy.context.view_layer.update()
    for o in parts:o.matrix_world=tilt@o.matrix_world
    bpy.context.view_layer.update()
    corners=[o.matrix_world@Vector(c) for o in parts for c in o.bound_box]
    lo=Vector([min(v[j] for v in corners) for j in range(3)]); hi=Vector([max(v[j] for v in corners) for j in range(3)])
    center=(lo+hi)/2; scale=2.85/max(hi.x-lo.x,hi.y-lo.y)
    x=i%COLS; y=i//COLS; offset=Vector(((x-(COLS-1)/2)*CELL,((ROWS-1)/2-y)*CELL,0))
    transform=Matrix.Translation(offset)@Matrix.Diagonal(Vector((scale,scale,scale,1)))@Matrix.Translation(-center)
    for j,o in enumerate(parts):o.matrix_world=transform@o.matrix_world;o.name=key+f'-{j:03}'
    manifest[key]={'x':x,'y':y}
    if i%25==0:print('MODELS',i,'/',len(spec),flush=True)

scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=16; scene.cycles.use_denoising=True
scene.render.resolution_x=COLS*SIZE;scene.render.resolution_y=ROWS*SIZE;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
scene.world.color=(.45,.45,.45)
scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.56,.65,.8,1);scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.65
for name,rot,energy,color,angle in [('Warm key',(25,-25,-25),3.0,(1,.82,.65),.22),('Cool fill',(-30,40,30),1.25,(.56,.76,1),.4)]:
    light=bpy.data.lights.new(name,'SUN');light.energy=energy;light.color=color;light.angle=angle
    o=bpy.data.objects.new(name,light);scene.collection.objects.link(o);o.rotation_euler=tuple(math.radians(a) for a in rot)
camdata=bpy.data.cameras.new('Atlas camera');cam=bpy.data.objects.new('Atlas camera',camdata);scene.collection.objects.link(cam)
cam.location=(0,0,100);camdata.type='ORTHO';camdata.ortho_scale=ROWS*CELL;scene.camera=cam
scene.view_settings.view_transform='AgX';scene.render.filepath=str(OUT/'inventory-atlas.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'inventory-models.blend'))
bpy.ops.render.render(write_still=True)
metadata={'generator':'Blender 5.2 / Cycles','tile':SIZE,'columns':COLS,'rows':ROWS,'icons':manifest}
(OUT/'manifest.json').write_text(json.dumps(metadata,indent=2))
(ROOT/'inventory-icons.js').write_text('/* Generated from original Blender renders; see design/tools/render_blender_icons.py. */\nconst EIInventory='+json.dumps(metadata,separators=(',',':'))+';\n',encoding='utf-8')
print('COMPLETE',len(spec),'original Blender icons',flush=True)
