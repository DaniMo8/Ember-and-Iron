/* Run the actual UI lifecycle with a controlled clock and shared browser storage. */
"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const E = require("../../house-engine");
const KEY = "ember-iron-arena-v1";
function browser(clock, storage = new Map(), owner = "test-tab") {
  const listeners = () => {
    const events = new Map();
    return {
      addEventListener(name, fn) {
        if (!events.has(name)) events.set(name, []);
        events.get(name).push(fn);
      },
      emit(name, event = {}) {
        return Promise.all((events.get(name) || []).map((fn) => fn(event)));
      },
    };
  };
  const nodes = new Map();
  const node = () => ({
    ...listeners(),
    innerHTML: "",
    textContent: "",
    style: { setProperty() {} },
    classList: { add() {}, remove() {} },
    scrollTop: 0,
    offsetWidth: 1,
    focus() {},
  });
  for (const id of ["#app", "#toast", "#modal-root", "#import-file"])
    nodes.set(id, node());
  nodes.set(".dialog", node());
  nodes.set(".modal-close", node());
  const document = {
    ...listeners(),
    hidden: false,
    activeElement: null,
    body: node(),
    documentElement: node(),
    querySelector: (s) =>
      s.startsWith(".modal") || s === ".dialog"
        ? nodes.get("#modal-root").innerHTML.includes('role="dialog"')
          ? nodes.get(s)
          : null
        : nodes.get(s) || null,
    querySelectorAll: () => [],
  };
  const window = { ...listeners(), scrollY: 0, scrollTo() {} };
  const timers = new Map(),
    instances = [];
  let nextTimer = 1;
  class ClockDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [clock.now]));
    }
    static now() {
      return clock.now;
    }
  }
  class ObservedEngine extends E {
    constructor(...args) {
      super(...args);
      instances.push(this);
    }
  }
  const context = vm.createContext({
    document,
    window,
    Date: ClockDate,
    crypto: { randomUUID: () => owner },
    location: { port: "8792" },
    console,
    localStorage: {
      getItem: (k) => storage.get(k) || null,
      setItem: (k, v) => storage.set(k, v),
      removeItem: (k) => storage.delete(k),
    },
    setTimeout: (fn, delay = 0) => {
      const id = nextTimer++;
      timers.set(id, { fn, at: clock.now + delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    setInterval: (fn, delay) => {
      const id = nextTimer++;
      timers.set(id, { fn, at: clock.now + delay, interval: delay });
      return id;
    },
    clearInterval: (id) => timers.delete(id),
    EIData: structuredClone(require("../../data")),
    EIWorkshop: require("../../workshop"),
    EIProgression: require("../../progression"),
    EIHouseData: require("../../house-data"),
    EIHouseCampaign: require("../../house-campaign"),
    EIHouseInput: require("../../house-input"),
    EIHouseSettings: require("../../house-settings"),
    EIHouseAudio: require("../../house-audio"),
    EIHouseEngine: ObservedEngine,
    EIInventory: { icons: {} },
    EIWorkshopEngine: require("../../workshop-engine"),
  });
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "../../house-app.js"), "utf8"),
    context,
  );
  return {
    storage,
    document,
    window,
    nodes,
    timers,
    get engine() {
      return instances.at(-1);
    },
    async step() {
      const next = [...timers].find(([, t]) => t.at <= clock.now);
      if (!next) return false;
      const [id, t] = next;
      if (t.interval) t.at = clock.now + t.interval;
      else timers.delete(id);
      t.fn();
      await Promise.resolve();
      return true;
    },
    async flush() {
      for (let runs = 0; runs < 100; runs++) {
        const pending = [...timers].filter(([, t]) => t.at <= clock.now);
        if (!pending.length) {
          await new Promise(setImmediate);
          if (![...timers.values()].some((t) => t.at <= clock.now)) return;
          continue;
        }
        for (const [id, t] of pending) {
          if (!timers.has(id)) continue;
          if (t.interval) t.at = clock.now + t.interval;
          else timers.delete(id);
          t.fn();
        }
        await Promise.resolve();
      }
      throw Error("UI timer did not settle");
    },
    async visibility(hidden) {
      document.hidden = hidden;
      await document.emit("visibilitychange");
      await this.flush();
    },
    async click(action, data = {}) {
      const button = { dataset: { action, ...data }, disabled: false };
      await document.emit("click", { target: { closest: () => button } });
      await this.flush();
    },
  };
}
module.exports = { browser, KEY };
