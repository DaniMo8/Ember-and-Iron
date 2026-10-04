/* Arena house simulation. Classic saves are read only through explicit conversion. */
(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(
      require("./workshop-engine"),
      require("./progression"),
      require("./workshop"),
      require("./house-data"),
      require("./house-combat"),
      require("./house-campaign"),
    );
  else
    root.EIHouseEngine = factory(
      root.EIWorkshopEngine,
      root.EIProgression,
      root.EIWorkshop,
      root.EIHouseData,
      root.EIHouseCombat,
      root.EIHouseCampaign,
    );
})(globalThis, function (Workshop, P, W, H, Combat, Campaign) {
  "use strict";
  const copy = (x) => JSON.parse(JSON.stringify(x)),
    yes = (message, data) => ({ ok: true, message, data }),
    no = (message) => ({ ok: false, message });
  const integer = (n) => Number.isSafeInteger(n) && n >= 0;
  // Add house identities without changing the established Classic profession effects.
  for (const id of ["mechanist", "runesage"])
    P.professions[id] = H.professions[id];
  const freshHouse = () => ({
    version: 1,
    origin: "village",
    vow: "patient",
    charter: "workforce",
    seen: [],
    upgrades: {},
    team: [],
    lines: {},
    doctrine: "balanced",
    champions: 0,
    rung: 0,
    qualification: Array.from({ length: 15 }, () => ({ wins: 0, styles: [] })),
    wins: 0,
    losses: 0,
    contracts: 0,
    contractCycle: 0,
    orders: [],
    matches: [],
    activeMatch: null,
    nextMatch: 1,
    recovery: {},
    hallmarks: [],
    goal: null,
    exhibition: null,
    catalogue: { enabled: false, recipeId: null, reserve: 2, autoBuy: false },
    autoDeliver: true,
    deliveryVersion: 1,
    graded: {},
    gradeMode: "standard",
    nextPocket: 0,
    history: [],
    conversion: null,
    market: {
      nextAt: 60000,
      sales: 0,
      last: "The town is discovering your house.",
    },
  });
  class House extends Workshop {
    constructor(data, saved) {
      W.apply(data, P);
      data.staff.envoy.effects = { contractPay: 0.04 };
      data.staff.envoy.work = "sale";
      data.staff.envoy.description =
        "Each experience level adds 4% to newly issued contract payments while on duty.";
      if (saved) {
        const v = House.validateSave(saved, data);
        if (!v.ok) throw Error(v.message);
        saved = v.state;
      }
      super(data, saved);
      this.state.house ??= freshHouse();
      // Earlier houses defaulted to manual delivery behind a purchased clerk.
      if (!this.state.house.deliveryVersion) {
        this.state.house.autoDeliver = true;
        this.state.house.deliveryVersion = 1;
      }
      this.state.house.market ??= {
        nextAt: this.state.simTime + 60000,
        sales: 0,
        last: "The town is discovering your house.",
      };
      this._settleRoster();
      this._ensureContracts();
    }
    _fresh() {
      const s = super._fresh();
      s.house = freshHouse();
      return s;
    }
    seams() {
      return super
        .seams()
        .map((seam) => ({ ...seam, seconds: seam.seconds * 3 }));
    }
    quarryDerived() {
      const result = super.quarryDerived();
      return { ...result, seconds: result.seconds * 3 };
    }
    _mine(payload) {
      const result = super._mine(payload);
      if (result.ok)
        this.state.quarry.nextManualAt = this.state.simTime + 14000;
      return result;
    }
    static validateSave(input, data) {
      const v = Workshop.validateSave(input, data);
      if (!v.ok) return v;
      const s = v.state,
        h = s.house;
      if (!h)
        return no(
          "This is a Classic workshop. Use Carry over Classic from the title screen.",
        );
      try {
        const check = (c, m) => {
          if (!c) throw Error(m);
        };
        check(
          h.version === 1 && H.origins[h.origin] && H.vows[h.vow],
          "Invalid house identity.",
        );
        check(
          ["workforce", "patron", "archive"].includes(h.charter),
          "Invalid inheritance charter.",
        );
        check(
          integer(h.champions) &&
            h.champions <= 5 &&
            integer(h.rung) &&
            h.rung <= 3,
          "Invalid league progression.",
        );
        check(
          [
            "wins",
            "losses",
            "contracts",
            "contractCycle",
            "nextMatch",
            "nextPocket",
          ].every((k) => integer(h[k])),
          "Invalid house records.",
        );
        check(
          Array.isArray(h.seen) && h.seen.every((k) => H.rooms[k]),
          "Invalid room introductions.",
        );
        check(
          h.upgrades &&
            Object.entries(h.upgrades).every(
              ([id, n]) =>
                H.upgrades[id] && integer(n) && n <= H.upgrades[id].max,
            ),
          "Invalid house upgrades.",
        );
        check(
          Array.isArray(h.team) &&
            h.team.length <= 3 &&
            new Set(h.team).size === h.team.length &&
            h.team.every((id) => s.adventurers.some((u) => u.id === id)),
          "Invalid arena team.",
        );
        check(
          H.doctrines[h.doctrine] &&
            Object.values(h.lines).every((v) => ["front", "back"].includes(v)),
          "Invalid formation.",
        );
        check(
          Array.isArray(h.qualification) &&
            h.qualification.length <= 15 &&
            h.qualification.every(
              (q) =>
                q &&
                integer(q.wins) &&
                Array.isArray(q.styles) &&
                new Set(q.styles).size === q.styles.length &&
                q.styles.every((id) => H.rivals.some((r) => r.id === id)),
            ),
          "Invalid qualification.",
        );
        check(
          h.recovery && Object.values(h.recovery).every(integer),
          "Invalid recovery time.",
        );
        check(
          Array.isArray(h.orders) &&
            h.orders.length <= 4 &&
            h.orders.every(
              (o) =>
                typeof o.id === "string" &&
                data.classes[o.classId] &&
                integer(o.quantity) &&
                o.quantity > 0 &&
                o.quantity <= 6 &&
                integer(o.quality) &&
                o.quality <= 200 &&
                integer(o.tier) &&
                o.tier >= 1 &&
                o.tier <= 5 &&
                integer(o.payment) &&
                o.payment > 0,
            ),
          "Invalid contracts.",
        );
        check(
          Array.isArray(h.matches) &&
            h.matches.length <= 12 &&
            new Set(h.matches.map((m) => m.id)).size === h.matches.length,
          "Invalid replay archive.",
        );
        for (const m of h.matches) {
          check(
            typeof m.id === "string" &&
              integer(m.startedAt) &&
              integer(m.endsAt) &&
              m.endsAt > m.startedAt &&
              typeof m.paid === "boolean" &&
              ["rival", "champion", "exhibition", "trial"].includes(m.kind) &&
              integer(m.league) &&
              m.league < 5 &&
              integer(m.rung) &&
              m.rung < 3 &&
              H.rivals.some((r) => r.id === m.rival) &&
              integer(m.purse) &&
              m.purse <= 1000000,
            "Invalid match.",
          );
          check(
            m.snapshot &&
              m.snapshot.version === 1 &&
              integer(m.snapshot.seed) &&
              Array.isArray(m.snapshot.heroes) &&
              m.snapshot.heroes.length === 3 &&
              Array.isArray(m.snapshot.enemies) &&
              m.snapshot.enemies.length === 3,
            "Invalid match snapshot.",
          );
          check(
            m.result?.version === 1 &&
              typeof m.result.victory === "boolean" &&
              Array.isArray(m.result.events) &&
              m.result.events.length >= 2 &&
              m.result.events.length <= 602 &&
              Number.isFinite(m.result.duration),
            "Invalid replay.",
          );
          for (const e of m.result.events)
            check(
              Number.isFinite(e.at) &&
                e.at >= 0 &&
                typeof e.text === "string" &&
                e.text.length < 500 &&
                [e.heroes, e.enemies].every(
                  (units) =>
                    Array.isArray(units) &&
                    units.length === 3 &&
                    units.every(
                      (u) =>
                        typeof u.id === "string" &&
                        typeof u.name === "string" &&
                        Number.isFinite(u.hp) &&
                        u.hp >= 0 &&
                        Number.isFinite(u.maxHp) &&
                        u.maxHp > 0,
                    ),
                ),
              "Invalid replay event.",
            );
        }
        check(
          !h.market ||
            (integer(h.market.nextAt) &&
              integer(h.market.sales) &&
              typeof h.market.last === "string" &&
              h.market.last.length < 300),
          "Invalid town market.",
        );
        check(
          h.activeMatch == null ||
            h.matches.some((m) => m.id === h.activeMatch && !m.paid),
          "Missing active match.",
        );
        check(
          h.catalogue &&
            typeof h.catalogue.enabled === "boolean" &&
            (!h.catalogue.recipeId || data.recipes[h.catalogue.recipeId]) &&
            integer(h.catalogue.reserve) &&
            h.catalogue.reserve <= 1000 &&
            typeof h.catalogue.autoBuy === "boolean",
          "Invalid catalogue policy.",
        );
        check(
          typeof h.autoDeliver === "boolean" &&
            (h.deliveryVersion == null || h.deliveryVersion === 1) &&
            H.grades[h.gradeMode] &&
            h.graded &&
            Object.entries(h.graded).every(
              ([id, grades]) =>
                W.metals.includes(id) &&
                Object.entries(grades).every(
                  ([grade, n]) =>
                    grade !== "standard" && H.grades[grade] && integer(n),
                ) &&
                Object.values(grades).reduce((a, b) => a + b, 0) <=
                  (s.materials[id + "_ingot"] || 0),
            ),
          "Invalid graded metal.",
        );
        check(
          h.exhibition == null ||
            (integer(h.exhibition.league) &&
              h.exhibition.league < 5 &&
              integer(h.exhibition.rung) &&
              h.exhibition.rung < 3 &&
              H.rivals.some((r) => r.id === h.exhibition.rival)),
          "Invalid exhibition policy.",
        );
        check(
          h.goal == null || H.rivals.some((r) => r.id === h.goal),
          "Invalid crafting objective.",
        );
        for (const j of s.jobs)
          if (j.houseIntent)
            check(
              ["team", "catalogue", "stock", "practice"].includes(
                j.houseIntent,
              ) &&
                H.grades[j.grade] &&
                H.treatments[j.treatment] &&
                integer(j.treatmentGold),
              "Invalid craft intention.",
            );
        for (const j of [...s.jobs, ...s.workshop.jobs])
          if (j.gradeInputs)
            check(
              Object.entries(j.gradeInputs).every(
                ([metal, grades]) =>
                  W.metals.includes(metal) &&
                  Object.entries(grades).every(
                    ([grade, n]) =>
                      ["tough", "spring"].includes(grade) && integer(n),
                  ) &&
                  Object.values(grades).reduce((a, b) => a + b, 0) <=
                    (j.inputs[metal + "_ingot"] || 0),
              ),
              "Invalid reserved alloy grade.",
            );
        for (const i of [
          ...s.inventory,
          ...s.adventurers.flatMap((u) =>
            Object.values(u.equipment).filter(Boolean),
          ),
        ])
          check(
            (!i.grade || H.grades[i.grade]) &&
              (!i.treatment || H.treatments[i.treatment]),
            "Invalid item properties.",
          );
        return v;
      } catch (e) {
        return no(e.message);
      }
    }
    advanceOffline(now = Date.now()) {
      const h = this.state.house,
        before = { wins: h.wins, losses: h.losses, contracts: h.contracts };
      const result = super.advanceOffline(now);
      if (result.report) {
        const r = result.report;
        r.victories = h.wins - before.wins;
        r.defeats = h.losses - before.losses;
        r.contracts = h.contracts - before.contracts;
        if (
          this.state.inventory.length + this.state.jobs.length >=
          this.derived().storageCapacity
        )
          r.stopReason = "Armoury storage is reserved or full.";
        else if (h.rung === 3)
          r.stopReason =
            "Qualification complete. Launch the champion when you are ready.";
        else if (h.catalogue.enabled) r.stopReason = this.catalogueStatus();
        else if (this.state.workshop.smeltPolicy.enabled)
          r.stopReason = this.smeltPolicyStatus();
      }
      return result;
    }
    importSave(raw) {
      const v = House.validateSave(raw, this.data);
      if (!v.ok) return v;
      this.state = v.state;
      if (!this.state.house.deliveryVersion) {
        this.state.house.autoDeliver = true;
        this.state.house.deliveryVersion = 1;
      }
      this._migrate();
      this._migrateWorkshop();
      this._settleRoster();
      this._previewCache.clear();
      return yes("Arena house imported.");
    }
    static convertClassic(raw, data) {
      const v = Workshop.validateSave(raw, data);
      if (!v.ok) return v;
      if (v.state.house)
        return no("This is already an Arena house. Import it normally.");
      const classic = new Workshop(data, v.state);
      for (const run of [...classic.state.runs])
        if (!run.rewardApplied) classic._return(run);
      const s = classic.state,
        h = freshHouse();
      s.house = h;
      h.conversion = {
        from: "Classic 2.x",
        at: s.simTime,
        questWins: copy(s.questWins),
        runs: copy(s.runs),
        credit: 0,
      };
      s.workshop.archivedPatterns = [
        ...new Set([
          ...s.workshop.archivedPatterns,
          ...Object.values(data.recipes)
            .filter((r) => !r.legacyTalent && classic._recipeKnown(r))
            .map((r) => r.id),
        ]),
      ];
      h.history = [
        {
          text: "The Classic workshop becomes a new arena house. Its quest history is preserved.",
          generation: s.player.legacy.generation,
        },
      ];
      // Preserve paid capabilities, materials, gear and staff. Only the new competition starts at the yard.
      s.runs = [];
      s.commissions = [];
      s.world.bossParty = [];
      s.world.bossTarget = null;
      s.world.bossAutoLaunch = false;
      s.adventurers.forEach((u) => {
        u.status = "ready";
        u.runId = null;
        u.recoverUntil = 0;
      });
      h.team = s.adventurers.slice(0, 3).map((u) => u.id);
      return yes(
        "Classic workshop preserved; arena qualification begins at the Cinder Yard.",
        s,
      );
    }
    act(name, payload = {}) {
      const actions = {
        smelt: "_smelt",
        cancelSmelt: "_cancelSmelt",
        houseUpgrade: "_houseUpgrade",
        equip: "_equipHouse",
        unequip: "_unequipHouse",
        team: "_team",
        formation: "_formation",
        challenge: "_challenge",
        deliverContract: "_deliverContract",
        housePolicy: "_housePolicy",
        seen: "_seen",
        pinResponse: "_pinResponse",
        pocket: "_pocket",
        charter: "_charter",
      };
      if (!actions[name]) return super.act(name, payload);
      if (!this.state.started && name !== "charter")
        return no("Create your smith first.");
      try {
        const r = this[actions[name]](payload);
        if (r.ok) {
          this._refreshUnlocks();
          this._startJobs();
          this._previewCache.clear();
        }
        return r;
      } catch (e) {
        return no(e.message);
      }
    }
    _create(payload) {
      if (
        !H.professions[payload.profession || "weaponsmith"] ||
        !H.origins[payload.origin || "village"] ||
        !H.vows[payload.vow || "patient"]
      )
        return no("Choose a calling, origin and working vow.");
      const h = this.state.house;
      h.origin = payload.origin || "village";
      h.vow = payload.vow || "patient";
      const r = super._create(payload);
      if (!r.ok) return r;
      const p = this.state.world.profession,
        o = H.origins[h.origin];
      this._deliver({ materials: o.supplies, gold: o.gold || 0 });
      if (p === "merchant" && h.vow !== "independent")
        this._deliver({ gold: 12 });
      if (p === "mechanist") this.state.workshop.upgrades.stockkeeper = 1;
      if (p === "runesage") h.upgrades.patterns = 1;
      if (this.state.player.legacy.generation > 1) {
        if (h.charter === "workforce")
          this.state.world.miners.push({
            id: "miner-" + (this.state.world.miners.length + 1),
            assigned: "fuel",
            working: "fuel",
            progress: 0,
          });
        if (h.charter === "patron") this._deliver({ gold: 60 });
        if (h.charter === "archive") {
          h.upgrades.patterns = 1;
          for (const c of Object.values(this.state.player.proficiency))
            c.level = Math.max(c.level, 4);
        }
      }
      this._settleRoster();
      h.team = this.state.adventurers.slice(0, 3).map((u) => u.id);
      this._ensureContracts();
      return yes(
        "Your house begins. Smelt bronze, equip the trio and enter the yard.",
      );
    }
    _effects() {
      const e = super._effects(),
        h = this.state?.house;
      if (!h) return e;
      const p = this.state.world?.profession,
        old = P.professions[p]?.effects || {},
        def = H.professions[p];
      if (def) {
        for (const [k, n] of Object.entries(old)) e[k] = (e[k] || 0) - n;
        for (const [k, n] of Object.entries(def.effects))
          e[k] = (e[k] || 0) + n;
      }
      for (const [k, n] of Object.entries(H.vows[h.vow]?.effects || {}))
        e[k] = (e[k] || 0) + n;
      for (const [id, rank] of Object.entries(h.upgrades))
        for (const [k, n] of Object.entries(H.upgrades[id]?.effects || {}))
          e[k] = (e[k] || 0) + n * rank;
      e.contractPay =
        (e.contractPay || 0) + (e.commissionPay || 0) + (e.budget || 0) * 0.25;
      e.reputationBonus = (e.reputationBonus || 0) + (e.relationship || 0);
      return e;
    }
    derived() {
      const d = super.derived();
      if (this.state.house) {
        d.partySize = 3;
        d.legacyEligible = this.state.house.champions === 5;
        d.legacyReward = d.legacyEligible
          ? 46 +
            Math.min(12, Math.floor(this.state.house.contracts / 25)) +
            Math.min(8, this.state.house.hallmarks.length)
          : 0;
      }
      return d;
    }
    staffPrice(id) {
      return Math.ceil(
        super.staffPrice(id) * (H.vows[this.state.house?.vow]?.hire || 1),
      );
    }
    _settleRoster() {
      if (!this.state.house) return;
      for (const u of this.state.adventurers) {
        u.status = "ready";
        u.runId = null;
        u.recoverUntil = 0;
      }
      if (!this.state.house.team.length)
        this.state.house.team = this.state.adventurers
          .slice(0, 3)
          .map((u) => u.id);
    }
    _reconcileAdventurers() {
      if (this.state?.house) this._settleRoster();
      else super._reconcileAdventurers();
    }
    _relationshipMilestones() {
      /* The house's contract and league records replace customer relationships. */
    }
    _runNpcs() {
      this._settleRoster();
      this._equipCompletedTeamWork();
      this._deliverReadyContracts();
      this._restockShelves();
      const h = this.state.house,
        m = h.market;
      if (m && this.state.simTime >= m.nextAt) {
        const i = this.state.inventory.find(
          (i) => i.displayed && !this._protected(i),
        );
        if (i) {
          const name = this.data.recipes[i.recipeId].name,
            price = this.salePreview(i.id).price;
          this._sell({ itemId: i.id });
          m.sales++;
          m.last = name + " sold to a town buyer for " + price + "g.";
        } else
          m.last =
            "A visitor browsed. Contract stock and protected gear were kept.";
        m.nextAt =
          this.state.simTime +
          Math.round(60000 / (1 + (this._effects().arrival || 0)));
      }
    }
    _dispatch() {
      return no("House fighters compete in the Arena.");
    }
    _townPrice(item) {
      const r = this.data.recipes[item.recipeId];
      const replacement = Object.entries(r.inputs).reduce(
        (n, [id, q]) => n + (this.materialPrice(id) || 0) * q,
        0,
      );
      const base = (r.basePrice || 1) * (0.75 + 0.004 * item.quality);
      return Math.max(
        1,
        Math.floor(
          Math.min(replacement * 0.65, base * 0.55) *
            this.derived().priceMultiplier,
        ),
      );
    }
    _runAutomation() {
      if (!this.state.house) return;
      this._autoSmelt();
      const h = this.state.house;
      this._deliverReadyContracts();
      const c = h.catalogue,
        r = this.data.recipes[c.recipeId];
      if (
        c.enabled &&
        h.upgrades.catalogue &&
        r &&
        this.state.jobs.length < this.derived().stationCount
      ) {
        const demand = h.orders.find(
          (o) => o.classId === r.classId && o.tier <= r.tier,
        );
        const ready = this.state.inventory.filter(
          (i) =>
            !this._protected(i) &&
            this.data.recipes[i.recipeId].classId === r.classId &&
            this.data.recipes[i.recipeId].tier >= (demand?.tier || 1) &&
            i.quality >= (demand?.quality || 0),
        ).length;
        if (
          demand &&
          this.craftPreview(r.id).quality >= demand.quality &&
          ready + this.state.jobs.filter((j) => j.recipeId === r.id).length <
            demand.quantity
        ) {
          if (c.autoBuy) {
            for (const [id, n] of Object.entries(r.inputs))
              if (
                this.data.materials[id]?.purchasedSupply &&
                this.state.materials[id] < n + c.reserve
              ) {
                const qty = n + c.reserve - this.state.materials[id],
                  cost = this.materialPrice(id) * qty;
                if (
                  this.state.player.gold - cost >= 20 &&
                  (!this._offline ||
                    this._offlineSpend + cost <= this.state.automation.spendCap)
                ) {
                  const bought = this._buyMaterial({
                    materialId: id,
                    quantity: qty,
                  });
                  if (bought.ok && this._offline) this._offlineSpend += cost;
                }
              }
          }
          if (
            Object.entries(r.inputs).every(
              ([id, n]) => this.state.materials[id] >= n + c.reserve,
            ) &&
            this.craftPreview(r.id).eligible
          )
            this.act("craft", { recipeId: r.id, intent: "catalogue" });
        }
      }
      if (
        h.exhibition &&
        !h.activeMatch &&
        h.upgrades.exhibitions &&
        this.teamReady()
      )
        this._challenge({ ...h.exhibition, kind: "exhibition" });
    }
    _extraEventTimes() {
      const times = super._extraEventTimes(),
        m = this.activeMatch();
      if (m) times.push(m.endsAt);
      return times;
    }
    activeMatch() {
      const h = this.state.house;
      return h?.matches.find((m) => m.id === h.activeMatch) || null;
    }
    _seen({ room }) {
      if (!H.rooms[room]) return no("Unknown room.");
      if (!this.state.house.seen.includes(room))
        this.state.house.seen.push(room);
      return yes("Overview saved.");
    }
    _pinResponse({ rival = null }) {
      if (rival && !H.rivals.some((r) => r.id === rival))
        return no("Unknown rival.");
      this.state.house.goal = rival;
      return yes(
        rival
          ? "Crafting response pinned across the workshop."
          : "Goal cleared.",
      );
    }
    _charter({ id }) {
      if (!["workforce", "patron", "archive"].includes(id))
        return no("Unknown charter.");
      this.state.house.charter = id;
      return yes("Inheritance charter selected.");
    }
    _retire(payload) {
      const h = this.state.house,
        history = [
          ...h.history,
          {
            generation: this.state.player.legacy.generation,
            text: this.state.shopName + " won the Crown of Embers.",
            hallmarks: copy(h.hallmarks),
          },
        ],
        seen = [...h.seen],
        charter = h.charter;
      const r = super._retire(payload);
      if (r.ok) {
        this.state.house.history = history.slice(-20);
        this.state.house.seen = seen;
        this.state.house.charter = charter;
      }
      return r;
    }
    upgradePreview(id) {
      const n = H.upgrades[id];
      if (!n) return { eligible: false, reason: "Unknown improvement." };
      const s = this.state,
        h = s.house,
        rank = h.upgrades[id] || 0,
        cost = Math.ceil(n.cost * this.upgradeScale() ** rank);
      const gates = [
        n.parent && !h.upgrades[n.parent]
          ? "Develop " + H.upgrades[n.parent].name
          : null,
        n.champions > h.champions
          ? "Defeat " +
            n.champions +
            " league champion" +
            (n.champions === 1 ? "" : "s")
          : null,
        n.mined > s.world.totalMined
          ? "Extract " + n.mined + " total materials"
          : null,
        n.reputation * (rank + 1) > s.player.reputation
          ? "Earn " + n.reputation * (rank + 1) + " house reputation"
          : null,
        n.contracts > h.contracts
          ? "Fulfil " + n.contracts + " contracts"
          : null,
        n.wins > h.wins ? "Win " + n.wins + " arena matches" : null,
        n.level > s.player.level ? "Reach smith level " + n.level : null,
      ].filter(Boolean);
      const reason =
        rank >= n.max
          ? "Fully developed."
          : gates[0] ||
            (s.player.gold < cost
              ? "Need " + cost + " gold."
              : "Ready to develop.");
      return {
        rank,
        cost,
        gates,
        reason,
        eligible: reason === "Ready to develop.",
      };
    }
    _houseUpgrade({ id }) {
      const v = this.upgradePreview(id);
      if (!v.eligible) return no(v.reason);
      this.state.player.gold -= v.cost;
      this.state.house.upgrades[id] = v.rank + 1;
      if (["breaker", "guardian", "mage"].includes(id)) {
        const def = this.data.heroes.find(
          (u) =>
            u.archetypeId === id &&
            !this.state.world.unlockedHeroIds.includes(u.id),
        );
        if (def) {
          this.state.world.unlockedHeroIds.push(def.id);
          this._registerCustomers();
          this._arrive(true);
          this._settleRoster();
        }
      }
      return yes(H.upgrades[id].name + " developed.");
    }
    currencies() {
      const c = super.currencies();
      if (this.state.house)
        for (const k of ["mine", "forge", "shop", "adventurers", "employees"])
          c[k] = this.state.player.gold;
      return c;
    }
    hireCost() {
      const n = this.state.world.miners.length;
      return Math.ceil(
        35 *
          1.85 ** (n - 1) *
          (n === 1 && this.state.world.profession === "prospector" ? 0.6 : 1),
      );
    }
    _hireMiner() {
      const s = this.state,
        cost = this.hireCost();
      if (s.world.miners.length >= this.derived().workerCapacity)
        return no("Develop Crew quarters for another miner slot.");
      if (s.player.gold < cost) return no("Need " + cost + " gold.");
      s.player.gold -= cost;
      const id = "miner-" + (s.world.miners.length + 1);
      s.world.miners.push({
        id,
        assigned: "fuel",
        working: "fuel",
        progress: 0,
      });
      return yes("A miner joined the crew.");
    }
    _pocket({ materialId }) {
      const h = this.state.house;
      if (!h.upgrades.survey) return no("Develop the Surveyor’s ledger.");
      if (h.nextPocket > this.state.simTime)
        return no("The next pocket has not been surveyed.");
      if (!this.seams().some((s) => s.id === materialId))
        return no("Choose an open seam.");
      h.nextPocket = this.state.simTime + 600000;
      const amount = this.state.world.profession === "prospector" ? 9 : 6;
      this._deliver({ materials: { [materialId]: amount } });
      return yes(
        "Recovered " +
          amount +
          " materials. The next pocket is available in ten minutes.",
      );
    }
    _recipeKnown(r) {
      if (!this.state.house) return super._recipeKnown(r);
      if (!this.availableClasses().includes(r.classId)) return false;
      if (r.legacyTalent)
        return this.state.player.talents.includes(r.legacyTalent);
      if (
        this.state.workshop?.archivedPatterns?.includes(r.id) ||
        this.state.player.legacy.unlockedRecipes.includes(r.id)
      )
        return true;
      const h = this.state.house;
      if (r.variant === 2 && !h.upgrades.prestige) return false;
      return r.tier === 1
        ? r.variant === 0 || !!h.upgrades.patterns
        : !!h.upgrades["patterns_" + r.tier];
    }
    _gates(req = {}) {
      if (!this.state?.house) return super._gates(req);
      // House pattern purchases are the machinery licence. Mastery and attributes remain meaningful.
      const r = copy(req);
      if (r.questWins)
        for (const id of Object.keys(r.questWins)) {
          const q = this.data.quests[id];
          if (q) delete r.questWins[id];
        }
      return super._gates(r);
    }
    smeltUpgradePreview(id) {
      const v = super.smeltUpgradePreview(id),
        tier = W.metals.indexOf(id);
      if (
        tier > this.state.house.champions &&
        !this.state.workshop.upgrades[id]
      ) {
        v.eligible = false;
        v.reason =
          "Defeat league champion " + tier + " for the material licence.";
      }
      return v;
    }
    craftPreview(id, options = {}) {
      const v = super.craftPreview(id, options),
        r = this.data.recipes[id];
      if (!r || !this.state.house) return v;
      const h = this.state.house;
      v.seconds *= H.vows[h.vow]?.time || 1;
      const treatment = options.treatment || "plain",
        grade = options.grade || "standard",
        intent = options.intent || "team";
      const t = H.treatments[treatment],
        g = H.grades[grade];
      let reason = "";
      if (
        !t ||
        !g ||
        !["team", "catalogue", "stock", "practice"].includes(intent)
      )
        reason = "Choose a valid craft purpose and treatment.";
      else if (treatment !== "plain" && !this.treatmentAvailable(id, treatment))
        reason =
          "Develop Controlled treatments and " + t.mastery + " class mastery.";
      else if (
        grade !== "standard" &&
        (h.graded[r.materialId.replace("_ingot", "")]?.[grade] || 0) <
          (r.inputs[r.materialId] || 0) * (options.quantity || 1)
      )
        reason =
          "Smelt enough " +
          g.name.toLowerCase() +
          " " +
          this.data.materials[r.materialId].name +
          ".";
      v.treatmentGold =
        this.treatmentCost(id, treatment) * (options.quantity || 1);
      v.gold += v.treatmentGold;
      if (this.state.player.gold < v.gold)
        reason = "Need " + v.gold + " gold for the chosen preparation.";
      const fee = v.gold / Math.max(1, options.quantity || 1);
      if (fee > 0)
        v.maxQuantity = Math.min(
          v.maxQuantity,
          Math.floor(this.state.player.gold / fee),
        );
      if (grade !== "standard" && g) {
        const needed = r.inputs[r.materialId] || 0;
        if (needed)
          v.maxQuantity = Math.min(
            v.maxQuantity,
            Math.floor(
              (h.graded[r.materialId.replace("_ingot", "")]?.[grade] || 0) /
                needed,
            ),
          );
      }
      if (reason) {
        v.eligible = false;
        v.reason = reason;
      }
      return v;
    }
    treatmentAvailable(recipeId, id) {
      const r = this.data.recipes[recipeId],
        p = this.state.player.proficiency[r.classId].level;
      if (id === "plain") return true;
      if (id === "warding" && this.state.world.profession === "artificer")
        return true;
      return (
        !!this.state.house.upgrades.treatment && p >= H.treatments[id].mastery
      );
    }
    treatmentCost(recipeId, id) {
      const t = H.treatments[id];
      if (!t) return 0;
      const r = this.data.recipes[recipeId],
        p = this.state.world.profession,
        mastered = this.state.player.proficiency[r.classId].level >= 12;
      return mastered &&
        ((p === "weaponsmith" && id === "keen" && r.slot === "weapon") ||
          (p === "armorer" && id === "reinforced" && r.slot !== "weapon") ||
          (p === "artificer" && id === "warding"))
        ? 0
        : t.cost * r.tier;
    }
    _craft(payload) {
      const {
          recipeId,
          quantity = 1,
          intent = "team",
          heroId = null,
          treatment = "plain",
          grade = "standard",
        } = payload,
        v = this.craftPreview(recipeId, payload);
      if (!v.eligible) return no(v.reason);
      if (
        intent === "team" &&
        heroId &&
        !this.state.adventurers.some((u) => u.id === heroId)
      )
        return no("Choose a house fighter.");
      const stocks = { ...this.state.materials },
        before = new Set(this.state.jobs.map((j) => j.id)),
        r = super._craft({
          recipeId,
          quantity,
          materialId: payload.materialId,
          enchantmentId: payload.enchantmentId,
        });
      if (!r.ok) return r;
      this.state.player.gold -= v.treatmentGold;
      const recipe = this.data.recipes[recipeId],
        key = recipe.materialId.replace("_ingot", "");
      for (const j of this.state.jobs.filter((j) => !before.has(j.id)))
        Object.assign(j, {
          recipeCostVersion: this.data.houseRecipeCostVersion,
          houseIntent: intent,
          heroId,
          treatment,
          grade,
          treatmentGold: v.treatmentGold / quantity,
          gradeInputs: this._consumeGrades(
            j.inputs,
            stocks,
            grade === "standard" ? {} : { [recipe.materialId]: grade },
          ),
        });
      return yes(
        quantity +
          " " +
          intent +
          " piece" +
          (quantity === 1 ? "" : "s") +
          " queued. Ingredients and preparation fees are reserved.",
      );
    }
    _cancel(payload) {
      const j = this.state.jobs.find((j) => j.id === payload.jobId),
        snapshot = j && copy(j),
        r = super._cancel(payload);
      if (r.ok && snapshot?.houseIntent) {
        this.state.player.gold += snapshot.treatmentGold || 0;
        this._refundGrades(snapshot.gradeInputs);
      }
      return r;
    }
    _protect(payload) {
      const r = super._protect(payload),
        item = this._item(payload.itemId);
      if (r.ok && !this._protected(item)) {
        item.autoEquipPending = false;
        if (item.intent === "team") item.intent = "stock";
      }
      return r;
    }
    _completeJob(job) {
      const prof =
          this.state.player.proficiency[
            this.data.recipes[job.recipeId].classId
          ],
        before = prof.xp;
      super._completeJob(job);
      const item = this.state.inventory.at(-1);
      if (!item) return;
      item.grade = job.grade || "standard";
      item.treatment = job.treatment || "plain";
      item.intent = job.houseIntent || "catalogue";
      if (item.intent === "team") {
        item.protected = true;
        item.displayed = false;
        item.reservedFor = job.heroId || null;
        item.autoEquipPending = true;
      }
      if (
        item.intent === "practice" &&
        this.state.world.profession === "runesage"
      ) {
        prof.xp +=
          Math.max(1, this.data.recipes[item.recipeId].classXp || 8) * 0.2;
        while (prof.level < 100 && prof.xp >= 6 + 2 * prof.level) {
          prof.xp -= 6 + 2 * prof.level;
          prof.level++;
        }
      }
      this._equipCompletedTeamWork();
      this._deliverReadyContracts();
      this._restockShelves();
    }
    _equipCompletedTeamWork() {
      for (const item of [...this.state.inventory]) {
        if (
          !item.autoEquipPending ||
          item.intent !== "team" ||
          !this._protected(item)
        )
          continue;
        const heroes = item.reservedFor
          ? this.state.adventurers.filter((u) => u.id === item.reservedFor)
          : this.state.adventurers;
        for (const hero of heroes) {
          const preview = this.equipmentPreview(hero.id, item.id);
          if (preview.eligible && preview.improves) {
            this._equipHouse({ heroId: hero.id, itemId: item.id });
            break;
          }
        }
      }
    }
    _finishingMultiplier(recipeId) {
      return (
        (H.vows[this.state.house?.vow]?.finish || 1) *
        (this.state.world.profession === "armorer" &&
        this.data.recipes[recipeId].slot !== "weapon"
          ? 0.8
          : 1)
      );
    }
    techniquePreview(id) {
      const v = super.techniquePreview(id),
        j = this.state.jobs.find((j) => j.id === id);
      if (j)
        v.addedSeconds =
          Math.round(
            v.addedSeconds * 1000 * this._finishingMultiplier(j.recipeId),
          ) / 1000;
      return v;
    }
    _applyFinishing(j) {
      const duration = j.duration,
        oldEnd = j.completeAt;
      super._applyFinishing(j);
      const mult = this._finishingMultiplier(j.recipeId);
      if (mult !== 1) {
        const added = Math.round((j.duration - duration) * mult);
        j.duration = duration + added;
        j.completeAt = oldEnd + added;
      }
    }
    _itemCombat(item) {
      const s = super._itemCombat(item);
      if (!item) return s;
      const t = H.treatments[item.treatment]?.effects || {},
        g = item.grade;
      for (const key of ["health", "armor", "attack"])
        s[key] = (s[key] || 0) * (1 + (t[key] || 0));
      s.armorPen = (s.armorPen || 0) + (t.armorPen || 0);
      s.crit = (s.crit || 0) + (t.crit || 0);
      if (s.interval) s.interval *= 1 + (t.slow || 0);
      s.resistances ??= {};
      for (const key of ["fire", "arcane"])
        s.resistances[key] = (s.resistances[key] || 0) + (t[key] || 0);
      if (g === "tough") {
        s.health *= 1.15;
        s.armor *= 1.15;
        if (s.interval) s.interval *= 1.07;
      }
      if (g === "spring") {
        s.attack *= 1.1;
        s.armor *= 0.9;
        s.evasion = (s.evasion || 0) + 0.06;
      }
      return s;
    }
    smeltPreview(id, quantity = 1, grade = "standard") {
      const v = super.smeltPreview(id, quantity),
        g = H.grades[grade],
        r = W.smelts[id];
      if (!g || !r)
        return { ...v, eligible: false, reason: "Choose a valid alloy grade." };
      if (grade !== "standard") {
        v.inputs = {
          ...v.inputs,
          fuel: (v.inputs.fuel || 0) + g.cost * quantity,
        };
        v.maxQuantity = Math.min(
          v.maxQuantity,
          Math.floor(
            this.state.materials.fuel / ((r.inputs.fuel || 0) + g.cost),
          ),
        );
        if (!this.state.staff.assayer || !this.staffEfficiency("assayer")) {
          v.eligible = false;
          v.reason = "Hire Elsbet the Assayer and keep her on duty.";
        } else if (this.state.materials.fuel < v.inputs.fuel) {
          v.eligible = false;
          v.reason = "Not enough coal for this grade.";
        }
      }
      return v;
    }
    _smelt(payload) {
      const grade = payload.grade || "standard",
        g = H.grades[grade],
        q = payload.quantity || 1;
      if (!g) return no("Unknown alloy grade.");
      if (
        grade !== "standard" &&
        (!this.state.staff.assayer || !this.staffEfficiency("assayer"))
      )
        return no(
          "Hire Elsbet the Assayer and keep her on duty to prepare graded metal.",
        );
      if (
        this.state.materials.fuel <
        (W.smelts[payload.id]?.inputs.fuel || 0) * q + g.cost * q
      )
        return no("Not enough coal for this grade.");
      const stocks = { ...this.state.materials },
        ids = new Set(this.state.workshop.jobs.map((j) => j.id)),
        r = super.act("smelt", payload);
      if (r.ok) {
        this.state.materials.fuel -= g.cost * q;
        for (const j of this.state.workshop.jobs.filter(
          (j) => !ids.has(j.id),
        )) {
          j.grade = grade;
          j.gradeFuel = g.cost;
          j.gradeInputs = this._consumeGrades(j.inputs, stocks);
        }
      }
      return r;
    }
    _consumeGrades(inputs, stocks, preferred = {}) {
      const escrow = {};
      for (const [id, amount] of Object.entries(inputs)) {
        if (!id.endsWith("_ingot")) continue;
        const metal = id.replace("_ingot", ""),
          grades = this.state.house.graded[metal] || {},
          total = Object.values(grades).reduce((a, b) => a + b, 0);
        let needed = preferred[id]
          ? amount
          : Math.max(0, amount - Math.max(0, (stocks[id] || 0) - total));
        for (const grade of preferred[id]
          ? [preferred[id]]
          : ["tough", "spring"]) {
          const n = Math.min(needed, grades[grade] || 0);
          if (n) {
            grades[grade] -= n;
            escrow[metal] ??= {};
            escrow[metal][grade] = n;
            needed -= n;
          }
        }
        stocks[id] -= amount;
      }
      return escrow;
    }
    _refundGrades(escrow = {}) {
      for (const [metal, grades] of Object.entries(escrow)) {
        this.state.house.graded[metal] ??= {};
        for (const [grade, n] of Object.entries(grades))
          this.state.house.graded[metal][grade] =
            (this.state.house.graded[metal][grade] || 0) + n;
      }
    }
    _sellMaterial(p) {
      const before = { ...this.state.materials },
        r = super._sellMaterial(p);
      if (r.ok)
        this._consumeGrades({ [p.materialId]: p.quantity || 1 }, before);
      return r;
    }
    _reconcileGrades() {
      const h = this.state.house;
      if (!h) return;
      for (const [id, grades] of Object.entries(h.graded)) {
        let left = this.state.materials[id + "_ingot"] || 0;
        for (const grade of ["tough", "spring"]) {
          grades[grade] = Math.min(grades[grade] || 0, left);
          left -= grades[grade];
        }
      }
    }
    _deliver(bundle) {
      const r = super._deliver(bundle);
      if (this.state.house) this._reconcileGrades();
      return r;
    }
    _processExtraEvents() {
      const completed = this.state.workshop.jobs
          .filter(
            (j) => j.status === "active" && j.completeAt <= this.state.simTime,
          )
          .map(copy),
        before = copy(this.state.materials);
      super._processExtraEvents();
      for (const j of completed) {
        const recipe = W.smelts[j.recipeId],
          accepted = Math.max(
            0,
            Math.min(
              recipe.amount + this.smelterDerived().extraIngots,
              (this.state.materials[recipe.output] || 0) -
                (before[recipe.output] || 0),
            ),
          );
        if (j.grade && j.grade !== "standard") {
          this.state.house.graded[j.recipeId] ??= {};
          this.state.house.graded[j.recipeId][j.grade] =
            (this.state.house.graded[j.recipeId][j.grade] || 0) + accepted;
        }
        before[recipe.output] = (before[recipe.output] || 0) + accepted;
      }
      const m = this.activeMatch();
      if (m && m.endsAt <= this.state.simTime) this._settleMatch(m);
    }
    _cancelSmelt({ id }) {
      const job = this.state.workshop.jobs.find((j) => j.id === id);
      if (
        job?.gradeFuel &&
        this.state.materials.fuel + (job.inputs.fuel || 0) + job.gradeFuel >
          this.binCapacity()
      )
        return no("Make room for the full coal refund.");
      const fuel = job?.gradeFuel || 0,
        escrow = copy(job?.gradeInputs || {}),
        r = super.act("cancelSmelt", { id });
      if (r.ok) {
        this.state.materials.fuel += fuel;
        this._refundGrades(escrow);
      }
      return r;
    }
    equipmentPreview(heroId, itemId) {
      const u = this.state.adventurers.find((u) => u.id === heroId),
        i = this._item(itemId),
        r = i && this.data.recipes[i.recipeId];
      if (!u || !r)
        return {
          eligible: false,
          reason: "Choose a fighter and an owned item.",
        };
      if (this.activeMatch()?.snapshot.heroes.some((x) => x.id === heroId))
        return {
          eligible: false,
          reason: "Wait for this fighter’s current bout.",
        };
      if (!this.data.archetypes[u.archetypeId].preferences.includes(r.classId))
        return {
          eligible: false,
          reason:
            "This class cannot equip " +
            this.data.classes[r.classId].name +
            ".",
        };
      if (
        r.slot === "offhand" &&
        u.equipment.weapon &&
        this.data.recipes[u.equipment.weapon.recipeId].twoHanded
      )
        return {
          eligible: false,
          reason: "Unequip the two-handed weapon first.",
        };
      const displaced = [
        u.equipment[r.slot],
        ...(r.twoHanded ? [u.equipment.offhand] : []),
      ].filter(Boolean);
      if (
        this.state.inventory.length +
          this.state.jobs.length -
          1 +
          displaced.length >
        this.derived().storageCapacity
      )
        return {
          eligible: false,
          reason: "Make warehouse space for displaced equipment.",
        };
      const after = copy(u);
      after.equipment[r.slot] = i;
      if (r.twoHanded) after.equipment.offhand = null;
      const beforeStats = this._arenaStats(u),
        afterStats = this._arenaStats(after);
      const fields = [
        ["attack", "Damage", "number"],
        ["health", "Health", "number"],
        ["armor", "Armour", "number"],
        ["interval", "Swing time", "seconds"],
        ["crit", "Critical chance", "percent"],
        ["block", "Block chance", "percent"],
        ["evasion", "Evasion", "percent"],
        ["armorPen", "Piercing", "number"],
        ["aoe", "Cleave", "percent"],
        ["protection", "Team protection", "percent"],
        ...Object.keys({
          ...beforeStats.resistances,
          ...afterStats.resistances,
        }).map((k) => [
          "resistances." + k,
          k[0].toUpperCase() + k.slice(1) + " ward",
          "percent",
        ]),
      ];
      const value = (stats, key) =>
        key.split(".").reduce((s, k) => s?.[k], stats) || 0;
      const changes = fields
        .map(([key, label, format]) => {
          const before = value(beforeStats, key),
            after = value(afterStats, key),
            delta = after - before;
          return {
            key,
            label,
            format,
            before,
            after,
            delta,
            improved: key === "interval" ? delta < 0 : delta > 0,
          };
        })
        .filter((c) => Math.abs(c.delta) > 1e-7);
      return {
        eligible: true,
        reason:
          "Equip freely. Replaced items return protected to the warehouse.",
        before: beforeStats,
        after: afterStats,
        changes,
        improves: changes.some((c) => c.improved),
        displaced,
      };
    }
    _equipHouse({ heroId, itemId }) {
      const v = this.equipmentPreview(heroId, itemId);
      if (!v.eligible) return no(v.reason);
      const u = this.state.adventurers.find((u) => u.id === heroId),
        i = this._item(itemId),
        r = this.data.recipes[i.recipeId];
      this.state.inventory = this.state.inventory.filter(
        (x) => x.id !== itemId,
      );
      for (const old of v.displaced)
        this.state.inventory.push({
          ...old,
          displayed: false,
          protected: true,
          reservedFor: null,
        });
      u.equipment[r.slot] = {
        ...i,
        displayed: false,
        protected: true,
        reservedFor: null,
        autoEquipPending: false,
      };
      if (r.twoHanded) u.equipment.offhand = null;
      return yes(u.name + " equipped " + r.name + ".");
    }
    _unequipHouse({ heroId, slot }) {
      const u = this.state.adventurers.find((u) => u.id === heroId);
      if (!u || !H.slots.includes(slot) || !u.equipment[slot])
        return no("That slot is already empty.");
      if (this.activeMatch()?.snapshot.heroes.some((x) => x.id === heroId))
        return no("Wait for the current bout.");
      if (
        this.state.inventory.length + this.state.jobs.length >=
        this.derived().storageCapacity
      )
        return no("Make warehouse space first.");
      this.state.inventory.push({
        ...u.equipment[slot],
        displayed: false,
        protected: true,
        reservedFor: null,
      });
      u.equipment[slot] = null;
      return yes("Equipment returned safely to the armoury.");
    }
    _team({ heroId }) {
      const h = this.state.house;
      if (h.activeMatch) return no("Wait for the current bout.");
      if (!this.state.adventurers.some((u) => u.id === heroId))
        return no("Unknown fighter.");
      if (h.team.includes(heroId))
        h.team = h.team.filter((id) => id !== heroId);
      else if (h.team.length < 3) h.team.push(heroId);
      else return no("Rest one of the three selected fighters first.");
      return yes("Team updated.");
    }
    _formation({ heroId, line, doctrine }) {
      const h = this.state.house;
      if (h.activeMatch) return no("Wait for the current bout.");
      if (doctrine) {
        if (
          !H.doctrines[doctrine] ||
          (doctrine !== "balanced" && !h.upgrades.doctrine)
        )
          return no("Develop the Tactical folio.");
        h.doctrine = doctrine;
      } else {
        if (
          !this.state.adventurers.some((u) => u.id === heroId) ||
          !["front", "back"].includes(line)
        )
          return no("Choose a front or back position.");
        h.lines[heroId] = line;
      }
      return yes("Formation updated.");
    }
    teamReady() {
      const h = this.state.house;
      return (
        h.team.length === 3 &&
        h.team.every((id) => (h.recovery[id] || 0) <= this.state.simTime)
      );
    }
    qualification(
      league = this.state.house.champions,
      rung = this.state.house.rung,
    ) {
      return (
        this.state.house.qualification[league * 3 + rung] || {
          wins: 0,
          styles: [],
        }
      );
    }
    rivalStats(rival, league, rung, champion = false) {
      const scale =
          H.leagues[league].scale * (1 + rung * 0.23) * (champion ? 1.28 : 1),
        style = H.rivals.find((r) => r.id === rival) || H.rivals[0];
      const base = [
        { health: 44, attack: 4.5, armor: 1.4, interval: 2.5, line: "front" },
        { health: 32, attack: 4, armor: 0.6, interval: 2.3, line: "front" },
        { health: 32, attack: 6, armor: 0.3, interval: 2.6, line: "back" },
      ];
      return base.map((u, i) => {
        const n = {
          ...u,
          id: "rival-" + i,
          name:
            (champion ? H.leagues[league].champion : style.name) +
            (i === 0 ? " · guard" : i === 1 ? " · second" : " · striker"),
          health: u.health * scale,
          attack: u.attack * scale,
          armor: u.armor * Math.sqrt(scale),
          crit: 0.04,
          evasion: 0,
          block: 0,
          armorPen: 0,
          damageType: "physical",
          resistances: {},
        };
        if (rival === "choir") {
          n.armor += i < 2 ? 1.5 * Math.sqrt(scale) : 0;
          n.block = i < 2 ? 0.12 : 0;
        }
        if (rival === "thread") {
          n.health *= 0.82;
          n.interval *= 0.74;
          n.evasion = 0.08;
        }
        if (rival === "lantern") {
          if (i > 0) {
            n.line = "back";
            n.health *= 0.72;
            n.damageType = "fire";
            n.attack *= 1.12;
          } else n.health *= 1.3;
        }
        return n;
      });
    }
    matchPreview({
      rival = "choir",
      league = this.state.house.champions,
      rung = this.state.house.rung,
      kind = "rival",
    } = {}) {
      const h = this.state.house;
      if (
        !integer(league) ||
        league > 5 ||
        !integer(rung) ||
        rung > 3 ||
        !["rival", "champion", "exhibition"].includes(kind) ||
        !H.rivals.some((r) => r.id === rival)
      )
        return {
          eligible: false,
          reason: "Choose a valid league, rung and opponent.",
          league: 0,
          rung: 0,
          kind,
          rival,
          enemies: [],
          purse: 0,
        };
      league = Math.min(4, league);
      rung = Math.min(2, rung);
      if (kind === "champion") {
        if (league !== h.champions)
          return {
            eligible: false,
            reason: "Challenge the current league champion.",
            league,
            rung,
            kind,
            rival,
            enemies: [],
            purse: 0,
          };
        rival = H.rivals[league % H.rivals.length].id;
        rung = 2;
      }
      const q = this.qualification(league, rung),
        isCleared =
          league < h.champions || (league === h.champions && rung < h.rung);
      const reason = h.activeMatch
        ? "A bout is underway."
        : h.team.length !== 3
          ? "Select exactly three fighters."
          : !this.teamReady()
            ? "Your selected fighters are recovering."
            : !H.rivals.some((r) => r.id === rival)
              ? "Choose a rival house."
              : kind === "champion" && (h.champions >= 5 || h.rung < 3)
                ? "Clear all three qualification rungs first."
                : kind === "rival" &&
                    (league !== h.champions || rung !== h.rung || h.rung === 3)
                  ? "Choose the current qualification rung."
                  : kind === "exhibition" &&
                      !isCleared &&
                      !q.styles.includes(rival)
                    ? "Beat this rival before repeating an exhibition."
                    : !h.team.some(
                          (id) =>
                            (h.lines[id] ||
                              this.data.archetypes[
                                this.state.adventurers.find((u) => u.id === id)
                                  .archetypeId
                              ].line) === "front",
                        )
                      ? "Place at least one fighter on the front line."
                      : "Ready to enter.";
      return {
        eligible: reason === "Ready to enter.",
        reason,
        league,
        rung,
        kind,
        rival,
        enemies: this.rivalStats(rival, league, rung, kind === "champion"),
        purse: this.matchPurse(league, rung, kind),
      };
    }
    matchPurse(league, rung, kind) {
      return Math.round(
        (kind === "champion" ? 90 : kind === "exhibition" ? 5 : 12) *
          [1, 2.1, 4.5, 9, 18][league] *
          (1 + rung * 0.15),
      );
    }
    _arenaStats(u) {
      const h = this.state.house,
        s = this._heroStats(u);
      s.line =
        h.lines[u.id] || this.data.archetypes[u.archetypeId].line || "front";
      if (h.doctrine === "hold") {
        s.armor *= 1.2;
        s.block = Math.min(0.65, s.block + 0.08);
        s.interval *= 1.1;
      }
      if (h.doctrine === "press") {
        s.attack *= 1.15;
        s.health *= 0.88;
      }
      const roles = new Set(
        h.team.map(
          (id) => this.state.adventurers.find((u) => u.id === id).archetypeId,
        ),
      );
      if (h.team.includes(u.id) && roles.size === 3)
        s.attack *= 1 + (this._effects().partySynergy || 0);
      return s;
    }
    heroStats(id) {
      const u = this.state.adventurers.find((u) => u.id === id);
      return u ? this._arenaStats(u) : null;
    }
    _challenge(payload) {
      const v = this.matchPreview(payload);
      if (!v.eligible) return no(v.reason);
      const h = this.state.house;
      const heroes = h.team.map((id) => {
        const u = this.state.adventurers.find((u) => u.id === id);
        return { ...this._arenaStats(u), equipment: copy(u.equipment) };
      });
      const snapshot = {
        version: Combat.VERSION,
        seed: Combat.hash(
          this.state.player.legacy.generation +
            ":" +
            v.league +
            ":" +
            v.rung +
            ":" +
            v.rival +
            ":" +
            v.kind,
        ),
        heroes,
        enemies: v.enemies,
        doctrine: h.doctrine,
      };
      const result = Combat.simulate(snapshot),
        id = "match-" + h.nextMatch++,
        m = {
          id,
          league: v.league,
          rung: v.rung,
          rival: v.rival,
          kind: v.kind,
          startedAt: this.state.simTime,
          endsAt: this.state.simTime + Math.ceil(result.duration),
          snapshot,
          result,
          paid: false,
          purse: v.purse,
        };
      h.matches.unshift(m);
      h.matches.length = Math.min(12, h.matches.length);
      h.activeMatch = id;
      return yes("The gates open. Your workshop keeps working.", {
        matchId: id,
      });
    }
    _settleMatch(m) {
      if (m.paid) return;
      m.paid = true;
      const s = this.state,
        h = s.house;
      h.activeMatch = null;
      if (m.result.victory) {
        h.wins++;
        this._deliver({ gold: m.purse });
        s.player.reputation +=
          m.kind === "champion"
            ? 10 * (m.league + 1)
            : m.kind === "exhibition"
              ? 0
              : 2;
        for (const unit of m.snapshot.heroes) {
          const u = s.adventurers.find((u) => u.id === unit.id);
          u.xp += 5 * (m.league + 1) * (1 + (this._effects().heroXp || 0));
          while (u.xp >= 40 * u.level && u.level < 30) {
            u.xp -= 40 * u.level;
            u.level++;
          }
        }
        if (
          m.kind === "rival" &&
          m.league === h.champions &&
          m.rung === h.rung
        ) {
          const key = m.league * 3 + m.rung,
            q =
              h.qualification[key] ||
              (h.qualification[key] = { wins: 0, styles: [] });
          q.wins++;
          if (!q.styles.includes(m.rival)) q.styles.push(m.rival);
          if (q.wins >= 5 && q.styles.length === 3) h.rung++;
        }
        if (m.kind === "champion" && m.league === h.champions && h.rung === 3) {
          h.champions++;
          h.rung = 0;
          const items = m.snapshot.heroes.flatMap((u) =>
            Object.values(u.equipment).filter(Boolean),
          );
          for (const i of items)
            if (!h.hallmarks.includes(i.recipeId)) h.hallmarks.push(i.recipeId);
          h.history.push({
            generation: s.player.legacy.generation,
            text: H.leagues[m.league].champion + " defeated.",
          });
          h.history = h.history.slice(-20);
          const catalysts = [
            "gem",
            "ember_shard",
            "frost_crystal",
            "star_fragment",
            "star_fragment",
          ];
          this._deliver({
            materials: {
              [catalysts[m.league]]: Math.ceil(
                (3 + m.league) * (1 + (this._effects().loot || 0)),
              ),
            },
          });
        }
      } else {
        h.losses++;
        h.exhibition = null;
      }
      const recovery = Math.round(
        (m.result.victory ? 12000 : 45000) /
          (1 + (this._effects().recovery || 0)),
      );
      for (const u of m.snapshot.heroes)
        h.recovery[u.id] = Math.ceil(s.simTime + recovery);
      this._log(
        (m.result.victory ? "Victory: " : "Defeat: ") +
          (m.kind === "champion"
            ? H.leagues[m.league].champion
            : H.rivals.find((r) => r.id === m.rival).name) +
          ". " +
          m.result.insight,
        "quest",
      );
      this._refreshUnlocks();
    }
    battleFrame(matchId, elapsed) {
      const m = this.state.house.matches.find((m) => m.id === matchId);
      if (!m) return null;
      const time = Math.max(
          0,
          Math.min(
            m.result.duration,
            elapsed ?? this.state.simTime - m.startedAt,
          ),
        ),
        events = m.result.events;
      let lo = 0,
        hi = events.length - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (events[mid].at <= time) lo = mid;
        else hi = mid - 1;
      }
      return {
        ...events[lo],
        index: lo,
        time,
        finished: time >= m.result.duration,
        duration: m.result.duration,
      };
    }
    _ensureContracts() {
      const h = this.state.house;
      if (!this.state.started || h.orders.length) return;
      this._newContracts();
    }
    _newContracts() {
      const h = this.state.house,
        patterns = Object.values(this.data.recipes).filter(
          (r) =>
            this._recipeKnown(r) &&
            r.variant === 0 &&
            (!this.contractMaterialAccess || this.contractMaterialAccess(r)) &&
            this.craftPreview(r.id).gates.every(
              (g) => g.met || g.source === "Quarry or material shop",
            ),
        );
      if (!patterns.length) return;
      const count = this.state.world.profession === "merchant" ? 4 : 3;
      // Always offer basic work; higher contracts only ask for capabilities already demonstrated.
      const grouped = [
        ...new Map(
          patterns.sort((a, b) => a.tier - b.tier).map((r) => [r.classId, r]),
        ).values(),
      ];
      h.orders = Array.from({ length: count }, (_, n) => {
        const r = (n === 0 ? patterns.filter((r) => r.tier === 1) : grouped)[
            (h.contractCycle + n) %
              (n === 0
                ? patterns.filter((r) => r.tier === 1).length
                : grouped.length)
          ],
          quantity = n === 0 ? 2 : 3,
          quality = Math.min(
            55,
            Math.max(10, this.craftPreview(r.id).quality - 12),
          ),
          inputValue = Object.entries(r.inputs).reduce(
            (sum, [id, q]) => sum + (this.data.materials[id].price || 2) * q,
            0,
          ),
          // Price effects apply once, after selecting the recipe or input-value basis.
          pay = Math.max(
            (r.basePrice || 1) * (0.75 + 0.004 * quality) * 1.18,
            inputValue * 1.5 + 6,
          );
        return {
          id: "contract-" + h.contractCycle + "-" + n,
          classId: r.classId,
          tier: r.tier,
          quality,
          quantity,
          payment: Math.ceil(
            pay *
              quantity *
              this.derived().priceMultiplier *
              (1 +
                (this._effects().contractPay || 0) +
                (h.upgrades.patrons || 0) * 0.08 +
                (this.state.world.profession === "merchant" ? 0.15 : 0) +
                (H.vows[h.vow].contract || 0)),
          ),
          client: [
            "The town watch",
            "Caravan guild",
            "Training yard",
            "The quartermaster",
          ][n],
          recipeId: r.id,
        };
      });
    }
    _deliverReadyContracts() {
      if (!this.state.house?.autoDeliver) return;
      for (const o of [...this.state.house.orders])
        if (this.contractPreview(o.id).eligible)
          this._deliverContract({ id: o.id });
    }
    contractStockIds() {
      const reserved = new Set();
      for (const order of [...this.state.house.orders].sort(
        (a, b) => b.tier - a.tier || b.quality - a.quality,
      )) {
        for (const item of this.contractPreview(order.id, reserved).items)
          reserved.add(item.id);
      }
      return reserved;
    }
    _restockShelves() {
      if (!this.state.house) return super._restockShelves();
      const reserved = this.contractStockIds();
      const stock = this.state.inventory.filter(
        (i) =>
          !this._protected(i) &&
          i.intent !== "catalogue" &&
          i.intent !== "team" &&
          !reserved.has(i.id),
      );
      const allowed = new Set(stock.map((i) => i.id));
      for (const item of this.state.inventory) {
        // Legacy warehouse/rotation holds have no controls in the House edition.
        delete item.autoDisplayHold;
        delete item.rotationHold;
        if (!allowed.has(item.id)) item.displayed = false;
      }
      let room =
        this.derived().displayCapacity -
        stock.filter((i) => i.displayed).length;
      for (const item of stock
        .filter((i) => !i.displayed)
        .sort(
          (a, b) =>
            a.quality - b.quality ||
            a.createdAt - b.createdAt ||
            a.id.localeCompare(b.id),
        )) {
        if (room-- <= 0) break;
        item.displayed = true;
      }
    }
    contractPreview(id, excluded = new Set()) {
      const o = this.state.house.orders.find((o) => o.id === id);
      if (!o)
        return {
          eligible: false,
          reason: "Contract no longer available.",
          items: [],
        };
      const items = this.state.inventory
        .filter(
          (i) =>
            !this._protected(i) &&
            !i.displayed &&
            i.intent !== "stock" &&
            i.intent !== "team" &&
            !excluded.has(i.id) &&
            this.data.recipes[i.recipeId].classId === o.classId &&
            this.data.recipes[i.recipeId].tier >= o.tier &&
            i.quality >= o.quality,
        )
        .sort((a, b) => a.quality - b.quality)
        .slice(0, o.quantity);
      return {
        eligible: items.length === o.quantity,
        items,
        reason:
          items.length === o.quantity
            ? "Ready to deliver."
            : `${items.length} / ${o.quantity} qualifying unprotected pieces.`,
      };
    }
    _deliverContract({ id }) {
      const o = this.state.house.orders.find((o) => o.id === id),
        v = this.contractPreview(id);
      if (!v.eligible) return no(v.reason);
      const ids = new Set(v.items.map((i) => i.id));
      this.state.inventory = this.state.inventory.filter((i) => !ids.has(i.id));
      this._deliver({ gold: o.payment });
      this.state.stats.sold += v.items.length;
      this.state.player.reputation +=
        2 + (this._effects().reputationBonus || 0);
      this._staffXp("sale", v.items.length * 3);
      const h = this.state.house;
      h.contracts++;
      h.contractCycle++;
      h.orders = h.orders.filter((x) => x.id !== id);
      if (!h.orders.length) this._newContracts();
      else {
        const other = [...h.orders];
        this._newContracts();
        const candidate = other.some((x) => x.tier === 1)
          ? h.orders[1 + (h.contractCycle % Math.max(1, h.orders.length - 1))]
          : h.orders[0];
        h.orders = [
          ...other,
          { ...candidate, id: "contract-" + h.contractCycle + "-renewed" },
        ];
      }
      this._restockShelves();
      return yes("Delivered to " + o.client + " · " + o.payment + " gold.");
    }
    catalogueStatus() {
      const h = this.state.house,
        c = h.catalogue,
        r = this.data.recipes[c.recipeId];
      if (!c.enabled || !r) return "Catalogue production is paused.";
      const o = h.orders.find(
        (o) => o.classId === r.classId && o.tier <= r.tier,
      );
      if (!o) return "No matching contract. Choose a requested item class.";
      const v = this.craftPreview(r.id);
      if (v.quality < o.quality)
        return `Expected quality ${v.quality} is below the order’s ${o.quality}. Improve quality or finish pieces manually.`;
      if (this.contractPreview(o.id).eligible)
        return h.autoDeliver
          ? "Order complete; automatic delivery is ready."
          : "Order complete. Deliver it at the shop.";
      if (!v.eligible) return v.reason;
      if (
        Object.entries(r.inputs).some(
          ([id, n]) => this.state.materials[id] < n + c.reserve,
        )
      )
        return "Waiting for ingredients above the chosen reserve.";
      return "Maintaining the selected contract design. Team equipment is protected.";
    }
    _housePolicy(p) {
      const h = this.state.house;
      if (
        "offlineBudget" in p &&
        (!integer(p.offlineBudget) || p.offlineBudget > 1000000)
      )
        return no(
          "Use a whole offline supply budget from 0 to 1,000,000 gold.",
        );
      if ("exhibition" in p && p.exhibition !== null) {
        if (!h.upgrades.exhibitions) return no("Develop Exhibition steward.");
        const v = this.matchPreview({ ...p.exhibition, kind: "exhibition" });
        if (
          !v.eligible &&
          v.reason !== "Your selected fighters are recovering."
        )
          return no(v.reason);
      }
      if ("catalogue" in p) {
        const c = p.catalogue;
        if (
          !c ||
          !h.upgrades.catalogue ||
          !this.data.recipes[c.recipeId] ||
          !integer(c.reserve) ||
          c.reserve > 1000 ||
          typeof c.enabled !== "boolean" ||
          typeof c.autoBuy !== "boolean"
        )
          return no("Choose a valid catalogue policy.");
      }
      if ("autoDeliver" in p && typeof p.autoDeliver !== "boolean")
        return no("Choose whether automatic delivery is enabled.");
      // Apply together only after all requested settings validate.
      if ("exhibition" in p) h.exhibition = copy(p.exhibition);
      if ("catalogue" in p) h.catalogue = copy(p.catalogue);
      if ("autoDeliver" in p) h.autoDeliver = p.autoDeliver;
      if ("offlineBudget" in p)
        this.state.automation.spendCap = p.offlineBudget;
      return yes("House policy saved.");
    }
  }
  return Campaign.extend(House, { H, P, W, Combat });
});
