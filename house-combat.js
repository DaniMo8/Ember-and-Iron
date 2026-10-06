/* Deterministic event-driven combat. Live state is serializable; replays are immutable records. */
(function (root) {
  "use strict";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const VERSION = 2;
  function random(seed) {
    let x = seed >>> 0 || 1;
    return () => {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      return (x >>> 0) / 4294967296;
    };
  }
  function hash(text) {
    let n = 2166136261;
    for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
    return n >>> 0;
  }
  function create(snapshot) {
    const heroes = clone(snapshot.heroes),
      foes = clone(snapshot.enemies);
    for (const u of [...heroes, ...foes]) {
      u.hp = u.health;
      u.next = u.interval * 1000;
    }
    const result = {
      version: VERSION,
      victory: null,
      duration: 180000,
      events: [],
      insight: "The match is underway.",
      firstFall: null,
      damage: { home: 0, away: 0 },
      blocked: { home: 0, away: 0 },
    };
    const live = {
      version: VERSION,
      seed: snapshot.seed >>> 0 || 1,
      heroes,
      foes,
      turns: 0,
      at: 0,
      done: false,
    };
    record(live, result, {
      at: 0,
      type: "start",
      text: "The gates close. Break the front line to reach the rear.",
    });
    return { live, result };
  }
  function record(live, result, event) {
    const health = (units) =>
      units.map((u) => ({
        id: u.id,
        name: u.name,
        line: u.line,
        hp: Math.max(0, Math.round(u.hp * 10) / 10),
        maxHp: u.health,
      }));
    result.events.push({
      ...event,
      heroes: health(live.heroes),
      enemies: health(live.foes),
    });
  }
  function rally(unit) {
    if (unit.hp === 0 && unit.secondWind && !unit.secondWindSpent) {
      unit.secondWindSpent = true;
      unit.hp = Math.max(1, unit.health * 0.15);
      return true;
    }
    return false;
  }
  function nextAt(live) {
    if (live.done) return Infinity;
    let next = 180000;
    for (const u of [...live.heroes, ...live.foes])
      if (u.hp > 0) next = Math.min(next, u.next);
    return Math.ceil(next);
  }
  function advance(live, result, elapsed) {
    if (live.done) return result;
    const { heroes, foes } = live,
      all = [...heroes, ...foes];
    const damage = result.damage,
      blocked = result.blocked;
    let firstFall = result.firstFall,
      at = live.at;
    const rng = () => {
      let x = live.seed;
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      live.seed = x >>> 0;
      return live.seed / 4294967296;
    };
    while (live.turns < 600) {
      if (!heroes.some((u) => u.hp > 0) || !foes.some((u) => u.hp > 0)) {
        live.done = true;
        break;
      }
      let actor = null;
      for (const u of all)
        if (
          u.hp > 0 &&
          (!actor ||
            u.next < actor.next ||
            (u.next === actor.next && u.id.localeCompare(actor.id) < 0))
        )
          actor = u;
      if (Math.min(actor.next, 180000) > elapsed) break;
      if (actor.next > 180000) {
        at = 180000;
        live.done = true;
        break;
      }
      at = actor.next;
      live.turns++;
      const home = heroes.includes(actor),
        opponents = (home ? foes : heroes).filter((u) => u.hp > 0),
        front = opponents.filter((u) => u.line === "front");
      const eligible = front.length ? front : opponents,
        target = eligible[Math.floor(rng() * eligible.length)];
      const dodge = rng() < Math.min(0.6, target.evasion || 0),
        crit = rng() < Math.min(0.6, actor.crit || 0),
        block = rng() < Math.min(0.6, target.block || 0);
      const kind = actor.damageType || "physical",
        resist = Math.min(0.75, target.resistances?.[kind] || 0);
      const armour =
        kind === "physical"
          ? Math.max(0, (target.armor || 0) - (actor.armorPen || 0))
          : 0;
      const raw = actor.attack * (0.92 + rng() * 0.16) * (crit ? 1.5 : 1);
      const guardian = opponents.find(
        (u) => u.guardian && u.id !== target.id && u.hp > 0,
      );
      const protection = guardian
        ? Math.min(0.4, guardian.protection || 0.08)
        : 0;
      const hit = dodge
        ? 0
        : Math.max(0.5, raw - armour) *
          (1 - resist) *
          (block ? 0.55 : 1) *
          (1 - protection);
      target.hp = Math.max(0, target.hp - hit);
      const rallied = rally(target);
      damage[home ? "home" : "away"] += hit;
      // Spell cleave obeys the same front-line boundary as the primary strike.
      let splash = 0;
      if (!dodge && actor.aoe)
        for (const other of eligible.filter((u) => u !== target)) {
          const ward = Math.min(0.75, other.resistances?.[kind] || 0);
          const secondary =
            Math.max(
              0.5,
              raw * (actor.aoe || 0) -
                (kind === "physical"
                  ? Math.max(0, (other.armor || 0) - (actor.armorPen || 0))
                  : 0),
            ) *
            (1 - ward);
          other.hp = Math.max(0, other.hp - secondary);
          rally(other);
          splash += secondary;
          if (!firstFall && other.hp === 0)
            firstFall = {
              at,
              home: heroes.includes(other),
              name: other.name,
              line: other.line,
            };
        }
      damage[home ? "home" : "away"] += splash;
      if (block) blocked[home ? "away" : "home"]++;
      if (!firstFall && target.hp === 0)
        firstFall = {
          at,
          home: heroes.includes(target),
          name: target.name,
          line: target.line,
        };
      record(live, result, {
        at,
        type: "strike",
        actorId: actor.id,
        targetId: target.id,
        targetLine: target.line,
        damage: Math.round(hit * 10) / 10,
        damageType: kind,
        critical: crit,
        blocked: block,
        dodged: dodge,
        text: `${actor.name} ${dodge ? "misses" : block ? "is blocked by" : "strikes"} ${target.name}${dodge ? "" : ` · ${Math.round(hit)} ${kind}`}${splash ? ` + ${Math.round(splash)} nearby spell damage` : ""}${protection ? " · guarded" : ""}${rallied ? " · the second bell restores " + target.name : ""}.`,
      });
      actor.next += actor.interval * 1000;
    }
    live.at = at;
    result.firstFall = firstFall;
    if (
      live.turns >= 600 ||
      !heroes.some((u) => u.hp > 0) ||
      !foes.some((u) => u.hp > 0)
    )
      live.done = true;
    if (!live.done) return result;
    const victory = heroes.some((u) => u.hp > 0) && !foes.some((u) => u.hp > 0);
    record(live, result, {
      at,
      type: "outcome",
      text: victory
        ? "Victory. Your house holds the field."
        : "Defeat. Equipment is safe; regroup and revise the design.",
    });
    const insight = firstFall?.home
      ? `${firstFall.name} fell at ${Math.round(firstFall.at / 1000)}s. Strengthen the ${firstFall.line} line or break their defender sooner.`
      : blocked.away >= 5
        ? `${blocked.away} attacks were blocked. Armour penetration and sustained protection can change this match.`
        : victory
          ? "Your formation held long enough to break the rival’s defence. Try the next style before investing blindly."
          : "The rival outlasted your damage. Compare weapon quality, protection and the rival’s signature attack.";
    Object.assign(result, {
      version: VERSION,
      victory,
      duration: Math.max(12000, at),
      insight,
      firstFall,
      damage,
      blocked,
    });
    return result;
  }
  function simulate(snapshot) {
    const { live, result } = create(snapshot);
    advance(live, result, 180000);
    return result;
  }
  const api = { VERSION, random, hash, create, advance, nextAt, simulate };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EIHouseCombat = api;
})(globalThis);
