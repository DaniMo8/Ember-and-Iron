"""Author the complete House room and item library with Blender, independently of the slice.
Run: blender --background --factory-startup --python design/tools/build_campaign_assets.py
All geometry, materials and textures are original. Outputs are shared modular kits.
"""
from pathlib import Path
SOURCE = Path(__file__).with_name('build_atelier_assets.py')
exec(compile(SOURCE.read_text().split('manifest=[]')[0], str(SOURCE), 'exec'))
OUT = ROOT / 'assets' / 'house3d'
OUT.mkdir(parents=True, exist_ok=True)

blade = mat('Blade metal', (.58,.63,.64), .29, .91, kind='metal')
fitting = mat('Fitting metal', (.43,.30,.13), .42, .82)
grip = mat('Grip leather', (.14,.065,.033), .87, kind='leather')
rune = mat('Inscription', (.30,.67,.75), .25, .3, emission=1.2)

def group(name, fn, **extras):
    before=set(bpy.data.objects); root=empty(name)
    for k,v in extras.items():root[k]=v
    fn()
    for o in set(bpy.data.objects)-before-{root}:
        if not o.parent:o.parent=root
    return root

def books(x,y,z):
    for i in range(5):
        box('Bound folio',(x+i*.085,y,z+.09),(.07,.21,.18),[leather,cloth,red][i%3],.008)
        box('Folio pages',(x+i*.085,y-.008,z+.09),(.062,.205,.15),paper,.003)

def chest(x,y):
    box('Iron bound chest',(x,y,.32),(.94,.56,.57),oak,.04)
    for dx in [-.34,.34]:box('Chest band',(x+dx,y,.33),(.05,.58,.59),iron,.009)
    box('Chest clasp',(x,y-.3,.37),(.09,.04,.18),brass,.015)

def chair(x,y):
    for dx in [-.20,.20]:
        for dy in [-.20,.20]:box('Chair leg',(x+dx,y+dy,.25),(.06,.06,.5),oak,.015)
    box('Chair seat',(x,y,.50),(.53,.52,.08),oak_light,.025)
    box('Chair back',(x,y+.22,.83),(.53,.07,.67),oak,.03)

def stage_props(room, level):
    # The room decides its expansion language; development never imports another room's props.
    if room=='arena':
        if level==1:
            for x in [-2.32,2.32]:banner(x,2.47,2.27,cloth if x<0 else red)
        elif level==2:
            for row in range(2):
                box('Expanded spectator terrace',(0,3.25+row*.34,.42+row*.16),(5.8,.34,.60+row*.32),stone,.035)
                plank((0,3.25+row*.34,.75+row*.32),(5.85,.34,.08),oak)
        elif level==3:
            for x in [-3.35,3.35]:
                cyl('Champion gate pillar',(x,2.66,1.55),.23,3.1,slate)
                cyl('Gate capital',(x,2.66,3.04),.31,.16,brass)
            box('Champion arch lintel',(0,2.70,3.12),(7.15,.4,.25),stone,.06)
        else:
            curve('Gilded arena circle',[(2.17*math.cos(t),1.82*math.sin(t),.086) for t in np.linspace(0,math.tau,65)],.018,brass)
            for x in [-2.5,2.5]:lantern(x,2.33,2.58)
        return
    if room=='mine':
        if level==1:chest(2.66,-1.8)
        elif level==2:
            for x in [-3.15,3.15]:box('Iron pit reinforcement',(x,1.86,1.2),(.19,.28,2.4),iron,.018)
            rod('Reinforced pit crown',(-3.15,1.86,2.35),(3.15,1.86,2.35),.11,iron)
        elif level==3:
            for x in [1.7,2.8]:box('Hoist upright',(x,-1.7,.95),(.16,.18,1.9),oak,.025)
            rod('Hoist axle',(1.66,-1.7,1.66),(2.85,-1.7,1.66),.095,iron)
            cyl('Winding drum',(2.25,-1.7,1.66),.25,.50,oak).rotation_euler[1]=math.pi/2
        else:
            for x in [-2.3,2.3]:
                lantern(x,1.65,2.02)
                for i in range(4):sphere('Deep crystal seam',(x-.36+i*.22,2.06,1.45),(.12,.07,.22),rune)
        return
    if room=='smelter':
        if level==1:barrel(2.8,-1.85)
        elif level==2:
            for x in [-2.25,.25]:lathe('Alloy crucible',[(0,.18,.18),(.31,.24,.24),(.34,.22,.22)],iron,(x,-1.3,.72))
        elif level==3:
            for x in [-2.25,.25]:box('Furnace brass regulator',(x,.68,1.73),(.34,.09,.19),brass,.025)
        else:
            for x in [-2.25,.25]:box('Master furnace canopy',(x,1.3,2.95),(1.4,1.4,.15),brass,.045)
        return
    if level==1:chest(2.64,-1.95)
    elif level==2:
        lantern(3.1,1.9,2.25)
        if room=='forge':
            for x in [.9,1.2,1.5]:rod('Precision finishing tool',(x,2.16,1.75),(x,2.16,2.14),.019,steel)
        else:
            plank((-2.30,2.03,.97),(.75,.30,.08),oak);books(-2.53,2.0,1.02)
    elif level==3:
        banner(-2.9,2.27,2.55,red)
        for x in [-3.3,3.3]:box('Dressed corner pillar',(x,2.24,1.35),(.24,.27,2.65),stone,.05)
    else:
        for x in [-3.28,3.28]:
            cyl('Masterwork column',(x,2.1,1.45),.19,2.9,slate)
            for z in [.17,2.8]:cyl('Column capital',(x,2.1,z),.27,.18,brass)
        curve('House crest',[(.45*math.cos(t),2.26,2.16+.45*math.sin(t)) for t in np.linspace(0,math.tau,45)],.035,brass)

def mine():
    box('Excavated bedrock',(0,0,-.22),(7.2,5.5,.5),slate,.19)
    box('Packed earth',(0,0,.01),(7,5.3,.12),sand,.09)
    for i in range(34):
        x=-3.4+(i%12)*.61; y=2.5 if i<24 else -.4+(i-24)*.30
        if i>=24:x=-3.45
        sphere('Fractured rock face',(x,y,.58 if i>=24 else .38+(i//12)*.83),(.48,.38,.59),slate)
    for x in [-2.3,0,2.3]:
        for dx in [-.61,.61]:box('Pit timber',(x+dx,1.98,1.0),(.17,.24,2),oak_dark,.02)
        box('Crossbeam',(x,1.98,2),(1.48,.3,.22),oak,.025)
        box('Shaft darkness',(x,2.19,.98),(1.08,.1,1.75),coal,.1)
        lantern(x+.43,1.79,1.6)
    for x in [-.34,.34]:rod('Wagon rail',(x,-2.4,.10),(x,1.9,.10),.035,iron)
    for y in np.linspace(-2.3,1.7,12):box('Rail sleeper',(0,y,.04),(1.1,.15,.08),oak_dark,.015)
    box('Ore wagon',(0,.77,.63),(1.10,.8,.56),iron,.05)
    for x in [-.51,.51]:
        for y in [.46,1.08]:o=cyl('Wagon wheel',(x,y,.25),.18,.10,iron);o.rotation_euler[1]=math.pi/2
    for i in range(10):sphere('Wagon ore',(random.uniform(-.4,.4),random.uniform(.47,1.07),.94),(.14,.13,.12),stone)
    for i in range(25):sphere('Loose rubble',(random.uniform(-3,3),random.uniform(-2,1.8),.12),(.06,.10,.05),stone)
    barrel(-2.6,-1.7)

def smelter():
    room_shell('forge')
    # A masonry furnace and casting beds, distinct from the smith's anvil room.
    for x in [-2.25, .25]:
        for row in range(10):
            for side in [-1,1]:box('Foundry brick',(x+side*.43,1.3,.23+row*.16),(.32,.95,.15),brick[row%5],.015)
        box('Furnace throat',(x,1.77,1.1),(.53,.12,1.58),coal,.03)
        box('White hot charge',(x,1.24,.45),(.53,.62,.28),ember,.06)
        box('Sooted chimney',(x,1.3,2.3),(1.18,1.13,1.25),iron,.04)
        curve('Flue collar',[(x-.62,.71,1.77),(x+.62,.71,1.77)],.04,brass)
        table(x,-1.30,1.55,.64,.63)
        for dx in [-.42,0,.42]:box('Casting mould',(x+dx,-1.30,.73),(.29,.48,.12),iron,.025)
    barrel(2.8,1.4);table(2.35,-1,1.05,.75,.85)
    for i in range(7):box('Foundry ingot',(2.1+(i%3)*.20,-1+(i//3)*.18,.94),(.18,.11,.09),steel,.02)
    for z in [.25,.51]:rod('Tongs on wall',(-.9,2.18,z+1.7),(-.5,2.18,z+1.5),.016,iron)

def smith():
    room_shell('shop');table(-.85,.45,2.2,1.15,.78);chair(-.85,1.36)
    box('Open commission ledger',(-1,.43,.86),(.74,.45,.06),paper,.01)
    for i in range(7):curve('Written ledger line',[(-1.3,.28+i*.045,.897),(-.74,.28+i*.045,.897)],.0017,iron)
    cyl('Ink well',(-.3,.64,.91),.055,.09,iron)
    rod('Quill',(-.3,.64,.96),(-.20,.65,1.14),.01,cream)
    shelf(-1.88,2.08);books(-2.53,1.99,.89);books(-1.67,1.99,1.55)
    chest(2.1,.5);barrel(-2.8,-1.65)
    box('Calling plans',(1.15,2.20,1.80),(1.12,.025,.70),paper,.025)
    for i in range(4):rod('Plan strokes',(.80+i*.22,2.17,1.56),(.88+i*.22,2.17,2.05),.009,oak_dark)

def employees():
    room_shell('shop');table(-.15,-.35,2.40,1.0,.74)
    for x in [-1,0,1]:
        chair(x,.50)
        cyl('Pewter mug',(x,-.35,.86),.065,.17,iron)
        sphere('Bread loaf',(x,-.61,.85),(.16,.09,.06),oak_light)
    for x in [-2.5,2.5]:
        box('Bunk lower',(x,1.4,.43),(1.3,.85,.15),oak,.03)
        box('Rolled wool blanket',(x,1.45,.56),(1.12,.70,.12),linen,.08)
        box('Foot locker',(x,.47,.26),(1.0,.43,.48),oak_dark,.03)
    lantern(0,2.13,2.05)
    box('Duty board',(0,2.23,1.72),(1.68,.07,.94),oak_dark,.04)
    for i in range(4):box('Shift note',(-.57+i*.38,2.18,1.73),(.30,.02,.62),paper,.012)

def legacy():
    room_shell('shop')
    box('Memorial dais',(0,.8,.22),(3.25,1.7,.43),slate,.09)
    for i in range(3):box('Dais step',(0,-.32-i*.28,.15-i*.04),(2.45,.28,.24-i*.07),stone,.025)
    cyl('Ancestral pedestal',(0,.78,.73),.39,1.0,stone)
    box('Inherited anvil',(0,.78,1.28),(1.06,.36,.30),brass,.055)
    for x in [-2.5,-1.3,1.3,2.5]:
        cyl('Memorial pillar',(x,1.95,1.4),.23,2.85,slate)
        for z in [.18,2.72]:cyl('Gilded capital',(x,1.95,z),.31,.16,brass)
        lantern(x,1.51,1.44)
    for x in [-1.3,1.3]:banner(x,1.63,2.51,red)
    curve('Ancestral halo',[(.72*math.cos(t),2.2,1.98+.72*math.sin(t)) for t in np.linspace(0,math.tau,65)],.033,brass)

def world():
    for name,fn in [('smith',smith),('mine',mine),('smelter',smelter),('employees',employees),('legacy',legacy)]:
        root=group('Room_'+name,fn)
        if name!='legacy':
            for level in range(1,5):
                g=group('Stage_'+name+'_'+str(level),lambda:stage_props(name,level),stage=level);g.parent=root
    # Additional development for the three rooms authored in the Atelier collection.
    for name in ['forge','shop','arena']:
        root=empty('Evolution_'+name)
        for level in range(1,5):
            g=group('Stage_'+name+'_'+str(level),lambda:stage_props(name,level),stage=level);g.parent=root

def handle(root, length=.35):
    lathe('Bound grip',[(0,.032,.027),(length*.5,.035,.03),(length,.028,.025)],grip,parent=root)
    for z in np.linspace(.04,length-.02,8):curve('Leather binding',[(math.cos(t)*.035,math.sin(t)*.032,z) for t in np.linspace(0,math.tau,17)],.0025,oak_light,root)
    sphere('Pommel',(0,0,-.035),(.053,.044,.052),fitting,root)

def detail(root, height):
    d=empty('QualityDetail',parent=root)
    for i in range(4):curve('Engraved scroll',[(.02*math.cos(t),-.038,height*.55+i*.07+.02*math.sin(t)) for t in np.linspace(0,math.pi*1.8,18)],.0025,fitting,d)
    p=empty('PrefixDetail',parent=root)
    sphere('Maker gemstone',(0,-.046,height*.30),(.033,.018,.045),rune,p)
    r=empty('RuneDetail',parent=root)
    for z in [height*.43,height*.60,height*.76]:curve('Inlaid rune',[(-.018,-.044,z-.027),(.018,-.044,z),(0,-.044,z+.025),(-.018,-.044,z)],.003,rune,r)

def item(family):
    root=empty('Kit_'+family)
    if family in ['daggers','swords','polearms']:
        length={'daggers':1.02,'swords':1.52,'polearms':2.15}[family];h=.28 if family=='daggers' else .37 if family=='swords' else 1.35
        handle(root,h)
        widths=[.052,.074,.051,.005] if family!='polearms' else [.03,.13,.095,.002]
        verts=[]
        for z,w in zip([h,h+.15,length-.22,length],widths):verts += [(-w,0,z),(0,-.02,z),(w,0,z),(0,.02,z)]
        mesh_obj('Forged blade',verts,[(i*4+k,i*4+(k+1)%4,(i+1)*4+(k+1)%4,(i+1)*4+k) for i in range(3) for k in range(4)],blade,root)
        box('Crossguard',(0,0,h),(.25 if family=='swords' else .17,.06,.035),fitting,.014,root)
    elif family in ['axes','maces','tools']:
        length=1.15;handle(root,.8)
        if family=='maces':
            for i in range(6):
                o=box('Mace flange',(0,0,.91),(.27,.035,.28),blade,.018,root);o.rotation_euler[2]=i*math.pi/3
        else:
            verts=[(-.05,-.045,.70),(.33,-.045,.73),(.38,-.045,1.11),(-.05,-.045,1.02),(-.05,.045,.70),(.33,.045,.73),(.38,.045,1.11),(-.05,.045,1.02)]
            mesh_obj('Bearded axe' if family=='axes' else 'Adze head',verts,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],blade,root)
    elif family=='bows':
        length=1.8
        curve('Yew bow limbs',[(.24*math.sin(t),0,.9+.9*math.cos(t)) for t in np.linspace(0,math.pi,33)],.035,oak_light,root)
        rod('Bowstring',(0,0,0),(0,0,1.8),.0035,linen,root)
        lathe('Leather bow grip',[(.77,.038,.036),(1.03,.038,.036)],grip,(.237,0,0),parent=root)
        rod('Nocked arrow',(-.45,-.01,.9),(.65,-.01,.9),.009,oak,root)
        sphere('Arrowhead',(.70,-.01,.9),(.08,.022,.022),blade,root)
    elif family=='foci':
        length=1.9;handle(root,1.53)
        for i in range(4):
            t=i*math.pi/2;curve('Crystal prong',[(0,0,1.46),(.14*math.cos(t),.14*math.sin(t),1.75),(.07*math.cos(t),.07*math.sin(t),1.91)],.022,fitting,root)
        sphere('Focus crystal',(0,0,1.76),(.12,.12,.20),rune,root)
    elif family in ['armor','cloth_armor','leather_armor']:
        length=.70;m=blade if family=='armor' else cloth if family=='cloth_armor' else grip
        lathe('Fitted cuirass',[(0,.24,.16),(.16,.23,.15),(.42,.29,.17),(.55,.26,.16),(.63,.12,.1)],m,parent=root)
        for side in [-1,1]:sphere('Shoulder cap',(side*.29,0,.46),(.15,.17,.13),m,root)
        if family=='armor':
            for z in np.linspace(.05,.43,10):curve('Mail weave',[(.253*math.cos(t),.174*math.sin(t),z) for t in np.linspace(0,math.tau,39)],.004,steel,root)
        else:
            for z in [.20,.29,.38,.47]:sphere('Doublet fastener',(0,-.175,z),(.014,.012,.013),fitting,root)
        lathe('Armour belt',[(.14,.246,.17),(.20,.246,.17)],grip,parent=root)
    elif family=='shields':
        before=set(bpy.data.objects);child=shield();child.parent=root;child.location.z=.34;length=.70
    elif family in ['rings','charms','talismans']:
        length=.38
        curve('Worked metal hoop',[(.16*math.cos(t),0,.19+.16*math.sin(t)) for t in np.linspace(0,math.tau,49)],.018,fitting,root)
        sphere('Set gemstone',(0,-.027,.35),(.075,.043,.07),rune,root)
        if family!='rings':
            curve('Pendant chain',[(.18*math.cos(t),0,.40+.24*math.sin(t)) for t in np.linspace(0,math.pi,25)],.009,fitting,root)
            sphere('Reliquary',(0,0,.12),(.10,.05,.11),blade,root)
    elif family=='offhands':
        length=.60
        box('Bound grimoire',(0,0,.30),(.36,.12,.54),grip,.025,root)
        box('Vellum pages',(0,-.012,.30),(.33,.13,.50),paper,.008,root)
        for y in [-.08,.08]:box('Engraved cover',(0,y,.30),(.39,.024,.56),fitting,.01,root)
        for z in [.10,.50]:box('Book clasp',(.17,-.09,z),(.05,.02,.06),blade,.006,root)
    else:
        length=.9
        sphere('Lute soundbox',(0,0,.28),(.23,.12,.29),oak_light,root)
        box('Lute neck',(0,0,.64),(.09,.07,.58),oak,.015,root)
        cyl('Soundhole',(0,-.12,.30),.066,.01,coal,parent=root).rotation_euler[0]=math.pi/2
        for dx in [-.024,-.008,.008,.024]:rod('Lute string',(dx,-.13,.13),(dx,-.05,.93),.002,brass,root)
    detail(root,length)
    return root

def catalogue():
    for family in ['daggers','swords','axes','maces','polearms','bows','foci','armor','shields','rings','charms','tools','cloth_armor','leather_armor','offhands','instruments','talismans']:item(family)
    root=empty('Kit_ingot');box('Stamped ingot',(0,0,.065),(.36,.19,.13),blade,.045,root)
    root=empty('Kit_ore')
    for i in range(5):sphere('Mineral crystal',((i%2)*.12-.06,(i//2)*.07-.07,.08+i*.025),(.11,.10,.10),blade,root)

manifest=[export('house-world',world,False),export('catalogue',catalogue,False)]
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'house-source.blend'))
(OUT/'manifest.json').write_text(json.dumps({'generator':'design/tools/build_campaign_assets.py','assets':manifest},indent=2))
print('HOUSE LIBRARY COMPLETE',manifest,flush=True)
