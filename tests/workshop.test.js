'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const Workshop=require('../workshop-engine'),World=require('../world-engine'),D=require('../data');
const copy=x=>JSON.parse(JSON.stringify(x));
function make(stats={strength:5,precision:5,charisma:5,knowledge:5}){const e=new Workshop(copy(D));assert(e.command('create',{smithName:'Rowan',stats}).ok);return e;}
function stock(e){for(const id of Object.keys(e.state.materials))e.state.materials[id]=20;}
function forge(e,options={}){stock(e);assert(e.command('craft',{recipeId:'bronze_swords',...options}).ok);return e.state.jobs.at(-1);}

test('zero base attributes, exactly 20 assigned points and fixed starting customers',()=>{
 const e=new Workshop(copy(D));assert.deepEqual(Object.values(e.state.player.stats),[0,0,0,0]);assert.equal(e.state.player.points,20);
 for(const strength of [-1,19,21,1.5])assert(!e.command('create',{stats:{strength,precision:0,charisma:0,knowledge:0}}).ok);
 assert(e.command('create',{smithName:'Rowan',stats:{strength:20,precision:0,charisma:0,knowledge:0},heroes:[{name:'Override',archetypeId:'mage'}]}).ok);
 assert.equal(e.state.player.name,'Rowan');assert.equal(e.state.player.points,0);assert.deepEqual(e.state.adventurers.map(h=>[h.name,h.archetypeId]),[['Mara','vanguard'],['Renn','duelist'],['Wren','ranger']]);
 assert(!e.command('recruitHero',{id:'bren',name:'Override',archetypeId:'mage'}).ok);
});
test('every extreme zero-stat build can mine, smelt, craft and save without invalid numbers',()=>{
 for(const key of ['strength','precision','charisma','knowledge']){const e=make(Object.fromEntries(['strength','precision','charisma','knowledge'].map(k=>[k,k===key?20:0])));assert(e.command('mine',{materialId:'tin'}).ok);assert(e.command('smelt',{id:'bronze'}).ok);e.tick(24000);const j=forge(e);assert(Number.isFinite(j.duration));e.tick(j.duration);assert(Workshop.validateSave(e.exportSave(),e.data).ok);assert.equal(e.state.stats.crafted,1);assert.equal(e.state.adventurers.length,3);}
});
test('ore is distinct from ingots, bronze alloys copper and tin, steel cannot be mined or bought',()=>{
 const e=make();assert(!e.craftPreview('bronze_swords').eligible);assert(!e.seams().some(s=>s.id==='steel'));assert(e.seams().some(s=>s.id==='tin'));
 assert(!e.command('buyMaterial',{materialId:'bronze_ingot',quantity:1}).ok);assert(!e.command('mine',{materialId:'steel'}).ok);
 const before=copy(e.state.materials);assert(e.command('smelt',{id:'bronze'}).ok);assert.equal(e.state.materials.bronze,before.bronze-2);assert.equal(e.state.materials.tin,before.tin-1);assert.equal(e.state.materials.fuel,before.fuel-1);
 e.tick(23999);assert.equal(e.state.materials.bronze_ingot,0);e.tick(1);assert.equal(e.state.materials.bronze_ingot,3);assert(e.craftPreview('bronze_swords').eligible);assert.equal(e.state.workshop.smelted,3);
});
test('smelting honours all alloy gates, exponential upgrades and refunds exactly once',()=>{
 const e=make();stock(e);e.state.player.gold=10000;e.state.player.level=12;assert(!e.command('smelt',{id:'steel'}).ok);assert(!e.command('smeltUpgrade',{id:'steel'}).ok);
 for(const id of ['iron','steel','mithril','starforged']){assert(e.command('smeltUpgrade',{id}).ok);assert(e.smeltPreview(id).eligible);}
 assert(e.command('smeltUpgrade',{id:'bellows'}).ok);assert.equal(e.smeltUpgradePreview('bellows').cost,57);
 const before=copy(e.state.materials);assert(e.command('smelt',{id:'steel',quantity:3}).ok);const jobs=[...e.state.workshop.jobs];for(const j of jobs)assert(e.command('cancelSmelt',{id:j.id}).ok);assert.deepEqual(e.state.materials,before);assert(!e.command('cancelSmelt',{id:jobs[0].id}).ok);
});
test('smelting refund waits for bin room; completed batches lose excess output without overflow',()=>{
 const e=make();e.command('smelt',{id:'bronze'});const id=e.state.workshop.jobs[0].id;e.state.materials.bronze=e.binCapacity();assert(!e.command('cancelSmelt',{id}).ok);e.state.materials.bronze_ingot=29;e.tick(24000);assert.equal(e.state.materials.bronze_ingot,30);assert.equal(e.state.world.materialsLost,2);assert.equal(e.state.workshop.jobs.length,0);assert(!e.command('cancelSmelt',{id}).ok);
});
test('smelting and forge completion are identical online, offline and after a saved queue reload',()=>{
 const e=make();stock(e);e.state.nextNpcAt=1e9;assert(e.command('smelt',{id:'bronze',quantity:3}).ok);forge(e);const f=new Workshop(copy(D),e.exportSave()),g=new Workshop(copy(D),e.exportSave());e.tick(150000,{offline:true});for(let i=0;i<150;i++)f.tick(1000);g.tick(10000);const loaded=new Workshop(copy(D),g.exportSave());loaded.tick(140000);for(const other of [f,loaded]){assert.deepEqual(e.state.materials,other.state.materials);assert.deepEqual(e.state.inventory,other.state.inventory);assert.deepEqual(e.state.workshop,other.state.workshop);}
});
test('finishing gives diminishing quality on the same item and constant additional work',()=>{
 const e=make(),j=forge(e),base=j.duration,start=j.quality;const gains=[];for(let n=0;n<5;n++){gains.push(e.techniquePreview(j.id).qualityGain);assert(e.command('technique',{jobId:j.id}).ok);assert.equal(j.duration,base*(n+2));}assert.deepEqual(gains,[20,10,5,2,1]);assert.equal(j.quality,start+38);assert(!e.command('technique',{jobId:j.id}).ok);e.state.nextNpcAt=1e9;e.tick(j.duration);assert.equal(e.state.inventory[0].quality,start+38);assert.equal(e.state.stats.crafted,1);
});
test('queued finishing applies exactly once at start and respects the quality ceiling',()=>{
 let e=make();stock(e);assert(e.command('craft',{recipeId:'bronze_swords',quantity:2}).ok);const first=e.state.jobs[0],j=e.state.jobs[1];for(let n=0;n<3;n++)assert(e.command('technique',{jobId:j.id}).ok);e=new Workshop(copy(D),e.exportSave());assert(e.command('cancel',{jobId:first.id}).ok);const active=e.state.jobs[0];assert.equal(active.finishPasses,3);assert.equal(active.appliedFinishPasses,3);assert.equal(active.duration,active.baseDuration*4);const before=copy(active);e._startJobs();assert.deepEqual(active,before);
 active.quality=99;assert.equal(e.techniquePreview(active.id).qualityGain,1);assert(e.command('technique',{jobId:active.id}).ok);assert.equal(active.quality,100);assert(!e.command('technique',{jobId:active.id}).ok);
});
test('chosen enchantment reserves combined materials and gold, survives reload, refunds atomically',()=>{
 let e=make();stock(e);e.state.player.gold=10000;e.state.player.level=8;e.state.player.stats.knowledge=50;e.state.upgrades.enchanting_table=3;
 const enchant=Object.values(e.data.enchantments).find(x=>(!x.slots?.length||x.slots.includes('weapon'))&&e._gates(x.requires).every(g=>g.met));assert(enchant);
 const before=copy(e.state.materials),gold=e.state.player.gold;assert(e.command('craft',{recipeId:'bronze_swords',enchantmentId:enchant.id,quantity:2}).ok);assert.equal(e.state.player.gold,gold-2*enchant.cost);
 e=new Workshop(copy(D),e.exportSave());for(const j of [...e.state.jobs].reverse())assert(e.command('cancel',{jobId:j.id}).ok);assert.deepEqual(e.state.materials,before);assert.equal(e.state.player.gold,gold);
 const j=forge(e,{enchantmentId:enchant.id});e.state.nextNpcAt=1e9;e.tick(j.duration);assert.equal(e.state.inventory[0].enchantmentId,enchant.id);assert.equal(e.state.inventory[0].enchantStrength,j.enchantStrength);e.state.inventory[0].affixId=null;assert.equal(e.itemPrice(e.state.inventory[0].id),e.craftPreview(j.recipeId,{enchantmentId:enchant.id}).price);assert(!e.command('cancel',{jobId:j.id}).ok);
});
test('invalid material, unaffordable or incompatible enchantment cannot mutate a craft',()=>{
 const e=make();stock(e);const before=e.exportSave();for(const options of [{materialId:'steel_ingot'},{enchantmentId:'missing'},{enchantmentId:'flame'}])assert(!e.command('craft',{recipeId:'bronze_swords',...options}).ok);assert.equal(e.exportSave(),before);
});
test('unlocking customer classes automatically attracts fixed customers and opens their equipment',()=>{
 const e=make();e.state.stats.questsWon=14;e.state.stats.sold=e.state.workshop.usefulSales=10;for(const boss of e.data.tierBosses.slice(0,2))e.state.questWins[boss]=1;for(const id of ['adventurers_recruitment_0','adventurers_recruitment_1','adventurers_recruitment_2'])assert(e.command('tree',{id}).ok);assert.deepEqual(e.state.adventurers.filter(h=>['bren','thane','sable'].includes(h.id)).map(h=>[h.name,h.archetypeId]),[['Bren','breaker'],['Thane','guardian'],['Sable','mage']]);assert(e.availableClasses().includes('foci'));assert(e.availableClasses().includes('cloth_armor'));assert(Workshop.validateSave(e.exportSave(),e.data).ok);
});
test('old runs preserve identity, metal value, active finishing and exact historical refund escrow',()=>{
 const d=copy(D),old=new World(d);assert(old.command('create',{stats:{strength:7,precision:7,charisma:7,knowledge:7}}).ok);assert(old.command('craft',{recipeId:'bronze_swords'}).ok);assert(old.command('technique',{jobId:old.state.jobs[0].id}).ok);const previous=copy(old.state),e=new Workshop(copy(D),old.exportSave());assert.deepEqual(e.state.player.stats,previous.player.stats);assert.equal(e.state.materials.bronze_ingot,previous.materials.bronze);assert.equal(e.state.jobs[0].duration,previous.jobs[0].duration);assert.equal(e.state.jobs[0].quality,previous.jobs[0].quality);const reloaded=new Workshop(copy(D),e.exportSave());assert.deepEqual(reloaded.state.jobs,e.state.jobs);assert(reloaded.command('cancel',{jobId:e.state.jobs[0].id}).ok);assert.equal(reloaded.state.materials.bronze_ingot,6);
 for(const file of ['tests/fixtures/qa-fresh-workshop.json','design/qa/campaign-preview-save.json']){const migrated=new Workshop(copy(D),fs.readFileSync(file,'utf8'));assert(Workshop.validateSave(migrated.exportSave(),migrated.data).ok,file);}
});
test('retraining refunds actual investment, and Legacy restarts with zero attributes and 20 points',()=>{
 const e=make();assert(e.command('respec').ok);assert.equal(e.state.player.points,20);assert.deepEqual(Object.values(e.state.player.stats),[0,0,0,0]);assert(e.command('allocate',{stat:'precision'}).ok);assert.equal(e.state.player.points,19);e.state.questWins.void_sovereign=1;assert(e.command('retire',{confirmed:true}).ok);assert.equal(e.state.player.points,20);assert.deepEqual(Object.values(e.state.player.stats),[0,0,0,0]);assert.equal(e.state.workshop.jobs.length,0);assert(Workshop.validateSave(e.exportSave(),e.data).ok);
});
test('save validation rejects forged smelting refunds, enchantment gold and finishing counts',()=>{
 const e=make();e.command('smelt',{id:'bronze'});let raw=JSON.parse(e.exportSave());raw.state.workshop.jobs[0].inputs.bronze=999;assert(!Workshop.validateSave(raw,e.data).ok);forge(e);raw=JSON.parse(e.exportSave());raw.state.jobs[0].enchantGold=999;assert(!Workshop.validateSave(raw,e.data).ok);raw=JSON.parse(e.exportSave());raw.state.jobs[0].finishPasses=99;assert(!Workshop.validateSave(raw,e.data).ok);
});
