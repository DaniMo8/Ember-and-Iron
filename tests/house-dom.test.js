"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  vm = require("node:vm"),
  fs = require("node:fs");
const { parseHTML } = require("linkedom");
function setup() {
  const { document } = parseHTML(
    '<html><body><div id="app"></div></body></html>',
  );
  const context = {};
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../house-dom"), "utf8"),
    context,
  );
  return {
    document,
    app: document.getElementById("app"),
    update: context.EIHouseDOM.update,
  };
}
test("screen updates preserve live canvas, button listeners and unchanged controls", () => {
  const { app, update } = setup();
  update(
    app,
    '<section><canvas id="forge-model"></canvas><button data-action="craft">Craft 1</button><strong>0 gold</strong></section>',
  );
  const canvas = app.querySelector("canvas"),
    button = app.querySelector("button");
  canvas.width = 512;
  let clicks = 0;
  button.addEventListener("click", () => clicks++);
  update(
    app,
    '<section><canvas id="forge-model"></canvas><button data-action="craft">Craft 1</button><strong>50 gold</strong></section>',
  );
  assert.equal(app.querySelector("canvas"), canvas);
  assert.equal(canvas.width, 512);
  assert.equal(app.querySelector("button"), button);
  button.click();
  assert.equal(clicks, 1);
  assert.equal(app.querySelector("strong").textContent, "50 gold");
});
test("keyed inventory reorders, removes sold items and inserts new pieces without duplicates", () => {
  const { app, update } = setup(),
    list = (ids) =>
      "<section>" +
      ids
        .map(
          (id) =>
            `<button data-action="inspect" data-id="${id}">${id}</button>`,
        )
        .join("") +
      "</section>";
  update(app, list(["a", "b", "c"]));
  const retained = app.querySelector('[data-id="b"]');
  update(app, list(["c", "b", "d"]));
  assert.deepEqual(
    [...app.querySelectorAll("button")].map((x) => x.textContent),
    ["c", "b", "d"],
  );
  assert.equal(app.querySelector('[data-id="b"]'), retained);
  update(app, "<main><h1>Smith</h1></main>");
  assert.equal(app.innerHTML, "<main><h1>Smith</h1></main>");
});
test("a changed node type cannot leave stale siblings in the new room", () => {
  const { app, update } = setup();
  update(app, "<div>old</div><p>tail</p>");
  update(app, "<main>new</main><aside>next</aside>");
  assert.equal(app.innerHTML, "<main>new</main><aside>next</aside>");
});
test("formation choices sharing an action keep both front and back buttons", () => {
  const { app, update } = setup(),
    buttons = (disabled) =>
      `<section><button data-action="line" data-id="mara" data-line="front" ${disabled ? "disabled" : ""}>Front</button><button data-action="line" data-id="mara" data-line="back" ${disabled ? "disabled" : ""}>Back</button></section>`;
  update(app, buttons(false));
  update(app, buttons(true));
  assert.deepEqual(
    [...app.querySelectorAll("button")].map((x) => x.textContent),
    ["Front", "Back"],
  );
});
