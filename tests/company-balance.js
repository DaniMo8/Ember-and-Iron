'use strict';
// Controlled comparisons, not naturally earned campaigns. Never touches browser saves.
const fs=require('node:fs'),assert=require('node:assert/strict');
const World=require('../world-engine'),D=require('../data'),P=require('../progression');
const copy=x=>JSON.parse(JSON.stringify(x));
function fixture(tier=1,quality=45,level=1){
 const e=new World(copy(D));e.command('create',{stats:{strength:7,precision:7,charisma:7,knowledge:7}});
 for(const h of e.state.adventurers){h.level=level;for(const slot of Object.keys(h.equipment)){
  const r=Object.values(e.data.recipes).find(r=>r.slot===slot&&r.tier===tier&&r.variant===1&&e.data.archetypes[h.archetypeId].preferences.includes(r.classId));
  if(r)h.equipment[slot]={id:e._id('fixture'),recipeId:r.id,quality,makerGeneration:1};
 }if(e.data.recipes[h.equipment.weapon?.recipeId]?.twoHanded)h.equipment.offhand=null;}
 return e;
}
function outcomes(e,quest,n=160){let won=0,survivors=0,duration=0;for(let i=1;i<=n;i++){const r=e._simulate(e.data.quests[quest],e.state.adventurers,i*9973);won+=Number(r.victory);survivors+=r.survivors;duration+=r.duration;}return{won,trials:n,winRate:won/n,meanSurvivors:survivors/n,meanBattleSeconds:duration/n/1000};}
function rankCost(n,rank){return Array.from({length:rank},(_,r)=>Math.ceil(n.cost*Math.pow(n.scale,r))).reduce((a,b)=>a+b,0);}
function run(){
 const upgradeComparisons=[];
 for(const [tier,q,level,boss]of [[1,30,1,'smuggler_cache'],[2,65,6,'wildwood_heart']]){
  const e=fixture(tier,q,level);if(tier===1)for(const h of e.state.adventurers)for(const slot of Object.keys(h.equipment))if(!['weapon','body'].includes(slot))h.equipment[slot]=null;const baseline=outcomes(e,boss),baseStats=e.heroStats(e.state.adventurers[0].id);
  upgradeComparisons.push({tier,q,level,boss,upgrade:'None',cost:0,outcomes:baseline,health:baseStats.health,attack:baseStats.attack});
  for(const id of ['adventurers_training_0','adventurers_training_1','adventurers_training_2','adventurers_training_3'])for(const rank of [1,P.nodes[id].maxRank]){
   e.state.world.trees={};let cost=0;for(const parent of Object.values(P.nodes).filter(n=>n.branch==='Training'&&n.depth<P.nodes[id].depth)){e.state.world.trees[parent.id]=1;cost+=rankCost(parent,1);}
   e.state.world.trees[id]=rank;cost+=rankCost(P.nodes[id],rank);const stats=e.heroStats(e.state.adventurers[0].id);
   upgradeComparisons.push({tier,q,level,boss,upgrade:P.nodes[id].name,rank,cost,outcomes:outcomes(e,boss),health:stats.health,attack:stats.attack});
  }
 }
 const e=fixture(),priceChecks=[],patternExamples=[];
 for(const r of Object.values(e.data.recipes)){
  const replacement=Object.entries(r.inputs).reduce((sum,[id,n])=>sum+e.materialPrice(id)*n,0);
  for(const quality of [1,45,100,200]){const item={id:'audit',recipeId:r.id,quality,makerGeneration:1};e.state.inventory=[item];const clearance=e._townPrice(item),customer=e.itemPrice(item.id);assert(clearance<replacement,'Clearance arbitrage: '+r.id);assert(customer>0);priceChecks.push({recipe:r.id,quality,replacement,customer,clearance});}
 }
 for(const classId of ['swords','armor','cloth_armor','offhands'])for(let tier=1;tier<=5;tier++){
  const rows=Object.values(e.data.recipes).filter(r=>r.classId===classId&&r.tier===tier).sort((a,b)=>a.variant-b.variant);
  patternExamples.push({classId,tier,patterns:rows.map(r=>({name:r.name,pattern:r.pattern,cost:r.basePrice,seconds:r.baseSeconds,stat:r.requires.statValue,proficiency:r.requires.proficiency,attack:r.combat.attack,health:r.combat.health,armor:r.combat.armor,qualityOffset:r.qualityOffset}))});
 }
 e.state.inventory=[];const baseline=e.craftPreview('bronze_swords');const furnishings=[];
 for(const d of Object.values(e.data.decor)){e.state.decorations=[d.id];const p=e.craftPreview('bronze_swords');furnishings.push({name:d.name,cost:d.cost,effects:d.effects,craftSeconds:p.seconds,baselineSeconds:baseline.seconds,quality:p.quality,baselineQuality:baseline.quality});}
 const naked=fixture();for(const h of naked.state.adventurers)for(const slot of Object.keys(h.equipment))h.equipment[slot]=null;const bareBefore=outcomes(naked,'smuggler_cache');let remaining=369;while(true){const options=Object.values(P.nodes).filter(n=>n.branch==='Training'&&n.depth<4&&n.parents.every(id=>naked.state.world.trees[id])&&(naked.state.world.trees[n.id]||0)<n.maxRank).map(n=>({n,cost:Math.ceil(n.cost*Math.pow(n.scale,naked.state.world.trees[n.id]||0))})).filter(x=>x.cost<=remaining).sort((a,b)=>a.cost-b.cost);if(!options.length)break;const {n,cost}=options[0];remaining-=cost;naked.state.world.trees[n.id]=(naked.state.world.trees[n.id]||0)+1;}const defeatFarming={merits:369,spent:369-remaining,trees:naked.state.world.trees,bareBefore,bareAfter:outcomes(naked,'smuggler_cache')};
 const report={defeatFarming,generatedAt:new Date().toISOString(),method:'Isolated standard loadouts (tier1 weapon/body only; tier2 full), no enchantments/prefixes, 160 seeds per fixture. Training parents at rank 1; costs include those parents. Not a normal playthrough.',upgradeComparisons,pricing:{checks:priceChecks.length,clearanceArbitrage:0,lowestCustomerMargins:priceChecks.filter(p=>p.quality===45).sort((a,b)=>(a.customer-a.replacement)-(b.customer-b.replacement)).slice(0,12)},patternExamples,furnishings};
 fs.writeFileSync('design/qa/company-balance.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({upgradeComparisons:upgradeComparisons.map(c=>({tier:c.tier,upgrade:c.upgrade,rank:c.rank,cost:c.cost,winRate:c.outcomes.winRate})),pricing:report.pricing,furnishings,defeatFarming},null,2));return report;
}
module.exports={run,fixture,outcomes};if(require.main===module)run();
