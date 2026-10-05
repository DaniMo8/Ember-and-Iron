"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const E = require("../house-engine"),
  D = require("../data"),
  C = require("../house-combat");
function fresh() {
  const e = new E(structuredClone(D));
  e.command("create", {
    profession: "weaponsmith",
    stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
  });
  return e;
}
test("a new bout holds only events that have happened, and snapshots cannot leak the outcome", () => {
  const e = fresh();
  assert(e.command("challenge", { rival: "choir" }).ok);
  const m = e.activeMatch();
  assert.equal(m.result.victory, null);
  assert.equal(m.result.events.length, 1);
  e.tick(500);
  assert(m.result.events.every((x) => x.at <= 500));
  assert.equal(m.result.victory, null);
  e.tick(5000);
  assert(m.result.events.some((x) => x.type === "strike"));
  assert(m.result.events.every((x) => x.at <= 5500));
});
test("saving during an exchange resumes the same combat rolls, event log and rewards", () => {
  const e = fresh();
  e.command("challenge", { rival: "thread" });
  e.tick(5300);
  const save = e.exportSave(),
    v = E.validateSave(save, e.data);
  assert(v.ok, v.message);
  const restored = new E(structuredClone(D), save);
  e.tick(180000);
  restored.tick(180000, { offline: true });
  const last = e.state.house.matches[0],
    again = restored.state.house.matches[0];
  assert.deepEqual(again.result, last.result);
  assert.equal(again.paid, true);
  assert.equal(restored.state.house.losses, e.state.house.losses);
  assert.equal(restored.state.house.wins, e.state.house.wins);
  assert.deepEqual(last.result, C.simulate(last.snapshot));
});
test("live combat is identical across small frames, event jumps and serialized resumes", () => {
  const e = fresh();
  e.command("challenge", { rival: "lantern" });
  const snapshot = e.activeMatch().snapshot,
    expected = C.simulate(snapshot);
  let { live, result } = C.create(snapshot);
  for (let time = 0; time <= 180000 && !live.done; time += 17) {
    C.advance(live, result, time);
    if (time === 1700)
      ({ live, result } = JSON.parse(JSON.stringify({ live, result })));
  }
  assert.deepEqual(result, expected);
});
test("version-one saved bouts settle and replay unchanged", () => {
  const e = fresh();
  e.command("challenge", { rival: "choir" });
  const m = e.activeMatch();
  m.snapshot.version = 1;
  m.result = C.simulate(m.snapshot);
  m.result.version = 1;
  delete m.live;
  m.endsAt = m.startedAt + Math.ceil(m.result.duration);
  const archive = structuredClone(m.result),
    restored = new E(structuredClone(D), e.exportSave());
  restored.tick(m.result.duration + 1000);
  assert.deepEqual(restored.state.house.matches[0].result, archive);
  assert(restored.state.house.matches[0].paid);
});
test("corrupt live turn clocks and combat numbers are rejected before import", () => {
  const e = fresh();
  e.command("challenge", { rival: "choir" });
  for (const mutate of [
    (m) => (m.live.heroes[0].interval = 0),
    (m) => (m.live.foes[0].next = -1),
    (m) => (m.live.turns = 10000),
    (m) => (m.live.seed = -2),
  ]) {
    const save = JSON.parse(e.exportSave());
    mutate(save.state.house.matches[0]);
    assert.equal(E.validateSave(save, e.data).ok, false);
  }
});
