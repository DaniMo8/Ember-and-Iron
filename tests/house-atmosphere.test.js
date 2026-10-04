"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const S = require("../house-settings");
const A = require("../house-audio");
test("device options round-trip independently of career data", () => {
  const data = new Map([["ember-iron-arena-v1", "career"]]);
  const storage = {
    getItem: (k) => data.get(k),
    setItem: (k, v) => data.set(k, v),
  };
  const preferences = {
    ...S.defaults,
    transparency: 72,
    music: 0,
    muted: true,
  };
  assert.equal(S.write(storage, preferences), true);
  assert.deepEqual(S.read(storage), preferences);
  assert.equal(data.get("ember-iron-arena-v1"), "career");
});
test("invalid or unavailable storage falls back without blocking the game", () => {
  for (const value of ["bad JSON", "null", "123", '"bad"'])
    assert.deepEqual(S.read({ getItem: () => value }), S.defaults);
  const broken = {
    getItem: () => {
      throw Error("denied");
    },
    setItem: () => {
      throw Error("quota");
    },
  };
  assert.deepEqual(S.read(broken), S.defaults);
  assert.equal(S.write(broken, S.defaults), false);
});
test("option values clamp safely and zero volume survives normalization", () => {
  const p = S.normalize({
    transparency: 99,
    backgroundShade: -10,
    master: 500,
    music: 0,
    effects: NaN,
    muted: "false",
  });
  assert.deepEqual(p, {
    transparency: 85,
    backgroundShade: 0,
    master: 100,
    music: 0,
    effects: 45,
    muted: false,
  });
});
test("transparency changes surfaces only and zero dimming clears the scenery", () => {
  const values = {};
  const root = { style: { setProperty: (k, v) => (values[k] = v) } };
  S.apply({ transparency: 0, backgroundShade: 0 }, root);
  assert.equal(values["--panel-opacity"], 1);
  assert.equal(values["--scene-shade"], 0);
  S.apply({ transparency: 85 }, root);
  assert.ok(Math.abs(values["--panel-opacity"] - 0.15) < 0.00001);
  assert.equal(Object.hasOwn(values, "opacity"), false);
});
test("every room has a distinct original, bounded 32-bar score", () => {
  const titles = new Set(),
    signatures = new Set();
  for (const [room, theme] of Object.entries(A.themes)) {
    const score = A.score(room);
    titles.add(score.title);
    signatures.add(JSON.stringify(score.events));
    assert.equal(score.duration, (128 * 60) / theme.bpm);
    assert.ok(score.events.length > 400 && score.events.length < 700);
    let previous = -1;
    for (const e of score.events) {
      assert.ok(
        Number.isFinite(e.at) && e.at >= previous && e.at < score.duration,
      );
      assert.ok(e.duration > 0 && e.gain > 0 && e.gain <= 0.14);
      if (e.midi != null)
        assert.ok(Number.isFinite(e.midi) && e.midi >= 20 && e.midi <= 95);
      previous = e.at;
    }
    assert.deepEqual(score, A.score(room));
  }
  assert.equal(titles.size, 8);
  assert.equal(signatures.size, 8);
});
test("audio stays lazy until a user gesture and tolerates absent browser audio", async () => {
  const player = new A.Soundscape();
  player.setRoom("mine");
  player.setVolumes({ music: 0, muted: true });
  player.setVisible(false);
  player.effect("pick");
  player.stop();
  assert.equal(player.context, null);
  assert.equal(player.timer, null);
  assert.equal(await player.unlock(), false);
  assert.equal(player.room, "mine");
  assert.equal(A.score("unknown").title, A.themes.smith.title);
});
