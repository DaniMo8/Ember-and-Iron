// Frozen v1 rules keep existing bouts and saved replays reproducible.
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
export function legacyBattle(item, stats, serial = 1) {
  const unit = (
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
export function tickLegacyBattle(b) {
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
