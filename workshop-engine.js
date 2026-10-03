(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./world-engine'),require('./progression'),require('./workshop'));else root.EIWorkshopEngine=factory(root.EIWorldEngine,root.EIProgression,root.EIWorkshop);})(globalThis,function(World,P,W){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)),attrs=['strength','precision','charisma','knowledge'],ok=message=>({ok:true,message}),no=message=>({ok:false,message}),int=n=>Number.isSafeInteger(n)&&n>=0;
class Workshop extends World{
 constructor(data,saved){W.apply(data,P);if(saved){const v=Workshop.validateSave(saved,data);if(!v.ok)throw Error(v.message);saved=v.state;}super(data,saved);this._migrateWorkshop();}
 _fresh(){const s=super._fresh();s.player.stats=Object.fromEntries(attrs.map(k=>[k,0]));s.player.points=20;s.player.name='The Smith';s.materials.tin=3;s.workshop={version:1,upgradeVersion:2,archivedPatterns:[],smelted:0,upgrades:{},jobs:[],meritBase:{wins:0,losses:0,earned:0},usefulSales:0,smeltPolicy:{enabled:false,targets:{},reserve:1},rotateStock:false,staffShifts:false,goal:null};return s;}
 _migrateWorkshop(){
  const s=this.state;if(!s.workshop){
   s.workshop={version:1,smelted:0,upgrades:{},jobs:[]};
   for(const id of W.metals){s.materials[id+'_ingot']=(s.materials[id+'_ingot']||0)+(s.materials[id]||0);s.materials[id]=0;}
   s.materials.tin=s.materials.tin||0;
   for(const j of s.jobs)for(const id of W.metals)if(j.inputs[id]){j.inputs[id+'_ingot']=j.inputs[id];delete j.inputs[id];}
   // Preserve existing furnace investment and every paid unfinished order.
   const e=this._effects();if(e.smelter)s.workshop.upgrades.iron=1;if(e.tempering)s.workshop.upgrades.steel=1;if(e.runeBench)s.workshop.upgrades.mithril=1;if(e.starforge)s.workshop.upgrades.starforged=1;
   if(!s.started){s.player.stats=Object.fromEntries(attrs.map(k=>[k,0]));s.player.points=20;}
  }
  if(s.workshop.upgradeVersion!==2){s.workshop.archivedPatterns=[...s.unlocks.recipes];s.workshop.upgradeVersion=2;}
  s.workshop.archivedPatterns??=[];
  // Existing Merit balances and class unlocks are earned investments, including old retreat credit.
  s.workshop.meritBase??={wins:s.stats.questsWon,losses:s.stats.questsLost,earned:s.stats.questsWon+s.stats.questsLost};
  s.workshop.usefulSales??=s.stats.sold;
  s.workshop.smeltPolicy??={enabled:false,targets:{},reserve:1};
  s.workshop.rotateStock??=false;s.workshop.staffShifts??=false;s.workshop.goal??=null;
  for(const id of Object.keys(this.data.materials))s.materials[id]??=0;
  s.player.name=s.player.name||'The Smith';
  for(const j of s.jobs){j.finishPasses??=j.technique?1:0;j.appliedFinishPasses??=j.status==='active'?j.finishPasses:0;if(j.status==='active')j.baseDuration??=Math.max(1,Math.round(j.duration/(j.technique?2:1)));}
  for(const m of s.world.miners)for(const key of ['assigned','working'])if(m[key]==='steel')m[key]='iron';if(s.quarry.activeDeposit==='steel')s.quarry.activeDeposit='iron';
  this._registerCustomers();this._refreshUnlocks();
 }
 static validateSave(input,data){
  W.apply(data,P);const v=World.validateSave(input,data);if(!v.ok)return v;const s=v.state,w=s.workshop;if(!w)return v;
  try{const check=(condition,message)=>{if(!condition)throw Error(message);};
   check(w.version===1&&int(w.smelted)&&w.upgrades&&Array.isArray(w.jobs)&&w.jobs.length<=30,'Invalid smelter state.');
   check(w.upgradeVersion==null||w.upgradeVersion===2,'Invalid upgrade version.');
   if(w.meritBase){const b=w.meritBase;check(int(b.wins)&&int(b.losses)&&int(b.earned)&&b.wins<=s.stats.questsWon&&b.losses<=s.stats.questsLost&&b.earned===b.wins+b.losses,'Invalid inherited Merits.');}
   check(w.usefulSales==null||(int(w.usefulSales)&&w.usefulSales<=s.stats.sold),'Invalid useful sales.');
   if(w.smeltPolicy){const p=w.smeltPolicy;check(typeof p.enabled==='boolean'&&int(p.reserve)&&p.reserve<=1000000&&p.targets&&!Array.isArray(p.targets)&&Object.entries(p.targets).every(([id,n])=>W.smelts[id]&&int(n)&&n<=1000000),'Invalid smelting policy.');}
   for(const key of ['rotateStock','staffShifts'])check(w[key]==null||typeof w[key]==='boolean','Invalid workshop policy.');
   check(w.goal==null||(w.goal.room==='smelter'?!!W.upgrades[w.goal.id]:P.nodes[w.goal.id]?.section===w.goal.room),'Invalid pinned goal.');
   check(w.goal?.rank==null||(int(w.goal.rank)&&w.goal.rank>0&&w.goal.rank<=(w.goal.room==='smelter'?W.upgrades[w.goal.id].maxRank:P.nodes[w.goal.id].maxRank)),'Invalid goal rank.');
   check(Object.values(s.staff).every(st=>st.autoRest==null||typeof st.autoRest==='boolean'),'Invalid staff shift.');
   check(s.inventory.every(i=>i.rotationHold==null||typeof i.rotationHold==='boolean'),'Invalid stock rotation.');
   check(s.automation.demandOnly==null||typeof s.automation.demandOnly==='boolean','Invalid demand policy.');
   check(w.archivedPatterns==null||(Array.isArray(w.archivedPatterns)&&w.archivedPatterns.every(id=>data.recipes[id]&&!data.recipes[id].legacyTalent)),'Invalid inherited patterns.');
   check(Object.entries(w.upgrades).every(([id,n])=>W.upgrades[id]&&int(n)&&n<=W.upgrades[id].maxRank&&(!n||!W.upgrades[id].parent||w.upgrades[W.upgrades[id].parent]>0)),'Invalid smelter upgrades.');
   check(typeof s.player.name==='string'&&s.player.name.trim().length>0&&s.player.name.length<=28,'Invalid smith name.');
   const ids=new Set();for(const j of w.jobs){const r=W.smelts[j.recipeId];check(r&&typeof j.id==='string'&&!ids.has(j.id)&&['active','queued'].includes(j.status),'Invalid smelting order.');ids.add(j.id);check(JSON.stringify(j.inputs)===JSON.stringify(r.inputs),'Invalid smelting escrow.');check(j.status!=='active'||(int(j.startedAt)&&int(j.completeAt)&&j.completeAt>j.startedAt&&int(j.duration)&&j.duration===j.completeAt-j.startedAt),'Invalid smelting clock.');}
   for(const j of s.jobs){check(int(j.finishPasses??0)&&(j.finishPasses??0)<=5&&int(j.appliedFinishPasses??0)&&(j.appliedFinishPasses??0)<=(j.finishPasses??0),'Invalid finishing passes.');if(j.workshopCraft){check(JSON.stringify(Object.entries(j.inputs).sort())===JSON.stringify(Object.entries(W.escrow(data,j)).sort()),'Invalid equipment escrow.');const enchant=thisEnchantment(data,j);check(!j.enchantmentId||!!enchant,'Unknown queued enchantment.');check((j.enchantGold||0)===(enchant?.cost||0),'Invalid enchanting gold escrow.');check(!enchant||!enchant.slots?.length||enchant.slots.includes(data.recipes[j.recipeId].slot),'Incompatible queued enchantment.');check(Number.isFinite(j.enchantStrength)&&j.enchantStrength>=1,'Invalid enchantment strength.');}}
   return v;
  }catch(e){return no(e.message);}
 }
 importSave(input){const v=Workshop.validateSave(input,this.data);if(!v.ok)return v;this.state=v.state;super._migrate();this._migrateWorkshop();this._previewCache.clear();return ok('Save imported.');}
 _create({name,smithName,stats,profession='weaponsmith'}){
  if(this.state.started)return no('This smith already exists.');
  if(!P.professions[profession]||!stats||!attrs.every(k=>int(stats[k]))||attrs.reduce((n,k)=>n+stats[k],0)!==20)return no('Assign exactly 20 points. Attributes start at zero.');
  const clean=String(smithName||'The Smith').trim();if(!clean||clean.length>28)return no('Use a smith name of 1–28 characters.');
  const s=this.state;s.player.name=clean;s.shopName=String(name||'Ember & Iron').trim().slice(0,48)||'Ember & Iron';s.world.profession=profession;s.player.stats=Object.fromEntries(attrs.map(k=>[k,stats[k]]));s.player.points=0;
  const e=this._effects();s.player.stats.strength+=e.startStrength||0;s.player.gold+=e.startGold||0;Object.values(s.player.proficiency).forEach(p=>p.level=e.startProficiency||0);
  const assignments=['bronze','fuel','tin'];for(let i=0;i<(e.startWorkers||0);i++){const n=s.world.miners.length;s.world.miners.push({id:'miner-'+(n+1),assigned:assignments[n%3],working:assignments[n%3],progress:0});}
  s.started=true;s.tutorial.stage=1;this._registerCustomers();for(let i=0;i<3;i++)this._arrive(true);this._refreshUnlocks();return ok('Mine ore, smelt your first bronze, and equip your customers.');
 }
 _registerCustomers(){for(const id of this.state.world.unlockedHeroIds){const h=this.data.heroes.find(h=>h.id===id);if(h&&!this.state.world.heroChoices[id])this.state.world.heroChoices[id]={name:h.name,archetypeId:h.archetypeId};}}
 _tree(payload){const r=super._tree(payload);if(r.ok){this._registerCustomers();for(let i=0;i<12;i++)this._arrive(true);}return r;}
 _recruitHero(){return no('Customers arrive automatically when their class is unlocked.');}
 _effects(){const e=super._effects();e.workerSlots=(e.workerSlots||0)+(e.startWorkers||0);return e;}
 upgradeScale(){return Math.max(1.6,1.9-(this._effects().upgradeGrowthReduction||0));}
 treePreview(id){const n=P.nodes[id];if(!n)return{eligible:false,reason:'Unknown upgrade.'};const rank=this.state.world.trees[id]||0,cost=Math.ceil(n.cost*this.upgradeScale()**rank),missing=n.parents.filter(p=>!this.state.world.trees[p]),milestones=this.classMilestones(id),gate=milestones.find(g=>!g.met);const reason=rank>=n.maxRank?'Fully developed.':missing.length?'Requires '+missing.map(id=>P.nodes[id].name).join(' and ')+'.':gate?gate.label+' · '+gate.current+'/'+gate.required+'.':n.level&&this.state.player.level<n.level?'Requires smith level '+n.level+'.':n.requiresEffect&&!this._effects()[n.requiresEffect]?'Requires '+n.requiresEffect+'.':this.currencies()[n.section]<cost?'Need '+cost+' '+P.currencies[n.section]+'.':'Ready to develop.';return{rank,cost,milestones,eligible:reason==='Ready to develop.',reason};}
 classMilestones(id){const m=P.nodes[id]?.milestone,s=this.state;if(!m)return[];const rows=[];if(m.sales)rows.push({label:'Useful customer sales',current:s.workshop?.usefulSales||0,required:m.sales});if(m.wins)rows.push({label:'Quest victories',current:s.stats.questsWon,required:m.wins});if(m.boss)rows.push({label:'Defeat '+this.data.quests[m.boss].name,current:Math.min(1,s.questWins[m.boss]||0),required:1});return rows.map(g=>({...g,met:g.current>=g.required}));}
 _sell(p){const r=super._sell(p);if(r.ok&&p.heroId&&this.state.workshop)this.state.workshop.usefulSales=(this.state.workshop.usefulSales||0)+1;return r;}
 _fulfillCommission(p){const r=super._fulfillCommission(p);if(r.ok)this.state.workshop.usefulSales++;return r;}
 _recipeKnown(r){
  if(!this.state.workshop||this.state.workshop.upgradeVersion!==2)return super._recipeKnown(r);
  if(!this.availableClasses().includes(r.classId))return false;
  if(r.legacyTalent)return this.state.player.talents.includes(r.legacyTalent);
  if(this.state.workshop.archivedPatterns?.includes(r.id)||this.state.player.legacy.unlockedRecipes.includes(r.id))return true;
  const node=r.tier===1&&r.variant===0?null:r.variant===2?'forge_recipes_prestige':'forge_machinery_'+(r.tier-1);
  if(node&&!this.state.world.trees[node])return false;
  // The recipe path provides discovery; each recipe still checks attributes, mastery and machinery.
  return true;
 }
 _respec(){const p=this.state.player,cost=this.state.stats.crafted&&!p.respecTokens?200:0;if(p.gold<cost)return no('Retraining costs 200 gold.');p.gold-=cost;if(this.state.stats.crafted&&p.respecTokens)p.respecTokens--;p.points+=attrs.reduce((n,k)=>n+p.stats[k],0)-(this._effects().startStrength||0);attrs.forEach(k=>p.stats[k]=0);p.stats.strength=this._effects().startStrength||0;return ok('Attribute points returned.');}
 derived(){const d=super.derived(),a=this.state.player.stats,e=d.effects;d.priceMultiplier=(1+.045*Math.sqrt(a.charisma))*(1+(e.sale||0));d.storageCapacity=18+Math.floor(Math.sqrt(a.strength)*2)+(e.capacity||0);d.enchantStrength=1+.06*Math.sqrt(a.knowledge)+(e.enchant||0);d.staffPriceMultiplier=Math.max(.2,1-Math.min(.4,.015*a.charisma)-(e.staffDiscount||0));return d;}
 craftableRequests(limit=5){if(!this.state.started||!this.state.commissions.some(c=>c.status!=='complete'))return [];const patterns=[];for(const r of Object.values(this.data.recipes)){if(!this._recipeKnown(r))continue;const v=this.craftPreview(r.id);if(v.gates.some(g=>!g.met&&g.source!=='Quarry or material shop'))continue;patterns.push({classId:r.classId,tier:r.tier,quality:Math.min(this.derived().qualityCap,v.quality+38)});}return this.state.commissions.filter(c=>c.status!=='complete'&&patterns.some(r=>r.classId===c.classId&&r.tier>=c.minTier&&r.quality>=c.minQuality)).sort((a,b)=>a.minTier-b.minTier||a.minQuality-b.minQuality||a.id.localeCompare(b.id)).slice(0,limit);}
 _deliver(bundle){if(bundle.materials?.steel){bundle=copy(bundle);bundle.materials.steel_ingot=(bundle.materials.steel_ingot||0)+bundle.materials.steel;delete bundle.materials.steel;}return super._deliver(bundle);}
 _heroBudget(q){return Math.round((q?.budget||16)*(1+.06*Math.sqrt(this.state.player.stats.charisma))*(1+(this._effects().budget||0)));}
 _beginBrowsing(h,reason,event){super._beginBrowsing(h,reason,event);h.browseUntil=this.state.simTime+45000+Math.round(3000*Math.sqrt(this.state.player.stats.charisma))+1000*(this._effects().patience||0);h.leaveAt=h.browseUntil;}
 _craftAffixChance(){return Math.min(.55,.10+.008*this.state.player.stats.precision+(this._effects().affixChance||0));}
 craftPreview(id,options={}){
  const v=super.craftPreview(id,options),r=this.data.recipes[id];if(!r)return v;const a=this.state.player.stats,e=this._effects(),prof=this.state.player.proficiency[r.classId].level;
  v.quality=Math.round(Math.max(1,Math.min(this.derived().qualityCap,18+6*Math.sqrt(a.precision)+4*Math.sqrt(a.knowledge)+.48*prof+(e.quality||0)+this.smelterDerived().quality+(r.slot==='weapon'?(e.weaponQuality||0):0)+(r.qualityOffset||0)+((r.heavy||this.data.classes[r.classId].heavy)?2*Math.sqrt(a.strength)+(e.heavyQuality||0):0)-(r.difficulty||0))));
  v.seconds=r.baseSeconds/(1+.07*Math.sqrt(a.strength)+.005*prof+(e.speed||0));v.price=this._price(r,v.quality);v.gold=0;
  if(options.materialId&&options.materialId!==r.materialId){v.eligible=false;v.reason='This pattern and material do not match.';return v;}
  const enchant=options.enchantmentId?this.data.enchantments[options.enchantmentId]:null;
  if(options.enchantmentId&&!enchant){v.eligible=false;v.reason='Unknown enchantment.';return v;}
  if(enchant){v.price+=Math.ceil(enchant.cost*.65+Object.entries(enchant.inputs||{}).reduce((n,[id,q])=>n+(this.data.materials[id]?.price||0)*q,0)*.5);const qty=options.quantity||1;v.gold=(enchant.cost||0)*qty;v.gates.push(...this._gates(enchant.requires));if(enchant.slots?.length&&!enchant.slots.includes(r.slot))v.gates.push({label:'Enchantment compatibility',met:false});
   for(const[mat,n]of Object.entries(enchant.inputs||{})){v.inputs[mat]=(v.inputs[mat]||0)+n*qty;v.gates.push({label:this.data.materials[mat].name,met:(this.state.materials[mat]||0)>=v.inputs[mat],current:this.state.materials[mat]||0,required:v.inputs[mat],source:'Quarry or material shop'});}
   v.gates.push({label:'Enchanting gold',met:this.state.player.gold>=v.gold,current:this.state.player.gold,required:v.gold});
   const single=W.escrow(this.data,{recipeId:id,workshopCraft:true,enchantmentId:enchant.id});v.maxQuantity=Math.min(v.maxQuantity,...Object.entries(single).map(([mat,n])=>Math.floor((this.state.materials[mat]||0)/n)),enchant.cost?Math.floor(this.state.player.gold/enchant.cost):100);
   if(v.gates.some(g=>!g.met)){v.eligible=false;v.reason=v.gates.find(g=>!g.met).label+' requirement not met.';}
  }
  return v;
 }
 _craft({recipeId,quantity=1,materialId,enchantmentId=null}){
  if(!int(quantity)||quantity<1||quantity>100)return no('Choose 1–100 pieces.');const v=this.craftPreview(recipeId,{quantity,materialId,enchantmentId});if(!v.eligible)return no(v.reason);
  for(const[id,n]of Object.entries(v.inputs))this.state.materials[id]-=n;this.state.player.gold-=v.gold;
  for(let i=0;i<quantity;i++)this.state.jobs.push({id:this._id('job'),recipeId,stationId:null,status:'queued',inputs:Object.fromEntries(Object.entries(v.inputs).map(([id,n])=>[id,n/quantity])),startedAt:null,completeAt:null,duration:0,quality:0,technique:false,finishPasses:0,appliedFinishPasses:0,workshopCraft:true,enchantmentId,enchantGold:v.gold/quantity,enchantStrength:this.derived().enchantStrength,outputReserved:false,affixSeed:Math.floor(this._roll()*4294967295)});
  return ok('Queued '+quantity+' pieces; materials and enchanting gold reserved.');
 }
 _completeJob(job){super._completeJob(job);const item=this.state.inventory.at(-1);if(item&&job.enchantmentId){item.enchantmentId=job.enchantmentId;item.enchantStrength=job.enchantStrength;this._staffXp('enchant',10);}}
 _cancel(p){const j=this.state.jobs.find(j=>j.id===p.jobId),gold=j?.enchantGold||0,r=super._cancel(p);if(r.ok){this.state.player.gold+=gold;if(gold)r.message+=' Refunded '+gold+'g enchanting cost.';}return r;}
 techniquePreview(id){const j=this.state.jobs.find(j=>j.id===id);if(!j)return{eligible:false,reason:'That craft is no longer pending.'};const passes=j.finishPasses||0,normal=this.craftPreview(j.recipeId),base=j.baseDuration||(j.status==='active'?Math.round(j.duration/(1+(j.appliedFinishPasses||0))):Math.ceil(normal.seconds*1000)),bonus=Array.from({length:passes},(_,i)=>Math.floor(20/2**i)).reduce((a,b)=>a+b,0),q=j.status==='active'?j.quality:Math.min(this.derived().qualityCap,normal.quality+bonus),gain=Math.min(Math.floor(20/2**passes),this.derived().qualityCap-q);return{eligible:passes<5&&gain>0,reason:passes>=5?'All five finishing passes complete.':gain<=0?'Quality ceiling reached.':'Another careful pass.',qualityGain:Math.max(0,gain),quality:q+Math.max(0,gain),addedSeconds:base/1000,passes,prefixChance:Math.min(1,(j.affixChance||this._craftAffixChance())+.10/2**passes)};}
 _applyFinishing(j){j.baseDuration??=j.duration;while((j.appliedFinishPasses||0)<(j.finishPasses||0)){const n=j.appliedFinishPasses||0;j.duration+=j.baseDuration;j.completeAt+=j.baseDuration;j.quality=Math.min(this.derived().qualityCap,j.quality+Math.floor(20/2**n));j.affixChance=Math.min(1,j.affixChance+.10/2**n);j.appliedFinishPasses=n+1;}}
 _technique({jobId}){const v=this.techniquePreview(jobId);if(!v.eligible)return no(v.reason);const j=this.state.jobs.find(j=>j.id===jobId);j.technique=true;j.finishPasses=(j.finishPasses||0)+1;if(j.status==='active')this._applyFinishing(j);return ok('Finishing pass '+j.finishPasses+': +'+v.qualityGain+' quality; '+Math.ceil(v.addedSeconds)+'s extra work.');}
 seams(){return super.seams().filter(s=>s.id!=='steel');}
 _mine(p){const old=this.state.player.stats.strength;this.state.player.stats.strength=old+2;try{return super._mine(p);}finally{this.state.player.stats.strength=old;}}
 smelterDerived(){const u=this.state.workshop?.upgrades||{},e=this._effects();return{speed:1+Object.entries(u).reduce((n,[id,rank])=>n+(W.upgrades[id]?.speed||0)*rank,0)+(e.smeltSpeed||0),quality:Object.entries(u).reduce((n,[id,rank])=>n+(W.upgrades[id]?.quality||0)*rank,0),lanes:1+(u.chambers||0),queue:5+(u.racks||0)*2,extraIngots:e.ingotYield||0};}
 smeltOverflow(id,quantity=1){const r=W.smelts[id];if(!r)return 0;const amount=r.amount+this.smelterDerived().extraIngots,pending=this.state.workshop.jobs.filter(j=>j.recipeId===id).length*amount;return Math.max(0,this.state.materials[r.output]+pending+amount*quantity-this.binCapacity());}
 smeltUpgradePreview(id){const n=W.upgrades[id];if(!n)return{eligible:false,reason:'Unknown upgrade.'};const rank=this.state.workshop.upgrades[id]||0,cost=Math.ceil(n.cost*this.upgradeScale()**rank),reason=rank>=n.maxRank?'Fully developed.':n.parent&&!this.state.workshop.upgrades[n.parent]?'Requires '+W.upgrades[n.parent].name+'.':n.level&&this.state.player.level<n.level?'Requires smith level '+n.level+'.':this.state.player.gold<cost?'Need '+cost+' gold.':'Ready to develop.';return{rank,cost,reason,eligible:reason==='Ready to develop.'};}
 smeltPreview(id,quantity=1){const r=W.smelts[id];if(!r)return{eligible:false,reason:'Unknown alloy.'};const d=this.smelterDerived(),jobs=this.state.workshop.jobs,unlocked=!r.upgrade||this.state.workshop.upgrades[r.upgrade]>0,inputs=Object.fromEntries(Object.entries(r.inputs).map(([id,n])=>[id,n*quantity])),open=d.lanes+d.queue-jobs.length,max=Math.max(0,Math.min(open,...Object.entries(r.inputs).map(([id,n])=>Math.floor((this.state.materials[id]||0)/n)))),missing=Object.entries(inputs).filter(([id,n])=>(this.state.materials[id]||0)<n),reason=!unlocked?'Develop '+W.upgrades[r.upgrade].name+'.':!int(quantity)||quantity<1||quantity>30?'Choose 1–30 batches.':open<quantity?'Smelter queue is full.':missing.length?'Need '+missing.map(([id,n])=>(n-(this.state.materials[id]||0))+' '+this.data.materials[id].name).join(', ')+'.':this.state.materials[r.output]>=this.binCapacity()?'The output bin is full.':'Ready to smelt.';return{eligible:this.state.started&&reason==='Ready to smelt.',reason,unlocked,inputs,seconds:r.seconds/d.speed,maxQuantity:max,amount:(r.amount+d.extraIngots)*quantity};}
 act(name,payload={}){if(['smeltPolicy','workshopPolicy','pinGoal'].includes(name)){if(!this.state.started)return no('Create your smith first.');const result=this['_'+name](payload);if(result.ok)this._previewCache.clear();return result;}if(!['smelt','cancelSmelt','smeltUpgrade'].includes(name))return super.act(name,payload);if(!this.state.started)return no('Create your smith first.');let result;
  if(name==='smelt'){const{id,quantity=1}=payload,v=this.smeltPreview(id,quantity);if(!v.eligible)return no(v.reason);for(const[mat,n]of Object.entries(v.inputs))this.state.materials[mat]-=n;for(let i=0;i<quantity;i++)this.state.workshop.jobs.push({id:this._id('smelt'),recipeId:id,status:'queued',inputs:copy(W.smelts[id].inputs)});result=ok('Smelting batches queued.');}
  if(name==='cancelSmelt'){const j=this.state.workshop.jobs.find(j=>j.id===payload.id);if(!j)return no('That batch is already complete.');if(!this._fits(j.inputs))return no('Make room in the bins for the full refund.');for(const[id,n]of Object.entries(j.inputs))this.state.materials[id]+=n;this.state.workshop.jobs=this.state.workshop.jobs.filter(x=>x!==j);result=ok('Batch cancelled; all ingredients returned.');}
  if(name==='smeltUpgrade'){const v=this.smeltUpgradePreview(payload.id);if(!v.eligible)return no(v.reason);this.state.player.gold-=v.cost;this.state.workshop.upgrades[payload.id]=v.rank+1;result=ok(W.upgrades[payload.id].name+' developed.');}
  this._startSmelts();this._previewCache.clear();return result;
 }
 _smeltPolicy(p){
  const w=this.state.workshop;if(!w.upgrades.stockkeeper)return no('Develop Furnace stockkeeper first.');
  const next=copy(w.smeltPolicy);
  if('enabled'in p){if(typeof p.enabled!=='boolean')return no('Choose an on/off setting.');next.enabled=p.enabled;}
  if('reserve'in p){if(!int(p.reserve)||p.reserve>1000000)return no('Use a whole input reserve from 0 to 1,000,000.');next.reserve=p.reserve;}
  if('targets'in p){if(!p.targets||typeof p.targets!=='object'||Array.isArray(p.targets)||Object.entries(p.targets).some(([id,n])=>!W.smelts[id]||!this.smeltPreview(id).unlocked||!int(n)||n>1000000))return no('Choose whole targets for unlocked alloys.');Object.assign(next.targets,p.targets);}
  if('id'in p){if(!W.smelts[p.id]||!this.smeltPreview(p.id).unlocked||!int(p.target)||p.target>1000000)return no('Choose an unlocked alloy and a whole target.');next.targets[p.id]=p.target;}
  w.smeltPolicy=next;return ok('Ingot targets saved. Automatic batches preserve inputs and output space.');
 }
 _workshopPolicy({key,value}){
  if(!['rotateStock','staffShifts'].includes(key)||typeof value!=='boolean')return no('Choose a workshop policy.');
  if(key==='rotateStock'&&!this._effects().autoScrap)return no('Develop Salvage bench first.');
  if(key==='staffShifts'&&!this._effects().staffShifts)return no('Develop Workshop shift roster first.');
  this.state.workshop[key]=value;return ok(value?'Workshop policy enabled.':'Workshop policy paused.');
 }
 _pinGoal({room,id}){if(id==null){this.state.workshop.goal=null;return ok('Goal unpinned.');}const node=room==='smelter'?W.upgrades[id]:P.nodes[id];if(!node||(room!=='smelter'&&node.section!==room))return no('Choose an upgrade goal.');const ranks=room==='smelter'?this.state.workshop.upgrades:this.state.world.trees,rank=(ranks[id]||0)+1;if(rank>node.maxRank)return no('That upgrade is complete.');this.state.workshop.goal={room,id,rank};return ok('Upgrade goal pinned.');}
 upgradeGoal(room,id,targetRank=null){
  const smelt=room==='smelter',defs=smelt?W.upgrades:P.nodes,ranks=smelt?this.state.workshop.upgrades:this.state.world.trees,target=defs[id];if(!target)return null;
  const seen=new Set(),missing=[];const visit=key=>{if(seen.has(key)||ranks[key])return;seen.add(key);const n=defs[key];for(const p of smelt?(n.parent?[n.parent]:[]):n.parents)visit(p);missing.push({id:key,name:n.name,cost:n.cost});};
  if(targetRank&&(ranks[id]||0)>=targetRank)return{name:target.name,cost:0,next:null,complete:true,reason:'Goal complete.',currency:smelt?'Gold':P.currencies[room],steps:[]};
  visit(id);if(!missing.length){const v=smelt?this.smeltUpgradePreview(id):this.treePreview(id);if(v.rank<target.maxRank)missing.push({id,name:target.name,cost:v.cost});}
  const next=missing[0],cost=missing.reduce((n,r)=>n+r.cost,0),preview=next?(smelt?this.smeltUpgradePreview(next.id):this.treePreview(next.id)):null;
  return{name:target.name,cost,next,complete:!next,reason:preview?.reason||'Goal complete.',currency:smelt?'Gold':P.currencies[room],steps:missing};
 }
 upgradeImpact(room,id,recipeId='bronze_swords'){
  const smelt=room==='smelter',n=smelt?W.upgrades[id]:P.nodes[id];if(!n)return'';const e=this._effects(),d=this.derived(),effects=smelt?{quality:n.quality||0,smeltSpeed:n.speed||0}:n.effects,rows=[];
  const percent=['miningSpeed','speed','sale','budget','heroHp','heroAttack','heroSpeed','proficiencyXp','smeltSpeed'];
  const names={miningSpeed:'Extraction',speed:'Forge speed',sale:'Prices',budget:'Budgets',heroHp:'Health',heroAttack:'Damage',heroSpeed:'Attack speed',proficiencyXp:'Mastery XP',smeltSpeed:'Smelt speed'};
  for(const key of percent)if(effects[key]){let before=1+(e[key]||0),gain=effects[key];
   if(key==='smeltSpeed')before=this.smelterDerived().speed;
   if(key==='speed')before=this.data.recipes[recipeId].baseSeconds/this.craftPreview(recipeId).seconds;
   if(key==='proficiencyXp')before+=.06*this.state.player.stats.knowledge;
   if(key==='sale'){before=d.priceMultiplier;gain*=1+.045*Math.sqrt(this.state.player.stats.charisma);}
   if(key==='budget'){const charm=1+.06*Math.sqrt(this.state.player.stats.charisma);before*=charm;gain*=charm;}
   rows.push(names[key]+' ×'+before.toFixed(2)+' → ×'+(before+gain).toFixed(2));}
  for(const[key,label,before]of [['binCapacity','Bin capacity',this.binCapacity()],['workerSlots','Worker slots',d.workerCapacity],['lanes','Forge benches',d.stationCount],['capacity','Warehouse',d.storageCapacity],['display','Displays',d.displayCapacity],['queue','Waiting crafts',d.queueCapacity],['qualityCap','Quality ceiling',d.qualityCap]])if(effects[key])rows.push(label+' '+before+' → '+(key==='qualityCap'?Math.min(200,before+effects[key]):before+effects[key]));
  if(effects.quality){const q=this.craftPreview(recipeId).quality;rows.push('Example quality '+q+' → '+Math.min(d.qualityCap,q+effects.quality)+(q+effects.quality>d.qualityCap?' · ceiling limits this benefit':''));}
  if(smelt&&id==='racks')rows.push('Waiting batches '+this.smelterDerived().queue+' → '+(this.smelterDerived().queue+2));
  if(smelt&&id==='chambers')rows.push('Hearths '+this.smelterDerived().lanes+' → '+(this.smelterDerived().lanes+1));
  return rows.join(' · ');
 }
 attributePreview(stat,allocation=this.state.player.stats,profession=this.state.world.profession){
  if(!attrs.includes(stat))return null;const p=this.state.player,old=p.stats,oldProfession=this.state.world.profession;
  const snapshot=()=>{const v=this.craftPreview('bronze_swords'),d=this.derived();return{quality:v.quality,seconds:v.seconds,price:v.price,budget:this._heroBudget(null),priceBonus:(d.priceMultiplier-1)*100,capacity:d.storageCapacity,affix:this._craftAffixChance()*100,mastery:1+.06*p.stats.knowledge+(this._effects().proficiencyXp||0)};};
  try{p.stats={...allocation};this.state.world.profession=profession;const before=snapshot();p.stats[stat]++;const after=snapshot();const recipe=Object.values(this.data.recipes).filter(r=>r.variant<2&&r.requires.stat===stat&&r.requires.statValue>allocation[stat]&&this.availableClasses().includes(r.classId)).sort((a,b)=>a.requires.statValue-b.requires.statValue)[0];return{before,after,storageAt:Math.ceil(((before.capacity-18-(this._effects().capacity||0)+1)/2)**2),yieldAt:(Math.floor(Math.sqrt(allocation.strength)/4)+1)**2*16,recipe:recipe?{name:recipe.name,required:recipe.requires.statValue}:null};}finally{p.stats=old;this.state.world.profession=oldProfession;}
 }
 itemDemand(item){
  if(!item)return{kind:'missing',text:'Item no longer available.',useful:false};
  if(this._protected(item))return{kind:'protected',text:item.reservedFor?'Reserved for a customer.':'Protected item.',useful:false};
  const r=this.data.recipes[item.recipeId],price=this.state.inventory.includes(item)?this.itemPrice(item.id):this._price(r,item.quality),rows=[];
  for(const h of this.state.adventurers){if(!this.data.archetypes[h.archetypeId].preferences.includes(r.classId)||(r.slot==='offhand'&&this.data.recipes[h.equipment.weapon?.recipeId]?.twoHanded))continue;
   const q=this.data.quests[h.questId]||Object.values(this.data.quests)[0],after={...h,equipment:{...h.equipment,[r.slot]:item}};if(r.twoHanded)after.equipment.offhand=null;
   const improvement=this._gearScore(after,q)-this._gearScore(h,q),home=['browsing','ready'].includes(h.status),budget=home?h.budget:this._heroBudget(q);rows.push({h,home,budget,improvement});
  }
  if(!rows.length)return{kind:'incompatible',text:'No current customer can equip this.',useful:false};
  const useful=rows.filter(v=>v.improvement>1e-6),buyers=useful.filter(v=>v.budget>=price).sort((a,b)=>Number(b.home)-Number(a.home));
  if(buyers.length){const v=buyers[0];return{kind:v.home?'ready':'returning',text:v.h.name+': useful · '+v.budget+'g '+(v.home?'budget':'next-visit budget'),useful:true,heroId:v.h.id};}
  if(useful.length)return{kind:'expensive',text:'Useful, but costs '+price+'g · best budget '+Math.max(...useful.map(v=>v.budget))+'g.',useful:true};
  return{kind:'outclassed',text:'Already outclassed by current customer equipment.',useful:false};
 }
 _rareRecipe(r){return r.tier>=4||Object.keys(r.inputs).some(id=>['gem','ember_shard','frost_crystal','star_fragment'].includes(id)||(this.data.materials[id]?.tier||0)>=4);}
 _automation(settings){if('demandOnly'in settings&&typeof settings.demandOnly!=='boolean')return no('Choose an on/off demand policy.');const r=super._automation(settings);if(r.ok&&'demandOnly'in settings)this.state.automation.demandOnly=settings.demandOnly;return r;}
 automationStatus(){
  const s=this.state,a=s.automation,r=this.data.recipes[a.recipeId];if(!a.enabled)return'Production rules are paused.';if(!r)return'Choose a production recipe.';
  if(this._rareRecipe(r)&&!a.allowRare)return'Rare inputs protected. Enable rare-material crafting for this pattern.';
  const p=this.craftPreview(r.id),count=s.inventory.filter(i=>i.recipeId===r.id).length+s.jobs.filter(j=>j.recipeId===r.id).length;
  if(count>=a.targetStock)return'Target stock reached ('+count+' / '+a.targetStock+').';
  if(s.inventory.length+s.jobs.length>=this.derived().storageCapacity)return'Warehouse full. Sell surplus or expand storage.';
  if(s.jobs.length>=this.derived().stationCount+this.derived().queueCapacity)return'Forge queue full; waiting for a bench.';
  if(a.demandOnly&&!this.itemDemand({recipeId:r.id,quality:p.quality}).useful)return'No customer needs this pattern at its current quality.';
  const gate=p.gates.find(g=>!g.met&&g.source!=='Quarry or material shop');if(gate)return gate.label+' requirement not met.';
  const missing=Object.entries(r.inputs).filter(([id,n])=>s.materials[id]<n);
  if(missing.length){const refined=missing.filter(([id])=>this.data.materials[id].refined);if(refined.length)return'Waiting for '+refined.map(([id])=>this.data.materials[id].name).join(', ')+' · check Smelter targets.';
   if(!a.autoBuy)return'Missing supplies; automatic buying is off.';if(missing.some(([id])=>!this.materialAvailable(id)))return'Missing materials are not available to buy.';
   const cost=missing.reduce((n,[id,q])=>n+(q-s.materials[id])*this.materialPrice(id),0);if(s.player.gold-cost<a.goldReserve)return'Gold reserve protects '+a.goldReserve+'g; supplies cost '+cost+'g.';
   if(this._offline&&this._offlineSpend+cost>a.spendCap)return'Offline supply spending limit reached.';
  }
  return'Ready to produce '+r.name+'.';
 }
 _clearSurplus(){
  const a=this.state.automation;if(!a.enabled||!a.autoSell)return;const counts={};for(const i of this.state.inventory)counts[i.recipeId]=(counts[i.recipeId]||0)+1;
  for(const i of [...this.state.inventory].sort((a,b)=>a.quality-b.quality||a.createdAt-b.createdAt)){
   const r=this.data.recipes[i.recipeId];if(this._protected(i)||i.autoDisplayHold||(!a.allowRare&&this._rareRecipe(r))||this._commissionNeeds(i))continue;
   const stale=this.state.simTime-i.createdAt>=180000&&!this.itemDemand(i).useful,excess=i.recipeId===a.recipeId&&counts[i.recipeId]>a.targetStock;
   if(stale||excess){const result=this._sell({itemId:i.id});if(result.ok)counts[i.recipeId]--;}
  }
 }
 _commissionNeeds(i){const r=this.data.recipes[i.recipeId];return this.state.commissions.some(c=>c.status!=='complete'&&c.classId===r.classId&&r.tier>=c.minTier&&i.quality>=c.minQuality);}
 _runAutomation(){
  this._autoSmelt();this._clearSurplus();const a=this.state.automation,r=this.data.recipes[a.recipeId];if(!a.enabled||!r||!this.automationStatus().startsWith('Ready to produce'))return;
  if(a.autoBuy){const missing=Object.entries(r.inputs).map(([id,n])=>[id,Math.max(0,n-this.state.materials[id])]).filter(([,n])=>n),cost=missing.reduce((n,[id,q])=>n+this.materialPrice(id)*q,0);
   if(!this._fits(Object.fromEntries(missing)))return;for(const[id,quantity]of missing){if(!this._buyMaterial({materialId:id,quantity}).ok)return;}if(this._offline)this._offlineSpend+=cost;
  }
  if(this.craftPreview(r.id).eligible)this._craft({recipeId:r.id});
 }
 _smeltTargets(){
  const w=this.state.workshop,p=w.smeltPolicy,desired=Object.fromEntries(W.metals.map(id=>[id,Math.min(this.binCapacity(),p.targets[id]||0)]));
  // Higher alloys request just enough intermediate ingots for their next batch.
  for(const id of [...W.metals].reverse()){const r=W.smelts[id],pending=w.jobs.filter(j=>j.recipeId===id).length*(r.amount+this.smelterDerived().extraIngots);if(!this.smeltPreview(id).unlocked||this.state.materials[r.output]+pending>=desired[id])continue;
   for(const[mat,n]of Object.entries(r.inputs))if(mat.endsWith('_ingot')){const parent=mat.replace('_ingot','');desired[parent]=Math.max(desired[parent],Math.min(this.binCapacity(),n+p.reserve));}
  }
  return desired;
 }
 smeltPolicyStatus(){
  const w=this.state.workshop,p=w.smeltPolicy;if(!w.upgrades.stockkeeper)return'Unlock Furnace stockkeeper to maintain ingot stocks.';if(!p.enabled)return'Ingot maintenance paused.';if(!Object.values(p.targets).some(n=>n>0))return'Set an ingot target above zero.';
  const desired=this._smeltTargets(),reasons=[];for(const id of W.metals){const r=W.smelts[id],pending=w.jobs.filter(j=>j.recipeId===id).length*(r.amount+this.smelterDerived().extraIngots);if(this.state.materials[r.output]+pending>=desired[id])continue;
   if(!this.smeltPreview(id).unlocked){reasons.push('Unlock '+r.name);continue;}const amount=r.amount+this.smelterDerived().extraIngots;if(this.state.materials[r.output]+pending+amount>this.binCapacity()){reasons.push(r.name+': waiting for '+amount+' free bin spaces');continue;}
   const shortages=Object.entries(r.inputs).filter(([mat,n])=>this.state.materials[mat]<n+p.reserve);reasons.push(shortages.length?r.name+': waiting for '+shortages.map(([mat])=>this.data.materials[mat].name).join(', ')+' above reserve '+p.reserve:'Maintaining '+r.name);
  }return reasons.join(' · ')||(w.jobs.length?'Batches queued to reach targets.':'Ingot targets reached.');
 }
 _autoSmelt(){
  const w=this.state.workshop,p=w?.smeltPolicy;if(!w?.upgrades.stockkeeper||!p?.enabled)return;const desired=this._smeltTargets(),d=this.smelterDerived();
  for(const id of W.metals){const r=W.smelts[id],amount=r.amount+d.extraIngots,pending=w.jobs.filter(j=>j.recipeId===id).length*amount,stock=this.state.materials[r.output];if(stock+pending>=desired[id]||stock+pending+amount>this.binCapacity()||Object.entries(r.inputs).some(([mat,n])=>this.state.materials[mat]<n+p.reserve))continue;
   if(this.smeltPreview(id).eligible)this.act('smelt',{id});
  }
 }
 _restockShelves(){
  const w=this.state.workshop;if(w?.rotateStock&&this._effects().autoScrap){const useful=this.state.inventory.some(i=>!i.displayed&&!i.autoDisplayHold&&!this._protected(i)&&this.itemDemand(i).useful);if(useful)for(const i of this.state.inventory)if(i.displayed&&!this._protected(i)&&!this._commissionNeeds(i)&&this.state.simTime-i.createdAt>=180000&&!this.itemDemand(i).useful){i.displayed=false;i.rotationHold=true;}}
  // Rotation holds are separate from the player's manual holds and recover when demand changes.
  const held=[];for(const i of this.state.inventory)if(i.rotationHold){if(this.itemDemand(i).useful||!w?.rotateStock)delete i.rotationHold;else if(!i.autoDisplayHold){i.autoDisplayHold=true;held.push(i);}}
  super._restockShelves();for(const i of held)i.autoDisplayHold=false;
 }
 _staffClock(){super._staffClock();if(!this.state.workshop?.staffShifts||!this._effects().staffShifts)return;for(const s of Object.values(this.state.staff)){if(s.active&&s.stamina<=35){s.active=false;s.autoRest=true;}else if(s.autoRest&&s.stamina>=90){s.active=true;s.autoRest=false;}}}
 _toggleStaff(p){const r=super._toggleStaff(p);if(r.ok)this.state.staff[p.staffId].autoRest=false;return r;}
 advanceOffline(now){const result=super.advanceOffline(now);if(result.report){result.report.stopReason=this.state.automation.enabled?this.automationStatus():this.quarryDerived().pausedReason||'';result.report.smelter=this.smeltPolicyStatus();}return result;}
 _startSmelts(){if(!this.state.workshop||!this.state.started)return;const d=this.smelterDerived();let active=this.state.workshop.jobs.filter(j=>j.status==='active').length;for(const j of this.state.workshop.jobs)if(j.status==='queued'&&active<d.lanes){j.status='active';j.startedAt=this.state.simTime;j.duration=Math.ceil(W.smelts[j.recipeId].seconds*1000/d.speed);j.completeAt=j.startedAt+j.duration;active++;}}
 _extraEventTimes(){this._startSmelts();return(this.state.workshop?.jobs||[]).filter(j=>j.status==='active').map(j=>j.completeAt);}
 _processExtraEvents(){if(!this.state.workshop)return;for(const j of [...this.state.workshop.jobs])if(j.status==='active'&&j.completeAt<=this.state.simTime){const r=W.smelts[j.recipeId],amount=r.amount+this.smelterDerived().extraIngots;this._deliver({materials:{[r.output]:amount},source:r.name});this.state.workshop.smelted+=amount;this.state.workshop.jobs=this.state.workshop.jobs.filter(x=>x!==j);this._log('Smelted '+amount+' '+this.data.materials[r.output].name+'.','craft');}this._startSmelts();}
}
function thisEnchantment(data,job){return data.enchantments[job.enchantmentId];}
return Workshop;
});
