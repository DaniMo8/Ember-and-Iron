"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const E = require("../house-engine"),
  D = require("../data"),
  C = require("../house-combat");
const { browser, KEY } = require("./helpers/house-app-harness");
function fresh(profession = "weaponsmith") {
  const e = new E(structuredClone(D));
  assert(
    e.command("create", {
      profession,
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    }).ok,
  );
  return e;
}
function supplies(e) {
  for (const id in e.state.materials) e.state.materials[id] = e.binCapacity();
  e.state.player.gold = 100000;
}
function piece(e, recipeId, quality = 80, extra = {}) {
  const i = {
    id: e._id("item"),
    recipeId,
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
test("commissions arrive singly every five minutes, cap at six and do not bank missed arrivals", () => {
  const e = fresh();
  assert.equal(e.state.house.orders.length, 1);
  e.tick(299999);
  assert.equal(e.state.house.orders.length, 1);
  e.tick(1);
  assert.equal(e.state.house.orders.length, 2);
  e.tick(60 * 60000);
  assert.equal(e.state.house.orders.length, 6);
  const id = e.state.house.orders[0].id;
  assert(e.command("declineCommission", { id }).ok);
  e.tick(299999);
  assert.equal(e.state.house.orders.length, 5);
  e.tick(1);
  assert.equal(e.state.house.orders.length, 6);
  assert(E.validateSave(e.exportSave(), e.data).ok);
});
test("arrival clock and patron randomness survive reload and offline chunking", () => {
  const e = fresh(),
    saved = e.exportSave(),
    a = new E(structuredClone(D), saved),
    b = new E(structuredClone(D), saved);
  a.tick(1800000);
  for (let n = 0; n < 30; n++) b.tick(60000);
  assert.deepEqual(a.state.house.orders, b.state.house.orders);
  assert.equal(a.commissionBoard().seconds, b.commissionBoard().seconds);
});
test("complete commission reserves the remainder once and completion does not instantly refill the board", () => {
  const e = fresh();
  supplies(e);
  const o = e.state.house.orders[0],
    gold = e.state.player.gold;
  assert(e.command("commissionCraft", { id: o.id, complete: true }).ok);
  assert.equal(e.state.jobs.length, o.quantity);
  const before = e.exportSave();
  assert(!e.command("commissionCraft", { id: o.id, complete: true }).ok);
  assert.equal(e.exportSave(), before);
  e.tick(250000);
  assert.equal(e.state.house.contracts, 1);
  assert.equal(e.state.house.orders.length, 0);
  assert.equal(e.state.player.gold, gold + o.payment);
  assert.equal(e.state.inventory.length, 0);
});
test("rare request plans real finishing time and delivers only after the quality work", () => {
  const e = fresh();
  supplies(e);
  e.state.house.orders = [];
  e._roll = () => 0;
  e._newContracts();
  const o = e.state.house.orders[0],
    plan = e.commissionPlan(o.id),
    base = e.craftPreview(o.recipeId);
  assert.equal(o.kind, "rare");
  assert.equal(plan.finishPasses, 1);
  assert(plan.seconds > base.seconds * 1.9);
  assert(e.command("commissionCraft", { id: o.id, complete: true }).ok);
  assert.equal(e.state.jobs[0].finishPasses, 1);
  const deadline = e.state.jobs[0].completeAt;
  e.tick(deadline - 1);
  assert.equal(e.state.house.contracts, 0);
  e.tick(1);
  assert.equal(e.state.house.contracts, 1);
  assert.equal(e.state.inventory.length, 0);
});
test("commission matcher enforces exact patterns and preparation and protects another patron's reserved work", () => {
  const e = fresh(),
    o = e.state.house.orders[0];
  o.grade = "tough";
  o.treatment = "keen";
  const i = piece(e, o.recipeId, 100, {
    intent: "catalogue",
    grade: "standard",
    treatment: "keen",
  });
  assert(!e.contractPreview(o.id).eligible);
  i.grade = "tough";
  assert(e.commissionMatches(i, o));
  i.recipeId = "bronze_daggers";
  assert(!e.commissionMatches(i, o));
  i.recipeId = o.recipeId;
  const other = { ...o, id: "second-signed-order" };
  e.state.house.orders.push(other);
  i.orderId = other.id;
  assert(!e.commissionMatches(i, o));
  assert(e.commissionMatches(i, other));
});
test("complete commission is atomic when materials or queue space cannot cover the remainder", () => {
  const e = fresh(),
    o = e.state.house.orders[0];
  supplies(e);
  o.quantity = 10;
  const before = e.exportSave();
  const r = e.command("commissionCraft", { id: o.id, complete: true });
  assert(!r.ok);
  assert.equal(e.exportSave(), before);
});
test("hero slot chooses the best unlocked alloy without pretending unavailable materials exist", () => {
  const e = fresh();
  e.state.house.champions = 1;
  Object.assign(e.state.house.upgrades, {
    patterns: 1,
    patterns_2: 1,
    mine_iron: 1,
  });
  e.state.workshop.upgrades.iron = 1;
  e.state.player.level = 10;
  for (const p of Object.values(e.state.player.proficiency)) p.level = 30;
  for (const k in e.state.player.stats) e.state.player.stats[k] = 40;
  const p = e.heroForgePlan("mara", "body");
  assert.equal(e.data.recipes[p.recipeId].materialId, "iron_ingot");
  assert.equal(e.data.recipes[p.recipeId].classId, "armor");
  assert(!e.craftPreview(p.recipeId).eligible);
  assert(!e.heroForgeClasses("wren", "body").includes("armor"));
});
test("reserved offhand dagger survives reload and cannot replace the main hand instead", () => {
  const e = fresh();
  supplies(e);
  assert(
    e.command("craft", {
      recipeId: "bronze_daggers",
      intent: "team",
      heroId: "renn",
      targetSlot: "offhand",
    }).ok,
  );
  const restored = new E(structuredClone(D), e.exportSave());
  restored.tick(120000);
  const h = restored.state.adventurers.find((h) => h.id === "renn");
  assert(h.equipment.offhand);
  assert(!h.equipment.weapon);
  assert(E.validateSave(restored.exportSave(), restored.data).ok);
});
test("old paid automation stays dormant before the third champion while paid jobs still finish", () => {
  const e = fresh("mechanist");
  assert(!e.state.workshop.upgrades.stockkeeper);
  supplies(e);
  e.state.house.upgrades.catalogue = 1;
  e.state.workshop.upgrades.stockkeeper = 1;
  e.state.house.catalogue = {
    enabled: true,
    recipeId: e.state.house.orders[0].recipeId,
    reserve: 0,
    autoBuy: true,
    rotate: true,
  };
  e.state.workshop.smeltPolicy = {
    enabled: true,
    targets: { bronze: 20 },
    reserve: 0,
  };
  e.state.materials.bronze_ingot = 0;
  assert(e.command("smelt", { id: "bronze" }).ok);
  const restored = new E(structuredClone(D), e.exportSave());
  restored.tick(10 * 60000);
  assert.equal(restored.state.workshop.smelted, 3);
  assert.equal(restored.state.stats.crafted, 0);
  assert(
    !restored.command("smeltPolicy", {
      enabled: true,
      targets: { bronze: 20 },
      reserve: 0,
    }).ok,
  );
});
test("late furnace automation costs the displayed amount and activates only after champion three", () => {
  const e = fresh();
  supplies(e);
  const gold = e.state.player.gold;
  assert(!e.command("smeltUpgrade", { id: "stockkeeper" }).ok);
  e.state.house.champions = 3;
  assert.equal(e.smeltUpgradePreview("stockkeeper").cost, 3200);
  assert(e.command("smeltUpgrade", { id: "stockkeeper" }).ok);
  assert.equal(e.state.player.gold, gold - 3200);
  e.state.materials.bronze_ingot = 0;
  assert(
    e.command("smeltPolicy", {
      enabled: true,
      targets: { bronze: 6 },
      reserve: 0,
    }).ok,
  );
  e.tick(120000);
  assert(e.state.materials.bronze_ingot >= 6);
});
test("remembering anvil rewards repeated classes, resets on a different class and respects the cap", () => {
  const e = fresh();
  supplies(e);
  e.state.house.upgrades.memory_anvil = 1;
  const base = e.craftPreview("bronze_daggers").quality;
  assert(
    e.command("craft", { recipeId: "bronze_daggers", intent: "stock" }).ok,
  );
  e.tick(60000);
  e.state.house.upgrades.memory_anvil = 0;
  const learned = e.craftPreview("bronze_daggers").quality;
  e.state.house.upgrades.memory_anvil = 1;
  assert.equal(e.craftPreview("bronze_daggers").quality, learned + 4);
  assert(e.command("craft", { recipeId: "bronze_swords", intent: "stock" }).ok);
  e.tick(60000);
  assert.equal(e.craftPreview("bronze_daggers").quality, learned);
});
test("slag press returns coal for four actual batches and never repeats the rebate after loading", () => {
  const e = fresh();
  supplies(e);
  e.state.house.upgrades.slag_press = 1;
  e.state.materials.bronze_ingot = 0;
  const coal = e.state.materials.fuel;
  assert(e.command("smelt", { id: "bronze", quantity: 4 }).ok);
  e.tick(180000);
  assert.equal(e.state.materials.fuel, coal - 4 + 2);
  const b = new E(structuredClone(D), e.exportSave());
  b.tick(60000);
  assert.equal(b.state.materials.fuel, e.state.materials.fuel);
});
test("powder charges respect cost, locked seams, cooldown and full bins", () => {
  const e = fresh();
  supplies(e);
  e.state.house.upgrades.powder_magazine = 1;
  const before = e.exportSave();
  assert(!e.command("blast", { materialId: "bronze" }).ok);
  assert.equal(e.exportSave(), before);
  e.state.materials.bronze = 0;
  const coal = e.state.materials.fuel;
  assert(e.command("blast", { materialId: "bronze" }).ok);
  assert.equal(e.state.materials.bronze, 12);
  assert.equal(e.state.materials.fuel, coal - 5);
  assert(!e.command("blast", { materialId: "bronze" }).ok);
  assert(!e.command("blast", { materialId: "starforged" }).ok);
});
test("fossil sieve is a counted by-product and overflow is lost", () => {
  const e = fresh();
  e.state.house.upgrades.fossil_sieve = 1;
  const old = e.state.materials.gem;
  e._sift(49);
  assert.equal(e.state.materials.gem, old);
  e._sift(1);
  assert.equal(e.state.materials.gem, old + 1);
  e.state.materials.gem = e.binCapacity();
  e._sift(100);
  assert.equal(e.state.materials.gem, e.binCapacity());
});
test("moon metal and forbidden treatments create actual combat trade-offs and save safely", () => {
  const e = fresh();
  supplies(e);
  e.state.player.level = 10;
  assert(!e.smeltPreview("bronze", 1, "moon").eligible);
  e.state.house.upgrades.moon_crucible = 1;
  assert(e.command("hireStaff", { staffId: "assayer" }).ok);
  e.state.materials.bronze_ingot = 0;
  assert(e.command("smelt", { id: "bronze", grade: "moon" }).ok);
  e.tick(60000);
  assert.equal(e.state.house.graded.bronze.moon, 3);
  assert(E.validateSave(e.exportSave(), e.data).ok);
  const base = e._itemCombat({ recipeId: "bronze_swords", quality: 80 }),
    glass = e._itemCombat({
      recipeId: "bronze_swords",
      quality: 80,
      treatment: "glassheart",
      grade: "moon",
    });
  assert(glass.attack > base.attack);
  assert(glass.resistances.arcane > base.resistances.arcane);
  const body = e._itemCombat({ recipeId: "bronze_armor", quality: 80 }),
    fragile = e._itemCombat({
      recipeId: "bronze_armor",
      quality: 80,
      treatment: "glassheart",
    });
  assert(fragile.health < body.health);
});
test("the second bell saves a front-line fighter once rather than making them immortal", () => {
  const unit = (id, hp, atk, extra = {}) => ({
    id,
    name: id,
    line: "front",
    health: hp,
    attack: atk,
    armor: 0,
    interval: 1,
    crit: 0,
    block: 0,
    evasion: 0,
    resistances: {},
    ...extra,
  });
  const { live, result } = C.create({
    seed: 3,
    heroes: [unit("hero", 5, 1, { secondWind: true })],
    enemies: [unit("enemy", 500, 100)],
  });
  C.advance(live, result, 180000);
  assert.equal(result.victory, false);
  assert(live.heroes[0].secondWindSpent);
  assert.equal(
    result.events.filter((x) => x.text.includes("second bell")).length,
    1,
  );
});
test("resting apprentices gain knowledge without activating their work bonus", () => {
  const e = fresh();
  supplies(e);
  e.state.player.level = 10;
  assert(e.command("hireStaff", { staffId: "assayer" }).ok);
  const st = e.state.staff.assayer;
  st.active = false;
  const xp = st.xp;
  e.state.house.upgrades.apprentice_notes = 1;
  e._staffXp("smelt", 8);
  assert.equal(st.xp, xp + 2);
  assert.equal(e.staffEfficiency("assayer"), 0);
});
test("a commission feeds the staff once and the curio collector has a real cooldown", () => {
  const e = fresh();
  supplies(e);
  e.state.player.level = 10;
  assert(e.command("hireStaff", { staffId: "assayer" }).ok);
  e.state.house.upgrades.supper_bell = 1;
  e.state.staff.assayer.stamina = 40;
  const o = e.state.house.orders[0];
  for (let n = 0; n < o.quantity; n++)
    piece(e, o.recipeId, 100, { intent: "catalogue" });
  assert(e.command("deliverContract", { id: o.id }).ok);
  assert.equal(e.state.staff.assayer.stamina, 48);
  assert(!e.command("deliverContract", { id: o.id }).ok);
  assert.equal(e.state.staff.assayer.stamina, 48);
  const i = piece(e, "bronze_daggers", 80, {
      intent: "stock",
      displayed: true,
    }),
    j = piece(e, "bronze_daggers", 80, { intent: "stock", displayed: true }),
    base = e.salePreview(i.id).price;
  e.state.house.upgrades.curio_window = 1;
  assert.equal(e.salePreview(i.id).price, base * 3);
  assert(e.command("sell", { itemId: i.id }).ok);
  assert.equal(e.salePreview(j.id).price, base);
});
test("forge UI exposes three destinations and slot or commission selection drives its design", async () => {
  const e = fresh();
  e.markSaved(100000);
  const h = browser({ now: 100000 }, new Map([[KEY, e.exportSave()]]));
  await h.click("continue");
  await h.click("room", { room: "forge" });
  let html = h.nodes.get("#app").innerHTML;
  assert(html.includes("Choose a hero, then an equipment slot"));
  assert(!html.includes("Mastery practice"));
  await h.click("forge-hero", { id: "renn" });
  await h.click("forge-slot", { slot: "offhand" });
  html = h.nodes.get("#app").innerHTML;
  assert(html.includes("Bollock Knife"));
  assert(html.includes("Offhand selected"));
  await h.click("intent", { id: "catalogue" });
  await h.click("commission-select", { id: h.engine.state.house.orders[0].id });
  html = h.nodes.get("#app").innerHTML;
  assert(html.includes("Complete commission"));
  assert(
    html.includes("one five-minute bell") ||
      html.includes("One arrival every 5 minutes"),
  );
  await h.click("intent", { id: "stock" });
  assert(h.nodes.get("#app").innerHTML.includes("Stock your shop"));
});

test("shop opens on display and customers; commissions and stock equipment live in their owning rooms", async () => {
  const e = fresh();
  e.markSaved(100000);
  const h = browser({ now: 100000 }, new Map([[KEY, e.exportSave()]]));
  await h.click("continue");
  await h.click("room", { room: "shop" });
  let html = h.nodes.get("#app").innerHTML;
  for (const title of [
    "Display cases",
    "Warehouse",
    "Customers",
    "Counter staff",
  ])
    assert(html.includes(title));
  for (const removed of [
    'data-action="shop-tab"',
    "Team armoury",
    "The commission counter",
    "Equip from your stock",
  ])
    assert(!html.includes(removed));
  await h.click("room", { room: "arena" });
  await h.click("arena-tab", { id: "team" });
  html = h.nodes.get("#app").innerHTML;
  assert(html.includes("Equip from your stock"));
  assert(html.includes("Fighter record"));
  await h.click("room", { room: "forge" });
  await h.click("intent", { id: "catalogue" });
  assert(h.nodes.get("#app").innerHTML.includes("Pause automatic delivery"));
});

test("queued commissions earn extra finishing time when the remembering anvil cools before work begins", () => {
  const e = fresh();
  supplies(e);
  e.state.house.upgrades.memory_anvil = 1;
  Object.assign(e.state.house.workflow, { lastClass: "daggers", streak: 3 });
  const o = e.state.house.orders[0];
  Object.assign(o, {
    recipeId: "bronze_daggers",
    classId: "daggers",
    quantity: 1,
    quality: e.craftPreview("bronze_daggers").quality,
  });
  assert.equal(e.commissionPlan(o.id).finishPasses, 0);
  assert(
    e.command("craft", {
      recipeId: "bronze_swords",
      intent: "team",
      heroId: "mara",
    }).ok,
  );
  assert(e.command("commissionCraft", { id: o.id }).ok);
  const j = e.state.jobs.find((j) => j.orderId === o.id);
  assert.equal(j.status, "queued");
  e.tick(e.state.jobs[0].completeAt - e.state.simTime);
  assert.equal(j.status, "active");
  assert(j.finishPasses > 0);
  assert(j.quality >= o.quality);
  assert(j.duration >= e.craftPreview(j.recipeId).seconds * 1900);
  e.tick(j.completeAt - e.state.simTime);
  assert.equal(e.state.house.contracts, 1);
});

test("defeat writ pays once per bout, at most three times per simulation day", () => {
  const e = fresh();
  e.state.house.upgrades.salvage_writ = 1;
  const gold = e.state.player.gold;
  const loss = () => ({
    paid: false,
    kind: "rival",
    league: 0,
    rival: "choir",
    purse: 100,
    result: { victory: false, insight: "Training defeat." },
    snapshot: { heroes: [] },
  });
  const first = loss();
  e._settleMatch(first);
  e._settleMatch(first);
  assert.equal(e.state.player.gold, gold + 25);
  for (let n = 0; n < 4; n++) e._settleMatch(loss());
  assert.equal(e.state.player.gold, gold + 75);
  assert.equal(e.state.house.wins, 0);
  e.state.simTime = 86400000;
  e._settleMatch(loss());
  assert.equal(e.state.player.gold, gold + 100);
});

test("inherited inventions start the next house and survive a reload", () => {
  const e = new E(structuredClone(D));
  e.state.player.talents.push("ancestral_anvil", "ancestral_sieve");
  e.state.player.legacy.generation = 2;
  assert(
    e.command("create", {
      profession: "weaponsmith",
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    }).ok,
  );
  assert.equal(e.state.house.upgrades.memory_anvil, 1);
  assert.equal(e.state.house.upgrades.fossil_sieve, 1);
  const v = E.validateSave(e.exportSave(), e.data);
  assert(v.ok, v.message);
  const b = new E(structuredClone(D), e.exportSave());
  assert.equal(b.state.house.upgrades.fossil_sieve, 1);
});
