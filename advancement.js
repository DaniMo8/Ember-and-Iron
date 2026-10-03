/* Version 2.1 progression: stable purchase IDs, focused branches and lasting legacies. */
(function(root){
'use strict';
const sections={
 mine:[['Depth','Expose the next ore, then improve deep extraction.','Main path'],['Workers','Build a larger, faster mining crew.','Crew'],['Storage','Keep larger stocks and reduce supply costs.','Capacity']],
 smelter:[['Alloys','Unlock iron, steel, mithril and starforged metal.','Main path'],['Quality','Prepare cleaner metal for higher-quality equipment.','Purity'],['Speed','Shorten batches and expand furnace throughput.','Production']],
 forge:[['Recipes','Learn standard, higher-tier and prestige patterns.','Main path'],['Quality','Improve craftsmanship, prefixes and the quality ceiling.','Craftsmanship'],['Speed','Expand queues, benches and production speed.','Production']],
 shop:[['Price','Earn more from each successful customer sale.','Main path'],['Customer budgets','Help customers afford stronger equipment.','Purchasing power'],['Customer relations','Build loyalty, commissions and room for stock.','Service']],
 adventurers:[['Classes','Attract customers who need new equipment types.','Main path'],['Quantity','Welcome additional buyers and send larger parties.','Company'],['Readiness','Improve survival, recovery and time on the road.','Preparation']],
 legacy:[['Workforce','Inherit an established crew and productive workshop.','Permanent'],['Efficiency','Slow upgrade cost growth and strengthen commerce.','Permanent'],['Metallurgy','Produce more ingots and inherit better craftsmanship.','Permanent'],['Archives','Remember rare and legendary designs across generations.','Permanent']]
};
const recipeNode=r=>r.legacyTalent?null:r.tier===1&&r.variant===0?null:r.variant===2?'forge_recipes_prestige':'forge_machinery_'+(r.tier-1);
function apply(d,P,smelter){
 if(d.advancementVersion)return d;d.advancementVersion=1;
 if(!P.focusedBranches){
  P.focusedBranches=true;
  for(const n of Object.values(P.nodes)){
   n.priorParents=[...n.parents];
   if(n.section==='mine')n.branch=n.branch==='Depths'?'Depth':n.branch==='Extraction'||[1,2,4,7].some(i=>n.id==='mine_logistics_'+i)?'Workers':'Storage';
   if(n.section==='forge')n.branch=n.branch==='Machinery'?(n.depth<5?'Recipes':n.depth===7?'Speed':'Quality'):n.branch==='Mastery'?([1,5].includes(n.depth)?'Recipes':'Quality'):'Speed';
   if(n.section==='shop')n.branch=n.effects.sale?'Price':n.effects.budget?'Customer budgets':'Customer relations';
   if(n.section==='adventurers')n.branch=n.branch==='Recruitment'?(n.depth<3?'Classes':'Quantity'):n.branch==='Expeditions'&&[2,4,5].includes(n.depth)?'Quantity':'Readiness';
  }
  P.nodes.forge_machinery_0.name='Guild patterns & grinding stone';P.nodes.forge_machinery_0.description='Unlock standard bronze patterns; install the grinding stone. All crafts +4 quality.';
  for(const [i,material]of ['Iron','Steel','Mithril','Starforged'].entries())P.nodes['forge_machinery_'+(i+1)].description+=' Unlock '+material.toLowerCase()+' training and standard patterns.';
  P.nodes.forge_recipes_prestige={id:'forge_recipes_prestige',section:'forge',branch:'Recipes',depth:5,name:'Master armoury patterns',cost:320,level:4,maxRank:1,effects:{prestigePatterns:1},description:'Unlock prestige patterns in every developed material tier. Their high attribute and proficiency requirements still apply.',parents:['forge_machinery_2'],scale:1.9};
  // Each selected branch has its own spine. Named cross-branch gates keep class and material dependencies explicit.
  for(const [section,branches]of Object.entries(sections))for(const [branch]of branches){
   const nodes=Object.values(P.nodes).filter(n=>n.section===section&&n.branch===branch).sort((a,b)=>a.cost-b.cost||a.id.localeCompare(b.id));
   nodes.forEach((n,i)=>{n.depth=i;n.parents=i?[nodes[i-1].id]:[];});
  }
  P.nodes.forge_recipes_prestige.parents=['forge_machinery_1'];
  // Keep all metallurgy unlocks on the main spine, without an XP upgrade blocking them.
  for(let i=0;i<5;i++)P.nodes['forge_machinery_'+i].parents=i?['forge_machinery_'+(i-1)]:[];
  P.nodes.forge_mastery_1.parents=['forge_machinery_0'];P.nodes.forge_mastery_5.parents=['forge_recipes_prestige'];
  for(const [n,parent]of [['adventurers_recruitment_5','adventurers_recruitment_0'],['adventurers_recruitment_6','adventurers_recruitment_2'],['adventurers_recruitment_7','adventurers_recruitment_1']])P.nodes[n].parents.push(parent);
  for(const n of Object.values(P.nodes).filter(n=>n.section==='adventurers'&&n.branch==='Quantity'&&n.id.includes('recruitment'))){
   n.name={3:'Another duelist',4:'Another ranger',5:'Vanguard & breaker regulars',6:'Another mage',7:'Another guardian'}[Number(n.id.split('_').at(-1))];
  }
  // Support investments follow their purpose. Remember both older layouts for save migration.
  for(const n of Object.values(P.nodes))n.acceptedParents=[n.priorParents||[],[...n.parents]];
  const paths=[
   ['mine_extraction_0','mine_extraction_2','mine_extraction_3','mine_extraction_4','mine_extraction_6','mine_extraction_7'],
   ['mine_extraction_1','mine_extraction_5'],['mine_logistics_1','mine_logistics_4','mine_logistics_7'],
   ['mine_logistics_2'],
   ['forge_mastery_0','forge_machinery_5','forge_machinery_6'],
   ['forge_mastery_2','forge_mastery_6'],['forge_mastery_3','forge_mastery_7'],['forge_mastery_4'],
   ['forge_workflow_0','forge_workflow_4'],['forge_workflow_1','forge_workflow_3','forge_workflow_6','forge_machinery_7'],
   ['forge_workflow_2','forge_workflow_5','forge_workflow_7'],
   ['shop_warehouse_0','shop_warehouse_1','shop_warehouse_4','shop_warehouse_6'],
   ['shop_relations_0','shop_relations_1','shop_commerce_2','shop_relations_6'],
   ['shop_relations_4','shop_commerce_5'],['shop_relations_2','shop_commerce_6'],
   ['adventurers_training_0','adventurers_training_4','adventurers_training_7'],
   ['adventurers_training_1','adventurers_training_5'],['adventurers_training_2'],
   ['adventurers_training_3','adventurers_training_6'],
   ['adventurers_expeditions_0','adventurers_expeditions_3','adventurers_expeditions_7'],
   ['adventurers_expeditions_1','adventurers_expeditions_6'],
   ['adventurers_expeditions_2','adventurers_expeditions_4','adventurers_expeditions_5']
  ];
  for(const path of paths)path.forEach((id,i)=>P.nodes[id].parents=i?[path[i-1]]:[]);
  const links={mine_logistics_2:['mine_logistics_1'],forge_mastery_4:['forge_machinery_3'],
   shop_warehouse_2:['shop_warehouse_1'],shop_warehouse_3:['shop_warehouse_1'],shop_warehouse_5:['shop_warehouse_0'],shop_warehouse_7:['shop_warehouse_5','shop_warehouse_6'],
   adventurers_recruitment_3:['adventurers_expeditions_2'],adventurers_recruitment_4:['adventurers_recruitment_3'],
   adventurers_recruitment_5:['adventurers_recruitment_4','adventurers_recruitment_0'],adventurers_recruitment_6:['adventurers_recruitment_5','adventurers_recruitment_2'],adventurers_recruitment_7:['adventurers_recruitment_6','adventurers_recruitment_1']};
  for(const[id,parents]of Object.entries(links))P.nodes[id].parents=parents;
  P.nodes.adventurers_recruitment_0.milestone={sales:10,wins:5};
  P.nodes.adventurers_recruitment_1.milestone={boss:'smuggler_cache'};
  P.nodes.adventurers_recruitment_2.milestone={boss:d.tierBosses[1]};
  P.nodes.forge_workflow_shifts={id:'forge_workflow_shifts',section:'forge',branch:'Speed',depth:8,name:'Workshop shift roster',cost:600,level:5,maxRank:1,scale:1.9,parents:['forge_workflow_2'],effects:{staffShifts:1},description:'Unlock optional automatic employee breaks. Rest at 35 stamina; return at 90. Employees still lose productivity while resting.'};
 }
 // Smelter's saved IDs remain valid; only their visible sections change.
 for(const [id,n]of Object.entries(smelter))n.branch=['iron','steel','mithril','starforged'].includes(id)?'Alloys':'Speed';
 Object.assign(smelter,{
  flux:{name:'Measured flux',branch:'Quality',cost:55,maxRank:5,quality:2,description:'Prepared metal adds +2 quality per rank to newly started equipment.'},
  skimming:{name:'Slag skimming',branch:'Quality',cost:240,maxRank:5,parent:'flux',quality:3,description:'Cleaner metal adds +3 equipment quality per rank.'},
  assay:{name:'Assay bench',branch:'Quality',cost:1100,maxRank:3,parent:'skimming',quality:4,description:'Test each alloy: +4 equipment quality per rank.'},
  purity:{name:'Perfect lattice',branch:'Quality',cost:4800,maxRank:3,parent:'assay',quality:5,description:'Refined crystal structure: +5 equipment quality per rank. Forge breakthroughs still set the ceiling.'},
  vents:{name:'Heat-recovery flues',branch:'Speed',cost:1600,maxRank:4,parent:'lining',speed:.3,description:'Recover furnace heat: +30% smelting speed per rank.'},
  pours:{name:'Continuous casting',branch:'Speed',cost:6200,maxRank:3,parent:'vents',speed:.5,description:'Continuous casting adds +50% smelting speed per rank.'}
  ,stockkeeper:{name:'Furnace stockkeeper',branch:'Speed',cost:35,level:2,maxRank:1,description:'Unlock automatic ingot targets. Refills unlocked alloys while preserving your input reserve and bin space.'}
 });
 // Retain every existing talent and its effect. Focused Legacy sections combine old and new investments.
 for(const t of Object.values(d.talents))t.branch=({force:'Workforce',forge:'Workforce',commerce:'Efficiency',artifice:'Metallurgy',lore:'Archives'})[t.branch]||t.branch;
 const paths={
  Workforce:[['inherited_crew','Inherited crew',12,{startWorkers:1},'Begin each new smith with one extra miner and crew slot.'],['family_workforce','Family workforce',28,{startWorkers:2},'Begin with two more miners and crew slots.'],['founders_guild','Founders guild',60,{startWorkers:3,startGold:100},'Begin with three more miners, crew slots and 100 extra gold.']],
  Efficiency:[['enduring_tools','Enduring tools',16,{upgradeGrowthReduction:.1},'Room upgrade rank costs grow by 80%, instead of 90%.'],['guild_endowment','Guild endowment',36,{upgradeGrowthReduction:.1},'Reduce room upgrade rank growth by another 10 percentage points.'],['timeless_methods','Timeless methods',72,{upgradeGrowthReduction:.1},'Reduce rank growth to 60% total. First-rank costs and unlock gates remain.']],
  Metallurgy:[['fuller_moulds','Fuller moulds',16,{ingotYield:1},'Every completed smelting batch produces one extra ingot.'],['abundant_castings','Abundant castings',36,{ingotYield:1},'Every batch produces another extra ingot.'],['eternal_hearth','Eternal hearth',72,{ingotYield:2,smeltSpeed:.25},'Two more ingots per batch and +25% smelting speed. Full bins still lose excess.']],
  Archives:[['rare_archive','Rare armoury archive',24,{rareArchive:1},'Permanently discover 17 rare relic patterns, one per equipment class. Requires tier-4 materials and mastery.'],['legend_archive','Legendary armoury archive',52,{legendArchive:1},'Permanently discover 17 legendary sovereign patterns. Requires tier-5 materials and exceptional mastery.'],['ancestral_lore','Ancestral lore',100,{proficiencyGateReduction:5,qualityCap:10},'Legacy recipes become easier to master: proficiency gates −5 and quality ceiling +10.']]
 };
 for(const [branch,rows]of Object.entries(paths))rows.forEach(([id,name,cost,effects,description],i)=>{const previousId=i?rows[i-1][0]:null;d.talents[id]={id,name,cost,effects,description,branch,depth:i+1,maxLevel:1,previousId,prerequisite:previousId,requires:previousId?[previousId]:[],legacySignature:true};});
 d.talents.founders_strength.effects={startStrength:2,smeltSpeed:.2};
 d.talents.founders_strength.description='+2 starting Strength and +20% smelting speed. A lasting benefit throughout each generation.';
 const names={swords:['Knightly Estoc','Sovereign Zweihander'],daggers:['Templar Baselard','Royal Cinquedea'],axes:['Champion Pollaxe','Sovereign Bardiche'],maces:['Flanged Morningstar','Royal Lucerne Hammer'],polearms:['Guard Partisan','Sovereign Guisarme'],bows:['Yew Warbow','Royal Composite Bow'],foci:['Abbot Crozier','Sovereign Runestaff'],armor:['Riveted Lorica','Royal Mail Harness'],shields:['Heraldic Heater','Sovereign Pavise'],cloth_armor:['Embroidered Aketon','Royal Runesilk Mantle'],leather_armor:['Brigandine Jack','Sovereign Lamellar'],offhands:['Illuminated Psalter','Sovereign Codex'],rings:['Bishop Signet','Royal Seal Ring'],charms:['Saints Reliquary','Sovereign Reliquary'],talismans:['Silver Ward Torc','Royal Runic Torc'],tools:['Master Surveyors Kit','Royal Siege Chest'],instruments:['Heralds Clarion','Sovereign War Trumpet']};
 for(const c of Object.keys(d.classes))for(let i=0;i<2;i++){
  const tier=4+i,base=Object.values(d.recipes).find(r=>r.classId===c&&r.tier===tier&&r.variant===(i?2:1));
  const r=JSON.parse(JSON.stringify(base));r.id=(i?'legend_':'relic_')+c;r.name=names[c][i];r.patternName=r.name;r.variant=3+i;r.pattern=i?'legendary':'relic';r.legacyTalent=i?'legend_archive':'rare_archive';r.rarity=i?'legendary':'rare';r.known=false;r.unlock={};r.qualityOffset+=8;r.basePrice=Math.round(r.basePrice*1.35);r.baseSeconds=Math.round(r.baseSeconds*1.4);r.inputs[r.materialId]+=2;r.requires.level=i?20:12;r.requires.statValue=Math.max(r.requires.statValue,i?90:42);r.requires.proficiency=Math.max(r.requires.proficiency,i?97:55);for(const k of ['attack','health','armor'])r.combat[k]=(r.combat[k]||0)*1.22;r.description=(i?'Legendary sovereign':'Rare relic')+' pattern inherited through Legacy. +22% core combat strength over its source pattern; longer work and additional metal.';r.unlockText='Learn '+d.talents[r.legacyTalent].name+' in Legacy → Archives. Material machinery, attributes and mastery still apply.';d.recipes[r.id]=r;
 }
 for(const r of Object.values(d.recipes)){const node=recipeNode(r);if(node)r.unlockText='Develop '+P.nodes[node].name+' in Forge → Recipes. '+(r.unlockText||'');}
 return d;
}
const api={apply,sections,recipeNode};if(typeof module==='object'&&module.exports)module.exports=api;else root.EIAdvancement=api;
})(globalThis);
