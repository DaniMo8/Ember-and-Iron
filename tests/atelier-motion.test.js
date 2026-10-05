const test = require("node:test"),
  assert = require("node:assert/strict");
const nav = import("../atelier/navigation.js"),
  motion = import("../atelier/motion.js"),
  core = import("../atelier/core.js");
const clone = (v) => JSON.parse(JSON.stringify(v));

test("all smith station routes clear furniture with body clearance", async () => {
  const N = await nav,
    stations = Object.values(N.FORGE_STATIONS);
  for (const a of stations)
    for (const b of stations) {
      const route = N.planRoute(
        a.position,
        b.position,
        N.FLOOR_OBSTACLES.forge,
      );
      assert.deepEqual(route.at(-1), b.position);
      for (let i = 1; i < route.length; i++)
        for (const obstacle of N.FLOOR_OBSTACLES.forge)
          assert(
            !N.crosses(route[i - 1], route[i], N.expand(obstacle, 0.23)),
            `${obstacle.name} clips ${JSON.stringify(route)}`,
          );
    }
});
test("buyers and empty-shop visitors leave continuously without crossing displays", async () => {
  const N = await nav;
  for (const bought of [true, false]) {
    let previous = null;
    for (const phase of [
      "enter",
      "browse",
      "consider",
      ...(bought ? ["checkout"] : []),
      "leave",
      "absent",
    ]) {
      const route = N.visitorRoute({
        phase,
        itemId: bought ? "piece" : null,
        departure: bought ? "counter" : "display",
      });
      if (previous)
        assert.deepEqual(route[0], previous, `jump entering ${phase}`);
      previous = route.at(-1);
      for (let i = 1; i < route.length; i++)
        for (const r of N.FLOOR_OBSTACLES.shop)
          assert(
            !N.crosses(route[i - 1], route[i], N.expand(r, 0.23)),
            `${phase} crosses ${r.name}`,
          );
    }
  }
  const route = [
    [0, 0],
    [0, 1],
    [3, 1],
  ];
  assert.equal(N.sampleRoute(route, 0.125).z, 0.5);
  assert.equal(N.sampleRoute(route, 0.5).x, 1);
});
test("hammer striking face points down and reaches the workpiece through the full stroke", async () => {
  const M = await motion;
  for (let i = 0; i <= 100; i++) {
    const p = M.hammerStroke((i * 1.45) / 100),
      theta = p.shoulder + p.elbow;
    const y =
      1.14 -
      0.22 * Math.cos(p.shoulder) -
      0.288 * Math.cos(theta) -
      0.025 * Math.sin(theta) +
      0.352 * Math.cos(theta + p.wrist);
    const forward =
      -0.22 * Math.sin(p.shoulder) -
      0.288 * Math.sin(theta) +
      0.025 * Math.cos(theta) +
      0.352 * Math.sin(theta + p.wrist);
    assert(Math.abs(y - p.headHeight) < 1e-8);
    assert(Math.abs(forward - p.headForward) < 1e-8);
    if (p.contact) {
      assert(
        Math.abs(theta + p.wrist - Math.PI / 2) < 0.015,
        "hammer face tilted at impact",
      );
      assert(
        Math.abs(y - 0.125 * 0.88 - 1.127) < 0.015,
        "hammer misses anvil height",
      );
      assert(
        Math.abs(1.1 - forward - 0.28) < 0.01,
        "hammer misses workpiece depth",
      );
    }
  }
});
test("new bouts preserve spacing, guard breaks and complete under every doctrine", async () => {
  const C = await core,
    item = C.appearance({
      quality: 120,
      material: "steel",
      prefix: "piercing",
    });
  for (const doctrine of ["balanced", "pressure", "bulwark"]) {
    const b = C.newBattle(item, 7, doctrine);
    let minimum = Infinity,
      guardRecovered = false;
    while (b.status === "live") {
      const guards = b.units.map((u) => u.guard);
      C.tickBattle(b);
      guardRecovered ||= b.units.some((u, i) => u.guard > guards[i]);
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j < 4; j++)
          minimum = Math.min(
            minimum,
            Math.hypot(
              b.units[i].x - b.units[j].x,
              b.units[i].z - b.units[j].z,
            ),
          );
    }
    assert(minimum >= 0.859, "fighters overlap");
    assert.notEqual(b.status, "draw", "a formation stalled");
    assert(b.events.some((e) => e.type === "guardbreak"));
    assert(guardRecovered);
    assert.deepEqual(b, C.simulateBattle(item, 7, doctrine));
  }
});
test("v1 and v2 live bouts survive save/resume with exact recorded outcomes", async () => {
  const C = await core;
  for (const version of [1, 2]) {
    const state = C.fresh(10000),
      item = state.items.find((i) => i.location === "team");
    state.battle = C.newBattle(item, 9, "bulwark", version);
    state.battle.tickAt = state.clock;
    state.battle.startedAt = state.clock;
    C.advance(state, 14000);
    const resumed = C.validateSave(clone(state), 24000);
    assert.equal(resumed.battle.version, version);
    C.advance(state, 180000);
    C.advance(resumed, 180000);
    assert.deepEqual(resumed.battle, state.battle);
    const replay = C.simulateBattle(item, 9, "bulwark", version);
    assert.deepEqual(replay.events, state.battle.events);
    assert.equal(replay.status, state.battle.status);
    assert.deepEqual(replay.units, state.battle.units);
  }
});
test("recorded v1 rules match the previously shipped combat exactly", async () => {
  const C = await core,
    crypto = require("node:crypto");
  const b = C.simulateBattle(
    C.appearance({ quality: 120, material: "steel", prefix: "piercing" }),
    9,
    "balanced",
    1,
  );
  assert.equal(
    crypto.createHash("sha256").update(JSON.stringify(b)).digest("hex"),
    "45a6c5b66f00724b14eee31c2a410b138b4c40c6d8696476e28e68b55855192f",
  );
});
