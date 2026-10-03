/* Ore-to-equipment content. Stable recipe IDs keep older equipment and saves usable. */
(function(root){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
const metals=['bronze','iron','steel','mithril','starforged'];
const smelts={
 bronze:{id:'bronze',name:'Bronze alloy',inputs:{bronze:2,tin:1,fuel:1},output:'bronze_ingot',amount:3,seconds:24,tier:1},
 iron:{id:'iron',name:'Iron ingots',inputs:{iron:2,fuel:1},output:'iron_ingot',amount:2,seconds:36,tier:2,upgrade:'iron'},
 steel:{id:'steel',name:'Steel alloy',inputs:{iron_ingot:2,fuel:2},output:'steel_ingot',amount:2,seconds:52,tier:3,upgrade:'steel'},
 mithril:{id:'mithril',name:'Mithril alloy',inputs:{mithril:2,steel_ingot:1,fuel:2},output:'mithril_ingot',amount:2,seconds:72,tier:4,upgrade:'mithril'},
 starforged:{id:'starforged',name:'Starforged alloy',inputs:{starforged:2,mithril_ingot:1,fuel:3},output:'starforged_ingot',amount:2,seconds:100,tier:5,upgrade:'starforged'}
};
const upgrades={
 bellows:{name:'Leather bellows',branch:'Heat',cost:30,maxRank:5,speed:.15,description:'Smelting speed +15% per rank.'},
 lining:{name:'Refractory lining',branch:'Heat',cost:280,maxRank:5,parent:'bellows',speed:.25,description:'Smelting speed +25% per rank.'},
 iron:{name:'Iron crucible',branch:'Metallurgy',cost:65,maxRank:1,level:2,description:'Refine iron ore into usable ingots.'},
 steel:{name:'Carbon control',branch:'Metallurgy',cost:180,maxRank:1,parent:'iron',level:4,description:'Alloy iron and coal into steel.'},
 mithril:{name:'Silverfire crucible',branch:'Metallurgy',cost:650,maxRank:1,parent:'steel',level:8,description:'Blend mithril ore with steel.'},
 starforged:{name:'Celestial crucible',branch:'Metallurgy',cost:2200,maxRank:1,parent:'mithril',level:12,description:'Bind star ore with mithril.'},
 racks:{name:'Casting racks',branch:'Handling',cost:45,maxRank:5,description:'Two additional queued batches per rank.'},
 chambers:{name:'Parallel hearths',branch:'Handling',cost:450,maxRank:3,parent:'racks',description:'One additional active furnace per rank.'}
};
function escrow(data,job){
 if(!job.workshopCraft)return null;
 const inputs=copy(data.recipes[job.recipeId]?.inputs||{}),enchant=data.enchantments[job.enchantmentId];
 if(enchant)for(const[id,n]of Object.entries(enchant.inputs||{}))inputs[id]=(inputs[id]||0)+n;
 return inputs;
}
function apply(data,P){
 P.apply(data);if(data.workshopVersion)return data;data.workshopVersion=1;
 data.preWorkshopRecipeInputs=Object.fromEntries(Object.values(data.recipes).map(r=>[r.id,copy(r.inputs)]));
 data.quarry.deposits.tin={...copy(data.quarry.deposits.bronze),id:'tin',materialId:'tin',name:'Tin vein'};
 data.materials.tin={id:'tin',name:'Tin ore',price:1,tier:1,color:'#b3c5ca'};
 for(const id of metals){const m=data.materials[id];data.materials[id+'_ingot']={...copy(m),id:id+'_ingot',name:m.name+' ingot',refined:true,price:Math.max(2,m.price||2)};}
 data.materials.bronze.name='Copper ore';data.materials.iron.name='Iron ore';data.materials.mithril.name='Mithril ore';data.materials.starforged.name='Star ore';
 for(const r of Object.values(data.recipes)){
  r.patternName=r.name.replace(/^(Bronze|Iron|Steel|Mithril|Starforged) /,'').replace(/ · .* fittings$/,'');
  for(const id of metals)if(r.inputs[id]){r.inputs[id+'_ingot']=r.inputs[id];delete r.inputs[id];}
  r.materialId+='_ingot';
  // A zero-stat smith can always make training equipment; specialisation opens stronger patterns.
  if(r.tier===1&&r.variant===0)r.requires.statValue=0;
 }
 for(const [source,target] of [['legacyRecipeInputs','legacyRefinedInputs'],['preSupplyRecipeInputs','preSupplyRefinedInputs']])data[target]=Object.fromEntries(Object.entries(data[source]||{}).map(([id,inputs])=>[id,Object.fromEntries(Object.entries(inputs).map(([mat,n])=>[metals.includes(mat)?mat+'_ingot':mat,n]))]));
 for(const e of Object.values(data.enchantments))for(const id of metals)if(e.inputs?.[id]){e.inputs[id+'_ingot']=e.inputs[id];delete e.inputs[id];}
 data.craftEscrow=job=>escrow(data,job);
 if(!P.seams.some(s=>s.id==='tin'))P.seams.splice(2,0,{id:'tin',name:'Tin vein',effect:null,seconds:40});
 P.seams.find(s=>s.id==='bronze').name='Copper workings';
 P.nodes.mine_depths_2.name='Iron-rich galleries';P.nodes.mine_depths_2.description='Mining speed +20%. Steel is alloyed in the Smelter.';P.nodes.mine_depths_2.effects={miningSpeed:.2};delete P.nodes.mine_depths_2.requiresEffect;
 P.nodes.forge_machinery_1.name='Power hammer';P.nodes.forge_machinery_1.description='Install a power hammer; enables iron-tier shaping.';
 for(const n of Object.values(P.nodes).filter(n=>n.branch==='Recruitment')){
  const people=Object.keys(n.effects).filter(k=>/^hero[A-Z]/.test(k)&&!['heroHp','heroArmor','heroAttack','heroSpeed'].includes(k)).map(k=>data.heroes.find(h=>h.id===k.slice(4).toLowerCase())).filter(Boolean);
  n.name=people.map(h=>data.archetypes[h.archetypeId].name).join(' & ')+' customers';
  n.description=people.map(h=>h.name+' visits automatically; buys '+data.archetypes[h.archetypeId].preferences.map(id=>data.classes[id].name).join(', ')).join('. ')+'.';
 }
 return data;
}
const api={apply,metals,smelts,upgrades,escrow};if(typeof module==='object'&&module.exports)module.exports=api;else root.EIWorkshop=api;
})(globalThis);
