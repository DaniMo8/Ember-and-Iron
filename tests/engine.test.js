'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const Engine = require('../engine.js');
const data = require('../data.js');
const make = (stats = { strength: 4, precision: 4, charisma: 4, knowledge: 4 }) => {
  const e = new Engine(data);
  assert.equal(e.act('create', { name: 'Test Forge', stats }).ok, true);
  return e;
};
const seedItem = (e, recipeId, quality = 50, extra = {}) => {
  const item = { id: e._id('test-item'), recipeId, quality, affixId: null, enchantmentId: null,
    makerGeneration: e.state.player.legacy.generation, createdAt: e.state.simTime, protected: false,
    reservedFor: null, displayed: true, ...extra };
  e.state.inventory.push(item); return item;
};
const advanceCraft = e => e.tick(Math.max(...e.state.jobs.filter(j => j.status === 'active').map(j => j.completeAt)) - e.state.simTime);

test('all legal creation builds support all starter recipe gates; stats change real outcomes', () => {
  let count = 0;
  for (let s = 2; s <= 6; s++) for (let p = 2; p <= 6; p++) for (let c = 2; c <= 6; c++) {
    const k = 16 - s - p - c; if (k < 2 || k > 6) continue;
    const e = make({ strength: s, precision: p, charisma: c, knowledge: k }); count++;
    for (const recipe of Object.values(data.recipes).filter(r => r.tier === 1)) {
      const preview = e.craftPreview(recipe.id);
      assert(preview.gates.filter(g => !Object.values(data.materials).some(m => m.name === g.label)).every(g => g.met));
    }
  }
  assert(count > 50);
  const strong = make({ strength: 6, precision: 4, charisma: 2, knowledge: 4 });
  const precise = make({ strength: 2, precision: 6, charisma: 4, knowledge: 4 });
  assert(strong.craftPreview('bronze_swords').seconds < precise.craftPreview('bronze_swords').seconds);
  assert(precise.craftPreview('bronze_swords').quality > strong.craftPreview('bronze_swords').quality);
  const invalid = new Engine(data); assert.equal(invalid.act('create', { stats: { strength: 6, precision: 6, charisma: 6, knowledge: 6 } }).ok, false);
});

test('queue escrows exactly once; technique once; cancel refunds; output awards only once', () => {
  const e = make(), before = { ...e.state.materials };
  assert(e.act('craft', { recipeId: 'bronze_swords', quantity: 2 }).ok);
  assert.equal(e.state.materials.bronze, before.bronze - 4);
  const active = e.state.jobs.find(j => j.status === 'active'), queued = e.state.jobs.find(j => j.status === 'queued');
  const q = active.quality;
  assert(e.act('technique', { jobId: active.id }).ok); assert.equal(active.quality, q + 20);
  assert.equal(e.act('technique', { jobId: active.id }).ok, false);
  assert(e.act('cancel', { jobId: queued.id }).ok); assert.equal(e.state.materials.bronze, before.bronze - 2);
  advanceCraft(e); assert.equal(e.state.inventory.length, 1); assert.equal(e.state.stats.crafted, 1);
  const xp = e.state.player.xp; e.tick(1); assert.equal(e.state.player.xp, xp);
  assert.equal(e.state.jobs.length, 0); assert.equal(e.state.inventory[0].quality, q + 20);
});

test('queue capacity, storage reservation and parallel lanes prevent overproduction', () => {
  const e = make(); Object.keys(e.state.materials).forEach(id => e.state.materials[id] = 100);
  assert(e.act('craft', { recipeId: 'bronze_swords', quantity: 4 }).ok);
  assert.equal(e.act('craft', { recipeId: 'bronze_swords' }).ok, false);
  e.state.inventory = Array.from({ length: e.derived().storageCapacity - 1 }, (_, n) => ({ id: 'existing-' + n }));
  advanceCraft(e); assert.equal(e.state.inventory.length, e.derived().storageCapacity);
  assert(e.state.jobs.every(j => j.status === 'queued'));
  const f = make(); f.state.upgrades.parallel_stations = 2; f.state.materials.bronze = 20;
  assert(f.act('craft', { recipeId: 'bronze_daggers', quantity: 3 }).ok);
  assert.equal(f.state.jobs.filter(j => j.status === 'active').length, 3);
  assert.equal(new Set(f.state.jobs.map(j => j.stationId)).size, 3);
});

test('quarry uses free elapsed-time production, worker yield and exact manual cooldown', () => {
  const e = make(), bronze = e.state.materials.bronze;
  assert(e.act('mine', { materialId: 'fuel' }).ok); assert.equal(e.act('mine', {}).ok, false);
  e.tick(5000); assert(e.act('mine', {}).ok);
  assert(e.act('hireQuarryWorker', { workerId: 'miner' }).ok); assert.equal(e.state.player.gold, 6);
  e.tick(40000); assert.equal(e.state.materials.bronze, bronze + 3);
  const f = make(); f.tick(45000, { offline: true }); assert.equal(f.state.materials.bronze, 7);
  assert.equal(f.state.adventurers.length, 3); // Browsing continues offline without an assistant.
});

test('advanced quarry and supplier unlocks preserve AND gates around alternate routes', () => {
  const e = make(); e.state.player.gold = 1000;
  assert.equal(e.act('buyMaterial', { materialId: 'steel', quantity: 1 }).ok, false);
  e.state.player.level = 3; e.state.quarry.upgrades.depth = 2; e.state.questWins.ember_shrine = 1;
  assert.equal(e.act('quarryDeposit', { materialId: 'steel' }).ok, false);
  e.state.quarry.upgrades.smelter = 1; assert(e.act('quarryDeposit', { materialId: 'steel' }).ok);
  e.state.unlocks.routes.fallen_observatory = 'recover_starforge';
  assert.equal(e.act('quarryDeposit', { materialId: 'starforged' }).ok, false);
  e.state.quarry.upgrades.depth = 5; assert(e.act('quarryDeposit', { materialId: 'starforged' }).ok);
});

test('seeded battle results agree after reload and quality changes actual combat', () => {
  const e = make(), hero = e.state.adventurers[0];
  hero.equipment.weapon = { recipeId: 'bronze_swords', quality: 20, makerGeneration: 1 };
  const weak = e._simulate(data.quests.rat_nest, [hero], 12345);
  hero.equipment.weapon.quality = 85;
  const strong = e._simulate(data.quests.rat_nest, [hero], 12345);
  assert(strong.events[0].damage > weak.events[0].damage);
  const snapshot = JSON.stringify(hero);
  assert.deepEqual(e._simulate(data.quests.rat_nest, [hero], 12345), strong);
  assert.equal(JSON.stringify(hero), snapshot);
  hero.equipment.weapon = null;
  assert(e.act('dispatch', { questId: 'rat_nest', heroIds: [hero.id] }).ok);
  const reloaded = new Engine(data, e.state);
  assert.deepEqual(reloaded.state.runs[0].result, e.state.runs[0].result);
  assert.equal(e.battleView(e.state.runs[0].id).events.length, 0);
});

test('guild ranks permit parties and finale actually requires three heroes', () => {
  const e = make(); e._arrive(true); const ids = e.state.adventurers.slice(0, 3).map(h => h.id);
  assert.equal(e.questPreview('rat_nest', ids).eligible, false);
  e.state.upgrades.guild_hall = 2; assert.equal(e.derived().partySize, 3);
  assert.equal(e.questPreview('rat_nest', ids).eligible, true);
  e.state.questWins.fallen_observatory = 1;
  assert.equal(e.questPreview('void_sovereign', ids.slice(0, 2)).eligible, false);
  assert.equal(e.questPreview('void_sovereign', ids).eligible, true);
});

test('failed adventurer recovers with same identity, quest, history and equipment', () => {
  const e = make(), hero = e.state.adventurers[0], quest = structuredClone(data.quests.rat_nest);
  quest.enemies[0].attack = 500; e.data = { ...data, quests: { ...data.quests, rat_nest: quest } };
  assert(e.act('dispatch', { questId: 'rat_nest', heroIds: [hero.id] }).ok);
  e.tick(60000); assert.equal(hero.status, 'recovering'); assert.equal(hero.failures, 1);
  const rest = hero.recoverUntil - e.state.simTime;
  e.tick(rest); assert.equal(hero.status, 'browsing'); assert.equal(hero.questId, 'rat_nest');
  assert.equal(hero.memories[0].victory, false); assert.equal(hero.id, e.state.adventurers[0].id);
});

test('save validation rejects malformed state without changing current save', () => {
  const e = make(), before = e.exportSave();
  assert.equal(e.importSave('{broken').ok, false); assert.equal(e.exportSave(), before);
  const changed = JSON.parse(before); changed.state.player.gold = -100;
  assert.equal(e.importSave(JSON.stringify(changed)).ok, false); assert.equal(e.exportSave(), before);
  const duplicate = JSON.parse(before); duplicate.state.inventory = [
    { id: 'same', recipeId: 'bronze_swords', quality: 20 }, { id: 'same', recipeId: 'bronze_swords', quality: 20 } ];
  assert.equal(e.importSave(JSON.stringify(duplicate)).ok, false);
  assert.equal(new Engine(data, e.state).state.player.gold, 18);
});

test('offline cap consumes discarded wall time; no repeated craft or return rewards', () => {
  const e = make(); e.state.lastWallTime = 1000;
  assert(e.act('craft', { recipeId: 'bronze_swords' }).ok);
  const report = e.advanceOffline(1000 + 12 * 3600000).report;
  assert.equal(report.credited, 8 * 3600000); assert(report.capped);
  assert.equal(e.state.stats.crafted, 1);
  const gold = e.state.player.gold, bronze = e.state.materials.bronze;
  assert.equal(e.advanceOffline(1000 + 12 * 3600000).report.credited, 0);
  assert.equal(e.state.player.gold, gold); assert.equal(e.state.materials.bronze, bronze);
});

test('equivalent time chunks produce identical scheduled production and seeded events', () => {
  const a = make(), b = new Engine(data, a.state);
  for (const e of [a, b]) assert(e.act('craft', { recipeId: 'bronze_daggers', quantity: 3 }).ok);
  a.tick(180000); for (let i = 0; i < 180; i++) b.tick(1000);
  assert.deepEqual(b.state, a.state);
});

test('enchantments respect slots and add authored flat values with captured knowledge scaling', () => {
  const e = make(); e.state.player.level = 5; e.state.player.gold = 100; e.state.upgrades.enchanting_table = 1;
  e.state.materials.gem = 2; e.state.materials.ember_shard = 1;
  const sword = seedItem(e, 'bronze_swords'), armor = seedItem(e, 'bronze_armor');
  assert.equal(e.act('enchant', { itemId: armor.id, enchantmentId: 'flame' }).ok, false);
  const before = e._itemCombat(sword).attack, strength = e.derived().enchantStrength;
  assert(e.act('enchant', { itemId: sword.id, enchantmentId: 'flame' }).ok);
  assert(Math.abs(e._itemCombat(sword).attack - before - 2 * strength) < .0001);
});

test('legacy reset keeps exactly promised records and enforces sequential talents', () => {
  const e = make(); e.state.player.level = 8; e.state.stats.questsWon = 6;
  e.state.player.legacy.collection.bronze_swords = 90; e.state.stats.masterworks = ['bronze_swords'];
  e.state.decorations = ['hearth_banner']; e.state.upgrades.heavy_forge = 2;
  e.state.quarry.workers.miner = 2; e.state.staff.apprentice = { active: true, level: 2, xp: 3, hired: true };
  const heirloom = seedItem(e, 'iron_swords', 90);
  assert.equal(e.act('retire', { heirloomItemId: heirloom.id }).ok, false);
  assert(e.act('retire', { heirloomItemId: heirloom.id, confirmed: true }).ok);
  assert.equal(e.state.player.legacy.generation, 2); assert.equal(e.state.started, false);
  assert.equal(e.state.inventory.length, 1); assert(e.state.inventory[0].protected);
  assert.deepEqual(e.state.player.legacy.unlockedRecipes, ['iron_swords']);
  assert.deepEqual(e.state.upgrades, {}); assert.deepEqual(e.state.quarry.workers, {}); assert.deepEqual(e.state.staff, {});
  assert.deepEqual(e.state.decorations, ['hearth_banner']); assert.equal(e.state.player.legacy.collection.bronze_swords, 90);
  assert.equal(e.derived().masterworks, 0); assert.equal(e.act('talent', { talentId: 'twin_anvils' }).ok, false);
  assert(e.act('talent', { talentId: 'practiced_hands' }).ok);
});

test('full resource storage has explicit liquidation recovery without spending escrow', () => {
  const e = make(); Object.keys(e.state.materials).forEach(id => e.state.materials[id] = 0);
  e.state.player.gold = 0; e.state.materials.bronze = e.derived().materialCapacity;
  assert.equal(e.act('mine', { materialId: 'fuel' }).ok, false);
  assert(e.act('sellMaterial', { materialId: 'bronze', quantity: 3 }).ok);
  assert(e.act('buyMaterial', { materialId: 'leather', quantity: 1 }).ok);
  assert(e.act('buyMaterial', { materialId: 'fuel', quantity: 1 }).ok);
  assert(e.act('craft', { recipeId: 'bronze_daggers' }).ok);
});

test('active craft affix seed is stable across online customer activity and offline time', () => {
  const online = make(); online.state.player.stats.precision = 20;
  assert(online.act('craft', { recipeId: 'bronze_armor' }).ok);
  const offline = new Engine(data, online.state), duration = online.state.jobs[0].duration;
  online.tick(duration); offline.tick(duration, { offline: true });
  assert.equal(online.state.inventory[0].affixId, offline.state.inventory[0].affixId);
  assert.equal(online.state.inventory[0].quality, offline.state.inventory[0].quality);
});

test('customers who recover offline continue the same autonomous retry lifecycle', () => {
  const e = make(), hero = e.state.adventurers[0], quest = structuredClone(data.quests.rat_nest);
  quest.enemies[0].attack = 500; e.data = { ...data, quests: { ...data.quests, rat_nest: quest } };
  assert(e.act('dispatch', { questId: 'rat_nest', heroIds: [hero.id] }).ok);
  e.state.lastWallTime = 1000; e.advanceOffline(3601000);
  assert(hero.failures > 1); assert.equal(hero.questId, 'rat_nest');
  assert(e.state.shopEvents.some(event => event.type === 'recover' && event.heroId === hero.id));
  assert(e.state.shopEvents.some(event => event.type === 'depart' && event.heroIds.includes(hero.id)));
});

test('mailbox reward delivery and claim cannot duplicate quest proceeds', () => {
  const e = make(), hero = e.state.adventurers[0], quest = structuredClone(data.quests.rat_nest);
  quest.enemies[0].health = 1; quest.enemies[0].attack = 1;
  e.data = { ...data, quests: { ...data.quests, rat_nest: quest } };
  Object.keys(e.state.materials).forEach(id => e.state.materials[id] = 0);
  e.state.materials.bronze = e.derived().materialCapacity;
  assert(e.act('dispatch', { questId: 'rat_nest', heroIds: [hero.id] }).ok);
  e.tick(60000); assert.equal(e.state.mailbox.length, 1);
  const id = e.state.mailbox[0].id, gold = e.state.player.gold;
  assert.equal(e.act('claim', { bundleId: id }).ok, false);
  assert(e.act('sellMaterial', { materialId: 'bronze', quantity: 4 }).ok);
  const saleGold = e.state.player.gold;
  assert(e.act('claim', { bundleId: id }).ok); assert(e.state.player.gold > saleGold);
  const claimedGold = e.state.player.gold;
  assert.equal(e.act('claim', { bundleId: id }).ok, false); e.tick(1000);
  assert.equal(e.state.player.gold, claimedGold); assert.equal(e.state.stats.questsWon, 1);
  assert(claimedGold > gold);
});

test('relationship milestones create named commissions and delivery pays exactly once', () => {
  const e = make(), hero = e.state.adventurers[0]; hero.relationship = 5;
  e.tick(1);
  const order = e.state.commissions.find(c => c.heroId === hero.id);
  assert(order); assert.equal(order.status, 'offered'); assert.deepEqual(hero.relationshipMilestones, [5]);
  assert.equal(e.commissionPreview(order.id).eligible, false);
  assert(e.act('acceptCommission', { commissionId: order.id }).ok);
  const wrong = seedItem(e, 'bronze_swords', order.minQuality - 1);
  assert.equal(e.act('fulfillCommission', { commissionId: order.id, itemId: wrong.id }).ok, false);
  const good = seedItem(e, 'bronze_swords', order.minQuality);
  const quote = e.commissionPreview(order.id, good.id), gold = e.state.player.gold;
  assert(quote.eligible); assert(e.act('fulfillCommission', { commissionId: order.id, itemId: good.id }).ok);
  assert.equal(e.state.player.gold, gold + quote.payment); assert.equal(order.status, 'complete');
  assert.equal(e.state.inventory.some(i => i.id === good.id), false);
  assert.equal(hero.equipment.weapon.id, good.id);
  const after = e.state.player.gold;
  assert.equal(e.act('fulfillCommission', { commissionId: order.id, itemId: good.id }).ok, false);
  e.tick(5000); assert.equal(e.state.player.gold, after); assert.equal(e.state.commissions.length, 1);
  assert(Engine.validateSave(e.exportSave(), data).ok);
});

test('masterwork commission requires quality85 and cannot spend protected heirlooms', () => {
  const e = make(), hero = e.state.adventurers[0]; hero.relationship = 30; e.tick(1);
  const order = e.state.commissions.find(c => c.heroId === hero.id && c.minQuality === 85);
  assert(order); assert(e.act('acceptCommission', { commissionId: order.id }).ok);
  const item = seedItem(e, 'steel_swords', 85, { protected: true });
  assert.equal(e.commissionPreview(order.id, item.id).eligible, false);
  e.act('protect', { itemId: item.id }); assert(e.commissionPreview(order.id, item.id).eligible);
});

test('unlocked advanced quests reach new visitors and failed returnees retain retry targets', () => {
  const e = make(); Object.keys(data.quests).forEach(id => e.state.questWins[id] = 1);
  const offered = new Set();
  for (let n = 0; n < 40; n++) {
    e.state.adventurers.forEach(h => h.status = 'idle'); e._arrive();
    offered.add(e.state.adventurers.find(h => h.status === 'browsing').questId);
  }
  assert([...offered].some(id => data.quests[id].tier >= 4));
  e.state.adventurers.forEach(h => h.status = 'idle');
  const hero = e.state.adventurers[0]; hero.questId = 'smuggler_cache'; hero.memories = [{ victory: false, questId: hero.questId }];
  // A forced arrival selects the first available known traveler but preserves a failed target.
  e._arrive(true); assert.equal(hero.questId, 'smuggler_cache');
});

test('hidden ticks and reloads share one eight-hour allowance until foreground resumes', () => {
  const e = make();
  assert.equal(e.tick(5 * 3600000, { offline: true }).data.milliseconds, 5 * 3600000);
  const reloaded = new Engine(data, e.exportSave());
  assert.equal(reloaded.tick(5 * 3600000, { offline: true }).data.milliseconds, 3 * 3600000);
  assert.equal(reloaded.tick(3600000, { offline: true }).data.milliseconds, 0);
  assert.equal(reloaded.state.simTime, 8 * 3600000);
  reloaded.tick(1);
  assert.equal(reloaded.tick(3600000, { offline: true }).data.milliseconds, 3600000);
  const oversized = make();
  assert.equal(oversized.tick(12 * 3600000, { offline: true }).data.milliseconds, 8 * 3600000);
});

test('offline procurement cap persists across hidden ticks and reload but resets on foreground', () => {
  const e = make(); e.state.staff.quartermaster = { active: false, level: 1, xp: 0 };
  e.state.player.gold = 1000; Object.keys(e.state.materials).forEach(id => e.state.materials[id] = 0);
  e.state.materials.bronze = 100;
  const budget = Object.entries(data.recipes.bronze_daggers.inputs).reduce((n, [id, quantity]) => n + (id === 'bronze' ? 0 : quantity * e.materialPrice(id)), 0);
  assert(e.act('automation', { enabled: true, autoBuy: true, autoSell: false, recipeId: 'bronze_daggers', targetStock: 24, spendCap: budget, goldReserve: 12 }).ok);
  e.tick(60000, { offline: true }); assert.equal(e.state.offlineSession.spent, budget);
  const reloaded = new Engine(data, e.exportSave()), gold = e.state.player.gold;
  reloaded.tick(60000, { offline: true }); assert.equal(reloaded.state.player.gold, gold);
  assert.equal(reloaded.state.offlineSession.spent, budget);
  reloaded.tick(1); assert.equal(reloaded.state.offlineSession.spent, 0);
  reloaded.tick(60000, { offline: true }); assert.equal(reloaded.state.player.gold, gold - budget);
});

test('story choices apply lasting bonuses once and preserve the generation branch', () => {
  const e = make(); e.state.questWins.smuggler_cache = 1;
  const before = e._heroBudget(data.quests.smuggler_cache), gold = e.state.player.gold;
  assert(e.act('route', { questId: 'smuggler_cache', choiceId: 'help_townsfolk' }).ok);
  assert(e._heroBudget(data.quests.smuggler_cache) > before); assert.equal(e.state.player.gold, gold + 2);
  assert.equal(e.act('route', { questId: 'smuggler_cache', choiceId: 'help_townsfolk' }).ok, false);
  assert.equal(e.act('route', { questId: 'smuggler_cache', choiceId: 'recover_supplies' }).ok, false);
  assert.equal(e.state.player.gold, gold + 2); assert(Engine.validateSave(e.exportSave(), data).ok);
});

test('shelf customers buy and depart autonomously from a fresh forge', () => {
  const e = make(), hero = e.state.adventurers[0];
  const protectedItem = seedItem(e, 'bronze_swords', 60, { protected: true });
  const reservedItem = seedItem(e, 'bronze_swords', 55, { reservedFor: hero.id });
  const storedItem = seedItem(e, 'bronze_swords', 50, { displayed: false });
  const stock = seedItem(e, 'bronze_swords', 34), price = e.itemPrice(stock.id), gold = e.state.player.gold;
  e.tick(4000);
  assert.equal(e.state.automation.enabled, false);
  assert.equal(hero.equipment.weapon.id, stock.id);
  assert.equal(e.state.player.gold, gold + price);
  assert.equal(e.state.stats.sold, 1);
  for (const item of [protectedItem, reservedItem, storedItem]) assert(e.state.inventory.some(i => i.id === item.id));
  e.tick(56000);
  assert(e.state.runs.some(run => run.heroIds.includes(hero.id)));
  assert(e.state.shopEvents.some(event => event.type === 'purchase' && event.itemId === stock.id));
  assert(e.state.shopEvents.some(event => event.type === 'depart' && event.heroIds.includes(hero.id)));
  assert(Engine.validateSave(e.exportSave(), data).ok);
});

test('NPC checkout respects budget, two-handed equipment and displayed stock', () => {
  const e = make(), hero = e.state.adventurers[0];
  e.state.adventurers[1].status = 'idle'; e.state.nextArrivalAt = 999999;
  hero.budget = 0;
  const item = seedItem(e, 'bronze_swords', 50);
  e.tick(4000); assert(e.state.inventory.includes(item));
  hero.budget = 100;
  hero.equipment.weapon = { id: 'two-handed', recipeId: 'bronze_polearms', quality: 80, makerGeneration: 1 };
  const shield = seedItem(e, 'bronze_shields', 60);
  e.act('display', { itemId: item.id });
  e.tick(6000);
  assert(e.state.inventory.includes(shield)); assert.equal(hero.equipment.offhand, null);
});

test('autonomous commissions accept and deliver only matching shelf stock', () => {
  const e = make(), hero = e.state.adventurers[0]; hero.relationship = 30;
  const protectedItem = seedItem(e, 'steel_swords', 95, { protected: true });
  const item = seedItem(e, 'steel_swords', 90);
  e.tick(4000);
  assert(e.state.commissions.every(c => c.status !== 'offered'));
  assert.equal(e.state.commissions.filter(c => c.status === 'complete').length, 1);
  assert(e.state.inventory.includes(protectedItem)); assert(!e.state.inventory.includes(item));
  assert(e.state.shopEvents.some(event => event.type === 'commission' && event.itemId === item.id));
});

test('online and offline autonomous customers produce the same purchases, returns and battles', () => {
  const a = make();
  for (const recipeId of ['bronze_swords', 'bronze_axes', 'bronze_armor', 'bronze_shields']) seedItem(a, recipeId, 40);
  assert(a.act('craft', { recipeId: 'bronze_daggers', quantity: 2 }).ok);
  const b = new Engine(data, a.exportSave());
  for (let n = 0; n < 600; n++) a.tick(1000);
  b.tick(600000, { offline: true });
  const online = a.getState(), offline = b.getState();
  delete online.offlineSession; delete offline.offlineSession;
  assert.deepEqual(offline, online);
  assert(online.stats.sold > 0); assert(online.stats.questsLost + online.stats.questsWon > 0);
});

test('the three-hero finale assembles itself and story branches resolve autonomously', () => {
  const e = make(); e.state.upgrades.guild_hall = 2; e._arrive(true);
  for (const id of Object.keys(data.quests)) if (id !== 'void_sovereign') e.state.questWins[id] = 1;
  for (const hero of e.state.adventurers) {
    hero.level = 30;
    const weaponClass = data.archetypes[hero.archetypeId].preferences.find(id => data.classes[id].slot === 'weapon');
    for (const [slot, classId] of [['weapon', weaponClass], ['body', 'armor'], ['ring', 'rings'], ['charm', 'charms'], ['tool', 'tools']]) {
      hero.equipment[slot] = { id: e._id('finale'), recipeId: 'mithril_' + classId, quality: 90, makerGeneration: 1 };
    }
  }
  e.tick(60000);
  const finale = e.state.runs.find(run => run.questId === 'void_sovereign');
  assert(finale); assert.equal(finale.heroIds.length, 3);
  assert.equal(e.state.unlocks.routes.fallen_observatory, 'recover_starforge');
  assert(Engine.validateSave(e.exportSave(), data).ok);
});

test('old saves migrate NPC clocks without changing existing equipment or reserved items', () => {
  const e = make(), item = seedItem(e, 'bronze_swords', 40, { reservedFor: e.state.adventurers[0].id });
  const old = e.getState(); delete old.nextNpcAt; delete old.shopEvents;
  old.adventurers.forEach(h => { delete h.browseUntil; delete h.nextShopAt; delete h.lastPurchaseAt; delete h.departAt; delete h.shoppingReason; });
  const restored = new Engine(data, old);
  restored.tick(5000);
  assert(restored.state.inventory.some(i => i.id === item.id));
  assert(restored.state.adventurers.every(h => Number.isFinite(h.browseUntil)));
  assert(Engine.validateSave(restored.exportSave(), data).ok);
});

test('customers value resistance for their quest and deferred rewards unpack automatically', () => {
  const e = make(), hero = e.state.adventurers[0];
  e.state.adventurers[1].status = 'idle'; e.state.nextArrivalAt = 999999;
  hero.questId = 'ash_courtyard'; hero.budget = 500;
  hero.equipment.body = { id: 'old-armor', recipeId: 'iron_armor', quality: 55, makerGeneration: 1 };
  const ward = seedItem(e, 'iron_armor', 55, { enchantmentId: 'ember_ward', enchantStrength: 1 });
  assert(e.salePreview(ward.id, hero.id).improvement > 0);
  e.tick(4000); assert.equal(hero.equipment.body.id, ward.id);
  const bundle = { id: 'deferred-gift', gold: 3, materials: { wood: 1 }, recipes: [], source: 'Test reward' };
  e.state.mailbox.push(bundle); const gold = e.state.player.gold, wood = e.state.materials.wood;
  e.tick(2000);
  assert.equal(e.state.mailbox.length, 0); assert.equal(e.state.player.gold, gold + 3); assert.equal(e.state.materials.wood, wood + 1);
  e.tick(2000); assert.equal(e.state.player.gold, gold + 3);
});
