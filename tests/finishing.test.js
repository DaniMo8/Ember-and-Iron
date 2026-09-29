'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const World=require('../world-engine'),D=require('../data');
const copy=x=>JSON.parse(JSON.stringify(x));
function make(){const e=new World(copy(D));assert(e.command('create',{stats:{strength:7,precision:7,charisma:7,knowledge:7}}).ok);return e;}
function craft(e,quantity=1){assert(e.command('craft',{recipeId:'bronze_swords',quantity}).ok);return e.state.jobs[0];}

test('late finishing adds the full original duration, quality and additive prefix chance exactly once',()=>{
 const e=make(),j=craft(e),duration=j.duration,quality=j.quality,chance=j.affixChance,seed=j.affixSeed;
 e.tick(duration-1);
 const preview=e.techniquePreview(j.id),before=JSON.stringify(e.state),inputs=copy(e.state.materials);
 assert.equal(preview.addedSeconds,duration/1000);assert.equal(JSON.stringify(e.state),before);
 assert(e.command('technique',{jobId:j.id}).ok);
 assert.equal(j.duration,duration*2);assert.equal(j.completeAt,j.startedAt+duration*2);
 assert.equal(j.quality,quality+20);assert.equal(j.affixChance,chance+.10);assert.equal(j.affixSeed,seed);
 assert.deepEqual(e.state.materials,inputs);assert(!e.command('technique',{jobId:j.id}).ok);
 e.tick(duration);assert.equal(e.state.stats.crafted,0);
 e.tick(1);assert.equal(e.state.stats.crafted,1);assert.equal(e.state.player.legacy.collection[j.recipeId],quality+20);
 assert(!e.command('technique',{jobId:j.id}).ok);
});

test('queued finishing survives reload, captures current bonuses at start and applies only once',()=>{
 let e=make();const first=craft(e,2),queued=e.state.jobs[1],id=queued.id;
 assert.equal(queued.status,'queued');assert(e.command('technique',{jobId:id}).ok);
 assert.equal(queued.duration,0);assert.equal(queued.quality,0);assert(!e.command('technique',{jobId:id}).ok);
 assert(World.validateSave(e.exportSave(),e.data).ok);e=new World(copy(D),e.exportSave());
 e.state.player.stats.strength=22;e.state.player.stats.precision=16;
 assert(e.command('cancel',{jobId:first.id}).ok);
 const j=e.state.jobs.find(j=>j.id===id),normal=e.craftPreview(j.recipeId);
 assert.equal(j.status,'active');assert.equal(j.duration,Math.ceil(normal.seconds*1000)*2);
 assert.equal(j.quality,Math.min(e.derived().qualityCap,normal.quality+20));assert.equal(j.affixChance,e._craftAffixChance()+.10);
 const state=copy(j);e._startJobs();assert.deepEqual(j,state);
 const reloaded=new World(copy(D),e.exportSave());assert.deepEqual(reloaded.state.jobs[0],j);
});

test('finishing respects quality ceilings while adding prefix chance beyond the normal chance cap',()=>{
 const e=make();e.state.player.stats.precision=150;e.state.player.stats.knowledge=150;
 const capped=craft(e);assert.equal(capped.quality,100);assert.equal(e.techniquePreview(capped.id).qualityGain,0);
 assert(e.command('technique',{jobId:capped.id}).ok);assert.equal(capped.quality,100);assert.equal(capped.affixChance,.65);
 assert(e.command('cancel',{jobId:capped.id}).ok);
 for(let i=0;i<=3;i++)e.state.world.trees['forge_mastery_'+i]=1;
 const breakthrough=craft(e);breakthrough.quality=108;
 assert.equal(e.derived().qualityCap,115);assert.equal(e.techniquePreview(breakthrough.id).qualityGain,7);
 assert(e.command('technique',{jobId:breakthrough.id}).ok);assert.equal(breakthrough.quality,115);
});

test('a seeded craft gains an actual prefix with finishing, with identical online and offline completion',()=>{
 const plain=make();plain.state.nextNpcAt=1e9;const p=craft(plain);p.affixSeed=3000; // First roll ≈0.186: between the natural 14% and finished 24% chances.
 const finished=new World(copy(D),plain.exportSave());assert(finished.command('technique',{jobId:p.id}).ok);
 const offline=new World(copy(D),finished.exportSave()),until=finished.state.jobs[0].completeAt;
 plain.tick(p.duration);finished.tick(until);offline.tick(until,{offline:true});
 assert.equal(plain.state.inventory[0].affixId,null);assert(finished.state.inventory[0].affixId);
 assert.equal(finished.state.inventory[0].affixId,offline.state.inventory[0].affixId);
 assert.equal(finished.state.inventory[0].quality,offline.state.inventory[0].quality);
 assert.equal(finished.state.stats.crafted,1);assert.equal(offline.state.stats.crafted,1);
});

test('finishing costs no extra materials and cancellation still refunds active and queued escrow exactly',()=>{
 const e=make(),before=copy(e.state.materials);craft(e,2);
 for(const j of e.state.jobs)assert(e.command('technique',{jobId:j.id}).ok);
 for(const j of [...e.state.jobs].reverse())assert(e.command('cancel',{jobId:j.id}).ok);
 assert.deepEqual(e.state.materials,before);assert.equal(e.state.jobs.length,0);assert.equal(e.state.stats.crafted,0);
});

test('older active orders with a finish already applied retain their saved time and bonus',()=>{
 const e=make(),j=craft(e);j.technique=true;j.quality+=5;
 const before=copy(j),loaded=new World(copy(D),e.exportSave());loaded._startJobs();
 assert.deepEqual(loaded.state.jobs[0],before);assert(!loaded.command('technique',{jobId:j.id}).ok);
});
