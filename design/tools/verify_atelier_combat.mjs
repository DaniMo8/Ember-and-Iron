import { appearance, simulateBattle } from "../../atelier/core.js";
import { writeFileSync } from "node:fs";

const equipment = [
  ["Starter bronze", { quality: 35, material: "bronze" }],
  ["Ordinary steel", { quality: 90, material: "steel" }],
  ["Piercing steel", { quality: 120, material: "steel", prefix: "piercing" }],
  [
    "Fine enchanted steel",
    { quality: 180, material: "steel", prefix: "piercing", enchant: "flame" },
  ],
  [
    "Exhibition starforged",
    {
      quality: 200,
      material: "starforged",
      prefix: "piercing",
      enchant: "starlight",
    },
  ],
];
const rows = [];
for (const [gear, input] of equipment)
  for (const doctrine of ["balanced", "pressure", "bulwark"]) {
    const bouts = Array.from({ length: 24 }, (_, i) =>
      simulateBattle(appearance(input), i + 1, doctrine),
    );
    rows.push({
      gear,
      doctrine,
      bouts: 24,
      wins: bouts.filter((b) => b.status === "won").length,
      draws: bouts.filter((b) => b.status === "draw").length,
      minSeconds: Math.min(...bouts.map((b) => b.tick / 20)),
      maxSeconds: Math.max(...bouts.map((b) => b.tick / 20)),
      averageSeconds: +(
        bouts.reduce((sum, b) => sum + b.tick / 20, 0) / 24
      ).toFixed(1),
      averageHits: +(
        bouts.reduce(
          (sum, b) => sum + b.events.filter((e) => e.type === "hit").length,
          0,
        ) / 24
      ).toFixed(1),
      misses: bouts.reduce(
        (sum, b) => sum + b.events.filter((e) => e.type === "miss").length,
        0,
      ),
      stalled: bouts.filter(
        (b) =>
          b.status === "draw" &&
          b.tick -
            (b.events.filter((e) => e.type === "hit").at(-1)?.tick || 0) >
            160,
      ).length,
    });
  }
const report = {
  scope: "Accelerated four-fighter 3D study; not campaign pacing",
  seedCount: 24,
  totalBouts: 360,
  rows,
};
writeFileSync(
  "design/qa/atelier-combat-benchmark.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.table(rows);
if (rows.some((r) => r.stalled)) process.exitCode = 1;
