// Read-only engine review. Isolated engines only; no player saves or content are changed.
const fs=require('node:fs');
const Workshop=require('../../workshop-engine'),D=require('../../data'),P=require('../../progression');
const fresh=()=>{const e=new Workshop(JSON.parse(JSON.stringify(D)));e.command('create',{smithName:'Review',stats:{strength:5,precision:5,charisma:5,knowledge:5}});return e;};
const snap=e=>({minute:e.state.simTime/60000,level:e.state.player.level,gold:e.state.player.gold,crafts:e.state.stats.crafted,sales:e.state.stats.sold,wins:e.state.stats.questsWon,defeats:e.state.stats.questsLost,merits:e.currencies().adventurers,classes:[...new Set(Object.values(e.state.world.heroChoices).map(h=>h.archetypeId))],miners:e.state.world.miners.length,prospecting:e.currencies().mine,smelted:e.state.workshop.smelted,jobs:e.state.jobs.length,smelts:e.state.workshop.jobs.length,inventory:e.state.inventory.length,stock:{copper:e.state.materials.bronze,tin:e.state.materials.tin,coal:e.state.materials.fuel,bronzeIngots:e.state.materials.bronze_ingot},valid:Workshop.validateSave(e.exportSave(),e.data).ok});
const events=[];
function buy(e,command,payload){const r=e.command(command,payload);if(r.ok)events.push({minute:+(e.state.simTime/60000).toFixed(2),command,...payload});return r.ok;}
function opening(e){
 const s=e.state;
 while(s.player.points)e.command('allocate',{stat:['strength','precision','knowledge','charisma'][s.player.points%4]});
 if(e.currencies().mine>=e.hireCost()&&s.world.miners.length<3)e.command('hireMiner');
 s.world.miners.forEach((m,i)=>{const materialId=['bronze','fuel','tin'][i];if(m.assigned!==materialId)e.command('assignWorker',{id:m.id,materialId});});
 const raw=['fuel','bronze','tin'].sort((a,b)=>s.materials[a]-s.materials[b]);if(s.simTime>=s.quarry.nextManualAt)e.command('mine',{materialId:raw[0]});
 if(s.materials.bronze_ingot<6&&s.workshop.jobs.length<2&&e.smeltPreview('bronze').eligible)e.command('smelt',{id:'bronze'});
 for(const id of ['forge_machinery_0','forge_mastery_0'])if(!s.world.trees[id]&&e.treePreview(id).eligible&&s.player.gold>45)e.command('tree',{id});
 for(const id of ['leather','wood'])if(s.materials[id]<4&&s.player.gold>=e.materialPrice(id)*3)e.command('buyMaterial',{materialId:id,quantity:3});
 const recipes=Object.values(e.data.recipes).filter(r=>r.tier===1&&r.variant<2&&e.craftPreview(r.id).eligible).sort((a,b)=>s.inventory.filter(i=>e.data.recipes[i.recipeId].classId===a.classId).length-s.inventory.filter(i=>e.data.recipes[i.recipeId].classId===b.classId).length||b.variant-a.variant);
 if(s.jobs.length<1&&recipes.length)e.command('craft',{recipeId:recipes[0].id});
 for(const j of s.jobs)if(!j.finishPasses&&s.stats.crafted<8)e.command('technique',{jobId:j.id});
 if(s.inventory.length>=e.derived().storageCapacity-2){const oldest=[...s.inventory].sort((a,b)=>a.quality-b.quality)[0];if(oldest)e.command('sell',{itemId:oldest.id});}
}
const result={method:'Fresh deterministic engines, 5 points per attribute, default Bladesmith. No state/resource grants. Opening helper reproduces existing v2.1 active policy. These are probes, not an optimal progression or campaign estimate.',cases:[]};
for(const scenario of ['idle_no_actions','idle_buy_classes','45min_active_then_60min_idle','45min_active_then_60min_auto_forge','45min_active_with_readiness']){
 const e=fresh(),samples=[],unlocks=[];events.length=0;let auto;
 for(let second=0;second<(scenario.startsWith('45')?105:90)*60;second++){
  if(scenario.startsWith('45')&&second<2700)opening(e);
  if(scenario==='45min_active_with_readiness'&&second<2700)for(const id of ['adventurers_expeditions_2','adventurers_expeditions_0','adventurers_training_0','adventurers_expeditions_1','adventurers_training_1','adventurers_training_2','adventurers_expeditions_4']){if(!e.state.world.trees[id]){if(e.treePreview(id).eligible)buy(e,'tree',{id});break;}}
  if(scenario==='idle_buy_classes')for(const id of ['adventurers_recruitment_0','adventurers_recruitment_1','adventurers_recruitment_2'])if(!e.state.world.trees[id]&&e.treePreview(id).eligible){buy(e,'tree',{id});unlocks.push({minute:second/60,id});}
  if(scenario.endsWith('auto_forge')&&second===2700){const hire=buy(e,'hireStaff',{staffId:'quartermaster'});auto={hire,settings:[]};for(const payload of [{recipeId:'bronze_daggers'},{targetStock:20},{goldReserve:0},{autoBuy:true},{enabled:true}])auto.settings.push(e.command('automation',payload));}
  e.tick(1000);if(second%300===299)samples.push(snap(e));
 }
 result.cases.push({scenario,unlocks,events:[...events],auto,final:snap(e),samples,automation:e.state.automation});
}
result.upgradeSpines=Object.fromEntries(Object.entries(require('../../advancement').sections).filter(([room])=>['shop','adventurers'].includes(room)).map(([room,branches])=>[room,Object.fromEntries(branches.map(([branch])=>[branch,Object.values(P.nodes).filter(n=>n.section===room&&n.branch===branch).map(n=>({id:n.id,name:n.name,cost:n.cost,parents:n.parents,effects:n.effects}))]))]));
fs.writeFileSync('design/qa/idle-enthusiast-v2.1-probes.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result.cases.map(c=>({scenario:c.scenario,unlocks:c.unlocks,auto:c.auto,events:c.events,final:c.final})),null,2));
