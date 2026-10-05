const test = require("node:test");
const assert = require("node:assert/strict");
const core = import("../atelier/core.js");
const copy = (v) => JSON.parse(JSON.stringify(v));

test("atelier crafts keep their descriptor and protected team ownership after save/resume", async () => {
  const C = await core,
    s = C.fresh(100000),
    config = {
      material: "mithril",
      quality: 160,
      prefix: "precise",
      enchant: "starlight",
    };
  const { job } = C.commission(s, config, "team");
  C.advance(s, 4000);
  s.lastAt = 104000;
  const loaded = C.validateSave(copy(s), 104000);
  C.reconcile(loaded, 200000);
  const item = loaded.items.find((i) => i.id === job.id);
  assert.equal(item.location, "team");
  for (const [k, v] of Object.entries(config)) assert.equal(item[k], v);
  assert.equal(
    loaded.items.find((i) => i.id === "piece-1").location,
    "warehouse",
  );
  assert.equal(loaded.items.find((i) => i.id === "piece-1").protected, true);
  assert.equal(loaded.pending.crafted, 1);
  const gold = loaded.gold;
  C.reconcile(loaded, 200000);
  assert.equal(loaded.gold, gold);
  assert.equal(loaded.crafted, 1);
});
test("atelier cancellation refunds original escrow and reschedules the remaining queue", async () => {
  const C = await core,
    s = C.fresh(0),
    original = { gold: s.gold, metal: s.metal };
  const a = C.commission(s, { material: "steel" }, "team").job,
    b = C.commission(s, { material: "iron" }, "shelf").job;
  C.advance(s, 1000);
  assert(C.cancel(s, a.id));
  assert.equal(s.gold, original.gold - b.cost);
  assert.equal(s.metal, original.metal - b.metal);
  assert.equal(s.queue[0].startedAt, s.clock);
  assert.equal(s.queue[0].endsAt, s.clock + b.duration);
  assert(C.cancel(s, b.id));
  assert.equal(s.gold, original.gold);
  assert.equal(s.metal, original.metal);
  assert.equal(C.cancel(s, b.id), false);
});
test("atelier checkout sells the selected item once and never steals team gear", async () => {
  const C = await core,
    s = C.fresh(0),
    gold = s.gold,
    id = "piece-2",
    price = C.itemStats(s.items.find((i) => i.id === id)).value;
  C.advance(s, 14000);
  assert.equal(s.visitor.phase, "checkout");
  assert.equal(C.equip(s, id).ok, false);
  C.advance(s, 3000);
  assert.equal(s.items.find((i) => i.id === id).location, "sold");
  assert.equal(s.gold, gold + price);
  assert.equal(s.sales, 1);
  C.advance(s, 240000);
  assert.equal(s.sales, 1);
  assert.equal(s.items.find((i) => i.id === "piece-1").location, "team");
  assert.equal(s.gold, gold + price);
});
test("atelier offline and small live steps produce the same economy and battle", async () => {
  const C = await core,
    a = C.fresh(0);
  C.commission(a, { quality: 120, material: "steel" }, "team");
  C.commission(a, { quality: 85, material: "iron" }, "shelf");
  C.launch(a);
  const b = copy(a);
  C.advance(a, 180000);
  for (let n = 0; n < 6000; n++) C.advance(b, 30);
  assert.deepEqual(a, b);
  assert.notEqual(a.battle.status, "live");
  assert.equal(a.battle.settled, true);
});
test("atelier new team commissions wait for a live bout before replacing its gear", async () => {
  const C = await core,
    s = C.fresh(0);
  C.launch(s);
  const original = copy(s.battle.item),
    job = C.commission(s, { quality: 180, material: "steel" }, "team").job;
  C.advance(s, job.duration);
  if (s.battle.status === "live") {
    assert.equal(s.items.find((i) => i.id === job.id).location, "warehouse");
    assert.deepEqual(s.battle.item, original);
  }
  C.advance(s, 180000);
  assert.equal(s.items.find((i) => i.id === job.id).location, "team");
  assert.deepEqual(s.replay.item, original);
});
test("atelier front-line gating, collision positions and seeded replay stay deterministic", async () => {
  const C = await core,
    item = C.appearance({
      quality: 150,
      material: "steel",
      prefix: "piercing",
    }),
    b = C.newBattle(item, 19);
  let last = 0;
  while (b.status === "live") {
    const alive = new Map(
      b.units.map((u) => [u.id, { hp: u.hp, line: u.line, team: u.team }]),
    );
    C.tickBattle(b);
    for (const e of b.events.slice(last))
      if (e.type === "hit") {
        const target = alive.get(e.target);
        if (target.line === "back")
          assert(
            ![...alive.values()].some(
              (u) => u.team === target.team && u.line === "front" && u.hp > 0,
            ),
            "Rear hit while front still alive",
          );
        target.hp = Math.max(0, target.hp - e.damage);
      }
    last = b.events.length;
    for (const u of b.units) {
      assert(Number.isFinite(u.x) && Number.isFinite(u.z));
      assert(u.hp >= 0);
    }
  }
  assert(b.tick <= 2400);
  assert.deepEqual(C.simulateBattle(item, 19), b);
});
test("atelier quality improves the benchmark without replay or resume duplicating rewards", async () => {
  const C = await core;
  let low = 0,
    high = 0;
  for (let i = 1; i <= 12; i++) {
    low +=
      C.simulateBattle(C.appearance({ quality: 25, material: "bronze" }), i)
        .status === "won";
    high +=
      C.simulateBattle(
        C.appearance({
          quality: 180,
          material: "steel",
          prefix: "piercing",
          enchant: "flame",
        }),
        i,
      ).status === "won";
  }
  assert(high > low);
  const s = C.fresh(0);
  C.launch(s);
  C.advance(s, 180000);
  const gold = s.gold;
  C.simulateBattle(s.replay.item, 1);
  C.advance(s, 60000);
  assert.equal(s.gold, gold);
});
test("atelier return report survives reload until explicitly dismissed", async () => {
  const C = await core,
    s = C.fresh(10000);
  C.commission(s, { quality: 90 }, "team");
  C.reconcile(s, 80000);
  const report = copy(s.pending),
    loaded = C.validateSave(copy(s), 80000);
  assert.deepEqual(loaded.pending, report);
  C.reconcile(loaded, 80000);
  assert.deepEqual(loaded.pending, report);
});
