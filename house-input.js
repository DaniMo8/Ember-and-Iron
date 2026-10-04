/* Keep live refreshes from removing a native click target mid-gesture. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EIHouseInput = factory();
})(globalThis, function () {
  "use strict";
  function watch(document, window, now = Date.now) {
    const pointers = new Set(),
      keys = new Set();
    let settleUntil = 0;
    // Touch browsers may emit their compatibility click after pointerup.
    const settle = () => {
      settleUntil = now() + 400;
    };
    const reset = () => {
      pointers.clear();
      keys.clear();
      settle();
    };
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (event.button === 0) pointers.add(event.pointerId);
      },
      true,
    );
    for (const type of ["pointerup", "pointercancel"])
      document.addEventListener(
        type,
        (event) => {
          if (pointers.delete(event.pointerId)) settle();
        },
        true,
      );
    document.addEventListener(
      "keydown",
      (event) => {
        if (
          [" ", "Enter"].includes(event.key) &&
          event.target.closest?.("button, a[href], [role='button']")
        )
          keys.add(event.code || event.key);
      },
      true,
    );
    document.addEventListener(
      "keyup",
      (event) => {
        if (keys.delete(event.code || event.key)) settle();
      },
      true,
    );
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    return {
      busy: () => pointers.size > 0 || keys.size > 0 || now() < settleUntil,
    };
  }
  return { watch };
});
