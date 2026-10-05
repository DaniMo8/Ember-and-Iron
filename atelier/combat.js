import { legacyBattle, tickLegacyBattle } from "./combat-v1.js";
import { routeAroundBodies } from "./navigation.js";

export const DOCTRINES = {
  balanced: {
    name: "Measured",
    attack: 1,
    interval: 1,
    guard: 1,
    recovery: 1,
    block: 0.52,
    description: "Steady exchanges. Full guard; blocked blows deal 52% damage.",
  },
  pressure: {
    name: "Press the attack",
    attack: 1.1,
    interval: 0.92,
    guard: 0.72,
    recovery: 0.7,
    block: 0.65,
    description:
      "+10% damage, 8% shorter attack cooldown. 28% less guard; blocked blows still deal 65% damage.",
  },
  bulwark: {
    name: "Hold the line",
    attack: 1,
    interval: 1.08,
    guard: 1.3,
    recovery: 1.4,
    block: 0.4,
    description:
      "+30% guard, +40% guard recovery; blocked blows deal only 40% damage. 8% longer attack cooldown.",
  },
};
export const ARENA = {
  radius: 0.43,
  reach: 1.55,
  intro: 40,
  windup: 14,
  strike: 8,
  recovery: 17,
  limit: 2400,
};
export const TEAM_HEALTH = { mara: 118, renn: 76 };
const clone = (v) => JSON.parse(JSON.stringify(v));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rng = (b) => {
  let x = b.rng | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  b.rng = x >>> 0;
  return b.rng / 4294967296;
};
const emit = (b, e) => {
  b.events.push({ tick: b.tick, ...e });
};
const opponents = (b, u) => {
  const alive = b.units.filter((t) => t.team !== u.team && t.hp > 0);
  const fronts = alive.filter((t) => t.line === "front");
  return fronts.length ? fronts : alive;
};
export function createBattle(
  item,
  stats,
  serial = 1,
  doctrine = "balanced",
  version = 2,
) {
  if (version === 1) return legacyBattle(item, stats, serial);
  doctrine = DOCTRINES[doctrine] ? doctrine : "balanced";
  const make = (id, name, team, line, hp, attack, armor, interval) => {
    const d = DOCTRINES[team === "home" ? doctrine : "balanced"],
      side = team === "home" ? -1 : 1;
    const guardMax = Math.round((line === "front" ? 42 : 13) * d.guard);
    return {
      id,
      name,
      team,
      line,
      x: side * (line === "front" ? 1.65 : 2.65),
      z: line === "front" ? 0 : side * 1.1,
      hp,
      maxHp: hp,
      attack: attack * d.attack,
      armor,
      interval: Math.round(interval * d.interval),
      weapon: line === "front" ? "shield" : "dagger",
      phase: "ready",
      phaseAt: 0,
      readyAt: ARENA.intro + (line === "back" ? 23 : team === "away" ? 10 : 0),
      target: null,
      hitAt: -1000,
      hurtAt: -1000,
      blockAt: -1000,
      brokenUntil: 0,
      guard: guardMax,
      guardMax,
      guardRecovery: d.recovery,
      blockDamage: d.block,
      damage: 0,
      blocked: 0,
      strikes: 0,
      crit: 0.1,
      pierce: 0,
      moving: false,
      prevX: side * (line === "front" ? 1.65 : 2.65),
      prevZ: line === "front" ? 0 : side * 1.1,
    };
  };
  return {
    version: 2,
    id: `bout-${serial}`,
    doctrine,
    tick: 0,
    rng: (serial * 9176 + 4183) >>> 0,
    status: "live",
    stage: "forming",
    events: [],
    settled: false,
    item: clone(item),
    units: [
      make("mara", "Mara", "home", "front", TEAM_HEALTH.mara, 9, 2.7, 49),
      {
        ...make(
          "renn",
          "Renn",
          "home",
          "back",
          TEAM_HEALTH.renn,
          stats.attack,
          1,
          62,
        ),
        crit: stats.crit,
        pierce: stats.pierce,
      },
      make("warden", "The Warden", "away", "front", 138, 10, 3, 53),
      make("rook", "The Rook", "away", "back", 82, 8.8, 1.2, 66),
    ],
  };
}
function move(b, u, x, z, speed) {
  const bodies = b.units.filter((t) => t !== u && t.hp <= 0),
    goal = [x, z];
  if (bodies.length) {
    const key = `${bodies.map((t) => t.id).join()}:${x.toFixed(2)}:${z.toFixed(2)}`;
    if (u.routeKey !== key) {
      u.route = routeAroundBodies(
        [u.x, u.z],
        goal,
        bodies.map((t) => [t.x, t.z]),
        ARENA.radius * 2,
      );
      u.routeIndex = 1;
      u.routeKey = key;
    }
    const next = u.route[u.routeIndex];
    if (next) {
      x = next[0];
      z = next[1];
    }
  }
  const dx = x - u.x,
    dz = z - u.z,
    d = Math.hypot(dx, dz),
    step = Math.min(d, speed);
  if (d > 0.001) {
    u.x += (dx / d) * step;
    u.z += (dz / d) * step;
  }
  if (bodies.length && d <= speed + 0.001 && u.routeIndex < u.route.length - 1)
    u.routeIndex++;
  return Math.hypot(u.x - goal[0], u.z - goal[1]) <= 0.035;
}
function anchor(b, u, target, attacking) {
  const side = u.team === "home" ? -1 : 1;
  const ownFront = b.units.some(
    (t) => t.team === u.team && t.line === "front" && t.hp > 0,
  );
  const enemyFront = b.units.some(
    (t) => t.team !== u.team && t.line === "front" && t.hp > 0,
  );
  if (u.line === "front") {
    return enemyFront || !target
      ? [side * 0.7, 0]
      : [target.x + side * 1.16, target.z];
  }
  // An exposed duelist makes a last stand. Stable destinations prevent pursuit loops.
  if (!ownFront) {
    if (enemyFront) return [side * 1.58, side * 1.02];
    if (b.duelLane === undefined) {
      const fallen = b.units.filter((t) => t.hp <= 0);
      b.duelLane =
        [-1.65, 1.65, -1.2, 1.2, 0].find((z) =>
          [-0.6, 0.6].every((x) =>
            fallen.every((t) => Math.hypot(x - t.x, z - t.z) > 0.94),
          ),
        ) ?? -1.65;
    }
    return [side * 0.6, b.duelLane];
  }
  if (!enemyFront && target)
    return [target.x + side * 0.78, target.z - side * 0.98];
  if (attacking && target) return [target.x + side * 0.88, side * 1.18];
  return [side * 2.02, side * 1.1];
}
function resolveHit(b, u, target) {
  if (
    !target ||
    target.hp <= 0 ||
    !opponents(b, u).includes(target) ||
    Math.hypot(u.x - target.x, u.z - target.z) > ARENA.reach
  ) {
    emit(b, { type: "miss", actor: u.id, target: target?.id });
    return;
  }
  const crit = rng(b) < u.crit,
    pressure = 8 + u.attack * 0.55 + u.pierce * 3;
  const canGuard =
    target.guard > 0 &&
    b.tick >= target.brokenUntil &&
    target.phase !== "strike";
  const block = canGuard && (target.weapon === "shield" || rng(b) < 0.18);
  const raw = Math.max(
    1,
    u.attack * (0.94 + rng(b) * 0.12) * (crit ? 1.5 : 1) -
      Math.max(0, target.armor - u.pierce),
  );
  const damage =
    Math.round(raw * (block ? (target.blockDamage ?? 0.52) : 1) * 10) / 10;
  if (block) {
    target.blockAt = b.tick;
    target.blocked += raw - damage;
  }
  target.guard = Math.max(0, target.guard - pressure * (block ? 1 : 0.4));
  if (target.guard === 0 && b.tick >= target.brokenUntil) {
    target.brokenUntil = b.tick + 42;
    emit(b, { type: "guardbreak", target: target.id });
  }
  target.hp = Math.max(0, target.hp - damage);
  target.hurtAt = b.tick;
  u.hitAt = b.tick;
  u.damage += damage;
  u.strikes++;
  emit(b, { type: "hit", actor: u.id, target: target.id, damage, crit, block });
  if (target.hp === 0) {
    target.phase = "yield";
    target.phaseAt = b.tick;
    emit(b, { type: "fall", target: target.id, name: target.name });
    if (
      target.line === "front" &&
      !b.units.some(
        (t) => t.team === target.team && t.line === "front" && t.hp > 0,
      )
    )
      emit(b, { type: "breach", team: target.team });
  }
}
function separate(b) {
  // Fixed solver passes preserve tick/replay determinism. Fallen bodies remain obstacles.
  for (let pass = 0; pass < 4; pass++)
    for (let i = 0; i < b.units.length; i++)
      for (let j = i + 1; j < b.units.length; j++) {
        const a = b.units[i],
          c = b.units[j],
          dx = c.x - a.x,
          dz = c.z - a.z,
          d = Math.hypot(dx, dz),
          gap = ARENA.radius * 2;
        if (d >= gap) continue;
        const nx = d > 1e-6 ? dx / d : 0,
          nz = d > 1e-6 ? dz / d : 1,
          share = a.hp <= 0 ? 0 : c.hp <= 0 ? 1 : 0.5;
        if (a.hp > 0) {
          a.x -= nx * (gap - d) * share;
          a.z -= nz * (gap - d) * share;
        }
        if (c.hp > 0) {
          c.x += nx * (gap - d) * (1 - share);
          c.z += nz * (gap - d) * (1 - share);
        }
      }
  for (const u of b.units) {
    u.x = clamp(u.x, -3.05, 3.05);
    u.z = clamp(u.z, -2.1, 2.1);
    u.moving = Math.hypot(u.x - u.prevX, u.z - u.prevZ) > 0.006;
  }
}
export function advanceBattle(b) {
  if (b.version === 1) return tickLegacyBattle(b);
  if (b.status !== "live") return b;
  b.tick++;
  b.stage =
    b.tick < ARENA.intro
      ? "forming"
      : b.units.some((u) => u.line === "front" && u.hp <= 0)
        ? "line-broken"
        : "exchange";
  for (const u of b.units) {
    u.prevX = u.x;
    u.prevZ = u.z;
    u.moving = false;
    if (u.hp <= 0) continue;
    if (!["windup", "strike"].includes(u.phase) && b.tick >= u.brokenUntil)
      u.guard = Math.min(u.guardMax, u.guard + 0.22 * u.guardRecovery);
    const eligible = opponents(b, u);
    if (!eligible.length) continue;
    let target = eligible.find((t) => t.id === u.target);
    if (!target) {
      target = eligible
        .slice()
        .sort(
          (a, c) =>
            Math.hypot(u.x - a.x, u.z - a.z) -
              Math.hypot(u.x - c.x, u.z - c.z) || a.id.localeCompare(c.id),
        )[0];
      u.target = target.id;
      u.phase = "ready";
      u.phaseAt = b.tick;
    }
    const age = b.tick - u.phaseAt;
    if (u.phase === "windup") {
      if (age >= ARENA.windup) {
        u.phase = "strike";
        u.phaseAt = b.tick;
      }
    } else if (u.phase === "strike") {
      if (age === 3) resolveHit(b, u, target);
      if (age >= ARENA.strike) {
        u.phase = "recover";
        u.phaseAt = b.tick;
        u.readyAt = b.tick + u.interval;
      }
    } else if (u.phase === "recover") {
      if (
        u.line === "back" &&
        b.units.filter((t) => t.line === "front" && t.hp > 0).length === 2
      ) {
        const p = anchor(b, u, target, false);
        move(b, u, ...p, 0.044);
      }
      if (age >= ARENA.recovery) {
        u.phase = "ready";
        u.phaseAt = b.tick;
      }
    } else {
      const attacking = b.tick >= u.readyAt && b.tick >= ARENA.intro;
      const p = anchor(b, u, target, attacking);
      const arrived = move(b, u, ...p, u.line === "front" ? 0.034 : 0.048);
      const inRange = Math.hypot(u.x - target.x, u.z - target.z) <= ARENA.reach;
      if (
        attacking &&
        (arrived || Math.hypot(u.x - p[0], u.z - p[1]) < 0.16) &&
        inRange
      ) {
        u.phase = "windup";
        u.phaseAt = b.tick;
      }
    }
  }
  separate(b);
  const home = b.units.some((u) => u.team === "home" && u.hp > 0),
    away = b.units.some((u) => u.team === "away" && u.hp > 0);
  if (!home || !away || b.tick >= ARENA.limit) {
    b.status = !away ? "won" : !home ? "lost" : "draw";
    b.stage = "settled";
    emit(b, { type: "end", result: b.status });
  }
  return b;
}
