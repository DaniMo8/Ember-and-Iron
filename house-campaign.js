/* Long-form House campaign. No wall-clock rewards: every change uses credited simulation time. */
(function (root) {
  "use strict";
  const hour = 3600000,
    copy = (x) => JSON.parse(JSON.stringify(x));
  const ok = (message, data) => ({ ok: true, message, data }),
    no = (message) => ({ ok: false, message });
  const discoveries = [
    {
      id: "slag",
      room: "mine",
      name: "Glass in the spoil",
      hours: 3,
      mined: 250,
      text: "A blue seam in discarded slag teaches the crew to separate useful fines.",
      effects: { miningSpeed: 0.08 },
    },
    {
      id: "song",
      room: "smelter",
      name: "The singing crucible",
      hours: 8,
      smelted: 100,
      text: "A cooling ingot rings like a bell. Gain +3 quality and discover the Resonance suffix: piercing attacks with a sharper critical edge.",
      effects: { quality: 3 },
    },
    {
      id: "memory",
      room: "forge",
      name: "The heat remembers",
      hours: 16,
      crafted: 45,
      text: "Repeated tempering reveals a new working range. Your quality ceiling rises by 5.",
      effects: { qualityCap: 5 },
    },
    {
      id: "routes",
      room: "shop",
      name: "A seal on the ledger",
      hours: 22,
      contracts: 12,
      text: "A distant guild adopts your mark. Newly issued contracts pay 5% more.",
      effects: { contractPay: 0.05 },
    },
    {
      id: "night",
      room: "employees",
      name: "The night bell",
      hours: 28,
      staff: 2,
      text: "Your workers develop a gentler shift rhythm. Recovery improves by 20%.",
      effects: { staffRecovery: 0.2 },
    },
    {
      id: "palimpsest",
      room: "smith",
      name: "Writing beneath the vellum",
      hours: 36,
      crafted: 100,
      text: "Old workshop accounts conceal an experimental folio. Study projects are now available.",
      effects: { proficiencyXp: 0.08 },
    },
    {
      id: "echo",
      room: "mine",
      name: "The chamber without an echo",
      hours: 46,
      mined: 2500,
      text: "Deep survey marks point toward a lost foundry. Gain +4 bin capacity, discover the Hollow Hearth warding suffix and unlock a permanent survey study.",
      effects: { binCapacity: 4 },
    },
    {
      id: "constellation",
      room: "arena",
      name: "The vacant sixth banner",
      hours: 60,
      champions: 4,
      text: "The arena was built around an older trial circle. The Crown may be a doorway rather than an ending.",
      effects: {},
    },
    {
      id: "inheritance",
      room: "legacy",
      name: "A familiar hammer in a new hand",
      generation: 2,
      hours: 2,
      crafted: 20,
      text: "Inherited notes reveal oathbound equipment: matched pieces offer a defensive resonance.",
      effects: { qualityCap: 5 },
    },
    {
      id: "stars",
      room: "smelter",
      name: "The metal between stars",
      generation: 3,
      hours: 8,
      smelted: 250,
      text: "The second archive describes astral equipment that trades speed for immense impact. Discover the Falling Stars suffix and +8% enchantment strength.",
      effects: { enchant: 0.08 },
    },
    {
      id: "eternity",
      room: "forge",
      name: "The last page is unwritten",
      generation: 5,
      hours: 12,
      crafted: 160,
      text: "The oldest folio describes an eternal family of designs. It requires a lifetime of knowledge to reproduce.",
      effects: { qualityCap: 10 },
    },
  ];
  const projects = [
    {
      id: "survey",
      room: "mine",
      name: "Chart the silent galleries",
      discovery: "echo",
      gold: 1800,
      hours: 3,
      inputs: { iron_ingot: 12 },
      effects: { miningSpeed: 0.15, binCapacity: 6 },
      text: "Recover buried survey methods: +15% extraction, +6 bin capacity. Permanent.",
    },
    {
      id: "thermal",
      room: "smelter",
      name: "Reconstruct the heat ladder",
      discovery: "palimpsest",
      gold: 1400,
      hours: 2,
      inputs: { steel_ingot: 8 },
      effects: { quality: 5 },
      text: "A permanent +5 quality from more precise temperature control.",
    },
    {
      id: "dispatch",
      room: "shop",
      name: "Establish the guild route",
      discovery: "palimpsest",
      gold: 1000,
      hours: 2,
      inputs: { leather: 8, wood: 8 },
      effects: { contractPay: 0.08 },
      text: "Permanent +8% contract payment. Existing signed prices stay fixed.",
    },
    {
      id: "oathfolio",
      room: "forge",
      name: "The Oathbound folio",
      discovery: "inheritance",
      generation: 2,
      gold: 6500,
      hours: 6,
      seals: 1,
      inputs: { mithril_ingot: 12, alchemical_oil: 8 },
      text: "Decode 17 oathbound patterns. 85 primary attribute, mastery 90 and smith level 25.",
    },
    {
      id: "veterans",
      room: "employees",
      name: "A school for the second shift",
      discovery: "inheritance",
      generation: 2,
      gold: 3800,
      hours: 4,
      seals: 1,
      inputs: { steel_ingot: 14 },
      effects: { staffXp: 0.3, staffRecovery: 0.3 },
      text: "Permanent +30% employee experience and recovery.",
    },
    {
      id: "starfolio",
      room: "forge",
      name: "The Astral folio",
      discovery: "stars",
      generation: 3,
      parent: "oathfolio",
      gold: 26000,
      hours: 12,
      seals: 3,
      inputs: { starforged_ingot: 24, alchemical_oil: 12 },
      text: "Decode 17 astral patterns. 140 primary attribute, mastery 100, smith level 40. Two matched pieces amplify attack.",
    },
    {
      id: "vault",
      room: "mine",
      name: "The undercroft reservoirs",
      discovery: "stars",
      generation: 3,
      gold: 18000,
      hours: 8,
      seals: 2,
      inputs: { mithril_ingot: 20 },
      effects: { binCapacity: 16, capacity: 8 },
      text: "Permanent +16 spaces in every bin and +8 finished-item spaces.",
    },
    {
      id: "eternalfolio",
      room: "forge",
      name: "The Eternal folio",
      discovery: "eternity",
      generation: 5,
      parent: "starfolio",
      gold: 95000,
      hours: 20,
      seals: 6,
      inputs: { starforged_ingot: 40, alchemical_oil: 20 },
      text: "Decode 17 eternal patterns. 220 primary attribute, mastery 100, smith level 65. A three-piece concord strengthens the entire wearer.",
    },
    {
      id: "observatory",
      room: "smith",
      name: "The house observatory",
      discovery: "eternity",
      generation: 5,
      gold: 72000,
      hours: 16,
      seals: 4,
      inputs: { starforged_ingot: 32 },
      effects: { qualityCap: 15, proficiencyXp: 0.2 },
      text: "Permanent +15 quality ceiling and +20% mastery experience. A long-term house investment.",
    },
  ];
  const burdens = {
    none: {
      name: "An open charter",
      text: "The standard inherited workshop.",
      multiplier: 1,
      reward: 0,
    },
    iron: {
      name: "The Iron Oath",
      text: "Rivals have 20% more armour and health. +12 retirement sparks; first completion awards 2 seals.",
      multiplier: 1.2,
      reward: 12,
    },
    embers: {
      name: "The Ember Oath",
      text: "Rivals deal 25% more damage; forging takes 20% longer. +18 sparks; first completion awards 3 seals.",
      multiplier: 1.25,
      reward: 18,
    },
    silence: {
      name: "The Silent Oath",
      text: "No exhibition purses; champions have 35% more health. +24 sparks; first completion awards 4 seals.",
      multiplier: 1.35,
      reward: 24,
    },
  };
  const trials = [
    {
      name: "Bastion of Ash",
      style: "choir",
      text: "Heavy armour, patient counterattacks. Penetration and endurance matter.",
      armor: 1.5,
    },
    {
      name: "The Fleet Eclipse",
      style: "thread",
      text: "Relentless blades. Guard the front and bring protection.",
      speed: 0.82,
    },
    {
      name: "The Glass Sun",
      style: "lantern",
      text: "Intense fire behind a stubborn guard. Warding matters.",
      fire: 1.3,
    },
  ];
  const fresh = () => ({
    version: 1,
    discoveries: [],
    projects: [],
    research: null,
    seals: 0,
    totalSeals: 0,
    trialDepth: 0,
    bestTrial: 0,
    burden: "none",
    nextBurden: "none",
    oaths: [],
    exhibitionAt: 0,
    exhibitionDay: 0,
    trainingWins: 0,
    tierCrafts: [0, 0, 0, 0, 0],
    tierContracts: [0, 0, 0, 0, 0],
    lineage: { edge: 0, ward: 0 },
    revenue: { contracts: 0, exhibitions: 0, market: 0 },
    unread: [],
    crownAt: null,
  });
  function apply(data) {
    if (data.houseCampaignVersion) return;
    data.houseCampaignVersion = 1;
    // Later materials are substantial commissions. Speed upgrades retain their value.
    for (const r of Object.values(data.recipes))
      r.baseSeconds = Math.round(r.baseSeconds * [0, 1, 2, 5, 10, 18][r.tier]);
    const names = {
      daggers: "Rondel",
      swords: "Arming Sword",
      axes: "Bardiche",
      maces: "Flanged Mace",
      polearms: "Partisan",
      bows: "War Bow",
      foci: "Crozier",
      cloth_armor: "Vestment",
      leather_armor: "Brigandine",
      armor: "Hauberk",
      shields: "Pavise",
      offhands: "Lantern",
      tools: "Armourer's Hammer",
      charms: "Reliquary",
      rings: "Signet",
      instruments: "Citole",
      talismans: "Pilgrim's Ampulla",
    };
    for (const e of [
      {
        id: "resonance",
        name: "Resonance",
        suffix: "of the Singing Steel",
        description: "+2 armour penetration and +5% critical chance.",
        cost: 120,
        inputs: { gem: 2, alchemical_oil: 2 },
        requires: { discovery: "song", level: 8 },
        effects: { armorPen: 2, crit: 0.05 },
        slots: ["weapon"],
      },
      {
        id: "hollow_hearth",
        name: "Hollow Hearth",
        suffix: "of the Hollow Hearth",
        description: "+22% fire resistance and +12% health.",
        cost: 320,
        inputs: { gem: 3, alchemical_oil: 3 },
        requires: { discovery: "echo", level: 14 },
        effects: { fireResist: 0.22, health: 0.12 },
        slots: ["body", "offhand", "ring", "charm"],
      },
      {
        id: "falling_stars",
        name: "Falling Stars",
        suffix: "of Falling Stars",
        description:
          "+18% attack and +8% critical chance; a demanding inherited inscription.",
        cost: 2800,
        inputs: { star_fragment: 2, alchemical_oil: 6 },
        requires: { discovery: "stars", level: 30 },
        effects: { attack: 0.18, crit: 0.08 },
        slots: ["weapon", "ring", "charm"],
      },
    ])
      data.enchantments[e.id] = e;
    for (const [index, family] of ["oath", "astral", "eternal"].entries())
      for (const classId of Object.keys(data.classes)) {
        const base = data.recipes["legend_" + classId];
        if (!base) continue;
        const r = copy(base),
          power = [1.2, 1.65, 2.25][index];
        Object.assign(r, {
          id: family + "_" + classId,
          name:
            ["Oathbound", "Astral", "Eternal"][index] +
            " " +
            (names[classId] || base.patternName),
          variant: 5 + index,
          pattern: family,
          legacyTalent: undefined,
          project: ["oathfolio", "starfolio", "eternalfolio"][index],
          generation: [2, 3, 5][index],
          familySet: family,
          baseSeconds: [1800, 3600, 7200][index],
          basePrice: Math.ceil(base.basePrice * power * 2),
          qualityOffset: 25 + index * 5,
          smithXp: 100 + index * 80,
          classXp: 70 + index * 30,
          known: false,
        });
        r.patternName = r.name;
        r.inputs = {
          starforged_ingot: [12, 24, 40][index],
          alchemical_oil: [6, 12, 20][index],
          fuel: [4, 8, 12][index],
        };
        r.requires = {
          stat: base.requires.stat,
          statValue: [85, 140, 220][index],
          proficiency: [90, 100, 100][index],
          level: [25, 40, 65][index],
        };
        for (const k of ["attack", "armor", "health"])
          r.combat[k] = (r.combat[k] || 0) * power;
        r.description = [
          "Two Oathbound pieces: +15% wearer health and armour.",
          "Two Astral pieces: +20% wearer attack; each weapon swings 10% slower.",
          "Three Eternal pieces: +20% wearer attack, health and armour; +10% fire and arcane resistance.",
        ][index];
        if (index === 1 && r.combat.interval) r.combat.interval *= 1.1;
        r.unlockText =
          "Complete " +
          projects.find((p) => p.id === r.project).name +
          ". Exceptional attributes, mastery and materials still apply.";
        data.recipes[r.id] = r;
      }
  }
  function extend(Base, { H, P, W, Combat }) {
    H.upgrades.catalogue.cost = 65;
    H.upgrades.catalogue.contracts = 2;
    H.upgrades.catalogue.text =
      "Maintain contract work automatically. Optionally rotate through craftable orders.";
    H.upgrades.clerk.cost = 80;
    H.upgrades.clerk.contracts = 3;
    return class CampaignHouse extends Base {
      constructor(data, saved) {
        W.apply(data, P);
        apply(data);
        if (saved) {
          const v = CampaignHouse.validateSave(saved, data);
          if (!v.ok) throw Error(v.message);
          saved = v.state;
        }
        super(data, saved);
        this.state.house.campaign ??= fresh();
        for (const key of ["tierCrafts", "tierContracts", "lineage"])
          this.state.house.campaign[key] ??= fresh()[key];
        this.state.house.catalogue.rotate ??= false;
      }
      _fresh() {
        const s = super._fresh();
        s.house.campaign = fresh();
        return s;
      }
      importSave(raw) {
        const v = CampaignHouse.validateSave(raw, this.data);
        if (!v.ok) return v;
        const r = super.importSave(v.state);
        if (r.ok) {
          this.state.house.campaign ??= fresh();
          for (const key of ["tierCrafts", "tierContracts", "lineage"])
            this.state.house.campaign[key] ??= fresh()[key];
          this.state.house.catalogue.rotate ??= false;
        }
        return r;
      }
      static validateSave(input, data) {
        W.apply(data, P);
        apply(data);
        const v = super.validateSave(input, data);
        if (!v.ok) return v;
        const c = v.state.house.campaign;
        if (!c) return v;
        const int = (n) => Number.isSafeInteger(n) && n >= 0;
        const ids = (a, valid) =>
          Array.isArray(a) &&
          a.length <= 100 &&
          new Set(a).size === a.length &&
          a.every((x) => valid.includes(x));
        if (
          c.version !== 1 ||
          ![
            "seals",
            "totalSeals",
            "trialDepth",
            "bestTrial",
            "exhibitionAt",
            "exhibitionDay",
            "trainingWins",
          ].every((k) => int(c[k])) ||
          c.trialDepth > 60 ||
          c.bestTrial > 60 ||
          c.seals > c.totalSeals ||
          !burdens[c.burden] ||
          !burdens[c.nextBurden] ||
          !ids(
            c.discoveries,
            discoveries.map((d) => d.id),
          ) ||
          !ids(
            c.projects,
            projects.map((d) => d.id),
          ) ||
          !ids(c.oaths, Object.keys(burdens)) ||
          !Array.isArray(c.unread) ||
          c.unread.length > 20 ||
          !c.unread.every((x) => typeof x === "string" && x.length < 300) ||
          !c.revenue ||
          !Object.values(c.revenue).every(int) ||
          !(c.crownAt === null || int(c.crownAt))
        )
          return no("Invalid campaign records.");
        if (
          c.research &&
          (!projects.some((p) => p.id === c.research.id) ||
            !int(c.research.startedAt) ||
            !int(c.research.endsAt) ||
            c.research.endsAt <= c.research.startedAt ||
            c.projects.includes(c.research.id))
        )
          return no("Invalid research project.");
        if (
          v.state.house.catalogue.rotate != null &&
          typeof v.state.house.catalogue.rotate !== "boolean"
        )
          return no("Invalid rotating catalogue.");
        for (const key of ["tierCrafts", "tierContracts"])
          if (
            c[key] &&
            (!Array.isArray(c[key]) ||
              c[key].length !== 5 ||
              !c[key].every(int))
          )
            return no("Invalid material-tier records.");
        if (
          c.lineage &&
          (!["edge", "ward"].every(
            (k) => int(c.lineage[k]) && c.lineage[k] <= 80,
          ) ||
            Object.keys(c.lineage).length !== 2)
        )
          return no("Invalid inherited sigils.");
        if (
          v.state.house.matches.some(
            (m) =>
              m.kind === "trial" &&
              (!int(m.depth) ||
                m.depth < 1 ||
                m.depth > 60 ||
                typeof m.title !== "string" ||
                m.title.length > 100),
          )
        )
          return no("Invalid Crucible replay.");
        return v;
      }
      offlineLimit() {
        return 24 * hour;
      }
      campaignStatus() {
        const s = this.state,
          h = s.house,
          g = s.player.legacy.generation,
          index = Math.min(4, h.champions);
        const factor = g === 1 ? 1 : Math.max(1 / 6, 1 / (1 + (g - 1) * 1.5));
        const needed = Math.round([2, 10, 26, 48, 72][index] * hour * factor);
        const checks = [
          {
            label: "House established",
            current: s.simTime,
            required: needed,
            unit: "time",
          },
          {
            label: W.metals[index] + " pieces forged",
            current: h.campaign?.tierCrafts?.[index] || 0,
            required: [12, 20, 25, 30, 36][index],
          },
          {
            label: "Tier " + (index + 1) + " contracts",
            current: h.campaign?.tierContracts?.[index] || 0,
            required: [3, 5, 8, 10, 12][index],
          },
        ].map((x) => ({ ...x, met: x.current >= x.required }));
        const unmet = checks.find((x) => !x.met);
        return {
          checks,
          eligible: !unmet,
          hours: s.simTime / hour,
          reason: unmet
            ? unmet.unit === "time"
              ? "Guild accreditation matures in " +
                Math.ceil((unmet.required - unmet.current) / 60000) +
                " minutes; workshop work continues."
              : unmet.label + ": " + unmet.current + " / " + unmet.required
            : "Guild accreditation complete.",
          legacyVisible: g > 1 || (h.champions === 5 && s.simTime >= 72 * hour),
          nextLeague: index,
        };
      }
      derived() {
        const d = super.derived();
        if (!this.state.house?.campaign) return d;
        d.legacyEligible =
          this.state.house.champions === 5 && this.campaignStatus().eligible;
        d.legacyReward = d.legacyEligible
          ? d.legacyReward +
            Math.min(30, this.state.house.campaign.trialDepth * 3) +
            burdens[this.state.house.campaign.burden].reward
          : 0;
        return d;
      }
      tick(ms, options = {}) {
        this._simulating = true;
        try {
          return super.tick(ms, options);
        } finally {
          this._simulating = false;
          this._effectMemo = null;
        }
      }
      _effects() {
        const c = this.state?.house?.campaign;
        const key =
          this._simulating && c
            ? this.state.simTime +
              ":" +
              c.discoveries.length +
              ":" +
              c.projects.length +
              ":" +
              Object.values(this.state.staff)
                .map((s) => s.level + "/" + s.active + "/" + s.stamina)
                .join(";")
            : null;
        if (key && this._effectMemo?.key === key)
          return { ...this._effectMemo.effects };
        const e = super._effects();
        if (!c) return e;
        for (const d of [
          ...discoveries.filter((d) => c.discoveries.includes(d.id)),
          ...projects.filter((p) => c.projects.includes(p.id)),
        ])
          for (const [k, n] of Object.entries(d.effects || {}))
            e[k] = (e[k] || 0) + n;
        if (key) this._effectMemo = { key, effects: { ...e } };
        return e;
      }
      craftExperience(r) {
        const threshold = r.project ? 120 : [0, 8, 18, 30, 45, 70][r.tier];
        return {
          smith: Math.max(
            0.04,
            0.7 ** Math.max(0, this.state.player.level - threshold),
          ),
        };
      }
      _completeJob(j) {
        super._completeJob(j);
        const c = this.state.house.campaign;
        c.tierCrafts ??= [0, 0, 0, 0, 0];
        c.tierCrafts[this.data.recipes[j.recipeId].tier - 1]++;
      }
      upgradePreview(id) {
        const v = super.upgradePreview(id),
          n = H.upgrades[id];
        if (
          n &&
          n.max > 1 &&
          v.rank >= 2 + this.state.house.champions * 2 &&
          v.rank < n.max
        ) {
          v.eligible = false;
          v.reason = "The next material licence opens further ranks.";
          v.gates.unshift(v.reason);
        }
        return v;
      }
      _discover() {
        const s = this.state,
          c = s.house.campaign;
        if (!c) return;
        for (const d of discoveries)
          if (
            !c.discoveries.includes(d.id) &&
            s.simTime >= (d.hours || 0) * hour &&
            s.player.legacy.generation >= (d.generation || 1) &&
            s.world.totalMined >= (d.mined || 0) &&
            s.workshop.smelted >= (d.smelted || 0) &&
            s.stats.crafted >= (d.crafted || 0) &&
            s.house.contracts >= (d.contracts || 0) &&
            s.house.champions >= (d.champions || 0) &&
            Object.keys(s.staff).length >= (d.staff || 0)
          ) {
            c.discoveries.push(d.id);
            c.unread.unshift(d.name);
            c.unread = c.unread.slice(0, 20);
            this._log("Discovered: " + d.name + ". " + d.text, "unlock");
            this._previewCache.clear();
          }
      }
      discoverySummary(room) {
        const c = this.state.house.campaign;
        return discoveries.filter(
          (d) => c.discoveries.includes(d.id) && (!room || room === d.room),
        );
      }
      projectPreview(id) {
        const p = projects.find((p) => p.id === id),
          s = this.state,
          c = s.house.campaign;
        if (!p)
          return { eligible: false, visible: false, reason: "Unknown study." };
        const visible = c.discoveries.includes(p.discovery),
          gates = [];
        if (!visible) gates.push("An undiscovered archive is required.");
        if (c.projects.includes(id))
          gates.push("Study complete; its knowledge is permanent.");
        if (c.research) gates.push("Finish the current study first.");
        if (s.player.legacy.generation < (p.generation || 1))
          gates.push("Generation " + p.generation + " required.");
        if (p.parent && !c.projects.includes(p.parent))
          gates.push(
            "Complete " + projects.find((x) => x.id === p.parent).name + ".",
          );
        if (c.seals < (p.seals || 0))
          gates.push("Need " + p.seals + " Crucible seals.");
        if (s.player.gold < p.gold) gates.push("Need " + p.gold + " gold.");
        for (const [id, n] of Object.entries(p.inputs || {}))
          if ((s.materials[id] || 0) < n)
            gates.push(
              this.data.materials[id].name +
                ": " +
                (s.materials[id] || 0) +
                " / " +
                n,
            );
        return {
          ...p,
          visible,
          eligible: !gates.length,
          owned: c.projects.includes(id),
          reason: gates[0] || "Ready to study.",
          gates,
        };
      }
      act(name, p = {}) {
        if (
          ![
            "research",
            "ascend",
            "burden",
            "readDiscoveries",
            "lineage",
          ].includes(name)
        )
          return super.act(name, p);
        if (!this.state.started && name !== "burden")
          return no("Create your smith first.");
        const c = this.state.house.campaign;
        if (name === "readDiscoveries") {
          c.unread = [];
          return ok("Discoveries read.");
        }
        if (name === "lineage") {
          const v = this.lineagePreview(p.id);
          if (!v.eligible) return no(v.reason);
          this.state.player.gold -= v.gold;
          c.seals -= v.seals;
          c.lineage[p.id]++;
          return ok(
            "An inherited sigil deepens. Its power endures across generations.",
          );
        }
        if (name === "burden") {
          if (!burdens[p.id] || !this.campaignStatus().legacyVisible)
            return no("Choose an oath after the Crown is earned.");
          c.nextBurden = p.id;
          return ok("Oath selected for the next generation.");
        }
        if (name === "ascend") return this._ascend();
        const v = this.projectPreview(p.id);
        if (!v.eligible) return no(v.reason);
        this.state.player.gold -= v.gold;
        c.seals -= v.seals || 0;
        this._consumeGrades(v.inputs, copy(this.state.materials));
        for (const [id, n] of Object.entries(v.inputs || {}))
          this.state.materials[id] -= n;
        c.research = {
          id: p.id,
          startedAt: this.state.simTime,
          endsAt: this.state.simTime + v.hours * hour,
        };
        return ok(
          "Study begun. It continues while you are away; resources are committed.",
        );
      }
      _charter(p) {
        if (!this.campaignStatus().legacyVisible)
          return no("Inheritance options appear after the Crown is earned.");
        return super._charter(p);
      }
      talentPreview(id) {
        const v = super.talentPreview(id);
        if (
          this.state.house?.campaign &&
          !this.campaignStatus().legacyVisible
        ) {
          v.eligible = false;
          v.reason = "Inheritance options appear after the Crown is earned.";
        }
        return v;
      }
      _extraEventTimes() {
        const t = super._extraEventTimes(),
          r = this.state.house?.campaign?.research;
        if (r) t.push(r.endsAt);
        t.push((Math.floor(this.state.simTime / 60000) + 1) * 60000);
        return t;
      }
      _processExtraEvents() {
        super._processExtraEvents();
        const c = this.state.house?.campaign,
          r = c?.research;
        if (r && this.state.simTime >= r.endsAt) {
          c.projects.push(r.id);
          c.unread.unshift(
            projects.find((p) => p.id === r.id).name + " completed",
          );
          c.unread = c.unread.slice(0, 20);
          c.research = null;
          this._previewCache.clear();
        }
        if (this.state.simTime % 60000 === 0) this._discover();
      }
      _recipeKnown(r) {
        if (r.project)
          return (
            !!this.state.house?.campaign?.projects.includes(r.project) &&
            this.availableClasses().includes(r.classId)
          );
        return super._recipeKnown(r);
      }
      _gates(req = {}) {
        const g = super._gates(req);
        if (req.discovery)
          g.push({
            label:
              "Discover " +
              (discoveries.find((d) => d.id === req.discovery)?.name ||
                "the lost method"),
            met: !!this.state.house?.campaign?.discoveries.includes(
              req.discovery,
            ),
            current: this.state.house?.campaign?.discoveries.includes(
              req.discovery,
            )
              ? 1
              : 0,
            required: 1,
          });
        return g;
      }
      craftPreview(id, p = {}) {
        const v = super.craftPreview(id, p),
          r = this.data.recipes[id];
        if (!r) return v;
        if (this.state.house?.campaign?.burden === "embers") v.seconds *= 1.2;
        if (r.project) {
          v.seconds = Math.max(v.seconds, [300, 600, 1200][r.variant - 5]);
          if (this.state.player.legacy.generation < r.generation) {
            v.eligible = false;
            v.reason = "This design requires generation " + r.generation + ".";
          }
        }
        return v;
      }
      _arenaStats(u) {
        const s = super._arenaStats(u),
          counts = {};
        for (const i of Object.values(u.equipment).filter(Boolean)) {
          const family = this.data.recipes[i.recipeId].familySet;
          if (family) counts[family] = (counts[family] || 0) + 1;
        }
        if (counts.oath >= 2) {
          s.health *= 1.15;
          s.armor *= 1.15;
          s.traits.push("Oathbound pair · +15% health and armour");
        }
        if (counts.astral >= 2) {
          s.attack *= 1.2;
          s.traits.push("Astral pair · +20% attack");
        }
        if (counts.eternal >= 3) {
          s.health *= 1.2;
          s.armor *= 1.2;
          s.attack *= 1.2;
          s.resistances.fire = (s.resistances.fire || 0) + 0.1;
          s.resistances.arcane = (s.resistances.arcane || 0) + 0.1;
          s.traits.push(
            "Eternal concord · +20% attack, health, armour; +10% fire/arcane resistance",
          );
        }
        const lineage = this.state.house.campaign.lineage || {
          edge: 0,
          ward: 0,
        };
        s.attack *= 1.12 ** lineage.edge;
        s.health *= 1.12 ** lineage.ward;
        s.armor *= 1.06 ** lineage.ward;
        return s;
      }
      lineagePreview(id) {
        const c = this.state.house.campaign;
        if (!["edge", "ward"].includes(id))
          return { eligible: false, reason: "Choose an inherited sigil." };
        const rank = c.lineage?.[id] || 0,
          seals = Math.ceil(2 * 1.065 ** rank),
          gold = Math.ceil(1800 * 1.15 ** rank);
        const reason = !this.campaignStatus().legacyVisible
          ? "Earn the Crown first."
          : rank >= 80
            ? "Sigil complete."
            : c.seals < seals
              ? "Need " + seals + " Crucible seals."
              : this.state.player.gold < gold
                ? "Need " + gold + " gold."
                : "Ready to inscribe.";
        return {
          id,
          rank,
          seals,
          gold,
          eligible: reason === "Ready to inscribe.",
          reason,
        };
      }
      rivalStats(rival, league, rung, champion = false) {
        const units = super.rivalStats(rival, league, rung, champion),
          burden = this.state.house?.campaign?.burden;
        for (const u of units) {
          if (burden === "iron") {
            u.health *= 1.2;
            u.armor *= 1.2;
          }
          if (burden === "embers") u.attack *= 1.25;
          if (burden === "silence" && champion) u.health *= 1.35;
        }
        return units;
      }
      matchPreview(p = {}) {
        const v = super.matchPreview(p),
          c = this.state.house?.campaign;
        if (!c) return v;
        if (
          v.eligible &&
          v.kind === "champion" &&
          !this.campaignStatus().eligible
        ) {
          v.eligible = false;
          v.reason = this.campaignStatus().reason;
        }
        if (
          v.eligible &&
          v.kind === "exhibition" &&
          c.exhibitionAt > this.state.simTime
        ) {
          v.eligible = false;
          v.reason =
            "Next exhibition in " +
            Math.ceil((c.exhibitionAt - this.state.simTime) / 1000) +
            " seconds.";
        }
        return v;
      }
      matchPurse(league, rung, kind) {
        if (
          kind === "exhibition" &&
          this.state.house?.campaign?.burden === "silence"
        )
          return 0;
        return super.matchPurse(league, rung, kind);
      }
      _challenge(p) {
        const r = super._challenge(p);
        if (r.ok && p.kind === "exhibition")
          this.state.house.campaign.exhibitionAt = this.state.simTime + 300000;
        return r;
      }
      trialPreview() {
        const s = this.state,
          c = s.house.campaign,
          n = c.trialDepth,
          t = trials[n % 3],
          cycle = Math.floor(n / 3),
          generation = s.player.legacy.generation;
        const maxDepth = Math.min(60, 3 + 3 * generation),
          checks = [
            s.house.champions < 5 ? "Earn the Crown of Embers first." : null,
            n >= 60
              ? "All sixty Crucible trials are complete."
              : n >= maxDepth
                ? "The next circle requires generation " +
                  (generation + 1) +
                  "."
                : null,
            !this.teamReady() ? "Your fighters are recovering." : null,
            !s.house.team.some((id) => {
              const u = s.adventurers.find((u) => u.id === id);
              return (
                u &&
                (s.house.lines[id] ||
                  this.data.archetypes[u.archetypeId].line) === "front"
              );
            })
              ? "Place at least one fighter on the front line."
              : null,
            this.activeMatch() ? "Finish the current bout." : null,
          ];
        const enemies = this.rivalStats(t.style, 4, 2, true);
        for (const e of enemies) {
          const scale = 1.12 * 1.16 ** n;
          e.health *= scale;
          e.attack *= scale;
          e.armor *= Math.sqrt(scale) * (t.armor || 1);
          e.interval *= t.speed || 1;
          if (e.damageType === "fire") e.attack *= t.fire || 1;
        }
        const reason =
          checks.find(Boolean) ||
          "Enter the Crucible deliberately. Defeat grants no seals.";
        return {
          eligible: !checks.some(Boolean),
          reason,
          depth: n + 1,
          name: t.name,
          description: t.text,
          cycle: cycle + 1,
          enemies,
          rival: t.style,
          purse: Math.min(1000000, Math.round(1200 * 1.15 ** n)),
          seals: 1 + Math.floor(n / 3),
          generationCap: maxDepth,
        };
      }
      _ascend() {
        const v = this.trialPreview();
        if (!v.eligible) return no(v.reason);
        const h = this.state.house;
        const heroes = h.team.map((id) => {
          const u = this.state.adventurers.find((u) => u.id === id);
          return { ...this._arenaStats(u), equipment: copy(u.equipment) };
        });
        const snapshot = {
          version: Combat.VERSION,
          seed: Combat.hash(
            "crucible:" + this.state.player.legacy.generation + ":" + v.depth,
          ),
          heroes,
          enemies: v.enemies,
          doctrine: h.doctrine,
        };
        const result = Combat.simulate(snapshot),
          id = "match-" + h.nextMatch++;
        h.matches.unshift({
          id,
          kind: "trial",
          league: 4,
          rung: 2,
          rival: v.rival,
          depth: v.depth,
          title: v.name,
          startedAt: this.state.simTime,
          endsAt: this.state.simTime + Math.ceil(result.duration),
          snapshot,
          result,
          paid: false,
          purse: v.purse,
        });
        h.matches.length = Math.min(12, h.matches.length);
        h.activeMatch = id;
        return ok("The Crucible opens.");
      }
      _settleMatch(m) {
        if (m.paid) return;
        const s = this.state,
          c = s.house.campaign,
          previous = s.house.champions;
        const xp =
          m.kind === "exhibition"
            ? new Map(
                s.adventurers.map((u) => [u.id, { xp: u.xp, level: u.level }]),
              )
            : null;
        super._settleMatch(m);
        if (xp) {
          const day = Math.floor(s.simTime / (24 * hour));
          if (c.exhibitionDay !== day) {
            c.exhibitionDay = day;
            c.trainingWins = 0;
          }
          if (m.result.victory) {
            c.revenue.exhibitions += m.purse;
            c.trainingWins++;
          }
          if (
            c.trainingWins > 12 ||
            m.league < Math.max(0, s.house.champions - 1)
          )
            for (const u of s.adventurers) Object.assign(u, xp.get(u.id) || {});
        }
        if (
          m.kind === "trial" &&
          m.result.victory &&
          m.depth === c.trialDepth + 1
        ) {
          c.trialDepth = m.depth;
          c.bestTrial = Math.max(c.bestTrial, m.depth);
          const seals = 1 + Math.floor((m.depth - 1) / 3);
          c.seals += seals;
          c.totalSeals += seals;
          this._deliver({
            materials: {
              star_fragment: 2 + Math.floor(m.depth / 3),
              alchemical_oil: 2,
            },
          });
          c.unread.unshift(
            "Crucible " + m.depth + " cleared · " + seals + " seals",
          );
          c.unread = c.unread.slice(0, 20);
        }
        if (previous < 5 && s.house.champions === 5) {
          c.crownAt = s.simTime;
          if (c.burden !== "none" && !c.oaths.includes(c.burden)) {
            c.oaths.push(c.burden);
            const n = { iron: 2, embers: 3, silence: 4 }[c.burden];
            c.seals += n;
            c.totalSeals += n;
          }
        }
        this._discover();
      }
      materialPathAvailable(id) {
        const smelt = Object.values(W.smelts).find((r) => r.output === id);
        return smelt
          ? (!smelt.upgrade ||
              this.state.workshop.upgrades[smelt.upgrade] > 0) &&
              Object.keys(smelt.inputs).every((input) =>
                this.materialPathAvailable(input),
              )
          : this.materialAvailable(id);
      }
      contractMaterialAccess(recipe) {
        return Object.keys(recipe.inputs).every((id) =>
          this.materialPathAvailable(id),
        );
      }
      _runAutomation() {
        const s = this.state,
          h = s.house,
          c = h.catalogue;
        if (c.enabled && c.rotate && h.upgrades.catalogue) {
          const orders = h.orders.filter((o) => {
            const r = this.data.recipes[o.recipeId],
              v = this.craftPreview(r?.id);
            return (
              r &&
              this._recipeKnown(r) &&
              this.contractMaterialAccess(r) &&
              v.gates.every(
                (g) => g.met || g.source === "Quarry or material shop",
              ) &&
              v.quality >= o.quality &&
              !this.contractPreview(o.id).eligible
            );
          });
          const order =
            orders.find((o) => {
              let cost = 0;
              const supplied = Object.entries(
                this.data.recipes[o.recipeId].inputs,
              ).every(([id, n]) => {
                const missing = Math.max(0, n + c.reserve - s.materials[id]);
                if (!missing) return true;
                if (!c.autoBuy || !this.data.materials[id].purchasedSupply)
                  return false;
                cost += missing * this.materialPrice(id);
                return true;
              });
              return (
                supplied &&
                (cost === 0 || s.player.gold - cost >= 20) &&
                (!this._offline ||
                  this._offlineSpend + cost <= s.automation.spendCap)
              );
            }) || orders[0];
          if (order) c.recipeId = order.recipeId;
        }
        super._runAutomation();
      }
      _housePolicy(p) {
        if (
          p.catalogue &&
          p.catalogue.rotate != null &&
          typeof p.catalogue.rotate !== "boolean"
        )
          return no("Choose a valid rotation policy.");
        return super._housePolicy(p);
      }
      _deliverContract(p) {
        const o = this.state.house.orders.find((o) => o.id === p.id),
          r = super._deliverContract(p);
        if (r.ok && o) {
          const c = this.state.house.campaign;
          c.revenue.contracts += o.payment;
          c.tierContracts ??= [0, 0, 0, 0, 0];
          c.tierContracts[o.tier - 1]++;
        }
        return r;
      }
      _sell(p) {
        const before = this.state.player.gold,
          r = super._sell(p);
        if (r.ok && this.state.house?.campaign)
          this.state.house.campaign.revenue.market +=
            this.state.player.gold - before;
        return r;
      }
      advanceOffline(now = Date.now()) {
        const s = this.state,
          c = s.house.campaign,
          before = {
            revenue: copy(c.revenue),
            mined: s.world.totalMined,
            smelted: s.workshop.smelted,
            discovered: [...c.discoveries],
            projects: [...c.projects],
            materials: copy(s.materials),
            lost: s.world.materialsLost || 0,
            level: s.player.level,
            mastery: Object.fromEntries(
              Object.entries(s.player.proficiency).map(([id, p]) => [
                id,
                p.level,
              ]),
            ),
            heroes: Object.fromEntries(
              s.adventurers.map((u) => [u.id, u.level]),
            ),
            champions: s.house.champions,
            equipment: new Set(
              s.adventurers.flatMap((u) =>
                Object.values(u.equipment)
                  .filter(Boolean)
                  .map((i) => i.id),
              ),
            ),
            trial: c.bestTrial,
          };
        const r = super.advanceOffline(now);
        if (r.report) {
          Object.assign(r.report, {
            mined: s.world.totalMined - before.mined,
            smelted: s.workshop.smelted - before.smelted,
            lost: (s.world.materialsLost || 0) - before.lost,
            contractGold: c.revenue.contracts - before.revenue.contracts,
            exhibitionGold: c.revenue.exhibitions - before.revenue.exhibitions,
            marketGold: c.revenue.market - before.revenue.market,
            discoveries: c.discoveries
              .filter((x) => !before.discovered.includes(x))
              .map((id) => discoveries.find((d) => d.id === id).name),
            studies: c.projects
              .filter((x) => !before.projects.includes(x))
              .map((id) => projects.find((p) => p.id === id).name),
            achievements: [
              ...s.adventurers.flatMap((u) =>
                Object.values(u.equipment)
                  .filter((i) => i && !before.equipment.has(i.id))
                  .map(
                    (i) =>
                      u.name +
                      " equipped " +
                      this.data.recipes[i.recipeId].name,
                  ),
              ),
              ...(s.player.level > before.level
                ? ["Smith reached level " + s.player.level]
                : []),
              ...Object.entries(s.player.proficiency)
                .filter(([id, p]) => p.level > before.mastery[id])
                .map(
                  ([id, p]) =>
                    this.data.classes[id].name + " mastery reached " + p.level,
                ),
              ...s.adventurers
                .filter((u) => u.level > before.heroes[u.id])
                .map((u) => u.name + " reached level " + u.level),
              ...(s.house.champions > before.champions
                ? ["League champion defeated"]
                : []),
              ...(c.bestTrial > before.trial
                ? ["Crucible trial " + c.bestTrial + " cleared"]
                : []),
            ],
            materials: Object.entries(s.materials)
              .filter(([id, n]) => n !== before.materials[id])
              .map(([id, n]) => ({ id, change: n - before.materials[id] })),
            limitHours: 24,
          });
        }
        if (
          r.report &&
          s.house.catalogue.enabled &&
          s.house.catalogue.autoBuy &&
          s.offlineSession.spent >= s.automation.spendCap
        ) {
          const recipe = this.data.recipes[s.house.catalogue.recipeId];
          if (
            recipe &&
            ["wood", "leather", "alchemical_oil"].some(
              (id) => (recipe.inputs[id] || 0) > s.materials[id],
            )
          )
            r.report.stopReason =
              "The authorised offline supply budget was exhausted. Review the budget in Forge before your next absence.";
        }
        return r;
      }
      _retire(p) {
        if (!this.derived().legacyEligible)
          return no(
            "Earn the Crown and complete the current guild accreditation before passing on the hammer.",
          );
        if (this.state.house.campaign.research)
          return no(
            "Finish the current study before retiring; its knowledge will then persist.",
          );
        const old = copy(this.state.house.campaign),
          r = super._retire(p);
        if (r.ok)
          Object.assign(this.state.house.campaign, {
            discoveries: old.discoveries,
            projects: old.projects,
            seals: old.seals,
            totalSeals: old.totalSeals,
            bestTrial: old.bestTrial,
            oaths: old.oaths,
            lineage: old.lineage,
            burden: old.nextBurden,
            nextBurden: old.nextBurden,
          });
        return r;
      }
      roomStage(room) {
        const s = this.state,
          h = s.house,
          c = h.campaign,
          g = s.player.legacy.generation;
        let score = Object.entries(h.upgrades)
          .filter(([id]) => H.upgrades[id].room === room)
          .reduce((n, [, rank]) => n + rank, 0);
        if (room === "smith")
          score =
            Math.floor(s.player.level / 3) +
            Object.values(s.decorationLevels || {}).reduce((a, b) => a + b, 0);
        if (room === "smelter")
          score = Object.values(s.workshop.upgrades).reduce((a, b) => a + b, 0);
        if (room === "employees")
          score =
            Object.keys(s.staff).length * 2 +
            Object.entries(s.world.trees)
              .filter(([id]) => P.nodes[id]?.section === "employees")
              .reduce((n, [, rank]) => n + rank, 0);
        if (room === "arena") score += h.champions * 2 + c.trialDepth;
        if (room === "legacy")
          score = (g - 1) * 4 + c.projects.length + c.bestTrial;
        const research =
          c.projects.filter(
            (id) => projects.find((p) => p.id === id)?.room === room,
          ).length || Math.floor(c.projects.length / 3);
        return score >= 24 && g >= 5 && research > 0
          ? 4
          : score >= 17 && g >= 3
            ? 3
            : score >= 11 && g >= 2
              ? 2
              : score >= 5
                ? 1
                : 0;
      }
    };
  }
  const api = {
    hour,
    discoveries,
    projects,
    burdens,
    trials,
    fresh,
    apply,
    extend,
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EIHouseCampaign = api;
})(globalThis);
