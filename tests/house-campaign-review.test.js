/* Independent review fixtures. These intentionally grant state to verify
 * invariants; they are NOT earned campaign or affordability evidence. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../house-engine'),D=require('../data');
const copy=x=>JSON.parse(JSON.stringify(x)),hour=3600000;
function fresh(){const e=new E(copy(D));assert(e.command('create',{profession:'weaponsmith',stats:{strength:5,precision:5,charisma:5,knowledge:5}}).ok);return e;}
function valid(e){const v=E.validateSave(e.exportSave(),e.data);assert(v.ok,v.message);}
test('earned opening: spending all starting gold on wood still leaves a public-command route to contract income',()=>{
 const e=fresh(),s=e.state;const spent=e.command('buyMaterial',{materialId:'wood',quantity:s.player.gold/e.materialPrice('wood')});assert(spent.ok,spent.message);assert.equal(s.player.gold,0);
 assert(e.command('smelt',{id:'bronze'}).ok);e.tick(60000);
 const order=s.house.orders[0];const made=e.command('craft',{recipeId:order.recipeId,intent:'catalogue',quantity:order.quantity});assert(made.ok,made.message);e.tick(6*60000);
 const delivered=e.command('deliverContract',{id:order.id});assert(delivered.ok,delivered.message);assert(s.player.gold>0);valid(e);
});
test('campaign fixture: an absence is credited up to24h cumulatively, not once per tick call',()=>{
 const e=fresh();e.tick(23*hour,{offline:true});e.tick(3*hour,{offline:true});assert.equal(e.state.simTime,24*hour);e.tick(hour,{offline:true});assert.equal(e.state.simTime,24*hour);valid(e);
});
test('campaign fixture: completing all other Crown requirements does not allow early first retirement',()=>{
 const e=fresh(),s=e.state;s.house.champions=5;s.stats.crafted=300;s.house.contracts=100;s.house.campaign.tierCrafts=[50,50,50,50,50];s.house.campaign.tierContracts=[20,20,20,20,20];
 s.simTime=71*hour;assert.equal(e.derived().legacyEligible,false);const before=e.exportSave();assert.equal(e.command('retire',{}).ok,false);assert.equal(e.exportSave(),before);
 s.simTime=72*hour;assert.equal(e.derived().legacyEligible,true);
});
test('campaign fixture: research consumes premium input credits with the actual ingots',()=>{
 const e=fresh(),s=e.state;s.player.gold=10000;s.house.campaign.discoveries.push('palimpsest');s.materials.steel_ingot=8;s.house.graded.steel={spring:8};
 const r=e.command('research',{id:'thermal'});assert(r.ok,r.message);assert.equal(s.materials.steel_ingot,0);assert.equal(s.house.graded.steel?.spring||0,0);valid(e);
});
test('campaign fixture: contract refresh offers capable higher-tier work after old orders are delivered',()=>{
 const e=fresh(),s=e.state;s.house.champions=1;s.house.upgrades={patterns:1,patterns_2:1,mine_iron:1};s.workshop.upgrades.iron=1;s.player.stats={strength:30,precision:30,charisma:10,knowledge:30};s.player.level=10;
 for(const p of Object.values(s.player.proficiency))p.level=30;
 let offeredHigher=0;
 for(let k=0;k<10;k++){
  const order=s.house.orders[0];for(let n=0;n<order.quantity;n++)s.inventory.push({id:'fixture-'+k+'-'+n,recipeId:order.recipeId,quality:100,protected:false,reservedFor:null,displayed:false,createdAt:s.simTime});
  const r=e.command('deliverContract',{id:order.id});assert(r.ok,r.message);if(s.house.orders.some(o=>o.tier>1))offeredHigher++;
 }
 assert(offeredHigher>0,'Every replacement remained bronze despite demonstrated iron capability.');
});
test('campaign fixture: equivalent whole-absence and small-step simulation discover methods at the same useful time',()=>{
 function setup(){const e=fresh(),s=e.state;s.simTime=7*hour;s.player.gold=2000;s.workshop.smelted=110;s.house.upgrades={catalogue:1,clerk:1};s.house.autoDeliver=true;s.house.catalogue={enabled:true,recipeId:'bronze_swords',reserve:0,autoBuy:true,rotate:true};s.workshop.upgrades.stockkeeper=1;s.workshop.smeltPolicy={enabled:true,targets:{bronze:14},reserve:0};s.world.miners.push({id:'miner-2',assigned:'fuel',working:'fuel',progress:0},{id:'miner-3',assigned:'tin',working:'tin',progress:0});for(const id of ['bronze','tin','fuel','bronze_ingot','leather','wood'])s.materials[id]=14;return e;}
 const whole=setup(),chunks=setup();whole.tick(2*hour,{offline:true});for(let n=0;n<120;n++)chunks.tick(60000,{offline:true});
 const view=e=>({gold:e.state.player.gold,materials:e.state.materials,crafted:e.state.stats.crafted,contracts:e.state.house.contracts,discoveries:e.state.house.campaign.discoveries,mastery:e.state.player.proficiency});
 assert.deepEqual(view(whole),view(chunks));valid(whole);valid(chunks);
});
test('earned-stall regression: rotating work skips starforged orders when their ore path is locked',()=>{
 // Minimal reproduction of earned generation2 at113.744h:4919/6000mined,
 // unlocked star patterns/crucible, locked star gallery and a bronze safety order.
 const e=fresh(),s=e.state;s.player.gold=49792;s.player.level=23;s.player.stats={strength:34,precision:39,charisma:12,knowledge:45};s.player.proficiency.talismans.level=78;s.world.totalMined=4919;s.house.champions=4;
 Object.assign(s.house.upgrades,{patterns:1,patterns_2:1,patterns_3:1,patterns_4:1,patterns_5:1,mine_iron:1,mine_gems:1,mine_mithril:1,catalogue:1,clerk:1});
 Object.assign(s.workshop.upgrades,{iron:1,steel:1,mithril:1,starforged:1,stockkeeper:1});
 s.house.orders=[{id:'star-a',classId:'talismans',tier:5,quality:55,quantity:3,payment:2167,client:'Training yard',recipeId:'starforged_talismans'},{id:'star-b',classId:'talismans',tier:5,quality:55,quantity:3,payment:2167,client:'Caravan guild',recipeId:'starforged_talismans'},{id:'bronze-safe',classId:'talismans',tier:1,quality:10,quantity:2,payment:52,client:'The town watch',recipeId:'bronze_talismans'}];
 Object.assign(s.materials,{bronze:14,tin:14,fuel:14,bronze_ingot:10,wood:4,leather:4});
 assert(e.command('housePolicy',{catalogue:{enabled:true,recipeId:'starforged_talismans',reserve:0,autoBuy:true,rotate:true},autoDeliver:true,offlineBudget:1000}).ok);
 e.tick(20000,{offline:true});
 assert.equal(s.house.catalogue.recipeId,'bronze_talismans');assert(s.jobs.some(j=>j.recipeId==='bronze_talismans')||s.stats.crafted>0,'Useful bronze work must proceed while the star gallery is locked.');valid(e);
});
