"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const E = require("../house-engine"),
  D = require("../data");
const { browser, KEY } = require("./helpers/house-app-harness");
const hour = 3600000;
function fresh() {
  const e = new E(structuredClone(D));
  assert(
    e.command("create", {
      profession: "weaponsmith",
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    }).ok,
  );
  return e;
}

test("advanced patterns teach in proportion to their longer work without accelerating bronze", () => {
  const e = fresh(),
    r = e.data.recipes;
  assert.equal(r.bronze_swords.classXp, 6);
  for (const family of ["swords", "armor", "rings"]) {
    const first = r["bronze_" + family];
    for (const metal of ["iron", "steel", "mithril", "starforged"]) {
      const later = r[metal + "_" + family];
      assert(
        later.classXp / later.baseSeconds >=
          (first.classXp / first.baseSeconds) * 0.8,
        metal + " should not punish choosing advanced work",
      );
      assert(later.baseSeconds > first.baseSeconds);
      assert(later.smithXp > first.smithXp);
    }
  }
});

test("Forge learning preview matches earned XP including familiar work and the archive calling", () => {
  for (const profession of ["weaponsmith", "runesage"]) {
    const e = fresh(),
      s = e.state,
      r = e.data.recipes.bronze_swords;
    s.world.profession = profession;
    s.player.level = 15;
    s.player.proficiency.swords = { level: 25, xp: 0 };
    s.player.xp = 0;
    s.house.upgrades.patterns = 1;
    for (const id in r.inputs) s.materials[id] = 30;
    const v = e.learningPreview(r.id);
    assert(v.familiar);
    assert(
      e.command("craft", { recipeId: r.id, quantity: 1, intent: "stock" }).ok,
    );
    e.tick(e.state.jobs[0].completeAt - s.simTime + 1);
    assert.equal(s.stats.crafted, 1);
    assert(Math.abs(s.player.proficiency.swords.xp - v.mastery) < 1e-8);
    assert(Math.abs(s.player.xp - v.smith) < 1e-8);
    s.player.proficiency.swords.level = 100;
    assert.equal(e.learningPreview(r.id).mastery, 0);
  }
});

test("a free commission slot offers the highest capable tier if none is represented", () => {
  const e = fresh(),
    h = e.state.house;
  h.champions = 1;
  Object.assign(h.upgrades, { patterns: 1, patterns_2: 1, mine_iron: 1 });
  e.state.workshop.upgrades.iron = 1;
  for (const p of Object.values(e.state.player.proficiency)) p.level = 25;
  for (const k in e.state.player.stats) e.state.player.stats[k] = 30;
  const original = structuredClone(h.orders[0]);
  e._newContracts();
  assert.equal(h.orders.at(-1).tier, 2);
  assert.deepEqual(
    h.orders[0],
    original,
    "Existing signed jobs and prices are retained",
  );
  for (let n = 0; n < 10; n++) e._newContracts();
  assert.equal(h.orders.length, 6);
  assert(E.validateSave(e.exportSave(), e.data).ok);
});

test("exhibition purses diminish after twelve wins, survive reload and reset with the credited day", () => {
  const e = fresh(),
    c = e.state.house.campaign;
  const full = e.matchPurse(1, 2, "exhibition"),
    champion = e.matchPurse(1, 2, "champion");
  c.trainingWins = 11;
  assert.equal(e.matchPurse(1, 2, "exhibition"), full);
  c.trainingWins = 12;
  assert.equal(e.matchPurse(1, 2, "exhibition"), Math.floor(full * 0.25));
  assert.equal(e.matchPurse(1, 2, "champion"), champion);
  const loaded = new E(structuredClone(D), e.exportSave());
  assert.equal(loaded.matchPurse(1, 2, "exhibition"), Math.floor(full * 0.25));
  loaded.state.simTime = 24 * hour;
  assert.equal(loaded.matchPurse(1, 2, "exhibition"), full);
  loaded.state.house.champions = 4;
  assert.equal(
    loaded.matchPurse(1, 2, "exhibition"),
    Math.floor(full * 0.25),
    "Outgrown rivals never pay a current-league purse",
  );
});

test("a launched exhibition retains its quoted purse and pays once", () => {
  const e = fresh(),
    c = e.state.house.campaign,
    full = e.matchPurse(0, 0, "exhibition"),
    gold = e.state.player.gold;
  const m = {
    paid: false,
    kind: "exhibition",
    league: 0,
    rival: "choir",
    purse: full,
    snapshot: { heroes: [] },
    result: { victory: true, insight: "A completed exhibition." },
  };
  c.trainingWins = 12;
  e._settleMatch(m);
  e._settleMatch(m);
  assert.equal(e.state.player.gold, gold + full);
  assert.equal(c.revenue.exhibitions, full);
});

test("late production needs a real third championship and twenty-four commissions", () => {
  const e = fresh(),
    h = e.state.house;
  e.state.player.gold = 10000;
  h.upgrades.patterns_4 = 1;
  h.contracts = 24;
  h.champions = 2;
  assert(!e.upgradePreview("catalogue").eligible);
  h.champions = 3;
  h.contracts = 23;
  assert(!e.upgradePreview("catalogue").eligible);
  h.contracts = 24;
  assert(e.command("houseUpgrade", { id: "catalogue" }).ok);
  assert.equal(e.state.player.gold, 3800);
  assert(e.automationAccess("forge").eligible);
});

test("revised production quotas never bypass the first Legacy three-day floor", () => {
  const e = fresh(),
    s = e.state;
  s.house.champions = 5;
  s.house.campaign.tierCrafts = [12, 18, 22, 26, 30];
  s.house.campaign.tierContracts = [3, 4, 6, 8, 10];
  s.simTime = 72 * hour - 1;
  assert(!e.campaignStatus().legacyVisible);
  assert(!e.derived().legacyEligible);
  assert(!e.command("retire", { confirmed: true }).ok);
  s.simTime++;
  assert(e.campaignStatus().legacyVisible);
  assert(e.derived().legacyEligible);
});

test("missing production directs the milestone into marked Forge commissions", async () => {
  const e = fresh(),
    s = e.state;
  s.player.points = 0;
  s.stats.crafted = 12;
  s.house.contracts = 3;
  s.house.rung = 3;
  s.house.campaign.tierCrafts[0] = 12;
  s.house.campaign.tierContracts[0] = 0;
  e.markSaved(100000);
  const h = browser({ now: 100000 }, new Map([[KEY, e.exportSave()]]));
  await h.click("continue");
  assert(h.nodes.get("#app").innerHTML.includes("Find promotion work"));
  await h.click("forge-commissions");
  const html = h.nodes.get("#app").innerHTML;
  assert(html.includes("Promotion work · Tier 1"));
  assert(html.includes("PROMOTION CREDIT"));
});
