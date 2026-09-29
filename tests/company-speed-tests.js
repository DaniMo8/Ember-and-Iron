'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const W=require('../world-engine'),D=require('../data'),P=require('../progression'),C=require('../campaign');
const clone=x=>JSON.parse(JSON.stringify(x));
function create(){const e=new W(clone(D));assert(e.command('create',{name:'Idle review',profession:'weaponsmith',stats:{strength:7,precision:7,charisma:7,knowledge:7}}).ok);return e;}
function play(minutes,passive=false,staffCare=true){const e=create(),milestones={},history=[],bossAttempts=[],validationErrors=[],failures={};let decisions=0,maxOverdue=0;
const act=(a,p={})=>{const r=e.command(a,p);if(!r.ok)failures[a+': '+r.message]=(failures[a+': '+r.message]||0)+1;return r;};
const stamp=(k,v)=>{if(v&&milestones[k]==null)milestones[k]=+(e.state.simTime/60000).toFixed(2);};
for(let t=0;t<minutes*60000;t+=30000){if(!passive){
 while(e.state.player.points>0)act('allocate',{stat:['precision','knowledge','strength'][decisions++%3]});
 const seams=e.seams(),demand=seams.filter(s=>['bronze','fuel','iron','steel','mithril'].includes(s.id)).sort((a,b)=>e.state.materials[a.id]-e.state.materials[b.id]);
 if(demand.length&&e.state.materials[demand[0].id]<e.binCapacity())act('mine',{materialId:demand[0].id});
 for(const id of ['wood','leather'])if(e.state.materials[id]<4&&e.state.player.gold>=8)act('buyMaterial',{materialId:id,quantity:4-e.state.materials[id]});
 const oilDemand=Object.values(e.data.recipes).filter(r=>r.tier>=3&&e._recipeKnown(r)&&e.craftPreview(r.id).gates.every(g=>g.met||g.source==='Quarry or material shop')).reduce((n,r)=>Math.max(n,r.inputs.alchemical_oil||0),0);
 if(oilDemand>e.state.materials.alchemical_oil&&e.state.player.gold>=e.materialPrice('alchemical_oil')*(oilDemand-e.state.materials.alchemical_oil)+12)act('buyMaterial',{materialId:'alchemical_oil',quantity:oilDemand-e.state.materials.alchemical_oil});
 if(e.state.world.miners.length<4&&e.currencies().mine>=e.hireCost()&&e.state.world.miners.length<e.derived().workerCapacity)act('hireMiner');
 for(let i=0;i<e.state.world.miners.length;i++){const m=e.state.world.miners[i],id=i===1?'fuel':i===2&&seams.some(s=>s.id==='iron')?'iron':i===3&&seams.some(s=>s.id==='steel')?'steel':'bronze';if(m.assigned!==id)act('assignWorker',{id:m.id,materialId:id});}
 const priorities=['mine_extraction_0','mine_logistics_0','mine_depths_0','mine_extraction_1','mine_logistics_1','mine_extraction_2','mine_depths_1','mine_depths_2','mine_extraction_3','mine_logistics_2','mine_logistics_3','mine_depths_3','forge_machinery_0','forge_machinery_1','forge_workflow_0','forge_workflow_1','forge_mastery_0','forge_machinery_2','forge_machinery_3','forge_workflow_2','forge_mastery_1','forge_mastery_2','forge_mastery_3','shop_warehouse_0','shop_commerce_0','shop_warehouse_1','shop_commerce_1','shop_commerce_2','adventurers_training_0','adventurers_training_1','adventurers_expeditions_0','adventurers_expeditions_1','adventurers_expeditions_2','adventurers_expeditions_3','adventurers_expeditions_4','adventurers_training_2','adventurers_training_3','adventurers_recruitment_0'];
 for(const id of priorities)if(!e.state.world.trees[id]&&e.treePreview(id).eligible&&(P.nodes[id].section!=='forge'||e.state.player.gold>e.treePreview(id).cost+12))act('tree',{id});
 for(const[id,st]of Object.entries(e.state.staff))if(staffCare&&((st.active&&st.stamina<20)||(!st.active&&st.stamina>=95)))act('toggleStaff',{staffId:id});
 for(const st of Object.values(e.data.staff))if(!e.state.staff[st.id]&&e._gates(st.requires).every(g=>g.met)&&e.state.player.gold>e.staffPrice(st.id)+100)act('hireStaff',{staffId:st.id});
 for(const id of e.state.world.unlockedHeroIds.filter(id=>!e.state.world.heroChoices[id]))act('recruitHero',{id,name:'Hire '+id,archetypeId:'mage'});
 for(const item of [...e.state.inventory])if(!item.protected&&!item.reservedFor&&(e.state.inventory.filter(i=>i.recipeId===item.recipeId).length>1||e.state.simTime-item.createdAt>600000))act('sell',{itemId:item.id});
 const count=r=>e.state.inventory.filter(i=>i.recipeId===r.id).length+e.state.jobs.filter(j=>j.recipeId===r.id).length;
 const recipes=Object.values(e.data.recipes).filter(r=>e._recipeKnown(r)&&e.availableClasses().includes(r.classId));
 recipes.sort((a,b)=>count(a)-count(b)||b.tier-a.tier||Math.abs(a.variant-1)-Math.abs(b.variant-1)||a.id.localeCompare(b.id));
 const r=recipes.find(r=>count(r)<1&&e.craftPreview(r.id).eligible);if(r)act('craft',{recipeId:r.id});
 for(const j of e.state.jobs)if(j.status==='active'&&!j.technique)act('technique',{jobId:j.id});
 for(const s of e.seams())if(e.state.materials[s.id]>e.binCapacity()-5)act('sellMaterial',{materialId:s.id,quantity:8});
 const target=C.bosses.find(id=>!e.state.questWins[id]);
 if(target&&!e.state.runs.some(run=>run.questId===target&&!run.rewardApplied)&&e._gates(e.data.quests[target].requires).every(g=>g.met)){
 const ids=e.state.adventurers.slice(0,3).map(h=>h.id);
 if(!e.state.world.bossTarget&&ids.length>=e.data.quests[target].minPartySize)act('prepareBoss',{questId:target,heroIds:ids});
 if(e.state.world.bossTarget){const preview=e.questPreview(target,e.state.world.bossParty);if(preview.eligible&&preview.successEstimate>=65){const p=[...e.state.world.bossParty];const launched=act('launchBoss',{questId:target,heroIds:p});if(launched.ok)bossAttempts.push({minute:e.state.simTime/60000,quest:target,estimate:preview.successEstimate});}else if(preview.eligible&&preview.successEstimate<65)act('releaseBoss');}
 }
}
e.tick(30000);stamp('firstCraft',e.state.stats.crafted);stamp('firstSale',e.state.stats.sold);stamp('firstVictory',e.state.stats.questsWon);stamp('level2',e.state.player.level>=2);for(const id of C.bosses)stamp(id,e.state.questWins[id]);
maxOverdue=Math.max(maxOverdue,e.state.runs.filter(r=>r.status!=='complete'&&r.returnAt<e.state.simTime-1000).length);
if(t%1800000===0){const valid=W.validateSave(e.exportSave(),e.data);if(!valid.ok)validationErrors.push({minute:e.state.simTime/60000,message:valid.message});history.push({minute:e.state.simTime/60000,level:e.state.player.level,gold:e.state.player.gold,crafted:e.state.stats.crafted,wins:e.state.stats.questsWon,losses:e.state.stats.questsLost});}
}
assert.equal(validationErrors.length,0,'Normal play must produce reloadable saves');assert.equal(maxOverdue,0);assert.equal(Object.values(e.state.questCargo).reduce((a,b)=>a+b,0),0);assert(!e.state.mailbox.length);
return{minutes,policy:passive?'Unattended with empty shop':'30-second active manager; all available classes; material sales; first-rank upgrades; boss launch at >=65% estimated chance',milestones,bossAttempts,level:e.state.player.level,gold:e.state.player.gold,crafted:e.state.stats.crafted,sold:e.state.stats.sold,wins:e.state.stats.questsWon,losses:e.state.stats.questsLost,questWins:e.state.questWins,heroLevels:e.state.adventurers.map(h=>({name:h.name,level:h.level,status:h.status,gear:Object.values(h.equipment).filter(Boolean).length})),workers:e.state.world.miners.length,highestCraftedTier:Math.max(0,...Object.keys(e.state.player.legacy.collection).map(id=>e.data.recipes[id].tier)),staffCare,staff:e.state.staff,highestProficiency:Math.max(...Object.values(e.state.player.proficiency).map(p=>p.level)),materialsLost:e.state.world.materialsLost||0,trees:e.state.world.trees,legacy:e.retirementPreview(),maxOverdue,validationErrors,history,failedActions:failures};}

module.exports={play,create};if(require.main===module){const profiles=[play(360,false,true),play(240,false,false),play(480,true)];const report={generatedAt:new Date().toISOString(),method:'Normal commands every 30 simulated seconds. No resources or progression granted. Separate isolated balance fixtures live in company-balance.js.',profiles};fs.writeFileSync('design/qa/company-speed-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(profiles.map(({history,trees,legacy,...p})=>p),null,2));}
