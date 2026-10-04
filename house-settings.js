/* Device preferences are independent of a career, reset or imported save. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EIHouseSettings = factory();
})(globalThis, function () {
  "use strict";
  const key = "ember-iron-preferences-v1",
    defaults = {
      transparency: 40,
      backgroundShade: 25,
      master: 60,
      music: 40,
      effects: 45,
      muted: false,
    };
  function normalize(value = {}) {
    const result = { ...defaults };
    if (!value || typeof value !== "object") return result;
    for (const name of [
      "transparency",
      "backgroundShade",
      "master",
      "music",
      "effects",
    ])
      if (Number.isFinite(value[name]))
        result[name] = Math.round(
          Math.max(
            0,
            Math.min(
              name === "transparency"
                ? 85
                : name === "backgroundShade"
                  ? 70
                  : 100,
              value[name],
            ),
          ),
        );
    if (typeof value.muted === "boolean") result.muted = value.muted;
    return result;
  }
  function read(storage) {
    try {
      return normalize(JSON.parse(storage.getItem(key) || "{}"));
    } catch {
      return { ...defaults };
    }
  }
  function write(storage, value) {
    try {
      storage.setItem(key, JSON.stringify(normalize(value)));
      return true;
    } catch {
      return false;
    }
  }
  function apply(value, root) {
    const p = normalize(value),
      opacity = 1 - p.transparency / 100;
    root.style.setProperty("--panel-opacity", opacity);
    root.style.setProperty("--panel-end-opacity", Math.min(1, opacity + 0.08));
    root.style.setProperty("--card-opacity", Math.max(0.15, opacity - 0.2));
    root.style.setProperty("--scene-shade", p.backgroundShade / 100);
    return p;
  }
  return { defaults, normalize, read, write, apply };
});
