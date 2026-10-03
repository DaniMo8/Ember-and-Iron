# Version 2.0 verification

4 October 2026

## Implemented workflow

Seven rooms: Smith (player name), Mine, Smelter, Forge, Shop, Customers and Legacy. New smiths start with four zero attributes and 20 assignable points. Customers have fixed identities and arrive automatically after their class is unlocked.

Smelting has an independent queue, exact ingredient escrow, five metal recipes, eight upgrades across three branches, and an animated hearth. Forge selection is recipe → material → enchantment. Chosen enchantments reserve catalysts and gold, then apply their suffix at completion. Finishing the same order gives diminishing +20 / +10 / +5 / +2 / +1 quality, with one normal craft duration added per pass. The current quality ceiling still applies.

## Automated checks

151 checks pass: 137 existing engine/regression checks and 14 Workshop checks. New coverage includes all four extreme zero-stat builds, fixed customer identity, ore/ingot separation, alloy gates and upgrade costs, smelting refunds, full output bins, simultaneous smelting and forging, online/offline/reloaded queues, repeated finishing, enchanted order escrow/refunds/completion, invalid craft choices, automatic class arrivals, old-save migration, retraining, Legacy and invalid save fields.

Old forge-ready material stocks become ingots one-for-one. Existing attributes, equipped items and customer identities are retained. Unfinished work keeps its paid ingredients and finishing time. Older engine compatibility fixtures remain part of the regression suite.

## Opening simulation

A deterministic 45-minute active opening run uses no granted resources, levels or unlocks. It manually mines, assigns workers, smelts bronze, spreads tier-1 crafts across classes, finishes early pieces, buys supplies and makes two early Forge investments. It only liquidates stock when storage is close to full.

- First craft: 1.70 minutes.
- First sale: 3.97 minutes.
- Smith level 2: 13.92 minutes.
- First quest victory: 18.03 minutes.
- At 45 minutes: smith level 3, 54 gold, 46 crafts, 31 sales, 54 ingots produced, 3 wins and 32 retreats.
- Sampled saves stayed valid; no overdue hero return remained.

This is a narrow opening smoke test, not an optimal-play or full-campaign balance estimate. Most early customers still retreat. More long-session play is needed to tune the added metallurgy investments. Details and samples: version-2.0-opening.json; reproducible policy: tests/workshop-speed-test.js.

## Browser review

Disposable saves on port 8791 were used; the player's port 8777 save was untouched. Checks covered zero-point creation, fixed starting customers, allocating all 20 points, player-name display, first bronze smelt feeding the Forge, repeated finishing, selecting iron and Flame Etching, cancelling an enchanted order for full ingredients plus 12 gold, and automatic Bren/Thane/Sable arrivals with their corresponding equipment types.

Desktop and 360-pixel phone layouts were reviewed. All seven navigation entries fit. Mine, Smelter, Forge, Shop and Customers had no horizontal page overflow or invalid-number text. No browser console errors were observed. The same source is bundled into Ember-and-Iron.html. The Smelter uses the existing forge-stage background illustrations with its own animated furnace and local stage conditions; no new raster artwork is included in this release.
