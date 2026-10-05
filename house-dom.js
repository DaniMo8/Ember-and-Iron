/* Preserve controls, focus and canvases while updating only changed UI nodes. */
(function (root) {
  "use strict";
  function key(node) {
    if (node.nodeType !== 1) return null;
    if (node.id) return "#" + node.id;
    const d = node.dataset;
    if (d?.action)
      return (
        node.tagName +
        ":" +
        JSON.stringify(
          Object.keys(d)
            .sort()
            .map((k) => [k, d[k]]),
        )
      );
    if (d?.ui) return "ui:" + d.ui;
    if (d?.setting) return "setting:" + d.setting;
    return null;
  }
  function patch(old, next) {
    if (old.nodeType !== next.nodeType || old.nodeName !== next.nodeName) {
      old.replaceWith(next);
      return next;
    }
    if (old.nodeType === 3) {
      if (old.nodeValue !== next.nodeValue) old.nodeValue = next.nodeValue;
      return old;
    }
    if (old.nodeType !== 1) return old;
    if (old.tagName === "CANVAS") return old;
    for (const a of [...old.attributes])
      if (!next.hasAttribute(a.name)) old.removeAttribute(a.name);
    for (const a of [...next.attributes])
      if (old.getAttribute(a.name) !== a.value)
        old.setAttribute(a.name, a.value);
    // Canvas backing buffers and scroll positions belong to the live view.
    children(old, next);
    if (old.tagName === "INPUT") {
      if (old.value !== next.value) old.value = next.value;
      if (old.checked !== next.checked) old.checked = next.checked;
    }
    if (old.tagName === "SELECT" && old.value !== next.value)
      old.value = next.value;
    return old;
  }
  function children(old, next) {
    const keyed = new Map(
      [...old.childNodes].map((n) => [key(n), n]).filter(([k]) => k),
    );
    let cursor = old.firstChild;
    for (const wanted of [...next.childNodes]) {
      const k = key(wanted),
        candidate = k ? keyed.get(k) : cursor && !key(cursor) ? cursor : null;
      if (candidate) {
        if (candidate !== cursor) old.insertBefore(candidate, cursor);
        const current = patch(candidate, wanted);
        cursor = current.nextSibling;
      } else {
        old.insertBefore(wanted, cursor);
      }
    }
    while (cursor) {
      const after = cursor.nextSibling;
      cursor.remove();
      cursor = after;
    }
  }
  function update(target, html) {
    if (!target || target.__html === html) return;
    // Minimal DOM environments retain a straightforward fallback for simulation tests.
    if (!target.ownerDocument?.createElement) {
      target.innerHTML = html;
      return;
    }
    const template = target.ownerDocument.createElement("template");
    template.innerHTML = html;
    children(target, template.content);
    target.__html = html;
  }
  root.EIHouseDOM = { update };
})(globalThis);
