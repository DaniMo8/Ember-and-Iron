"""Author the original real-time diorama slice in Blender; export editable source + GLB.
Run a separate process: blender --background --factory-startup --python this_file
No existing Blender document is opened or modified. Coordinates: Blender Z up, -Y forward.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets'/'atelier'
OUT.mkdir(parents=True,exist_ok=True)
random.seed(47)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for col in list(bpy.data.collections):
    if col.name!='Collection' and not col.objects: bpy.data.collections.remove(col)

def texture(name,kind,color):
    n=256; y,x=np.mgrid[0:n,0:n]/n; rng=np.random.default_rng(sum(map(ord,name)))
    noise=rng.random((n,n))
    if kind=='wood': h=.45+.14*np.sin((x+np.sin(y*13)*.014)*160)+.06*np.sin(x*700+y*9)+noise*.05
    elif kind=='cloth': h=.45+.12*np.sin(x*480)*np.sin(y*480)+noise*.04
    elif kind=='leather': h=.45+noise*.20+.04*np.sin(x*145+y*97)
    elif kind=='metal': h=.49+noise*.035+.014*np.sin(x*850+y*14)
    else: h=.45+noise*.14+.08*np.sin(x*83)*np.cos(y*67)
    # Broad stains and small wear live in the material, not a screen-wide filter.
    grime=np.clip(.81+.10*np.sin(x*19+y*11)*np.cos(y*17-x*7)+noise*.07,.64,1)
    if kind=='metal': grime=.94+noise*.05
    rgba=np.ones((n,n,4),dtype=np.float32)
    for k in range(3):rgba[:,:,k]=np.clip(color[k]*(.78+h*.38)*grime,0,1)
    img=bpy.data.images.new(name+'_albedo',width=n,height=n,alpha=True);img.pixels.foreach_set(rgba.ravel());img.pack()
    dy,dx=np.gradient(h); normal=np.ones_like(rgba);normal[:,:,0]=.5-dx*.65;normal[:,:,1]=.5-dy*.65;normal[:,:,2]=.99
    bump=bpy.data.images.new(name+'_normal',width=n,height=n,alpha=True);bump.colorspace_settings.name='Non-Color';bump.pixels.foreach_set(normal.ravel());bump.pack()
    return img,bump

def mat(name,color,rough=.6,metal=0,kind=None,emission=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    if kind:
        al,norm=texture(name,kind,color)
        t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=al;m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
        t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=norm;n=m.node_tree.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.35;m.node_tree.links.new(t.outputs['Color'],n.inputs['Color']);m.node_tree.links.new(n.outputs['Normal'],p.inputs['Normal'])
    if emission:
        p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    return m

oak=mat('Oak honey',(.235,.162,.107),.86,kind='wood');oak_light=mat('Oak cut edge',(.35,.255,.175),.81,kind='wood')
oak_dark=mat('Oak end grain',(.20,.114,.058),.88,kind='wood');pine=mat('Painted pine',(.15,.25,.19),.8)
plaster=mat('Warm lime plaster',(.34,.326,.288),.98,kind='stone');plaster_green=mat('Sage plaster',(.22,.265,.239),.96,kind='stone')
stone=mat('Carved limestone',(.38,.39,.32),.9,kind='stone');slate=mat('Charcoal slate',(.18,.22,.21),.85)
brick=[mat('Fired brick '+str(i),(.23+i*.014,.137+i*.011,.095+i*.009),.97,kind='stone') for i in range(5)]
iron=mat('Blackened iron',(.115,.145,.143),.49,.75);steel=mat('Steel',(.56,.64,.63),.25,.92)
brass=mat('Aged brass',(.38,.255,.109),.46,.78);leather=mat('Oiled leather',(.14,.073,.043),.85,kind='leather')
linen=mat('Warm linen',(.41,.386,.32),.95,kind='cloth');cloth=mat('House teal',(.09,.17,.16),.95,kind='cloth')
skin=mat('Warm skin',(.61,.37,.22),.83);hair=mat('Chestnut hair',(.16,.081,.040),.82)
eyes=mat('Eyes',(.045,.06,.05),.3);cream=mat('Eye whites',(.88,.82,.63),.65)
coal=mat('Coal',(.031,.037,.031),.85);ember=mat('Ember',(.95,.18,.025),.5,emission=4)
glow=mat('Lantern glass',(.98,.60,.16),.38,emission=2)
leaf=mat('Foliage',(.19,.30,.15),.92);sand=mat('Fine arena sand',(.56,.45,.28),.99,kind='stone')
red=mat('Rival ochre',(.43,.15,.08),.92,kind='cloth');paper=mat('Old parchment',(.75,.65,.43),.94)

def mesh_obj(name,verts,faces,material,parent=None):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    if material:o.data.materials.append(material)
    if parent:o.parent=parent
    return o
def finish(o,name,material,parent=None,smooth=False):
    o.name=name
    if material:o.data.materials.append(material)
    if parent:o.parent=parent
    if smooth:
        for p in o.data.polygons:p.use_smooth=True
    return o
def bevel(o,width=.035,segments=2):
    bpy.context.view_layer.objects.active=o
    m=o.modifiers.new('Soft worked edges','BEVEL');m.width=width;m.segments=segments
    bpy.ops.object.modifier_apply(modifier=m.name)
    m=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');m.keep_sharp=True
    bpy.ops.object.modifier_apply(modifier=m.name)
    return o
def box(name,loc,size,material,round=.025,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,name,material,parent)
    return bevel(o,min(round,min(size)*.3),2) if round else o
def sphere(name,loc,scale,material,parent=None):
    tiny=any(word in name.lower() for word in ['rivet','button','glint','pebble'])
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10 if tiny else 20,ring_count=6 if tiny else 12,radius=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,material,parent,True)
def cyl(name,loc,r,depth,material,vertices=24,parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc);return bevel(finish(bpy.context.object,name,material,parent),.012,2)
def rod(name,a,b,r,material,parent=None):
    d=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,d.length,material,12,parent);o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o
def curve(name,pts,r,material,parent=None):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=3;cu.bevel_depth=r;cu.bevel_resolution=1
    sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(pts)-1)
    for p,co in zip(sp.bezier_points,pts):p.co=co;p.handle_left_type=p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);cu.materials.append(material)
    if parent:o.parent=parent
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o
def empty(name,loc=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc
    if parent:o.parent=parent
    return o
def lathe(name,rings,material,loc=(0,0,0),segments=28,parent=None):
    # rings = z, x radius, y radius; deliberate sculpted profile rather than a primitive.
    verts=[(loc[0]+rx*math.cos(i*math.tau/segments),loc[1]+ry*math.sin(i*math.tau/segments),loc[2]+z) for z,rx,ry in rings for i in range(segments)]
    faces=[]
    for j in range(len(rings)-1):
        for i in range(segments):k=j*segments+i;l=j*segments+(i+1)%segments;faces.append((k,l,l+segments,k+segments))
    faces.extend([tuple(reversed(range(segments))),tuple((len(rings)-1)*segments+i for i in range(segments))])
    o=mesh_obj(name,verts,faces,material,parent)
    for p in o.data.polygons:p.use_smooth=True
    return o
def coin(name,loc,r=.018,material=brass):return sphere(name,loc,(r,r,.008),material)
def arch(name,x,y,z,rx,rz,thickness,material):
    pts=[(x+math.cos(i*math.pi/18)*rx,y,z+math.sin(i*math.pi/18)*rz) for i in range(19)]
    return curve(name,pts,thickness,material)
def plank(loc,size,material=oak):
    o=box('Hand-planed oak plank',loc,size,material,.017)
    # Joinery pegs and a few fine carved grain lines remain visible in close views.
    if size[0]>1:
        for side in [-1,1]:cyl('Joinery peg',(loc[0]+side*(size[0]/2-.11),loc[1],loc[2]+size[2]/2+.002),.018,.006,oak_dark,12)
    return o
def barrel(x,y):
    lathe('Staved barrel',[(0,.26,.26),(.12,.31,.31),(.40,.34,.34),(.72,.30,.30),(.79,.26,.26)],oak,(x,y,0))
    for z in [.12,.65]:lathe('Forged hoop',[(z,.321,.321),(z+.045,.321,.321)],iron,(x,y,0))
    cyl('Barrel lid',(x,y,.79),.26,.035,oak_light)
    for i in range(12):a=i*math.tau/12;curve('Stave seam',[(x+math.cos(a)*r,y+math.sin(a)*r,z) for z,r in [(.03,.274),(.4,.343),(.74,.29)]],.004,oak_dark)
def table(x,y,w=1.45,d=.65,h=.85):
    for dx in [-w*.4,w*.4]:
        for dy in [-d*.36,d*.36]:box('Tapered table leg',(x+dx,y+dy,h*.43),(.095,.095,h*.86),oak_dark,.014)
    for j in range(3):plank((x,y+(j-1)*d/3,h),(w,d/3-.014,.10),oak_light)
    box('Workbench apron',(x,y-d*.35,h-.18),(w,.055,.21),oak,.01)
def lantern(x,y,z):
    box('Lantern bracket',(x,y+.07,z+.2),(.08,.25,.10),iron)
    for h in [-.19,.19]:cyl('Lantern cap',(x,y,z+h),.15,.05,iron,12)
    for i in range(4):a=i*math.tau/4;rod('Lantern cage',(x+math.cos(a)*.12,y+math.sin(a)*.12,z-.17),(x+math.cos(a)*.12,y+math.sin(a)*.12,z+.17),.013,brass)
    cyl('Glowing lantern heart',(x,y,z),.065,.27,glow,12)
def banner(x,y,z,material=cloth):
    verts=[]
    for row in range(7):
        for col in range(5):verts.append((x+(col/4-.5)*.55,y+math.sin(col*.9+row*.6)*.028,z-row*.13-(.13 if row==6 and col==2 else 0)))
    faces=[]
    for r in range(6):
        for c in range(4):i=r*5+c;faces.append((i,i+1,i+6,i+5))
    o=mesh_obj('Woven house pennant',verts,faces,material)
    o['ambient']='cloth'
    so=o.modifiers.new('Cloth thickness','SOLIDIFY');so.thickness=.012;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=so.name)
    rod('Banner rod',(x-.36,y,z+.04),(x+.36,y,z+.04),.027,brass)
    rod('Hammer hallmark stem',(x,y-.06,z-.18),(x,y-.06,z-.52),.025,brass)
    box('Hammer hallmark head',(x,y-.06,z-.2),(.27,.025,.10),brass,.02)
def shelf(x,y):
    for dx in [-.8,.8]:box('Display uprights',(x+dx,y,.87),(.10,.30,1.73),oak,.017)
    for z in [.17,.82,1.48]:
        plank((x,y,z),(1.72,.47,.085),oak_light)
        box('Carved shelf lip',(x,y-.235,z+.025),(1.73,.045,.115),oak_dark,.015)
    for dx in [-.43,0,.43]:rod('Rack hook',(x+dx,y-.05,1.40),(x+dx,y-.20,1.40),.025,brass)
    box('Display backcloth',(x,y+.13,.81),(1.58,.025,1.34),cloth,.005)
def room_shell(kind):
    if kind=='arena':
        box('Worn arena foundation',(0,.45,-.24),(7.45,6.45,.49),stone,.12)
        box('Compacted sand',(0,0,0),(6.98,5.28,.13),sand,.16)
        for i in range(80):
            x=random.uniform(-3.35,3.35);y=random.uniform(-2.45,2.45);sphere('Sandstone pebble',(x,y,.04),(.018,.02,.01),stone)
        return
    box('Carved miniature plinth',(0,0,-.19),(7.2,5.5,.38),oak_dark,.16)
    box('Plinth inlaid border',(0,0,-.065),(7.12,5.42,.095),brass,.12)
    for i in range(20):
        y=-2.49+i*.26
        for j in range(3):plank((-2.30+j*2.30,y,.035),(2.27,.246,.095),[oak,oak_light,oak][(i+j)%3])
    box('Rear lime wall',(0,2.51,1.49),(7.12,.15,2.86),plaster if kind=='forge' else plaster_green,.05)
    box('Side cutaway wall',(-3.49,.7,1.15),(.16,3.60,2.18),plaster_green,.05)
    for x in [-3.42,-1.25,1.15,3.42]:box('Oak frame post',(x,2.39,1.48),(.16,.19,2.90),oak_dark,.025)
    for z in [.23,2.83]:box('Oak wall sill',(0,2.40,z),(7.05,.21,.18),oak,.025)
    for x in [-2.2,2.3]:rod('Diagonal wall brace',(x-.50,2.37,2.79),(x+.4,2.37,2.08),.059,oak)
    box('Window deep reveal',(2.18,2.37,1.9),(1.50,.17,1.34),oak_dark,.08)
    box('Pale blue window glass',(2.18,2.26,1.9),(1.28,.03,1.14),mat('Window sky',(.36,.58,.57),.72,emission=.35),.03)
    for x in [1.57,2.18,2.79]:box('Window mullion',(x,2.20,1.9),(.055,.08,1.22),oak_light,.01)
    for z in [1.31,1.9,2.49]:box('Window crossbar',(2.18,2.20,z),(1.28,.08,.05),oak_light,.008)
    plank((2.18,2.14,1.29),(1.67,.4,.12),oak_light)
    lantern(-1.1,2.09,2.06);banner(.33,2.26,2.51)
def forge():
    room_shell('forge')
    # Irregular, individual refractory courses and a segmental stone arch.
    box('Hearth stone apron',(-2.22,1.26,.16),(1.82,2.06,.22),slate,.10)
    for row in range(9):
        z=.32+row*.185
        for side in [-1,1]:
            for depth in range(3):box('Refractory masonry',(-2.20+side*.58,.87+depth*.34,z),(.32,.32,.17),brick[(row+depth)%5],.023)
        if row>5:
            for col in range(3):box('Hood masonry',(-2.58+col*.38,.8,z),(.365,.33,.17),brick[(row+col+2)%5],.026)
    box('Black firebox',(-2.2,1.2,.83),(.90,.57,.95),coal,.08)
    for i in range(9):
        a=i*math.pi/8;o=box('Hearth arch voussoir',(-2.2+math.cos(a)*.59,.64,1.13+math.sin(a)*.36),(.24,.42,.23),brick[i%5],.025);o.rotation_euler[1]=a-math.pi/2
    box('Chimney lower hood',(-2.20,1.55,1.93),(1.44,1.37,.42),stone,.06)
    box('Chimney stack',(-2.20,1.8,2.44),(.93,.83,.82),brick[3],.055)
    for i in range(28):
        x=-2.2+random.uniform(-.40,.4);y=1.04+random.uniform(-.29,.25);z=.48+random.random()*.09
        sphere('Hot coals',(x,y,z),(.09,.09,.064),ember if i%4==0 else coal)
    for i in range(5):rod('Fire grate',(-2.57+i*.18,.66,.46),(-2.57+i*.18,1.48,.46),.026,iron)
    # Bellows: sculpted leather body, wooden cheeks, rivets and an iron air pipe.
    sphere('Bellows leather body',(-3.05,.42,.7),(.24,.51,.15),leather)
    for z in [.59,.83]:o=sphere('Bellows timber cheek',(-3.05,.42,z),(.25,.53,.045),oak_light)
    rod('Bellows nozzle',(-3.05,.84,.69),(-2.70,1.0,.6),.045,iron)
    # Anvil has a real silhouette: foot, waist, table, heel and a tapered horn.
    lathe('Anvil oak block',[(.08,.34,.29),(.23,.36,.31),(.66,.31,.28)],oak_dark,(-.82,-.28,0),16)
    for z in [.22,.54]:lathe('Stump hoop',[(z,.352,.306),(z+.044,.352,.306)],iron,(-.82,-.28,0),24)
    lathe('Anvil waist',[(.67,.28,.19),(.75,.23,.16),(.90,.145,.11),(1.00,.31,.18)],iron,(-.82,-.28,0),12)
    box('Anvil polished face',(-.82,-.28,1.045),(.72,.38,.14),steel,.028)
    bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.145,radius2=.02,depth=.43,location=(-1.33,-.28,1.065));o=finish(bpy.context.object,'Anvil drawn horn',steel);o.rotation_euler[1]=-math.pi/2
    box('Anvil heel',(-.34,-.28,1.04),(.26,.25,.11),steel,.02)
    cyl('Hardy socket',(-.30,-.28,1.099),.045,.006,iron,4)
    table(1.22,1.17,1.6,.78,.88)
    for x in [.77,1.18,1.58]:box('Bench ingot',(x,1.15,.97),(.27,.13,.10),steel,.028)
    box('Tool rail',(.02,2.18,1.76),(1.1,.10,.10),oak_light)
    for i in range(4):
        x=-.38+i*.24;rod('Hanging tool shaft',(x,2.1,1.74),(x,2.1,1.29),.02,oak_dark);box('Tool head',(x,2.1,1.31),(.14,.05,.065),iron,.016)
    barrel(-2.65,-1.41)
    cyl('Quench water',(-2.65,-1.41,.81),.249,.012,mat('Still water',(.075,.20,.19),.17,.25),32)
    table(2.3,-1.29,1.42,.70,.75)
    for z in [.84,.89,.94]:box('Folded linen',(2.44,-1.24,z),(.47,.34,.045),linen,.02)
    box('Pattern scroll',(1.87,-1.2,.85),(.36,.28,.025),paper,.012)
    for i in range(3):cyl('Oil bottle',(2.72,-1.28+i*.12,.90),.043,.22,mat('Oil green '+str(i),(.17,.23,.10),.26),12)
    # A pottery herb pot softens the spare workshop without hiding work surfaces.
    lathe('Glazed pot',[(0,.10,.10),(.18,.15,.15),(.28,.12,.12)],brick[2],(2.69,2.1,1.35))
    for i in range(8):
        a=i*2.4;curve('Herb stem',[(2.69,2.1,1.57),(2.69+math.cos(a)*.15,2.1+math.sin(a)*.13,1.87+random.random()*.13)],.013,leaf)
    for x,y in [(-3.2,-2.1),(3.2,-2.2)]:box('Plinth brass corner',(x,y,-.12),(.33,.32,.13),brass,.028)

def showroom():
    room_shell('shop');shelf(-1.75,1.88);shelf(.2,1.88)
    table(2.0,.48,1.65,.81,.96)
    box('Counter panel',(2.0,.10,.50),(1.55,.10,.73),pine,.035)
    for x in [1.48,2.02,2.56]:box('Counter framed panel',(x,.033,.5),(.43,.027,.57),oak,.025)
    box('Ledger',(1.88,.43,1.06),(.37,.29,.06),leather,.02);box('Ledger pages',(1.88,.43,1.084),(.34,.27,.025),paper,.01)
    for i in range(7):coin('Coins',(2.35+random.uniform(-.1,.1),.40+random.uniform(-.1,.1),1.025+random.random()*.02),.033)
    table(-.56,-.62,1.65,.72,.77)
    box('Display felt',(-.56,-.62,.837),(1.48,.59,.018),cloth,.05)
    for x in [-.94,-.30]:
        box('Dagger display rest',(x,-.48,.87),(.05,.12,.075),brass,.014)
    # A fitted garment mannequin and swags create a recognisable boutique.
    cyl('Mannequin stand',(-2.73,-1.38,.13),.27,.07,oak_dark)
    rod('Mannequin stem',(-2.73,-1.38,.16),(-2.73,-1.38,1.0),.045,oak)
    lathe('Linen fitting form',[(.9,.17,.11),(1.08,.19,.12),(1.38,.27,.145),(1.46,.13,.10)],linen,(-2.73,-1.38,0))
    box('Tied parcel',(.48,1.86,.94),(.34,.29,.2),linen,.025)
    curve('Parcel twine',[(.29,1.85,.94),(.48,1.85,1.05),(.67,1.85,.94)],.011,brass)
    box('Door mat',(.25,-2.20,.11),(1.5,.53,.025),leather,.035)
    for i in range(8):box('Woven mat rib',(-.37+i*.17,-2.20,.13),(.027,.48,.01),linen,.004)

def arena():
    room_shell('arena')
    for side in [-1,1]:
        for i in range(9):box('Boundary stones',(-3.22+i*.81,side*2.46,.13),(.75,.27,.19),stone,.07)
    for side in [-1,1]:
        for y in [-1.9,-.6,.7,2.0]:
            box('Arena rail post',(side*3.3,y,.59),(.15,.15,1.0),oak_dark,.024)
        for z in [.39,.90]:rod('Arena rails',(side*3.30,-1.94,z),(side*3.30,2.04,z),.045,oak)
    for x in [-2.32,2.32]:
        for dx in [-.60,.60]:box('Gate upright',(x+dx,2.49,.92),(.16,.20,1.78),oak,.025)
        box('Gate lintel',(x,2.49,1.76),(1.42,.25,.18),oak_dark,.035)
        banner(x,2.48,1.68,cloth if x<0 else red)
    # Low terraces frame the contest; an open foreground keeps feet and weapons readable.
    for row in range(3):
        y=2.69+row*.36;z=.20+row*.28
        box('Terrace riser',(0,y,z/2),(3.45,.38,z),stone,.032)
        plank((0,y,z+.025),(3.52,.34,.08),oak)
    for x in [-3.47,3.47]:
        for z in [.28,.64,1.0]:box('Sandstone gate pier',(x,2.46,z),(.35,.45,.35),stone,.045)
        box('Pier cap',(x,2.46,1.22),(.44,.53,.12),stone,.03)
        lantern(x,2.44,1.48)
    for i in range(22):
        x=random.uniform(-2.85,2.85);y=random.uniform(-1.9,1.9)
        angle=random.uniform(0,math.tau);length=random.uniform(.06,.18)
        curve('Scuffed sand',[(x,y,.073),(x+math.cos(angle)*length,y+math.sin(angle)*length,.073)],.004,stone)
    # Ring markings are shallow inlays rather than emissive game lanes.
    curve('Arena circle',[(2.07*math.cos(i*math.tau/48),1.73*math.sin(i*math.tau/48),.085) for i in range(49)],.016,linen)
    for x in [-1.15,1.15]:curve('Formation mark',[(x,-.64,.084),(x,.64,.084)],.012,linen)

def character():
    root=empty('Character');hips=empty('Hips',(0,0,.72),root)
    lathe('Tailored tunic',[(0,.23,.14),(.12,.21,.14),(.34,.27,.16),(.45,.25,.145),(.51,.12,.105)],cloth,(0,0,-.03),parent=hips)
    # Surface darts and piping follow the body, rather than floating decorative cubes.
    for s in [-1,1]:curve('Tunic seams',[(s*.19,-.14,.03),(s*.16,-.151,.21),(s*.22,-.139,.36)],.006,oak_light,hips)
    lathe('Waist belt',[(.12,.223,.154),(.18,.223,.154)],leather,parent=hips)
    box('Buckle',(0,-.16,.15),(.095,.027,.068),brass,.012,hips)
    for i in range(3):sphere('Tunic button',(0,-.16,.29+i*.057),(.012,.009,.012),brass,hips)
    apron=mesh_obj('SmithApron',[(-.16,-.163,.34),(.16,-.163,.34),(.19,-.16,-.07),(.17,-.16,-.17),(-.17,-.16,-.17),(-.19,-.16,-.07)],[(0,1,2,3,4,5)],leather,hips)
    so=apron.modifiers.new('Thick apron leather','SOLIDIFY');so.thickness=.012;bpy.context.view_layer.objects.active=apron;bpy.ops.object.modifier_apply(modifier=so.name)
    armor=lathe('MailBody',[(0,.239,.155),(.10,.233,.165),(.30,.279,.177),(.41,.26,.16)],iron,(0,0,.01),parent=hips)
    # Raised mail rows catch light at a distance without individual-ring geometry.
    for row in range(7):
        z=.06+row*.043
        curve('MailRow',[(math.cos(t)*.247,math.sin(t)*.17,z) for t in [i*math.pi/18+math.pi for i in range(19)]],.0065,steel,hips)
    for side,sign in [('L',-1),('R',1)]:
        thigh=empty('Thigh_'+side,(sign*.12,0,.71),root)
        lathe('Trouser thigh',[(0,.102,.105),(-.19,.087,.094),(-.30,.08,.079)],linen,parent=thigh)
        shin=empty('Shin_'+side,(0,0,-.28),thigh)
        lathe('Boot upper',[(.04,.085,.09),(-.17,.068,.069),(-.28,.091,.105)],leather,parent=shin)
        sphere('Boot toe',(0,-.066,-.285),(.10,.173,.071),leather,shin)
        box('Boot sole',(0,-.05,-.331),(.194,.292,.037),oak_dark,.012,shin)
        shoulder=empty('Shoulder_'+side,(sign*.276,0,1.14),root)
        lathe('Rolled sleeve',[(.035,.115,.115),(-.12,.105,.10),(-.21,.082,.083)],cloth,parent=shoulder)
        lathe('Sleeve cuff',[(-.18,.089,.09),(-.22,.089,.09)],linen,parent=shoulder)
        elbow=empty('Elbow_'+side,(0,0,-.22),shoulder)
        lathe('Forearm',[(.015,.070,.07),(-.12,.06,.06),(-.22,.047,.05)],skin,parent=elbow)
        lathe('Bracer',[(-.09,.065,.065),(-.21,.056,.06)],leather,parent=elbow)
        hand=empty('Hand_'+side,(0,0,-.25),elbow)
        sphere('Gloved hand',(0,-.012,-.025),(.063,.049,.078),leather,hand)
        for f in range(3):curve('Glove stitching',[(sign*(.033-f*.018),-.055,.003),(sign*(.033-f*.018),-.057,-.06)],.003,linen,hand)
        empty('Grip_'+side,(0,-.025,-.038),hand)
    neck=empty('Head',(0,0,1.34),root)
    cyl('Neck',(0,0,-.052),.075,.15,skin,20,neck)
    sphere('Sculpted face',(0,-.019,.123),(.169,.142,.205),skin,neck)
    for sign in [-1,1]:
        sphere('Ear',(sign*.163,-.016,.137),(.038,.026,.055),skin,neck)
        sphere('Eye white',(sign*.061,-.149,.156),(.037,.018,.028),cream,neck)
        sphere('Eye pupil',(sign*.061,-.165,.156),(.015,.007,.019),eyes,neck)
        sphere('Eye glint',(sign*.064,-.172,.164),(.005,.003,.006),cream,neck)
        curve('Expressive brow',[(sign*.030,-.15,.198),(sign*.063,-.153,.206),(sign*.097,-.136,.2)],.011,hair,neck)
    sphere('Nose',(0,-.164,.114),(.028,.033,.039),skin,neck)
    curve('Gentle mouth',[(-.034,-.151,.064),(0,-.159,.058),(.034,-.151,.065)],.005,leather,neck)
    sphere('Hair cap',(0,.023,.24),(.176,.145,.12),hair,neck)
    for i in range(6):
        x=(i-2.5)*.05;o=sphere('Swept hair locks',(x,-.113+.025*abs(i-2.5),.274-random.random()*.03),(.047,.044,.087),hair,neck);o.rotation_euler[1]=-.40
    for sign in [-1,1]:sphere('Sideburn',(sign*.15,-.035,.187),(.028,.07,.068),hair,neck)
    empty('ChestCharm',(0,-.19,1.03),root)
    return root

def dagger():
    root=empty('Dagger')
    blade=mat('Blade metal',(.80,.82,.82),.24,.94,kind='metal');edge=mat('Honed edge',(.87,.9,.9),.17,.96)
    grip=mat('Grip leather',(.21,.075,.036),.64,kind='leather');fitting=mat('Fitting metal',(.53,.34,.11),.29,.84)
    # Diamond-section tapered blade with actual central ridge and separate cutting facets.
    levels=[(.28,.038,.012),(.34,.045,.016),(.75,.031,.013),(.94,.015,.007),(1.06,.001,.001)]
    verts=[]
    for z,w,d in levels:verts.extend([(-w,0,z),(0,-d,z),(w,0,z),(0,d,z)])
    faces=[]
    for i in range(len(levels)-1):
        for k in range(4):faces.append((i*4+k,i*4+(k+1)%4,(i+1)*4+(k+1)%4,(i+1)*4+k))
    o=mesh_obj('Blade',verts,faces,blade,root);o.data.materials.append(edge)
    for p in o.data.polygons:p.material_index=p.index%2
    for z,r in [(.065,.069),(.275,.085)]:
        lathe('Rondel fitting',[(z-.016,r*.86,r*.86),(z-.006,r,r),(z+.006,r,r),(z+.016,r*.86,r*.86)],fitting,parent=root)
        for i in range(12):a=i*math.tau/12;sphere('Rondel rivet',(math.cos(a)*r*.81,math.sin(a)*r*.81,z+.014),(.006,.006,.004),brass,root)
    lathe('Bound leather grip',[(.075,.028,.026),(.13,.033,.029),(.21,.029,.026),(.262,.028,.026)],grip,parent=root)
    for i in range(10):curve('Grip wrap',[(math.cos(a)*.034,math.sin(a)*.030,.09+i*.016+(a/math.tau)*.013) for a in [j*math.tau/18 for j in range(19)]],.0028,oak_light,root)
    sphere('Pommel cabochon',(0,0,.047),(.022,.022,.012),brass,root)
    detail=empty('QualityDetail',parent=root)
    for z in [.306,.38]:
        curve('Silver filigree',[(-.027,-.014,z),(0,-.018,z+.035),(.027,-.014,z),(0,-.018,z+.015),(-.027,-.014,z)],.0018,fitting,detail)
    for z in [.48,.53,.58]:curve('Fine chisel line',[(-.009,-.014,z),(0,-.016,z+.018),(.009,-.014,z)],.0012,fitting,detail)
    prefix=empty('PrefixDetail',parent=root)
    for z in [.43,.50,.57,.64]:curve('Precision marks',[(-.012,-.014,z),(.012,-.014,z)],.0015,iron,prefix)
    etch=mat('Inscription',(.95,.37,.045),.33,.15,emission=2)
    runes=empty('RuneDetail',parent=root)
    for z in [.48,.59,.7]:curve('Inset rune',[(0,-.018,z-.03),(-.01,-.018,z),(.009,-.018,z+.014),(0,-.018,z+.037)],.0024,etch,runes)
    return root

def shield():
    root=empty('Shield')
    verts=[(-.22,0,.31),(.22,0,.31),(.23,0,.04),(.12,0,-.21),(0,0,-.31),(-.12,0,-.21),(-.23,0,.04)]
    o=mesh_obj('Heater wood',verts,[tuple(range(7))],oak,root);so=o.modifiers.new('Wood thickness','SOLIDIFY');so.thickness=.05;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=so.name);bevel(o,.015)
    curve('Shield rim',[(x,-.035,z) for x,y,z in verts]+[(-.22,-.035,.31)],.022,iron,root)
    mesh_obj('Painted shield face',[(x*.85,-.04,z*.86) for x,y,z in verts],[tuple(range(7))],cloth,root)
    sphere('Shield boss',(0,-.052,.065),(.077,.05,.077),steel,root)
    curve('Shield vertical inlay',[(0,-.045,.29),(0,-.045,-.24)],.011,brass,root)
    rod('Back hand grip',(-.08,.05,0),(.08,.05,0),.028,leather,root)
    return root

def hammer():
    root=empty('Hammer')
    lathe('Ash handle',[(0,.028,.025),(.08,.034,.027),(.29,.025,.021),(.42,.024,.024)],oak_light,parent=root)
    box('Forged hammer head',(0,0,.40),(.25,.074,.084),iron,.018,root)
    box('Polished striking face',(-.125,0,.40),(.019,.082,.091),steel,.01,root)
    box('Peened wedge',(0,0,.45),(.045,.035,.012),brass,.005,root)
    return root

def export(name,creator,merge=False):
    before=set(bpy.data.objects);creator();objs=[o for o in bpy.data.objects if o not in before]
    for o in objs:
        if o.type!='MESH' or o.data.uv_layers:continue
        uv=o.data.uv_layers.new(name='Surface grain')
        for face in o.data.polygons:
            axis=max(range(3),key=lambda i:abs(face.normal[i]));a,b=[i for i in range(3) if i!=axis]
            for li in face.loop_indices:
                co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(co[a]*1.7,co[b]*1.7)
    if merge:
        # Static geometry batched by material for an affordable browser draw count.
        mats={o.data.materials[0] for o in objs if o.type=='MESH' and len(o.data.materials)==1 and not o.get('ambient')}
        for m in mats:
            selected=[o for o in bpy.data.objects if o not in before and o.type=='MESH' and len(o.data.materials)==1 and o.data.materials[0]==m and not o.get('ambient')]
            bpy.ops.object.select_all(action='DESELECT')
            for o in selected:o.select_set(True)
            bpy.context.view_layer.objects.active=selected[0]
            if len(selected)>1:bpy.ops.object.join()
            bpy.context.object.name='Environment_'+m.name
        objs=[o for o in bpy.data.objects if o not in before]
    else:
        # Batch only rigid parts sharing a joint and material. Preserve all articulation.
        def category(o):return 'Mail' if o.name.startswith('Mail') else 'Apron' if o.name.startswith(('SmithApron','Apron')) else 'Part'
        keys={(o.parent,o.data.materials[0],category(o)) for o in objs if o.type=='MESH' and len(o.data.materials)==1}
        for par,material,cat in keys:
            selected=[o for o in bpy.data.objects if o not in before and o.type=='MESH' and len(o.data.materials)==1 and o.parent==par and o.data.materials[0]==material and category(o)==cat]
            if not selected:continue
            bpy.ops.object.select_all(action='DESELECT')
            for o in selected:o.select_set(True)
            bpy.context.view_layer.objects.active=selected[0]
            if len(selected)>1:bpy.ops.object.join()
            bpy.context.object.name=cat+'_'+material.name
        objs=[o for o in bpy.data.objects if o not in before]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:o.select_set(True)
    bpy.context.view_layer.update()
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_animations=False,export_yup=True)
    # Keep all authored packages separated in an editable .blend.
    col=bpy.data.collections.new('ASSET_'+name);bpy.context.scene.collection.children.link(col)
    for o in objs:
        for c in list(o.users_collection):c.objects.unlink(o)
        col.objects.link(o)
    col.hide_viewport=True;col.hide_render=True
    count=sum(len(o.data.polygons) for o in objs if o.type=='MESH')
    return {'file':name+'.glb','objects':len(objs),'polygons':count,'bytes':(OUT/(name+'.glb')).stat().st_size}

manifest=[]
for name,creator,merge in [('forge',forge,True),('showroom',showroom,True),('arena',arena,True),('character',character,False),('dagger',dagger,False),('shield',shield,False),('hammer',hammer,False)]:
    manifest.append(export(name,creator,merge));print('AUTHORED',manifest[-1],flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'atelier-source.blend'))
(OUT/'manifest.json').write_text(json.dumps({'author':'Ember & Iron — original Blender-authored diorama slice','generator':'design/tools/build_atelier_assets.py','coordinates':'glTF +Y up, character forward +Z','assets':manifest},indent=2),encoding='utf8')
print('ATELIER ASSETS COMPLETE',flush=True)
