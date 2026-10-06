"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const E = require("../house-engine"),
  D = require("../data");
const { browser, KEY } = require("./helpers/house-app-harness");
function house() {
  const e = new E(structuredClone(D));
  assert(
    e.command("create", {
      profession: "weaponsmith",
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    }).ok,
  );
  return e;
}
function item(e, recipeId = "bronze_daggers", quality = 70, extra = {}) {
  const i = {
    id: e._id("item"),
    recipeId,
    quality,
    createdAt: e.state.simTime,
    displayed: false,
    protected: true,
    reservedFor: null,
    ...extra,
  };
  e.state.inventory.push(i);
  return i;
}
function equip(e, heroId, i, slot) {
  const r = e.command("equip", { heroId, itemId: i.id, slot });
  assert(r.ok, r.message);
}

test("dual daggers add combat damage and bonuses without replacing the main-hand swing speed", () => {
  const e = house(),
    main = item(e),
    off = item(e, "bronze_daggers_v1", 85, { treatment: "keen" });
  equip(e, "renn", main, "weapon");
  const before = e.heroStats("renn"),
    preview = e.equipmentPreview("renn", off.id, "offhand");
  assert(preview.eligible && preview.improves);
  assert(preview.changes.some((c) => c.key === "attack" && c.improved));
  equip(e, "renn", off, "offhand");
  const stats = e.heroStats("renn"),
    hero = e.state.adventurers.find((h) => h.id === "renn");
  assert.equal(hero.equipment.weapon.id, main.id);
  assert.equal(hero.equipment.offhand.id, off.id);
  assert.equal(stats.interval, before.interval);
  assert.equal(stats.attack, before.attack + e._itemCombat(off).attack);
  assert(stats.crit > before.crit);
  assert.equal(e.state.inventory.length, 0);
  const restored = new E(structuredClone(D), e.exportSave());
  assert.deepEqual(restored.heroStats("renn"), stats);
  assert(restored.command("challenge", { rival: "choir" }).ok);
  const snapshot = restored
    .activeMatch()
    .snapshot.heroes.find((h) => h.id === "renn");
  assert.equal(snapshot.attack, stats.attack);
  assert.equal(snapshot.equipment.offhand.id, off.id);
  const frozen = restored.exportSave();
  assert(!restored.command("unequip", { heroId: "renn", slot: "offhand" }).ok);
  assert.equal(restored.exportSave(), frozen);
});

test("off-hand slots still enforce class access and two-handed weapon restrictions", () => {
  const e = house(),
    dagger = item(e),
    sword = item(e, "bronze_swords"),
    bow = item(e, "bronze_bows");
  let before = e.exportSave();
  assert(
    !e.command("equip", { heroId: "mara", itemId: dagger.id, slot: "offhand" })
      .ok,
  );
  assert(
    !e.command("equip", { heroId: "renn", itemId: sword.id, slot: "offhand" })
      .ok,
  );
  assert(
    !e.command("equip", { heroId: "renn", itemId: dagger.id, slot: "body" }).ok,
  );
  assert.equal(e.exportSave(), before);
  equip(e, "wren", dagger, "offhand");
  equip(e, "wren", bow, "weapon");
  const hero = e.state.adventurers.find((h) => h.id === "wren");
  assert.equal(hero.equipment.offhand, null);
  assert(e.state.inventory.find((i) => i.id === dagger.id).protected);
  before = e.exportSave();
  assert.match(
    e.equipmentPreview("wren", dagger.id, "offhand").reason,
    /two-handed/,
  );
  assert(
    !e.command("equip", { heroId: "wren", itemId: dagger.id, slot: "offhand" })
      .ok,
  );
  assert.equal(e.exportSave(), before);
});

test("off-hand swaps and unequipping preserve every item and respect warehouse capacity", () => {
  const e = house(),
    old = item(e),
    next = item(e, "bronze_daggers_v1", 90);
  equip(e, "renn", old, "offhand");
  equip(e, "renn", next, "offhand");
  assert(e.state.inventory.find((i) => i.id === old.id).protected);
  while (e.state.inventory.length < e.derived().storageCapacity) item(e);
  const before = e.exportSave();
  assert(!e.command("unequip", { heroId: "renn", slot: "offhand" }).ok);
  assert.equal(e.exportSave(), before);
  // A swap at capacity can reuse the incoming item's warehouse space.
  equip(e, "renn", old, "offhand");
  assert.equal(e.state.inventory.length, e.derived().storageCapacity);
  assert(E.validateSave(e.exportSave(), e.data).ok);
});

test("team dagger commissions automatically fill an off hand when the main hand is stronger", () => {
  const e = house(),
    main = item(e, "starforged_daggers_v2", 150);
  equip(e, "renn", main);
  e.state.materials.bronze_ingot = 10;
  assert(
    e.command("craft", {
      recipeId: "bronze_daggers",
      intent: "team",
      heroId: "renn",
    }).ok,
  );
  e.tick(120000);
  const hero = e.state.adventurers.find((h) => h.id === "renn");
  assert.equal(hero.equipment.weapon.id, main.id);
  assert.equal(hero.equipment.offhand.recipeId, "bronze_daggers");
  assert.equal(hero.equipment.offhand.autoEquipPending, false);
  assert(E.validateSave(e.exportSave(), e.data).ok);
});

test("arena equipment offers separate hand comparisons and sends the selected slot", async () => {
  const clock = { now: 1000000 },
    e = house(),
    dagger = item(e);
  e.state.lastWallTime = clock.now;
  const tab = browser(clock, new Map([[KEY, e.exportSave()]]));
  await tab.flush();
  await tab.click("continue");
  await tab.click("hero", { id: "renn" });
  await tab.click("room", { room: "arena" });
  await tab.click("arena-tab", { id: "team" });
  assert.match(tab.nodes.get("#app").innerHTML, /Daggers \(either hand\)/);
  assert.match(tab.nodes.get("#app").innerHTML, /Equip main hand/);
  assert.match(tab.nodes.get("#app").innerHTML, /Equip off hand/);
  await tab.click("equip", { hero: "renn", id: dagger.id, slot: "offhand" });
  assert.equal(
    tab.engine.state.adventurers.find((h) => h.id === "renn").equipment.offhand
      .id,
    dagger.id,
  );
  assert.match(
    tab.nodes.get("#app").innerHTML,
    /<span class="slot-name">Offhand<\/span>/,
  );
});
