/* A small, event-delegated interface. Simulation and rendering have separate clocks. */
(function () {
  "use strict";
  window.addEventListener("error", (event) => {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent =
      location.port === "8792"
        ? "Preview error: " + event.message
        : "This view could not update. Export your house from the menu before reloading.";
    toast.classList.add("show");
  });
  const D = EIWorkshop.apply(EIData, EIProgression),
    H = EIHouseData,
    Campaign = EIHouseCampaign,
    P = EIProgression,
    W = EIWorkshop;
  const KEY = "ember-iron-arena-v1",
    BACKUP = KEY + "-backup",
    LEASE = KEY + "-owner",
    CLASSIC = "ember-iron-save-v3";
  const $ = (s) => document.querySelector(s),
    esc = (s) =>
      String(s ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
  const num = (n) => Math.floor(n || 0).toLocaleString(),
    time = (n) =>
      n >= 3600
        ? (n / 3600).toFixed(1).replace(/\.0$/, "") + "h"
        : n >= 120
          ? Math.ceil(n / 60) + "m"
          : Math.ceil(Math.max(0, n)) + "s",
    pretty = (s) => s[0].toUpperCase() + s.slice(1);
  const owner = crypto.randomUUID(),
    roomNames = {
      smith: "Smith",
      mine: "Mine",
      smelter: "Smelter",
      forge: "Forge",
      shop: "Shop & armoury",
      arena: "Arena",
      employees: "Employees",
      legacy: "Legacy",
    };
  const inputActivity = EIHouseInput.watch(document, window);
  const marks = {
    smith: "✦",
    mine: "◆",
    smelter: "◉",
    forge: "⚒",
    shop: "◇",
    arena: "⚑",
    employees: "♟",
    legacy: "✧",
  };
  const ui = {
    screen: "splash",
    room: "smith",
    creationStep: 0,
    calling: "weaponsmith",
    origin: "village",
    vow: "patient",
    smith: "",
    name: "The Copper Hearth",
    stats: { strength: 0, precision: 0, charisma: 0, knowledge: 0 },
    type: "daggers",
    group: "weapons",
    material: "bronze_ingot",
    recipe: null,
    intent: "team",
    hero: "mara",
    treatment: "plain",
    grade: "standard",
    enchantment: "",
    department: "mine",
    shopTab: "armoury",
    arenaTab: "challenge",
    rival: "choir",
    viewLeague: null,
    viewRung: null,
    modal: null,
    upgradeRoom: null,
    branch: null,
    replay: null,
    replayAt: 0,
    replaySpeed: 1,
    replayPlaying: false,
    overview: null,
    readonly: false,
  };
  let game,
    storageMessage = "",
    saved = null,
    last = Date.now(),
    lastSave = 0,
    away = document.hidden,
    lastRender = 0,
    toastTimer,
    sceneTimer,
    revision = 0;
  function get(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      storageMessage =
        "Saving is unavailable. Export your house from the menu.";
      return null;
    }
  }
  function put(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      storageMessage =
        "Your browser could not save. Export your house from the menu.";
      return false;
    }
  }
  const preferenceStorage = {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
  };
  let preferences = EIHouseSettings.read(preferenceStorage);
  const sound = new EIHouseAudio.Soundscape();
  function applyPreferences(persist = false) {
    preferences = EIHouseSettings.apply(preferences, document.documentElement);
    sound.setVolumes({
      master: preferences.master / 100,
      music: preferences.music / 100,
      effects: preferences.effects / 100,
      muted: preferences.muted,
    });
    if (persist && !EIHouseSettings.write(preferenceStorage, preferences))
      notify(
        "Options apply for this visit. Your browser could not remember them.",
      );
  }
  function startSound() {
    sound.setRoom(ui.screen === "game" ? ui.room : "smith");
    sound.unlock().catch(() => {});
  }
  applyPreferences();
  for (const key of [KEY, BACKUP]) {
    const raw = get(key);
    if (raw) {
      const v = EIHouseEngine.validateSave(raw, D);
      if (v.ok) {
        saved = v.state;
        break;
      }
      storageMessage =
        "A damaged arena save was detected. The backup will be used if valid.";
    }
  }
  game = new EIHouseEngine(D, saved);
  let storedSave = get(KEY),
    needsCatchup = !!saved?.started;
  function checkpoint() {
    const raw = game.exportSave();
    if (put(KEY, raw)) storedSave = raw;
  }
  const reportTotals = [
    "elapsed",
    "credited",
    "crafted",
    "sold",
    "victories",
    "defeats",
    "netGold",
    "netMaterials",
    "automationSpent",
    "contracts",
    "mined",
    "smelted",
    "lost",
    "contractGold",
    "exhibitionGold",
    "marketGold",
  ];
  function mergeReports(previous, part) {
    // Persist only the report's data fields; imported saves are not trusted HTML.
    const number = (n) => (typeof n === "number" && Number.isFinite(n) ? n : 0);
    const report = {
      capped: !!(previous?.capped || part?.capped),
      limitHours: 24,
      stopReason: typeof part?.stopReason === "string" ? part.stopReason : "",
    };
    for (const key of reportTotals)
      report[key] = number(previous?.[key]) + number(part?.[key]);
    for (const key of ["discoveries", "studies", "achievements"])
      report[key] = [
        ...new Set(
          [
            ...(Array.isArray(previous?.[key]) ? previous[key] : []),
            ...(Array.isArray(part?.[key]) ? part[key] : []),
          ].filter((x) => typeof x === "string"),
        ),
      ].slice(-100);
    const materials = new Map();
    for (const source of [previous, part])
      for (const entry of Array.isArray(source?.materials)
        ? source.materials
        : [])
        if (entry && D.materials[entry.id])
          materials.set(
            entry.id,
            (materials.get(entry.id) || 0) + number(entry.change),
          );
    report.materials = [...materials]
      .filter(([, change]) => change)
      .map(([id, change]) => ({ id, change }));
    return report;
  }
  function queueReturnReport(part) {
    if (!part || part.elapsed <= 0) return;
    if (
      game.state.pendingOfflineReport ||
      part.elapsed >= 60000 ||
      reportTotals.some(
        (key) => !["elapsed", "credited"].includes(key) && part[key],
      ) ||
      part.discoveries?.length ||
      part.studies?.length ||
      part.achievements?.length
    )
      game.state.pendingOfflineReport = mergeReports(
        game.state.pendingOfflineReport,
        part,
      );
  }
  function lease() {
    const wasReadonly = ui.readonly;
    let l;
    try {
      l = JSON.parse(get(LEASE) || "null");
    } catch (e) {}
    ui.readonly = !!(l && l.owner !== owner && Date.now() - l.time < 8000);
    if (!ui.readonly) {
      // A hidden tab may never have observed the other owner while it was active.
      // Compare the saved snapshot whenever ownership changes, including expired leases.
      const latest = wasReadonly || l?.owner !== owner ? get(KEY) : storedSave;
      if (latest && latest !== storedSave) {
        const v = EIHouseEngine.validateSave(latest, D);
        if (v.ok) {
          game = new EIHouseEngine(D, v.state);
          storedSave = latest;
          needsCatchup = game.state.started;
          setTimeout(() => reconcileOffline(Date.now()), 0);
          last = Date.now();
        }
      }
      put(LEASE, JSON.stringify({ owner, time: Date.now() }));
    }
  }
  lease();
  async function reconcileOffline(now) {
    if (ui.catchingUp || ui.readonly || !game.state.started) return;
    const target = game,
      began = game.state.lastWallTime,
      elapsed = Math.max(0, now - began);
    if (elapsed < 60000) {
      const report = game.advanceOffline(now).report;
      queueReturnReport(report);
      needsCatchup = false;
      checkpoint();
      last = Date.now();
      return;
    }
    ui.catchingUp = true;
    ui.catchupProgress = 0;
    let report = null;
    try {
      while (game.state.lastWallTime < now) {
        lease();
        if (ui.readonly || game !== target) break;
        const cursor =
          game.state.offlineSession.credited >= game.offlineLimit()
            ? now
            : Math.min(now, game.state.lastWallTime + 15 * 60000);
        const part = game.advanceOffline(cursor).report;
        if (!part) break;
        report = mergeReports(report, part);
        queueReturnReport(part);
        ui.catchupProgress = Math.min(
          1,
          (game.state.lastWallTime - began) / elapsed,
        );
        // Preserve the credited cursor without advancing it to the live wall clock.
        checkpoint();
        render(true);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (report && game === target) {
        report.elapsed = elapsed;
        game.state.offlineReport = report;
        if (!ui.readonly) checkpoint();
      }
    } finally {
      if (game === target && game.state.lastWallTime >= now)
        needsCatchup = false;
      ui.catchingUp = false;
      last = Date.now();
      render(true);
    }
  }
  function save(force = false) {
    lease();
    if (
      ui.readonly ||
      ui.catchingUp ||
      needsCatchup ||
      (!game.state.started && game.state.player.legacy.generation === 1) ||
      (!force && Date.now() - lastSave < 5000)
    )
      return;
    // The title screen is time away. Saving it must not consume that absence.
    if (ui.screen !== "splash") game.markSaved(Date.now());
    const raw = game.exportSave(),
      old = get(KEY);
    if (old && old !== raw && EIHouseEngine.validateSave(old, D).ok)
      put(BACKUP, old);
    if (put(KEY, raw)) storedSave = raw;
    lastSave = Date.now();
  }
  function notify(text) {
    $("#toast").textContent = text;
    $("#toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4800);
  }
  function button(text, action, data = {}, disabled = false, cls = "") {
    return `<button class="${cls}" data-action="${action}" ${Object.entries(
      data,
    )
      .map(([k, v]) => `data-${k}="${esc(v)}"`)
      .join(" ")} ${disabled ? "disabled" : ""}>${text}</button>`;
  }
  function progress(n, max, label, cls = "") {
    const p = Math.max(0, Math.min(100, (n / Math.max(1, max)) * 100));
    return `<div class="progress ${cls}" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${Math.min(max, Math.max(0, n))}"><i style="width:${p}%"></i></div>`;
  }
  function panel(title, body, extra = "", cls = "") {
    return `<section class="panel ${cls}"><div class="panel-heading"><h2>${title}</h2>${extra}</div>${body}</section>`;
  }
  function tag(text) {
    return `<span class="tag">${text}</span>`;
  }
  function empty(text) {
    return `<p class="empty">${text}</p>`;
  }
  const artCache = {};
  function asset(name) {
    if (artCache[name]) return artCache[name];
    const raw = window.EIHouseArt?.[name];
    if (!raw) return "assets/house/" + name + ".webp?v=3.2.0-scenes";
    const parts = raw.split(","),
      binary = atob(parts[1]),
      bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return (artCache[name] = URL.createObjectURL(
      new Blob([bytes], { type: "image/webp" }),
    ));
  }
  function stage(room) {
    return room + "-" + game.roomStage(room);
  }
  let atlasUrl = null;
  function sprite(key) {
    const a = EIInventory.icons[key];
    if (!a) return '<span class="item-sigil">◇</span>';
    if (!atlasUrl) {
      const raw = window.EIInventoryArt;
      if (raw) {
        const b = atob(raw.split(",")[1]);
        atlasUrl = URL.createObjectURL(
          new Blob([Uint8Array.from(b, (c) => c.charCodeAt(0))], {
            type: "image/png",
          }),
        );
      } else atlasUrl = "assets/inventory/inventory-atlas.png";
    }
    return `<span class="item-icon" aria-hidden="true" style="background-image:url('${atlasUrl}');background-size:${EIInventory.columns * 100}% ${EIInventory.rows * 100}%;background-position:${(100 * a.x) / (EIInventory.columns - 1)}% ${(100 * a.y) / (EIInventory.rows - 1)}%"></span>`;
  }
  const itemIcon = (r) =>
    sprite(
      "item-" + r.classId + "-" + r.tier + "-" + Math.min(2, r.variant || 0),
    );
  function itemName(i) {
    const r = D.recipes[i.recipeId],
      prefix = [
        ...new Set(
          [
            i.treatment && i.treatment !== "plain"
              ? H.treatments[i.treatment].name
              : null,
            D.affixes[i.affixId]?.name,
          ].filter(Boolean),
        ),
      ].join(" ");
    return `${prefix ? prefix + " " : ""}${r.name}${i.enchantmentId ? " " + (D.enchantments[i.enchantmentId].suffix || D.enchantments[i.enchantmentId].name) : ""}`;
  }
  function quality(q) {
    return q >= 175
      ? "legendary"
      : q >= 140
        ? "exalted"
        : q >= 115
          ? "masterwork"
          : q >= 85
            ? "superior"
            : q >= 55
              ? "fine"
              : "common";
  }
  function itemMeta(i) {
    return `T${D.recipes[i.recipeId].tier} · Q${i.quality} ${quality(i.quality)} · ${H.grades[i.grade || "standard"].name}`;
  }
  function statsList(st) {
    return `<dl class="combat-stats">${[
      ["Damage", st.attack.toFixed(1)],
      ["Health", Math.round(st.health)],
      ["Armour", st.armor.toFixed(1)],
      ["Swing", st.interval.toFixed(2) + "s"],
      ["Critical", Math.round(st.crit * 100) + "%"],
      ["Block", Math.round(st.block * 100) + "%"],
      ["Piercing", (st.armorPen || 0).toFixed(1)],
      ["Fire ward", Math.round((st.resistances?.fire || 0) * 100) + "%"],
    ]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
      .join("")}</dl>${(st.traits || [])
      .filter((t) => t.includes("pair ·") || t.includes("concord ·"))
      .map((t) => `<p class="counter-hint">${esc(t)}</p>`)
      .join("")}`;
  }
  function supplies() {
    return `<div class="supplies">${D.purchasedSupplies
      .map((id) => {
        const n = game.state.materials[id],
          price = game.materialPrice(id);
        return `<div>${sprite("material-" + id)}<span>${esc(D.materials[id].name)}<strong>${num(n)}</strong></span>${button("+5 · " + price * 5 + "g", "buy", { id, quantity: 5 }, n + 5 > game.binCapacity() || game.state.player.gold < price * 5)}</div>`;
      })
      .join("")}</div>`;
  }
  function materials(inputs) {
    return `<div class="ingredient-list">${Object.entries(inputs)
      .map(
        ([id, n]) =>
          `<span class="${game.state.materials[id] < n ? "short" : ""}">${sprite("material-" + id)}<span>${D.materials[id].name}<b>${num(game.state.materials[id])} / ${n}</b></span></span>`,
      )
      .join("")}</div>`;
  }
  function currentHero() {
    return (
      game.state.adventurers.find((h) => h.id === ui.hero) ||
      game.state.adventurers[0]
    );
  }
  function recordTitle(m) {
    if (m.kind === "trial") return "Crucible " + m.depth + " · " + esc(m.title);
    return m.kind === "champion"
      ? H.leagues[m.league].champion
      : H.rivals.find((r) => r.id === m.rival).name;
  }
  function splash() {
    return `<main class="splash" style="--scene:url('${asset("splash")}')"><div class="splash-top"><span class="wordmark">E<span>&</span>I</span><span>A BLACKSMITH’S HOUSE · AN IDLE RPG</span>${button("Menu", "menu")}</div><div class="splash-copy"><p class="eyebrow">THE HOUSE OF THE HAMMER</p><h1>Ember<br><span>&</span> Iron<span class="title-dot">.</span></h1><p class="splash-sub">Make the blade.<br>Build the house.<br><em>Crown the champion.</em></p><div class="splash-actions">${game.state.started ? button("Continue your house <span>↗</span>", "continue", {}, false, "primary large") : button("Found your house <span>↗</span>", "begin", {}, false, "primary large")}${game.state.started ? `<p>${esc(game.state.shopName)} · ${esc(game.state.player.name)} · ${H.leagues[Math.min(4, game.state.house.champions)].name}</p>` : "<p>A humble workshop. Three hopeful fighters.<br>Your craftsmanship will make the difference.</p>"}${!saved && get(CLASSIC) ? button("Carry over Classic workshop", "convert", {}, false, "quiet") : ""}</div></div><div class="splash-caption"><span>CRAFTSMANSHIP MADE VISIBLE</span><p>Mine. Refine. Create. Prove.</p></div><footer class="splash-footer"><span>Local saves · No account · No daily deadlines</span><span>HOUSE EDITION / 3.2.4</span></footer></main>`;
  }
  function creation() {
    const p = H.professions[ui.calling],
      left = 20 - Object.values(ui.stats).reduce((a, b) => a + b, 0);
    return `<main class="creation-shell" style="--scene:url('${asset("splash")}')"><header class="creation-header">${button("← Title", "title", {}, false, "quiet")}<span class="wordmark small">E<span>&</span>I</span><span>FOUND YOUR HOUSE</span></header><div class="creation-layout"><aside class="creation-story"><p class="eyebrow">A MAKER BEFORE A CHAMPION</p><h1>Your hands.<br>Your method.<br><em>Your legacy.</em></h1><p>Three fighters have put their trust in an unproven smith. Decide what kind of house will rise around them.</p><ol class="creation-steps">${["Choose your calling", "Write your beginnings", "Shape your strengths"].map((s, i) => `<li class="${ui.creationStep === i ? "current" : ""}"><b>0${i + 1}</b>${s}</li>`).join("")}</ol><div class="calling-preview" style="--calling:${p.color}"><span>YOUR HOUSE’S METHOD</span><h2>${p.name}</h2><p>${p.motto}</p><strong>${p.trait}</strong><p>${p.milestone}</p></div></aside><section class="creation-form">${
      ui.creationStep === 0
        ? `<p class="eyebrow">01 / CALLING</p><h2>How do you make your mark?</h2><p>Every calling can complete the campaign. Each gives your opening a different rhythm.</p><div class="calling-grid">${Object.entries(
            H.professions,
          )
            .map(
              ([id, c]) =>
                `<button data-action="calling" data-id="${id}" class="calling ${id === ui.calling ? "selected" : ""}" aria-pressed="${id === ui.calling}" style="--calling:${c.color}"><span>${marks[id === "prospector" ? "mine" : id === "merchant" ? "shop" : "forge"]}</span><strong>${c.name}</strong><small>${c.description}</small></button>`,
            )
            .join("")}</div>`
        : ui.creationStep === 1
          ? `<p class="eyebrow">02 / BEGINNINGS</p><h2>Give your work a name.</h2><div class="form-two"><label>Smith name<input data-create="smith" maxlength="28" value="${esc(ui.smith)}" placeholder="Your name" autocomplete="off"></label><label>House name<input data-create="name" maxlength="48" value="${esc(ui.name)}" autocomplete="off"></label></div><h3>Where you learned</h3><div class="choice-list">${Object.entries(
              H.origins,
            )
              .map(
                ([id, o]) =>
                  `<button data-action="origin" data-id="${id}" aria-pressed="${ui.origin === id}" class="${ui.origin === id ? "selected" : ""}"><strong>${o.name}</strong><span>${o.text}</span></button>`,
              )
              .join(
                "",
              )}</div><h3>Your working vow</h3><div class="choice-list">${Object.entries(
              H.vows,
            )
              .map(
                ([id, o]) =>
                  `<button data-action="vow" data-id="${id}" aria-pressed="${ui.vow === id}" class="${ui.vow === id ? "selected" : ""}"><strong>${o.name}</strong><span>${o.text}</span></button>`,
              )
              .join("")}</div>`
          : `<p class="eyebrow">03 / STRENGTHS</p><div class="section-line"><h2>Twenty points.<br>A lifetime of practice.</h2><span class="points-large">${left}<small>UNSPENT</small></span></div><p>Attributes begin at zero and have no cap. Each smith level earns five more points.</p>${attributeRows(true)}${button("Use " + p.name + " starting spread", "preset", {}, false, "quiet")}<div class="team-introduction"><h3>Your first three fighters</h3><p><b>Mara</b> holds the line. <b>Renn</b> finds the opening. <b>Wren</b> protects the rear. Their equipment is your responsibility.</p></div>`
    }<div class="calling-mobile"><p class="eyebrow">${p.name.toUpperCase()} · YOUR TRAITS</p><strong>${p.trait}</strong><p>${p.milestone}</p></div><div class="creation-controls">${button("← Back", "creation-back", {}, ui.creationStep === 0, "quiet")}${ui.creationStep < 2 ? button("Continue →", "creation-next", {}, false, "primary") : button("Light the first hearth →", "create", {}, left !== 0 || !ui.smith.trim(), "primary")}</div></section></div></main>`;
  }
  const statCopy = {
    strength:
      "Work heavy metal faster. Improve heavy equipment and carrying capacity.",
    precision: "Raise quality and the chance of a useful natural prefix.",
    knowledge: "Learn classes faster. Improve quality and enchantments.",
    charisma: "Improve contract value, town prices and hiring terms.",
  };
  function attributeRows(create = false) {
    const values = create ? ui.stats : game.state.player.stats,
      left = create
        ? 20 - Object.values(values).reduce((a, b) => a + b, 0)
        : game.state.player.points;
    return `<div class="attribute-list">${Object.entries(values)
      .map(([id, n]) => {
        const v = game.attributePreview(
            id,
            values,
            create ? ui.calling : game.state.world.profession,
          ),
          a = v.before,
          b = v.after,
          detail =
            id === "strength"
              ? `Work ${a.seconds.toFixed(1)} → ${b.seconds.toFixed(1)}s; storage ${a.capacity} → ${b.capacity}.`
              : id === "precision"
                ? `Quality ${a.quality} → ${b.quality}; prefix ${a.affix.toFixed(1)} → ${b.affix.toFixed(1)}%.`
                : id === "knowledge"
                  ? `Mastery ×${a.mastery.toFixed(2)} → ×${b.mastery.toFixed(2)}; quality ${a.quality} → ${b.quality}.`
                  : `Price bonus ${a.priceBonus.toFixed(1)} → ${b.priceBonus.toFixed(1)}%.`;
        return `<div class="attribute-row"><div><h3>${pretty(id)}</h3><p>${statCopy[id]}</p><small>Next point: ${detail}</small></div><div class="stepper">${create ? button("−", "stat", { id, delta: -1 }, n === 0) : ""}<b>${n}</b>${button("+", create ? "stat" : "allocate", { id, delta: 1 }, left < 1)}</div></div>`;
      })
      .join("")}</div>`;
  }
  function overview() {
    const r = ui.overview || ui.room,
      d = H.rooms[r];
    if (!d || (!ui.overview && game.state.house.seen.includes(r))) return "";
    return `<section class="room-overview"><span class="overview-seal">${marks[r]}</span><div><p class="eyebrow">WELCOME TO ${roomNames[r].toUpperCase()}</p><h2>${d[1]}</h2><p>${d[2]}</p><small>${d[3]}</small></div>${button("Understood", "dismiss-overview", { room: r }, false, "quiet")}</section>`;
  }
  function goal() {
    const s = game.state,
      h = s.house,
      pinned = H.rivals.find((r) => r.id === h.goal);
    if (pinned)
      return `<div class="goal-rail"><span>PINNED RESPONSE</span><strong>${pinned.response}</strong><p>${pinned.hint}</p>${button("Forge a response", "room", { room: "forge" }, false, "quiet")}${button("×", "pin", { id: "" }, false, "icon-button")}</div>`;
    let heading, body, room;
    if (s.player.points) {
      heading = s.player.points + " attribute points to spend";
      body = "Develop the maker behind every piece.";
      room = "smith";
    } else if (s.player.legacy.generation > 1 && !h.catalogue.enabled) {
      heading = "Reopen the inherited workshop";
      body =
        "Your permanent knowledge survived. Rebuild the production ledger, set ingot targets and enable rotating contracts before leaving the house unattended.";
      room = !s.workshop.smeltPolicy.enabled ? "smelter" : "forge";
    } else if (!s.stats.crafted) {
      heading = "Forge your first team piece";
      body =
        "Mine copper, tin and coal → smelt bronze → forge a team upgrade → it equips automatically.";
      room = s.materials.bronze_ingot ? "forge" : "smelter";
    } else if (!h.contracts) {
      heading = "Finance the next investment";
      body =
        "Use Contract order to make warehouse pieces for an automatic delivery.";
      room = "shop";
    } else if (h.rung === 3 && !game.campaignStatus().eligible) {
      heading = "Build the house behind the champion";
      body = game.campaignStatus().reason;
      room = "smith";
    } else if (h.rung === 3) {
      heading = "The league champion awaits";
      body =
        "Your qualification is complete. Prepare three fighters and launch deliberately.";
      room = "arena";
    } else {
      heading =
        H.leagues[Math.min(4, h.champions)].name +
        " · " +
        (h.champions === 5 ? "championship complete" : "rung " + (h.rung + 1));
      body =
        h.champions === 5
          ? "Choose an inheritance in Legacy."
          : "Five match victories and all three rival styles unlock the next rung.";
      room = h.champions === 5 ? "legacy" : "arena";
    }
    return `<div class="goal-rail"><span>NEXT MILESTONE</span><strong>${heading}</strong><p>${body}</p>${button("Open " + roomNames[room] + " →", "room", { room }, false, "quiet")}</div>`;
  }
  function header() {
    const s = game.state,
      h = s.house;
    return `<aside class="house-nav"><button class="nav-brand" data-action="title"><span class="wordmark">E<span>&</span>I</span><small>HOUSE OF THE HAMMER</small></button><nav aria-label="House rooms">${Object.entries(
      roomNames,
    )
      .filter(([r]) => r !== "legacy" || game.campaignStatus().legacyVisible)
      .map(([r, n]) =>
        button(
          `<span>${marks[r]}</span><b>${r === "smith" ? esc(s.player.name) : n}</b>${r === "legacy" && h.champions < 5 && s.player.legacy.generation === 1 ? "<i>◇</i>" : ""}`,
          "room",
          { room: r },
          r === "legacy" && h.champions < 5 && s.player.legacy.generation === 1,
          ui.room === r ? "active" : "",
        ),
      )
      .join(
        "",
      )}</nav><div class="nav-foot"><span>GENERATION ${s.player.legacy.generation}</span><strong>${esc(s.shopName)}</strong><small>Auto-save · local house</small>${button("Menu & save", "menu", {}, false, "quiet")}</div></aside><header class="house-top"><span>${H.leagues[Math.min(4, h.champions)].name} <small>LOCAL RIVAL LADDER</small></span><div class="wallet"><span>GOLD<strong>${num(s.player.gold)}</strong></span><span>REPUTATION<strong>${num(s.player.reputation)}</strong></span>${button("☰", "menu", {}, false, "mobile-menu")}</div></header>`;
  }
  function toolbar() {
    const d = H.rooms[ui.room],
      r = ui.room === "smith" ? null : ui.room === "legacy" ? null : ui.room;
    return `<div class="room-heading"><div><p class="eyebrow">${ui.room === "legacy" ? "AN ENDURING HOUSE" : ["HUMBLE BEGINNINGS", "AN ESTABLISHED HOUSE", "THE INHERITED ESTATE", "THE CHARTERED GUILDHOUSE", "THE CELESTIAL HOUSE"][game.roomStage(ui.room)]}</p><h1>${d[0]}</h1><p>${d[1]}</p></div><div class="heading-actions">${button("?", "overview", { room: ui.room }, false, "help-button")}${r ? button(`<span>DEVELOP THIS ROOM</span>Upgrades <b>↗</b>`, "upgrades", { room: r }, false, "upgrade-button") : ""}</div></div>`;
  }
  function metrics(rows) {
    return `<div class="metrics">${rows.map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join("")}</div>`;
  }
  function furnishingDescription(d) {
    return (
      {
        hearth_banner:
          "Town visitors arrive 15% faster; newly issued contracts pay 2% more per rank.",
        guild_trophy:
          "New contracts pay 4.5% more and deliveries earn 1 extra reputation per rank.",
      }[d.id] || d.description
    );
  }
  function smith() {
    const s = game.state,
      p = s.player,
      calling = H.professions[s.world.profession];
    return `<div class="room-grid"><div>${panel("The maker", `<div class="identity"><span class="identity-mark">${marks.smith}</span><div><p class="eyebrow">${calling.name} · ${H.origins[s.house.origin].name}</p><h2>${esc(p.name)}</h2><p>${calling.motto}</p></div>${tag("Level " + p.level)}</div><div class="progress-label"><span>Smith experience</span><b>${num(p.xp)} / ${Math.ceil(60 * p.level ** 1.15)}</b></div>${progress(p.xp, Math.ceil(60 * p.level ** 1.15), "Smith experience")}<p>${calling.trait}</p><small>${calling.milestone}</small><hr><h3>${H.vows[s.house.vow].name}</h3><p>${H.vows[s.house.vow].text}</p>`)}${panel("Attributes", attributeRows(), tag(p.points + " points unspent"))}${panel(
      "Class mastery",
      `<p>Make today’s counter or practise for tomorrow’s pattern. Mastery improves speed, quality and access.</p><div class="mastery-grid">${game
        .availableClasses()
        .map((id) => {
          const v = p.proficiency[id];
          return `<button data-action="forge-class" data-id="${id}">${sprite("item-" + id + "-1-1")}<span>${D.classes[id].name}<b>${v.level}</b><small>${v.level >= 100 ? "Discipline mastered" : Math.floor(v.xp) + " / " + (6 + 2 * v.level) + " XP"}</small>${progress(v.level >= 100 ? 1 : v.xp, v.level >= 100 ? 1 : 6 + 2 * v.level, D.classes[id].name + " mastery")}</span></button>`;
        })
        .join("")}</div>`,
    )}</div><aside>${inheritedReadiness()}${panel(
      "Your house",
      metrics([
        ["Champions", s.house.champions + " / 5"],
        ["Contracts", s.house.contracts],
        ["Forged", s.stats.crafted],
        ["Hallmarks", s.house.hallmarks.length],
      ]) +
        `<p>Most combat improvement comes from the equipment you make. Fighters grow slowly through successful bouts.</p>`,
    )}${panel(
      "Permanent furnishings",
      `<p>These survive retirement. Each rank costs 2.4× the previous rank.</p>${Object.values(
        D.decor,
      )
        .map((d) => {
          const v = game.decorationPreview(d.id);
          return `<article class="compact-card"><div class="section-line"><h3>${d.name}</h3>${tag(v.level + "/" + v.maxLevel)}</div><p>${furnishingDescription(d)}</p>${button("Improve · " + num(v.cost) + "g", "decorate", { id: d.id }, !v.eligible)}</article>`;
        })
        .join("")}`,
    )}${panel(
      "House chronicle",
      s.house.history
        .slice(-6)
        .reverse()
        .map((x) => `<p class="chronicle">${esc(x.text)}</p>`)
        .join("") || empty("The house has yet to win its first crown."),
    )}</aside></div>`;
  }
  function inheritedReadiness() {
    const s = game.state,
      h = s.house,
      w = s.workshop;
    if (s.player.legacy.generation < 2) return "";
    const checks = [
      [
        "Mine",
        "Keep at least three mining crews working",
        s.world.miners.length >= 3,
        "mine",
      ],
      [
        "Smelter",
        "Enable ingot maintenance and set a target",
        w.smeltPolicy.enabled &&
          Object.values(w.smeltPolicy.targets).some((n) => n > 0),
        "smelter",
      ],
      [
        "Forge",
        "Rebuild the ledger and run rotating contracts",
        h.upgrades.catalogue && h.catalogue.enabled && h.catalogue.rotate,
        "forge",
      ],
      [
        "Shop",
        "Leave automatic contract deliveries enabled",
        h.autoDeliver,
        "shop",
      ],
    ];
    if (checks.every(([, , ready]) => ready)) return "";
    return panel(
      "Before the house works alone",
      `<p>Permanent talents and discoveries survive. Each successor still sets up their own production rules.</p><div class="readiness-list">${checks.map(([name, detail, ready, room]) => `<div><strong>${ready ? "✓" : "○"} ${name}</strong><p>${detail}</p>${ready ? tag("Ready") : button("Open " + name, "room", { room }, false, "quiet")}</div>`).join("")}</div><small>Supply buying is optional. Set an offline budget in Forge if you want it, and review employee shifts before a long absence.</small>`,
    );
  }
  function mine() {
    const s = game.state,
      seams = game.seams(),
      next = Object.values(H.upgrades).find(
        (n) =>
          n.room === "mine" &&
          n.branch === "Depth" &&
          n.id !== "survey" &&
          !s.house.upgrades[n.id],
      ),
      miners = s.world.miners;
    return (
      metrics([
        ["Materials extracted", num(s.world.totalMined)],
        ["Crews", miners.length + " / " + game.derived().workerCapacity],
        ["Bin capacity", game.binCapacity()],
        [
          "Extraction bonus",
          "+" + Math.round((game._effects().miningSpeed || 0) * 100) + "%",
        ],
      ]) +
      `<div class="room-grid"><div>${panel(
        "Open workings",
        `<div class="seam-grid">${seams
          .map((v) => {
            const mat = D.materials[v.id],
              n = s.materials[v.id],
              workers = miners.filter((m) => m.assigned === v.id);
            return `<article class="seam"><div class="section-line">${sprite("material-" + v.id)}<h3>${v.name}</h3><strong>${num(n)}<small> / ${game.binCapacity()}</small></strong></div>${progress(n, game.binCapacity(), mat.name + " stock")}<p>${workers.length} assigned · ${Math.ceil(v.seconds / (1 + (game._effects().miningSpeed || 0)))}s per load</p><div class="actions">${button(game.quarryDerived().manualReady ? "Help load cart" : "Cart being loaded", "mine", { id: v.id }, !game.quarryDerived().manualReady)}${button("Sell 5 · " + game.materialSalePrice(v.id, 5) + "g", "sell-material", { id: v.id }, n < 5)}</div><small>Help every 14s yields ${1 + Math.floor(Math.sqrt(s.player.stats.strength) / 4) + (game._effects().manualYield || 0)} material${game.binCapacity() - n < 2 ? " · full-bin overflow is lost" : ""}.</small></article>`;
          })
          .join(
            "",
          )}${next ? `<article class="seam next-seam"><p class="eyebrow">NEXT WORKING</p><h3>${next.name}</h3><p>${masteryDistance(next)}${game.upgradePreview(next.id).gates.join(" · ") || "Ready to invest"}</p>${button("Review · " + next.cost + "g", "upgrades", { room: "mine" })}</article>` : ""}</div>`,
      )}${panel("Crew assignments", `<p>A crew returns to its assigned vein as soon as there is space. Full bins redirect work to another open vein.</p><div class="crew-list">${miners.map((m) => `<label><b>Miner ${m.id.split("-")[1]}</b><select data-worker="${m.id}" aria-label="Miner ${m.id.split("-")[1]} assignment">${seams.map((v) => `<option value="${v.id}" ${m.assigned === v.id ? "selected" : ""}>${v.name}</option>`).join("")}</select><span>${D.materials[m.working].name} · ${Math.floor(m.progress * 100)}%</span>${progress(m.progress, 1, m.id + " current load")}</label>`).join("")}</div>`, button("Hire miner · " + game.hireCost() + "g", "hire-miner", {}, s.player.gold < game.hireCost() || miners.length >= game.derived().workerCapacity))}</div><aside>${panel("Purchased supplies", supplies())}${panel("People at the workings", departmentSummary("mine"))}${panel("Rich pockets", s.house.upgrades.survey ? `<p>Recover one extra cart from an open working every ten minutes. Contents are known before you choose.</p><small>${s.house.nextPocket > s.simTime ? "Next survey in " + time((s.house.nextPocket - s.simTime) / 1000) : "A pocket is ready."}</small><div class="actions">${seams.map((v) => button(D.materials[v.id].name, "pocket", { id: v.id }, s.house.nextPocket > s.simTime)).join("")}</div>` : `<p>The Surveyor’s ledger reveals optional material bursts once you have extracted 150 materials.</p>${button("Explore depth upgrades", "upgrades", { room: "mine" })}`)}<p class="footnote">${num(s.world.materialsLost || 0)} materials lost to full bins this generation.</p></aside></div>`
    );
  }
  function departmentSummary(department) {
    const n = game.employeeSummary(department);
    return `<p>${n.active} on duty · ${n.resting} resting · ${n.hired}/${n.total} hired.</p>${Object.values(
      D.staff,
    )
      .filter((d) => d.department === department && game.state.staff[d.id])
      .map((d) => `<p><b>${d.person}</b> · ${employeeBonuses(d.id)}</p>`)
      .join(
        "",
      )}${button("Manage " + pretty(department) + " staff", "department", { id: department }, false, "quiet")}`;
  }
  function smelter() {
    const s = game.state,
      d = game.smelterDerived();
    return (
      metrics([
        [
          "Active furnaces",
          s.workshop.jobs.filter((j) => j.status === "active").length +
            " / " +
            d.lanes,
        ],
        ["Ingots made", num(s.workshop.smelted)],
        ["Preparation quality", "+" + d.quality],
        ["Speed", "×" + d.speed.toFixed(2)],
      ]) +
      `<div class="room-grid"><div>${panel(
        "Alloys & grades",
        `<label class="inline-field">Preparation<select data-ui="grade">${Object.entries(
          H.grades,
        )
          .map(
            ([id, g]) =>
              `<option value="${id}" ${ui.grade === id ? "selected" : ""}>${g.name}</option>`,
          )
          .join(
            "",
          )}</select></label><p>${H.grades[ui.grade].text}${ui.grade !== "standard" ? " Requires an on-duty Assayer." : ""}</p><div class="alloy-list">${W.metals
          .filter((id) => game.smeltPreview(id).unlocked)
          .map((id) => {
            const r = W.smelts[id],
              v = game.smeltPreview(id, 1, ui.grade);
            return `<article class="alloy-card"><div class="section-line">${sprite("material-" + r.output)}<div><h3>${r.name}</h3><small>${time(v.seconds)} / batch · yields ${v.amount}</small></div><strong>${s.materials[r.output]}<small> / ${game.binCapacity()}</small></strong></div>${materials(v.inputs)}<p class="grade-stock">${
              Object.entries(s.house.graded[id] || {})
                .filter(([, n]) => n)
                .map(([g, n]) => H.grades[g].name + ": " + n)
                .join(" · ") || "Standard stock"
            }</p><div class="actions">${[1, 5].map((q) => button("Smelt " + q, "smelt", { id, quantity: q }, !game.smeltPreview(id, q, ui.grade).eligible, "primary")).join("")}${button("Max " + v.maxQuantity, "smelt", { id, quantity: v.maxQuantity }, !v.eligible || v.maxQuantity < 1)}</div><small>${v.reason}${game.smeltOverflow(id) ? " The last batch may overflow; later batches wait for space." : ""}</small></article>`;
          })
          .join("")}</div>`,
      )}${panel(
        "Maintain ingot stocks",
        s.workshop.upgrades.stockkeeper
          ? `<p>Automatic batches use standard grade. Input reserves and bin space are respected; higher alloys request intermediates.</p><div class="target-fields">${W.metals
              .filter((id) => game.smeltPreview(id).unlocked)
              .map(
                (id) =>
                  `<label>${D.materials[id + "_ingot"].name}<input name="target-${id}" type="number" min="0" max="1000" value="${s.workshop.smeltPolicy.targets[id] || 0}"></label>`,
              )
              .join(
                "",
              )}</div><label class="inline-field">Input reserve<input name="smelt-reserve" type="number" min="0" max="1000" value="${s.workshop.smeltPolicy.reserve}"></label><div class="actions">${button(s.workshop.smeltPolicy.enabled ? "Save & keep running" : "Save & enable", "smelt-targets", {}, false, "primary")}${button("Pause", "smelt-pause", {}, !s.workshop.smeltPolicy.enabled)}</div><p class="status-line">${game.smeltPolicyStatus()}</p>`
          : `<p>Furnace stockkeeper keeps chosen ingot stocks ready. Level 2 · 35g.</p>${button("Develop production", "upgrades", { room: "smelter" })}`,
      )}</div><aside>${panel(
        "Smelting queue",
        s.workshop.jobs
          .map((j) => {
            const r = W.smelts[j.recipeId];
            return `<article class="queue-card"><h3>${r.name}</h3><p>${H.grades[j.grade || "standard"].name} · ${j.status === "active" ? time((j.completeAt - s.simTime) / 1000) : game.smeltWaitingForStorage(j) ? "Waiting for ingot storage" : "Queued"}</p>${progress(j.status === "active" ? s.simTime - j.startedAt : 0, j.duration || 1, r.name + " progress")}${button("Cancel & refund", "cancel-smelt", { id: j.id }, false, "quiet")}</article>`;
          })
          .join("") ||
          empty("No batches queued. Ore is consumed when you place an order."),
      )}${panel("Foundry staff", departmentSummary("smelter"))}</aside></div>`
    );
  }
  function forge() {
    const s = game.state,
      classes = game.availableClasses(),
      groupClasses = classes.filter((id) => classGroup(id) === ui.group);
    if (!groupClasses.includes(ui.type))
      ui.type = groupClasses[0] || classes[0];
    const patterns = Object.values(D.recipes).filter(
      (r) => r.classId === ui.type && game._recipeKnown(r),
    );
    const tiers = [...new Set(patterns.map((r) => r.materialId))];
    if (!tiers.includes(ui.material)) ui.material = tiers[0];
    const selected = patterns.filter((r) => r.materialId === ui.material);
    if (!selected.some((r) => r.id === ui.recipe)) ui.recipe = selected[0]?.id;
    const r = D.recipes[ui.recipe],
      options = {
        intent: ui.intent,
        treatment: ui.treatment,
        grade: ui.grade,
        enchantmentId: ui.enchantment || null,
      },
      v = r && game.craftPreview(r.id, options),
      master = s.player.proficiency[ui.type];
    const next = Object.values(D.recipes)
      .filter((r) => r.classId === ui.type && r.variant < 2)
      .sort((a, b) => a.tier - b.tier || a.variant - b.variant)
      .find(
        (r) =>
          !game._recipeKnown(r) ||
          game
            .craftPreview(r.id)
            .gates.some(
              (g) => !g.met && g.source !== "Quarry or material shop",
            ),
      );
    return `<div class="room-grid forge-grid"><div>${panel(
      "Design a piece",
      `<div class="forge-purpose" role="group" aria-label="Craft purpose">${[
        ["team", "Team commission", "Auto-equip a fighter’s upgrade"],
        ["catalogue", "Contract order", "Hold in warehouse · auto-deliver"],
        ["stock", "Shop stock", "Automatically fill the displays"],
        ["practice", "Mastery practice", "Learn an item class"],
      ]
        .map(
          ([id, n, d]) =>
            `<button data-action="intent" data-id="${id}" aria-pressed="${ui.intent === id}" class="${ui.intent === id ? "selected" : ""}"><strong>${n}</strong><small>${d}</small></button>`,
        )
        .join(
          "",
        )}</div><div class="tabs">${["weapons", "armour", "other"].map((id) => button(pretty(id), "group", { id }, false, ui.group === id ? "selected" : "")).join("")}</div><div class="form-two"><label>Item class<select data-ui="type">${groupClasses.map((id) => `<option value="${id}" ${ui.type === id ? "selected" : ""}>${D.classes[id].name}</option>`).join("")}</select></label><label>Material tier<select data-ui="material">${tiers.map((id) => `<option value="${id}" ${ui.material === id ? "selected" : ""}>${D.materials[id].name}</option>`).join("")}</select></label></div><div class="pattern-list">${selected
        .map((x) => {
          const p = game.craftPreview(x.id);
          return `<button data-action="pattern" data-id="${x.id}" class="${x.id === ui.recipe ? "selected" : ""}" aria-pressed="${x.id === ui.recipe}">${itemIcon(x)}<span><strong>${x.name}</strong><small>${["Training · economical", "Standard · reliable", "Prestige · demanding", "Relic · inherited", "Sovereign · legendary", "Oathbound · matching pair", "Astral · matching pair", "Eternal · three-piece concord"][x.variant || 0]}</small></span><b>Q${p.quality}</b></button>`;
        })
        .join("")}</div>${
        r
          ? `<div class="selected-design"><div class="design-title">${itemIcon(r)}<div><p class="eyebrow">${ui.intent === "team" ? "FOR YOUR HOUSE" : ui.intent === "catalogue" ? "FOR YOUR CLIENTS" : "FOR YOUR CRAFT"}</p><h2>${r.name}</h2><p>${r.description}</p></div></div><div class="form-two"><label>Prefix treatment<select data-ui="treatment">${Object.entries(
              H.treatments,
            )
              .map(
                ([id, t]) =>
                  `<option value="${id}" ${ui.treatment === id ? "selected" : ""}>${t.name}${!game.treatmentAvailable(r.id, id) ? " · locked" : ""}</option>`,
              )
              .join(
                "",
              )}</select></label><label>Metal grade<select data-ui="grade">${Object.entries(
              H.grades,
            )
              .map(
                ([id, g]) =>
                  `<option value="${id}" ${ui.grade === id ? "selected" : ""}>${g.name}</option>`,
              )
              .join(
                "",
              )}</select></label><label>Enchantment suffix<select data-ui="enchantment"><option value="">None</option>${Object.values(
              D.enchantments,
            )
              .filter(
                (e) =>
                  game._gates(e.requires).every((g) => g.met) &&
                  (!e.slots?.length || e.slots.includes(r.slot)),
              )
              .map(
                (e) =>
                  `<option value="${e.id}" ${ui.enchantment === e.id ? "selected" : ""}>${e.name} · ${e.cost}g</option>`,
              )
              .join("")}</select></label>${
              ui.intent === "team"
                ? `<label>Reserve for<select data-ui="hero">${s.adventurers
                    .filter((h) =>
                      D.archetypes[h.archetypeId].preferences.includes(
                        r.classId,
                      ),
                    )
                    .map(
                      (h) =>
                        `<option value="${h.id}" ${h.id === ui.hero ? "selected" : ""}>${esc(h.name)}</option>`,
                    )
                    .join("")}</select></label>`
                : ""
            }</div><p class="preparation-note">${H.treatments[ui.treatment].text} ${ui.grade !== "standard" ? H.grades[ui.grade].text : ""}</p>${materials(v.inputs)}${metrics(
              [
                ["Expected quality", "Q" + v.quality],
                ["Normal work", time(v.seconds)],
                ["Preparation", v.gold + "g"],
                ["Mastery", master.level],
              ],
            )}<div class="craft-bar">${button("Craft 1", "craft", { quantity: 1 }, !v.eligible, "primary")}${button("Craft 5", "craft", { quantity: 5 }, !game.craftPreview(r.id, { ...options, quantity: 5 }).eligible)}${button("Craft max · " + v.maxQuantity, "craft", { quantity: v.maxQuantity }, !v.eligible || v.maxQuantity < 1)}<span>${esc(v.reason)}</span></div><small>${game.craftExperience(r).smith < 1 ? "Familiar work grants " + Math.round(game.craftExperience(r).smith * 100) + "% smith XP. Newer materials teach more. " : ""}${ui.intent === "team" ? "Team upgrades equip automatically. During a bout, or if no improvement is available, they wait protected in the warehouse." : ui.intent === "practice" ? `Earn class mastery. Town clearance returns ${game._townPrice({ recipeId: r.id, quality: v.quality })}g; materials and time are still consumed.` : "Contract pieces stay in the warehouse and deliver automatically when an order is complete. Shop stock fills displays for town buyers."}</small></div>`
          : empty("No pattern available in this class.")
      }`,
    )}${
      next
        ? panel(
            "Next standard pattern",
            `<h3>${next.name}</h3><p>${masteryDistance(next)}${
              game._recipeKnown(next)
                ? game
                    .craftPreview(next.id)
                    .gates.filter(
                      (g) => !g.met && g.source !== "Quarry or material shop",
                    )
                    .map(
                      (g) =>
                        `${g.label}: ${g.current || 0} / ${g.required || 1}`,
                    )
                    .join(" · ")
                : "Develop " +
                  (next.tier === 1
                    ? "Guild patterns"
                    : "tier " + next.tier + " patterns") +
                  " in Forge upgrades."
            }</p>`,
          )
        : ""
    }</div><aside>${panel("Purchased supplies", supplies())}${panel("Work in progress", forgeQueue())}${panel("Forge staff", departmentSummary("forge"))}${s.house.upgrades.catalogue ? panel("Catalogue production", catalogueForm()) : ""}</aside></div>`;
  }
  function masteryDistance(r) {
    if (!r.classId) return "";
    const target =
        r.requires?.proficiency?.[r.classId] || r.requires?.proficiency || 0,
      p = game.state.player.proficiency[r.classId];
    if (typeof target !== "number" || target <= p.level) return "";
    let xp = -p.xp;
    for (let level = p.level; level < target; level++) xp += 6 + 2 * level;
    return `Mastery ${p.level} → ${target}: ${Math.ceil(xp)} class XP remaining. Repeat familiar patterns to practise. `;
  }
  function classGroup(id) {
    const slot = D.classes[id].slot;
    return slot === "weapon" ? "weapons" : slot === "body" ? "armour" : "other";
  }
  function forgeQueue() {
    const s = game.state;
    return (
      s.jobs
        .map((j) => {
          const v = game.techniquePreview(j.id),
            cancel = game.cancellationPreview(j.id);
          return `<article class="queue-card"><div class="section-line"><h3>${D.recipes[j.recipeId].name}</h3>${tag(j.houseIntent || "catalogue")}</div><p>${j.status === "active" ? time((j.completeAt - s.simTime) / 1000) + " remaining · Q" + j.quality : "Queued · ingredients reserved"}</p>${progress(j.status === "active" ? s.simTime - j.startedAt : 0, j.duration || 1, "Forge work")}<div class="actions">${button("Finish +" + v.qualityGain + "Q · +" + time(v.addedSeconds), "finish", { id: j.id }, !v.eligible)}${button("Cancel & refund", "cancel", { id: j.id }, !cancel.eligible, "quiet")}</div><small>Pass ${v.passes} / 5${!cancel.eligible ? " · " + cancel.reason : ""}</small></article>`;
        })
        .join("") ||
      empty(
        "Choose a purpose and pattern. Completed pieces go to the armoury or shop.",
      )
    );
  }
  function catalogueForm() {
    const c = game.state.house.catalogue;
    return `<p>Maintain your chosen design, or rotate through eligible orders as they are automatically delivered. Production respects quality, storage and reserves.</p><label>Recipe<select name="catalogue-recipe">${Object.values(
      D.recipes,
    )
      .filter((r) => game._recipeKnown(r) && r.variant < 2)
      .map(
        (r) =>
          `<option value="${r.id}" ${c.recipeId === r.id ? "selected" : ""}>${r.name}</option>`,
      )
      .join(
        "",
      )}</select></label><label class="check"><input name="catalogue-rotate" type="checkbox" ${c.rotate ? "checked" : ""}> Follow rotating contracts automatically</label><label>Input reserve<input name="catalogue-reserve" type="number" value="${c.reserve}" min="0" max="1000"></label><label class="check"><input name="catalogue-buy" type="checkbox" ${c.autoBuy ? "checked" : ""}> Buy wood, leather and oil, keeping 20g</label><label>Offline supply budget (gold)<input name="catalogue-budget" type="number" min="0" max="1000000" value="${game.state.automation.spendCap}"></label><small>0 disables purchases while away. This limit covers the entire offline session.</small><div class="actions">${button("Save & run", "catalogue-save", {}, false, "primary")}${button("Pause", "catalogue-pause", {}, !c.enabled)}</div><p class="status-line">${esc(game.catalogueStatus())}</p>`;
  }
  function heroSelect() {
    return `<div class="hero-selector">${game.state.adventurers.map((h) => button(`<span class="portrait">${fighterArt(h.archetypeId)}</span><span><strong>${esc(h.name)}</strong><small>${D.archetypes[h.archetypeId].name}</small></span>`, "hero", { id: h.id }, false, currentHero()?.id === h.id ? "selected" : "")).join("")}</div>`;
  }
  function fighterDetail(h) {
    const st = game.heroStats(h.id),
      xp = 40 * h.level,
      recovery = Math.max(
        0,
        (game.state.house.recovery[h.id] || 0) - game.state.simTime,
      );
    return `<div class="fighter-header"><span class="portrait large">${fighterArt(h.archetypeId)}</span><div><h2>${esc(h.name)}</h2><p>${D.archetypes[h.archetypeId].name} · Level ${h.level}</p><small>${recovery ? "Recovering · " + time(recovery / 1000) : "Ready for the arena"}</small></div></div><div class="progress-label"><span>Fighter experience</span><b>${h.xp} / ${xp}</b></div>${progress(h.xp, xp, h.name + " experience")}${statsList(st)}<p class="equip-types"><b>Can equip</b> ${D.archetypes[h.archetypeId].preferences.map((id) => D.classes[id].name).join(" · ")}</p>`;
  }
  function equipment(h) {
    return `<div class="equipment-list">${H.slots
      .map((slot) => {
        const i = h.equipment[slot];
        return `<article class="equipment-slot ${i ? quality(i.quality) : ""}"><span class="slot-name">${pretty(slot)}</span>${i ? `${itemIcon(D.recipes[i.recipeId])}<div><strong>${esc(itemName(i))}</strong><small>${itemMeta(i)}</small><small>${itemStatsText(i)}</small></div>${button("Unequip", "unequip", { hero: h.id, slot }, !!game.activeMatch(), "quiet")}` : `<span class="item-sigil">◇</span><span>Borrowed ${slot === "weapon" ? "weapon" : slot === "body" ? "clothing" : "— empty slot"}</span>`}</article>`;
      })
      .join("")}</div>`;
  }
  function itemStatsText(i) {
    const st = game._itemCombat(i);
    return (
      [
        ["attack", "damage"],
        ["health", "health"],
        ["armor", "armour"],
        ["armorPen", "piercing"],
      ]
        .filter(([k]) => st[k])
        .map(([k, n]) => Number(st[k].toFixed(1)) + " " + n)
        .join(" · ") +
      (st.resistances?.fire
        ? " · " + Math.round(st.resistances.fire * 100) + "% fire ward"
        : "")
    );
  }
  function equipmentComparison(preview) {
    const format = (n, kind) => {
      const value = kind === "percent" ? n * 100 : n;
      return (
        Number(value.toFixed(2)) +
        (kind === "percent" ? "%" : kind === "seconds" ? "s" : "")
      );
    };
    return `<dl class="comparison">${(preview.changes || []).map((c) => `<div><dt>${esc(c.label)}</dt><dd class="${c.improved ? "stat-gain" : "stat-loss"}">${format(c.before, c.format)} → ${format(c.after, c.format)} <strong>${c.delta > 0 ? "+" : ""}${format(c.delta, c.format)}</strong></dd></div>`).join("")}</dl>`;
  }
  function shop() {
    const s = game.state,
      h = currentHero();
    return `<div class="tabs large-tabs">${[
      ["armoury", "Team armoury"],
      ["contracts", "Contracts"],
      ["stock", "Displays & warehouse"],
    ]
      .map(([id, n]) =>
        button(
          n,
          "shop-tab",
          { id },
          false,
          ui.shopTab === id ? "selected" : "",
        ),
      )
      .join("")}</div>${
      ui.shopTab === "armoury"
        ? `<div class="room-grid"><div>${heroSelect()}${panel("The house roster", fighterDetail(h) + equipment(h))}</div><aside>${panel(
            "Equip from your stock",
            `<p>Only items that improve at least one combat stat are shown. Green is a gain; red is a tradeoff. Swaps are free.</p>${
              s.inventory
                .map((i) => ({ i, v: game.equipmentPreview(h.id, i.id) }))
                .filter(({ v }) => v.improves)
                .map(({ i, v }) => {
                  return `<article class="stock-piece ${quality(i.quality)}">${itemIcon(D.recipes[i.recipeId])}<div><h3>${esc(itemName(i))}</h3><p>${itemMeta(i)}</p><small>${itemStatsText(i)}</small>${equipmentComparison(v)}${button("Equip on " + esc(h.name), "equip", { hero: h.id, id: i.id }, !v.eligible, "primary")}<small>${v.reason}</small></div></article>`;
                })
                .join("") ||
              empty(
                "No equipment upgrades ready for this fighter. Finish the current bout or forge a stronger piece; all stock remains in Displays & warehouse.",
              )
            }`,
          )}</aside></div>`
        : ui.shopTab === "contracts"
          ? `<div class="room-grid"><div>${panel(
              "The contract counter",
              `<p>Disclosed orders stay until fulfilled. Orders complete automatically when enough matching pieces are ready. Only unprotected pieces are delivered, lowest quality first.</p><div class="contract-grid">${s.house.orders
                .map((o) => {
                  const v = game.contractPreview(o.id);
                  return `<article class="contract"><p class="eyebrow">${esc(o.client)}</p><h3>${o.quantity} × ${D.classes[o.classId].name}</h3><p>Tier ${o.tier}+ · quality ${o.quality}+</p><strong class="contract-price">${o.payment}<small> GOLD ON DELIVERY</small></strong>${progress(v.items.length, o.quantity, "Contract completion")}<p>${v.reason}</p><div class="actions">${!s.house.autoDeliver ? button("Deliver order", "deliver", { id: o.id }, !v.eligible, "primary") : ""}${button("Plan this work", "contract-plan", { id: o.id })}</div></article>`;
                })
                .join("")}</div>`,
            )}${panel("House hallmarks", s.house.hallmarks.length ? `<p>These designs accompanied a champion victory. Keep the original in your armoury and reproduce its pattern for the house.</p><div class="tag-list">${s.house.hallmarks.map((id) => tag(D.recipes[id].name)).join("")}</div>` : empty("Win a championship with your own equipment to establish a hallmark."))}</div><aside>${panel("Counter staff", departmentSummary("shop"))}${panel("Contract handling", `<p>Automatic delivery is available from the start. Finished orders pay immediately. Reserved and equipped work is safe.</p>${button(s.house.autoDeliver ? "Pause deliveries" : "Enable deliveries", "auto-deliver", {}, false, "primary")}`)}${panel(
              "Commercial record",
              metrics([
                ["Delivered", s.house.contracts],
                ["Reputation", num(s.player.reputation)],
                ["Gold earned", num(s.stats.goldEarned)],
              ]),
            )}</aside></div>`
          : `${panel(
              "Display cases",
              `<p>Displays automatically fill from spare stock, lowest quality first. Contract pieces stay in the warehouse; team upgrades equip automatically. Protected spare gear is never sold.</p><div class="display-grid">${s.inventory
                .filter((i) => i.displayed)
                .map((i) => stockRow(i))
                .join(
                  "",
                )}${Array.from({ length: Math.max(0, game.derived().displayCapacity - s.inventory.filter((i) => i.displayed).length) }, (_, i) => `<div class="empty-display"><span>◇</span><strong>Open display</strong><small>Fills from unprotected stock</small></div>`).join("")}</div>`,
            )}${panel(
              "Warehouse",
              `<p>${s.inventory.length} / ${game.derived().storageCapacity} storage used. Team gear stays protected. Displays refill with the lowest-quality eligible piece.</p><div class="warehouse">${
                s.inventory
                  .filter((i) => !i.displayed)
                  .sort((a, b) => a.quality - b.quality)
                  .map((i) => stockRow(i))
                  .join("") || empty("No stored pieces.")
              }</div>`,
            )}`
    }`;
  }
  function stockRow(i) {
    const sale = game.salePreview(i.id);
    return `<article class="stock-row ${quality(i.quality)}">${itemIcon(D.recipes[i.recipeId])}<div><h3>${esc(itemName(i))}</h3><p>${itemMeta(i)}</p><small>${itemStatsText(i)}</small><small>${game._protected(i) ? "Protected for the house" : i.intent === "catalogue" || game.contractStockIds().has(i.id) ? "Warehouse · held for contracts" : "Automatically stocked for sale"}</small></div><div class="actions">${button(game._protected(i) ? "Release" : "Protect", "protection", { id: i.id })}${button("Sell " + sale.price + "g", "sell-item", { id: i.id }, !sale.eligible)}${button("Scrap", "scrap", { id: i.id }, game._protected(i))}</div></article>`;
  }
  function exhibitions() {
    const h = game.state.house,
      choices = [];
    for (let league = 0; league < 5; league++)
      for (let rung = 0; rung < 3; rung++)
        for (const rival of H.rivals) {
          const q = game.qualification(league, rung);
          if (q.styles.includes(rival.id))
            choices.push({
              key: league + ":" + rung + ":" + rival.id,
              league,
              rung,
              rival: rival.id,
              label:
                H.leagues[league].name +
                " · rung " +
                (rung + 1) +
                " · " +
                rival.name,
            });
        }
    const choice =
      choices.find((x) => x.key === ui.exhibitionChoice) || choices.at(-1);
    if (!choice)
      return "<p>Beat a rival to open an exhibition. Exhibitions earn a smaller purse and experience, without qualification credit.</p>";
    const v = game.matchPreview({ ...choice, kind: "exhibition" });
    return `<p>Repeat a beaten rival every five minutes. The first 12 daily wins against the current or previous league train fighters. All wins earn their purse; exhibitions never qualify the team. Repetition stops on defeat.</p><label>Cleared opponent<select data-ui="exhibitionChoice">${choices.map((c) => `<option value="${c.key}" ${c === choice ? "selected" : ""}>${c.label}</option>`).join("")}</select></label><p>${v.purse}g victory purse · ${v.reason}</p><div class="actions">${button("Launch exhibition", "exhibit", choice, !v.eligible)}${h.exhibition ? button("Stop exhibitions", "stop-exhibitions") : h.upgrades.exhibitions ? button("Authorize repeat", "repeat", choice, !v.eligible) : ""}</div>${h.exhibition ? `<small>Repeating ${H.rivals.find((r) => r.id === h.exhibition.rival).name} in league ${h.exhibition.league + 1}, rung ${h.exhibition.rung + 1}.</small>` : !h.upgrades.exhibitions ? "<small>Develop Exhibition steward after five wins for automatic repetition.</small>" : ""}`;
  }
  function returnSummary() {
    if (!game.state.pendingOfflineReport) return "";
    const r = mergeReports(null, game.state.pendingOfflineReport);
    return (
      `<p class="eyebrow">WELCOME BACK TO THE HOUSE</p><h2>While you were away</h2>` +
      metrics([
        ["Credited", time(r.credited / 1000)],
        ["Crafted", r.crafted],
        ["Contracts", r.contracts || 0],
        ["Gold", (r.netGold >= 0 ? "+" : "") + num(r.netGold)],
      ]) +
      `<p>Away ${time(r.elapsed / 1000)} · ${r.mined || 0} mined · ${r.smelted || 0} ingots cast · ${r.victories} arena wins · ${r.defeats} defeats.</p><dl class="compact-ledger"><div><dt>Contracts / town sales / arena</dt><dd>${num(r.contractGold)}g / ${num(r.marketGold)}g / ${num(r.exhibitionGold)}g</dd></div><div><dt>Authorised supply purchases</dt><dd>−${num(r.automationSpent)}g</dd></div><div><dt>Material balance / overflow lost</dt><dd>${r.netMaterials >= 0 ? "+" : ""}${num(r.netMaterials)} / ${num(r.lost)}</dd></div></dl><h3>Achievements & discoveries</h3>${[...(r.achievements || []), ...(r.discoveries || []), ...(r.studies || []).map((x) => "Study completed: " + x)].map((x) => `<p class="discovery-note">✦ ${esc(x)}</p>`).join("") || "<p>No new milestones this time. Your workshop still made progress.</p>"}${r.capped ? `<p class="warning">24-hour allowance reached. ${time((r.elapsed - r.credited) / 1000)} was not simulated. Return visits reset the allowance.</p>` : ""}<p>${esc(r.stopReason || "Your authorised workshop policies kept working.")}</p><p class="footnote">Still in production: ${game.state.jobs.length} forge jobs · ${game.state.workshop.jobs.length} smelting batches.</p><div class="actions">${button("Back to the house", "dismiss-return", {}, false, "primary")}</div>`
    );
  }
  function campaignPanel() {
    const s = game.state,
      c = s.house.campaign,
      status = game.campaignStatus();
    const room = ui.room,
      discovered = game.discoverySummary(room);
    let html = "";
    if ((room === "smith" || room === "arena") && s.house.champions < 5)
      html += panel(
        "The next guild accreditation",
        `<p>Qualification proves the team. Sustained workshop work earns the next licence. Both are required for a champion challenge.</p><div class="accreditation-list">${status.checks.map((x) => `<div><span>${x.label}</span><strong>${x.unit === "time" ? time(Math.min(x.current, x.required) / 1000) + " / " + time(x.required / 1000) : num(x.current) + " / " + num(x.required)} ${x.met ? "✓" : ""}</strong>${progress(x.current, x.required, x.label)}</div>`).join("")}</div><small>${esc(status.reason)} Age advances at full speed online and offline, with a 24-hour allowance per absence.</small>`,
      );
    if (c.unread.length)
      html += `<div class="discovery-note"><strong>✦ ${esc(c.unread[0])}</strong><span>${c.unread.length > 1 ? c.unread.length + " new discoveries in your house. " : ""}Visit the relevant room to read the findings.</span>${button("Read findings", "discoveries", {}, false, "quiet")}</div>`;
    if (discovered.length)
      html += `<details class="discovery-journal"><summary>House discoveries · ${discovered.length}</summary>${discovered.map((d) => `<article><h3>${d.name}</h3><p>${d.text}</p></article>`).join("")}</details>`;
    const studies = Campaign.projects
      .map((p) => game.projectPreview(p.id))
      .filter((p) => p.visible && (p.room === room || room === "legacy"));
    if (studies.length || (c.research && room === "smith"))
      html += panel(
        "The living archive",
        `${c.research ? `<div class="research-current"><strong>${Campaign.projects.find((p) => p.id === c.research.id).name}</strong><p>${time((c.research.endsAt - s.simTime) / 1000)} remaining · knowledge survives retirement</p>${progress(s.simTime - c.research.startedAt, c.research.endsAt - c.research.startedAt, "Study progress")}</div>` : ""}<div class="study-grid">${studies
          .map(
            (p) =>
              `<article class="compact-card"><div class="section-line"><h3>${p.name}</h3>${tag(p.owned ? "Learned" : time(p.hours * 3600))}</div><p>${p.text}</p>${
                !p.owned
                  ? `<small>${num(p.gold)}g${p.seals ? " · " + p.seals + " seals" : ""} · ${Object.entries(
                      p.inputs || {},
                    )
                      .map(([id, n]) => n + " " + D.materials[id].name)
                      .join(
                        ", ",
                      )}</small><div class="actions">${button("Begin study", "research", { id: p.id }, !p.eligible, "primary")}</div><small>${esc(p.reason)}</small>`
                  : ""
              }</article>`,
          )
          .join(
            "",
          )}</div><small>One study at a time. Costs are committed at the start; it runs while you are away.</small>`,
      );
    if (room === "arena" && s.house.champions === 5) {
      const v = game.trialPreview();
      html += panel(
        "Beyond the Crown · The Crucible",
        `<p class="eyebrow">CIRCLE ${v.cycle} · TRIAL ${v.depth}</p><h2>${v.name}</h2><p>${v.description}</p><p>${v.seals} seals · ${num(v.purse)}g · first-time victories only. ${c.seals} seals held.</p><div class="enemy-stats">${v.enemies.map((e) => `<div><span>${e.line.toUpperCase()}</span><b>${num(e.health)} HP</b><small>${e.attack.toFixed(1)} damage · ${e.armor.toFixed(1)} armour</small></div>`).join("")}</div>${button("Gather & enter the Crucible", "ascend", {}, !v.eligible, "primary")}<p>${esc(v.reason)}</p><small>Three rival modifiers rotate. Every trial grows stronger. Later generations open deeper circles, up to 60 trials. Seals fund permanent research; a new career resets current trial depth.</small>`,
      );
    }
    return html;
  }
  function oathsPanel() {
    const c = game.state.house.campaign;
    return (
      panel(
        "An oath for the next generation",
        `<p>Current oath: <strong>${Campaign.burdens[c.burden].name}</strong>. Choose a different challenge for your next maker. This choice does not change the current career.</p><div class="choice-list">${Object.entries(
          Campaign.burdens,
        )
          .map(
            ([id, b]) =>
              `<button data-action="burden" data-id="${id}" class="${c.nextBurden === id ? "selected" : ""}"><strong>${b.name} ${c.oaths.includes(id) ? "✓" : ""}</strong><span>${b.text}</span></button>`,
          )
          .join(
            "",
          )}</div><p>${c.seals} Crucible seals held · deepest trial ${c.bestTrial}. Research, discoveries and first-completion oath records survive retirement.</p>`,
      ) +
      panel(
        "Inherited sigils",
        `<p>Crucible seals offer a choice: decode a new equipment family or strengthen every future team. Sigil ranks persist; costs rise with each inscription.</p><div class="study-grid">${[
          "edge",
          "ward",
        ]
          .map((id) => {
            const v = game.lineagePreview(id);
            return `<article class="compact-card"><h3>${id === "edge" ? "The enduring edge" : "The enduring ward"} · ${v.rank} / 80</h3><p>${id === "edge" ? "Each rank multiplies team damage by 1.12." : "Each rank multiplies team health by 1.12 and armour by 1.06."}</p><small>${v.seals} seals · ${num(v.gold)}g</small><div class="actions">${button("Inscribe", "lineage", { id }, !v.eligible, "primary")}</div><small>${v.reason}</small></article>`;
          })
          .join("")}</div>`,
      )
    );
  }
  function arena() {
    const s = game.state,
      h = s.house,
      league = Math.min(4, h.champions),
      rung = Math.min(2, h.rung),
      champion = h.rung === 3 && h.champions < 5,
      rival = H.rivals.find(
        (r) =>
          r.id ===
          (champion ? H.rivals[league % H.rivals.length].id : ui.rival),
      ),
      q = game.qualification(league, rung),
      kind = champion ? "champion" : h.champions === 5 ? "exhibition" : "rival",
      preview = game.matchPreview({ rival: ui.rival, kind, league, rung }),
      m = game.activeMatch();
    return `<div class="league-strip">${H.leagues.map((l, i) => `<div class="${i < h.champions ? "complete" : i === league ? "current" : ""}"><span>0${i + 1} ${i < h.champions ? "✓" : ""}</span><strong>${l.name}</strong><small>${i < h.champions ? "Champion defeated" : i === league ? "Current league" : "Locked"}</small></div>`).join("")}</div><div class="tabs large-tabs">${[
      ["challenge", "Challenges"],
      ["team", "Fighters & formation"],
      ["replays", "Replays"],
    ]
      .map(([id, n]) =>
        button(
          n,
          "arena-tab",
          { id },
          false,
          ui.arenaTab === id ? "selected" : "",
        ),
      )
      .join("")}</div>${
      ui.arenaTab === "team"
        ? `<div class="room-grid"><div>${heroSelect()}${panel("Fighter record", fighterDetail(currentHero()) + equipment(currentHero()))}</div><aside>${panel("Three fighters. One formation.", teamFormation())}${panel(
            "Doctrines",
            `<div class="choice-list">${Object.entries(H.doctrines)
              .map(
                ([id, d]) =>
                  `<button data-action="doctrine" data-id="${id}" ${id !== "balanced" && !h.upgrades.doctrine ? "disabled" : ""} class="${h.doctrine === id ? "selected" : ""}"><strong>${d.name}</strong><span>${d.text}</span></button>`,
              )
              .join("")}</div>`,
          )}</aside></div>`
        : ui.arenaTab === "replays"
          ? replays()
          : `<div class="room-grid arena-grid"><div>${m ? panel("Live bout · " + recordTitle(m), battle(m)) : h.champions === 5 ? panel("The Crown has been earned", `<p>The five-league ladder is complete. Enter the Crucible above for new challenges and permanent research seals, or prepare the next generation in Legacy.</p>${button("Review the inheritance", "room", { room: "legacy" }, false, "quiet")}`) : panel(champion ? "The promotion challenge" : H.leagues[league].name, `<div class="qualification"><div><p class="eyebrow">${champion ? "THREE RUNGS CLEARED" : "QUALIFICATION RUNG " + (rung + 1) + " / 3"}</p><h2>${champion ? H.leagues[league].champion : Math.min(5, q.wins) + " / 5 scoring victories"}</h2></div><div class="rung-dots">${[0, 1, 2].map((i) => `<b class="${i < h.rung || h.champions > league ? "complete" : ""}">${i + 1}</b>`).join("")}</div></div>${!champion ? `${progress(q.wins, 5, "Rung victories")}<p>Win five matches and beat all three styles. Each match counts once, regardless of party size.</p><div class="rival-cards">${H.rivals.map((r) => `<button data-action="rival" data-id="${r.id}" class="${ui.rival === r.id ? "selected" : ""}"><span style="color:${r.color}">${q.styles.includes(r.id) ? "✓" : "◇"}</span><strong>${r.name}</strong><small>${r.title}</small></button>`).join("")}</div>` : `<p>Defeat the champion to unlock ${H.leagues[league].licence}. Champion fights are always launched by you.</p>`}<div class="rival-intel"><p class="eyebrow">AUTHORED NPC HOUSE · ${champion ? "CHAMPIONSHIP" : rival.title.toUpperCase()}</p><h3>${champion ? H.leagues[league].champion : rival.name}</h3><p>${rival.tactic}</p><div class="enemy-stats">${preview.enemies.map((e) => `<div><span>${e.line === "front" ? "FRONT" : "BACK"}</span><b>${Math.round(e.health)} HP</b><small>${e.attack.toFixed(1)} ${e.damageType} damage · ${e.armor.toFixed(1)} armour</small></div>`).join("")}</div><p class="counter-hint">${rival.hint}</p>${button("Pin a crafting response", "pin", { id: rival.id }, false, "quiet")}</div><div class="launch-row">${button(champion ? "Gather & launch champion" : "Enter the arena", "challenge", { kind, rival: ui.rival, league, rung }, !preview.eligible, "primary large")}<span>${preview.purse}g victory purse<br><small>${preview.reason}</small></span></div>`)}${!m && h.matches[0]?.paid ? panel("Last bout", `<div class="section-line"><h3>${recordTitle(h.matches[0])}</h3>${tag(h.matches[0].result.victory ? "VICTORY" : "DEFEAT")}</div><p>${esc(h.matches[0].result.insight)}</p>${replayAdvice()}${button("Watch replay", "replay", { id: h.matches[0].id })}`) : ""}</div><aside>${panel("Your selected team", teamFormation())}${panel("Exhibitions", exhibitions())}</aside></div>`
    }`;
  }
  function replayAdvice() {
    const h = game.state.house,
      m = h.matches.find((m) => m.paid && !m.result.victory);
    if (!m?.result.firstFall?.home) return "";
    const u = game.state.adventurers.find(
      (u) => u.name === m.result.firstFall.name,
    );
    if (!u || ["vanguard", "guardian"].includes(u.archetypeId)) return "";
    const fronts = h.team.filter((id) => {
      const hero = game.state.adventurers.find((u) => u.id === id);
      return (h.lines[id] || D.archetypes[hero.archetypeId].line) === "front";
    });
    if (!fronts.includes(u.id) || fronts.length < 2) return "";
    return `<p class="counter-hint">${esc(u.name)} fell first while a sturdier fighter was also in front. Try protecting ${esc(u.name)} behind that fighter, then review the next replay.</p>${button("Move " + esc(u.name) + " to the back", "replay-response", { id: u.id }, !!game.activeMatch(), "quiet")}`;
  }
  function teamFormation() {
    const s = game.state,
      h = s.house;
    return `<div class="formation-list">${s.adventurers
      .map((u) => {
        const selected = h.team.includes(u.id),
          line = h.lines[u.id] || D.archetypes[u.archetypeId].line,
          rest = Math.max(0, (h.recovery[u.id] || 0) - s.simTime);
        return `<article><div class="section-line"><div><h3>${esc(u.name)}</h3><small>${D.archetypes[u.archetypeId].name} · ${rest ? time(rest / 1000) + " recovery" : "ready"}</small></div>${button(selected ? "Selected" : "Select", "team", { id: u.id }, !!game.activeMatch(), selected ? "selected" : "")}</div>${selected ? `<div class="line-selector">${["front", "back"].map((l) => button(pretty(l), "line", { id: u.id, line: l }, !!game.activeMatch(), line === l ? "selected" : "")).join("")}</div>` : ""}</article>`;
      })
      .join(
        "",
      )}</div><small>${h.team.length} / 3 selected. At least one fighter must protect the front.</small>`;
  }
  function fighterArt(role = "vanguard") {
    return `<img src="${asset("fighter-" + role)}" alt="" width="80" height="100" decoding="async">`;
  }
  function battle(m, replay = false) {
    const frame = game.battleFrame(m.id, replay ? ui.replayAt : undefined);
    return `<div class="battle-scene" style="--arena-art:url('${asset("arena-0")}')"><div class="battle-score"><span>YOUR HOUSE</span><b>${time(frame.time / 1000)} / ${time(frame.duration / 1000)}</b><span>${recordTitle(m)}</span></div><div class="battle-lines">${[
      [frame.heroes, "home"],
      [frame.enemies, "away"],
    ]
      .map(
        ([units, side]) =>
          `<div class="combat-side ${side}">${["front", "back"]
            .map(
              (line) =>
                `<div class="combat-line"><span>${line.toUpperCase()}</span>${
                  units
                    .filter((u) => u.line === line)
                    .map(
                      (u) =>
                        `<div class="combatant ${u.hp === 0 ? "fallen" : ""} ${frame.actorId === u.id ? "striking" : ""}"><span class="fighter-token">${fighterArt(side === "home" ? m.snapshot.heroes.find((h) => h.id === u.id)?.archetypeId : u.line === "front" ? (m.rival === "thread" ? "duelist" : "guardian") : m.rival === "lantern" ? "mage" : "ranger")}</span><strong>${esc(u.name.split(" · ")[0])}</strong>${progress(u.hp, u.maxHp, u.name + " health", side)}<small>${Math.ceil(u.hp)} / ${Math.ceil(u.maxHp)}</small></div>`,
                    )
                    .join("") || "<small>—</small>"
                }</div>`,
            )
            .join("")}</div>`,
      )
      .join(
        "",
      )}</div><div class="combat-caption">${esc(frame.text)}</div></div>${progress(frame.time, frame.duration, "Bout progress")}<p class="battle-explainer">Front-line fighters protect the rear. Your forge and mine continue during every bout.</p>${replay ? `<div class="replay-controls">${button(ui.replayPlaying ? "Pause" : "Play", "replay-play")}<input aria-label="Replay timeline" data-replay-time type="range" min="0" max="${m.result.duration}" value="${ui.replayAt}">${button("Next strike", "replay-step")}<select aria-label="Replay speed" data-ui="replaySpeed">${[1, 2, 4].map((v) => `<option value="${v}" ${ui.replaySpeed === v ? "selected" : ""}>${v}×</option>`).join("")}</select></div><p>${esc(m.result.insight)}</p><small>Equipment and stats were recorded when this bout began. Rewatching grants no rewards.</small>` : ""}`;
  }
  function replays() {
    const matches = game.state.house.matches.filter((m) => m.paid),
      m = matches.find((m) => m.id === ui.replay) || matches[0];
    if (!m)
      return panel(
        "The replay archive",
        empty(
          "Completed bouts appear here. The last twelve are stored with their original equipment and event log.",
        ),
      );
    if (ui.replay !== m.id) {
      ui.replay = m.id;
      ui.replayAt = 0;
      ui.replayPlaying = false;
    }
    return `<div class="room-grid"><div>${panel(recordTitle(m), battle(m, true), tag(m.result.victory ? "VICTORY" : "DEFEAT"))}</div><aside>${panel("Recorded bouts", matches.map((x) => `<button class="replay-entry ${m.id === x.id ? "selected" : ""}" data-action="replay" data-id="${x.id}"><strong>${recordTitle(x)}</strong><span>${x.result.victory ? "Victory" : "Defeat"} · ${H.leagues[x.league].name}</span><small>${x.kind} · ${time(x.result.duration / 1000)}</small></button>`).join(""))}</aside></div>`;
  }
  function employeeBonuses(id) {
    const labels = {
      miningSpeed: "mining speed",
      smeltSpeed: "smelt speed",
      smeltQuality: "metal quality",
      speed: "craft speed",
      quality: "quality",
      enchant: "enchantment strength",
      binCapacity: "bin space",
      materialDiscount: "supply discount",
      arrival: "customer cadence",
      budget: "contract basis (one quarter applies)",
      sale: "sale value",
      contractPay: "contract value",
    };
    return game
      .employeeBenefits(id)
      .map(
        ({ key, value }) =>
          "+" +
          (["smeltQuality", "quality", "binCapacity"].includes(key)
            ? value.toFixed(1)
            : Math.round(value * 100) + "%") +
          " " +
          (labels[key] || key),
      )
      .join(" · ");
  }
  function employees() {
    const s = game.state,
      n = game.employeeSummary(),
      depts = ["mine", "smelter", "forge", "shop"];
    return (
      metrics([
        ["Specialists", n.hired + " / " + n.total],
        ["On duty", n.active],
        ["Resting", n.resting],
        ["Work XP", "×" + n.xp.toFixed(2)],
      ]) +
      `<div class="tabs department-tabs">${depts.map((id) => button(marks[id] + " " + pretty(id), "department-tab", { id }, false, ui.department === id ? "selected" : "")).join("")}</div><div class="room-grid"><div><div class="staff-cards">${Object.values(
        D.staff,
      )
        .filter((d) => d.department === ui.department)
        .map((d) => {
          const st = s.staff[d.id],
            cost = game.staffPrice(d.id),
            gates = game._gates(d.requires).filter((g) => !g.met);
          return panel(
            d.person,
            `<p class="eyebrow">${d.name}</p><p>${d.description}</p><div class="staff-contribution"><small>${st ? "CONTRIBUTING NOW" : "AT FULL STAMINA"}</small><strong>${employeeBonuses(d.id)}</strong></div>${st ? `<div class="progress-label"><span>Experience · level ${st.level}</span><b>${Math.floor(st.xp)} / ${st.level * 30}</b></div>${progress(st.xp, st.level * 30, d.person + " experience")}<div class="progress-label"><span>Stamina</span><b>${Math.round(st.stamina)} / 100</b></div>${progress(st.stamina, 100, d.person + " stamina", "stamina")}<p>${st.active ? Math.round(game.staffEfficiency(d.id) * 100) + "% effectiveness" : st.autoRest ? "Scheduled break · resumes at 90" : "Manual time off"}</p>${button(st.active ? "Give time off" : "Resume duty", "staff-toggle", { id: d.id }, false, "primary")}` : `${button("Hire " + d.person + " · " + cost + "g", "staff-hire", { id: d.id }, s.player.gold < cost || gates.length > 0, "primary")}<small>${gates.length ? gates.map((g) => g.label + " " + g.required).join(" · ") : "One signing fee. No recurring wages."}</small>`}`,
            tag(st ? "Level " + st.level : "Specialist"),
          );
        })
        .join(
          "",
        )}</div>${ui.department === "mine" ? panel("Regular mining crews", `<p>${s.world.miners.length} miners keep extracting while specialists rest. Assign their veins in the Mine.</p>${button("Open crew assignments", "room", { room: "mine" })}${button("Hire miner · " + game.hireCost() + "g", "hire-miner", {}, s.player.gold < game.hireCost() || s.world.miners.length >= game.derived().workerCapacity)}`) : ""}</div><aside>${panel("The shift desk", `<h3>${n.active} specialists on duty</h3><p>Duty drains ${n.drain.toFixed(2)} stamina per minute. Time off restores ${n.recovery.toFixed(1)}.</p><ul><li>70–100: full effectiveness</li><li>35–69: 75% effectiveness</li><li>1–34: 40% effectiveness</li><li>0: no active bonus</li></ul>${game._effects().staffShifts ? button(s.workshop.staffShifts ? "Pause managed breaks" : "Enable managed breaks", "shifts", {}, false, "primary") : `${button("Develop managed shifts", "upgrades", { room: "employees" })}`}<p>Managed breaks begin at 35 and end at 90. Manual leave stays manual.</p>`)}${panel("Grow a capable workforce", `<p>Training improves work-earned XP and specialist bonuses. Welfare improves recovery and endurance. Organization develops recruitment and managed shifts.</p>${button("Employees upgrades ↗", "upgrades", { room: "employees" }, false, "primary")}`)}</aside></div>`
    );
  }
  function talentText(t) {
    return (
      {
        guild_purse: "Newly issued contracts pay 5% more.",
        field_notes: "House fighters earn 20% more experience from victories.",
        hidden_veins: "Champion material rewards increase 25%, rounded up.",
        shared_purpose:
          "A team of three different classes deals 20% more damage.",
        busy_counter: "Town visitors arrive 20% faster.",
      }[t.id] || t.description
    );
  }
  function legacy() {
    const s = game.state,
      h = s.house,
      d = game.derived();
    ui.legacyBranch ||= "Workforce";
    return `<div class="legacy-intro"><p class="eyebrow">WHAT THE FIRE LEAVES BEHIND</p><h2>A house outlives<br><em>its first maker.</em></h2><p>Your furnishings, research, discoveries, seals and chronicle endure. Choose an inheritance and an optional oath for a different career.</p></div><div class="room-grid"><div>${oathsPanel()}${panel(
      "Choose the next house charter",
      `<div class="choice-list">${[
        [
          "workforce",
          "Established workshop",
          "Begin the next generation with one additional miner.",
        ],
        [
          "patron",
          "Patron endowment",
          "Begin with 60 extra gold to invest in your opening.",
        ],
        [
          "archive",
          "House method",
          "Begin with Guild patterns and mastery level 4 in every class.",
        ],
      ]
        .map(
          ([id, n, text]) =>
            `<button data-action="charter" data-id="${id}" class="${h.charter === id ? "selected" : ""}"><strong>${n}</strong><span>${text}</span></button>`,
        )
        .join("")}</div>`,
    )}${panel(
      "Permanent talents",
      `<p>${s.player.legacy.points} sparks available. A completed fifth championship is required to earn more.</p><div class="tabs">${["Workforce", "Efficiency", "Metallurgy", "Archives"].map((branch) => button(branch, "legacy-branch", { id: branch }, false, ui.legacyBranch === branch ? "selected" : "")).join("")}</div><div class="talent-list">${Object.values(
        D.talents,
      )
        .filter((t) => t.branch === ui.legacyBranch)
        .map((t) => {
          const v = game.talentPreview(t.id);
          return `<article class="compact-card"><div class="section-line"><h3>${t.name}</h3>${tag(s.player.talents.includes(t.id) ? "Owned" : t.cost + " sparks")}</div><p>${talentText(t)}</p>${button("Inherit", "talent", { id: t.id }, !v.eligible)}<small>${
            t.requires
              .filter((id) => !s.player.talents.includes(id))
              .map((id) => "Requires " + D.talents[id].name)
              .join(" · ") || v.reason
          }</small></article>`;
        })
        .join("")}</div>`,
    )}</div><aside>${panel(
      "Retire deliberately",
      metrics([
        ["Generation", s.player.legacy.generation],
        ["Champions", h.champions + " / 5"],
        ["Reward", d.legacyReward + " sparks"],
      ]) +
        `<p>Retirement resets current gold, materials, attributes, mastery, employees, room upgrades and the ladder. Furnishings, talents, discoveries, completed research, seals and oath records survive. Later careers shorten guild accreditation to a minimum of 12 hours.</p>${button("Review retirement", "retire-preview", {}, !d.legacyEligible, "primary")}`,
    )}${panel("The hall of names", h.history.map((x) => `<p>Generation ${x.generation} · ${esc(x.text)}</p>`).join("") || empty("Your house’s history will be recorded here."))}</aside></div>`;
  }
  const renderers = {
    smith,
    mine,
    smelter,
    forge,
    shop,
    arena,
    employees,
    legacy,
  };
  function shell() {
    return `<div class="house-shell" style="--scene:url('${asset(stage(ui.room))}')">${header()}<main id="main-content" class="room room-${ui.room}">${toolbar()}${storageMessage ? `<p role="alert" class="warning">${storageMessage}</p>` : ""}${ui.readonly ? '<p role="alert" class="warning">This house is active in another tab. This window is read-only until that tab closes.</p>' : ""}${overview()}${goal()}${ui.room === "legacy" ? "" : campaignPanel()}${renderers[ui.room]()}${ui.room === "legacy" ? campaignPanel() : ""}<footer class="room-footer"><span>${esc(game.state.shopName)} · generation ${game.state.player.legacy.generation}</span><span>Craftsmanship made visible.</span></footer></main>${game.activeMatch() && ui.room !== "arena" ? `<button class="live-bout" data-action="room" data-room="arena"><span class="pulse"></span>ARENA LIVE · ${recordTitle(game.activeMatch())}<b>Watch ↗</b></button>` : ""}</div>`;
  }
  function upgradeRows(room) {
    if (room === "employees")
      return Object.values(P.nodes)
        .filter((n) => n.section === "employees")
        .map((n) => ({
          ...n,
          text: n.description,
          rank: game.state.world.trees[n.id] || 0,
          max: n.maxRank,
          preview: game.treePreview(n.id),
          action: "tree",
        }));
    if (room === "smelter")
      return Object.entries(W.upgrades).map(([id, n]) => ({
        ...n,
        id,
        text: n.description,
        max: n.maxRank,
        preview: game.smeltUpgradePreview(id),
        action: "smelt-upgrade",
      }));
    return Object.values(H.upgrades)
      .filter((n) => n.room === room)
      .map((n) => ({
        ...n,
        preview: game.upgradePreview(n.id),
        action: "house-upgrade",
      }));
  }
  function upgrades() {
    const room = ui.upgradeRoom || ui.room,
      rows = upgradeRows(room),
      branches = [...new Set(rows.map((n) => n.branch))];
    if (room === "smelter")
      branches.sort(
        (a, b) =>
          ["Alloys", "Quality", "Speed"].indexOf(a) -
          ["Alloys", "Quality", "Speed"].indexOf(b),
      );
    if (room === "employees")
      branches.sort(
        (a, b) =>
          ["Training", "Welfare", "Organization"].indexOf(a) -
          ["Training", "Welfare", "Organization"].indexOf(b),
      );
    if (!branches.includes(ui.branch)) ui.branch = branches[0];
    const depth = room === "mine" && ui.branch === "Depth";
    return `<p class="eyebrow">DEVELOP YOUR HOUSE</p><div class="section-line"><h2>${roomNames[room]} upgrades</h2><span class="upgrade-wallet">${num(game.state.player.gold)}<small> GOLD</small></span></div><div class="room-pills">${["mine", "smelter", "forge", "shop", "arena", "employees"].map((r) => button(roomNames[r], "upgrade-room", { room: r }, false, room === r ? "selected" : "")).join("")}</div><div class="tabs">${branches.map((b) => button(b, "branch", { id: b }, false, b === ui.branch ? "selected" : "")).join("")}</div><p>Ranks grow exponentially in cost. Achievements prove access; gold pays for the investment.</p>${depth ? `<div class="upgrade-path-note"><strong>Main path · Open deeper workings</strong><p>Iron is the first new ore. Defeat the Cinder Yard champion, mine 100 total materials, then buy the 65g Iron licence. Optional exploration below improves existing workings and does not advance this path.</p>${button("View champion requirements", "room", { room: "arena" }, false, "quiet")}</div>` : ""}<div class="upgrade-tree">${rows
      .filter((n) => n.branch === ui.branch)
      .map((n) => {
        const v = n.preview;
        const blockers = [
          ...(v.gates || [])
            .filter((g) => typeof g === "string" || !g.met)
            .map((g) =>
              typeof g === "string" ? g : g.label || "Requirement not met",
            ),
          ...(game.state.player.gold < v.cost
            ? ["Need " + num(v.cost - game.state.player.gold) + " more gold"]
            : []),
        ];
        return `${depth && n.id === "survey" ? `<div class="upgrade-side-path"><h3>Optional exploration</h3><p>Available independently of ore licences.</p></div>` : ""}<article class="upgrade-node ${v.eligible ? "affordable" : ""} ${v.rank > 0 ? "owned" : ""}"><div class="node-track">${v.rank >= n.max ? "✓" : "◇"}</div><div><div class="section-line"><h3>${n.name}</h3>${tag((v.rank || 0) + " / " + n.max)}</div><p>${n.text}</p><div class="rank-pips">${Array.from({ length: n.max }, (_, i) => `<i class="${i < v.rank ? "filled" : ""}"></i>`).join("")}</div>${v.rank < n.max && blockers.length ? `<ul class="upgrade-blockers">${blockers.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>` : `<small>${esc(v.reason)}</small>`}</div>${button(v.rank >= n.max ? "Developed" : num(v.cost) + "g", n.action, { id: n.id }, !v.eligible, "primary")}</article>`;
      })
      .join("")}</div>`;
  }
  function menu() {
    return `<p class="eyebrow">YOUR HOUSE, YOUR SAVE</p><h2>House menu</h2><p>Saved locally in this browser. Export a file before moving devices.</p><div class="menu-actions">${button("Options · appearance & sound", "options", {}, false, "primary")}${button("Export arena house", "export", {}, !game.state.started)}${button("Import arena house", "import")}${button("Return to title", "title")}${button("Reset this run…", "reset-preview", {}, !game.state.started, "danger")}</div><hr><h3>Classic workshop</h3><p>The original save is kept separately. Carrying it over preserves equipment, materials, employees and purchased capabilities; local arena qualification starts at the yard.</p>${button("Review Classic carry-over", "convert", {}, !get(CLASSIC))}<p><a href="classic.html" target="_blank" rel="noopener">Open the preserved Classic game ↗</a></p><hr><p class="footnote">House edition 3.2 · 24-hour offline limit · Original Blender artwork & music · No networked ranking</p>`;
  }
  function options() {
    const slider = (key, label, hint, max = 100) =>
      `<label class="option-slider"><span>${label}<output data-option-output="${key}">${preferences[key]}%</output></span><input type="range" min="0" max="${max}" step="1" value="${preferences[key]}" data-setting="${key}" aria-label="${label}"><small>${hint}</small></label>`;
    const theme = EIHouseAudio.themes[ui.screen === "game" ? ui.room : "smith"];
    return `<p class="eyebrow">MAKE YOURSELF AT HOME</p><h2>Options</h2><p>Changes appear immediately and are remembered on this device.</p><section class="option-section"><h3>Appearance</h3>${slider("transparency", "Overlay transparency", "Higher lets more of the room show through. Text stays solid.", 85)}<div class="option-presets">${button("Readable", "transparency-preset", { value: 15 })}${button("Balanced", "transparency-preset", { value: 40 })}${button("Scenic", "transparency-preset", { value: 65 })}</div>${slider("backgroundShade", "Background dimming", "Darken the scenery to make information easier to read.", 70)}</section><section class="option-section"><div class="section-line"><h3>Sound</h3><label class="mute-option"><input type="checkbox" data-setting="muted" ${preferences.muted ? "checked" : ""}> Mute all</label></div>${slider("master", "Master volume", "Overall volume.")}${slider("music", "Music volume", "Original instrumental themes for each room.")}${slider("effects", "Sound effects volume", "Room ambience and sounds from your actions.")}<div class="now-playing"><span class="eyebrow">THIS ROOM’S THEME</span><strong>${esc(theme.title)}</strong><small>Music fades between rooms and pauses when the game is hidden.</small>${button("Play room theme", "preview-sound", {}, false, "quiet")}</div></section><div class="actions">${button("Restore default options", "default-options", {}, false, "quiet")}${button("Done", "close", {}, false, "primary")}</div>`;
  }
  function dialog() {
    let body = "";
    if (ui.modal === "upgrades") body = upgrades();
    else if (ui.modal === "menu") body = menu();
    else if (ui.modal === "options") body = options();
    else if (ui.modal === "offline") body = returnSummary();
    else if (ui.modal === "convert") {
      let summary = "";
      const raw = get(CLASSIC),
        v = raw && EIWorkshopEngine.validateSave(raw, D);
      if (v?.ok)
        summary = `<p><b>${esc(v.state.shopName)}</b> · level ${v.state.player.level} · ${v.state.inventory.length} stored items · ${Object.keys(v.state.staff).length} specialists.</p>`;
      body = `<p class="eyebrow">CLASSIC → ARENA HOUSE</p><h2>Carry your workshop forward.</h2>${summary}<p>The original Classic save remains untouched. Equipment, materials, mastery, staff, furnishings, talents and paid room capabilities carry over. Paid patterns stay unlocked. Pending expeditions settle once using their Classic outcome and are archived; arena qualification starts at league one.</p><p>${game.state.started ? "This replaces the current Arena house slot. Export it first if you want to keep it." : "The new Arena house uses a separate save slot."}</p><div class="actions">${button("Export current house", "export", {}, !game.state.started)}${button("Carry over workshop", "confirm-convert", {}, !v?.ok, "primary")}</div>`;
    } else if (ui.modal === "reset") {
      body = `<p class="eyebrow">RESET CURRENT GENERATION</p><h2>Run progress will be lost.</h2><p>This removes current gold, materials, equipment, attributes, employees, room upgrades and league progress. Earned Legacy talents, sparks, furnishings and the chronicle remain. No new sparks are awarded. Your Classic save is unaffected.</p><label>Type RESET to confirm<input name="reset-confirm" autocomplete="off"></label>${button("Reset this run", "confirm-reset", {}, false, "danger")}`;
    } else if (ui.modal === "discoveries") {
      body = `<p class="eyebrow">NOTES FROM THE WORKSHOP</p><h2>Things the house has learned.</h2>${game
        .discoverySummary()
        .map(
          (d) =>
            `<article class="compact-card"><p class="eyebrow">${roomNames[d.room]}</p><h3>${d.name}</h3><p>${d.text}</p>${button("Visit " + roomNames[d.room], "room", { room: d.room }, d.room === "legacy" && !game.campaignStatus().legacyVisible, "quiet")}</article>`,
        )
        .join(
          "",
        )}${button("Mark findings read", "read-findings", {}, false, "primary")}`;
    } else if (ui.modal === "retire") {
      body = `<p class="eyebrow">END A CHAMPIONSHIP CAREER</p><h2>Pass on the hammer.</h2><p>Receive ${game.derived().legacyReward} sparks. The current run resets; permanent talents, furnishings and the chronicle persist.</p><p class="discovery-note">${game.state.house.campaign.seals} Crucible seals will carry over. One first-time Crucible victory earns the seal needed for the Oathbound folio in generation two. Its 6-hour study also needs 6,500g and mithril. ${game.state.house.campaign.seals ? "You have a seal reserve for inherited studies." : "Retiring now is valid; you can earn seals after the next Crown instead."}</p><div class="actions">${button("Visit the Crucible first", "room", { room: "arena" }, false, "quiet")}</div><label>One heirloom from storage<select name="heirloom"><option value="">No heirloom</option>${game.state.inventory.map((i) => `<option value="${i.id}">${esc(itemName(i))}</option>`).join("")}</select></label><p>Unequip a team item before retiring if you want to choose it here.</p>${button("Retire & begin a new generation", "confirm-retire", {}, false, "primary")}`;
    }
    return ui.modal
      ? `<div class="modal-backdrop ${ui.modal === "options" ? "options-backdrop" : ""}"><section class="dialog ${ui.modal === "options" ? "options-dialog" : ""}" role="dialog" aria-modal="true" aria-label="${ui.modal === "upgrades" ? "Room upgrades" : ui.modal === "options" ? "Options" : ui.modal === "offline" ? "Offline progress" : "House menu"}"><button class="modal-close" data-action="close" aria-label="Close dialog">×</button>${body}</section></div>`
      : "";
  }
  function render(force = false) {
    if (ui.catchingUp) {
      $("#app").innerHTML =
        `<main class="catchup-screen" role="status" aria-live="polite"><p class="eyebrow">THE HOUSE KEPT WORKING</p><h1>Opening the workshop ledger.</h1><p>Reconciling production, trade and your authorised matches.</p>${progress(ui.catchupProgress, 1, "Offline progress")}<strong>${Math.round(ui.catchupProgress * 100)}%</strong><small>Credited progress is saved as it is calculated.</small></main>`;
      $("#modal-root").innerHTML = "";
      return;
    }
    if (
      game.state.pendingOfflineReport &&
      ui.screen === "game" &&
      !ui.readonly &&
      ui.modal !== "offline"
    ) {
      ui.returnToModal = ui.modal;
      ui.modal = "offline";
    }
    const focused = document.activeElement,
      editing =
        focused && ["INPUT", "SELECT", "TEXTAREA"].includes(focused.tagName);
    if (!force && (editing || document.hidden || inputActivity.busy())) return;
    const scroll = window.scrollY,
      hadDialog = !!$(".dialog"),
      modalScroll = $(".dialog")?.scrollTop || 0,
      focusAction = focused?.dataset.action,
      focusKey = JSON.stringify(focused?.dataset || {});
    $("#app").innerHTML =
      ui.screen === "splash"
        ? splash()
        : ui.screen === "creation"
          ? creation()
          : shell();
    $("#modal-root").innerHTML = dialog();
    if (ui.modal) {
      $(".dialog").scrollTop = modalScroll;
      if (force && !hadDialog)
        $(".modal-close")?.focus({ preventScroll: true });
    }
    if (focusAction && !(ui.modal && !hadDialog)) {
      const matches = [...document.querySelectorAll("[data-action]")];
      matches
        .find((b) => JSON.stringify(b.dataset) === focusKey)
        ?.focus({ preventScroll: true });
    }
    window.scrollTo(0, scroll);
    lastRender = Date.now();
    revision++;
  }
  function closeDialog() {
    if (ui.modal === "offline") {
      const target = game;
      lease();
      if (!ui.readonly && game === target) {
        game.state.pendingOfflineReport = null;
        checkpoint();
      }
      ui.modal = ui.returnToModal || null;
      ui.returnToModal = null;
    } else ui.modal = null;
  }
  function act(name, payload = {}) {
    lease();
    if (ui.readonly) {
      notify("This house is active in another tab.");
      return { ok: false };
    }
    if (needsCatchup || ui.catchingUp) {
      reconcileOffline(Date.now());
      notify(
        "Restoring the workshop’s progress. Try again when the ledger opens.",
      );
      return { ok: false };
    }
    const r = game.command(name, payload);
    notify(r.message);
    if (r.ok) {
      save(true);
      sound.effect(
        {
          mine: "pick",
          pocket: "pick",
          craft: "hammer",
          technique: "hammer",
          smelt: "pour",
          buyMaterial: "coin",
          sell: "coin",
          sellMaterial: "coin",
          deliverContract: "coin",
          houseUpgrade: "chime",
          smeltUpgrade: "chime",
          research: "chime",
          challenge: "drum",
          ascend: "chime",
          equip: "wood",
        }[name] || "ui",
      );
    }
    render(true);
    return r;
  }
  function navigate(room) {
    if (!H.rooms[room]) return;
    if (room === "legacy" && !game.campaignStatus().legacyVisible) return;
    ui.room = room;
    ui.screen = "game";
    sound.setRoom(room);
    ui.modal = null;
    ui.overview = null;
    ui.replayPlaying = false;
    ui.branch = null;
    document.body.classList.remove("room-change");
    void document.body.offsetWidth;
    document.body.classList.add("room-change");
    clearTimeout(sceneTimer);
    sceneTimer = setTimeout(
      () => document.body.classList.remove("room-change"),
      400,
    );
    render(true);
    window.scrollTo(0, 0);
  }
  function exportHouse() {
    const blob = new Blob([game.exportSave()], { type: "application/json" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "Ember-and-Iron-arena-house.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const handlers = {
    research: (d) => act("research", { id: d.id }),
    ascend: () => act("ascend"),
    "replay-response": (d) => act("formation", { heroId: d.id, line: "back" }),
    lineage: (d) => act("lineage", { id: d.id }),
    burden: (d) => act("burden", { id: d.id }),
    discoveries: () => {
      ui.modal = "discoveries";
    },
    "read-findings": () => {
      act("readDiscoveries");
      ui.modal = null;
    },
    "dismiss-return": closeDialog,
    begin: () => {
      ui.screen = "creation";
      ui.modal = null;
      startSound();
    },
    continue: () => {
      // Continue is an explicit return, even if the browser omitted focus events.
      lease();
      away = false;
      sound.setVisible(!document.hidden);
      reconcileOffline(Date.now());
      navigate(ui.room);
      startSound();
    },
    title: () => {
      leaveWorkshop();
      ui.screen = "splash";
      ui.modal = null;
      ui.replayPlaying = false;
      sound.setRoom("smith");
    },
    menu: () => {
      ui.modal = "menu";
    },
    options: () => {
      ui.modal = "options";
    },
    "preview-sound": () => {
      preferences.muted = false;
      applyPreferences(true);
      startSound();
    },
    "transparency-preset": (d) => {
      preferences.transparency = Number(d.value);
      applyPreferences(true);
    },
    "default-options": () => {
      preferences = { ...EIHouseSettings.defaults };
      applyPreferences(true);
    },
    close: closeDialog,
    room: (d) => navigate(d.room),
    calling: (d) => {
      ui.calling = d.id;
    },
    origin: (d) => {
      ui.origin = d.id;
    },
    vow: (d) => {
      ui.vow = d.id;
    },
    "creation-next": () => {
      ui.creationStep = Math.min(2, ui.creationStep + 1);
      window.scrollTo(0, 0);
    },
    "creation-back": () => {
      ui.creationStep = Math.max(0, ui.creationStep - 1);
    },
    preset: () => {
      ui.stats = Object.fromEntries(
        ["strength", "precision", "charisma", "knowledge"].map((k, i) => [
          k,
          H.professions[ui.calling].stats[i],
        ]),
      );
    },
    stat: (d) => {
      const delta = Number(d.delta),
        left = 20 - Object.values(ui.stats).reduce((a, b) => a + b, 0);
      if ((delta < 0 && ui.stats[d.id] > 0) || (delta > 0 && left > 0))
        ui.stats[d.id] += delta;
    },
    create: () => {
      const r = act("create", {
        smithName: ui.smith,
        name: ui.name,
        stats: ui.stats,
        profession: ui.calling,
        origin: ui.origin,
        vow: ui.vow,
      });
      if (r.ok) {
        ui.room = "smith";
        ui.screen = "game";
        window.scrollTo(0, 0);
      }
    },
    allocate: (d) => act("allocate", { stat: d.id }),
    overview: (d) => {
      ui.overview = d.room;
    },
    "dismiss-overview": (d) => {
      act("seen", { room: d.room });
      ui.overview = null;
    },
    upgrades: (d) => {
      ui.upgradeRoom = d.room;
      ui.modal = "upgrades";
      ui.branch = null;
    },
    "upgrade-room": (d) => {
      ui.upgradeRoom = d.room;
      ui.branch = null;
    },
    branch: (d) => {
      ui.branch = d.id;
    },
    "house-upgrade": (d) => act("houseUpgrade", { id: d.id }),
    tree: (d) => act("tree", { id: d.id }),
    "smelt-upgrade": (d) => act("smeltUpgrade", { id: d.id }),
    mine: (d) => act("mine", { materialId: d.id }),
    buy: (d) =>
      act("buyMaterial", { materialId: d.id, quantity: Number(d.quantity) }),
    "sell-material": (d) =>
      act("sellMaterial", { materialId: d.id, quantity: 5 }),
    "hire-miner": () => act("hireMiner"),
    pocket: (d) => act("pocket", { materialId: d.id }),
    smelt: (d) =>
      act("smelt", { id: d.id, quantity: Number(d.quantity), grade: ui.grade }),
    "cancel-smelt": (d) => act("cancelSmelt", { id: d.id }),
    "smelt-targets": () => {
      const targets = {};
      document
        .querySelectorAll('[name^="target-"]')
        .forEach((i) => (targets[i.name.slice(7)] = Number(i.value)));
      act("smeltPolicy", {
        enabled: true,
        targets,
        reserve: Number($('[name="smelt-reserve"]').value),
      });
    },
    "smelt-pause": () => act("smeltPolicy", { enabled: false }),
    "forge-class": (d) => {
      ui.type = d.id;
      ui.group = classGroup(d.id);
      ui.recipe = null;
      navigate("forge");
    },
    group: (d) => {
      ui.group = d.id;
      ui.recipe = null;
    },
    intent: (d) => {
      ui.intent = d.id;
    },
    pattern: (d) => {
      ui.recipe = d.id;
      ui.enchantment = "";
    },
    craft: (d) => {
      const r = D.recipes[ui.recipe],
        hero =
          game.state.adventurers.find(
            (h) =>
              h.id === ui.hero &&
              D.archetypes[h.archetypeId].preferences.includes(r.classId),
          ) ||
          game.state.adventurers.find((h) =>
            D.archetypes[h.archetypeId].preferences.includes(r.classId),
          );
      act("craft", {
        recipeId: ui.recipe,
        quantity: Number(d.quantity),
        intent: ui.intent,
        heroId: ui.intent === "team" ? hero?.id : null,
        treatment: ui.treatment,
        grade: ui.grade,
        enchantmentId: ui.enchantment || null,
      });
    },
    finish: (d) => act("technique", { jobId: d.id }),
    cancel: (d) => act("cancel", { jobId: d.id }),
    "catalogue-save": () =>
      act("housePolicy", {
        offlineBudget: Number($('[name="catalogue-budget"]').value),
        catalogue: {
          enabled: true,
          recipeId: $('[name="catalogue-recipe"]').value,
          reserve: Number($('[name="catalogue-reserve"]').value),
          autoBuy: $('[name="catalogue-buy"]').checked,
          rotate: $('[name="catalogue-rotate"]').checked,
        },
      }),
    "catalogue-pause": () =>
      act("housePolicy", {
        catalogue: { ...game.state.house.catalogue, enabled: false },
      }),
    "shop-tab": (d) => {
      ui.shopTab = d.id;
    },
    hero: (d) => {
      ui.hero = d.id;
    },
    equip: (d) => act("equip", { heroId: d.hero, itemId: d.id }),
    unequip: (d) => act("unequip", { heroId: d.hero, slot: d.slot }),
    deliver: (d) => act("deliverContract", { id: d.id }),
    "contract-plan": (d) => {
      const o = game.state.house.orders.find((o) => o.id === d.id);
      if (!o) return;
      const r = D.recipes[o.recipeId];
      ui.type = r.classId;
      ui.group = classGroup(r.classId);
      ui.material = r.materialId;
      ui.recipe = r.id;
      ui.intent = "catalogue";
      ui.treatment = "plain";
      ui.grade = "standard";
      ui.enchantment = "";
      navigate("forge");
    },
    "auto-deliver": () =>
      act("housePolicy", { autoDeliver: !game.state.house.autoDeliver }),
    protection: (d) => {
      if (ui.readonly) return;
      const i = game._item(d.id);
      if (!i) return;
      if (i.reservedFor)
        game.command("reserve", { itemId: d.id, heroId: null });
      act("protect", { itemId: d.id });
    },
    "sell-item": (d) => act("sell", { itemId: d.id }),
    scrap: (d) => act("salvage", { itemId: d.id }),
    "arena-tab": (d) => {
      ui.arenaTab = d.id;
      ui.replayPlaying = false;
    },
    rival: (d) => {
      ui.rival = d.id;
    },
    team: (d) => act("team", { heroId: d.id }),
    line: (d) => act("formation", { heroId: d.id, line: d.line }),
    doctrine: (d) => act("formation", { doctrine: d.id }),
    pin: (d) => act("pinResponse", { rival: d.id || null }),
    challenge: (d) =>
      act("challenge", {
        rival: d.rival,
        kind: d.kind,
        league: Number(d.league),
        rung: Number(d.rung),
      }),
    exhibit: (d) =>
      act("challenge", {
        rival: d.rival,
        kind: "exhibition",
        league: Number(d.league),
        rung: Number(d.rung),
      }),
    repeat: (d) =>
      act("housePolicy", {
        exhibition: {
          rival: d.rival,
          league: Number(d.league),
          rung: Number(d.rung),
        },
      }),
    "stop-exhibitions": () => act("housePolicy", { exhibition: null }),
    replay: (d) => {
      ui.replay = d.id;
      ui.replayAt = 0;
      ui.replayPlaying = false;
      ui.arenaTab = "replays";
    },
    "replay-play": () => {
      const m = game.state.house.matches.find((m) => m.id === ui.replay);
      if (ui.replayAt >= m.result.duration) ui.replayAt = 0;
      ui.replayPlaying = !ui.replayPlaying;
    },
    "replay-step": () => {
      const m = game.state.house.matches.find((m) => m.id === ui.replay);
      ui.replayPlaying = false;
      ui.replayAt =
        m.result.events.find((e) => e.at > ui.replayAt)?.at ||
        m.result.duration;
    },
    department: (d) => {
      ui.department = d.id;
      navigate("employees");
    },
    "department-tab": (d) => {
      ui.department = d.id;
    },
    "staff-hire": (d) => act("hireStaff", { staffId: d.id }),
    "staff-toggle": (d) => act("toggleStaff", { staffId: d.id }),
    shifts: () =>
      act("workshopPolicy", {
        key: "staffShifts",
        value: !game.state.workshop.staffShifts,
      }),
    decorate: (d) => act("decorate", { decorId: d.id }),
    "legacy-branch": (d) => {
      ui.legacyBranch = d.id;
    },
    charter: (d) => act("charter", { id: d.id }),
    talent: (d) => act("talent", { talentId: d.id }),
    "retire-preview": () => {
      ui.modal = "retire";
    },
    "confirm-retire": () => {
      const r = act("retire", {
        confirmed: true,
        heirloomItemId: $('[name="heirloom"]').value || null,
      });
      if (r.ok) {
        ui.modal = null;
        ui.screen = "creation";
        ui.creationStep = 0;
        ui.stats = { strength: 0, precision: 0, charisma: 0, knowledge: 0 };
      }
    },
    export: exportHouse,
    import: () => $("#import-file").click(),
    convert: () => {
      ui.modal = "convert";
    },
    "confirm-convert": () => {
      if (ui.readonly) return;
      const v = EIHouseEngine.convertClassic(get(CLASSIC), D);
      if (!v.ok) {
        notify(v.message);
        return;
      }
      const candidate = new EIHouseEngine(D, v.data);
      if (!EIHouseEngine.validateSave(candidate.exportSave(), D).ok) {
        notify("Conversion could not be validated. Classic was not changed.");
        return;
      }
      game = candidate;
      save(true);
      ui.modal = null;
      ui.screen = "game";
      navigate("smith");
      notify(v.message);
    },
    "reset-preview": () => {
      ui.modal = "reset";
    },
    "confirm-reset": () => {
      if ($('[name="reset-confirm"]').value !== "RESET") {
        notify("Type RESET to confirm.");
        return;
      }
      if (ui.readonly) return;
      const old = game.state,
        next = new EIHouseEngine(D);
      next.state.player.legacy = JSON.parse(JSON.stringify(old.player.legacy));
      next.state.player.legacy.heirlooms = [];
      next.state.player.legacy.unlockedRecipes = [];
      next.state.player.talents = [...old.player.talents];
      next.state.decorations = [...old.decorations];
      next.state.decorationLevels = { ...old.decorationLevels };
      next.state.house.history = [...old.house.history];
      next.state.house.seen = [...old.house.seen];
      next.state.house.charter = old.house.charter;
      for (const key of [
        "discoveries",
        "projects",
        "seals",
        "totalSeals",
        "bestTrial",
        "oaths",
        "lineage",
        "burden",
        "nextBurden",
      ])
        next.state.house.campaign[key] = JSON.parse(
          JSON.stringify(old.house.campaign[key]),
        );
      game = next;
      needsCatchup = false;
      game.markSaved(Date.now());
      checkpoint();
      put(BACKUP, game.exportSave());
      ui.modal = null;
      ui.screen = "creation";
      ui.creationStep = 0;
      ui.stats = { strength: 0, precision: 0, charisma: 0, knowledge: 0 };
      notify("Run reset. Permanent inheritance was kept.");
    },
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b || b.disabled) return;
    const handler = handlers[b.dataset.action];
    if (!handler) return;
    handler(b.dataset);
    render(true);
  });
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (Object.hasOwn(EIHouseSettings.defaults, el.dataset.setting)) {
      const key = el.dataset.setting;
      preferences[key] = el.type === "checkbox" ? el.checked : Number(el.value);
      applyPreferences(true);
      const output = document.querySelector(`[data-option-output="${key}"]`);
      if (output) output.textContent = preferences[key] + "%";
      if (["master", "music", "effects", "muted"].includes(key)) startSound();
      return;
    }
    if (el.dataset.create) ui[el.dataset.create] = el.value;
    if (el.hasAttribute("data-replay-time")) {
      ui.replayAt = Number(el.value);
      ui.replayPlaying = false;
    }
  });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset.ui) {
      ui[el.dataset.ui] =
        el.dataset.ui === "replaySpeed" ? Number(el.value) : el.value;
      if (["type", "material"].includes(el.dataset.ui)) ui.recipe = null;
      render(true);
    }
    if (el.dataset.worker)
      act("assignWorker", { id: el.dataset.worker, materialId: el.value });
    if (el.hasAttribute("data-replay-time")) render(true);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && ui.modal) {
      closeDialog();
      render(true);
    }
    if (e.key === "Tab" && ui.modal) {
      const targets = [
          ...$(".dialog").querySelectorAll(
            "button:not(:disabled),input,select,a[href]",
          ),
        ],
        first = targets[0],
        end = targets.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        end.focus();
      } else if (!e.shiftKey && document.activeElement === end) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  $("#import-file").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 12e6) {
      notify("Save files must be below 12 MB.");
      return;
    }
    const raw = await f.text(),
      v = EIHouseEngine.validateSave(raw, D);
    if (!v.ok) {
      notify(v.message);
      return;
    }
    if (ui.readonly) return;
    game = new EIHouseEngine(D, v.state);
    needsCatchup = game.state.started;
    ui.screen = game.state.started ? "game" : "creation";
    ui.modal = null;
    if (needsCatchup) await reconcileOffline(Date.now());
    save(true);
    render(true);
    notify("Arena house imported.");
    e.target.value = "";
  });
  window.addEventListener("pagehide", () => {
    leaveWorkshop();
    sound.stop();
    try {
      const l = JSON.parse(get(LEASE) || "null");
      if (l?.owner === owner) localStorage.removeItem(LEASE);
    } catch (e) {}
  });
  function leaveWorkshop() {
    if (away) return;
    away = true;
    sound.setVisible(false);
    const now = Date.now();
    lease();
    if (
      !ui.readonly &&
      !ui.catchingUp &&
      !needsCatchup &&
      game.state.started &&
      ui.screen === "game"
    ) {
      if (now - last >= 60000) {
        game.markSaved(last);
        needsCatchup = true;
        reconcileOffline(now);
      } else game.tick(Math.max(0, now - last));
    }
    last = now;
    save(true);
  }
  function returnToWorkshop() {
    if (document.hidden) return;
    const wasAway = away;
    away = false;
    sound.setVisible(true);
    const now = Date.now();
    lease();
    if (!wasAway && !needsCatchup) {
      if (now - last < 60000) return;
      if (!ui.readonly && !ui.catchingUp) game.markSaved(last);
    }
    if (!ui.readonly && game.state.started) reconcileOffline(now);
    last = now;
    render(true);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) leaveWorkshop();
    else returnToWorkshop();
  });
  window.addEventListener("blur", leaveWorkshop);
  window.addEventListener("focus", returnToWorkshop);
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      away = true;
      returnToWorkshop();
    }
  });
  setInterval(() => {
    if (document.hidden || away || ui.catchingUp) return;
    const now = Date.now(),
      delta = now - last;
    lease();
    if (needsCatchup) {
      reconcileOffline(now);
      return;
    }
    // Do not silently advance and save live play behind the Continue button.
    // Continue (or a browser return) reconciles this entire interval offline.
    if (ui.screen !== "game") return;
    if (!ui.readonly && game.state.started) {
      if (delta >= 60000) {
        // The browser may suspend a visible page without a visibility event.
        // last is already simulated; the save cursor can lag it by five seconds.
        game.markSaved(last);
        reconcileOffline(now);
        return;
      }
      game.tick(Math.max(0, delta));
      save();
    }
    last = now;
    if (ui.replayPlaying) {
      const m = game.state.house.matches.find((m) => m.id === ui.replay);
      if (m) {
        ui.replayAt = Math.min(
          m.result.duration,
          ui.replayAt + delta * ui.replaySpeed,
        );
        if (ui.replayAt >= m.result.duration) ui.replayPlaying = false;
      }
    }
    if (ui.screen === "game" && now - lastRender >= 750) render();
  }, 250);
  document.documentElement.style.setProperty(
    "--button-art",
    `url('${asset("button")}')`,
  );
  document.documentElement.style.setProperty(
    "--frame-art",
    `url('${asset("frame")}')`,
  );
  render(true);
  if (saved && !ui.readonly) setTimeout(() => reconcileOffline(Date.now()), 0);
})();
