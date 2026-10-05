// Walkable floor geometry is shared by visual routes and regression checks.
// Coordinates are [x,z]; furniture bounds include its widest body-height part.
export const VISIT_DURATIONS = {
  enter: 3500,
  browse: 6000,
  consider: 4000,
  checkout: 2800,
  leave: 4500,
  absent: 7000,
};
export const FLOOR_OBSTACLES = {
  forge: [
    { name: "hearth", x0: -3.03, x1: -1.42, z0: -2.35, z1: -0.61 },
    { name: "anvil", x0: -1.53, x1: -0.19, z0: 0.045, z1: 0.52 },
    { name: "bench", x0: 0.4, x1: 2.04, z0: -1.58, z1: -0.76 },
    { name: "finishing table", x0: 1.57, x1: 3.03, z0: 0.91, z1: 1.67 },
    { name: "quench barrel", x0: -3.0, x1: -2.3, z0: 1.06, z1: 1.76 },
  ],
  shop: [
    { name: "display table", x0: -1.4, x1: 0.28, z0: 0.23, z1: 1.01 },
    { name: "counter", x0: 1.15, x1: 2.85, z0: -0.91, z1: -0.04 },
    { name: "mannequin", x0: -3.04, x1: -2.42, z0: 1.05, z1: 1.69 },
    { name: "racks", x0: -2.63, x1: 1.1, z0: -2.18, z1: -1.59 },
  ],
};
export const FORGE_STATIONS = {
  heat: { position: [-1.05, -0.42], look: [-2.2, -1.05] },
  hammer: { position: [-0.815, 1.1], look: [-0.815, 0.28] },
  finish: { position: [0.66, -0.43], look: [1.1, -1.17] },
  idle: { position: [0.35, 1.18], look: [-0.8, 0.28] },
};
export const expand = (r, pad) => ({
  ...r,
  x0: r.x0 - pad,
  x1: r.x1 + pad,
  z0: r.z0 - pad,
  z1: r.z1 + pad,
});
export function crosses(a, b, r) {
  let near = 0,
    far = 1;
  for (const [axis, lo, hi] of [
    [0, r.x0, r.x1],
    [1, r.z0, r.z1],
  ]) {
    const delta = b[axis] - a[axis];
    if (Math.abs(delta) < 1e-9) {
      if (a[axis] <= lo + 1e-7 || a[axis] >= hi - 1e-7) return false;
      continue;
    }
    const p = (lo - a[axis]) / delta,
      q = (hi - a[axis]) / delta;
    near = Math.max(near, Math.min(p, q));
    far = Math.min(far, Math.max(p, q));
    if (near >= far - 1e-7) return false;
  }
  return far > 1e-7 && near < 1 - 1e-7;
}
export function planRoute(start, goal, obstacles, radius = 0.23) {
  const boxes = obstacles.map((r) => expand(r, radius));
  const nodes = [
    start,
    goal,
    ...boxes.flatMap((r) => [
      [r.x0 - 0.015, r.z0 - 0.015],
      [r.x0 - 0.015, r.z1 + 0.015],
      [r.x1 + 0.015, r.z0 - 0.015],
      [r.x1 + 0.015, r.z1 + 0.015],
    ]),
  ];
  const costs = nodes.map(() => Infinity),
    previous = nodes.map(() => -1),
    done = new Set();
  costs[0] = 0;
  while (done.size < nodes.length) {
    let i = -1;
    for (let k = 0; k < nodes.length; k++)
      if (!done.has(k) && (i < 0 || costs[k] < costs[i])) i = k;
    if (i < 0 || !Number.isFinite(costs[i])) break;
    if (i === 1) break;
    done.add(i);
    for (let j = 0; j < nodes.length; j++)
      if (!done.has(j) && !boxes.some((r) => crosses(nodes[i], nodes[j], r))) {
        const cost =
          costs[i] +
          Math.hypot(nodes[j][0] - nodes[i][0], nodes[j][1] - nodes[i][1]);
        if (cost < costs[j]) {
          costs[j] = cost;
          previous[j] = i;
        }
      }
  }
  if (!Number.isFinite(costs[1])) return [start];
  const path = [];
  for (let at = 1; at !== -1; at = previous[at]) path.unshift(nodes[at]);
  return path;
}
export function sampleRoute(path, progress) {
  const lengths = path
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let distance = Math.max(0, Math.min(1, progress)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? distance / lengths[i] : 0,
        a = path[i],
        b = path[i + 1];
      return {
        x: a[0] + (b[0] - a[0]) * t,
        z: a[1] + (b[1] - a[1]) * t,
        heading: Math.atan2(b[0] - a[0], b[1] - a[1]),
        distance: total * progress,
      };
    }
    distance -= lengths[i];
  }
  return { x: path[0][0], z: path[0][1], heading: Math.PI, distance: 0 };
}
export function crossesCircle(a, b, c, radius) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    length = dx * dx + dz * dz;
  const t = length
    ? Math.max(
        0,
        Math.min(1, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dz) / length),
      )
    : 0;
  return Math.hypot(a[0] + dx * t - c[0], a[1] + dz * t - c[1]) < radius - 1e-6;
}
export function routeAroundBodies(start, goal, bodies, radius = 0.74) {
  const blocked = (a, b) => bodies.some((c) => crossesCircle(a, b, c, radius));
  if (!blocked(start, goal)) return [start, goal];
  const arcRadius = (radius + 0.015) / Math.cos(Math.PI / 8);
  const nodes = [
    start,
    goal,
    ...bodies.flatMap((c) =>
      Array.from({ length: 8 }, (_, i) => [
        c[0] + Math.cos((i * Math.PI) / 4) * arcRadius,
        c[1] + Math.sin((i * Math.PI) / 4) * arcRadius,
      ]),
    ),
  ];
  const distance = nodes.map(() => Infinity),
    previous = nodes.map(() => -1),
    visited = new Set();
  distance[0] = 0;
  while (visited.size < nodes.length) {
    let next = -1;
    for (let i = 0; i < nodes.length; i++)
      if (!visited.has(i) && (next < 0 || distance[i] < distance[next]))
        next = i;
    if (next < 0 || !Number.isFinite(distance[next]) || next === 1) break;
    visited.add(next);
    for (let j = 0; j < nodes.length; j++)
      if (!visited.has(j) && !blocked(nodes[next], nodes[j])) {
        const d =
          distance[next] +
          Math.hypot(
            nodes[next][0] - nodes[j][0],
            nodes[next][1] - nodes[j][1],
          );
        if (d < distance[j]) {
          distance[j] = d;
          previous[j] = next;
        }
      }
  }
  if (!Number.isFinite(distance[1])) return [start, goal];
  const route = [];
  for (let at = 1; at >= 0; at = previous[at]) route.unshift(nodes[at]);
  return route;
}
const display = [-1.86, -1.02],
  counter = [2.0, 0.53],
  door = [0.25, 2.96];
export function visitorRoute(v) {
  const route = {
    enter: [door, [-0.2, 1.85], [-1.86, 1.85], display],
    browse: [display, display],
    consider: [display, display],
    checkout: [display, [0.86, -1.02], [0.86, 0.53], counter],
    leave:
      v.departure === "display" || (!v.departure && !v.itemId)
        ? [display, [-1.86, 1.85], [-0.2, 1.85], door]
        : [counter, [1.0, 1.65], door],
    absent: [door, door],
  };
  return route[v.phase] || route.absent;
}
