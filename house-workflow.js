/* Purpose-led orders and workshop inventions. All clocks use saved simulation time. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EIHouseWorkflow = factory();
})(globalThis, function () {
  "use strict";
  const INTERVAL = 300000,
    CAP = 6;
  const yes = (message, data) => ({ ok: true, message, data });
  const no = (message) => ({ ok: false, message });
  const int = (n) => Number.isSafeInteger(n) && n >= 0;
  const finishing = (n) => [0, 20, 30, 35, 37, 38][n];
  const fresh = () => ({
    version: 1,
    serial: 0,
    nextArrival: 0,
    initialized: false,
    lastClass: null,
    streak: 0,
    smeltBatches: 0,
    sifted: 0,
    nextBlast: 0,
    nextCurio: 0,
  });
  function extend(Base, { H, W }) {
    for (const id of ["patrons", "clerk", "relations"]) {
      H.upgrades[id].room = "forge";
      H.upgrades[id].branch = "Commissions";
    }
    H.upgrades.shop_prices.branch = "Retail";
    H.upgrades.stock.name = "Display & stock racks";
    Object.assign(H.upgrades.catalogue, {
      name: "Clockwork contract press",
      cost: 6200,
      contracts: 60,
      champions: 3,
      parent: "patterns_4",
      landmark: true,
      text: "Late-game automation: repeat ordinary commission designs while supplies last. Rare commissions still need your finishing and preparation.",
    });
    // These are House-only descriptions; Classic's stockkeeper keeps its original rules.
    H.automation = { champions: 3, smelterCost: 3200 };
    const inventions = [
      [
        "powder_magazine",
        "mine",
        "Workers",
        "Powder magazine",
        380,
        "Spend 5 coal and 8g to blast 12 units from one open ore seam. Ten-minute cooldown; choose the shortage you want to solve.",
        { champions: 1, parent: "survey" },
      ],
      [
        "fossil_sieve",
        "mine",
        "Depth",
        "The fossil sieve",
        1400,
        "Every 50 newly extracted materials reveal one gem, even in a copper working. Full gem bins still lose the find.",
        { champions: 2, parent: "mine_gems" },
      ],
      [
        "slag_press",
        "smelter",
        "Quality",
        "Slag-bread press",
        220,
        "Every fourth completed batch presses two coal from its waste. Real batches count; cancelled work does not.",
        { level: 3 },
      ],
      [
        "moon_crucible",
        "smelter",
        "Alloys",
        "Moon-salt crucible",
        1500,
        "Unlock Moon-tempered metal: +25% arcane ward, but −15% item armour. Requires the Assayer and three extra coal per batch.",
        { champions: 2 },
      ],
      [
        "memory_anvil",
        "forge",
        "Craftsmanship",
        "The remembering anvil",
        180,
        "Repeat an item class to build a heat memory: +4, +8, then +12 quality. Completing another class resets the chain. Your next design shows the bonus.",
        { contracts: 3 },
      ],
      [
        "oath_socket",
        "forge",
        "Craftsmanship",
        "Forbidden tempering bowl",
        1100,
        "Unlock Glassheart and Gravebound treatments. Trade protection for a lethal edge, or sacrifice damage for a stubborn bearer.",
        { champions: 2, parent: "treatment" },
      ],
      [
        "order_trays",
        "forge",
        "Production",
        "Quartermaster’s job trays",
        120,
        "Six extra prepaid queue spaces. Prepare a long work session yourself before leaving; this does not start new orders automatically.",
        { contracts: 2 },
      ],
      [
        "rare_seal",
        "forge",
        "Commissions",
        "The black-wax seal",
        550,
        "Rare patrons become twice as likely (24% instead of 12%). Their exacting requests can demand finishing, special metal or a treatment, and pay exceptional fees.",
        { contracts: 12 },
      ],
      [
        "curio_window",
        "shop",
        "Stock",
        "The midnight curio window",
        1800,
        "A displayed piece of Q80+ attracts a collector who pays triple town price. One such sale every fifteen minutes; ordinary buyers keep browsing.",
        { champions: 2, parent: "stock" },
      ],
      [
        "bulk_charter",
        "forge",
        "Commissions",
        "Quartermaster’s wagon charter",
        240,
        "Allow occasional 7–10 piece requisitions with a 25% bulk premium. The board still holds six jobs; larger orders reward planned production.",
        { contracts: 6 },
      ],
      [
        "second_wind",
        "arena",
        "Preparation",
        "The bell that rings twice",
        2200,
        "Each front-line fighter survives one otherwise fatal hit per bout at 15% health. It will not save them a second time.",
        { champions: 2, parent: "infirmary" },
      ],
      [
        "salvage_writ",
        "arena",
        "Exhibitions",
        "The defeated house’s writ",
        480,
        "Your first three defeats each day return a quarter of the advertised purse. No victory credit or fighter XP; a loss can fund your next correction.",
        { champions: 1 },
      ],
      [
        "apprentice_notes",
        "employees",
        "Training",
        "The apprentice’s stolen notebook",
        400,
        "Resting specialists learn at one quarter of the normal work XP. Their bonuses remain inactive, but time off need not halt their education.",
        { contracts: 8 },
      ],
      [
        "supper_bell",
        "employees",
        "Welfare",
        "The commission supper bell",
        800,
        "Every completed commission restores 8 stamina to all hired specialists. Large orders count as one meal, not one per item.",
        { contracts: 16 },
      ],
    ];
    for (const [id, room, branch, name, cost, text, gates] of inventions)
      H.upgrades[id] = {
        id,
        room,
        branch,
        name,
        cost,
        max: 1,
        effects: {},
        text,
        landmark: true,
        ...gates,
      };
    H.treatments.glassheart = {
      name: "Glassheart",
      cost: 12,
      mastery: 20,
      text: "+25% item attack and +8% critical chance; −25% item armour and health, and −8% total bearer health per piece.",
      effects: { attack: 0.25, crit: 0.08, armor: -0.25, health: -0.25 },
      invention: "oath_socket",
    };
    H.treatments.gravebound = {
      name: "Gravebound",
      cost: 12,
      mastery: 20,
      text: "+35% item health and +20% armour; −20% item attack and 15% slower weapon swings. Each piece also slows the bearer’s attacks by 8%.",
      effects: { health: 0.35, armor: 0.2, attack: -0.2, slow: 0.15 },
      invention: "oath_socket",
    };
    H.grades.moon = {
      name: "Moon tempered",
      cost: 3,
      text: "+25% arcane resistance, −15% item armour. Three extra coal per batch; requires the Moon-salt crucible.",
    };
    return class WorkflowHouse extends Base {
      constructor(data, saved) {
        WorkflowHouse.prepareData(data);
        if (saved) {
          const v = WorkflowHouse.validateSave(saved, data);
          if (!v.ok) throw Error(v.message);
          saved = v.state;
        }
        super(data, saved);
        this._workflow();
      }
      static prepareData(data) {
        for (const [id, name, cost, effects, description] of [
          [
            "ancestral_anvil",
            "The anvil remembers its maker",
            90,
            { inheritedMemory: 1 },
            "Each new house inherits the remembering anvil. Repeat item classes to build heat memory from the first day.",
          ],
          [
            "ancestral_sieve",
            "Grandmother’s impossible sieve",
            110,
            { inheritedSieve: 1 },
            "Each new house inherits the fossil sieve. Every fifty mined materials reveal a gem, including in the first copper working.",
          ],
        ])
          data.talents[id] = {
            id,
            name,
            cost,
            effects,
            description,
            branch: "Workforce",
            depth: 5,
            maxLevel: 1,
            requires: [],
            legacySignature: true,
          };
      }
      static validateSave(input, data) {
        WorkflowHouse.prepareData(data);
        const v = super.validateSave(input, data);
        if (!v.ok) return v;
        const s = v.state,
          f = s.house.workflow;
        if (
          f &&
          (f.version !== 1 ||
            typeof f.initialized !== "boolean" ||
            ![
              "serial",
              "nextArrival",
              "streak",
              "smeltBatches",
              "sifted",
              "nextBlast",
              "nextCurio",
            ].every((k) => int(f[k])) ||
            f.streak > 3 ||
            (f.lastClass !== null && !data.classes[f.lastClass]) ||
            (f.lossDay != null && !int(f.lossDay)) ||
            (f.lossClaims != null && (!int(f.lossClaims) || f.lossClaims > 3)))
        )
          return no("Invalid workshop order clock.");
        for (const o of s.house.orders) {
          if (o.recipeId && !data.recipes[o.recipeId])
            return no("Unknown commission design.");
          if (o.exact != null && typeof o.exact !== "boolean")
            return no("Invalid commission pattern rule.");
          if (o.kind != null && !["ordinary", "bulk", "rare"].includes(o.kind))
            return no("Invalid commission patron.");
          if (
            (o.grade && !H.grades[o.grade]) ||
            (o.treatment && !H.treatments[o.treatment]) ||
            (o.enchantmentId && !data.enchantments[o.enchantmentId])
          )
            return no("Invalid commission preparation.");
        }
        if (
          new Set(s.house.orders.map((o) => o.id)).size !==
          s.house.orders.length
        )
          return no("Duplicate commissions.");
        for (const j of s.jobs)
          if (
            (j.targetSlot != null && !H.slots.includes(j.targetSlot)) ||
            (j.orderId != null && typeof j.orderId !== "string")
          )
            return no("Invalid craft destination.");
        for (const i of s.inventory)
          if (i.targetSlot != null && !H.slots.includes(i.targetSlot))
            return no("Invalid equipment destination.");
        return v;
      }
      _workflow() {
        return (this.state.house.workflow ??= fresh());
      }
      importSave(raw) {
        const v = WorkflowHouse.validateSave(raw, this.data);
        return v.ok ? super.importSave(v.state) : v;
      }
      _fresh() {
        const s = super._fresh();
        s.house.workflow = fresh();
        return s;
      }
      _create(p) {
        const r = super._create(p);
        if (r.ok) {
          if (this.state.world.profession === "mechanist") {
            delete this.state.workshop.upgrades.stockkeeper;
            this._deliver({ materials: { bronze_ingot: 3, fuel: 2 } });
          }
          if (this._effects().inheritedMemory)
            this.state.house.upgrades.memory_anvil = 1;
          if (this._effects().inheritedSieve)
            this.state.house.upgrades.fossil_sieve = 1;
        }
        return r;
      }
      _ensureContracts() {
        if (!this.state.started || !this.state.house) return;
        const f = this._workflow();
        if (f.initialized) return;
        f.initialized = true;
        f.nextArrival = this.state.simTime + INTERVAL;
        // Retain signed prices and paid work from old saves. Only a new empty board gets a starter.
        if (!this.state.house.orders.length) this._newContracts(true);
      }
      _newContracts(starter = false) {
        const h = this.state.house,
          f = this._workflow();
        if (h.orders.length >= CAP) return;
        const available = Object.values(this.data.recipes).filter(
          (r) =>
            r.variant < 2 &&
            this._recipeKnown(r) &&
            this.contractMaterialAccess(r) &&
            this.craftPreview(r.id).gates.every(
              (g) => g.met || g.source === "Quarry or material shop",
            ),
        );
        if (!available.length) return;
        const top = Math.max(...available.map((r) => r.tier));
        const pool = available.filter((r) =>
          starter
            ? r.tier === 1 && r.variant === 0
            : r.tier >= Math.max(1, top - 1),
        );
        const r = pool[Math.floor(this._roll() * pool.length)],
          v = this.craftPreview(r.id);
        const roll = this._roll();
        let kind =
          !starter && roll < (h.upgrades.rare_seal ? 0.24 : 0.12)
            ? "rare"
            : !starter && h.upgrades.bulk_charter && roll > 0.7
              ? "bulk"
              : "ordinary";
        let quantity = starter
          ? 2
          : kind === "rare"
            ? 1 + Math.floor(this._roll() * 3)
            : kind === "bulk"
              ? 7 + Math.floor(this._roll() * 4)
              : 1 + Math.floor(this._roll() * 6);
        const grade =
          kind === "rare" &&
          this.state.staff.assayer &&
          this.staffEfficiency("assayer") &&
          this._roll() < 0.4
            ? "tough"
            : "standard";
        const treatment =
          kind === "rare" &&
          this.treatmentAvailable(r.id, "keen") &&
          this._roll() < 0.4
            ? "keen"
            : "plain";
        const quality = Math.max(
          1,
          Math.min(
            this.derived().qualityCap,
            Math.round(
              v.quality +
                (kind === "rare" ? 20 + Math.floor(this._roll() * 11) : -10),
            ),
          ),
        );
        const inputValue = Object.entries(r.inputs).reduce(
          (sum, [id, n]) => sum + this.materialPrice(id) * n,
          0,
        );
        const pay = Math.max(
          (r.basePrice || 1) * (0.75 + 0.004 * quality) * 1.18,
          inputValue * 1.5 + 6,
        );
        const multiplier = kind === "rare" ? 3.2 : kind === "bulk" ? 1.25 : 1;
        const clients =
          kind === "rare"
            ? [
                "The veiled collector",
                "Abbess of the hollow moon",
                "The king’s silent duellist",
              ]
            : kind === "bulk"
              ? ["The northern quartermaster", "The winter caravan"]
              : [
                  "The town watch",
                  "Caravan guild",
                  "Training yard",
                  "The ferry guard",
                  "The travelling players",
                  "The abbey steward",
                ];
        h.orders.push({
          id: "job-" + ++f.serial + "-" + this.state.simTime,
          recipeId: r.id,
          classId: r.classId,
          tier: r.tier,
          quality,
          quantity,
          grade,
          treatment,
          kind,
          exact: true,
          issuedAt: this.state.simTime,
          client: clients[Math.floor(this._roll() * clients.length)],
          payment: Math.ceil(
            pay *
              quantity *
              multiplier *
              this.derived().priceMultiplier *
              (1 +
                (this._effects().contractPay || 0) +
                (h.upgrades.patrons || 0) * 0.08 +
                (this.state.world.profession === "merchant" ? 0.15 : 0) +
                (H.vows[h.vow].contract || 0)),
          ),
        });
      }
      commissionBoard() {
        const f = this._workflow();
        return {
          cap: CAP,
          count: this.state.house.orders.length,
          seconds: Math.max(0, f.nextArrival - this.state.simTime) / 1000,
        };
      }
      _extraEventTimes() {
        const times = super._extraEventTimes(),
          f = this.state.house?.workflow;
        if (f?.initialized) times.push(f.nextArrival);
        return times;
      }
      _processExtraEvents() {
        const done = this.state.workshop.jobs.filter(
          (j) => j.status === "active" && j.completeAt <= this.state.simTime,
        ).length;
        super._processExtraEvents();
        const f = this._workflow();
        if (done && this.state.house.upgrades.slag_press) {
          const coal =
            (Math.floor((f.smeltBatches + done) / 4) -
              Math.floor(f.smeltBatches / 4)) *
            2;
          f.smeltBatches += done;
          if (coal)
            this._deliver({
              materials: { fuel: coal },
              source: "Slag-bread press",
            });
        }
        if (f.initialized && f.nextArrival <= this.state.simTime) {
          this._newContracts();
          f.nextArrival = this.state.simTime + INTERVAL;
        }
      }
      commissionMatches(item, order) {
        const r = this.data.recipes[item.recipeId];
        if (
          item.orderId &&
          item.orderId !== order.id &&
          this.state.house.orders.some((o) => o.id === item.orderId)
        )
          return false;
        return (
          !!r &&
          r.classId === order.classId &&
          r.tier >= order.tier &&
          (!order.exact || item.recipeId === order.recipeId) &&
          item.quality >= order.quality &&
          (!order.grade ||
            order.grade === "standard" ||
            item.grade === order.grade) &&
          (!order.treatment ||
            order.treatment === "plain" ||
            item.treatment === order.treatment) &&
          (!order.enchantmentId || item.enchantmentId === order.enchantmentId)
        );
      }
      commissionPlan(id, options = {}) {
        const o = this.state.house.orders.find((o) => o.id === id);
        if (!o)
          return {
            eligible: false,
            reason: "Choose an available commission.",
            remaining: 0,
          };
        const plan = {
          recipeId: o.recipeId,
          treatment: o.treatment || "plain",
          grade: o.grade || "standard",
          enchantmentId: o.enchantmentId || null,
          ...options,
          intent: "catalogue",
          orderId: o.id,
        };
        const r = this.data.recipes[plan.recipeId],
          v = this.craftPreview(plan.recipeId, plan);
        if (!r)
          return {
            ...plan,
            eligible: false,
            reason: "This design is unavailable.",
            remaining: 0,
          };
        let passes = 0;
        while (
          passes < 5 &&
          Math.min(this.derived().qualityCap, v.quality + finishing(passes)) <
            o.quality
        )
          passes++;
        const projected = {
          recipeId: r.id,
          quality: Math.min(
            this.derived().qualityCap,
            v.quality + finishing(passes),
          ),
          ...plan,
        };
        const matches = this.commissionMatches(projected, o);
        const ready = this.contractPreview(o.id).items.length;
        const queued = this.state.jobs.filter((j) => j.orderId === o.id).length;
        const remaining = Math.max(0, o.quantity - ready - queued);
        return {
          ...plan,
          finishPasses: passes,
          ready,
          queued,
          remaining,
          quality: projected.quality,
          eligible: matches && v.eligible && remaining > 0,
          reason: !matches
            ? "This design or preparation does not meet the commission."
            : !remaining
              ? "All required pieces are ready or already queued."
              : v.reason,
          seconds: v.seconds * (1 + passes * this._finishingMultiplier(r.id)),
        };
      }
      heroForgeClasses(heroId, slot) {
        const h = this.state.adventurers.find((h) => h.id === heroId);
        return h
          ? this.data.archetypes[h.archetypeId].preferences.filter(
              (id) =>
                this.data.classes[id].slot === slot ||
                (id === "daggers" && slot === "offhand"),
            )
          : [];
      }
      heroForgePlan(heroId, slot) {
        const h = this.state.adventurers.find((h) => h.id === heroId),
          classes = this.heroForgeClasses(heroId, slot);
        const candidates = Object.values(this.data.recipes).filter(
          (r) =>
            classes.includes(r.classId) &&
            this._recipeKnown(r) &&
            this.contractMaterialAccess(r) &&
            this.craftPreview(r.id).gates.every(
              (g) => g.met || g.source === "Quarry or material shop",
            ),
        );
        const current = h?.equipment[slot],
          preferred = current && this.data.recipes[current.recipeId]?.classId;
        // High-alloy standard work is a useful default; exceptional long prestige jobs are deliberate choices.
        candidates.sort(
          (a, b) =>
            b.tier - a.tier ||
            Number(b.classId === preferred) - Number(a.classId === preferred) ||
            Number(a.variant >= 2) - Number(b.variant >= 2) ||
            b.variant - a.variant ||
            a.id.localeCompare(b.id),
        );
        const r = candidates[0];
        return r
          ? {
              recipeId: r.id,
              heroId,
              targetSlot: slot,
              intent: "team",
              grade: "standard",
              treatment: "plain",
              enchantmentId: null,
            }
          : null;
      }
      automationAccess(kind) {
        const h = this.state.house,
          purchased =
            kind === "forge"
              ? h.upgrades.catalogue
              : this.state.workshop.upgrades.stockkeeper;
        const eligible = h.champions >= 3 && !!purchased;
        return {
          eligible,
          reason:
            h.champions < 3
              ? "Defeat the third league champion to open late-game production automation. Paid queues still finish offline."
              : !purchased
                ? "Develop " +
                  (kind === "forge"
                    ? H.upgrades.catalogue.name
                    : "Furnace automaton") +
                  "."
                : "Production automation available.",
        };
      }
      smeltUpgradePreview(id) {
        const v = super.smeltUpgradePreview(id);
        if (id !== "stockkeeper") return v;
        v.cost = H.automation.smelterCost;
        if (v.rank)
          return { ...v, eligible: false, reason: "Fully developed." };
        v.reason =
          this.state.house.champions < 3
            ? "Defeat 3 league champions for the Furnace automaton."
            : this.state.player.gold < v.cost
              ? "Need " + v.cost + " gold."
              : "Ready to develop.";
        v.eligible = v.reason === "Ready to develop.";
        return v;
      }
      _autoSmelt() {
        if (this.automationAccess("smelter").eligible) super._autoSmelt();
      }
      smeltPolicyStatus() {
        return this.automationAccess("smelter").eligible
          ? super.smeltPolicyStatus()
          : this.automationAccess("smelter").reason;
      }
      catalogueStatus() {
        return this.automationAccess("forge").eligible
          ? super.catalogueStatus()
          : this.automationAccess("forge").reason;
      }
      _smeltPolicy(p) {
        if (p.enabled && !this.automationAccess("smelter").eligible)
          return no(this.automationAccess("smelter").reason);
        return super._smeltPolicy(p);
      }
      _housePolicy(p) {
        if (p.catalogue?.enabled && !this.automationAccess("forge").eligible)
          return no(this.automationAccess("forge").reason);
        return super._housePolicy(p);
      }
      _runAutomation() {
        // The base automation only handles simple designs. Exact rare requirements stay manual.
        const c = this.state.house.catalogue,
          enabled = c.enabled;
        if (!this.automationAccess("forge").eligible) c.enabled = false;
        try {
          super._runAutomation();
        } finally {
          c.enabled = enabled;
        }
      }
      craftPreview(id, options = {}) {
        const v = super.craftPreview(id, options),
          r = this.data.recipes[id],
          f = this.state.house?.workflow;
        if (
          r &&
          f &&
          this.state.house.upgrades.memory_anvil &&
          f.lastClass === r.classId
        ) {
          v.memoryBonus = f.streak * 4;
          v.quality = Math.min(
            this.derived().qualityCap,
            v.quality + v.memoryBonus,
          );
        }
        if (
          options.grade === "moon" &&
          !this.state.house.upgrades.moon_crucible
        )
          return {
            ...v,
            eligible: false,
            reason: "Develop the Moon-salt crucible.",
          };
        return v;
      }
      _craft(p) {
        const passes = p.finishPasses || 0;
        if (!int(passes) || passes > 5)
          return no("Choose up to five finishing passes.");
        if (
          p.intent === "team" &&
          p.targetSlot &&
          !this.heroForgeClasses(p.heroId, p.targetSlot).includes(
            this.data.recipes[p.recipeId]?.classId,
          )
        )
          return no("Choose an item that fits this hero’s selected slot.");
        const old = new Set(this.state.jobs.map((j) => j.id)),
          result = super._craft(p);
        if (result.ok)
          for (const j of this.state.jobs.filter((j) => !old.has(j.id))) {
            j.targetSlot = p.targetSlot || null;
            j.orderId = p.orderId || null;
            j.finishPasses = passes;
            j.technique = passes > 0;
          }
        return result;
      }
      _completeJob(job) {
        // Routing in the base completes immediately; give it the slot before it can equip.
        this._completingSlot = job.targetSlot || null;
        this._completingOrder = job.orderId || null;
        try {
          super._completeJob(job);
        } finally {
          this._completingSlot = null;
          this._completingOrder = null;
        }
        const f = this._workflow(),
          classId = this.data.recipes[job.recipeId].classId;
        f.streak = f.lastClass === classId ? Math.min(3, f.streak + 1) : 1;
        f.lastClass = classId;
      }
      _startJobs() {
        const active = new Set(
          this.state.jobs.filter((j) => j.status === "active").map((j) => j.id),
        );
        super._startJobs();
        // Another class can cool the anvil while an order waits. Recheck its signed quality
        // when work actually starts and add the necessary time, never a free quality grant.
        for (const j of this.state.jobs) {
          if (j.status !== "active" || active.has(j.id) || !j.orderId) continue;
          const order = this.state.house.orders.find((o) => o.id === j.orderId);
          while (
            order &&
            j.quality < order.quality &&
            this.techniquePreview(j.id).eligible
          )
            this._technique({ jobId: j.id });
        }
      }
      _equipCompletedTeamWork() {
        if (this._completingSlot) {
          const item = this.state.inventory.at(-1);
          if (item?.autoEquipPending) item.targetSlot = this._completingSlot;
        }
        super._equipCompletedTeamWork();
      }
      treatmentAvailable(recipeId, id) {
        const t = H.treatments[id];
        if (t?.invention)
          return (
            !!this.state.house.upgrades[t.invention] &&
            (this.state.player.proficiency[this.data.recipes[recipeId]?.classId]
              ?.level || 0) >= t.mastery
          );
        return super.treatmentAvailable(recipeId, id);
      }
      smeltPreview(id, quantity = 1, grade = "standard") {
        const v = super.smeltPreview(id, quantity, grade);
        return grade === "moon" && !this.state.house.upgrades.moon_crucible
          ? { ...v, eligible: false, reason: "Develop the Moon-salt crucible." }
          : v;
      }
      _smelt(p) {
        const v = this.smeltPreview(
          p.id,
          p.quantity || 1,
          p.grade || "standard",
        );
        return v.eligible ? super._smelt(p) : no(v.reason);
      }
      _itemCombat(i) {
        const s = super._itemCombat(i);
        if (i?.grade === "moon") {
          s.armor *= 0.85;
          s.resistances.arcane = (s.resistances.arcane || 0) + 0.25;
        }
        return s;
      }
      derived() {
        const d = super.derived();
        if (this.state.house?.upgrades.order_trays) d.queueCapacity += 6;
        return d;
      }
      _quarryYield() {
        const before = this.state.world.totalMined;
        super._quarryYield();
        this._sift(this.state.world.totalMined - before);
      }
      _mine(p) {
        const before = this.state.world.totalMined,
          r = super._mine(p);
        if (r.ok) this._sift(this.state.world.totalMined - before);
        return r;
      }
      _sift(amount) {
        if (!this.state.house?.upgrades.fossil_sieve || !amount) return;
        const f = this._workflow(),
          gems =
            Math.floor((f.sifted + amount) / 50) - Math.floor(f.sifted / 50);
        f.sifted += amount;
        if (gems)
          this._deliver({ materials: { gem: gems }, source: "Fossil sieve" });
      }
      _staffXp(work, amount) {
        super._staffXp(work, amount);
        if (!this.state.house?.upgrades.apprentice_notes) return;
        for (const [id, s] of Object.entries(this.state.staff))
          if (!s.active && this.data.staff[id].work === work && s.level < 5) {
            s.xp += amount * 0.25;
            while (s.level < 5 && s.xp >= 30 * s.level) {
              s.xp -= 30 * s.level;
              s.level++;
            }
          }
      }
      _deliverContract(p) {
        const r = super._deliverContract(p);
        if (r.ok && this.state.house.upgrades.supper_bell)
          for (const s of Object.values(this.state.staff))
            s.stamina = Math.min(100, s.stamina + 8);
        return r;
      }
      _deliverReadyContracts() {
        if (this._completingOrder) {
          const i = this.state.inventory.at(-1);
          if (i?.intent === "catalogue") i.orderId = this._completingOrder;
        }
        super._deliverReadyContracts();
      }
      _arenaStats(h) {
        const s = super._arenaStats(h);
        const items = Object.values(h.equipment || {}).filter(Boolean);
        s.health = Math.max(
          1,
          s.health *
            Math.max(
              0.4,
              1 -
                items.filter((i) => i.treatment === "glassheart").length * 0.08,
            ),
        );
        s.interval *=
          1 + items.filter((i) => i.treatment === "gravebound").length * 0.08;
        if (this.state.house?.upgrades.second_wind && s.line === "front")
          s.secondWind = true;
        return s;
      }
      _settleMatch(m) {
        const unpaid = !m.paid;
        super._settleMatch(m);
        if (
          !unpaid ||
          m.result.victory ||
          !this.state.house.upgrades.salvage_writ
        )
          return;
        const f = this._workflow(),
          day = Math.floor(this.state.simTime / 86400000);
        if (f.lossDay !== day) {
          f.lossDay = day;
          f.lossClaims = 0;
        }
        if (f.lossClaims < 3) {
          f.lossClaims++;
          this._deliver({ gold: Math.floor(m.purse / 4) });
        }
      }
      _townPrice(item) {
        const base = super._townPrice(item);
        return this.state.house.upgrades.curio_window &&
          item.displayed &&
          item.quality >= 80 &&
          this.state.simTime >= this._workflow().nextCurio
          ? base * 3
          : base;
      }
      _sell(p) {
        const i = this._item(p.itemId),
          curio =
            i &&
            i.displayed &&
            this.state.house.upgrades.curio_window &&
            i.quality >= 80 &&
            this.state.simTime >= this._workflow().nextCurio;
        const r = super._sell(p);
        if (r.ok && curio)
          this._workflow().nextCurio = this.state.simTime + 900000;
        return r;
      }
      act(name, p = {}) {
        if (!["commissionCraft", "declineCommission", "blast"].includes(name))
          return super.act(name, p);
        if (!this.state.started) return no("Create your smith first.");
        let result;
        if (name === "commissionCraft") {
          const plan = this.commissionPlan(p.id, p.options || {}),
            quantity = p.complete ? plan.remaining : 1;
          if (!plan.eligible) return no(plan.reason);
          result = this._craft({ ...plan, quantity });
        } else if (name === "declineCommission") {
          const o = this.state.house.orders.find((o) => o.id === p.id);
          if (!o) return no("That commission has already left the board.");
          if (this.state.jobs.some((j) => j.orderId === o.id))
            return no(
              "Cancel its reserved work before declining this commission.",
            );
          this.state.house.orders = this.state.house.orders.filter(
            (o) => o.id !== p.id,
          );
          result = yes(
            "Commission declined. Another patron arrives on the next five-minute bell.",
          );
        } else {
          const f = this._workflow();
          if (!this.state.house.upgrades.powder_magazine)
            return no("Develop the Powder magazine.");
          if (
            !this.seams().some((s) => s.id === p.materialId) ||
            p.materialId === "fuel"
          )
            return no("Choose an open ore seam.");
          if (this.state.simTime < f.nextBlast)
            return no("The magazine is cooling. Ten minutes between blasts.");
          if (this.state.materials[p.materialId] >= this.binCapacity())
            return no("That material bin is full.");
          if (this.state.materials.fuel < 5 || this.state.player.gold < 8)
            return no("A blast requires 5 coal and 8 gold.");
          this.state.materials.fuel -= 5;
          this.state.player.gold -= 8;
          const amount = Math.min(
            12,
            this.binCapacity() - this.state.materials[p.materialId],
          );
          this._deliver({
            materials: { [p.materialId]: 12 },
            source: "Powder blast",
          });
          this.state.world.totalMined += amount;
          this._sift(amount);
          f.nextBlast = this.state.simTime + 600000;
          result = yes(
            "The blast opened 12 materials. Any bin overflow was lost.",
          );
        }
        if (result.ok) {
          this._refreshUnlocks();
          this._startJobs();
          this._previewCache.clear();
        }
        return result;
      }
    };
  }
  return { extend, INTERVAL, CAP };
});
