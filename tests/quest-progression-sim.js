/* Controlled accelerated route test; equipment grants isolate progression from the economy. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),World=require('../world-engine'),D=require('../data');
const e=new World(JSON.parse(JSON.stringify(D)));e.command('create',{stats:{strength:7,precision:7,charisma:7,knowledge:7}});e.state.upgrades.guild_hall=2;
for(const h of e.state.adventurers){h.level=30;const prefs=e.data.archetypes[h.archetypeId].preferences;for(const slot of Object.keys(h.equipment)){const r=Object.values(e.data.recipes).find(r=>r.slot===slot&&r.tier===5&&r.variant===2&&prefs.includes(r.classId)&&!r.twoHanded);if(r)h.equipment[slot]={id:e._id('item'),recipeId:r.id,quality:200,makerGeneration:1,affixId:null,enchantmentId:null};}}
const milestones=[],seen=new Set();let orders=0;
for(let step=0;step<6*3600&&!e.derived().legacyEligible;step++){
 e.tick(1000);
 for(const q of Object.values(e.data.quests)){const count=e.state.questWins[q.id]||0;if(count>=q.masteryTarget&&!seen.has(q.id)){seen.add(q.id);milestones.push({tier:q.tier,level:q.manualBoss?'boss':q.questLevel,quest:q.id,wins:count,minute:+(e.state.simTime/60000).toFixed(2)});}}
 const next=e.data.tierBosses.find(id=>!e.state.questWins[id]);
 if(next&&!e.state.world.bossTarget&&!e.state.runs.some(r=>r.questId===next&&!['complete','pending'].includes(r.status))&&e._gates(e.data.quests[next].requires).every(g=>g.met)){assert(e.command('gatherAndLaunchBoss',{questId:next,heroIds:e.state.adventurers.map(h=>h.id)}).ok);orders++;}
}
assert(e.derived().legacyEligible,'Automatic heroes must reach the finale');assert.equal(orders,5);assert.equal(seen.size,20);assert.deepEqual(milestones.map(x=>x.quest),e.data.questTiers.flat());assert(World.validateSave(e.exportSave(),e.data).ok);
const report={mode:'Controlled progression check with level-30 heroes, tier-5 gear and party capacity granted; not an economy timing estimate',minutes:+(e.state.simTime/60000).toFixed(2),bossOrders:orders,stalled:false,milestones};fs.writeFileSync('design/qa/version-1.4.1-progression.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
