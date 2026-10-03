'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../workshop-engine'),D=require('../data'),P=require('../progression'),M=require('../room-model');
const copy=x=>JSON.parse(JSON.stringify(x));
function fresh(){const e=new E(copy(D));assert(e.command('create',{smithName:'Guild test',stats:{strength:5,precision:5,charisma:5,knowledge:5}}).ok);return e;}
function funded(e){e.state.player.level=12;e.state.player.gold=10000;e.state.nextNpcAt=e.state.nextArrivalAt=1e12;for(const h of e.state.adventurers)h.browseUntil=h.leaveAt=1e12;}
function buy(e,id){for(const p of P.nodes[id].parents)if(!e.state.world.trees[p])buy(e,p);assert(e.command('tree',{id}).ok,id);}

test('four departments each have two specialists and employee upgrades use gold without spending Prospecting',()=>{
 const e=fresh();for(const department of ['mine','smelter','forge','shop'])assert.equal(Object.values(e.data.staff).filter(d=>d.department===department).length,2);
 const before=e.exportSave();assert(!e.command('tree',{id:'employees_training_0'}).ok);assert.equal(e.exportSave(),before);
 funded(e);const gold=e.state.player.gold,spent=copy(e.state.world.spent);buy(e,'employees_training_0');assert.equal(e.state.player.gold,gold-45);assert.deepEqual(e.state.world.spent,spent);assert.equal(e.treePreview('employees_training_0').cost,86);assert(E.validateSave(e.exportSave(),e.data).ok);
});

test('specialist hires require their level and signing cost; a duplicate cannot charge again',()=>{
 const e=fresh();assert(!e.command('hireStaff',{staffId:'furnace_tender'}).ok);funded(e);
 for(const id of Object.keys(e.data.staff)){const gold=e.state.player.gold,cost=e.staffPrice(id);assert(e.command('hireStaff',{staffId:id}).ok);assert.equal(e.state.player.gold,gold-cost);const paid=e.state.player.gold;assert(!e.command('hireStaff',{staffId:id}).ok);assert.equal(e.state.player.gold,paid);}
 const f=new E(copy(D),e.exportSave());assert.deepEqual(f.state.staff,e.state.staff);assert.equal(f.employeeSummary().hired,8);assert(E.validateSave(f.exportSave(),f.data).ok);
});

test('specialists improve real smelting, metal quality, extraction and sale effects',()=>{
 const e=fresh();funded(e);const speed=e.smelterDerived().speed,quality=e.craftPreview('bronze_swords').quality;
 for(const id of ['furnace_tender','assayer','pit_foreman','shopkeeper'])assert(e.command('hireStaff',{staffId:id}).ok);
 assert.equal(e.smelterDerived().speed,speed+.06);assert.equal(e.smelterDerived().quality,1);assert.equal(e.craftPreview('bronze_swords').quality,quality+1);assert.equal(e._effects().miningSpeed,.06);assert.equal(e._effects().sale,.025);
 e.command('toggleStaff',{staffId:'assayer'});assert.equal(e.smelterDerived().quality,0);e.command('toggleStaff',{staffId:'furnace_tender'});assert.equal(e.smelterDerived().speed,speed);
});

test('experience comes from completed departmental work and stops during leave',()=>{
 const e=fresh();funded(e);for(const id of ['furnace_tender','assayer','pit_foreman'])e.command('hireStaff',{staffId:id});
 e.state.materials.bronze=20;e.state.materials.tin=10;e.state.materials.fuel=10;e.command('smelt',{id:'bronze',quantity:2});
 assert.equal(e.state.staff.furnace_tender.xp,0);e.tick(100000);assert.equal(e.state.staff.furnace_tender.xp,4);assert.equal(e.state.staff.assayer.xp,4);assert(e.state.staff.pit_foreman.xp>0);
 e.command('toggleStaff',{staffId:'furnace_tender'});const xp=e.state.staff.furnace_tender.xp;e.command('smelt',{id:'bronze'});e.tick(40000);assert.equal(e.state.staff.furnace_tender.xp,xp);assert(e.state.staff.assayer.xp>4);
});

test('training increases earned work XP and role power without changing permanent bin capacity',()=>{
 const e=fresh();funded(e);e.command('hireStaff',{staffId:'quartermaster'});e.command('hireStaff',{staffId:'furnace_tender'});const cap=e.binCapacity();
 buy(e,'employees_training_0');buy(e,'employees_training_1');e._staffXp('smelt',10);assert.equal(e.state.staff.furnace_tender.xp,12);assert.equal(e.binCapacity(),cap);assert(Math.abs(e.smelterDerived().speed-1.0648)<1e-8);
 e.command('toggleStaff',{staffId:'quartermaster'});assert.equal(e.binCapacity(),cap);assert.equal(e.employeeBenefits('quartermaster').find(v=>v.key==='binCapacity').value,3);
});

test('welfare slows stamina loss, improves rest and never grows stamina above 100',()=>{
 const e=fresh();funded(e);e.command('hireStaff',{staffId:'apprentice'});buy(e,'employees_welfare_0');buy(e,'employees_welfare_1');
 e.tick(600000);assert(Math.abs(e.state.staff.apprentice.stamina-(100-20/1.08))<1e-5);e.command('toggleStaff',{staffId:'apprentice'});e.tick(180000);assert.equal(e.state.staff.apprentice.stamina,100);assert.equal(e.state.staff.apprentice.active,false);
});

test('old hires and paid shift roster survive the move to Employees without a purchase or reset',()=>{
 const e=fresh();funded(e);e.command('hireStaff',{staffId:'apprentice'});e.state.staff.apprentice={...e.state.staff.apprentice,level:3,xp:11,stamina:42,active:false};
 const raw=JSON.parse(e.exportSave());raw.state.world.trees={forge_workflow_2:1,forge_workflow_shifts:1};raw.state.workshop.staffShifts=true;const f=new E(copy(D),raw);
 assert.deepEqual(f.state.staff,raw.state.staff);assert.equal(f.state.player.gold,raw.state.player.gold);assert.equal(f.state.world.trees.forge_workflow_shifts,1);assert.equal(P.nodes.forge_workflow_shifts.section,'employees');assert.equal(f.employeeSummary().hired,1);assert(f._effects().staffShifts);assert(E.validateSave(f.exportSave(),f.data).ok);
});

test('employees and their earnings remain equivalent through offline work and a saved reload',()=>{
 const e=fresh();funded(e);for(const id of ['pit_foreman','furnace_tender','assayer'])e.command('hireStaff',{staffId:id});buy(e,'employees_training_0');e.command('smeltUpgrade',{id:'stockkeeper'});e.command('smeltPolicy',{enabled:true,targets:{bronze:18},reserve:1});
 const f=new E(copy(D),e.exportSave());e.tick(120000,{offline:true});f.tick(60000);const g=new E(copy(D),f.exportSave());for(let i=0;i<60;i++)g.tick(1000);
 assert.deepEqual(g.state.staff,e.state.staff);assert.deepEqual(g.state.materials,e.state.materials);assert.deepEqual(g.state.workshop.jobs,e.state.workshop.jobs);assert(E.validateSave(g.exportSave(),g.data).ok);
});

test('employee goals and pricing expose prerequisites; forged employee ranks are rejected',()=>{
 const e=fresh();assert(e.command('pinGoal',{room:'employees',id:'forge_workflow_shifts'}).ok);assert.equal(e.upgradeGoal('employees','forge_workflow_shifts').cost,670);
 const raw=JSON.parse(e.exportSave());raw.state.world.trees.employees_training_3=1;assert(!E.validateSave(raw,e.data).ok);
});

test('an old pinned Forge shift goal migrates on load and import without losing its target rank',()=>{
 const e=fresh(),raw=JSON.parse(e.exportSave());raw.state.workshop.goal={room:'forge',id:'forge_workflow_shifts',rank:1};
 assert(E.validateSave(raw,e.data).ok);const f=new E(copy(D),raw);assert.deepEqual(f.state.workshop.goal,{room:'employees',id:'forge_workflow_shifts',rank:1});assert.equal(f.upgradeGoal('employees','forge_workflow_shifts',1).cost,670);
 const g=fresh();assert(g.importSave(raw).ok);assert.deepEqual(g.state.workshop.goal,f.state.workshop.goal);assert(E.validateSave(g.exportSave(),g.data).ok);
 raw.state.workshop.goal.id='employees_training_0';assert(!E.validateSave(raw,e.data).ok);
});

test('employee room growth respects first-generation and boss gates',()=>{
 const e=fresh();funded(e);assert.equal(M.artKey(e,'employees'),'smith-starter');for(const id of Object.keys(e.data.staff))e.command('hireStaff',{staffId:id});assert.equal(M.stage(e,'employees'),'starter');e.state.questWins.smuggler_cache=1;assert.equal(M.roomName(e,'employees'),'Guild common room');
 for(const n of Object.values(P.nodes).filter(n=>n.section==='employees'))e.state.world.trees[n.id]=n.maxRank;assert.equal(M.stage(e,'employees'),'middle');e.state.player.legacy.generation=2;e.state.questWins.frost_citadel=1;assert.equal(M.stage(e,'employees'),'grand');
});
