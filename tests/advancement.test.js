'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Workshop=require('../workshop-engine'),Data=require('../data'),P=require('../progression'),A=require('../advancement'),W=require('../workshop');
const copy=x=>JSON.parse(JSON.stringify(x));
function make(){const e=new Workshop(copy(Data));assert(e.command('create',{smithName:'Alden',stats:{strength:5,precision:5,charisma:5,knowledge:5}}).ok);return e;}
function rich(e){e.state.player.gold=1e6;e.state.player.level=30;for(const k of Object.keys(e.state.materials))e.state.materials[k]=20;}
function unlock(e,id){for(const p of P.nodes[id].parents)if(!e.state.world.trees[p])unlock(e,p);if(!e.state.world.trees[id])assert(e.command('tree',{id}).ok,id);}

test('all room upgrades occupy the requested sections and prerequisite graphs have no cycles',()=>{
 const e=make();assert.equal(Object.keys(e.data.recipes).length,289);
 for(const [section,rows]of Object.entries(A.sections)){const actual=new Set(section==='legacy'?Object.values(e.data.talents).map(t=>t.branch):section==='smelter'?Object.values(W.upgrades).map(n=>n.branch):Object.values(P.nodes).filter(n=>n.section===section).map(n=>n.branch));assert.deepEqual([...actual].sort(),rows.map(r=>r[0]).sort());}
 const visit=(id,trail=[])=>{assert(!trail.includes(id),'Cyclic upgrade '+id);assert(P.nodes[id]);P.nodes[id].parents.forEach(p=>visit(p,[...trail,id]));};Object.keys(P.nodes).forEach(id=>visit(id));
});
test('Forge recipes, rather than level alone, unlock standard and higher-tier patterns',()=>{
 const e=make();rich(e);for(const a in e.state.player.stats)e.state.player.stats[a]=100;for(const p of Object.values(e.state.player.proficiency))p.level=100;
 const standard=Object.values(e.data.recipes).find(r=>r.classId==='swords'&&r.tier===1&&r.variant===1),iron=Object.values(e.data.recipes).find(r=>r.classId==='swords'&&r.tier===2&&r.variant===0),prestige=Object.values(e.data.recipes).find(r=>r.classId==='swords'&&r.tier===1&&r.variant===2);
 assert(e.craftPreview('bronze_swords').eligible);assert(!e.craftPreview(standard.id).eligible);assert(!e.craftPreview(iron.id).eligible);assert(!e.craftPreview(prestige.id).eligible);
 unlock(e,'forge_machinery_0');assert(e.craftPreview(standard.id).eligible);assert(!e.craftPreview(iron.id).eligible);
 unlock(e,'forge_machinery_1');assert(e.craftPreview(iron.id).eligible);assert(!e.craftPreview(prestige.id).eligible);unlock(e,'forge_recipes_prestige');assert(e.craftPreview(prestige.id).eligible);
 e.state.player.proficiency.swords.level=0;assert(!e.craftPreview(prestige.id).eligible);assert(!e.command('craft',{recipeId:prestige.id}).ok);
});
test('focused prerequisites cannot be bypassed by a purchase',()=>{
 const e=make();rich(e);const gold=e.state.player.gold;assert(!e.command('tree',{id:'forge_machinery_3'}).ok);assert.equal(e.state.player.gold,gold);
 assert(e.command('tree',{id:'forge_mastery_0'}).ok);assert(!e.command('smeltUpgrade',{id:'assay'}).ok);assert(e.command('smeltUpgrade',{id:'flux'}).ok);assert(e.command('smeltUpgrade',{id:'skimming'}).ok);assert(e.command('smeltUpgrade',{id:'assay'}).ok);
});
test('v2 purchases and discovered recipes migrate without granting free ranks or losing investments',()=>{
 const e=make(),raw=JSON.parse(e.exportSave());delete raw.state.workshop.upgradeVersion;delete raw.state.workshop.archivedPatterns;
 raw.state.world.totalMined=2000;raw.state.world.spent.mine=3;raw.state.world.trees={mine_logistics_0:1,mine_logistics_1:1};
 const standard=Object.values(e.data.recipes).find(r=>r.classId==='swords'&&r.tier===1&&r.variant===1);raw.state.unlocks.recipes.push(standard.id);
 const loaded=new Workshop(copy(Data),raw);assert.deepEqual(loaded.state.world.trees,raw.state.world.trees);assert(loaded._recipeKnown(loaded.data.recipes[standard.id]));assert(Workshop.validateSave(loaded.exportSave(),loaded.data).ok);
 const reloaded=new Workshop(copy(Data),loaded.exportSave());assert.deepEqual(reloaded.state.workshop.archivedPatterns,loaded.state.workshop.archivedPatterns);
});
test('Smelter quality improves new forging jobs while preserving an already active job',()=>{
 const e=make();rich(e);const quality=e.craftPreview('bronze_swords').quality;assert(e.command('craft',{recipeId:'bronze_swords',quantity:2}).ok);const active=e.state.jobs[0];assert.equal(active.quality,quality);
 assert(e.command('smeltUpgrade',{id:'flux'}).ok);assert.equal(e.smelterDerived().quality,2);assert.equal(e.craftPreview('bronze_swords').quality,quality+2);assert.equal(active.quality,quality);
 assert(e.command('cancel',{jobId:active.id}).ok);assert.equal(e.state.jobs[0].quality,quality+2);assert(Workshop.validateSave(e.exportSave(),e.data).ok);
});
test('Legacy reduces only rank growth, stays exponential and never skips prerequisites',()=>{
 const e=make();rich(e);e.state.world.trees.forge_mastery_0=2;const before=e.treePreview('forge_mastery_0').cost;e.state.player.legacy.generation=2;e.state.player.legacy.points=200;
 assert(e.command('talent',{talentId:'enduring_tools'}).ok);assert.equal(e.treePreview('forge_mastery_0').cost,Math.ceil(40*1.8**2));assert(e.treePreview('forge_mastery_0').cost<before);assert.equal(e.treePreview('forge_workflow_0').cost,30);assert(!e.command('tree',{id:'forge_machinery_4'}).ok);
 assert(e.command('talent',{talentId:'guild_endowment'}).ok);assert(e.command('talent',{talentId:'timeless_methods'}).ok);assert.equal(e.upgradeScale(),1.6);e.state.workshop.upgrades.bellows=2;assert.equal(e.smeltUpgradePreview('bellows').cost,Math.ceil(30*1.6**2));
});
test('inherited workers apply once at creation and survive reload without duplicating',()=>{
 const e=make();e.state.player.legacy.generation=2;e.state.player.legacy.points=200;for(const id of ['inherited_crew','family_workforce','founders_guild'])assert(e.command('talent',{talentId:id}).ok);
 assert.equal(e.state.world.miners.length,1);e.state.questWins.void_sovereign=1;assert(e.command('retire',{confirmed:true}).ok);assert.equal(e.state.world.miners.length,1);
 assert(e.command('create',{smithName:'Alden II',stats:{strength:20,precision:0,charisma:0,knowledge:0}}).ok);assert.equal(e.state.world.miners.length,7);assert(e.derived().workerCapacity>=7);
 const loaded=new Workshop(copy(Data),e.exportSave());assert.equal(loaded.state.world.miners.length,7);assert(!loaded.command('create',{stats:{strength:20,precision:0,charisma:0,knowledge:0}}).ok);assert.equal(loaded.state.world.miners.length,7);
});
test('Legacy extra ingots match the preview, survive reload and obey no-overflow storage',()=>{
 const e=make();e.state.player.legacy.generation=2;e.state.player.legacy.points=20;assert(e.command('talent',{talentId:'fuller_moulds'}).ok);assert.equal(e.smeltPreview('bronze',2).amount,8);
 assert(e.command('smelt',{id:'bronze'}).ok);const loaded=new Workshop(copy(Data),e.exportSave());loaded.state.materials.bronze_ingot=29;loaded.tick(24000);assert.equal(loaded.state.materials.bronze_ingot,30);assert.equal(loaded.state.world.materialsLost,3);assert.equal(loaded.state.workshop.smelted,4);
});
test('rare and legendary archives unlock distinct recipes, retain all crafting gates and persist across retirement',()=>{
 const e=make();rich(e);const rare=e.data.recipes.relic_swords,legend=e.data.recipes.legend_swords;assert(!e._recipeKnown(rare));assert(!e._recipeKnown(legend));assert.equal(Object.values(e.data.recipes).filter(r=>r.legacyTalent).length,34);
 e.state.player.legacy.generation=2;e.state.player.legacy.points=100;assert(!e.command('talent',{talentId:'legend_archive'}).ok);assert(e.command('talent',{talentId:'rare_archive'}).ok);assert(e._recipeKnown(rare));assert(!e._recipeKnown(legend));assert(!e.craftPreview(rare.id).eligible);
 assert(e.command('talent',{talentId:'legend_archive'}).ok);assert(e._recipeKnown(legend));unlock(e,'forge_machinery_4');for(const a in e.state.player.stats)e.state.player.stats[a]=100;e.state.player.proficiency.swords.level=100;assert(e.craftPreview(rare.id).eligible);assert(e.craftPreview(legend.id).eligible);
 e.state.questWins.void_sovereign=1;e.command('retire',{confirmed:true});assert(e.state.player.talents.includes('rare_archive'));e.command('create',{smithName:'Alden II',stats:{strength:5,precision:5,charisma:5,knowledge:5}});assert(e._recipeKnown(rare));assert(!e.craftPreview(rare.id).eligible);assert(Workshop.validateSave(e.exportSave(),e.data).ok);
});
test('quantity expands existing customer classes; new buyer classes require their unlock',()=>{
 const e=make();e.state.stats.questsLost=10000;unlock(e,'adventurers_recruitment_3');assert(e.state.adventurers.some(h=>h.id==='lyra'));assert(!e.availableClasses().includes('foci'));
 unlock(e,'adventurers_recruitment_6');assert(e.state.adventurers.some(h=>h.id==='vesper'));assert(e.availableClasses().includes('foci'));assert(e.state.world.trees.adventurers_recruitment_2);assert(Workshop.validateSave(e.exportSave(),e.data).ok);
});
test('one normal campaign reward cannot buy all powerful Legacy upgrades',()=>{
 const e=make();for(const id of e.data.tierBosses)e.state.questWins[id]=1;const reward=e.derived().legacyReward,cost=Object.values(e.data.talents).filter(t=>t.legacySignature).reduce((n,t)=>n+t.cost,0);assert(cost>reward*10);assert.equal(e.state.player.legacy.generation,1);assert(!e.talentPreview('inherited_crew').eligible);
});
test('Blender atlas covers every current equipment recipe and obtainable material',()=>{
 const e=make(),m=require('../assets/inventory/manifest.json'),fs=require('node:fs');assert.equal(Object.keys(m.icons).length,273);
 for(const r of Object.values(e.data.recipes))assert(m.icons[`item-${r.classId}-${r.tier}-${Math.min(2,r.variant)}`],r.id);
 for(const id of Object.keys(e.data.materials).filter(id=>id!=='steel'))assert(m.icons['material-'+id],id);
 const png=fs.readFileSync(require.resolve('../assets/inventory/inventory-atlas.png'));assert.equal(png.readUInt32BE(16),m.columns*m.tile);assert.equal(png.readUInt32BE(20),m.rows*m.tile);assert.equal(png[25],6,'RGBA atlas');
});
