"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const E = require("../house-engine"),
  D = require("../data");
function fresh() {
  const e = new E(structuredClone(D));
  assert(
    e.command("create", {
      profession: "weaponsmith",
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    }).ok,
  );
  Object.assign(e.state.materials, {
    bronze_ingot: 14,
    fuel: 14,
    wood: 14,
    leather: 14,
  });
  return e;
}
function item(e, quality, extra = {}) {
  const i = {
    id: e._id("item"),
    recipeId: "bronze_swords",
    quality,
    createdAt: e.state.simTime,
    displayed: false,
    protected: false,
    reservedFor: null,
    ...extra,
  };
  e.state.inventory.push(i);
  return i;
}
test("Iron keeps its champion lock; the Surveyor's ledger is an independent optional upgrade", () => {
  const e = fresh();
  e.state.player.gold = 212;
  e.state.world.totalMined = 150;
  assert.match(
    e.upgradePreview("mine_iron").reason,
    /Defeat 1 league champion/,
  );
  assert(e.upgradePreview("survey").eligible);
  e.state.house.champions = 1;
  assert(e.command("houseUpgrade", { id: "mine_iron" }).ok);
  assert.equal(e._effects().seamIron, 1);
});
test("contract work stays in the warehouse and completes automatically without buying a clerk", () => {
  const e = fresh(),
    order = e.state.house.orders[0],
    gold = e.state.player.gold;
  assert(
    e.command("craft", {
      recipeId: order.recipeId,
      intent: "catalogue",
      quantity: order.quantity,
    }).ok,
  );
  const deadline = e.state.jobs[0].completeAt;
  e.tick(deadline);
  assert.equal(e.state.house.contracts, 0);
  assert.equal(e.state.inventory.length, 1);
  assert.equal(e.state.inventory[0].displayed, false);
  e.tick(5 * 60000);
  assert.equal(e.state.house.contracts, 1);
  assert.equal(e.state.player.gold, gold + order.payment);
  assert(!e.state.house.orders.some((o) => o.id === order.id));
  assert(!e.command("deliverContract", { id: order.id }).ok);
  assert(E.validateSave(e.exportSave(), e.data).ok);
});
test("warehouse contract completion runs offline and its payment cannot repeat on reload", () => {
  const e = fresh(),
    order = e.state.house.orders[0];
  e.state.lastWallTime = 1000000;
  assert(
    e.command("craft", {
      recipeId: order.recipeId,
      intent: "catalogue",
      quantity: order.quantity,
    }).ok,
  );
  const loaded = new E(structuredClone(D), e.exportSave()),
    now = 1600000;
  const r = loaded.advanceOffline(now).report;
  assert.equal(r.contracts, 1);
  assert.equal(r.contractGold, order.payment);
  const again = new E(structuredClone(D), loaded.exportSave());
  assert.equal(again.advanceOffline(now).report.contractGold, 0);
});
test("display fills and refills with the weakest sale stock while contract and team pieces stay held", () => {
  const e = fresh();
  e.state.house.autoDeliver = false;
  const contract = item(e, 80, { intent: "catalogue" }),
    team = item(e, 90, { intent: "team", protected: true });
  const sale = [60, 20, 40, 30, 50, 70].map((q) =>
    item(e, q, { intent: "stock", autoDisplayHold: true }),
  );
  e._restockShelves();
  const capacity = e.derived().displayCapacity;
  assert(!contract.displayed && !team.displayed);
  assert.deepEqual(
    sale
      .filter((i) => i.displayed)
      .map((i) => i.quality)
      .sort((a, b) => a - b),
    [20, 30, 40, 50, 60, 70].slice(0, capacity),
  );
  const sold = sale.find((i) => i.quality === 20);
  assert(e.command("sell", { itemId: sold.id }).ok);
  assert.equal(
    e.state.inventory.filter((i) => i.displayed).length,
    Math.min(capacity, 5),
  );
  assert(!contract.displayed && !team.displayed);
});
test("team work equips its selected fighter automatically; equal or weaker work remains protected", () => {
  const e = fresh(),
    hero = e.state.adventurers.find((u) => u.id === "mara");
  assert(
    e.command("craft", {
      recipeId: "bronze_swords",
      intent: "team",
      heroId: hero.id,
    }).ok,
  );
  e.tick(5 * 60000);
  assert.equal(hero.equipment.weapon.recipeId, "bronze_swords");
  const held = item(e, 0, {
    intent: "team",
    protected: true,
    reservedFor: hero.id,
    autoEquipPending: true,
  });
  const equipped = hero.equipment.weapon.id;
  e.tick(3000);
  assert.equal(hero.equipment.weapon.id, equipped);
  assert(e.state.inventory.includes(held));
  assert(!held.displayed);
});
test("team work waits through a live bout and equips afterwards without changing the replay snapshot", () => {
  const e = fresh(),
    hero = e.state.adventurers.find((u) => u.id === "mara");
  assert(e.command("challenge", { rival: "choir" }).ok);
  const match = e.activeMatch(),
    snapshot = JSON.stringify(match.snapshot);
  const held = item(e, 80, {
    intent: "team",
    protected: true,
    reservedFor: hero.id,
    autoEquipPending: true,
  });
  e._equipCompletedTeamWork();
  assert(e.state.inventory.includes(held));
  e.tick(match.endsAt - e.state.simTime + 3000);
  assert.equal(hero.equipment.weapon.id, held.id);
  assert.equal(JSON.stringify(match.snapshot), snapshot);
});
test("equipment suggestions exclude equals and downgrades, and disclose both sides of a tradeoff", () => {
  const e = fresh(),
    first = item(e, 60);
  assert(e.command("equip", { heroId: "mara", itemId: first.id }).ok);
  assert.equal(e.equipmentPreview("mara", item(e, 60).id).improves, false);
  assert.equal(e.equipmentPreview("mara", item(e, 10).id).improves, false);
  const better = e.equipmentPreview("mara", item(e, 90).id);
  assert(better.improves);
  assert(better.changes.some((c) => c.key === "attack" && c.improved));
  // Controlled equipment definition exercises a real attack/armour tradeoff.
  const r = e.data.recipes.bronze_swords;
  e.data.recipes.review_tradeoff = {
    ...structuredClone(r),
    id: "review_tradeoff",
    combat: { ...r.combat, attack: (r.combat.attack || 1) * 3, armor: -2 },
  };
  const trade = e.equipmentPreview(
    "mara",
    item(e, 90, { recipeId: "review_tradeoff" }).id,
  );
  assert(trade.improves);
  assert(trade.changes.some((c) => c.improved));
  assert(trade.changes.some((c) => !c.improved));
});
test("old saves enable automatic delivery, but a later explicit pause survives a reload", () => {
  const e = fresh(),
    old = structuredClone(e.state);
  delete old.house.deliveryVersion;
  old.house.autoDeliver = false;
  const loaded = new E(structuredClone(D), old);
  assert(loaded.state.house.autoDeliver);
  assert(loaded.command("housePolicy", { autoDeliver: false }).ok);
  assert.equal(
    new E(structuredClone(D), loaded.exportSave()).state.house.autoDeliver,
    false,
  );
});
