/* Independent earned campaign policy. Node only: no browser, player saves,
 * private state writes, resource grants or advance knowledge of battle rolls.
 * Reads game state/previews; all gameplay mutations use command()/tick().
 * Usage: node design/qa/house-campaign-probe.js --days=7 --label=baseline
 * Optional --profession=runesage --steps=20 --resume=checkpoint --wall=hours
 * --retire retires an eligible earned checkpoint, buys a fixed useful legacy
 * package and starts generation2. --stop-at-crown stops once Legacy opens.
 */
"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, "../..");
const copy = (x) => JSON.parse(JSON.stringify(x)),
  args = Object.fromEntries(
    process.argv.slice(2).map((x) => {
      const [k, ...v] = x.replace(/^--/, "").split("=");
      return [k, v.length ? v.join("=") : true];
    }),
  );
const runtime = args.runtime ? path.resolve(root, String(args.runtime)) : root,
  Engine = require(path.join(runtime, "house-engine")),
  Data = require(path.join(runtime, "data")),
  H = require(path.join(runtime, "house-data")),
  W = require(path.join(runtime, "workshop"));
const hour = 3600000,
  minute = 60000,
  days = Number(args.days || 7),
  step = Number(args.steps || 20) * 1000;
const label = String(args.label || "current").replace(/[^a-zA-Z0-9_-]/g, "-"),
  profession = args.profession || "weaponsmith";
const resume = args.resume
    ? fs.readFileSync(path.resolve(root, String(args.resume)), "utf8")
    : null,
  e = new Engine(copy(Data), resume);
const out = {
  generated: new Date().toISOString(),
  label,
  profession,
  method: {
    earned: true,
    resourceGrants: false,
    mutations:
      "Public commands and tick only; deterministic default seed. No combat-outcome lookahead.",
    policy: args.prepared
      ? "Promotion-aware, batching and paid queues"
      : "Original generalist",
    schedule:
      "First day: active hour 0–1 then 15 minutes at hours 2,4,6. Subsequent days: 15 minutes at hours 0,2,4,6. Remaining time is offline, including overnight. Actions evaluated every " +
      step / 1000 +
      " seconds while active.",
    days,
    policyHash: crypto
      .createHash("sha256")
      .update(fs.readFileSync(__filename))
      .digest("hex"),
  },
  files: Object.fromEntries(
    [
      "house-engine.js",
      "house-data.js",
      "house-combat.js",
      "house-campaign.js",
      "house-workflow.js",
      "workshop-engine.js",
    ]
      .filter((f) => fs.existsSync(path.join(runtime, f)))
      .map((f) => [
        f,
        crypto
          .createHash("sha256")
          .update(fs.readFileSync(path.join(runtime, f)))
          .digest("hex"),
      ]),
  ),
  actions: {},
  rejections: {},
  milestones: [],
  sessions: [],
  periods: [],
};
let wall = Number(args.wall || e.state.simTime / hour) * hour,
  activeMs = 0,
  actionsSince = 0,
  nextEconomy = 0,
  lastChampion = e.state.house.champions,
  lastContracts = 0,
  lastCrafts = 0,
  lastLossAt = -hour,
  lastLossSignature = "",
  target = null,
  production = null,
  session = 0;
let matchObserved = 0,
  baseline = {},
  completedIds = new Set(),
  recentGoals = [];
let previews = new Map(),
  scores = new Map();
function preview(id) {
  if (!previews.has(id)) previews.set(id, e.craftPreview(id));
  return previews.get(id);
}
function learning(r) {
  if (e.learningPreview) return e.learningPreview(r.id).mastery;
  // Released builds expose the same familiar-pattern penalty through their rules.
  const level = e.state.player.proficiency[r.classId].level;
  return level >= 100
    ? 0
    : r.classXp *
        (1 +
          0.06 * e.state.player.stats.knowledge +
          (e._effects().proficiencyXp || 0)) *
        (r.tier === 1 && level >= 25 ? 0.25 : 1) +
        (e.state.world.profession === "runesage" ? r.classXp * 0.2 : 0);
}
function command(name, p = {}) {
  previews.clear();
  scores.clear();
  const r = e.command(name, p);
  if (r.ok) {
    out.actions[name] = (out.actions[name] || 0) + 1;
    actionsSince++;
  } else {
    const k = name + ": " + r.message;
    out.rejections[k] = (out.rejections[k] || 0) + 1;
  }
  return r;
}
if (!e.state.started) {
  const created = command("create", {
    smithName: "Campaign reviewer",
    name: "Earned test house",
    profession,
    origin: "village",
    vow: "patient",
    stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
  });
  if (!created.ok) throw Error(created.message);
} else
  out.method.resume = {
    file: args.resume,
    wallHours: wall / hour,
    simHours: e.state.simTime / hour,
    note: "Continuation of an earned checkpoint; no resources changed.",
  };
function saveProgress() {
  out.latest = snapshot();
  out.recentGoals = recentGoals;
  fs.writeFileSync(
    path.join(__dirname, "house-campaign-" + label + ".json"),
    JSON.stringify(out, null, 2),
  );
  fs.writeFileSync(
    path.join(__dirname, "house-campaign-" + label + "-checkpoint.json"),
    e.exportSave(),
  );
}
function snapshot() {
  const s = e.state,
    h = s.house;
  return {
    wallHours: wall / hour,
    simHours: s.simTime / hour,
    activeMinutes: activeMs / minute,
    generation: s.player.legacy.generation,
    gold: s.player.gold,
    smith: s.player.level,
    stats: copy(s.player.stats),
    points: s.player.points,
    champions: h.champions,
    rung: h.rung,
    wins: h.wins,
    losses: h.losses,
    contracts: h.contracts,
    crafts: s.stats.crafted,
    miners: s.world.miners.length,
    mined: s.world.totalMined,
    smelted: s.workshop.smelted,
    mastery: Object.fromEntries(
      Object.entries(s.player.proficiency).map(([k, v]) => [k, v.level]),
    ),
    levels: s.adventurers.map((x) => [x.id, x.level]),
    upgrades: copy(h.upgrades),
    smelter: copy(s.workshop.upgrades),
    inventory: s.inventory.length,
    queuedCrafts: s.jobs.length,
    queuedSmelts: s.workshop.jobs.length,
    orders: h.orders.map((o) => ({
      tier: o.tier,
      kind: o.kind,
      quantity: o.quantity,
    })),
    catalogue: e.catalogueStatus(),
    smeltStatus: e.smeltPolicyStatus(),
    campaign:
      typeof e.campaignStatus === "function" ? e.campaignStatus() : null,
    campaignRecords: copy(h.campaign || null),
    discoveries:
      typeof e.discoverySummary === "function" ? e.discoverySummary() : null,
    legacyEligible: e.derived().legacyEligible,
  };
}
function note(event, detail = {}) {
  out.milestones.push({
    event,
    wallHours: wall / hour,
    simHours: e.state.simTime / hour,
    ...detail,
  });
}
function valid() {
  const v = Engine.validateSave(e.exportSave(), e.data);
  if (!v.ok) throw Error("Invalid earned save: " + v.message);
  return true;
}
function tick(ms, offline = false) {
  previews.clear();
  scores.clear();
  const before = e.state.simTime;
  const r = e.tick(ms, { offline });
  if (!r.ok) throw Error(r.message);
  wall += ms;
  if (!offline) activeMs += ms;
  const actual = e.state.simTime - before;
  observe();
  return actual;
}
function observe() {
  const h = e.state.house;
  if (h.champions > lastChampion) {
    lastChampion = h.champions;
    note("champion", {
      tier: h.champions,
      gold: e.state.player.gold,
      crafts: e.state.stats.crafted,
      contracts: h.contracts,
      team: e.state.adventurers
        .filter((u) => h.team.includes(u.id))
        .map((u) => ({
          id: u.id,
          level: u.level,
          equipment: copy(u.equipment),
        })),
    });
  }
  for (const m of h.matches.filter((m) => m.paid)) {
    if (completedIds.has(m.id)) continue;
    completedIds.add(m.id);
    if (m.kind === "exhibition") continue;
    note(m.kind, {
      league: m.league,
      rung: m.rung,
      rival: m.rival,
      victory: m.result.victory,
      insight: m.result.insight,
    });
    if (!m.result.victory) {
      lastLossAt = wall;
      lastLossSignature = teamSignature();
    }
  }
  if (!lastContracts && h.contracts) {
    lastContracts = h.contracts;
    note("first contract", { gold: e.state.player.gold });
  }
  if (!lastCrafts && e.state.stats.crafted) {
    lastCrafts = e.state.stats.crafted;
    note("first craft");
  }
}
function teamSignature() {
  return (
    e.state.house.team
      .map((id) => {
        const u = e.state.adventurers.find((u) => u.id === id);
        return [
          u.level,
          ...Object.values(u.equipment)
            .filter(Boolean)
            .map((i) => i.id),
        ].join("/");
      })
      .join("|") +
    "|" +
    e.state.house.doctrine
  );
}
function qualifies(r) {
  const v = preview(r.id);
  return v.gates.every((g) => g.met || g.source === "Quarry or material shop");
}
function known(r) {
  return preview(r.id).gates.every(
    (g) =>
      g.met ||
      ["Quarry or material shop", "Class mastery", "Smith attributes"].includes(
        g.source,
      ),
  );
}
function itemScore(i) {
  if (!i) return 0;
  const key = JSON.stringify(i);
  if (scores.has(key)) return scores.get(key);
  const result = scoreItem(i);
  scores.set(key, result);
  return result;
}
function fireResponse() {
  return (
    args.prepared &&
    (e.state.house.champions === 2 ||
      e.state.house.matches.find(
        (m) => m.paid && !m.result.victory && m.kind !== "exhibition",
      )?.rival === "lantern")
  );
}
function scoreItem(i) {
  const r = e.data.recipes[i.recipeId],
    s = e._itemCombat(i);
  return (
    ((s.attack || 0) * 14) / (r.slot === "weapon" ? (s.interval || 2) / 2 : 1) +
    (s.health || 0) +
    (s.armor || 0) * 12 +
    (s.armorPen || 0) * 9 +
    (s.block || 0) * 120 +
    (s.evasion || 0) * 100 +
    (s.crit || 0) * 60 +
    Object.values(s.resistances || {}).reduce((a, b) => a + b, 0) *
      (fireResponse() ? 300 : 80)
  );
}
function canHero(u, r, slot = r.slot) {
  const a = e.data.archetypes[u.archetypeId];
  return (
    a.preferences.includes(r.classId) &&
    !(
      slot === "offhand" &&
      e.data.recipes[u.equipment.weapon?.recipeId]?.twoHanded
    )
  );
}
function allocate() {
  const s = e.state.player,
    tier = Math.min(5, e.state.house.champions + 1),
    floor = [0, 5, 10, 16, 24, 34][tier];
  while (s.points) {
    let stat = ["strength", "precision", "knowledge"].find(
      (k) => s.stats[k] < floor,
    );
    if (!stat) {
      const ratios = {
        strength: s.stats.strength / 0.65,
        precision: s.stats.precision,
        knowledge: s.stats.knowledge / 1.15,
        charisma: s.stats.charisma / 0.3,
      };
      stat = Object.keys(ratios).sort((a, b) => ratios[a] - ratios[b])[0];
    }
    command("allocate", { stat });
  }
}
function upgrade(id, room = "house", reserve = 30) {
  const f = room === "house" ? e.upgradePreview(id) : e.smeltUpgradePreview(id);
  if (f.eligible && e.state.player.gold - f.cost >= reserve) {
    const r = command(room === "house" ? "houseUpgrade" : "smeltUpgrade", {
      id,
    });
    if (r.ok) note("upgrade", { id, rank: f.rank + 1, cost: f.cost });
    return r.ok;
  }
  return false;
}
function invest() {
  const s = e.state,
    h = s.house;
  if (
    args.research &&
    s.player.legacy.generation > 1 &&
    e.talentPreview("rare_archive").eligible
  ) {
    command("talent", { talentId: "rare_archive" });
    note("inherited rare patterns");
  }
  if (args.research && typeof e.projectPreview === "function")
    for (const id of ["dispatch", "thermal", "survey", "oathfolio"]) {
      const v = e.projectPreview(id);
      if (v.visible && !v.owned && s.player.gold > v.gold + 1500) {
        for (const [k, n] of Object.entries(v.inputs || {})) supply(k, n);
        const ready = e.projectPreview(id);
        if (ready.eligible) {
          command("research", { id });
          note("research started", {
            id,
            finishesAtHours:
              (e.state.house.campaign.research?.endsAt || 0) / hour,
          });
        }
      }
    }
  const priorities = [
    ["stockkeeper", "smelt"],
    ["patterns"],
    ["catalogue"],
    ["clerk"],
    ["exhibitions"],
    ["doctrine"],
    ["grinder"],
  ];
  let savingAutomation = false;
  for (const [id, room] of priorities) {
    const owned = room ? s.workshop.upgrades[id] : h.upgrades[id];
    if (!owned) {
      upgrade(id, room || "house", id === "patterns" ? 5 : 25);
      const now = room ? s.workshop.upgrades[id] : h.upgrades[id];
      if (!now && ["catalogue", "clerk"].includes(id)) {
        const v = e.upgradePreview(id);
        if (!(v.gates || []).length) {
          savingAutomation = true;
          break;
        }
      }
    }
  }
  if (h.upgrades.doctrine && h.doctrine !== "hold" && !h.activeMatch)
    command("formation", { doctrine: "hold" });
  if (
    s.world.miners.length <
      Math.min(e.derived().workerCapacity, 3 + h.champions) &&
    s.player.gold - e.hireCost() >= 35
  )
    command("hireMiner");
  const tier = Math.min(5, h.champions + 1),
    metal = W.metals[tier - 1];
  for (const id of [
    "mine_iron",
    "mine_gems",
    "mine_mithril",
    "mine_star",
    "patterns_2",
    "patterns_3",
    "patterns_4",
    "patterns_5",
  ])
    if (!savingAutomation && !h.upgrades[id]) upgrade(id, "house", 35);
  for (const id of W.metals.slice(1))
    if (!savingAutomation && !s.workshop.upgrades[id]) upgrade(id, "smelt", 35);
  for (const id of [
    "treatment",
    "runes",
    "prestige",
    "survey",
    "breaker",
    "guardian",
    "mage",
  ])
    if (
      !savingAutomation &&
      !h.upgrades[id] &&
      s.player.gold > 250 + 80 * h.champions
    )
      upgrade(id, "house", 80);
  const discretionary = [
    "picks",
    "crew",
    "grinder",
    "bellows_forge",
    "carts",
    "stock",
    "shop_prices",
    "patrons",
    "ceiling",
    "benches",
  ];
  if (args.prepared) {
    for (const id of [
      "order_trays",
      "memory_anvil",
      "slag_press",
      "second_wind",
    ])
      if (!h.upgrades[id]) upgrade(id, "house", 60);
  }
  const progressionPending =
    args.prepared &&
    [
      "mine_iron",
      "mine_mithril",
      "mine_star",
      "patterns_2",
      "patterns_3",
      "patterns_4",
      "patterns_5",
    ].some((id) => {
      const v = e.upgradePreview(id);
      return !v.rank && !v.gates.length && !v.eligible;
    });
  const maxBudget =
    savingAutomation || progressionPending
      ? 0
      : Math.max(0, s.player.gold * 0.2);
  for (const id of discretionary) {
    const v = e.upgradePreview(id);
    if (
      v.eligible &&
      v.cost <= maxBudget &&
      (!["crew"].includes(id) ||
        s.world.miners.length >= e.derived().workerCapacity)
    )
      upgrade(id, "house", 80);
  }
  for (const id of [
    "flux",
    "bellows",
    "racks",
    "skimming",
    "chambers",
    "lining",
    "assay",
    "purity",
    "vents",
    "pours",
  ]) {
    const v = e.smeltUpgradePreview(id);
    if (v.eligible && v.cost <= maxBudget) upgrade(id, "smelt", 80);
  }
  if (h.upgrades.clerk && !h.autoDeliver)
    command("housePolicy", { autoDeliver: true });
  if (s.automation.spendCap < 50000)
    command("housePolicy", { offlineBudget: 50000 });
  const targets = {};
  for (const id of W.metals)
    if (id === "bronze" || s.workshop.upgrades[id])
      targets[id] = Math.min(e.binCapacity() - 3, id === metal ? 12 : 7);
  if (
    s.workshop.upgrades.stockkeeper &&
    JSON.stringify(s.workshop.smeltPolicy.targets) !== JSON.stringify(targets)
  )
    command("smeltPolicy", { enabled: true, targets, reserve: 0 });
  const seams = e.seams().map((x) => x.id),
    assign = [
      "fuel",
      "bronze",
      "tin",
      metal === "steel" ? "iron" : metal,
      "iron",
      "fuel",
      "mithril",
      "starforged",
    ].filter((x) => seams.includes(x));
  s.world.miners.forEach((m, i) => {
    const id = assign[i % assign.length];
    if (m.assigned !== id)
      command("assignWorker", { id: m.id, materialId: id });
  });
  for (const [id, st] of Object.entries(s.staff)) {
    if (st.stamina < 35 && st.active) command("toggleStaff", { staffId: id });
    if (st.stamina >= 90 && !st.active) command("toggleStaff", { staffId: id });
  }
  for (const id of ["apprentice", "assayer"])
    if (!s.staff[id] && s.player.gold > Math.max(1200, e.staffPrice(id) * 4))
      command("hireStaff", { staffId: id });
}
function deliver() {
  for (const o of [...e.state.house.orders])
    if (e.contractPreview(o.id).eligible)
      command("deliverContract", { id: o.id });
}
function equip() {
  const s = e.state;
  if (s.house.activeMatch) return;
  for (const u of s.adventurers.filter((u) => s.house.team.includes(u.id))) {
    for (const i of [...s.inventory]) {
      if (args.prepared && i.intent === "catalogue") continue;
      const r = e.data.recipes[i.recipeId];
      if (!canHero(u, r) || (i.reservedFor && i.reservedFor !== u.id)) continue;
      const slot = i.targetSlot || r.slot;
      if (itemScore(i) > itemScore(u.equipment[slot]) * 1.08 + 0.3)
        command("equip", { heroId: u.id, itemId: i.id, slot });
    }
  }
}
function clearWarehouse() {
  const s = e.state;
  if (s.inventory.length + s.jobs.length < e.derived().storageCapacity - 3)
    return;
  for (const i of [...s.inventory].sort(
    (a, b) => itemScore(a) - itemScore(b),
  )) {
    if (s.inventory.length + s.jobs.length < e.derived().storageCapacity - 5)
      break;
    const useful = s.adventurers
      .filter((u) => s.house.team.includes(u.id))
      .some(
        (u) =>
          canHero(u, e.data.recipes[i.recipeId]) &&
          itemScore(i) >
            itemScore(u.equipment[e.data.recipes[i.recipeId].slot]) * 1.08,
      );
    if (useful || s.house.orders.some((o) => e.commissionMatches(i, o)))
      continue;
    if (i.reservedFor) command("reserve", { itemId: i.id, heroId: null });
    if (i.protected) command("protect", { itemId: i.id });
    command("sell", { itemId: i.id });
  }
}
function chooseGear() {
  const s = e.state,
    recipes = Object.values(e.data.recipes),
    choices = [];
  for (const u of s.adventurers.filter((u) => s.house.team.includes(u.id))) {
    for (const slot of H.slots) {
      const old = u.equipment[slot];
      for (const r of recipes) {
        if (
          !(args.prepared
            ? e.equipmentSlots(r.id).includes(slot)
            : r.slot === slot) ||
          !canHero(u, r, slot) ||
          !qualifies(r)
        )
          continue;
        const v = preview(r.id),
          desired =
            slot === "weapon"
              ? "keen"
              : slot === "body" || slot === "offhand"
                ? fireResponse()
                  ? "warding"
                  : "reinforced"
                : "warding",
          treatment =
            e.treatmentAvailable(r.id, desired) &&
            e.treatmentCost(r.id, desired) <= Math.max(0, s.player.gold - 25)
              ? desired
              : "plain";
        const sample = {
          recipeId: r.id,
          quality: Math.min(e.derived().qualityCap, v.quality + 20),
          treatment,
          grade: "standard",
        };
        const gain = itemScore(sample) - itemScore(old);
        if (gain <= Math.max(0.5, itemScore(old) * 0.12)) continue;
        const queued = s.jobs.some(
          (j) =>
            j.heroId === u.id &&
            (j.targetSlot || e.data.recipes[j.recipeId].slot) === slot,
        );
        if (queued) continue;
        const score = (gain / (v.seconds * 2 + 30)) * (old ? 1 : 2);
        choices.push({
          kind: "team",
          recipeId: r.id,
          heroId: u.id,
          treatment,
          score,
          gain,
          slot,
        });
      }
    }
  }
  return choices.sort((a, b) => b.score - a.score)[0] || null;
}
function chooseContract(promotion = false) {
  const choices = e.state.house.orders
    .map((o) => {
      const r = e.data.recipes[o.recipeId],
        v = preview(r.id),
        plan = e.commissionPlan(o.id);
      const gradeReady =
        !o.grade ||
        o.grade === "standard" ||
        (e.state.house.graded[r.materialId.replace("_ingot", "")]?.[o.grade] ||
          0) >= (r.inputs[r.materialId] || 0);
      return {
        kind: "catalogue",
        recipeId: r.id,
        contractId: o.id,
        remaining: plan.remaining,
        score: o.payment / ((plan.seconds || v.seconds) * o.quantity),
        ok: qualifies(r) && plan.quality >= o.quality && gradeReady,
      };
    })
    .filter(
      (x) =>
        x.ok &&
        x.remaining > 0 &&
        (!promotion ||
          e.data.recipes[x.recipeId].tier ===
            Math.min(5, e.state.house.champions + 1)),
    );
  return choices.sort((a, b) => b.score - a.score)[0] || null;
}

function choosePractice() {
  const s = e.state,
    tier = Math.min(5, s.house.champions + 1),
    classes = new Set(
      s.adventurers
        .filter((u) => s.house.team.includes(u.id))
        .flatMap((u) =>
          Object.values(u.equipment)
            .filter(Boolean)
            .map((i) => e.data.recipes[i.recipeId].classId),
        ),
    );
  let best = null;
  for (const cl of classes) {
    const rs = Object.values(e.data.recipes).filter(
        (r) => r.classId === cl && !r.legacyTalent,
      ),
      want = rs
        .filter(
          (r) =>
            r.tier <= tier &&
            r.variant < 2 &&
            r.requires.proficiency > s.player.proficiency[cl].level &&
            r.requires.statValue <= s.player.stats[r.requires.stat],
        )
        .sort((a, b) => a.requires.proficiency - b.requires.proficiency)[0];
    if (!want) continue;
    const use = rs
      .filter((r) => qualifies(r))
      .sort(
        (a, b) =>
          learning(b) / preview(b.id).seconds -
          learning(a) / preview(a.id).seconds,
      )[0];
    if (!use) continue;
    const priority =
      (want.slot === "weapon" ? 3 : want.slot === "body" ? 2 : 1) /
      (1 + want.requires.proficiency - s.player.proficiency[cl].level);
    if (!best || priority > best.score)
      best = {
        kind: "practice",
        recipeId: use.id,
        score: priority,
        want: want.id,
      };
  }
  return best;
}
function supply(id, n, seen = new Set()) {
  if ((e.state.materials[id] || 0) >= n) return true;
  if (seen.has(id)) return false;
  seen.add(id);
  const s = e.state,
    d = e.data.materials[id];
  if (d.purchasedSupply) {
    const q = Math.min(
      e.binCapacity() - s.materials[id],
      Math.max(n - s.materials[id], 3),
    );
    if (s.player.gold >= e.materialPrice(id) * q + 3)
      command("buyMaterial", { materialId: id, quantity: q });
    return s.materials[id] >= n;
  }
  if (id.endsWith("_ingot")) {
    const metal = id.slice(0, -6),
      sm = W.smelts[metal];
    if (!sm) return false;
    if (
      s.workshop.jobs.some(
        (j) => j.recipeId === metal || j.smeltId === metal || j.id === metal,
      )
    )
      return false;
    for (const [k, v] of Object.entries(sm.inputs))
      if (!supply(k, v, seen)) return false;
    const p = e.smeltPreview(metal);
    if (p.eligible)
      command("smelt", {
        id: metal,
        quantity: args.prepared ? Math.min(5, p.maxQuantity) : 1,
      });
    return false;
  }
  if (e.seams().some((x) => x.id === id) && s.simTime >= s.quarry.nextManualAt)
    command("mine", { materialId: id });
  return s.materials[id] >= n;
}
function configureCatalogue(goal) {
  const h = e.state.house;
  if (!h.upgrades.catalogue || !goal) return;
  const next = {
    enabled: true,
    recipeId: goal.recipeId,
    reserve: 0,
    autoBuy: true,
    ...(e.state.house.campaign ? { rotate: true } : {}),
  };
  if (JSON.stringify(next) !== JSON.stringify(h.catalogue))
    command("housePolicy", { catalogue: next });
}
function craftTarget(goal) {
  if (!goal) return false;
  const r = e.data.recipes[goal.recipeId];
  if (!qualifies(r)) return false;
  for (const [id, n] of Object.entries(r.inputs))
    if (!supply(id, n)) return false;
  const s = e.state,
    before = new Set(s.jobs.map((j) => j.id));
  const payload = {
    recipeId: r.id,
    intent: goal.kind,
    heroId: goal.heroId,
    targetSlot: goal.slot,
    treatment: goal.treatment || "plain",
  };
  const result =
    goal.kind === "catalogue"
      ? command("commissionCraft", { id: goal.contractId })
      : command("craft", payload);
  if (!result.ok) return false;
  const job = s.jobs.find((j) => !before.has(j.id));
  if (goal.kind === "team" && job) {
    const p = e.techniquePreview(job.id);
    if (p.eligible) command("technique", { jobId: job.id });
  }
  return true;
}
function battle() {
  const h = e.state.house;
  if (h.activeMatch || !e.teamReady() || h.champions >= 5) return;
  if (
    h.team.some((id) => {
      const u = e.state.adventurers.find((u) => u.id === id);
      return !u.equipment.weapon || !u.equipment.body;
    })
  )
    return;
  const changed = teamSignature() !== lastLossSignature;
  if (!changed && wall - lastLossAt < hour / 2) return;
  const q = e.qualification(),
    kind = h.rung === 3 ? "champion" : "rival",
    rival = H.rivals.find((r) => !q.styles.includes(r.id))?.id || "choir";
  const p = { kind, rival },
    v = e.matchPreview(p);
  if (v.eligible) {
    if (h.exhibition) command("housePolicy", { exhibition: null });
    command("challenge", p);
  }
}
function configureExhibitions() {
  const h = e.state.house;
  if (!h.upgrades.exhibitions || h.activeMatch || h.exhibition) return;
  for (let league = Math.min(4, h.champions); league >= 0; league--) {
    for (let rung = 2; rung >= 0; rung--) {
      for (const rival of H.rivals) {
        const p = { league, rung, rival: rival.id },
          v = e.matchPreview({ ...p, kind: "exhibition" });
        if (v.eligible) {
          command("housePolicy", { exhibition: p });
          return;
        }
      }
    }
  }
}
function refreshBoard() {
  const tier = Math.min(5, e.state.house.champions + 1),
    h = e.state.house;
  if (
    !args.prepared ||
    tier === 1 ||
    h.orders.length < 6 ||
    h.orders.some((o) => o.tier === tier)
  )
    return;
  if (
    !Object.values(e.data.recipes).some((r) => r.tier === tier && qualifies(r))
  )
    return;
  const old = h.orders
    .filter(
      (o) =>
        o.tier < tier &&
        !e.state.jobs.some((j) => j.orderId === o.id) &&
        !e.contractPreview(o.id).items.length,
    )
    .sort((a, b) => a.payment - b.payment)[0];
  if (old) command("declineCommission", { id: old.id });
}
function accreditationWork() {
  const h = e.state.house,
    tier = Math.min(5, h.champions + 1),
    need = e.campaignStatus().checks[1].required;
  if (
    (h.campaign.tierCrafts[tier - 1] || 0) +
      e.state.jobs.filter((j) => e.data.recipes[j.recipeId].tier === tier)
        .length >=
    need
  )
    return null;
  const r = Object.values(e.data.recipes)
    .filter((r) => r.tier === tier && r.variant < 2 && qualifies(r))
    .sort((a, b) => preview(a.id).seconds - preview(b.id).seconds)[0];
  return r ? { kind: "stock", recipeId: r.id, score: 1 } : null;
}
function decision() {
  allocate();
  deliver();
  equip();
  clearWarehouse();
  if (args.respond && !e.state.house.activeMatch) {
    const loss = e.state.house.matches.find(
      (m) => m.paid && !m.result.victory && m.kind !== "exhibition",
    );
    if (
      loss?.result.insight.startsWith("Renn fell") &&
      e.state.house.lines.renn !== "back"
    ) {
      const r = command("formation", { heroId: "renn", line: "back" });
      if (r.ok)
        note("replay response", {
          action: "Renn moved behind the armoured Vanguard",
          insight: loss.result.insight,
        });
    }
  }
  if (wall >= nextEconomy) {
    invest();
    nextEconomy = wall + minute;
  }
  battle();
  const s = e.state,
    h = s.house;
  if (h.exhibition) command("housePolicy", { exhibition: null });
  refreshBoard();
  const contract = chooseContract(),
    promotion = args.prepared ? chooseContract(true) : null;
  configureCatalogue(promotion || contract);
  const gear = chooseGear(),
    practice = choosePractice();
  if (
    s.jobs.length <
    e.derived().stationCount + (args.prepared ? e.derived().queueCapacity : 2)
  ) {
    target = args.prepared
      ? h.contracts < 3
        ? contract
        : gear ||
          promotion ||
          accreditationWork() ||
          (s.player.gold < 100 + 150 * h.champions
            ? contract
            : practice || contract)
      : h.contracts < 3
        ? contract
        : gear ||
          (h.contracts < 8 || s.player.gold < 100 + 150 * h.champions
            ? contract
            : practice || contract);
    if (target) {
      recentGoals.push({ wallHours: wall / hour, ...target });
      if (recentGoals.length > 30) recentGoals.shift();
      craftTarget(target);
    }
  }
  // Fill a queued training project before leaving if no direct gear improvement exists.
  production = contract || practice;
  if (s.player.gold < 5) {
    const raw = e
      .seams()
      .map((x) => x.id)
      .find((id) => s.materials[id] > 8);
    if (raw) command("sellMaterial", { materialId: raw, quantity: 5 });
  }
}
function active(minutes, label) {
  session++;
  const begin = snapshot(),
    until = wall + minutes * minute;
  command("housePolicy", { exhibition: null });
  while (wall < until) {
    decision();
    tick(Math.min(step, until - wall));
  }
  deliver();
  equip();
  configureCatalogue(chooseContract());
  configureExhibitions();
  valid();
  const end = snapshot();
  out.sessions.push({
    index: session,
    label,
    begin,
    end,
    actions: actionsSince,
    target: copy(target),
    recentGoals: copy(recentGoals),
  });
  actionsSince = 0;
  saveProgress();
  console.log(
    JSON.stringify({
      session,
      label,
      hours: wall / hour,
      champions: end.champions,
      rung: end.rung,
      gold: end.gold,
      crafts: end.crafts,
      contracts: end.contracts,
      smith: end.smith,
      catalogue: end.catalogue,
    }),
  );
}
function offlineUntil(until, label) {
  if (until <= wall) return;
  const begin = snapshot(),
    requested = until - wall,
    credited = tick(requested, true);
  valid();
  const end = snapshot();
  out.periods.push({
    label,
    requestedHours: requested / hour,
    creditedHours: credited / hour,
    begin,
    end,
  });
  saveProgress();
  console.log(
    JSON.stringify({
      period: label,
      hours: wall / hour,
      credited: credited / hour,
      crafts: end.crafts - begin.crafts,
      contracts: end.contracts - begin.contracts,
      gold: end.gold - begin.gold,
    }),
  );
}
try {
  if (args.retire) {
    const old = snapshot();
    if (!e.derived().legacyEligible)
      throw Error("Earned checkpoint cannot retire yet.");
    command("housePolicy", { exhibition: null });
    if (e.activeMatch()) tick(e.activeMatch().endsAt - e.state.simTime);
    if (args["trial-before-retire"]) {
      const rest = Math.max(
        0,
        ...Object.values(e.state.house.recovery).map(
          (t) => t - e.state.simTime,
        ),
      );
      if (rest) tick(rest);
      const a = command("ascend");
      if (a.ok) {
        const m = e.activeMatch();
        tick(m.endsAt - e.state.simTime);
        note("earned Crucible attempt", {
          depth: m.depth,
          victory: m.result.victory,
          seals: e.state.house.campaign.seals,
        });
      }
    }
    clearWarehouse();
    const u = e.state.adventurers.find((u) => u.id === "mara"),
      heirloom = u.equipment.weapon;
    if (heirloom) {
      const r = command("unequip", { heroId: u.id, slot: "weapon" });
      if (!r.ok) throw Error(r.message);
    }
    const r = command("retire", {
      confirmed: true,
      heirloomItemId: heirloom?.id || null,
    });
    if (!r.ok) throw Error(r.message);
    command("charter", { id: "workforce" });
    for (const talentId of [
      "inherited_crew",
      "fuller_moulds",
      "enduring_tools",
    ])
      if (e.talentPreview(talentId).eligible) command("talent", { talentId });
    const created = command("create", {
      smithName: "The inherited reviewer",
      name: "Earned test house",
      profession,
      origin: "village",
      vow: "patient",
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    });
    if (!created.ok) throw Error(created.message);
    note("earned retirement", {
      previous: old,
      sparks: r.data?.sparks,
      generation: e.state.player.legacy.generation,
      charter: e.state.house.charter,
      talents: e.state.player.talents,
      heirloom: heirloom?.id,
    });
    lastChampion = 0;
    completedIds = new Set();
  }
  campaign: for (let day = 0; day < days; day++) {
    for (let check = 0; check < 4; check++) {
      const due = day * 24 * hour + check * 2 * hour;
      if (due < wall) continue;
      offlineUntil(due, "day " + (day + 1) + " check " + check);
      active(
        day === 0 && check === 0 ? 60 : 15,
        "day " + (day + 1) + " check " + check,
      );
      if (args["stop-at-crown"] && e.derived().legacyEligible) break campaign;
      if (args.hours && wall >= Number(args.hours) * hour) break campaign;
    }
    offlineUntil((day + 1) * 24 * hour, "overnight " + (day + 1));
  }
  out.final = snapshot();
  out.valid = valid();
} catch (error) {
  out.error = error.stack;
  out.final = snapshot();
}
out.recentGoals = recentGoals;
out.generatedEnd = new Date().toISOString();
const targetFile = path.join(__dirname, "house-campaign-" + label + ".json");
fs.writeFileSync(targetFile, JSON.stringify(out, null, 2));
fs.writeFileSync(
  path.join(__dirname, "house-campaign-" + label + "-checkpoint.json"),
  e.exportSave(),
);
console.log(
  JSON.stringify({ file: targetFile, error: out.error, final: out.final }),
);
