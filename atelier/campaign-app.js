import { CampaignScene } from "./campaign-scene.js";

const key = "ember-iron-3d-preferences-v1";
let settings = {
  quality: "balanced",
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
};
try {
  const p = JSON.parse(localStorage.getItem(key) || "{}");
  if (["low", "balanced", "high", "static"].includes(p.quality))
    settings.quality = p.quality;
  if (typeof p.reduced === "boolean") settings.reduced = p.reduced;
} catch {}
let scene = null,
  loading = null,
  latest = null,
  view = null,
  last = 0,
  raf = 0,
  failed = false;
const status = document.createElement("div");
status.className = "world-status";
status.setAttribute("role", "status");
document.body.append(status);
const host = document.createElement("div");
host.id = "house-world";
host.setAttribute("aria-hidden", "true");
const canvas = document.createElement("canvas");
host.append(canvas);
document.body.prepend(host);
function optionsMarkup() {
  return `<section class="option-section"><h3>Living rooms</h3><label>3D detail<select data-scene-setting="quality" aria-label="3D detail">${[
    ["low", "Low · conserve power"],
    ["balanced", "Balanced"],
    ["high", "High"],
    ["static", "Illustrated backgrounds"],
  ]
    .map(
      ([id, name]) =>
        `<option value="${id}" ${settings.quality === id ? "selected" : ""}>${name}</option>`,
    )
    .join(
      "",
    )}</select></label><label class="mute-option"><input type="checkbox" data-scene-setting="reduced" ${settings.reduced ? "checked" : ""}> Reduced ambient motion</label><p>One shared 3D renderer. Hidden rooms and browser tabs stop drawing; your workshop still progresses.</p></section>`;
}
function sync(input) {
  latest = input;
  const active = input.ui.screen === "game" || input.ui.screen === "creation";
  if (settings.quality === "static" || failed || !active) {
    document.body.classList.remove("living-world");
    host.hidden = true;
    return;
  }
  host.hidden = false;
  if (!loading) {
    status.textContent = "Opening the living workshop…";
    loading = (async () => {
      scene = new CampaignScene(canvas, {
        onError: (error) => fallback(error),
      });
      scene.room = input.ui.screen === "game" ? input.ui.room : "smith";
      scene.controls.enabled = false;
      scene.quality = settings.quality;
      scene.reduced = settings.reduced;
      await scene.init();
      status.textContent = "";
      sync(latest);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    })().catch(fallback);
  }
  if (!scene?.ready) return;
  document.body.classList.add("living-world");
  const { game, data, ui } = input,
    room = ui.screen === "game" ? ui.room : "smith";
  const preview =
    room === "forge" && data.recipes[ui.recipe]
      ? game.craftPreview(ui.recipe, {
          intent: ui.intent,
          treatment: ui.treatment,
          grade: ui.grade,
          enchantmentId: ui.enchantment || null,
        })
      : null;
  const draft = preview
    ? {
        recipeId: ui.recipe,
        quality:
          ui.intent === "catalogue" && ui.order
            ? game.commissionPlan(ui.order, {
                recipeId: ui.recipe,
                treatment: ui.treatment,
                grade: ui.grade,
                enchantmentId: ui.enchantment || null,
              }).quality || preview.quality
            : preview.quality,
        grade: ui.grade,
        treatment: ui.treatment,
        enchantmentId: ui.enchantment || null,
      }
    : null;
  const replay = ui.arenaTab === "replays",
    match = replay
      ? game.state.house.matches.find((m) => m.id === ui.replay)
      : game.activeMatch();
  view = {
    data,
    state: game.state,
    room,
    stage: game.roomStage(room),
    draft,
    match,
    replay,
    replayAt: ui.replayAt,
  };
  document.body.classList.toggle("watching-bout", room === "arena" && !!match);
  scene.sync(view);
  const previewCanvas = document.getElementById("forge-model");
  if (previewCanvas && scene.previewCanvas !== previewCanvas) {
    scene.previewObserver?.disconnect();
    scene.previewAbort?.abort();
    scene.releaseItem(scene.previewItem);
    scene.previewItem = null;
    scene.previewKey = null;
    scene.setupPreview(previewCanvas);
    scene.previewDraft(draft);
  }
}
function fallback(error) {
  failed = true;
  document.body.classList.remove("living-world");
  host.hidden = true;
  scene?.dispose();
  scene = null;
  status.textContent =
    "3D view unavailable. Illustrated rooms are active; the full game remains playable.";
  console.warn("House scenery:", error);
}
function frame(now) {
  raf = requestAnimationFrame(frame);
  if (
    !scene?.ready ||
    document.hidden ||
    host.hidden ||
    latest?.ui.catchingUp
  ) {
    last = now;
    return;
  }
  const interval = settings.quality === "high" ? 1000 / 60 : 1000 / 30;
  if (now - last < interval) return;
  const dt = Math.min(0.12, (now - last) / 1000);
  last = now;
  if (view) {
    view.state = latest.game.state;
    view.match = view.replay
      ? latest.game.state.house.matches.find((m) => m.id === latest.ui.replay)
      : latest.game.activeMatch();
    view.replayAt = latest.ui.replayAt;
  }
  try {
    scene.update(
      dt,
      document.body.classList.contains("house-scenic")
        ? null
        : document.getElementById("arena-model"),
    );
  } catch (error) {
    fallback(error);
  }
}
document.addEventListener("change", (event) => {
  const name = event.target.dataset.sceneSetting;
  if (!name) return;
  if (
    name === "quality" &&
    ["low", "balanced", "high", "static"].includes(event.target.value)
  )
    settings.quality = event.target.value;
  if (name === "reduced") settings.reduced = event.target.checked;
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch {}
  if (scene) {
    scene.reduced = settings.reduced;
    if (settings.quality !== "static") scene.setQuality(settings.quality);
  }
  if (latest) sync(latest);
});
document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-scene-action]")?.dataset
    .sceneAction;
  if (!action) return;
  if (action === "look") {
    const scenic = document.body.classList.toggle("house-scenic");
    if (scene) {
      scene.controls.enabled = scenic;
      scene.resize();
    }
    const exit = document.getElementById("leave-scenery");
    if (exit) exit.hidden = !scenic;
  } else if (action === "home") scene?.home();
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    document.body.classList.contains("house-scenic")
  )
    document.querySelector('[data-scene-action="look"]')?.click();
});
const exit = document.createElement("button");
exit.id = "leave-scenery";
exit.dataset.sceneAction = "look";
exit.textContent = "Return to the workshop";
exit.hidden = true;
document.body.append(exit);
window.addEventListener("pagehide", () => {
  cancelAnimationFrame(raf);
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
});
function resetOptions() {
  settings = {
    quality: "balanced",
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch {}
  if (scene) {
    scene.reduced = settings.reduced;
    scene.setQuality(settings.quality);
  }
  if (latest) sync(latest);
}
globalThis.EIHouse3D = { sync, optionsMarkup, resetOptions };
