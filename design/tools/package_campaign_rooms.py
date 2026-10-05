"""Split the authored collection into independently loadable room GLBs."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/house3d'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'house-source.blend'))
for collection in bpy.data.collections:collection.hide_viewport=False;collection.hide_render=False
# Repair the first authored mine's suspended side-course, if packaging an older source.
# Work on connected rock components so the floor and rear wall keep their shape.
from mathutils import Vector
mine=bpy.data.objects['Room_mine']
for obj in mine.children:
    if obj.type!='MESH' or not any(m and m.name=='Charcoal slate' for m in obj.data.materials):continue
    adjacency=[[] for _ in obj.data.vertices]
    for edge in obj.data.edges:
        a,b=edge.vertices;adjacency[a].append(b);adjacency[b].append(a)
    seen=set()
    for start in range(len(adjacency)):
        if start in seen:continue
        component=[];stack=[start];seen.add(start)
        while stack:
            index=stack.pop();component.append(index)
            for neighbor in adjacency[index]:
                if neighbor not in seen:seen.add(neighbor);stack.append(neighbor)
        center=sum((obj.matrix_world@obj.data.vertices[i].co for i in component),Vector())/len(component)
        if center.x < -3 and center.y < 2.4 and center.z > 1.4:
            delta=obj.matrix_world.inverted().to_3x3()@Vector((0,0,.58-center.z))
            for i in component:obj.data.vertices[i].co+=delta
manifest=[]
for prefix,rooms in [('Room_',['smith','mine','smelter','employees','legacy']),('Evolution_',['forge','shop','arena'])]:
    for name in rooms:
        root=bpy.data.objects[prefix+name]
        bpy.ops.object.select_all(action='DESELECT')
        for obj in [root,*root.children_recursive]:obj.hide_set(False);obj.select_set(True)
        filename=('room-' if prefix=='Room_' else 'evolution-')+name+'.glb'
        bpy.ops.export_scene.gltf(filepath=str(OUT/filename),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_animations=False,export_yup=True)
        manifest.append({'file':filename,'bytes':(OUT/filename).stat().st_size})
(OUT/'rooms.json').write_text(json.dumps(manifest,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'house-source.blend'))
(OUT/'manifest.json').write_text(json.dumps({
    'author':'Ember & Iron — original Blender-authored campaign assets',
    'generator':['design/tools/build_campaign_assets.py','design/tools/package_campaign_rooms.py'],
    'coordinates':'glTF +Y up, character forward +Z',
    'itemFamilies':17,
    'assets':[{'file':'catalogue.glb','bytes':(OUT/'catalogue.glb').stat().st_size},*manifest]
},indent=2))
print('ROOM PACKAGING COMPLETE',flush=True)
