'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),World=require('../world-engine'),D=require('../data');
const copy=x=>JSON.parse(JSON.stringify(x));
const make=()=>{const e=new World(copy(D));assert(e.command('create',{stats:{strength:7,precision:7,charisma:7,knowledge:7}}).ok);return e;};
const open=(e,id)=>e._gates(e.data.quests[id].requires).every(g=>g.met);

test('all five tiers follow level 1 (5) to level 2 (5) to level 3 (5) to boss to next tier',()=>{
 const e=make();
 for(const [index,chain] of e.data.questTiers.entries()){
  if(index){assert(!open(e,chain[0]));e.state.questWins[e.data.questTiers[index-1][3]]=1;}
  assert(open(e,chain[0]));assert(!open(e,chain[1]));assert(!open(e,chain[2]));assert(!open(e,chain[3]));
  for(let level=0;level<3;level++){
   e.state.questWins[chain[level]]=4;e._refreshUnlocks();assert(!open(e,chain[level+1]));assert(!e.state.unlocks.quests.includes(chain[level+1]));
   e.state.questWins[chain[level]]=5;e._refreshUnlocks();assert(open(e,chain[level+1]));assert(e.state.unlocks.quests.includes(chain[level+1]));
  }
  // Winning all ordinary quests does not skip the boss gate.
  if(index<4)assert(!open(e,e.data.questTiers[index+1][0]));
 }
 assert(!e.derived().legacyEligible);e.state.questWins.void_sovereign=1;assert(e.derived().legacyEligible);
});

test('new approaches strengthen within their tier, have valid combat and never duplicate story rewards',()=>{
 const e=make(),before=JSON.stringify(e.data);require('../progression').apply(e.data);assert.equal(JSON.stringify(e.data),before);
 for(const chain of e.data.questTiers.filter((_,i)=>i!==2)){
  const qs=chain.slice(0,3).map(id=>e.data.quests[id]);
  for(let i=1;i<3;i++){assert(qs[i].enemies[0].health>qs[i-1].enemies[0].health);assert(qs[i].enemies[0].attack>qs[i-1].enemies[0].attack);assert(qs[i].rewards.gold>qs[i-1].rewards.gold);assert.equal(qs[i].choices.length,0);const result=e._simulate(qs[i],e.state.adventurers,12345);assert(Number.isFinite(result.duration));assert.equal(result.rounds,2);assert(result.events.some(x=>x.type==='outcome'));}
 }
 assert(e.data.quests.fallen_observatory.choices.some(c=>c.id==='recover_starforge'));
});

test('balanced heroes continue a reachable partially-cleared level instead of stalling after its first win',()=>{
 const e=make();e.state.questWins.rat_nest=5;e.state.questWins.mill_cellar=1;
 const preview=e.questPreview.bind(e);e.questPreview=(id,heroes)=>({...preview(id,heroes),successEstimate:id==='mill_cellar'?50:90});
 const plan=e._npcQuestPlan(e.state.adventurers[0]);assert.equal(plan.quest.id,'mill_cellar');e.state.questWins.mill_cellar=5;
 const next=e._npcQuestPlan(e.state.adventurers[0]);assert.equal(next.quest.id,'smugglers_road');
});

test('old completed bosses and ordered parties retain their milestones without rewards or repeat migration',()=>{
 const e=make();delete e.state.world.questProgressionVersion;e.state.questWins.smuggler_cache=1;e.state.questWins.rat_nest=12;e.state.questWins.quarry_road=5;e.state.questWins.mill_cellar=0;e.state.world.bossTarget='stone_sentinel';e.state.world.bossParty=e.state.adventurers.map(h=>h.id);
 const stats=copy(e.state.stats),gold=e.state.player.gold,f=new World(copy(D),e.exportSave());assert.equal(f.state.world.questProgressionVersion,2);assert.equal(f.state.questWins.rat_nest,12);
 for(const chain of f.data.questTiers.slice(0,2))for(const id of chain.slice(0,3))assert(f.state.questWins[id]>=5);
 assert(!f.state.questWins.ash_courtyard);assert.equal(f.state.player.gold,gold);assert.deepEqual(f.state.stats,stats);const again=new World(copy(D),f.exportSave());assert.deepEqual(again.state.questWins,f.state.questWins);
 const fresh=make();delete fresh.state.world.questProgressionVersion;fresh.state.questWins.rat_nest=5;const migrated=new World(copy(D),fresh.exportSave());assert(open(migrated,'mill_cellar'));assert(!open(migrated,'smuggler_cache'));assert(!migrated.state.questWins.mill_cellar);
});

test('furnishings buy five levels at exponential prices, stack real effects and stop charging at max',()=>{
 const e=make();e.state.player.gold=1000000;const initial=e.state.player.gold,before=e._effects().budget||0,prices=[];
 for(let rank=0;rank<5;rank++){const v=e.decorationPreview('hearth_banner');assert.equal(v.level,rank);assert.equal(v.cost,Math.ceil(260*2.4**rank));prices.push(v.cost);assert(v.eligible);assert(e.command('decorate',{decorId:'hearth_banner'}).ok);assert(Math.abs(e._effects().budget-before-.08*(rank+1))<1e-8);}
 assert.equal(e.state.player.gold,initial-prices.reduce((a,b)=>a+b,0));assert.deepEqual(e.state.decorations,['hearth_banner']);assert.equal(e.decorationLevel('hearth_banner'),5);const save=e.exportSave();assert(!e.command('decorate',{decorId:'hearth_banner'}).ok);assert.equal(e.exportSave(),save);
 const poor=make(),untouched=poor.exportSave();assert(!poor.command('decorate',{decorId:'hearth_banner'}).ok);assert(!poor.command('decorate',{decorId:'missing'}).ok);assert.equal(poor.exportSave(),untouched);
});

test('furnishing levels survive reload and retirement and old owned furnishings become level one',()=>{
 const e=make();e.state.decorations=['makers_plaque'];delete e.state.decorationLevels;const f=new World(copy(D),e.exportSave());assert.equal(f.decorationLevel('makers_plaque'),1);assert.equal(f._effects().quality,5);f.state.player.gold=100000;assert.equal(f.decorationPreview('makers_plaque').cost,1680);assert(f.command('decorate',{decorId:'makers_plaque'}).ok);assert.equal(f._effects().quality,10);
 f.state.questWins.void_sovereign=1;assert(f.command('retire',{confirmed:true}).ok);assert.equal(f.decorationLevel('makers_plaque'),2);assert.equal(f._effects().quality,10);const g=new World(copy(D),f.exportSave());assert.equal(g.decorationLevel('makers_plaque'),2);assert.equal(g._effects().quality,10);
});

test('invalid furnishing levels cannot be imported or create unowned effects',()=>{
 const e=make();e.state.decorations=['hearth_banner'];for(const value of [0,-1,1.5,6,'2']){e.state.decorationLevels={hearth_banner:value};assert(!World.validateSave(e.exportSave(),e.data).ok);}
 e.state.decorationLevels={guild_library:1};assert(!World.validateSave(e.exportSave(),e.data).ok);e.state.decorationLevels=[];assert(!World.validateSave(e.exportSave(),e.data).ok);
});
