/* The accelerated 3D slice has its own small, deterministic state. No campaign save access. */
export const SAVE_KEY = "emberiron.atelier.v1";
export const STEP = 50;
export const MATERIALS = {
  bronze: { name: "Bronze", color: 0xc28e48, attack: 1, price: 6 },
  iron: { name: "Iron", color: 0x929e9a, attack: 1.16, price: 8 },
  steel: { name: "Steel", color: 0xb0c7c7, attack: 1.38, price: 12 },
  mithril: { name: "Mithril", color: 0xafdbdc, attack: 1.62, price: 18 },
  starforged: { name: "Starforged", color: 0x687687, attack: 1.9, price: 24 },
};
export function appearance(input = {}) {
  return {
    material: MATERIALS[input.material] ? input.material : "steel",
    quality: Math.max(
      0,
      Math.min(200, Math.round(Number(input.quality) || 40)),
    ),
    prefix: ["plain", "keen", "precise", "piercing"].includes(input.prefix)
      ? input.prefix
      : "plain",
    enchant: ["none", "flame", "starlight"].includes(input.enchant)
      ? input.enchant
      : "none",
  };
}
export function itemStats(item) {
  const a = appearance(item),
    attack = Math.round(
      5 *
        MATERIALS[a.material].attack *
        (0.65 + a.quality / 115) *
        (a.prefix === "keen" ? 1.12 : 1) +
        (a.enchant === "flame" ? 2 : a.enchant === "starlight" ? 3 : 0),
    );
  return {
    attack,
    crit: a.prefix === "precise" ? 0.22 : 0.1,
    pierce: a.prefix === "piercing" ? 2 : 0,
    value: Math.round(
      MATERIALS[a.material].price * (1 + a.quality / 90) +
        (a.enchant === "none" ? 0 : 9),
    ),
  };
}
export function itemName(item) {
  return `${item.prefix === "plain" ? "" : item.prefix[0].toUpperCase() + item.prefix.slice(1) + " "}${MATERIALS[item.material].name} rondel${item.enchant === "flame" ? " of Embers" : item.enchant === "starlight" ? " of Starlight" : ""}`;
}
const copy = (v) => JSON.parse(JSON.stringify(v));
const random = (state) => {
  let x = state.rng | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  state.rng = x >>> 0;
  return (x >>> 0) / 4294967296;
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function newBattle(item, serial = 1) {
  const stats = itemStats(item),
    unit = (
      id,
      name,
      team,
      line,
      x,
      z,
      hp,
      attack,
      interval,
      armor,
      weapon,
    ) => ({
      id,
      name,
      team,
      line,
      x,
      z,
      hp,
      maxHp: hp,
      attack,
      interval,
      armor,
      weapon,
      phase: "approach",
      phaseAt: 0,
      readyAt: 0,
      target: null,
      hitAt: -1000,
      hurtAt: -1000,
      blockAt: -1000,
      damage: 0,
      crit: 0.1,
      pierce: 0,
    });
  return {
    version: 1,
    id: `bout-${serial}`,
    tick: 0,
    rng: (serial * 9176 + 4183) >>> 0,
    status: "live",
    events: [],
    settled: false,
    item: copy(item),
    units: [
      unit("mara", "Mara", "home", "front", -1.5, 0, 118, 8, 43, 2.7, "shield"),
      {
        ...unit(
          "renn",
          "Renn",
          "home",
          "back",
          -2.35,
          0.95,
          82,
          stats.attack,
          31,
          1,
          "dagger",
        ),
        crit: stats.crit,
        pierce: stats.pierce,
      },
      unit(
        "warden",
        "The Warden",
        "away",
        "front",
        1.45,
        0,
        147,
        9,
        44,
        3.0,
        "shield",
      ),
      unit(
        "rook",
        "The Rook",
        "away",
        "back",
        2.3,
        -0.95,
        89,
        8,
        35,
        1.2,
        "dagger",
      ),
    ],
  };
}
const event = (b, e) => {
  b.events.push({ tick: b.tick, ...e });
  if (b.events.length > 400) b.events.shift();
};
export function tickBattle(b) {
  if (b.status !== "live") return b;
  b.tick++;
  for (const u of b.units) {
    if (u.hp <= 0) {
      u.phase = "yield";
      continue;
    }
    const enemies = b.units.filter((o) => o.team !== u.team && o.hp > 0),
      front = enemies.filter((o) => o.line === "front"),
      eligible = front.length ? front : enemies;
    if (!enemies.length) break;
    let target = b.units.find((o) => o.id === u.target);
    if (!target || target.hp <= 0 || !eligible.includes(target)) {
      target = eligible.sort(
        (a, c) =>
          Math.hypot(u.x - a.x, u.z - a.z) - Math.hypot(u.x - c.x, u.z - c.z) ||
          a.id.localeCompare(c.id),
      )[0];
      u.target = target.id;
      u.phase = "approach";
      u.phaseAt = b.tick;
    }
    if (u.phase === "recover" && b.tick >= u.readyAt) u.phase = "approach";
    if (u.phase === "approach") {
      const dx = target.x - u.x,
        dz = target.z - u.z,
        d = Math.hypot(dx, dz),
        reach = 0.91;
      if (d > reach) {
        const step = Math.min(d - reach, 0.045);
        u.x += (dx / d) * step;
        u.z += (dz / d) * step;
      } else if (b.tick >= u.readyAt) {
        u.phase = "windup";
        u.phaseAt = b.tick;
        u.impactAt = b.tick + 9;
        u.readyAt = b.tick + u.interval;
      }
    } else if (u.phase === "windup" && b.tick >= u.impactAt) {
      const crit = random(b) < u.crit,
        block = target.weapon === "shield" && random(b) < 0.28;
      const damage =
        Math.round(
          Math.max(
            1,
            u.attack * (0.94 + random(b) * 0.12) * (crit ? 1.5 : 1) -
              Math.max(0, target.armor - u.pierce),
          ) *
            (block ? 0.5 : 1) *
            10,
        ) / 10;
      target.hp = Math.max(0, target.hp - damage);
      target.hurtAt = b.tick;
      if (block) target.blockAt = b.tick;
      u.hitAt = b.tick;
      u.damage += damage;
      u.phase = "recover";
      u.phaseAt = b.tick;
      event(b, {
        type: "hit",
        actor: u.id,
        target: target.id,
        damage,
        crit,
        block,
      });
      if (target.hp === 0) {
        target.phase = "yield";
        event(b, { type: "fall", target: target.id, name: target.name });
        if (
          target.line === "front" &&
          !b.units.some(
            (o) => o.team === target.team && o.line === "front" && o.hp > 0,
          )
        )
          event(b, { type: "breach", team: target.team });
      }
    }
  }
  // Resolve overlap without making frame-dependent physics authoritative.
  for (let i = 0; i < b.units.length; i++)
    for (let j = i + 1; j < b.units.length; j++) {
      const a = b.units[i],
        c = b.units[j];
      if (a.hp <= 0 || c.hp <= 0) continue;
      const dx = c.x - a.x,
        dz = c.z - a.z,
        d = Math.hypot(dx, dz),
        gap = 0.49;
      if (d < gap) {
        const nx = d > 1e-6 ? dx / d : 0,
          nz = d > 1e-6 ? dz / d : 1,
          push = (gap - d) / 2;
        a.x = clamp(a.x - nx * push, -2.8, 2.8);
        a.z = clamp(a.z - nz * push, -1.85, 1.85);
        c.x = clamp(c.x + nx * push, -2.8, 2.8);
        c.z = clamp(c.z + nz * push, -1.85, 1.85);
      }
    }
  const home = b.units.some((u) => u.team === "home" && u.hp > 0),
    away = b.units.some((u) => u.team === "away" && u.hp > 0);
  if (!home || !away || b.tick >= 2400) {
    b.status = !away ? "won" : !home ? "lost" : "draw";
    event(b, { type: "end", result: b.status });
  }
  return b;
}
export function simulateBattle(item, serial = 1) {
  const b = newBattle(item, serial);
  while (b.status === "live") tickBattle(b);
  return b;
}
function starter(id, location, quality = 35) {
  return {
    id,
    ...appearance({ material: "bronze", quality }),
    location,
    createdAt: 0,
  };
}
export function fresh(now = Date.now()) {
  return {
    version: 1,
    clock: now,
    lastAt: now,
    gold: 70,
    metal: 24,
    nextItem: 3,
    items: [starter("piece-1", "team"), starter("piece-2", "shelf", 48)],
    queue: [],
    crafted: 0,
    sales: 0,
    bouts: 0,
    wins: 0,
    battle: null,
    replay: null,
    visitor: { phase: "enter", phaseAt: now, itemId: null },
    lastSale: null,
    log: [],
    pending: null,
  };
}
export function validateSave(value, now = Date.now()) {
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.items) ||
    !Array.isArray(value.queue) ||
    !Number.isFinite(value.clock)
  )
    return fresh(now);
  const s = copy(value);
  s.items = s.items
    .slice(0, 40)
    .filter(
      (i) =>
        i &&
        typeof i.id === "string" &&
        ["team", "shelf", "warehouse", "sold"].includes(i.location),
    )
    .map((i) => ({ ...i, ...appearance(i) }));
  s.queue = s.queue
    .slice(0, 6)
    .filter(
      (j) =>
        j &&
        Number.isFinite(j.endsAt) &&
        Number.isFinite(j.startedAt) &&
        Number.isFinite(j.cost),
    );
  s.gold = Math.max(0, Number(s.gold) || 0);
  s.metal = Math.max(0, Number(s.metal) || 0);
  s.pending = s.pending || null;
  if (s.battle && (!Array.isArray(s.battle.units) || s.battle.version !== 1))
    s.battle = null;
  return s;
}
export function quote(config) {
  const a = appearance(config),
    duration = Math.round(
      12000 + a.quality * 55 + (a.enchant === "none" ? 0 : 4000),
    );
  return {
    cost:
      Math.round(MATERIALS[a.material].price * 0.5) +
      (a.enchant === "none" ? 0 : 3),
    metal: 2,
    duration,
    ...a,
  };
}
export function commission(s, config, destination = "shelf") {
  const q = quote(config);
  if (s.queue.length >= 6)
    return { ok: false, reason: "The six-place queue is full." };
  if (
    s.items.filter((i) => i.location !== "sold").length + s.queue.length >=
    18
  )
    return {
      ok: false,
      reason: "Your sample collection is full. Sell a displayed piece first.",
    };
  if (s.gold < q.cost || s.metal < q.metal)
    return {
      ok: false,
      reason: "Restock the sample supplies to continue experimenting.",
    };
  const startedAt = s.queue.length ? s.queue.at(-1).endsAt : s.clock;
  const job = {
    id: `piece-${s.nextItem++}`,
    ...q,
    destination: destination === "team" ? "team" : "shelf",
    startedAt,
    endsAt: startedAt + q.duration,
  };
  s.gold -= q.cost;
  s.metal -= q.metal;
  s.queue.push(job);
  return { ok: true, job };
}
export function cancel(s, id) {
  const i = s.queue.findIndex((j) => j.id === id);
  if (i < 0) return false;
  const [job] = s.queue.splice(i, 1);
  s.gold += job.cost;
  s.metal += job.metal;
  let start = s.clock;
  for (const j of s.queue) {
    if (j.startedAt < start && j === s.queue[0]) {
      start = j.endsAt;
      continue;
    }
    j.startedAt = start;
    j.endsAt = start + j.duration;
    start = j.endsAt;
  }
  return true;
}
export function equip(s, id) {
  if (s.battle?.status === "live")
    return {
      ok: false,
      reason: "Equipment is locked until this bout finishes.",
    };
  const item = s.items.find(
    (i) => i.id === id && ["shelf", "warehouse"].includes(i.location),
  );
  if (!item) return { ok: false, reason: "That item is no longer available." };
  if (s.visitor.itemId === id && s.visitor.phase === "checkout")
    return { ok: false, reason: "That piece is at checkout." };
  for (const old of s.items.filter((i) => i.location === "team")) {
    old.location = "warehouse";
    old.protected = true;
  }
  item.location = "team";
  item.protected = true;
  return { ok: true };
}
function fillShelves(s) {
  let room = 3 - s.items.filter((i) => i.location === "shelf").length;
  for (const i of s.items
    .filter((i) => i.location === "warehouse" && !i.protected)
    .sort((a, b) => a.quality - b.quality)) {
    if (room-- <= 0) break;
    i.location = "shelf";
  }
}
function equipWaiting(s) {
  if (s.battle?.status === "live") return;
  for (const i of s.items.filter(
    (i) => i.location === "warehouse" && i.protected,
  )) {
    const current = s.items.find((j) => j.location === "team");
    if (!current || itemStats(i).attack > itemStats(current).attack) {
      if (current) {
        current.location = "warehouse";
        current.protected = true;
      }
      i.location = "team";
    }
  }
}
export function launch(s) {
  if (s.battle?.status === "live")
    return { ok: false, reason: "A bout is already underway." };
  const i = s.items.find((i) => i.location === "team");
  if (!i) return { ok: false, reason: "Equip a dagger before the bout." };
  s.bouts++;
  s.battle = newBattle(i, s.bouts);
  s.battle.startedAt = s.clock;
  s.battle.tickAt = s.clock;
  return { ok: true };
}
const log = (s, text) => {
  s.log.unshift({ at: s.clock, text });
  s.log = s.log.slice(0, 8);
};
const VISIT_DURATIONS = {
  enter: 3500,
  browse: 6000,
  consider: 4000,
  checkout: 2800,
  leave: 4500,
  absent: 7000,
};
function visit(s) {
  const v = s.visitor,
    elapsed = s.clock - v.phaseAt;
  if (elapsed < VISIT_DURATIONS[v.phase]) return;
  const next = {
    enter: "browse",
    browse: "consider",
    consider: "checkout",
    checkout: "leave",
    leave: "absent",
    absent: "enter",
  };
  if (v.phase === "browse") {
    const item = s.items
      .filter((i) => i.location === "shelf")
      .sort((a, b) => a.quality - b.quality)[0];
    v.itemId = item?.id || null;
  }
  if (
    v.phase === "consider" &&
    !s.items.some((i) => i.id === v.itemId && i.location === "shelf")
  ) {
    v.phase = "leave";
    v.phaseAt = s.clock;
    return;
  }
  if (v.phase === "checkout") {
    const item = s.items.find(
      (i) => i.id === v.itemId && i.location === "shelf",
    );
    if (item) {
      const value = itemStats(item).value;
      s.gold += value;
      s.sales++;
      item.location = "sold";
      s.lastSale = { id: item.id, name: itemName(item), value, at: s.clock };
      log(s, `Sold ${itemName(item)} for ${value}g.`);
    }
  }
  v.phase = next[v.phase];
  v.phaseAt = s.clock;
  if (v.phase === "enter") v.itemId = null;
}
export function advance(s, ms) {
  // Every persisted transition happens on the same bounded clock, not a render callback.
  const end = s.clock + Math.max(0, Math.min(86400000, ms));
  while (s.clock < end) {
    const next = Math.min(
      end,
      s.queue[0]?.endsAt ?? Infinity,
      s.visitor.phaseAt + VISIT_DURATIONS[s.visitor.phase],
      s.battle?.status === "live" ? s.battle.tickAt + STEP : Infinity,
    );
    s.clock = Math.max(s.clock, next);
    while (s.queue[0]?.endsAt <= s.clock) {
      const job = s.queue.shift(),
        item = {
          id: job.id,
          ...appearance(job),
          createdAt: s.clock,
          location: "warehouse",
          protected: job.destination === "team",
        };
      s.items.push(item);
      s.crafted++;
      log(s, `Finished ${itemName(item)} · Q${item.quality}.`);
      equipWaiting(s);
      fillShelves(s);
    }
    if (s.battle?.status === "live") {
      const b = s.battle;
      while (s.clock - b.tickAt >= STEP && b.status === "live") {
        tickBattle(b);
        b.tickAt += STEP;
      }
      if (b.status !== "live" && !b.settled) {
        b.settled = true;
        const purse = b.status === "won" ? 24 : 5;
        s.gold += purse;
        if (b.status === "won") s.wins++;
        s.replay = copy(b);
        log(
          s,
          `${b.status === "won" ? "Victory" : "Bout finished"} · ${purse}g purse.`,
        );
        equipWaiting(s);
      }
    }
    visit(s);
    fillShelves(s);
    // Bound sold history; live gear and a customer's carried piece remain intact.
    if (s.items.length > 28)
      s.items = s.items.filter(
        (i) =>
          i.location !== "sold" ||
          i.id === s.visitor.itemId ||
          i.id === s.lastSale?.id,
      );
  }
  return s;
}
export function reconcile(s, now) {
  const elapsed = clamp(now - (s.lastAt || now), 0, 86400000);
  const before = {
    gold: s.gold,
    crafted: s.crafted,
    sales: s.sales,
    wins: s.wins,
  };
  advance(s, elapsed);
  s.lastAt = now;
  if (elapsed >= 5000) {
    const r = {
      elapsed,
      gold: s.gold - before.gold,
      crafted: s.crafted - before.crafted,
      sales: s.sales - before.sales,
      wins: s.wins - before.wins,
    };
    if (s.pending)
      for (const k of Object.keys(r)) s.pending[k] = (s.pending[k] || 0) + r[k];
    else s.pending = r;
  }
  return s.pending;
}
