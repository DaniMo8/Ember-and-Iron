'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../workshop-engine'),D=require('../data'),P=require('../progression');
const copy=x=>JSON.parse(JSON.stringify(x));
function fresh(){const e=new E(copy(D));assert(e.command('create',{smithName:'Flow test',stats:{strength:5,precision:5,charisma:5,knowledge:5}}).ok);return e;}
function rich(e){e.state.player.gold=100000;e.state.player.level=30;for(const k in e.state.materials)e.state.materials[k]=20;}
function buy(e,id){for(const parent of P.nodes[id].parents)if(!e.state.world.trees[parent])buy(e,parent);if(!e.state.world.trees[id])assert(e.command('tree',{id}).ok,id);}
function quiet(e){e.state.nextNpcAt=e.state.nextArrivalAt=1e12;}
function item(e,id,options={}){const i={id,recipeId:'bronze_swords',quality:30,affixId:null,enchantmentId:null,createdAt:e.state.simTime,displayed:false,protected:false,reservedFor:null,makerGeneration:1,...options};e.state.inventory.push(i);return i;}
function auto(e){rich(e);e.command('hireStaff',{staffId:'quartermaster'});e.command('automation',{enabled:true,recipeId:'bronze_swords',targetStock:3,autoBuy:true,goldReserve:12});quiet(e);}

test('defeats give bounded help but cannot unlock new classes or repeat the allowance on reload',()=>{
 const e=fresh();e.state.stats.questsLost=100;assert.equal(e.currencies().adventurers,8);assert(e.command('tree',{id:'adventurers_expeditions_2'}).ok);assert.equal(e.currencies().adventurers,0);
 assert(!e.command('tree',{id:'adventurers_recruitment_0'}).ok);const f=new E(copy(D),e.exportSave());f.state.stats.questsLost++;assert.equal(f.currencies().adventurers,0);f.state.stats.questsWon++;assert.equal(f.currencies().adventurers,2);assert(E.validateSave(f.exportSave(),f.data).ok);
});
test('classes require useful sales and victories then regional bosses',()=>{
 const e=fresh();e.state.stats.questsWon=20;assert(!e.command('tree',{id:'adventurers_recruitment_0'}).ok);
 e.state.stats.sold=e.state.workshop.usefulSales=10;assert(e.command('tree',{id:'adventurers_recruitment_0'}).ok);assert(!e.command('tree',{id:'adventurers_recruitment_1'}).ok);
 e.state.questWins[e.data.tierBosses[0]]=1;assert(e.command('tree',{id:'adventurers_recruitment_1'}).ok);assert(!e.command('tree',{id:'adventurers_recruitment_2'}).ok);
 e.state.questWins[e.data.tierBosses[1]]=1;assert(e.command('tree',{id:'adventurers_recruitment_2'}).ok);assert(e.availableClasses().includes('foci'));assert(E.validateSave(e.exportSave(),e.data).ok);
});
test('clearance sales do not count as useful customer sales',()=>{
 const e=fresh();const first=item(e,'clearance');assert(e.command('sell',{itemId:first.id}).ok);assert.equal(e.state.workshop.usefulSales,0);
 const second=item(e,'useful',{quality:80});const h=e.state.adventurers[0];h.status='browsing';h.budget=100;assert(e.command('sell',{itemId:second.id,heroId:h.id,dispatch:false}).ok);assert.equal(e.state.workshop.usefulSales,1);
});
test('old Merit balances migrate once without removing earned purchasing power',()=>{
 const e=fresh(),raw=JSON.parse(e.exportSave());raw.state.stats.questsWon=4;raw.state.stats.questsLost=80;raw.state.world.spent.adventurers=40;delete raw.state.workshop.meritBase;delete raw.state.workshop.usefulSales;
 const f=new E(copy(D),raw);assert.equal(f.currencies().adventurers,44);const g=new E(copy(D),f.exportSave());assert.equal(g.currencies().adventurers,44);g.state.stats.questsWon++;assert.equal(g.currencies().adventurers,46);assert(E.validateSave(g.exportSave(),g.data).ok);
});
test('stock targets preserve inputs, include pending output and never cause overflow',()=>{
 const e=fresh();rich(e);quiet(e);e.state.materials.bronze_ingot=0;assert(e.command('smeltUpgrade',{id:'stockkeeper'}).ok);e.command('smeltPolicy',{id:'bronze',target:9});e.command('smeltPolicy',{reserve:3,enabled:true});
 e.tick(180000);assert.equal(e.state.materials.bronze_ingot,9);assert.equal(e.state.workshop.jobs.length,0);assert(e.state.materials.tin>=3);assert.equal(e.state.world.materialsLost||0,0);
 e.state.materials.bronze_ingot=29;e.command('smeltPolicy',{id:'bronze',target:30});e.tick(30000);assert.equal(e.state.materials.bronze_ingot,29);assert.equal(e.state.workshop.jobs.length,0);assert.match(e.smeltPolicyStatus(),/free bin spaces/);
});
test('automatic high alloys refill intermediate ingots without a separate target',()=>{
 const e=fresh();rich(e);quiet(e);for(const id of ['stockkeeper','iron','steel'])assert(e.command('smeltUpgrade',{id}).ok);e.state.materials.iron_ingot=e.state.materials.steel_ingot=0;
 e.command('smeltPolicy',{id:'steel',target:4});e.command('smeltPolicy',{enabled:true,reserve:1});e.tick(240000);assert.equal(e.state.materials.steel_ingot,4);assert(e.state.materials.iron_ingot>=1);assert(E.validateSave(e.exportSave(),e.data).ok);
});
test('maintained production is identical online, offline and through a mid-run reload',()=>{
 const e=fresh();auto(e);e.state.materials.bronze_ingot=0;e.command('smeltUpgrade',{id:'stockkeeper'});e.command('smeltPolicy',{id:'bronze',target:12});e.command('smeltPolicy',{enabled:true});const f=new E(copy(D),e.exportSave()),g=new E(copy(D),e.exportSave());
 e.tick(600000,{offline:true});for(let i=0;i<600;i++)f.tick(1000);g.tick(120000);const reload=new E(copy(D),g.exportSave());reload.tick(480000);
 for(const other of [f,reload]){assert.deepEqual(other.state.materials,e.state.materials);assert.deepEqual(other.state.inventory,e.state.inventory);assert.deepEqual(other.state.workshop,e.state.workshop);assert(E.validateSave(other.exportSave(),other.data).ok);}
 assert.equal(e.state.stats.crafted,3);assert.equal(e.state.workshop.smelted,15);
});
test('rare crafting opt-in is enforced before spending resources',()=>{
 const e=fresh();auto(e);for(const k in e.state.player.stats)e.state.player.stats[k]=100;for(const p of Object.values(e.state.player.proficiency))p.level=100;buy(e,'forge_machinery_3');const r=Object.values(e.data.recipes).find(r=>r.classId==='swords'&&r.tier===4&&r.variant===0);assert(e.craftPreview(r.id).eligible);
 e.command('automation',{recipeId:r.id});const materials=copy(e.state.materials);e._runAutomation();assert.equal(e.state.jobs.length,0);assert.deepEqual(e.state.materials,materials);assert.match(e.automationStatus(),/Rare inputs protected/);
 e.command('automation',{allowRare:true});e._runAutomation();assert.equal(e.state.jobs[0].recipeId,r.id);
});
test('automatic clearance respects protected, held, reserved and commission pieces',()=>{
 const e=fresh();auto(e);e.command('automation',{targetStock:0,autoSell:true});const sell=item(e,'sell'),protectedItem=item(e,'protected',{protected:true}),held=item(e,'held',{autoDisplayHold:true}),reserved=item(e,'reserved',{reservedFor:'mara'});e._runAutomation();assert(!e.state.inventory.includes(sell));assert(e.state.inventory.includes(protectedItem));assert(e.state.inventory.includes(held));assert(e.state.inventory.includes(reserved));
 const commission=item(e,'commission');e.state.commissions.push({classId:'swords',minTier:1,minQuality:20,status:'offered'});e._runAutomation();assert(e.state.inventory.includes(commission));assert.equal(e.state.workshop.usefulSales,0);
});
test('buying respects reserves and offline allowance atomically',()=>{
 const e=fresh();auto(e);e.state.materials.leather=0;e.state.player.gold=12;const before=e.state.materials.bronze_ingot;e._runAutomation();assert.equal(e.state.jobs.length,0);assert.equal(e.state.player.gold,12);assert.match(e.automationStatus(),/Gold reserve/);assert.equal(e.state.materials.bronze_ingot,before);
 e.state.player.gold=50;e._offline=true;e._offlineSpend=1;e.command('automation',{spendCap:1});e._runAutomation();assert.equal(e.state.jobs.length,0);assert.equal(e.state.player.gold,50);e._offline=false;e._runAutomation();assert.equal(e.state.jobs.length,1);
});
test('item demand explains unaffordable, outclassed and away customers without changing state',()=>{
 const e=fresh(),i=item(e,'demand',{quality:80});for(const h of e.state.adventurers)h.budget=0;const before=e.exportSave();assert.equal(e.itemDemand(i).kind,'expensive');assert.equal(e.exportSave(),before);
 for(const h of e.state.adventurers){h.status='recovering';h.equipment.weapon=copy(i);}assert.equal(e.itemDemand(i).kind,'outclassed');e.state.adventurers[0].equipment.weapon=null;assert.equal(e.itemDemand(i).kind,'returning');
});
test('optional rotation releases old displays for useful stock and preserves manual holds',()=>{
 const e=fresh();rich(e);quiet(e);e.state.player.reputation=100;buy(e,'shop_warehouse_3');e.command('workshopPolicy',{key:'rotateStock',value:true});e.state.simTime=200000;
 const old=item(e,'old',{quality:1,createdAt:0,displayed:true});for(const h of e.state.adventurers)h.equipment.weapon={...copy(old),quality:100};const useful=item(e,'armor',{recipeId:'bronze_armor',quality:80});const held=item(e,'held',{autoDisplayHold:true});e._restockShelves();assert.equal(old.displayed,false);assert(old.rotationHold);assert(useful.displayed);assert.equal(held.displayed,false);
 e.command('workshopPolicy',{key:'rotateStock',value:false});e._restockShelves();assert(!old.rotationHold);assert(old.displayed);
});
test('support paths avoid unrelated taxes and goals include missing prerequisite cost',()=>{
 const e=fresh();assert.deepEqual(P.nodes.mine_logistics_1.parents,[]);assert.deepEqual(P.nodes.shop_warehouse_0.parents,[]);assert.equal(e.upgradeGoal('shop','shop_warehouse_3').cost,22);assert(e.command('pinGoal',{room:'shop',id:'shop_warehouse_3'}).ok);assert(E.validateSave(e.exportSave(),e.data).ok);
});
test('next attribute and upgrade previews are read-only and match real purchases',()=>{
 const e=fresh();const before=e.exportSave(),p=e.attributePreview('precision');e.upgradeImpact('smelter','flux');assert.equal(e.exportSave(),before);e.state.player.points=1;e.command('allocate',{stat:'precision'});assert.equal(e.craftPreview('bronze_swords').quality,p.after.quality);assert.equal(e._craftAffixChance()*100,p.after.affix);
});
test('earned shift management cycles staff without exhaustion; manual leave stays manual',()=>{
 const e=fresh();auto(e);buy(e,'forge_workflow_shifts');assert(e.command('workshopPolicy',{key:'staffShifts',value:true}).ok);e.tick(34*60000);assert.equal(e.state.staff.quartermaster.active,false);assert(e.state.staff.quartermaster.autoRest);e.tick(6*60000);assert(e.state.staff.quartermaster.active);e.command('toggleStaff',{staffId:'quartermaster'});e.tick(20*60000);assert.equal(e.state.staff.quartermaster.active,false);assert.equal(e.state.staff.quartermaster.stamina,100);assert(E.validateSave(e.exportSave(),e.data).ok);
});
test('policy validation rejects invalid reserves, unknown goals and fabricated Merit carry',()=>{
 const e=fresh();for(const change of [s=>s.workshop.smeltPolicy.reserve=-1,s=>s.workshop.smeltPolicy.targets.missing=1,s=>s.workshop.goal={room:'forge',id:'missing'},s=>s.workshop.meritBase.earned=100]){const raw=JSON.parse(e.exportSave());change(raw.state);assert(!E.validateSave(raw,e.data).ok);}
});
test('bulk stock targets commit together and a pinned rank completes after its purchase',()=>{
 const e=fresh();rich(e);e.command('smeltUpgrade',{id:'stockkeeper'});e.command('smeltUpgrade',{id:'iron'});
 assert(e.command('smeltPolicy',{reserve:2,targets:{bronze:12,iron:8}}).ok);const before=copy(e.state.workshop.smeltPolicy);
 assert(!e.command('smeltPolicy',{reserve:3,targets:{bronze:20,steel:8}}).ok);assert.deepEqual(e.state.workshop.smeltPolicy,before);
 e.command('pinGoal',{room:'forge',id:'forge_mastery_0'});const pin=e.state.workshop.goal;assert.equal(pin.rank,1);assert(!e.upgradeGoal(pin.room,pin.id,pin.rank).complete);e.command('tree',{id:pin.id});assert(e.upgradeGoal(pin.room,pin.id,pin.rank).complete);assert(E.validateSave(e.exportSave(),e.data).ok);
 assert(!e.command('pinGoal',{room:'smelter',id:'stockkeeper'}).ok);assert.deepEqual(e.state.workshop.goal,pin);assert(E.validateSave(e.exportSave(),e.data).ok);
});
