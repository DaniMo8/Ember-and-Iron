'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../engine.js');
const data = require('../data.js');
const Flow = require('../flow.js');
const make = () => {
  const e = new Engine(data);
  assert(e.act('create', { name: 'Flow tests', stats: { strength: 4, precision: 4, charisma: 4, knowledge: 4 } }).ok);
  return e;
};
const item = (e, recipeId = 'bronze_swords', extras = {}) => {
  const i = { id: 'flow-' + e.state.nextId++, recipeId, quality: 34, displayed: true, protected: false, reservedFor: null, makerGeneration: 1, ...extras };
  e.state.inventory.push(i); return i;
};

test('fresh guidance honors a valid selected recipe and both selectors are read-only', () => {
  const e = make(), before = e.exportSave();
  const next = Flow.next(e, data, { recipeId: 'bronze_axes' });
  assert.equal(next.action, 'recipe'); assert.equal(next.id, 'bronze_axes');
  assert.match(next.detail, /Bronze Hatchet/);
  assert.equal(Flow.milestone(e, data, { recipeId: 'bronze_axes' }).progress, 0);
  assert.equal(e.exportSave(), before);
  assert.notEqual(Flow.next(e, data, { recipeId: 'iron_swords' }).id, 'iron_swords');
});

test('fuel and bronze shortages lead to free gathering, not automatic purchases or another recipe', () => {
  const e = make(); e.state.materials.fuel = 0;
  let next = Flow.next(e, data, { recipeId: 'bronze_swords' });
  assert.equal(next.action, 'nav'); assert.equal(next.id, 'quarry'); assert.match(next.title, /Fuel/);
  assert(e.act('mine', { materialId: 'bronze' }).ok);
  next = Flow.next(e, data, { recipeId: 'bronze_swords' });
  assert.match(next.detail, /5s/); assert.equal(next.progress, 0);
  assert.equal(e.state.player.gold, 18);
});

test('fittings purchases show actual deficits while a penniless empty forge gets valid rescue guidance', () => {
  const e = make(); e.state.materials.leather = 0;
  assert.equal(Flow.next(e, data, { recipeId: 'bronze_swords' }).action, 'market');
  e.state.materials.wood = 0; e.state.player.gold = 0;
  const next = Flow.next(e, data, { recipeId: 'bronze_swords' });
  assert.equal(next.action, 'reclaim'); assert(e.act(next.action).ok);
});

test('storage pressure does not direct players to gather into a full warehouse or sell keepsakes', () => {
  const e = make(); Object.keys(e.state.materials).forEach(id => e.state.materials[id] = 0);
  e.state.materials.bronze = e.derived().materialCapacity;
  assert.equal(Flow.next(e, data, { recipeId: 'bronze_swords' }).action, 'market');
  e.state.materials.bronze = 0; e.state.materials.ember_shard = e.derived().materialCapacity;
  const next = Flow.next(e, data, { recipeId: 'bronze_swords' });
  assert.equal(next.action, 'nav'); assert.equal(next.id, 'upgrades');
  for (let n = 0; n < e.derived().storageCapacity; n++) item(e, 'bronze_swords', { displayed: false });
  assert.equal(Flow.next(e, data).action, 'fill-shelves');
  e.state.inventory.forEach(i => i.protected = true);
  assert.equal(Flow.next(e, data).id, 'inventory');
  assert(e.state.inventory.every(i => i.protected));
});

test('working forge offers one real temper action then timer guidance without duplicating the craft', () => {
  const e = make(); assert(e.act('craft', { recipeId: 'bronze_swords' }).ok);
  let next = Flow.next(e, data, { recipeId: 'bronze_swords' });
  assert.equal(next.action, 'technique'); assert.equal(next.id, e.state.jobs[0].id);
  assert(e.act('technique', { jobId: next.id }).ok); e.tick(5000);
  next = Flow.next(e, data, { recipeId: 'bronze_swords' });
  assert.equal(next.action, 'nav'); assert(next.progress > 0 && next.progress < 100);
  assert.equal(e.state.jobs.length, 1);
  e.state.player.points = 3;
  assert.equal(Flow.next(e, data).action, 'attributes');
});

test('stored stock, a matching customer, and the first departure each have a different next step', () => {
  const e = make(), stock = item(e, 'bronze_swords', { displayed: false });
  assert.equal(Flow.next(e, data).action, 'fill-shelves');
  assert(e.act('display', { itemId: stock.id }).ok);
  assert.match(Flow.next(e, data).title, /shelves are ready/);
  e.tick(60000);
  assert.equal(e.state.stats.sold, 1);
  assert.equal(Flow.next(e, data, { recipeId: 'bronze_swords' }).action, 'battle');
});

test('the next tier uses exact proficiency, stat and station gates and respects discovery OR', () => {
  const e = make(); e.state.stats.crafted = 5; e.state.stats.sold = 3; e.state.stats.questsWon = 1;
  e.state.questWins.quarry_road = 1; // Discovery met through the quest, despite smith level one.
  e.state.player.stats.strength = 5;
  item(e, 'bronze_swords', { protected: true });
  e.state.adventurers.forEach(h => h.status = 'idle');
  const first = Flow.milestone(e, data, { recipeId: 'bronze_swords' });
  assert.equal(first.text, 'Growing your swordcraft · Practice 0/15');
  assert.equal(first.progress, 0);
  e.state.player.proficiency.swords.level = 14;
  const second = Flow.milestone(e, data, { recipeId: 'bronze_swords' });
  assert(second.progress > first.progress); assert.match(second.text, /14\/15/);
  assert.equal(second.progress, 93);
  e.state.player.proficiency.swords.level = 15; e.state.upgrades.heavy_forge = 1;
  const third = Flow.milestone(e, data, { recipeId: 'bronze_swords' });
  assert.match(third.text, /30/); // Iron is now usable; the next real target is steel.
  assert(!third.text.includes(data.recipes.steel_swords.name));
});

test('mastered tiers point to mastery or genuine commissions, with no unrelated collection progress', () => {
  const e = make(); e.state.stats.crafted = 200; e.state.stats.sold = 100; e.state.stats.questsWon = 20;
  e.state.player.stats.strength = 20; e.state.player.proficiency.swords.level = 75;
  e.state.upgrades.heavy_forge = 4; e.state.questWins.void_sovereign = 1;
  e.state.questWins.ember_shrine = 1; e.state.questWins.frost_citadel = 1; e.state.player.level = 20;
  const mastery = Flow.milestone(e, data, { recipeId: 'starforged_swords' });
  assert.equal(mastery.progress, 75); assert.match(mastery.text, /Mastery 75\/100/);
  e.state.commissions.push({ id: 'example-order', classId: 'axes', minTier: 3, minQuality: 85, status: 'accepted' });
  e.state.player.legacy.collection.starforged_swords = 100;
  assert.equal(Flow.milestone(e, data, { recipeId: 'starforged_swords' }).progress, 0);
  item(e, 'steel_axes', { quality: 85 });
  assert.equal(Flow.milestone(e, data, { recipeId: 'starforged_swords' }).progress, 100);
});

test('full materials and waiting parties point to gift space after points and finished-storage priorities', () => {
  const e = make();
  e.state.materials.bronze += e.derived().materialCapacity - Object.values(e.state.materials).reduce((n, amount) => n + amount, 0);
  e.state.runs = ['one', 'two', 'three'].map(id => ({ id, status: 'pending', rewardApplied: false, reward: { materials: { iron: 3 } } }));
  e.state.mailbox = Array.from({ length: 25 }, (_, n) => ({ id: 'waiting-' + n, gold: 1, materials: { wood: 2 }, recipes: [] }));
  const before = e.exportSave();
  let next = Flow.next(e, data, { recipeId: 'bronze_swords' });
  assert.equal(next.title, 'Make room for returning gifts'); assert.equal(next.action, 'recipe');
  assert.match(next.detail, /2 more material spaces/); assert.equal(next.id, 'bronze_swords');
  assert.equal(e.exportSave(), before);
  e.state.player.points = 3;
  assert.equal(Flow.next(e, data).action, 'attributes');
  e.state.player.points = 0;
  e.state.materials.fuel = 0; e.state.materials.bronze += 6;
  next = Flow.next(e, data, { recipeId: 'bronze_swords' });
  assert.equal(next.title, 'Make room for returning gifts'); assert.equal(next.action, 'market');
  for (let n = 0; n < e.derived().storageCapacity; n++) item(e, 'bronze_swords', { displayed: false });
  assert.equal(Flow.next(e, data).action, 'fill-shelves');
});

test('gift guidance clears when the next bundle has room and never watches a pending battle', () => {
  const e = make();
  e.state.runs = [{ id: 'waiting-party', status: 'pending', rewardApplied: false, reward: { materials: { wood: 2 } } }];
  e.state.stats.sold = 1;
  const next = Flow.next(e, data, { recipeId: 'bronze_swords' });
  assert.notEqual(next.title, 'Make room for returning gifts');
  assert.notEqual(next.action, 'battle');
});
