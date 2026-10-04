"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const E = require("../house-engine"),
  D = require("../data");
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
function foundry() {
  const e = house();
  Object.assign(e.state.materials, { bronze: 10, tin: 10, fuel: 10, iron: 10 });
  e.state.materials.bronze_ingot = e.binCapacity() - 1;
  return e;
}

test("one partial smelt fills the bin; paid batches wait offline and resume after crafting", () => {
  const e = foundry();
  assert(e.command("smelt", { id: "bronze", quantity: 3 }).ok);
  e.state.lastWallTime = 1000000;
  const restored = new E(structuredClone(D), e.exportSave());
  restored.advanceOffline(1000000 + 3600000);
  assert.equal(restored.state.materials.bronze_ingot, restored.binCapacity());
  assert.equal(restored.state.workshop.smelted, 3);
  assert.equal(restored.state.world.materialsLost, 2);
  assert.equal(restored.state.workshop.jobs.length, 2);
  assert(restored.state.workshop.jobs.every((j) => j.status === "queued"));
  assert(!restored.command("smelt", { id: "bronze" }).ok);
  assert(
    restored.command("craft", { recipeId: "bronze_swords", intent: "team" }).ok,
  );
  restored.tick(25000);
  assert.equal(restored.state.workshop.smelted, 6);
  assert.equal(restored.state.workshop.jobs.length, 1);
  assert.equal(restored.state.world.materialsLost, 3);
  assert(E.validateSave(restored.exportSave(), restored.data).ok);
});

test("parallel furnaces reserve output space and can skip a blocked alloy", () => {
  const e = foundry();
  Object.assign(e.state.workshop.upgrades, { racks: 1, chambers: 1, iron: 1 });
  assert(e.command("smelt", { id: "bronze", quantity: 2 }).ok);
  assert.equal(
    e.state.workshop.jobs.filter((j) => j.status === "active").length,
    1,
  );
  assert(e.command("smelt", { id: "iron" }).ok);
  assert.equal(
    e.state.workshop.jobs.filter((j) => j.status === "active").length,
    2,
  );
  e.tick(40000);
  assert.equal(e.state.materials.iron_ingot, 2);
  assert.equal(e.state.world.materialsLost, 2);
  const waiting = e.state.workshop.jobs[0],
    before = { ...e.state.materials };
  assert.equal(waiting.status, "queued");
  assert(e.command("cancelSmelt", { id: waiting.id }).ok);
  for (const [id, n] of Object.entries(waiting.inputs))
    assert.equal(e.state.materials[id], before[id] + n);
});

test("mining crews are three times slower and manual loading takes fourteen seconds", () => {
  const e = house(),
    before = e.state.world.totalMined;
  assert.equal(e.seams().find((s) => s.id === "bronze").seconds, 135);
  e.tick(60000);
  assert.equal(e.state.world.totalMined, before);
  e.tick(120000);
  assert.equal(e.state.world.totalMined, before + 1);
  assert(e.command("mine", { materialId: "tin" }).ok);
  e.tick(13999);
  assert(!e.command("mine", { materialId: "tin" }).ok);
  e.tick(1);
  assert(e.command("mine", { materialId: "tin" }).ok);
});

test("all equipment recipes charge double ingots without repricing fuel or supplies", () => {
  const e = house();
  for (const r of Object.values(e.data.recipes))
    for (const [id, old] of Object.entries(e.data.preHouseRecipeInputs[r.id]))
      assert.equal(
        r.inputs[id],
        old * (id.endsWith("_ingot") ? 2 : 1),
        r.id + ":" + id,
      );
  assert.equal(e.craftPreview("bronze_swords").inputs.bronze_ingot, 2);
});

test("historical paid crafts reload, complete, or refund their original ingots exactly", () => {
  const e = house();
  e.state.materials.bronze_ingot = 10;
  assert(
    e.command("craft", {
      recipeId: "bronze_swords",
      quantity: 2,
      intent: "team",
    }).ok,
  );
  for (const j of e.state.jobs) {
    const old = e.data.preHouseRecipeInputs[j.recipeId];
    for (const [id, n] of Object.entries(j.inputs))
      e.state.materials[id] += n - old[id];
    j.inputs = { ...old };
    delete j.recipeCostVersion;
  }
  const raw = e.exportSave(),
    restored = new E(structuredClone(D), raw);
  const before = { ...restored.state.materials },
    job = restored.state.jobs[0];
  assert(restored.command("cancel", { jobId: job.id }).ok);
  for (const [id, n] of Object.entries(job.inputs))
    assert.equal(restored.state.materials[id], before[id] + n);
  restored.tick(120000);
  assert.equal(restored.state.stats.crafted, 1);
  assert(E.validateSave(restored.exportSave(), restored.data).ok);
  const invalid = JSON.parse(raw);
  invalid.state.jobs[0].inputs.bronze_ingot = 99;
  assert(!E.validateSave(invalid, restored.data).ok);
});
