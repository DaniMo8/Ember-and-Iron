import {
  SAVE_KEY,
  MATERIALS,
  appearance,
  itemStats,
  itemName,
  fresh,
  validateSave,
  quote,
  commission,
  cancel,
  equip,
  launch,
  advance,
  reconcile,
  newBattle,
  tickBattle,
} from "./core.js";
import { AtelierScene } from "./scene.js";
import { DOCTRINES, TEAM_HEALTH } from "./combat.js";
const $ = (id) => document.getElementById(id),
  escape = (s) =>
    String(s).replace(
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
const fmt = (n) => Math.floor(n).toLocaleString(),
  seconds = (ms) => `${Math.max(0, Math.ceil(ms / 1000))}s`;
let state;
try {
  state = validateSave(JSON.parse(localStorage.getItem(SAVE_KEY)), Date.now());
} catch {
  state = fresh();
}
let renderer,
  room = "forge",
  destination = "team",
  away = document.hidden,
  toastTimer,
  inspectedItem = null,
  replayFrame = null,
  replayPlaying = false,
  replayLast = 0,
  lastUI = 0,
  lastSave = 0,
  shelfStamp = "",
  queueStamp = "",
  teamStamp = "",
  sound = false,
  audio,
  previousHits = 0;
let settings = {
  quality: innerWidth < 700 ? "low" : "balanced",
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  sound: false,
  opacity: 76,
  doctrine: "balanced",
};
try {
  settings = {
    ...settings,
    ...JSON.parse(localStorage.getItem("emberiron.atelier.settings") || "{}"),
  };
} catch {}
const notes = {
  forge: [
    "HOUSE OF THE HAMMER · WORKSHOP I",
    "A good edge.<br>A better beginning.",
    "Fire, patience, and something worth making.",
  ],
  shop: [
    "THE HIGH STREET · SHOP & ARMOURY",
    "Good work.<br>Worth keeping.",
    "A place for every piece, a story for every sale.",
  ],
  arena: [
    "THE CINDER YARD · EXHIBITION",
    "Steel against steel.",
    "Hold the line. Break their guard. Take the opening.",
  ],
};
const visitorNames = {
  enter: "Walking in from the street",
  browse: "Browsing the display racks",
  consider: "Considering a rondel",
  checkout: "At the counter with Perrin",
  leave: "Heading back to the town",
  absent: "The next traveller is on the way",
};
function visitorLabel() {
  return state.visitor.phase === "consider" && !state.visitor.itemId
    ? "No suitable piece in stock"
    : visitorNames[state.visitor.phase];
}
function draft() {
  return appearance({
    material: $("material").value,
    prefix: $("prefix").value,
    enchant: $("enchant").value,
    quality: Number($("quality").value),
  });
}
function toast(text) {
  $("toast").textContent = text;
  $("toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 4200);
}
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    toast(
      "Your browser could not save this study. Keep this tab open to retain your work.",
    );
  }
}
function showOffline() {
  if (!state.pending) return;
  const r = state.pending;
  $("offline-duration").textContent =
    `The workshop kept working for ${r.elapsed >= 60000 ? `${Math.floor(r.elapsed / 60000)} minutes` : seconds(r.elapsed)} while you were away.`;
  $("offline-summary").innerHTML = [
    ["Gold earned", r.gold + "g"],
    ["Pieces finished", r.crafted],
    ["Visitors served", r.sales],
    ["Bouts won", r.wins],
  ]
    .map(([t, n]) => `<div><b>${escape(n)}</b><small>${t}</small></div>`)
    .join("");
  if (!$("offline").open) $("offline").showModal();
}
function pause() {
  if (away) return;
  const now = Date.now();
  advance(state, Math.max(0, now - state.lastAt));
  state.lastAt = now;
  away = true;
  save();
}
function resume() {
  if (document.hidden) return;
  if (away) {
    reconcile(state, Date.now());
    away = false;
    save();
    showOffline();
    refresh(true);
  }
}
document.addEventListener("visibilitychange", () =>
  document.hidden ? pause() : resume(),
);
window.addEventListener("blur", pause);
window.addEventListener("focus", resume);
window.addEventListener("pagehide", pause);
window.addEventListener("pageshow", resume);
$("dismiss-offline").addEventListener("click", () => {
  state.pending = null;
  save();
  $("offline").close();
});
$("offline").addEventListener("cancel", (e) => e.preventDefault());

function updateDraft() {
  const a = draft(),
    q = quote(a),
    stats = itemStats(a);
  $("quality-label").textContent = `${a.quality} / 200`;
  $("preview-quality").textContent = `Q${a.quality}`;
  $("preview-name").textContent = itemName(a);
  $("preview-detail").textContent =
    `${stats.attack} damage · ${Math.round(stats.crit * 100)}% critical · ${stats.value}g sale value`;
  $("draft-preview").setAttribute(
    "aria-label",
    `Close-up: ${itemName(a)}, quality ${a.quality}. Drag or use the left and right arrow keys to rotate.`,
  );
  renderer?.previewDraft(a);
  $("finish-note").textContent =
    a.quality < 60
      ? "Rougher metal, unadorned fittings and a simple grip."
      : a.quality < 125
        ? "Fitted brass, a polished edge and carefully bound leather."
        : "Silver filigree, measured engraving and an exceptionally clean edge.";
  $("item-metrics").innerHTML =
    `<div><strong>${stats.attack}</strong><small>Damage</small></div><div><strong>${Math.round(stats.crit * 100)}%</strong><small>Critical</small></div><div><strong>${stats.value}g</strong><small>Sale value</small></div>`;
  $("craft-cost").textContent = `${q.cost}g · ${q.metal} ingots`;
  $("craft-time").textContent =
    `${seconds(q.duration)} of careful work · sample timing for this study`;
  if (inspectedItem?.draft) inspect({ ...a, draft: true });
}
["material", "prefix", "enchant", "quality"].forEach((id) =>
  $(id).addEventListener("input", updateDraft),
);
document.querySelectorAll("[data-destination]").forEach((b) =>
  b.addEventListener("click", () => {
    destination = b.dataset.destination;
    document
      .querySelectorAll("[data-destination]")
      .forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
  }),
);
$("craft").addEventListener("click", () => {
  const result = commission(state, draft(), destination);
  if (!result.ok) return toast(result.reason);
  save();
  refresh(true);
  toast(`${itemName(result.job)} is on the work list.`);
  chime(330, 0.12);
});
$("restock").addEventListener("click", () => {
  state.gold += 50;
  state.metal += 12;
  save();
  refresh();
  toast(
    "Added 50 sample gold and 12 ingots. Campaign resources are unchanged.",
  );
});
function itemCard(i, { equipButton = true } = {}) {
  const stats = itemStats(i),
    current = state.items.find((j) => j.location === "team"),
    delta = current ? stats.attack - itemStats(current).attack : stats.attack,
    reserved =
      state.visitor.phase === "checkout" && state.visitor.itemId === i.id;
  return `<article class="stock-item"><div><strong>${escape(itemName(i))}</strong><small>${stats.attack} damage · ${stats.value}g${reserved ? " · At checkout" : ""}</small></div><span class="quality">Q${i.quality}</span><div class="stock-actions"><button data-inspect="${escape(i.id)}">Inspect</button>${equipButton && delta > 0 ? `<button data-equip="${escape(i.id)}" ${reserved || state.battle?.status === "live" ? "disabled" : ""}>Equip Renn <span class="delta-up">+${delta}</span></button>` : ""}${i.location === "warehouse" ? `<button data-display="${escape(i.id)}">Offer for sale</button>` : ""}</div></article>`;
}
function teamCard() {
  const i = state.items.find((i) => i.location === "team");
  if (!i) return "";
  const stats = itemStats(i);
  const stance = DOCTRINES[$("doctrine").value] || DOCTRINES.balanced;
  return `<article class="stock-item"><div><strong>Renn · Duelist</strong><small>${(stats.attack * stance.attack).toFixed(1)} damage · ${TEAM_HEALTH.renn} health · ${Math.round(stats.crit * 100)}% critical</small><small>${escape(itemName(i))}</small></div><span class="quality">Q${i.quality}</span><div class="stock-actions"><button data-inspect="${escape(i.id)}">Inspect equipped blade</button></div></article><p class="quiet">Mara · Vanguard · ${TEAM_HEALTH.mara} health · ${Math.round(42 * stance.guard)} guard · mail & heater shield</p>`;
}
function refresh(force = false) {
  $("gold").textContent = fmt(state.gold);
  $("metal").textContent = fmt(state.metal);
  $("queue-count").textContent = `${state.queue.length} / 6`;
  const job = state.queue[0],
    progress = job
      ? Math.min(1, Math.max(0, (state.clock - job.startedAt) / job.duration))
      : 0;
  $("work-eyebrow").textContent = job
    ? progress < 0.22
      ? "HEATING THE BLANK"
      : progress < 0.8
        ? "SHAPING THE EDGE"
        : "FINISHING THE PIECE"
    : "THE ANVIL IS READY";
  $("work-name").textContent = job
    ? itemName(job)
    : state.crafted
      ? `${state.crafted} ${state.crafted === 1 ? "piece" : "pieces"} made. The next one awaits.`
      : "What will you make first?";
  $("work-progress").style.width = `${progress * 100}%`;
  $("work-detail").textContent = job
    ? `${seconds(job.endsAt - state.clock)} remaining · Q${job.quality} · ${job.destination === "team" ? "Protected for Renn" : "For the shop display"}`
    : "Your orders continue while you look around.";
  const qStamp = state.queue.map((j) => j.id).join(",");
  if (force || qStamp !== queueStamp) {
    $("queue-list").innerHTML = state.queue.length
      ? state.queue
          .map(
            (j, n) =>
              `<div class="queue-job"><div>${n === 0 ? "Working" : "Queued"} · ${MATERIALS[j.material].name}<small>Q${j.quality} · ${j.destination === "team" ? "Team" : "Shop"}</small></div><button data-cancel="${j.id}" aria-label="Cancel ${escape(itemName(j))}">×</button></div>`,
          )
          .join("")
      : '<span class="empty-queue">A little room for ambition.</span>';
    queueStamp = qStamp;
  }
  const stamp =
    state.items.map((i) => i.id + i.location + !!i.protected).join("|") +
    state.visitor.phase +
    (state.battle?.status || "");
  if (force || stamp !== shelfStamp) {
    const displayed = state.items.filter((i) => i.location === "shelf");
    $("shelf-count").textContent = `${displayed.length} / 3`;
    $("shelf-list").innerHTML =
      displayed.map((i) => itemCard(i)).join("") +
      Array.from(
        { length: Math.max(0, 3 - displayed.length) },
        () =>
          '<div class="empty-stock">An empty display · waiting for a piece</div>',
      ).join("");
    $("warehouse-list").innerHTML =
      state.items
        .filter((i) => i.location === "warehouse")
        .map((i) => itemCard(i))
        .join("") || '<div class="empty-stock">No pieces in reserve.</div>';
    shelfStamp = stamp;
  }
  $("visitor-status").textContent = visitorLabel();
  const equipped = state.items.find((i) => i.location === "team"),
    tStamp = equipped?.id || "";
  if (force || tStamp !== teamStamp) {
    $("equipped-card").innerHTML = teamCard();
    $("team-card").innerHTML = teamCard();
    teamStamp = tStamp;
  }
  const b = replayFrame || state.battle;
  $("launch").disabled = !!replayFrame || state.battle?.status === "live";
  $("replay").disabled = !state.replay || state.battle?.status === "live";
  $("doctrine").disabled = !!replayFrame || state.battle?.status === "live";
  if (room === "arena" && b) {
    $("combat-bars").innerHTML = b.units
      .map(
        (u) =>
          `<div class="fighter-bar ${u.team === "away" ? "away" : ""}"><strong>${escape(u.name)}</strong><small>${Math.ceil(u.hp)} / ${u.maxHp} · ${phaseLabel(u, b)}</small><div class="fighter-hp"><i style="width:${(100 * u.hp) / u.maxHp}%"></i></div>${u.guardMax ? `<div class="fighter-guard" aria-label="${escape(u.name)} guard ${Math.round(u.guard)} of ${u.guardMax}"><i style="width:${(100 * u.guard) / u.guardMax}%"></i></div>` : ""}</div>`,
      )
      .join("");
    const recent = b.events
      .filter((e) => e.type === "breach" && b.tick - e.tick < 65)
      .at(-1);
    $("battle-caption").textContent =
      b.status !== "live"
        ? b.status === "won"
          ? "Victory for the house."
          : b.status === "lost"
            ? "A lesson in steel."
            : "The bell sounds. A two-minute draw."
        : recent
          ? recent.team === "away"
            ? "Their front line is broken."
            : "Our front line has fallen."
          : replayFrame
            ? "SAVED REPLAY"
            : b.stage === "forming"
              ? "Take your marks."
              : "";
    $("bout-readout").textContent =
      `${replayFrame ? "Replay" : "Bout"} · ${(b.tick / 20).toFixed(1)}s · ${b.version === 1 ? "Original rules" : DOCTRINES[b.doctrine].name}`;
    $("battle-result").hidden = b.status === "live";
    if (b.status !== "live")
      $("battle-result").innerHTML =
        `<strong>${b.status === "won" ? "The house takes the ring." : b.status === "lost" ? "An edge to improve." : "A hard-fought draw."}</strong><p>${replayFrame ? "Saved replay · no additional rewards." : `${b.status === "won" ? 24 : 5}g purse received. ${b.status === "won" ? "Your craftsmanship made the difference." : "Try a finer blade, a piercing point or a different doctrine."}`}</p><div class="bout-summary">${b.units
          .filter((u) => u.team === "home")
          .map(
            (u) =>
              `<span>${escape(u.name)} <b>${Math.round(u.damage)} dealt</b> · ${Math.round(u.blocked || 0)} blocked</span>`,
          )
          .join("")}</div>`;
    $("fight-log").innerHTML = b.events
      .slice(-6)
      .reverse()
      .map((e) => `<p>${eventText(e, b)}</p>`)
      .join("");
  }
  if (room === "forge")
    $("scene-status").textContent = job
      ? "Your smith is at work. Tomas is preparing the next fitting."
      : "The hearth is warm. Your smith is tending the workshop.";
  if (room === "shop")
    $("scene-status").textContent =
      state.lastSale && state.clock - state.lastSale.at < 7000
        ? `${state.lastSale.name} left with a traveller · ${state.lastSale.value}g.`
        : visitorLabel() + ".";
  if (room === "arena")
    $("scene-status").textContent = replayFrame
      ? "Revisiting a saved bout. The workshop keeps working."
      : state.battle?.status === "live"
        ? "The match is live. Every movement and hit is being resolved now."
        : "The ring is ready. Equip your work, then gather the team.";
}
function phaseLabel(u, b) {
  if (u.hp <= 0) return "Yielded";
  if (b.status !== "live") return "Standing";
  if (b.tick < u.brokenUntil) return "Guard broken";
  if (u.phase === "windup") return "Winding up";
  if (u.phase === "strike") return "Striking";
  if (u.phase === "recover") return "Recovering";
  return u.moving ? "Footwork" : "Guarding";
}
function eventText(e, b) {
  const name = (id) => escape(b.units.find((u) => u.id === id)?.name || id);
  return e.type === "hit"
    ? `${name(e.actor)} → ${name(e.target)} · <b>${e.damage}</b>${e.block ? " · blocked" : ""}${e.crit ? " · critical" : ""}`
    : e.type === "guardbreak"
      ? `${name(e.target)}’s guard breaks.`
      : e.type === "miss"
        ? `${name(e.actor)}’s attack falls short.`
        : e.type === "fall"
          ? `${name(e.target)} yields.`
          : e.type === "breach"
            ? `${e.team === "away" ? "Their" : "Our"} rear is exposed.`
            : "The bout is settled.";
}
document.addEventListener("click", (e) => {
  const inspectButton = e.target.closest("[data-inspect]"),
    equipButton = e.target.closest("[data-equip]"),
    displayButton = e.target.closest("[data-display]"),
    cancelButton = e.target.closest("[data-cancel]");
  if (inspectButton) {
    const i = state.items.find((i) => i.id === inspectButton.dataset.inspect);
    if (i) inspect(i);
  }
  if (equipButton) {
    const result = equip(state, equipButton.dataset.equip);
    toast(result.ok ? "Renn has equipped your piece." : result.reason);
    save();
    refresh(true);
  }
  if (displayButton) {
    const item = state.items.find(
      (i) =>
        i.id === displayButton.dataset.display && i.location === "warehouse",
    );
    if (item) {
      item.protected = false;
      advance(state, 1);
      save();
      refresh(true);
      toast("The piece will fill the next open display.");
    }
  }
  if (cancelButton) {
    if (cancel(state, cancelButton.dataset.cancel)) {
      save();
      refresh(true);
      toast("Order cancelled. Its exact gold and ingots were returned.");
    }
  }
});
async function changeRoom(next) {
  room = next;
  document.querySelector(".workspace").dataset.currentRoom = next;
  if (innerWidth <= 800) window.scrollTo({ top: 0, behavior: "instant" });
  closeInspection(false);
  replayFrame = null;
  replayPlaying = false;
  $("replay-controls").hidden = true;
  document
    .querySelectorAll("[data-room]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.room === next)),
    );
  for (const id of ["forge", "shop", "arena"])
    $(id + "-panel").hidden = id !== next;
  document.querySelector(".work-panel").scrollTop = 0;
  const n = notes[next];
  $("room-eyebrow").textContent = n[0];
  $("room-name").innerHTML = n[1];
  $("room-subtitle").textContent = n[2];
  $("combat-overlay").hidden = next !== "arena";
  $("room-name").parentElement.hidden = false;
  if (renderer) {
    try {
      await renderer.setRoom(next);
    } catch {
      toast("This room could not load. Reload to try its 3D view again.");
    }
  }
  refresh(true);
}
document
  .querySelectorAll("[data-room]")
  .forEach((b) =>
    b.addEventListener("click", () => changeRoom(b.dataset.room)),
  );
function inspect(i) {
  inspectedItem = i;
  document.body.classList.add("item-inspection");
  $("inspection").hidden = false;
  $("combat-overlay").hidden = true;
  $("inspection-name").textContent = itemName(i);
  const s = itemStats(i);
  $("inspection-detail").textContent =
    `${MATERIALS[i.material].name} · ${i.prefix === "plain" ? "Unmodified" : i.prefix + " craftsmanship"} · ${i.enchant === "none" ? "No inscription" : i.enchant === "flame" ? "Ember inscription" : "Starlight inscription"} · ${s.attack} damage`;
  $("inspection-quality").textContent = `Q${i.quality} / 200`;
  $("room-name").parentElement.hidden = true;
  renderer?.inspect(i);
}
function closeInspection(restore = true) {
  if (!inspectedItem) return;
  inspectedItem = null;
  document.body.classList.remove("item-inspection");
  $("inspection").hidden = true;
  $("combat-overlay").hidden = room !== "arena";
  $("room-name").parentElement.hidden = false;
  if (restore) renderer?.setRoom(room);
}
$("inspect-current").addEventListener("click", () =>
  inspect(
    room === "forge"
      ? { ...draft(), draft: true }
      : state.items.find((i) => i.location === "team"),
  ),
);
$("close-inspection").addEventListener("click", () => closeInspection());
$("reset-view").addEventListener("click", () => {
  if (inspectedItem) {
    renderer.inspecting = false;
    renderer.inspect(inspectedItem);
  } else renderer?.home();
});
$("scenic").addEventListener("click", () => {
  const active = document.body.classList.toggle("scenic-mode");
  $("scenic").setAttribute("aria-pressed", String(active));
  requestAnimationFrame(() => renderer?.resize());
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeInspection();
});
$("launch").addEventListener("click", () => {
  const r = launch(state, $("doctrine").value);
  if (!r.ok) return toast(r.reason);
  replayFrame = null;
  renderer.follow = false;
  $("battle-result").hidden = true;
  save();
  refresh(true);
  chime(180, 0.2);
});
$("follow").addEventListener("click", () => {
  if (!renderer) return;
  renderer.follow = !renderer.follow;
  $("follow").textContent = renderer.follow
    ? "Return to overview"
    : "Follow Renn";
  if (!renderer.follow) renderer.home();
});
function replayAt(tick) {
  if (!state.replay) return;
  const serial = Number(state.replay.id.split("-")[1]);
  const b = newBattle(
    state.replay.item,
    serial,
    state.replay.doctrine,
    state.replay.version || 1,
  );
  for (let i = 0; i < tick && b.status === "live"; i++) tickBattle(b);
  replayFrame = b;
  $("replay-time").textContent =
    `${(b.tick / 20).toFixed(1)} / ${(state.replay.tick / 20).toFixed(1)}s`;
  $("replay-position").value = String(b.tick);
  refresh(true);
}
$("replay").addEventListener("click", () => {
  if (!state.replay) return;
  $("replay-controls").hidden = false;
  $("replay-position").max = String(state.replay.tick);
  replayAt(0);
  replayPlaying = true;
  replayLast = performance.now();
  $("replay-play").textContent = "Pause replay";
  renderer?.home();
});
$("replay-position").addEventListener("input", () => {
  replayPlaying = false;
  $("replay-play").textContent = "Play replay";
  replayAt(Number($("replay-position").value));
});
$("replay-play").addEventListener("click", () => {
  if (replayFrame?.status !== "live") replayAt(0);
  replayPlaying = !replayPlaying;
  replayLast = performance.now();
  $("replay-play").textContent = replayPlaying ? "Pause replay" : "Play replay";
});
$("replay-exit").addEventListener("click", () => {
  replayFrame = null;
  replayPlaying = false;
  $("replay-controls").hidden = true;
  refresh(true);
});
$("options-button").addEventListener("click", () => {
  $("render-stats").textContent = renderer?.ready
    ? renderer.stats()
    : "The HTML workshop remains usable while 3D loads.";
  $("options").showModal();
});
document
  .querySelectorAll("[data-close]")
  .forEach((b) =>
    b.addEventListener("click", () => $(b.dataset.close).close()),
  );
$("render-quality").value = settings.quality;
$("reduced-motion").checked = settings.reduced;
$("sound").checked = settings.sound;
$("doctrine").value = DOCTRINES[settings.doctrine]
  ? settings.doctrine
  : "balanced";
$("doctrine-note").textContent = DOCTRINES[$("doctrine").value].description;
$("doctrine").addEventListener("change", () => {
  settings.doctrine = $("doctrine").value;
  $("doctrine-note").textContent = DOCTRINES[settings.doctrine].description;
  storeSettings();
  refresh(true);
});
sound = settings.sound;
function applyOpacity() {
  const value = Number(settings.opacity);
  settings.opacity = Number.isFinite(value)
    ? Math.min(95, Math.max(40, value))
    : 76;
  document.documentElement.style.setProperty(
    "--overlay-opacity",
    settings.opacity / 100,
  );
  $("overlay-opacity").value = settings.opacity;
  $("overlay-opacity-label").textContent = `${settings.opacity}%`;
}
applyOpacity();
$("overlay-opacity").addEventListener("input", () => {
  settings.opacity = Number($("overlay-opacity").value);
  applyOpacity();
  storeSettings();
});
function storeSettings() {
  localStorage.setItem("emberiron.atelier.settings", JSON.stringify(settings));
}
$("render-quality").addEventListener("change", () => {
  settings.quality = $("render-quality").value;
  renderer?.setQuality(settings.quality);
  storeSettings();
});
$("reduced-motion").addEventListener("change", () => {
  settings.reduced = $("reduced-motion").checked;
  if (renderer) renderer.reduced = settings.reduced;
  storeSettings();
});
$("sound").addEventListener("change", () => {
  sound = $("sound").checked;
  settings.sound = sound;
  storeSettings();
  if (sound) chime(270, 0.15);
});
function chime(freq, duration = 0.08) {
  if (!sound || away) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") audio.resume();
    const o = audio.createOscillator(),
      gain = audio.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    o.connect(gain);
    gain.connect(audio.destination);
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.022, audio.currentTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + duration,
    );
    o.start();
    o.stop(audio.currentTime + duration + 0.01);
  } catch {}
}

reconcile(state, Date.now());
save();
updateDraft();
refresh(true);
showOffline();
try {
  renderer = new AtelierScene($("world"), {
    onError: (message) => {
      toast(message);
      $("loading").hidden = true;
    },
    onInspect: inspect,
    onPerson: (id) =>
      toast(
        {
          smith:
            "Your smith · heating, shaping and finishing each commissioned piece.",
          tomas:
            "Tomas · workshop apprentice · preparing fittings at the bench.",
          perrin: "Perrin · shopkeeper · keeping the counter ready.",
          customer: visitorLabel(),
          mara: "Mara · Vanguard · mail and shield hold the front.",
          renn: "Renn · Duelist · wearing your actual commissioned dagger.",
          warden: "The Warden · a shield protects the rear.",
          rook: "The Rook · guarded until the front line falls.",
        }[id] || id,
      ),
  });
  renderer.quality = settings.quality;
  renderer.reduced = settings.reduced;
  await renderer.init();
  renderer.setupPreview($("draft-preview"));
  renderer.previewDraft(draft());
  $("preview-loading").hidden = true;
  $("loading").hidden = true;
} catch (error) {
  $("loading").innerHTML =
    '<b>The 3D view could not start.</b><small>The workshop controls still work. Try a WebGL 2 browser or reload.</small><button id="retry-3d">Reload the scene</button>';
  document
    .getElementById("retry-3d")
    .addEventListener("click", () => location.reload());
  console.error("Atelier scene:", error);
  $("preview-loading").textContent =
    "3D preview unavailable. Your choices and crafting controls still work.";
}
$("preview-left").addEventListener("click", () => renderer?.turnPreview(-0.35));
$("preview-right").addEventListener("click", () => renderer?.turnPreview(0.35));
let frameAt = performance.now(),
  frames = 0,
  fpsAt = frameAt;
function frame(at) {
  const dt = Math.min(0.2, (at - frameAt) / 1000);
  frameAt = at;
  const now = Date.now();
  if (!away && !document.hidden) {
    const elapsed = Math.max(0, now - state.lastAt);
    if (elapsed > 60000) {
      reconcile(state, now);
      showOffline();
    } else {
      advance(state, elapsed);
      state.lastAt = now;
    }
    if (replayFrame && replayPlaying) {
      const ticks = Math.floor((at - replayLast) / 50);
      if (ticks > 0) {
        for (let i = 0; i < ticks && replayFrame.status === "live"; i++)
          tickBattle(replayFrame);
        replayLast += ticks * 50;
        $("replay-position").value = String(replayFrame.tick);
        $("replay-time").textContent =
          `${(replayFrame.tick / 20).toFixed(1)} / ${(state.replay.tick / 20).toFixed(1)}s`;
        if (replayFrame.status !== "live") {
          replayPlaying = false;
          $("replay-play").textContent = "Play replay";
        }
      }
    }
    if (at - lastUI > 220) {
      refresh();
      lastUI = at;
    }
    if (at - lastSave > 1500) {
      save();
      lastSave = at;
    }
    const hits = state.battle?.events.length || 0;
    if (hits > previousHits) {
      chime(140 + (hits % 4) * 35, 0.07);
      previousHits = hits;
    }
    renderer?.update(state, draft(), dt, replayFrame);
    frames++;
    if (at - fpsAt > 2500) {
      if ($("options").open)
        $("render-stats").textContent =
          `${Math.round((frames * 1000) / (at - fpsAt))} fps · ${renderer?.stats() || "HTML mode"}`;
      frames = 0;
      fpsAt = at;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
