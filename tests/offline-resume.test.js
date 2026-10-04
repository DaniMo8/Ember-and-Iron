"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const E = require("../house-engine"),
  D = require("../data");
const { browser, KEY } = require("./helpers/house-app-harness");
const ownedItems = (s) => [
  ...s.inventory,
  ...s.adventurers.flatMap((u) => Object.values(u.equipment).filter(Boolean)),
];
function house(now) {
  const e = new E(structuredClone(D));
  assert(
    e.command("create", {
      profession: "weaponsmith",
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    }).ok,
  );
  e.state.lastWallTime = now;
  return e;
}
function paidWork(e) {
  // Controlled supplies let all three production systems run in the same absence.
  Object.assign(e.state.materials, {
    bronze_ingot: 8,
    wood: 8,
    bronze: 8,
    tin: 5,
    fuel: 8,
  });
  assert(
    e.command("craft", {
      recipeId: "bronze_swords",
      quantity: 3,
      intent: "team",
    }).ok,
  );
  assert(e.command("smelt", { id: "bronze", quantity: 2 }).ok);
  for (const j of e.state.jobs)
    assert(e.command("technique", { jobId: j.id }).ok);
}
test("reloading active and queued work completes mining, smelting and finished team crafts offline", () => {
  const e = house(1000000);
  paidWork(e);
  const restored = new E(structuredClone(D), e.exportSave());
  assert.equal(restored.state.jobs.length, 3);
  assert.equal(restored.state.workshop.jobs.length, 2);
  const report = restored.advanceOffline(1000000 + 3600000).report;
  assert.equal(report.crafted, 3);
  assert(report.smelted > 0);
  assert(report.mined > 0);
  assert.equal(restored.state.jobs.length, 0);
  assert.equal(ownedItems(restored.state).length, 3);
  assert(
    ownedItems(restored.state).every((i) => i.protected && i.quality >= 58),
  );
  assert(E.validateSave(restored.exportSave(), restored.data).ok);
});
test("an old hidden tab must reload newer paid queues before reclaiming the save", async () => {
  const clock = { now: 1000000 },
    base = house(clock.now),
    storage = new Map([[KEY, base.exportSave()]]);
  const oldTab = browser(clock, storage, "old-tab");
  await oldTab.flush();
  await oldTab.visibility(true);
  clock.now += 10000;
  const newer = new E(structuredClone(D), storage.get(KEY));
  paidWork(newer);
  newer.state.lastWallTime = clock.now;
  storage.set(KEY, newer.exportSave());
  storage.set(
    KEY + "-owner",
    JSON.stringify({ owner: "new-tab", time: clock.now }),
  );
  clock.now += 10000; // The new tab closes or becomes hidden before the old tab returns.
  await oldTab.visibility(false);
  assert.equal(
    oldTab.engine.state.jobs.length + oldTab.engine.state.stats.crafted,
    3,
  );
  assert.equal(
    oldTab.engine.state.workshop.jobs.length +
      oldTab.engine.state.workshop.smelted / 3,
    2,
  );
});
test("loading while hidden must not mark the absence as played before offline catch-up", async () => {
  const clock = { now: 1000000 },
    e = house(clock.now);
  paidWork(e);
  const storage = new Map([[KEY, e.exportSave()]]);
  clock.now += 3600000;
  const tab = browser(clock, storage);
  // Real browsers can deliver visibilitychange before the deferred startup callback.
  await tab.visibility(true);
  assert.equal(tab.engine.state.stats.crafted, 3);
});

test("cold-load output is persisted and cannot be credited again after a second reload", async () => {
  const clock = { now: 1000000 },
    e = house(clock.now);
  paidWork(e);
  const storage = new Map([[KEY, e.exportSave()]]);
  clock.now += 3600000;
  const tab = browser(clock, storage);
  await tab.flush();
  assert.equal(tab.engine.state.stats.crafted, 3);
  assert.equal(tab.engine.state.workshop.smelted, 6);
  assert(tab.engine.state.world.totalMined > 0);
  await tab.click("continue");
  assert.match(tab.nodes.get("#modal-root").innerHTML, /While you were away/);
  assert.match(
    tab.nodes.get("#modal-root").innerHTML,
    /aria-label="Offline progress"/,
  );
  assert.match(
    tab.nodes.get("#modal-root").innerHTML,
    /Swords mastery reached/,
  );
  await tab.click("dismiss-return");
  assert.equal(tab.nodes.get("#modal-root").innerHTML, "");
  const saved = JSON.parse(storage.get(KEY)).state;
  assert.equal(ownedItems(saved).length, 3);
  assert.equal(saved.jobs.length, 0);
  assert.equal(saved.workshop.jobs.length, 0);
  await tab.window.emit("pagehide");
  const reopened = browser(clock, storage, "reopened");
  await reopened.flush();
  assert.equal(reopened.engine.state.stats.crafted, 3);
  assert.equal(ownedItems(reopened.engine.state).length, 3);
  assert.equal(reopened.engine.state.simTime, tab.engine.state.simTime);
});

test("a short absence retains unfinished paid jobs, order, finishing and material escrow", async () => {
  const clock = { now: 1000000 },
    e = house(clock.now);
  paidWork(e);
  const queued = structuredClone(e.state.jobs),
    materials = { ...e.state.materials };
  clock.now += 5000;
  const tab = browser(clock, new Map([[KEY, e.exportSave()]]));
  await tab.flush();
  assert.deepEqual(
    tab.engine.state.jobs.map((j) => j.id),
    queued.map((j) => j.id),
  );
  for (let i = 0; i < queued.length; i++) {
    assert.equal(tab.engine.state.jobs[i].finishPasses, queued[i].finishPasses);
    assert.deepEqual(tab.engine.state.jobs[i].inputs, queued[i].inputs);
  }
  assert.equal(tab.engine.state.materials.bronze_ingot, materials.bronze_ingot);
  assert.equal(tab.engine.state.materials.wood, materials.wood);
  assert.equal(tab.engine.state.simTime, 5000);
});

test("returning to an existing hidden tab advances all production once", async () => {
  const clock = { now: 1000000 },
    e = house(clock.now);
  paidWork(e);
  const tab = browser(clock, new Map([[KEY, e.exportSave()]]));
  await tab.flush();
  await tab.visibility(true);
  clock.now += 3600000;
  await tab.visibility(false);
  assert.equal(tab.engine.state.stats.crafted, 3);
  assert.equal(tab.engine.state.workshop.smelted, 6);
  assert.equal(tab.engine.state.simTime, 3600000);
  assert(tab.engine.state.offlineReport.mined > 0);
  await tab.visibility(false);
  assert.equal(tab.engine.state.simTime, 3600000);
});

test("hiding during chunked recovery cannot consume or restart the absence allowance", async () => {
  const clock = { now: 1000000 },
    e = house(clock.now);
  paidWork(e);
  const storage = new Map([[KEY, e.exportSave()]]);
  clock.now += 2 * 3600000;
  const tab = browser(clock, storage);
  await tab.step(); // First 15-minute catch-up chunk; the next chunk is deferred.
  assert.equal(tab.engine.state.simTime, 15 * 60000);
  await tab.visibility(true);
  assert.equal(tab.engine.state.simTime, 2 * 3600000);
  assert.equal(tab.engine.state.offlineSession.credited, 2 * 3600000);
  assert.equal(tab.engine.state.stats.crafted, 3);
  assert.equal(JSON.parse(storage.get(KEY)).state.lastWallTime, clock.now);
});

test("importing an older save completes its paid production before updating its timestamp", async () => {
  const clock = { now: 1000000 },
    e = house(clock.now);
  paidWork(e);
  const raw = e.exportSave();
  clock.now += 3600000;
  const tab = browser(clock);
  await tab.flush();
  const importing = tab.nodes.get("#import-file").emit("change", {
    target: {
      files: [{ size: raw.length, text: async () => raw }],
      value: "save.json",
    },
  });
  await Promise.resolve();
  await tab.flush();
  await importing;
  assert.equal(tab.engine.state.stats.crafted, 3);
  assert.equal(tab.engine.state.workshop.smelted, 6);
  assert.equal(ownedItems(JSON.parse(tab.storage.get(KEY)).state).length, 3);
});

test("closing an old tab cannot overwrite a newer queue after its lease expires", async () => {
  const clock = { now: 1000000 },
    base = house(clock.now),
    storage = new Map([[KEY, base.exportSave()]]);
  const oldTab = browser(clock, storage, "old-tab");
  await oldTab.flush();
  const newer = new E(structuredClone(D), storage.get(KEY));
  paidWork(newer);
  const raw = newer.exportSave();
  storage.set(KEY, raw);
  storage.set(
    KEY + "-owner",
    JSON.stringify({ owner: "new-tab", time: clock.now }),
  );
  clock.now += 10000;
  await oldTab.window.emit("pagehide");
  assert.equal(storage.get(KEY), raw);
});

test("reopening resumes automated mining, ingot targets, catalogue work and contract delivery together", async () => {
  const clock = { now: 1000000 },
    e = house(clock.now),
    s = e.state;
  s.player.gold = 2000;
  s.house.upgrades = { catalogue: 1, clerk: 1 };
  s.house.autoDeliver = true;
  s.house.catalogue = {
    enabled: true,
    recipeId: "bronze_swords",
    reserve: 0,
    autoBuy: true,
    rotate: true,
  };
  s.workshop.upgrades.stockkeeper = 1;
  s.workshop.smeltPolicy = {
    enabled: true,
    targets: { bronze: 14 },
    reserve: 0,
  };
  s.world.miners.push(
    { id: "miner-2", assigned: "fuel", working: "fuel", progress: 0 },
    { id: "miner-3", assigned: "tin", working: "tin", progress: 0 },
  );
  for (const id of ["bronze", "tin", "fuel", "bronze_ingot", "leather", "wood"])
    s.materials[id] = 14;
  const raw = e.exportSave();
  assert(E.validateSave(raw, e.data).ok);
  clock.now += 3600000;
  const expected = new E(structuredClone(D), raw);
  expected.advanceOffline(clock.now);
  const tab = browser(clock, new Map([[KEY, raw]]));
  await tab.flush();
  const report = tab.engine.state.offlineReport;
  assert(
    report.mined > 0 &&
      report.smelted > 0 &&
      report.crafted > 0 &&
      report.contracts > 0,
  );
  const production = (e) => ({
    materials: e.state.materials,
    gold: e.state.player.gold,
    crafted: e.state.stats.crafted,
    contracts: e.state.house.contracts,
    smelted: e.state.workshop.smelted,
    spent: e.state.offlineSession.spent,
  });
  assert.deepEqual(production(tab.engine), production(expected));
  assert(E.validateSave(tab.storage.get(KEY), e.data).ok);
});

test("a saved character-creation screen does not wait for nonexistent offline work", async () => {
  const clock = { now: 1000000 },
    e = new E(structuredClone(D));
  e.state.player.legacy.generation = 2;
  const tab = browser(clock, new Map([[KEY, e.exportSave()]]));
  await tab.click("preset");
  await tab.click("create");
  assert.equal(tab.engine.state.started, true);
  assert.equal(tab.engine.state.player.legacy.generation, 2);
});

test("an explicit run reset clears pending restoration so character creation still works", async () => {
  const clock = { now: 1000000 },
    e = house(clock.now);
  paidWork(e);
  const tab = browser(clock, new Map([[KEY, e.exportSave()]]));
  tab.nodes.set('[name="reset-confirm"]', { value: "RESET" });
  // Confirm before the deferred startup callback. The reset deliberately discards this queue.
  await tab.click("confirm-reset");
  assert.equal(tab.engine.state.started, false);
  await tab.click("preset");
  await tab.click("create");
  assert.equal(tab.engine.state.started, true);
  assert.equal(tab.engine.state.jobs.length, 0);
});
