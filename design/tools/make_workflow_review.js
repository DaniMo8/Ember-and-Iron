/* Render the actual UI in reproducible, controlled layout fixtures. No player save is read. */
"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const E = require("../../house-engine"),
  D = require("../../data");
const { browser, KEY } = require("../../tests/helpers/house-app-harness");
const output = path.join(__dirname, "../qa");
(async () => {
  const e = new E(structuredClone(D));
  e.command("create", {
    profession: "weaponsmith",
    smithName: "Rowan",
    name: "The Copper Hearth",
    stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
  });
  // A controlled rare patron and materials demonstrate layout; these are not earned pacing evidence.
  e.state.house.seen = ["forge", "shop"];
  e.state.house.orders = [];
  e._roll = () => 0;
  e._newContracts();
  for (const id in e.state.materials) e.state.materials[id] = e.binCapacity();
  e.markSaved(1000000);
  const t = browser({ now: 1000000 }, new Map([[KEY, e.exportSave()]]));
  await t.click("continue");
  await t.click("room", { room: "forge" });
  for (const [id, intent] of [
    ["hero", "team"],
    ["commission", "catalogue"],
    ["shop", "stock"],
    ["shop-floor", null],
  ]) {
    if (intent) await t.click("intent", { id: intent });
    else await t.click("room", { room: "shop" });
    if (intent === "catalogue")
      await t.click("commission-select", {
        id: t.engine.state.house.orders[0].id,
      });
    const html = t.nodes
      .get("#app")
      .innerHTML.replace(/(["'(])assets\//g, "$1/assets/");
    fs.writeFileSync(
      path.join(output, `workflow-layout-${id}.html`),
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/house.css"></head><body><nav style="padding:8px;background:#102122"><a href="#forge-design">Jump to design</a> · <a href="#review-bottom">Jump to end</a></nav><div id="app">${html}</div><p id="review-bottom">End of rendered snapshot</p><script>function report(){parent.postMessage({review:true,width:innerWidth,scroll:document.documentElement.scrollWidth},location.origin)}addEventListener('load',report);addEventListener('resize',report);</script></body></html>`,
    );
  }
  fs.writeFileSync(
    path.join(output, "workflow-layout.html"),
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Forge responsive review</title><style>body{background:#101b1c;color:#ead8b5;font:15px system-ui;margin:16px}button{padding:10px;margin:3px;background:#283c3e;color:#fff;border:1px solid #698487}iframe{display:block;margin:16px auto;border:1px solid #827652;width:390px;height:844px;max-width:100%}p{color:#bdc8c5}</style></head><body><h1>Forge layout review</h1><p>Static snapshots from the actual app renderer. Functional controls are tested separately in the live game.</p><nav>${[320, 390, 768, 1440].map((w) => `<button onclick="document.querySelector('iframe').style.width='${w}px'">${w}px</button>`).join("")}${["hero", "commission", "shop", "shop-floor"].map((id) => `<button onclick="document.querySelector('iframe').src='workflow-layout-${id}.html'">${id}</button>`).join("")}<button onclick="const f=document.querySelector('iframe');f.src=f.src.split('#')[0]+'#forge-design'">Design close-up</button><button onclick="const f=document.querySelector('iframe');f.src=f.src.split('#')[0]+'#review-bottom'">Bottom of screen</button></nav><p id="dimensions">Measuring layout…</p><script>addEventListener("message",e=>{if(e.origin===location.origin && e.data.review)document.querySelector("#dimensions").textContent="Viewport "+e.data.width+"px · content "+e.data.scroll+"px"})</script><iframe title="Forge layout" src="workflow-layout-hero.html"></iframe></body></html>`,
  );
  console.log("Wrote isolated responsive forge snapshots.");
})();
