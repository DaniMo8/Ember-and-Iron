"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const E = require("../house-engine"),
  D = require("../data"),
  H = require("../house-data"),
  C = require("../house-combat"),
  W = require("../workshop-engine");
const clone = (x) => structuredClone(x);
function fresh(profession = "weaponsmith") {
  const e = new E(clone(D));
  assert(
    e.command("create", {
      smithName: "House test",
      profession,
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    }).ok,
  );
  return e;
}
function rich(e) {
  e.state.player.gold = 100000;
  e.state.player.level = 30;
  for (const id of Object.keys(e.state.materials))
    e.state.materials[id] = e.binCapacity();
  for (const p of Object.values(e.state.player.proficiency)) p.level = 30;
  e.state.player.stats = {
    strength: 80,
    precision: 80,
    charisma: 80,
    knowledge: 80,
  };
}
function item(e, recipeId, quality = 60, extra = {}) {
  const i = {
    id: e._id("item"),
    recipeId,
    quality,
    affixId: null,
    enchantmentId: null,
    createdAt: e.state.simTime,
    displayed: false,
    protected: false,
    reservedFor: null,
    makerGeneration: 1,
    ...extra,
  };
  e.state.inventory.push(i);
  return i;
}
function gear(e, tier = 1) {
  for (const u of e.state.adventurers)
    for (const slot of ["weapon", "body", "offhand", "ring", "charm", "tool"]) {
      const r = Object.values(e.data.recipes).find(
        (r) =>
          r.tier === tier &&
          r.variant === 1 &&
          r.slot === slot &&
          e.data.archetypes[u.archetypeId].preferences.includes(r.classId) &&
          (!r.twoHanded || slot !== "weapon"),
      );
      if (r) {
        const i = item(e, r.id, 80);
        e.command("equip", { heroId: u.id, itemId: i.id });
      }
    }
}
function settle(e) {
  const m = e.activeMatch();
  e.tick(m.endsAt - e.state.simTime);
  e.tick(50000);
  return m;
}

test("all seven callings create valid houses with twenty allocated points and authored fighters", () => {
  for (const id of Object.keys(H.professions)) {
    const e = fresh(id);
    assert.equal(e.state.adventurers.length, 3);
    assert.equal(e.state.player.points, 0);
    assert.equal(
      Object.values(e.state.player.stats).reduce((a, b) => a + b),
      20,
    );
    assert(E.validateSave(e.exportSave(), e.data).ok, id);
    assert.equal(e.state.house.orders.length, id === "merchant" ? 4 : 3);
  }
});
test("team commissions auto-equip and remain protected from contracts", () => {
  const e = fresh();
  rich(e);
  assert(
    e.command("craft", {
      recipeId: "bronze_daggers",
      intent: "team",
      heroId: "renn",
    }).ok,
  );
  e.tick(300000);
  const i = e.state.adventurers.find((u) => u.id === "renn").equipment.weapon;
  assert(i.protected);
  assert.equal(i.reservedFor, null);
  assert(!i.displayed);
  assert(!e.contractPreview(e.state.house.orders[0].id).items.includes(i));
  assert(E.validateSave(e.exportSave(), e.data).ok);
});
test("equipping is free and preserves both displaced pieces atomically", () => {
  const e = fresh();
  const hero = e.state.adventurers.find((u) => u.id === "mara"),
    sword = item(e, "bronze_swords"),
    shield = item(e, "bronze_shields");
  assert(e.command("equip", { heroId: hero.id, itemId: sword.id }).ok);
  assert(e.command("equip", { heroId: hero.id, itemId: shield.id }).ok);
  const other = item(e, "bronze_swords", 90),
    gold = e.state.player.gold;
  assert(e.command("equip", { heroId: hero.id, itemId: other.id }).ok);
  assert.equal(e.state.player.gold, gold);
  assert(e.state.inventory.find((i) => i.id === sword.id)?.protected);
  assert.equal(hero.equipment.offhand.id, shield.id);
  assert.equal(
    new Set(
      [
        ...e.state.inventory,
        ...Object.values(hero.equipment).filter(Boolean),
      ].map((i) => i.id),
    ).size,
    3,
  );
});
test("invalid equipment compatibility and full-storage swaps leave every item unchanged", () => {
  const e = fresh(),
    i = item(e, "bronze_bows");
  const before = e.exportSave();
  assert(!e.command("equip", { heroId: "mara", itemId: i.id }).ok);
  assert.equal(e.exportSave(), before);
});
test("house roster never buys equipment or automatically departs on Classic quests", () => {
  const e = fresh();
  item(e, "bronze_daggers");
  e.tick(3600000);
  assert.equal(e.state.runs.length, 0);
  assert.equal(e.state.stats.sold, 0);
  assert.equal(e.state.adventurers.length, 3);
  assert(e.state.adventurers.every((u) => u.status === "ready"));
});
test("a defeated unequipped team keeps gear and recovers without travel states", () => {
  const e = fresh();
  assert(e.command("challenge", { rival: "choir" }).ok);
  const m = e.activeMatch();
  e.tick(m.endsAt);
  assert(!m.result.victory);
  assert.equal(e.state.house.losses, 1);
  assert(!e.teamReady());
  assert(!e.state.house.activeMatch);
  e.tick(50000);
  assert(e.teamReady());
  assert.equal(e.state.runs.length, 0);
});
test("simulations are deterministic, protect the front line and have bounded logs", () => {
  const e = fresh();
  gear(e);
  e.command("challenge", { rival: "lantern" });
  const m = e.activeMatch();
  assert.deepEqual(C.simulate(m.snapshot), m.result);
  assert(m.result.events.length <= 602);
  for (let n = 1; n < m.result.events.length; n++) {
    const event = m.result.events[n],
      prior = m.result.events[n - 1];
    if (event.type !== "strike") continue;
    const units = event.targetId.startsWith("rival")
      ? prior.enemies
      : prior.heroes;
    if (units.some((u) => u.line === "front" && u.hp > 0))
      assert.equal(event.targetLine, "front");
  }
});
test("fixed opponent seed survives reload and upgrades affect only later matches", () => {
  const e = fresh();
  gear(e);
  e.command("challenge", { rival: "thread" });
  const first = clone(e.activeMatch());
  e.state.player.stats.strength += 20;
  const f = new E(clone(D), e.exportSave());
  assert.deepEqual(f.activeMatch().snapshot, first.snapshot);
  assert.deepEqual(f.activeMatch().result, first.result);
  assert(!f.command("unequip", { heroId: "mara", slot: "weapon" }).ok);
  settle(f);
  f.command("challenge", { rival: "thread" });
  assert.equal(f.activeMatch().snapshot.seed, first.snapshot.seed);
});
test("one match awards one win; five wins also require all three styles", () => {
  const e = fresh();
  gear(e, 5);
  for (let n = 0; n < 5; n++) {
    assert(e.command("challenge", { rival: "choir" }).ok);
    assert(settle(e).result.victory);
  }
  assert.equal(e.qualification().wins, 5);
  assert.equal(e.state.house.rung, 0);
  for (const rival of ["thread", "lantern"]) {
    assert(e.command("challenge", { rival }).ok);
    settle(e);
  }
  assert.equal(e.state.house.rung, 1);
  assert(E.validateSave(e.exportSave(), e.data).ok);
});
test("replaying or settling twice cannot pay again; exhibitions cannot qualify", () => {
  const e = fresh();
  gear(e, 5);
  e.command("challenge", { rival: "choir" });
  const m = settle(e),
    gold = e.state.player.gold,
    wins = e.qualification().wins;
  e.battleFrame(m.id, 0);
  e.battleFrame(m.id, m.result.duration);
  e._settleMatch(m);
  assert.equal(e.state.player.gold, gold);
  e.command("challenge", { rival: "choir", kind: "exhibition" });
  assert(settle(e).result.victory);
  assert.equal(e.qualification().wins, wins);
});
test("champion launch is gated and a win opens exactly the next material licence", () => {
  const e = fresh();
  rich(e);
  gear(e, 5);
  assert(!e.command("challenge", { kind: "champion" }).ok);
  assert(!e.smeltUpgradePreview("iron").eligible);
  e.state.house.rung = 3;
  // Controlled accreditation fixture; earned pacing is tested separately.
  e.state.simTime = 2 * 3600000;
  e.state.house.campaign.tierCrafts[0] = 12;
  e.state.house.campaign.tierContracts[0] = 3;
  assert(e.command("challenge", { kind: "champion" }).ok);
  settle(e);
  assert.equal(e.state.house.champions, 1);
  assert.equal(e.state.house.rung, 0);
  assert(e.smeltUpgradePreview("iron").eligible);
  assert(!e.smeltUpgradePreview("steel").eligible);
  assert(!e.derived().legacyEligible);
});
test("contracts deliver only matching unprotected stock and disclose a once-only price", () => {
  const e = fresh(),
    o = e.state.house.orders[0],
    r = o.recipeId;
  for (let n = 0; n < o.quantity; n++) item(e, r, o.quality + 1);
  const protectedItem = item(e, r, 100, { protected: true }),
    gold = e.state.player.gold;
  assert(e.command("deliverContract", { id: o.id }).ok);
  assert.equal(e.state.player.gold, gold + o.payment);
  assert(e.state.inventory.some((i) => i.id === protectedItem.id));
  assert(!e.command("deliverContract", { id: o.id }).ok);
  assert.equal(e.state.house.contracts, 1);
  assert(E.validateSave(e.exportSave(), e.data).ok);
});
test("a zero-gold opening can sell mined ore, buy supplies and fulfil basic work", () => {
  const e = fresh();
  e.state.player.gold = 0;
  e.state.materials.wood = e.state.materials.leather = 0;
  assert(e.command("sellMaterial", { materialId: "bronze", quantity: 5 }).ok);
  assert(e.state.player.gold > 0);
  assert(e.command("buyMaterial", { materialId: "leather", quantity: 1 }).ok);
  assert(e.state.house.orders.some((o) => o.tier === 1));
});
test("house upgrades spend gold, retain earned records and grow exponentially", () => {
  const e = fresh();
  rich(e);
  const mined = e.state.world.totalMined,
    rep = e.state.player.reputation,
    cost = e.upgradePreview("picks").cost;
  assert(e.command("houseUpgrade", { id: "picks" }).ok);
  assert.equal(e.state.player.gold, 100000 - cost);
  assert.equal(e.state.world.totalMined, mined);
  assert.equal(e.state.player.reputation, rep);
  assert.equal(e.upgradePreview("picks").cost, Math.ceil(cost * 1.9));
});
test("paid prefix treatment and metal properties persist on the completed item", () => {
  const e = fresh();
  rich(e);
  e.state.house.upgrades.treatment = 1;
  const gold = e.state.player.gold;
  assert(
    e.command("craft", {
      recipeId: "bronze_daggers",
      treatment: "keen",
      intent: "team",
    }).ok,
  );
  e.tick(300000);
  const i = e.state.adventurers
    .flatMap((u) => Object.values(u.equipment))
    .find((i) => i?.recipeId === "bronze_daggers");
  assert.equal(i.treatment, "keen");
  assert(e._itemCombat(i).armorPen >= 2);
  assert.equal(e.state.player.gold, gold); // Oathblade mastery makes Keen preparation free.
});
test("cancelled treated work refunds its exact gold and material escrow", () => {
  const e = fresh("merchant");
  rich(e);
  e.state.house.upgrades.treatment = 1;
  e.state.materials.fuel = 10;
  const before = clone(e.state.materials),
    gold = e.state.player.gold;
  assert(
    e.command("craft", { recipeId: "bronze_daggers", treatment: "reinforced" })
      .ok,
  );
  assert(e.state.player.gold < gold);
  assert(e.command("cancel", { jobId: e.state.jobs[0].id }).ok);
  assert.equal(e.state.player.gold, gold);
  assert.deepEqual(e.state.materials, before);
});
test("graded smelting reserves and refunds extra coal, then records actual accepted output", () => {
  const e = fresh();
  rich(e);
  e.command("hireStaff", { staffId: "assayer" });
  e.state.materials.bronze_ingot = 0;
  e.state.materials.fuel = 10;
  const inputs = clone(e.state.materials);
  assert(e.command("smelt", { id: "bronze", grade: "tough" }).ok);
  assert.equal(e.state.materials.fuel, 8);
  assert(e.command("cancelSmelt", { id: e.state.workshop.jobs[0].id }).ok);
  assert.deepEqual(e.state.materials, inputs);
  e.command("smelt", { id: "bronze", grade: "tough" });
  e.tick(30000);
  assert.equal(e.state.house.graded.bronze.tough, 3);
  assert(E.validateSave(e.exportSave(), e.data).ok);
});
test("online, offline and save-reloaded active bouts have the same result and payout", () => {
  const e = fresh();
  gear(e);
  e.command("challenge", { rival: "choir" });
  const f = new E(clone(D), e.exportSave());
  e.tick(120000, { offline: true });
  for (let n = 0; n < 120; n++) f.tick(1000);
  assert.deepEqual(e.state.house, f.state.house);
  assert.equal(e.state.player.gold, f.state.player.gold);
});
test("Classic migration is explicit, preserves investments and does not claim arena wins", () => {
  const classic = new W(clone(D));
  classic.command("create", {
    smithName: "Classic",
    stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
  });
  const raw = classic.exportSave();
  assert(!E.validateSave(raw, classic.data).ok);
  const v = E.convertClassic(raw, classic.data);
  assert(v.ok);
  const e = new E(clone(D), v.data);
  assert.equal(e.state.player.gold, classic.state.player.gold);
  assert.deepEqual(e.state.player.stats, classic.state.player.stats);
  assert.equal(e.state.house.wins, 0);
  assert.equal(e.state.house.champions, 0);
  assert.equal(classic.exportSave(), raw);
  assert(E.validateSave(e.exportSave(), e.data).ok);
});
test("first-visit explanations persist independently per room and invalid saves are rejected", () => {
  const e = fresh();
  e.command("seen", { room: "mine" });
  const f = new E(clone(D), e.exportSave());
  assert.deepEqual(f.state.house.seen, ["mine"]);
  const raw = JSON.parse(e.exportSave());
  raw.state.house.champions = 9;
  assert(!E.validateSave(raw, e.data).ok);
});

test("catalogue respects an offline purchase budget across save reloads", () => {
  const e = fresh();
  e.state.player.gold = 100;
  e.state.house.upgrades.catalogue = 1;
  const r = e.data.recipes.bronze_swords;
  e.state.house.orders = [
    {
      id: "budget-order",
      client: "Watch",
      classId: r.classId,
      tier: 1,
      quality: 10,
      quantity: 6,
      payment: 50,
      recipeId: r.id,
    },
  ];
  Object.assign(e.state.materials, {
    bronze_ingot: 20,
    fuel: 20,
    leather: 0,
    wood: 0,
  });
  assert(
    e.command("housePolicy", {
      offlineBudget: 2,
      catalogue: { enabled: true, recipeId: r.id, reserve: 0, autoBuy: true },
    }).ok,
  );
  e.tick(900000, { offline: true });
  assert(e.state.offlineSession.spent > 0);
  assert(e.state.offlineSession.spent <= 2);
  const f = new E(clone(D), e.exportSave());
  f.tick(900000, { offline: true });
  assert.equal(f.state.offlineSession.spent, e.state.offlineSession.spent);
  assert(E.validateSave(f.exportSave(), f.data).ok);
});

test("catalogue never buys or forges below the disclosed contract quality", () => {
  const e = fresh();
  e.state.player.gold = 100;
  e.state.house.upgrades.catalogue = 1;
  e.state.house.orders = [
    {
      id: "fine",
      classId: "swords",
      tier: 1,
      quality: 100,
      quantity: 2,
      payment: 50,
      recipeId: "bronze_swords",
    },
  ];
  Object.assign(e.state.materials, { bronze_ingot: 20, fuel: 20, leather: 0 });
  e.command("housePolicy", {
    offlineBudget: 20,
    catalogue: {
      enabled: true,
      recipeId: "bronze_swords",
      reserve: 0,
      autoBuy: true,
    },
  });
  e.tick(300000, { offline: true });
  assert.equal(e.state.stats.crafted, 0);
  assert.equal(e.state.jobs.length, 0);
  assert.equal(e.state.offlineSession.spent, 0);
  assert.match(e.catalogueStatus(), /below the order/);
});

test("invalid match and mixed policy commands are atomic, and champion stats cannot be lowered", () => {
  const e = fresh();
  const original = e.exportSave();
  for (const payload of [
    { league: -1 },
    { rung: NaN },
    { kind: "free" },
    { rival: "missing" },
  ])
    assert(!e.command("challenge", payload).ok);
  assert.equal(e.exportSave(), original);
  assert(
    !e.command("housePolicy", { offlineBudget: 10, autoDeliver: "yes" }).ok,
  );
  assert.equal(
    e.state.automation.spendCap,
    JSON.parse(original).state.automation.spendCap,
  );
  e.state.house.rung = 3;
  assert.deepEqual(
    e.matchPreview({ kind: "champion", rung: 0, rival: "thread" }).enemies,
    e.matchPreview({ kind: "champion", rung: 2, rival: "choir" }).enemies,
  );
});

test("mage cleave respects front lines and guardians protect their allies", () => {
  const unit = (id, line, extra = {}) => ({
    id,
    name: id,
    line,
    health: 100,
    attack: 10,
    armor: 0,
    interval: 2,
    crit: 0,
    evasion: 0,
    block: 0,
    resistances: {},
    ...extra,
  });
  const snapshot = {
    version: 1,
    seed: 45,
    heroes: [
      unit("mage", "back", { aoe: 0.25, damageType: "arcane", interval: 1 }),
    ],
    enemies: [
      unit("guard-a", "front"),
      unit("guard-b", "front"),
      unit("rear", "back"),
    ],
  };
  const result = C.simulate(snapshot),
    first = result.events.find((e) => e.type === "strike");
  assert(first.enemies[0].hp < 100 && first.enemies[1].hp < 100);
  assert.equal(first.enemies[2].hp, 100);
  const guarded = clone(snapshot);
  guarded.heroes[0].aoe = 0;
  guarded.enemies[1].guardian = true;
  guarded.enemies[1].protection = 0.2;
  const normal = clone(guarded);
  normal.enemies[1].guardian = false;
  const a = C.simulate(guarded).events.find(
      (e) => e.type === "strike" && e.targetId === "guard-a",
    ),
    b = C.simulate(normal).events.find(
      (e) => e.type === "strike" && e.targetId === "guard-a",
    );
  assert(a.damage < b.damage);
});

test("commercial price bonuses apply once to contracts and affect town offers", () => {
  const e = fresh();
  for (const r of Object.values(e.data.recipes)) r.basePrice = 100;
  e._newContracts();
  const before = e.state.house.orders[0].payment;
  const piece = item(e, "bronze_swords", 80),
    town = e.salePreview(piece.id).price;
  e.state.house.upgrades.shop_prices = 6;
  e._newContracts();
  assert(e.state.house.orders[0].payment <= Math.ceil(before * 1.36));
  assert(e.state.house.orders[0].payment >= Math.floor(before * 1.36));
  assert(e.salePreview(piece.id).price > town);
  e.state.house.contracts = 5;
  e.state.player.gold = 1000;
  e.state.player.reputation = 0;
  assert.match(e.upgradePreview("patrons").reason, /reputation/);
});

test("displayed and compared fighter stats include the same doctrine as the frozen match", () => {
  const e = fresh();
  gear(e);
  e.state.house.upgrades.doctrine = 1;
  assert(e.command("formation", { doctrine: "hold" }).ok);
  const expected = e.heroStats("mara");
  assert(expected.armor > e._heroStats(e.state.adventurers[0]).armor);
  const next = item(e, "bronze_swords", 95),
    preview = e.equipmentPreview("mara", next.id);
  assert.deepEqual(preview.before, expected);
  assert(e.command("equip", { heroId: "mara", itemId: next.id }).ok);
  assert.deepEqual(e.heroStats("mara"), preview.after);
  assert(e.command("challenge", { rival: "choir" }).ok);
  const frozen = e.activeMatch().snapshot.heroes.find((u) => u.id === "mara");
  for (const stat of ["attack", "health", "armor", "interval", "block"])
    assert.equal(frozen[stat], preview.after[stat]);
});
