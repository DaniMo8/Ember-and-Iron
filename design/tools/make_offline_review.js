/* Controlled production fixtures. Only the separate localhost QA origin can load them. */
"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const E = require("../../house-engine"),
  D = require("../../data");
const game = new E(structuredClone(D));
function check(result) {
  if (!result.ok) throw Error(result.message);
}
check(
  game.command("create", {
    name: "Resume test",
    profession: "weaponsmith",
    stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
  }),
);
Object.assign(game.state.materials, {
  bronze_ingot: 8,
  wood: 8,
  bronze: 8,
  tin: 5,
  fuel: 8,
});
check(
  game.command("craft", {
    recipeId: "bronze_swords",
    quantity: 3,
    intent: "team",
  }),
);
check(game.command("smelt", { id: "bronze", quantity: 2 }));
for (const job of game.state.jobs)
  check(game.command("technique", { jobId: job.id }));
check(E.validateSave(game.exportSave(), game.data));
function fresh() {
  const e = new E(structuredClone(D));
  check(
    e.command("create", {
      name: "Resume test",
      profession: "weaponsmith",
      stats: { strength: 5, precision: 5, charisma: 5, knowledge: 5 },
    }),
  );
  Object.assign(e.state.materials, {
    bronze_ingot: 8,
    fuel: 8,
    wood: 8,
    leather: 8,
  });
  return e;
}
const contracts = fresh(),
  order = contracts.state.house.orders[0];
check(
  contracts.command("craft", {
    recipeId: order.recipeId,
    quantity: order.quantity,
    intent: "catalogue",
  }),
);
const shop = fresh();
const fullBin = fresh();
Object.assign(fullBin.state.materials, { bronze: 10, tin: 10, fuel: 10, bronze_ingot: fullBin.binCapacity() - 1 });
check(fullBin.command("smelt", { id: "bronze", quantity: 3 }));
shop.state.player.gold = 212;
shop.state.world.totalMined = 150;
function stock(quality, extra = {}) {
  const i = {
    id: shop._id("item"),
    recipeId: "bronze_swords",
    quality,
    createdAt: 0,
    displayed: false,
    protected: true,
    reservedFor: null,
    ...extra,
  };
  shop.state.inventory.push(i);
  return i;
}
check(shop.command("equip", { heroId: "mara", itemId: stock(60).id }));
stock(20);
stock(60);
stock(90);
stock(60, { treatment: "warding" });
stock(30, { intent: "stock", protected: false });
for (const e of [contracts, shop, fullBin])
  check(E.validateSave(e.exportSave(), e.data));
const output = path.resolve(__dirname, "../qa/offline-review.html");
fs.writeFileSync(
  output,
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Offline production review</title>
<style>body{background:#14212a;color:#eee;font:18px system-ui;max-width:800px;margin:8vh auto;padding:20px}button{padding:16px;margin:10px;color:#14212a;background:#ffd590;border:0;border-radius:6px;font:inherit}</style>
<h1>Offline production review</h1><p>Controlled test supplies; this is not a pacing test.</p>
<p>Three paid team swords with a finishing pass on each. Two bronze smelting batches. One working miner.</p>
<p>After one hour: three swords owned, the strongest equipped automatically, six new ingots, mined materials and empty paid queues. A short absence should retain unfinished work.</p>
<button data-seconds="5">Resume after 5 seconds</button><button data-seconds="3600">Resume after one hour</button><button data-seconds="0">Load active workshop</button>
<button data-fixture="contracts" data-seconds="3600">Resume completed contract</button><button data-fixture="shop" data-seconds="0">Review upgrades and equipment</button>
<button data-fixture="fullBin" data-seconds="3600">Resume full ingot bin</button>
<p id="status">Separate QA save on port 8792 only. Your normal game is untouched.</p>
<script>
const fixtures={production:${game.exportSave()},contracts:${contracts.exportSave()},shop:${shop.exportSave()},fullBin:${fullBin.exportSave()}};
for(const button of document.querySelectorAll('button'))button.onclick=()=>{
 if(location.hostname!=='127.0.0.1'||location.port!=='8792'){document.querySelector('#status').textContent='Use localhost port 8792 only.';return;}
 const fixture=fixtures[button.dataset.fixture||'production'];fixture.state.lastWallTime=Date.now()-Number(button.dataset.seconds)*1000;
 const key='ember-iron-arena-v1';localStorage.setItem(key,JSON.stringify(fixture));localStorage.removeItem(key+'-owner');localStorage.removeItem(key+'-backup');location.href=new URLSearchParams(location.search).has('portable')?'/Ember-and-Iron.html':'/index.html';
};</script></html>`,
);
console.log(
  "Offline fixtures generated for http://127.0.0.1:8792/design/qa/offline-review.html",
);
