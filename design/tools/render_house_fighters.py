"""Six original tabletop fighter miniatures for the house portraits and replays."""
from pathlib import Path
source = Path(__file__).with_name('render_house_art.py').read_text(encoding='utf8')
exec(source.split("\nfor kind in ['splash'")[0])

skin=material('Warm terracotta skin',(.47,.28,.18))
silver=material('Polished armour',(.34,.42,.46),.8,.25)
cloth=material('Indigo wool',(.10,.10,.25))

def sphere(name,loc,scale,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o

def rod(name,a,b,r,mat):
    d=Vector(b)-Vector(a)
    o=cyl(name,(Vector(a)+Vector(b))/2,r,d.length,mat)
    o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    return o

for role in ['vanguard','duelist','ranger','breaker','guardian','mage']:
    reset()
    armor=role in ['vanguard','guardian','breaker']
    coat=teal if role in ['ranger','duelist'] else cloth if role=='mage' else steel
    cyl('Miniature plinth',(0,0,.08),.53,.13,gold)
    for x in [-.17,.17]:
        cube('Leather boots',(x,-.06,.23),(.22,.38,.23),walnut,.07)
        rod('Greaves',(x,0,.32),(x,0,.79),.115,silver if armor else coat)
    sphere('Coat',(0,0,1),(.34,.24,.40),silver if armor else coat)
    cube('Long house tabard',(0,-.235,.80),(.31,.06,.50),teal,.025)
    cube('Brass belt',(0,-.01,.9),(.66,.47,.07),gold,.035)
    cube('Belt buckle',(0,-.26,.91),(.14,.055,.13),gold,.018)
    for x in [-.39,.39]:
        sphere('Shoulder',(x,0,1.22),(.17,.19,.16),silver if armor else coat)
        rod('Sleeve',(x,0,1.17),(x*1.2,-.10,.94),.10,coat)
        sphere('Glove',(x*1.2,-.13,.91),(.12,.12,.12),walnut)
    sphere('Face',(0,-.015,1.54),(.22,.20,.25),skin)
    if armor:
        sphere('Helmet',(0,.035,1.65),(.24,.22,.20),silver)
        cube('Visor',(0,-.213,1.56),(.39,.055,.17),steel,.04)
        cube('Visor gleam',(0,-.246,1.58),(.31,.015,.025),gold,.009)
        rod('Nose guard',(0,-.239,1.61),(0,-.24,1.43),.024,gold)
        if role=='guardian':sphere('Helmet crest',(0,.07,1.86),(.055,.17,.19),teal)
    else:
        sphere('Hood',(0,.10,1.65),(.26,.25,.24),coat)
        for x in [-.073,.073]:sphere('Eyes',(x,-.209,1.56),(.018,.017,.02),steel)
        if role=='mage':
            bpy.ops.mesh.primitive_cone_add(vertices=40,radius1=.26,radius2=.025,depth=.49,location=(0,.08,1.97));bpy.context.object.data.materials.append(cloth)
    if role in ['vanguard','guardian']:
        shield=cube('Kite shield',(-.52,-.27,.96),(.42,.12,.64),steel,.10)
        cube('Shield centre',(-.52,-.342,.97),(.32,.025,.50),teal,.06)
        rod('Shield cross',(-.52,-.36,.78),(-.52,-.36,1.18),.025,gold)
        rod('Shield cross',(-.66,-.36,1.01),(-.38,-.36,1.01),.025,gold)
    if role=='ranger':
        pts=[(.54+.20*math.sin(t*math.pi),-.17,.48+t*1.1) for t in [i/12 for i in range(13)]]
        for a,b in zip(pts,pts[1:]):rod('Bow limb',a,b,.031,walnut)
        rod('Bow string',pts[0],pts[-1],.006,paper)
        rod('Arrow',(.3,-.25,.99),(.85,-.25,1.03),.012,gold)
    elif role=='mage':
        rod('Ash staff',(.53,-.12,.25),(.53,-.12,1.97),.035,walnut)
        sphere('Spell crystal',(.53,-.12,2.03),(.11,.11,.17),blue)
    elif role=='breaker':
        rod('Axe haft',(.51,-.12,.31),(.51,-.12,1.79),.04,walnut)
        cube('Broad axe head',(.62,-.12,1.65),(.57,.10,.37),silver,.055)
    else:
        height=.60 if role=='duelist' else .96
        cube('Drawn blade',(.51,-.15,1.1+height/2),(.065,.045,height),silver,.013)
        rod('Cross guard',(.37,-.15,1.1),(.65,-.15,1.1),.027,gold)
        rod('Leather grip',(.51,-.15,.91),(.51,-.15,1.10),.035,walnut)
    setup((3,-8,3.4),(0,0,1.07),2.65)
    sc=bpy.context.scene;sc.render.resolution_x=320;sc.render.resolution_y=400;sc.cycles.samples=20;sc.render.film_transparent=True
    render('fighter-'+role)
    if role=='vanguard':bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'house-fighters.blend'))
