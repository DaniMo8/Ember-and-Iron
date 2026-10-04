"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { watch } = require("../house-input");
function fixture() {
  const target = () => {
    const listeners = new Map();
    return {
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(listener);
      },
      send(type, values = {}) {
        for (const listener of listeners.get(type) || []) listener(values);
      },
    };
  };
  const document = target(),
    window = target();
  let clock = 0,
    paints = 0;
  const input = watch(document, window, () => clock);
  return {
    document,
    window,
    input,
    advance(ms) {
      clock += ms;
    },
    refresh() {
      if (!input.busy()) paints++;
      return paints;
    },
  };
}
test("a live refresh waits across a held mouse press and its delayed click", () => {
  const f = fixture();
  assert.equal(f.refresh(), 1);
  f.document.send("pointerdown", { button: 0, pointerId: 1 });
  f.advance(750);
  assert.equal(
    f.refresh(),
    1,
    "The original button must survive the scheduled refresh.",
  );
  f.document.send("pointerup", { pointerId: 1 });
  f.advance(300);
  assert.equal(
    f.refresh(),
    1,
    "A delayed compatibility click still needs the original target.",
  );
  f.advance(101);
  assert.equal(f.refresh(), 2, "Live updates resume after the gesture.");
});
test("releasing one touch cannot interrupt a second held touch", () => {
  const f = fixture();
  for (const pointerId of [1, 2])
    f.document.send("pointerdown", { button: 0, pointerId });
  f.document.send("pointerup", { pointerId: 1 });
  f.advance(1000);
  assert(f.input.busy());
  f.document.send("pointercancel", { pointerId: 2 });
  f.advance(401);
  assert(!f.input.busy());
});
test("Space and Enter activation keep the focused button intact until key release", () => {
  for (const [key, code] of [
    [" ", "Space"],
    ["Enter", "Enter"],
  ]) {
    const f = fixture(),
      target = { closest: () => ({ tagName: "BUTTON" }) };
    f.document.send("keydown", { key, code, target });
    f.advance(1500);
    assert.equal(f.refresh(), 0);
    f.document.send("keyup", { key, code });
    f.advance(401);
    assert.equal(f.refresh(), 1);
  }
});
test("typing keys and secondary mouse buttons do not latch the render guard", () => {
  const f = fixture();
  f.document.send("pointerdown", { button: 2, pointerId: 1 });
  f.document.send("keydown", {
    key: "a",
    code: "KeyA",
    target: { closest: () => null },
  });
  f.document.send("keydown", {
    key: " ",
    code: "Space",
    target: { closest: () => null },
  });
  assert(!f.input.busy());
});
test("focus loss and a hidden tab recover a press whose release happened outside the page", () => {
  for (const event of ["blur", "visibilitychange"]) {
    const f = fixture();
    f.document.send("pointerdown", { button: 0, pointerId: 1 });
    f.document.send("keydown", {
      key: " ",
      code: "Space",
      target: { closest: () => ({}) },
    });
    (event === "blur" ? f.window : f.document).send(event);
    f.advance(401);
    assert.equal(f.refresh(), 1);
  }
});
