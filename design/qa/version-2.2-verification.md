# Ember & Iron v2.2 verification

4 October 2026. Fixes following the independent v2.1 idle-game review.

## Changes checked

- Victory-led customer discovery: Breaker requires useful sales and wins; later classes require regional bosses. Fresh generations receive two Merits per victorious expedition and one for each of the first eight retreats. Existing balances and paid class discoveries survive migration.
- Earned ingot maintenance with input reserves, intermediate alloys, pending-output accounting and output-space checks. Forge automation enforces supply budgets, rare-input permission and optional useful-demand rules.
- Optional automatic clearance and stale-display rotation preserve protected, reserved, manually held and commission stock. Demand labels explain actual equipment compatibility and affordability.
- More direct support-upgrade paths, cumulative costs, pinnable rank goals and concrete next-point/upgrade previews. Optional employee shift management retains the cost of rest. Founders Strength also improves smelting speed.
- Compact desktop crafting, a persistent phone action bar identifying the selected item, earlier upgrade cards and accessible ingot-target controls. Recipe selection precedes the Forge sidebar on phones.

## Automated checks

`node --test tests/*.test.js`: **180 passed, zero failed**. Full output: [version-2.2-tests.txt](version-2.2-tests.txt).

The seventeen new workflow cases cover bounded defeat assistance; class milestones; customer versus clearance sales; old Merit carry-forward; automatic alloy dependencies, reserves and overflow prevention; online/offline/reload equivalence; rare crafting; protected clearance; atomic supply budgets; demand feedback; display rotation; goal costs; attribute preview accuracy; staff rest; malformed saves; and atomic multi-target settings. They also reject pinning a fully purchased upgrade and verify that a pinned rank completes after purchase. Existing queue, refund, combat, save, retirement and progression tests still pass.

Two older controlled recruitment fixtures now provide the newly required wins, useful sales and boss victories. Their intended class/quantity checks remain in place.

## Browser checks

All interactive tests used disposable saves on `127.0.0.1:8791`. The player's game/save on port 8777 was untouched. Advanced and Legacy fixtures were used to inspect controls; their granted resources are not progression evidence.

- At 1440 × 900, the desktop Forge Craft controls ended around 764 pixels from the top, within the initial viewport. Screenshot: [desktop Forge](version-2.2-forge-desktop.png).
- At 360 × 800, all six ordinary rooms and the unlocked Legacy screen had no horizontal page overflow. The Forge action bar remained visible at the bottom, with selected item, quality and time. A real Craft click queued a piece and deducted its ingredients. Screenshot: [phone Forge](version-2.2-forge-phone.png).
- The first phone upgrade card began around 276 pixels from the top. Pinning an upgrade and buying Measured strikes worked through the interface. Screenshot: [phone upgrades](version-2.2-phone-upgrades.png).
- Bought Furnace stockkeeper through the interface; set Bronze target 17, Iron target 9, reserve 2 and enabled maintenance. Editing more than one field survived live updates. Saving, reloading and reopening retained all settings.
- Inspected a completed shop item with a useful-customer/budget explanation. Inspected Legacy's four sections and the updated Founders Strength benefit.
- Opened the rebuilt portable HTML, allocated all twenty starting points from zero, created a smith and entered the Forge. Scripts and styles had no external references; room artwork and inventory sprites used embedded blob assets. No browser/network account is needed for the portable file.

The recorded six-room geometry is [version-2.2-layout.json](version-2.2-layout.json). Screenshot and geometry checks are bounded observations, not an exhaustive device/accessibility audit.

## Independent progression re-review

The idle-game enthusiast agent ran **three seeds × four schedules**, each with one earned active hour followed by two hours of active play, five-minute visits, fifteen-minute visits or no actions. It also ran three ninety-minute zero-crafting probes. No resources, levels or unlocks were granted. All sampled saves validated and no sampled return was overdue.

Stockkeeper was earned at 22.9–25.3 minutes and the first boss fell at 55.1–57.2 minutes. At three hours, active runs crafted 179–182 pieces, five-minute visits 148–149, and fifteen-minute visits 105–110. Prepared unattended runs continued producing, then correctly paused when the selected pattern no longer improved any customer. Defeat-only runs stayed at the initial three classes and eight Merits.

Read the [full re-review](idle-enthusiast-v2.2-review.md), including methodology, remaining suggestions and [raw results](idle-enthusiast-v2.2-probes.json). These are informed-policy measurements, not beginner guarantees. No scenario cleared boss three or retired; late-tier supply, pricing and Legacy balance remain unverified by natural playthroughs. No blanket price or timer increase was made in response to that evidence gap.

## Build and documentation

The source page and self-contained `Ember-and-Iron.html` contain the same v2.2 game. The portable build is 66,808,110 bytes and includes the existing room art and Blender inventory atlas. The specification, upgrade catalogue and current flow/layout diagrams were regenerated. JavaScript syntax and Git whitespace checks passed.
