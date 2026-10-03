// A deterministic opening-run smoke test. No resources, levels or unlocks are granted.
const fs=require('node:fs'),Workshop=require('../workshop-engine'),D=require('../data');
const e=new Workshop(JSON.parse(JSON.stringify(D)));e.command('create',{smithName:'Opening test',stats:{strength:5,precision:5,charisma:5,knowledge:5}});
const milestones={},snapshot=()=>({minute:e.state.simTime/60000,level:e.state.player.level,gold:e.state.player.gold,crafted:e.state.stats.crafted,sold:e.state.stats.sold,wins:e.state.stats.questsWon,retreats:e.state.stats.questsLost,smelted:e.state.workshop.smelted,workers:e.state.world.miners.length}),samples=[];
for(let second=0;second<2700;second++){
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
 e.tick(1000);
 for(const[k,condition]of [['firstCraft',s.stats.crafted],['firstSale',s.stats.sold],['firstVictory',s.stats.questsWon],['smithLevel2',s.player.level>=2]])if(condition&&milestones[k]==null)milestones[k]=+(s.simTime/60000).toFixed(2);
 if(second%300===299){const v=Workshop.validateSave(e.exportSave(),e.data);if(!v.ok)throw Error(v.message);if(s.runs.some(r=>!r.rewardApplied&&r.returnAt<s.simTime))throw Error('Overdue return');samples.push(snapshot());}
}
const result={method:'45-minute active opening smoke test, base seed, no grants. Manual mining, 3 assigned miners, smelting batches, mixed tier-1 crafts, early finishing, two Forge investments and clearance only near capacity. This is not an optimal or full-campaign balance estimate.',milestones,final:snapshot(),samples};
fs.writeFileSync('design/qa/version-2.0-opening.json',JSON.stringify(result,null,2));console.log(JSON.stringify({milestones,final:result.final},null,2));
