/* Controlled invariants; earned pace is measured separately by the scheduled player. */
"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const E = require("../house-engine"),
  D = require("../data"),
  C = require("../house-campaign"),
  H = require("../house-data");
const copy = (x) => structuredClone(x),
  hour = 3600000;
function fresh() {
  const e = new E(copy(D));
  assert(
    e.command("create", {
      profession: "weaponsmith",
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    }).ok,
  );
  return e;
}
function crown(e) {
  const s = e.state;
  s.simTime = 72 * hour;
  s.house.champions = 5;
  s.house.campaign.tierCrafts = [50, 50, 50, 50, 50];
  s.house.campaign.tierContracts = [20, 20, 20, 20, 20];
}
function valid(e) {
  const v = E.validateSave(e.exportSave(), e.data);
  assert(v.ok, v.message);
}
function gear(e) {
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
      if (r)
        u.equipment[slot] = {
          id: e._id("item"),
          recipeId: r.id,
          quality: 180,
          createdAt: e.state.simTime,
          makerGeneration: 1,
          protected: true,
          displayed: false,
          affixId: null,
          enchantmentId: null,
        };
    }
    if (e.data.recipes[u.equipment.weapon?.recipeId]?.twoHanded)
      u.equipment.offhand = null;
  }
}
test("Legacy remains absent until both full age and the fifth champion, including after reload", () => {
  const e = fresh();
  e.state.simTime = 100 * hour;
  assert(!e.campaignStatus().legacyVisible);
  crown(e);
  e.state.simTime = 72 * hour - 1;
  assert(!e.campaignStatus().legacyVisible);
  assert(!e.derived().legacyEligible);
  e.state.simTime++;
  assert(e.campaignStatus().legacyVisible);
  assert(new E(copy(D), e.exportSave()).campaignStatus().legacyVisible);
});
test("old bronze contracts cannot satisfy a higher-material accreditation", () => {
  const e = fresh();
  e.state.simTime = 24 * hour;
  e.state.house.champions = 1;
  e.state.house.campaign.tierCrafts[0] = 5000;
  e.state.house.campaign.tierContracts[0] = 2000;
  assert(!e.campaignStatus().eligible);
  assert.equal(e.campaignStatus().checks[1].current, 0);
});
test("repeat room upgrades require new licences while one-off automation remains reachable", () => {
  const e = fresh();
  e.state.player.gold = 1e5;
  assert(e.command("houseUpgrade", { id: "grinder" }).ok);
  assert(e.command("houseUpgrade", { id: "grinder" }).ok);
  const before = e.exportSave();
  assert(!e.command("houseUpgrade", { id: "grinder" }).ok);
  assert.equal(e.exportSave(), before);
  e.state.house.champions = 1;
  assert(e.command("houseUpgrade", { id: "grinder" }).ok);
});
test("low-tier smith experience tapers while advanced and inherited commissions remain meaningful", () => {
  const e = fresh();
  e.state.player.level = 35;
  assert(e.craftExperience(e.data.recipes.bronze_swords).smith < 0.05);
  assert.equal(e.craftExperience(e.data.recipes.starforged_swords).smith, 1);
  assert.equal(e.craftExperience(e.data.recipes.eternal_swords).smith, 1);
});
test("every relic family has seventeen distinct gated patterns and substantial inputs", () => {
  const e = fresh();
  for (const family of ["oath", "astral", "eternal"]) {
    const rs = Object.values(e.data.recipes).filter(
      (r) => r.familySet === family,
    );
    assert.equal(rs.length, 17);
    assert.equal(new Set(rs.map((r) => r.name)).size, 17);
    for (const r of rs) {
      assert(r.requires.statValue >= 85);
      assert(r.requires.proficiency >= 90);
      assert(r.inputs.starforged_ingot >= 12);
      assert(!e._recipeKnown(r));
    }
  }
});
test("decoding a pattern cannot bypass its generation or high attribute requirements", () => {
  const e = fresh();
  e.state.house.campaign.projects.push("oathfolio");
  assert(e._recipeKnown(e.data.recipes.oath_swords));
  let v = e.craftPreview("oath_swords");
  assert(!v.eligible);
  assert.match(v.reason, /generation/);
  e.state.player.legacy.generation = 2;
  v = e.craftPreview("oath_swords");
  assert(!v.eligible);
  assert(v.gates.some((g) => !g.met));
});
test("research completes once offline and is retained together with seals and an oath", () => {
  const e = fresh();
  crown(e);
  Object.assign(e.state.player, { gold: 10000 });
  e.state.house.campaign.discoveries.push("palimpsest");
  e.state.materials.steel_ingot = 8;
  assert(e.command("research", { id: "thermal" }).ok);
  assert(!e.command("retire", { confirmed: true }).ok);
  const ends = e.state.house.campaign.research.endsAt;
  e.state.simTime = ends - 1000;
  e.state.world.staffUpdatedAt = e.state.simTime;
  e.tick(1000, { offline: true });
  assert.deepEqual(e.state.house.campaign.projects, ["thermal"]);
  e.state.house.campaign.seals = 4;
  e.state.house.campaign.totalSeals = 4;
  assert(e.command("burden", { id: "embers" }).ok);
  assert(e.command("retire", { confirmed: true }).ok);
  assert.deepEqual(e.state.house.campaign.projects, ["thermal"]);
  assert.equal(e.state.house.campaign.seals, 4);
  assert.equal(e.state.house.campaign.burden, "embers");
  assert.equal(e.state.house.campaign.trialDepth, 0);
  valid(e);
});
test("Crucible rewards are paid once; replay inspection cannot farm seals", () => {
  const e = fresh();
  crown(e);
  gear(e);
  assert(e.command("ascend").ok);
  const m = e.activeMatch();
  assert.equal(m.result.victory, null);
  e.tick(m.endsAt - e.state.simTime);
  assert(m.result.victory);
  assert.equal(e.state.house.campaign.trialDepth, 1);
  assert.equal(e.state.house.campaign.seals, 1);
  const gold = e.state.player.gold;
  e.battleFrame(m.id, 0);
  e.battleFrame(m.id, m.result.duration);
  e._settleMatch(m);
  assert.equal(e.state.house.campaign.seals, 1);
  assert.equal(e.state.player.gold, gold);
  valid(e);
  assert(
    new E(copy(D), e.exportSave()).state.house.matches[0].kind === "trial",
  );
});
test("Crucible circles grow in difficulty and later generations open more depth", () => {
  const e = fresh();
  crown(e);
  const a = e.trialPreview();
  e.state.house.campaign.trialDepth = 3;
  const b = e.trialPreview();
  assert(b.enemies[0].health > a.enemies[0].health);
  e.state.house.campaign.trialDepth = 6;
  assert(!e.trialPreview().eligible);
  e.state.player.legacy.generation = 2;
  assert(e.trialPreview().eligible);
  e.state.house.campaign.trialDepth = 60;
  e.state.player.legacy.generation = 30;
  assert(!e.trialPreview().eligible);
});
test("inherited sigils consume exact permanent currency and scale the stats used in combat", () => {
  const e = fresh();
  crown(e);
  const c = e.state.house.campaign;
  c.seals = 4;
  c.totalSeals = 4;
  e.state.player.gold = 10000;
  const before = e.heroStats("mara");
  assert(e.command("lineage", { id: "edge" }).ok);
  assert.equal(c.seals, 2);
  assert.equal(e.state.player.gold, 8200);
  assert(Math.abs(e.heroStats("mara").attack / before.attack - 1.12) < 1e-9);
  assert(e.command("retire", { confirmed: true }).ok);
  assert.equal(e.state.house.campaign.lineage.edge, 1);
  valid(e);
});
test("set bonuses require matching pieces and appear in final fighter stats", () => {
  const e = fresh(),
    u = e.state.adventurers[0];
  const item = (id) => ({
    id: e._id("item"),
    recipeId: id,
    quality: 120,
    createdAt: 0,
    makerGeneration: 2,
  });
  u.equipment.weapon = item("oath_swords");
  let a = e.heroStats(u.id);
  assert(!a.traits.some((t) => t.startsWith("Oathbound pair")));
  u.equipment.body = item("oath_armor");
  a = e.heroStats(u.id);
  assert(a.traits.some((t) => t.startsWith("Oathbound pair")));
  const raw = e._heroStats(u);
  assert(Math.abs(a.health / raw.health - 1.15) < 1e-9);
});
test("a new oath affects only the next generation and restores after save", () => {
  const e = fresh();
  crown(e);
  const before = e.rivalStats("choir", 4, 2, true);
  assert(e.command("burden", { id: "iron" }).ok);
  assert.deepEqual(e.rivalStats("choir", 4, 2, true), before);
  assert(e.command("retire", { confirmed: true }).ok);
  assert(
    e.command("create", {
      profession: "weaponsmith",
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    }).ok,
  );
  const after = e.rivalStats("choir", 4, 2, true);
  assert(Math.abs(after[0].health / before[0].health - 1.2) < 1e-9);
  valid(e);
});
test("each room can evolve independently and grand scenes remain a later-generation discovery", () => {
  const e = fresh();
  Object.assign(e.state.house.upgrades, { crew: 4, picks: 4, carts: 4 });
  assert.equal(e.roomStage("mine"), 1);
  assert.equal(e.roomStage("forge"), 0);
  e.state.player.legacy.generation = 2;
  assert.equal(e.roomStage("mine"), 2);
  e.state.player.legacy.generation = 5;
  for (const n of Object.values(H.upgrades))
    e.state.house.upgrades[n.id] = n.max;
  e.state.house.campaign.projects = C.projects.map((p) => p.id);
  e.state.house.campaign.bestTrial = 20;
  e.state.house.campaign.trialDepth = 20;
  e.state.house.champions = 5;
  assert.equal(e.roomStage("mine"), 4);
  assert.equal(e.roomStage("arena"), 4);
  assert.equal(e.roomStage("legacy"), 4);
});
test("offline return itemises production, spending and new discoveries without duplicate credit", () => {
  const e = fresh();
  e.state.simTime = 8 * hour - 1000;
  e.state.workshop.smelted = 100;
  e.state.world.staffUpdatedAt = e.state.simTime;
  e.state.lastWallTime = 100000;
  const r = e.advanceOffline(101000).report;
  assert.equal(r.credited, 1000);
  assert(r.discoveries.includes("The singing crucible"));
  assert.equal(typeof r.contractGold, "number");
  assert.equal(typeof r.smelted, "number");
  const again = e.advanceOffline(101000).report;
  assert.equal(again.credited, 0);
  assert.deepEqual(again.discoveries, []);
  valid(e);
});
test("unknown research, forged trial depths and malformed permanent ranks are rejected atomically", () => {
  const e = fresh(),
    before = e.exportSave();
  assert(!e.command("research", { id: "missing" }).ok);
  assert.equal(e.exportSave(), before);
  const s = copy(e.state);
  s.house.campaign.lineage.edge = 999;
  assert(!E.validateSave(s, e.data).ok);
});
test("discovery-only enchantments are unavailable before their method is learned", () => {
  const e = fresh();
  e.state.player.level = 40;
  const req = e.data.enchantments.resonance.requires;
  assert(e._gates(req).some((g) => !g.met));
  e.state.house.campaign.discoveries.push("song");
  assert(e._gates(req).every((g) => g.met));
});

test("imported early campaign saves gain missing material ledgers and inherited sigils", () => {
  const e = fresh(),
    old = copy(e.state);
  delete old.house.campaign.lineage;
  delete old.house.campaign.tierCrafts;
  delete old.house.campaign.tierContracts;
  assert(e.importSave(old).ok);
  assert.deepEqual(e.state.house.campaign.lineage, { edge: 0, ward: 0 });
  assert.equal(e.campaignStatus().checks[1].current, 0);
  valid(e);
});

test("return ledger explains a spent supply allowance without making unauthorised purchases", () => {
  const e = fresh(),
    s = e.state;
  s.house.upgrades.catalogue = 1;
  s.house.catalogue = {
    enabled: true,
    recipeId: "bronze_swords",
    reserve: 0,
    autoBuy: true,
    rotate: false,
  };
  Object.assign(s.materials, { leather: 0, bronze_ingot: 10, fuel: 10 });
  s.automation.spendCap = 0;
  s.lastWallTime = 1000;
  const r = e.advanceOffline(2000).report;
  assert.equal(r.automationSpent, 0);
  assert.match(r.stopReason, /supply budget was exhausted/);
  valid(e);
});

test("controlled endgame: the sixtieth trial can be mastered, closes the ladder and records one permanent ending", () => {
  const e = fresh();
  crown(e);
  gear(e);
  const s = e.state,
    c = s.house.campaign;
  s.player.legacy.generation = 19;
  c.trialDepth = 59;
  c.bestTrial = 59;
  c.lineage = { edge: 80, ward: 80 };
  for (const u of s.adventurers)
    for (const slot of H.slots) {
      const r = Object.values(e.data.recipes).find(
        (r) =>
          r.variant === 7 &&
          r.slot === slot &&
          e.data.archetypes[u.archetypeId].preferences.includes(r.classId),
      );
      if (r)
        u.equipment[slot] = {
          ...u.equipment[slot],
          id: e._id("item"),
          recipeId: r.id,
          quality: 200,
          createdAt: s.simTime,
          protected: true,
          displayed: false,
          affixId: null,
          enchantmentId: null,
        };
    }
  for (const u of s.adventurers)
    if (e.data.recipes[u.equipment.weapon?.recipeId]?.twoHanded)
      u.equipment.offhand = null;
  assert(e.command("ascend").ok);
  const m = e.activeMatch();
  e.tick(180000);
  assert(m.result.victory);
  assert.equal(c.bestTrial, 60);
  assert.equal(c.trialDepth, 60);
  assert.equal(e.trialPreview().eligible, false);
  assert.match(e.trialPreview().reason, /sixty/);
  const ending = s.house.history.filter((x) =>
    x.text.includes("Hall of Makers"),
  );
  assert.equal(ending.length, 1);
  e._settleMatch(m);
  assert.equal(
    s.house.history.filter((x) => x.text.includes("Hall of Makers")).length,
    1,
  );
  valid(e);
});
