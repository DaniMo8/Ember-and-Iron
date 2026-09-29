# Version 1.1 verification

26 September 2026. Tested on separate local browser origins; the user's save was not replaced, edited or accelerated.

## Automated and accelerated checks

- 80 tests passed: original simulation/flow, Foundry systems, return-home regressions, economic exploit checks and presentation rules.
- Separate AI tester ran 28 simulated hours. See accelerated-playtest.md (22-hour baseline) and economy-audit.md (6 hours after pricing fixes).
- Full bins plus25 delivery slots no longer stall returns; pending old saves migrate, and50 repeated successful deliveries award once each.
- Hero activity routing tested through browsing, travel, combat, return, failure recovery and browsing again.
- Room stages are read-only, independent of each other and based on real milestones.
- All15 backgrounds exist, all diagram SVGs parse, and the portable build contains all scripts/assets without external script references.

## Browser verification

- Source dashboard: five rooms rendered; compact metrics, worker assignments, available recipe filters, crafting, careful finish and market inspected.
- Adventurers: selected hero, actual combat health and log, phase countdown, equipment gaps, quest history and Follow hero inspected. Observed automatic return-to-shop routing and manual navigation cancelling follow.
- Legacy: correct reward breakdown, locked retirement for an ineligible character, new price formulas and old-save preservation covered by regression tests.
- Portable game: loaded from a fresh origin, normal character creation with12gold/3heroes/1miner; created a sword, assigned the worker to coal and opened raw trading. No floating image hotspot controls or horizontal page overflow at desktop width.
- Portable background defect found and fixed: multi-megabyte data URIs exceeded CSS custom-property limits. Embedded images are now decoded once into local Blob URLs; visible backgrounds verified after rebuilding.
- Narrow layout inspected in a390px iframe: stacked panels, compact header/navigation and normal vertical scrolling. No claim of exhaustive phone-device testing.
- Art gallery visually reviewed: ten humble/middle assets are distinct, and five grand originals remain unchanged.

## Remaining tuning

Long-run completion times for all96 upgrades and all24 Legacy talents still need multi-day, multi-seed and human testing. The agent policies are reproducible examples, not guarantees of a human player's pacing. The reports identify further late material/worker and twelve-hero throughput questions. Already-earned Legacy sparks remain intact intentionally, so a pre-update high-spark save retains its purchasing power.

## Reset run verification (v1.1.2)

Tested on the separate portable-game QA origin at127.0.0.1:8779. The warning explicitly names all progress, including Legacy and the automatic backup. Cancel preserved the existing smith and experience. Confirm returned to character creation; reloading stayed there. Creating a new smith restored12gold, level1, zero crafted items/reputation and generation1. The user's game origin at port8777 was not reset. Source syntax and portable rebuild passed.
