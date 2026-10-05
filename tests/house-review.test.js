"use strict";
// Independent controlled fixtures: these tests verify invariants, not earned campaign pacing.
const test = require("node:test"),
  assert = require("node:assert/strict");
const E = require("../house-engine"),
  D = require("../data"),
  H = require("../house-data");
const copy = (x) => JSON.parse(JSON.stringify(x));
function fresh(profession = "artificer") {
  const e = new E(copy(D));
  assert(
    e.command("create", {
      smithName: "Review fixture",
      profession,
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    }).ok,
  );
  return e;
}
function materialFixture() {
  const e = fresh();
  e.state.player.level = 5;
  e.state.player.gold = 1000;
  assert(e.command("hireStaff", { staffId: "assayer" }).ok);
  for (const id in e.state.materials) e.state.materials[id] = 10;
  return e;
}
function item(e, recipeId, extra = {}) {
  const i = {
    id: e._id("item"),
    recipeId,
    quality: 70,
    affixId: null,
    enchantmentId: null,
    createdAt: e.state.simTime,
    displayed: false,
    protected: true,
    reservedFor: null,
    makerGeneration: 1,
    ...extra,
  };
  e.state.inventory.push(i);
  return i;
}
test("review: Craft max accounts for both treatment gold and the selected grade", () => {
  const e = materialFixture();
  e.state.player.gold = 6;
  e.state.house.graded.bronze = { tough: 2 };
  const p = { intent: "team", grade: "tough", treatment: "warding" },
    v = e.craftPreview("bronze_daggers", p);
  assert(v.eligible);
  assert.equal(v.maxQuantity, 1);
  assert(
    e.command("craft", {
      recipeId: "bronze_daggers",
      quantity: v.maxQuantity,
      ...p,
    }).ok,
  );
  assert.equal(e.state.player.gold, 0);
  assert.equal(e.state.house.graded.bronze.tough, 0);
});
test("review: graded Smelt max includes its additional coal", () => {
  const e = materialFixture();
  e.state.materials.fuel = 4;
  const v = e.smeltPreview("bronze", 1, "spring");
  assert(v.eligible);
  assert.equal(v.maxQuantity, 1);
  assert(
    e.command("smelt", {
      id: "bronze",
      quantity: v.maxQuantity,
      grade: "spring",
    }).ok,
  );
  assert.equal(e.state.materials.fuel, 1);
});
test("review: simultaneous standard and premium smelts attribute overflow by delivery order", () => {
  const e = materialFixture();
  e.state.workshop.upgrades.racks = 1;
  e.state.workshop.upgrades.chambers = 1;
  e.state.materials.bronze_ingot = e.binCapacity() - 4;
  assert(e.command("smelt", { id: "bronze", grade: "standard" }).ok);
  assert(e.command("smelt", { id: "bronze", grade: "tough" }).ok);
  assert.equal(
    e.state.workshop.jobs[0].completeAt,
    e.state.workshop.jobs[1].completeAt,
  );
  e.tick(25000);
  assert.equal(e.state.materials.bronze_ingot, e.binCapacity());
  assert.equal(e.state.house.graded.bronze?.tough || 0, 1);
  assert.equal(e.state.world.materialsLost, 2);
  assert(E.validateSave(e.exportSave(), e.data).ok);
});
test("review: alloy cancellation returns the exact grade of its consumed intermediate ingots", () => {
  const e = materialFixture();
  e.state.workshop.upgrades.iron = 1;
  e.state.workshop.upgrades.steel = 1;
  e.state.materials.iron_ingot = 2;
  e.state.house.graded.iron = { spring: 2 };
  const before = copy(e.state.materials);
  assert(e.command("smelt", { id: "steel", grade: "standard" }).ok);
  assert.equal(e.state.house.graded.iron.spring, 0);
  assert(e.command("cancelSmelt", { id: e.state.workshop.jobs[0].id }).ok);
  assert.deepEqual(e.state.materials, before);
  assert.equal(e.state.house.graded.iron.spring, 2);
  assert(E.validateSave(e.exportSave(), e.data).ok);
});
test("review: unequipping cannot occupy a pending craft output reservation", () => {
  const e = fresh();
  const sword = item(e, "bronze_swords");
  assert(e.command("equip", { heroId: "mara", itemId: sword.id }).ok);
  while (e.state.inventory.length < e.derived().storageCapacity - 1)
    item(e, "bronze_swords");
  for (const [id, n] of Object.entries(e.data.recipes.bronze_daggers.inputs))
    e.state.materials[id] = n;
  assert(e.command("craft", { recipeId: "bronze_daggers", intent: "team" }).ok);
  const before = e.exportSave();
  assert(!e.command("unequip", { heroId: "mara", slot: "weapon" }).ok);
  assert.equal(e.exportSave(), before);
  e.tick(120000);
  assert.equal(e.state.inventory.length, e.derived().storageCapacity - 1);
  assert.equal(
    e.state.adventurers.find((u) => u.id === "renn").equipment.weapon.recipeId,
    "bronze_daggers",
  );
  assert.equal(e.state.jobs.length, 0);
});
test("review: fractional fighter intervals always schedule integer match and recovery times", () => {
  const e = fresh();
  for (const u of e.state.adventurers) {
    for (const slot of H.slots) {
      const r = Object.values(e.data.recipes).find(
        (r) =>
          r.tier === 1 &&
          r.variant === 1 &&
          r.slot === slot &&
          e.data.archetypes[u.archetypeId].preferences.includes(r.classId),
      );
      if (r) {
        const i = item(e, r.id);
        e.command("equip", { heroId: u.id, itemId: i.id });
      }
    }
  }
  for (const rival of ["choir", "thread", "lantern"]) {
    assert(e.command("challenge", { rival }).ok);
    const m = e.activeMatch();
    assert(Number.isInteger(m.endsAt));
    assert(E.validateSave(e.exportSave(), e.data).ok);
    e.tick(m.endsAt - e.state.simTime);
    assert(m.paid);
    assert(Object.values(e.state.house.recovery).every(Number.isInteger));
    e.tick(60000);
    assert(E.validateSave(e.exportSave(), e.data).ok);
  }
});
test("review: highest-tier controlled team can win the final champion and retire into every charter", () => {
  const e = fresh();
  e.state.house.champions = 4;
  e.state.house.rung = 3;
  e.state.simTime = 72 * 3600000;
  e.state.house.campaign.tierCrafts[4] = 36;
  e.state.house.campaign.tierContracts[4] = 12;
  e.state.player.stats = {
    strength: 100,
    precision: 100,
    charisma: 100,
    knowledge: 100,
  };
  for (const u of e.state.adventurers) {
    u.level = 30;
    for (const slot of H.slots) {
      const r = Object.values(e.data.recipes).find(
        (r) =>
          r.tier === 5 &&
          r.variant === 2 &&
          r.slot === slot &&
          e.data.archetypes[u.archetypeId].preferences.includes(r.classId),
      );
      if (!r) continue;
      const i = item(e, r.id, {
        quality: 200,
        grade: "spring",
        treatment: slot === "weapon" ? "keen" : "warding",
        affixId:
          slot === "weapon"
            ? "peerless"
            : ["body", "charm", "tool"].includes(slot)
              ? "nimble"
              : slot === "ring"
                ? "precise"
                : "stalwart",
        enchantmentId:
          slot === "weapon"
            ? "haste"
            : ["body", "offhand"].includes(slot)
              ? "bulwark"
              : "vitality",
        enchantStrength: e.derived().enchantStrength,
      });
      e.command("equip", { heroId: u.id, itemId: i.id });
    }
  }
  assert(e.command("challenge", { kind: "champion", rival: "choir" }).ok);
  const m = e.activeMatch();
  assert.equal(m.result.victory, null);
  e.tick(m.endsAt - e.state.simTime);
  assert(m.result.victory);
  assert.equal(e.state.house.champions, 5);
  assert(e.derived().legacyEligible);
  assert(E.validateSave(e.exportSave(), e.data).ok);
  const save = e.exportSave(),
    reward = e.derived().legacyReward;
  for (const charter of ["workforce", "patron", "archive"]) {
    const f = new E(copy(D), save);
    assert(f.command("charter", { id: charter }).ok);
    const heirloom = item(f, "bronze_swords", {
      grade: "spring",
      treatment: "keen",
    });
    assert(
      f.command("retire", { confirmed: true, heirloomItemId: heirloom.id }).ok,
    );
    assert.equal(f.state.player.legacy.generation, 2);
    assert.equal(f.state.player.legacy.points, reward);
    assert.equal(f.state.house.champions, 0);
    assert.equal(f.state.inventory[0].id, heirloom.id);
    assert.equal(f.state.inventory[0].grade, "spring");
    assert(f.state.inventory[0].protected);
    assert(E.validateSave(f.exportSave(), f.data).ok);
    assert(
      f.command("create", {
        smithName: "Second generation",
        stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
      }).ok,
    );
    if (charter === "workforce") assert.equal(f.state.world.miners.length, 2);
    if (charter === "patron") assert.equal(f.state.player.gold, 72);
    if (charter === "archive") {
      assert.equal(f.state.house.upgrades.patterns, 1);
      assert(
        Object.values(f.state.player.proficiency).every((p) => p.level >= 4),
      );
    }
    assert(E.validateSave(f.exportSave(), f.data).ok);
  }
});
