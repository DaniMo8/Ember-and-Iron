"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const E = require("../house-engine"),
  D = require("../data");
function glb(name) {
  const b = fs.readFileSync(
    path.join(__dirname, "../assets/house3d", name + ".glb"),
  );
  assert.equal(b.readUInt32LE(0), 0x46546c67);
  return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
}
test("every campaign recipe has a real model family, including all inherited research patterns", () => {
  const e = new E(structuredClone(D)),
    g = glb("catalogue"),
    names = new Set(g.nodes.map((n) => n.name));
  assert.equal(Object.keys(e.data.classes).length, 17);
  assert.equal(Object.keys(e.data.recipes).length, 340);
  for (const r of Object.values(e.data.recipes))
    assert(names.has("Kit_" + r.classId), r.id + " has no model");
  assert(names.has("Kit_ore"));
  assert(names.has("Kit_ingot"));
  assert(
    g.images.every((i) => i.bufferView != null),
    "The catalogue must remain self-contained offline",
  );
});
test("all eight rooms have self-contained art and the seven working rooms have earned stage nodes", () => {
  for (const room of ["smith", "mine", "smelter", "employees", "legacy"]) {
    const g = glb("room-" + room);
    assert(g.nodes.some((n) => n.name === "Room_" + room));
    assert(g.images.every((i) => i.bufferView != null));
    if (room !== "legacy")
      assert.deepEqual(
        [
          ...new Set(
            g.nodes.map((n) => n.extras?.stage).filter(Number.isInteger),
          ),
        ].sort(),
        [1, 2, 3, 4],
      );
  }
  for (const room of ["forge", "shop", "arena"]) {
    const g = glb("evolution-" + room);
    assert.deepEqual(
      [
        ...new Set(
          g.nodes.map((n) => n.extras?.stage).filter(Number.isInteger),
        ),
      ].sort(),
      [1, 2, 3, 4],
    );
  }
});
