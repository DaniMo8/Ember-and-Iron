'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),World=require('../world-engine'),D=require('../data'),M=require('../room-model');
const copy=x=>JSON.parse(JSON.stringify(x));
function make(){const e=new World(copy(D));assert(e.command('create',{stats:{strength:7,precision:7,charisma:7,knowledge:7}}).ok);return e;}
const ids=e=>e.state.adventurers.map(h=>h.id);
const bosses=e=>e.state.runs.filter(r=>r.questId==='smuggler_cache');
const clearApproach=e=>{for(const id of e.data.questTiers[0].slice(0,3))e.state.questWins[id]=5;};
function reserveAway(e){clearApproach(e);assert(e.command('dispatch',{questId:'rat_nest',heroIds:[ids(e)[0]]}).ok);const run=e.state.runs.at(-1);run.result.victory=false;assert(e.command('gatherAndLaunchBoss',{questId:'smuggler_cache',heroIds:ids(e)}).ok);return run;}

test('each tier has three five-win quest levels and a boss requiring its own three approaches',()=>{
 const e=make();assert.equal(e.data.questTiers.length,5);assert.equal(Object.keys(e.data.quests).length,20);
 for(const [i,chain] of e.data.questTiers.entries()){
  assert.equal(chain.length,4);for(const [level,id] of chain.entries()){const q=e.data.quests[id];assert.equal(q.tier,i+1);assert.equal(q.manualBoss,level===3);assert.equal(q.masteryTarget,level===3?1:5);assert.equal(q.questLevel,level===3?null:level+1);}
  const boss=e.data.quests[chain[3]];
  assert.deepEqual(Object.keys(boss.requires.questWins).filter(id=>!e.data.quests[id].manualBoss).sort(),chain.slice(0,3).sort());
  for(const [id,n] of Object.entries(boss.requires.questWins))e.state.questWins[id]=n;
  for(const id of chain.slice(0,3)){e.state.questWins[id]=4;assert(!e._gates(boss.requires).every(g=>g.met));e.state.questWins[id]=5;assert(e._gates(boss.requires).every(g=>g.met));}
 }
});
test('gather and launch immediately dispatches ready heroes, clears reservation and prevents duplicates',()=>{
 const e=make();clearApproach(e);const payload={questId:'smuggler_cache',heroIds:ids(e)};
 assert(e.command('gatherAndLaunchBoss',payload).ok);assert.equal(bosses(e).length,1);assert.equal(bosses(e)[0].heroIds.length,3);assert.equal(e.state.world.bossAutoLaunch,false);assert.deepEqual(e.state.world.bossParty,[]);
 assert(!e.command('gatherAndLaunchBoss',payload).ok);assert.equal(bosses(e).length,1);assert(World.validateSave(e.exportSave(),e.data).ok);
});
test('gathered heroes complete a failed journey and recovery before one automatic launch',()=>{
 const e=make(),run=reserveAway(e);e.tick(run.returnAt-e.state.simTime+1);assert.equal(bosses(e).length,0);assert.equal(e.state.adventurers[0].status,'recovering');
 const recovery=e.state.adventurers[0].recoverUntil;e.tick(recovery-e.state.simTime+2000);assert.equal(bosses(e).length,1);assert(bosses(e)[0].startAt>=recovery);assert(e.state.adventurers.every(h=>h.runId===bosses(e)[0].id));assert.equal(e.state.world.bossTarget,null);
 e.tick(600000);assert.equal(bosses(e).length,1);assert(!e.state.adventurers.some(h=>h.status==='returning'));assert(World.validateSave(e.exportSave(),e.data).ok);
});
test('pending launches survive save/reload and offline recovery with identical results',()=>{
 const e=make();reserveAway(e);e.markSaved(Date.now());const wall=e.state.lastWallTime,f=new World(copy(D),e.exportSave());assert(f.state.world.bossAutoLaunch);
 e.tick(600000);f.advanceOffline(wall+600000);assert.equal(bosses(e).length,1);assert.equal(bosses(f).length,1);assert.deepEqual(bosses(f)[0],bosses(e)[0]);assert.equal(f.state.world.bossAutoLaunch,false);assert(World.validateSave(f.exportSave(),f.data).ok);
});
test('a free expedition berth is required even when the selected boss party is home',()=>{
 const e=make();clearApproach(e);e.state.stats.questsLost=4;assert(e.command('tree',{id:'adventurers_recruitment_0'}).ok);assert(e.command('recruitHero',{id:'bren',name:'Hugh',archetypeId:'vanguard'}).ok);const selected=[ids(e).at(-1)];
 for(const heroId of ids(e).slice(0,3))assert(e.command('dispatch',{questId:'rat_nest',heroIds:[heroId]}).ok);const run=e.state.runs[0];
 assert.equal(e.state.runs.length,e.derived().expeditionCapacity);
 assert(e.command('gatherAndLaunchBoss',{questId:'smuggler_cache',heroIds:selected}).ok);assert.equal(bosses(e).length,0);assert(e.state.world.bossAutoLaunch);e.tick(Math.max(...e.state.runs.map(r=>r.returnAt))-e.state.simTime+2000);assert.equal(bosses(e).length,1);assert(bosses(e)[0].startAt>=run.returnAt);
});
test('cancelling gathering prevents later launch and old manual reservations stay manual',()=>{
 const e=make();reserveAway(e);assert(e.command('releaseBoss').ok);e.tick(600000);assert.equal(bosses(e).length,0);assert.deepEqual(e.state.world.bossParty,[]);
 const old=make();clearApproach(old);assert(old.command('prepareBoss',{questId:'smuggler_cache',heroIds:ids(old)}).ok);delete old.state.world.bossAutoLaunch;const migrated=new World(copy(D),old.exportSave());migrated.tick(600000);assert.equal(bosses(migrated).length,0);assert.equal(migrated.state.world.bossAutoLaunch,false);assert(migrated.command('gatherAndLaunchBoss',{questId:'smuggler_cache',heroIds:ids(migrated)}).ok);assert.equal(bosses(migrated).length,1);
});
test('invalid selections and missing wins cannot reserve a party or overwrite an existing order',()=>{
 const e=make(),payload={questId:'smuggler_cache',heroIds:ids(e)};e.state.questWins.rat_nest=4;assert(!e.command('gatherAndLaunchBoss',payload).ok);assert.deepEqual(e.state.world.bossParty,[]);
 reserveAway(e);const before=copy(e.state.world);for(const heroIds of [[],['missing'],[ids(e)[0],ids(e)[0]],ids(e).concat(ids(e)[0])])assert(!e.command('gatherAndLaunchBoss',{...payload,heroIds}).ok);assert.deepEqual(e.state.world,before);
});
test('Legacy is locked until the first final boss, persists between generations, and uses one hall',()=>{
 const e=make();assert(!M.legacyUnlocked(e));e.state.questWins.frost_citadel=1;assert(!M.legacyUnlocked(e));e.state.questWins.void_sovereign=1;assert(M.legacyUnlocked(e));assert.equal(M.artKey(e,'legacy'),'legacy');assert(e.command('retire',{confirmed:true}).ok);assert(M.legacyUnlocked(e));assert(!e.derived().legacyEligible);assert.equal(M.artKey(e,'legacy'),'legacy');const f=new World(copy(D),e.exportSave());assert(M.legacyUnlocked(f));assert.equal(M.artKey(f,'legacy'),'legacy');
 const fs=require('node:fs'),path=require('node:path'),art=fs.readFileSync(path.join(__dirname,'../assets/legacy.png'));assert.equal(art.subarray(1,4).toString(),'PNG');assert(art.readUInt32BE(16)>art.readUInt32BE(20));
});
