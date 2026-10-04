/* Explicit, controlled UI fixtures; executable only on isolated localhost QA origin. */
"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const E = require("../../house-engine"),
  D = require("../../data"),
  H = require("../../house-data"),
  C = require("../../house-campaign"),
  P = require("../../progression"),
  W = require("../../workshop");
function fixture(generation = 1) {
  const e = new E(structuredClone(D));
  e.command("create", {
    smithName: "Aveline",
    name: "House of the Silver Anvil",
    profession: "artificer",
    stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
  });
  const s = e.state,
    c = s.house.campaign;
  s.player.legacy.generation = generation;
  s.player.gold = 250000;
  s.player.level = generation === 1 ? 20 : 70;
  s.player.points = 0;
  s.player.stats = {
    strength: 240,
    precision: 160,
    charisma: 40,
    knowledge: 170,
  };
  s.simTime = (generation === 1 ? 48 : 80) * C.hour;
  s.world.staffUpdatedAt = s.simTime;
  s.world.totalMined = 15000;
  s.workshop.smelted = 600;
  s.stats.crafted = 800;
  s.house.contracts = 120;
  s.house.champions = generation === 1 ? 3 : 5;
  s.house.wins = 80;
  c.tierCrafts = [100, 100, 100, 100, 100];
  c.tierContracts = [30, 30, 30, 30, 30];
  c.discoveries = C.discoveries
    .filter((d) => (d.generation || 1) <= generation)
    .map((d) => d.id);
  c.unread = ["The heat remembers"];
  for (const p of Object.values(s.player.proficiency)) p.level = 100;
  for (const n of Object.values(H.upgrades))
    if ((n.champions || 0) <= s.house.champions)
      s.house.upgrades[n.id] = generation > 1 ? n.max : 1;
  for (const [id, n] of Object.entries(W.upgrades))
    s.workshop.upgrades[id] = generation > 1 ? n.maxRank : 1;
  if (generation > 1) {
    c.projects = C.projects.map((p) => p.id);
    c.seals = 20;
    c.totalSeals = 30;
    c.trialDepth = 9;
    c.bestTrial = 12;
    c.lineage = { edge: 2, ward: 2 };
    s.player.legacy.points = 80;
    s.player.legacy.totalPoints = 80;
    for (const n of Object.values(P.nodes).filter(
      (n) => n.section === "employees",
    ))
      s.world.trees[n.id] = n.maxRank;
    for (const id of Object.keys(e.data.staff))
      s.staff[id] = { level: 3, xp: 4, active: true, stamina: 80 };
  }
  for (const id in s.materials) s.materials[id] = Math.min(40, e.binCapacity());
  for (const u of s.adventurers) {
    u.level = 25;
    for (const slot of H.slots) {
      const r = Object.values(e.data.recipes).find(
        (r) =>
          r.tier === 5 &&
          r.variant === (generation > 1 ? 5 : 1) &&
          r.slot === slot &&
          e.data.archetypes[u.archetypeId].preferences.includes(r.classId),
      );
      if (r)
        u.equipment[slot] = {
          id: e._id("item"),
          recipeId: r.id,
          quality: 150,
          createdAt: s.simTime,
          makerGeneration: generation,
          protected: true,
          displayed: false,
          grade: "standard",
          treatment: "warding",
          affixId: null,
          enchantmentId: null,
        };
    }
    if (e.data.recipes[u.equipment.weapon?.recipeId]?.twoHanded)
      u.equipment.offhand = null;
  }
  s.house.orders = [];
  e._ensureContracts();
  s.lastWallTime = Date.now();
  const v = E.validateSave(e.exportSave(), e.data);
  if (!v.ok) throw Error(v.message);
  return JSON.parse(e.exportSave());
}
const mid = fixture(),
  deep = fixture(5),
  away = fixture();
away.state.house.catalogue = {
  enabled: true,
  recipeId: "bronze_swords",
  rotate: true,
  autoBuy: true,
  reserve: 0,
};
away.state.house.autoDeliver = true;
away.state.automation.spendCap = 1000;
away.state.workshop.smeltPolicy = {
  enabled: true,
  targets: { bronze: 12, iron: 8, steel: 8, mithril: 6 },
  reserve: 0,
};
const fixtures = { mid, deep, away };
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Campaign visual fixtures</title><style>body{background:#142129;color:#eee;font:17px system-ui;max-width:800px;margin:40px auto;padding:20px}button{padding:16px;margin:8px;background:#debc80;color:#121c21;font-size:16px}</style><h1>Campaign visual fixtures</h1><p>Controlled states for interface checking, not earned pacing evidence. These replace only localhost port8792 test data.</p><button data-key="fresh">Fresh house</button><button data-key="mid">Middle career</button><button data-key="deep">Fifth generation</button><button data-key="away">Two-hour return</button><script>const fixtures=${JSON.stringify(fixtures)};document.addEventListener('click',event=>{const key=event.target.dataset.key;if(!key)return;if(!['localhost','127.0.0.1'].includes(location.hostname)||location.port!=='8792')throw Error('Use QA port8792');for(const suffix of ['','-backup','-owner'])localStorage.removeItem('ember-iron-arena-v1'+suffix);if(fixtures[key]){fixtures[key].state.lastWallTime=Date.now()-(key==='away'?7200000:0);localStorage.setItem('ember-iron-arena-v1',JSON.stringify(fixtures[key]));}location.href='../../index.html';});</script></html>`;
fs.writeFileSync(path.join(__dirname, "../qa/campaign-review.html"), html);
console.log("Isolated campaign fixture page ready.");
