'use strict';
// Reproducible accelerated agent: all production decisions use public engine commands.
// Only the final congestion scenario injects a deliberately full synthetic save.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const World=require('../world-engine'),P=require('../progression'),D=require('../data');
const create=(profession)=>{const e=new World(JSON.parse(JSON.stringify(D)));assert(e.command('create',{name:'Accelerated AI test',profession,stats:{strength:7,precision:7,charisma:7,knowledge:7}}).ok);return e;};
function play(name,profession,minutes,focus=false,passive=false){
 const e=create(profession),milestones={},failures={},states={},history=[];let decision=0,maxOverdue=0,maxCargo=0,stockBlocked=0;
 const act=(a,p)=>{const r=e.command(a,p);if(!r.ok)failures[a]=(failures[a]||0)+1;return r;};
 const stamp=(key,yes)=>{if(yes&&milestones[key]==null)milestones[key]=+(e.state.simTime/60000).toFixed(2);};
 for(let t=0;t<minutes*60000;t+=30000){
  if(!passive){
   while(e.state.player.points>0)act('allocate',{stat:['precision','knowledge','strength'][decision++%3]});
   const seams=e.seams();const demand=seams.filter(s=>['bronze','fuel','iron'].includes(s.id)).sort((a,b)=>e.state.materials[a.id]-e.state.materials[b.id]);
   if(demand.length)act('mine',{materialId:demand[0].id});
   for(const id of ['wood','leather'])if(e.state.materials[id]<4&&e.state.player.gold>=6)act('buyMaterial',{materialId:id,quantity:4-e.state.materials[id]});
   if(e.state.world.miners.length<3&&e.currencies().mine>=e.hireCost())act('hireMiner');
   for(let i=0;i<e.state.world.miners.length;i++){const m=e.state.world.miners[i],id=i===1?'fuel':i===2&&seams.some(s=>s.id==='iron')?'iron':'bronze';if(m.assigned!==id)act('assignWorker',{id:m.id,materialId:id});}
   const priorities=['mine_extraction_0','mine_logistics_0','mine_depths_0','mine_extraction_1','mine_extraction_2','mine_logistics_1','forge_machinery_0','forge_machinery_1','forge_workflow_0','forge_workflow_1','forge_mastery_0','shop_warehouse_0','shop_commerce_0','shop_warehouse_1','adventurers_training_0','adventurers_training_1','adventurers_expeditions_0','adventurers_expeditions_1','adventurers_expeditions_2','adventurers_recruitment_0'];
   for(const id of priorities){const n=P.nodes[id];if(!(e.state.world.trees[id]>0)&&e.treePreview(id).eligible&&(n.section!=='forge'||e.state.player.gold>e.treePreview(id).cost+12))act('tree',{id});}
   // Avoid dead shelving: liquidate duplicate low-value stock after three copies.
   for(const item of [...e.state.inventory]){const copies=e.state.inventory.filter(i=>i.recipeId===item.recipeId);if((copies.length>2||(focus&&copies.length>=2))&&!item.protected&&!item.reservedFor)act('sell',{itemId:item.id});}
   for(const item of e.state.inventory)if(!item.displayed&&e.state.inventory.filter(i=>i.displayed).length<e.derived().displayCapacity)act('display',{itemId:item.id});
   let recipes=Object.values(e.data.recipes).filter(r=>e._recipeKnown(r)&&(!focus||r.classId==='swords'));
   const count=r=>e.state.inventory.filter(i=>i.recipeId===r.id).length+e.state.jobs.filter(j=>j.recipeId===r.id).length;
   recipes.sort((a,b)=>count(a)-count(b)||b.tier-a.tier||((decision%2)?a.id.localeCompare(b.id):b.id.localeCompare(a.id)));
   const recipe=recipes.find(r=>count(r)<2&&e.craftPreview(r.id).eligible);if(recipe)act('craft',{recipeId:recipe.id});
   for(const job of e.state.jobs)if(job.status==='active'&&!job.technique)act('technique',{jobId:job.id});
   for(const seam of e.seams())if(e.state.materials[seam.id]>e.binCapacity()-5)act('sellMaterial',{materialId:seam.id,quantity:8});
  }
  e.tick(30000);
  stamp('firstCraft',e.state.stats.crafted);stamp('firstSale',e.state.stats.sold);stamp('firstVictory',e.state.stats.questsWon);stamp('level2',e.state.player.level>=2);stamp('ironSeam',e.seams().some(s=>s.id==='iron'));stamp('ironCraft',Object.keys(e.state.player.legacy.collection).some(id=>id.startsWith('iron_')));
  const overdue=e.state.runs.filter(r=>!['complete','pending'].includes(r.status)&&r.returnAt<e.state.simTime);maxOverdue=Math.max(maxOverdue,overdue.length);maxCargo=Math.max(maxCargo,Object.values(e.state.questCargo).reduce((a,b)=>a+b,0));if(e.state.inventory.length>=e.derived().storageCapacity)stockBlocked++;
  for(const h of e.state.adventurers)states[e.heroActivity(h.id).phase]=(states[e.heroActivity(h.id).phase]||0)+1;
  if(t%600000===0){const valid=World.validateSave(e.exportSave(),e.data);assert(valid.ok,valid.message);history.push({minute:e.state.simTime/60000,gold:e.state.player.gold,crafted:e.state.stats.crafted,wins:e.state.stats.questsWon,losses:e.state.stats.questsLost});}
 }
 const summary={name,profession,minutes,passive,focus,milestones,level:e.state.player.level,gold:e.state.player.gold,crafted:e.state.stats.crafted,sold:e.state.stats.sold,wins:e.state.stats.questsWon,losses:e.state.stats.questsLost,heroes:e.state.adventurers.length,workers:e.state.world.miners.length,mined:e.state.world.totalMined,upgrades:Object.values(e.state.world.trees).reduce((a,b)=>a+b,0),highestProficiency:Math.max(...Object.values(e.state.player.proficiency).map(p=>p.level)),highestTier:Math.max(0,...Object.keys(e.state.player.legacy.collection).map(id=>e.data.recipes[id].tier)),inventory:e.state.inventory.length,maxOverdue,maxCargo,stockBlockedMinutes:stockBlocked/2,states,failedActions:failures,history,legacy:{eligible:e.retirementPreview().eligible,sparks:e.retirementPreview().sparks,breakdown:e.retirementPreview().breakdown}};
 assert.equal(maxOverdue,0);return summary;
}
function stress(){const e=create('weaponsmith');for(const id in e.state.materials)e.state.materials[id]=e.binCapacity();e.state.mailbox=Array.from({length:25},(_,i)=>({id:'stress-'+i,materials:{bronze:1},gold:0,recipes:[]}));e.tick(8*3600000,{offline:true});const valid=World.validateSave(e.exportSave(),e.data);assert(valid.ok,valid.message);assert(!e.state.runs.some(r=>r.status==='pending'));const restored=new World(JSON.parse(JSON.stringify(D)),e.exportSave());assert.equal(restored.state.stats.questsWon,e.state.stats.questsWon);return{name:'Eight-hour full-storage idle stress',minutes:480,wins:e.state.stats.questsWon,losses:e.state.stats.questsLost,cargo:Object.values(e.state.questCargo).reduce((a,b)=>a+b,0),runs:e.state.runs.length,mailbox:e.state.mailbox.length,saveValid:valid.ok,phases:e.state.adventurers.map(h=>e.heroActivity(h.id).phase)};}
module.exports={play};
if(require.main===module){
const output=path.join(__dirname,'../design/qa/accelerated-playtest.json');
if(process.argv.includes('--focus-only')){const results=JSON.parse(fs.readFileSync(output,'utf8'));results.profiles[2]=play('Sword specialist','weaponsmith',120,true);fs.writeFileSync(output,JSON.stringify(results,null,2));console.log(JSON.stringify(results.profiles[2],(k,v)=>k==='history'?undefined:v,2));process.exit(0);}
const results={generatedAt:new Date().toISOString(),method:'Deterministic engine-driven decision agent; 30-second policy turns; no grants in four player profiles; one explicitly synthetic congestion stress.',profiles:[play('Generalist smith','weaponsmith',120),play('Prospector generalist','prospector',120),play('Sword specialist','weaponsmith',120,true),play('Unattended empty shop','merchant',480,false,true)],stress:stress()};
fs.mkdirSync(path.join(__dirname,'../design/qa'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../design/qa/accelerated-playtest.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,(k,v)=>k==='history'?undefined:v,2));

}
