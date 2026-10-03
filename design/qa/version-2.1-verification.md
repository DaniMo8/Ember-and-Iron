# Version 2.1 verification

4 October 2026

## Implemented

111 room upgrades use fifteen selectable sections. Mine: Depth / Workers / Storage. Smelter: Alloys / Quality / Speed. Forge: Recipes / Quality / Speed. Shop: Price / Customer budgets / Customer relations. Customers: Classes / Quantity / Readiness. Each overlay shows one selected section, its balance, rank progress, exact costs and prerequisites.

Forge development now gates ordinary pattern discovery. Starting training pieces remain available at zero attributes. Smelter Quality adds preparation quality to newly started forging jobs, within the existing quality ceiling. Customer quantity nodes add predefined buyers and party capacity, with class prerequisites on buyers of newly unlocked classes. Readiness preserves health, combat, travel and recovery upgrades.

Legacy contains 36 talents across Workforce, Efficiency, Metallurgy and Archives. The twelve new powers cost 524 sparks; all talents together cost 828. A normal complete campaign awards 46–66. Benefits include six extra starting miners, upgrade rank growth reduced from 90% to 60%, four extra ingots per batch, and 34 permanent rare/legendary patterns. Starting bonuses apply once at creation; recipe attributes, mastery and metallurgy still matter.

## Automated checks

163 checks pass: 151 existing regressions plus twelve new upgrade and asset checks. Coverage includes branch registry and acyclic prerequisites, recipe gating, rejected out-of-order purchases, v2 purchase/discovery migration, quality capture, cost growth, inherited workers without reload duplication, ingot output and overflow, archive persistence, customer quantity/class separation, campaign spark affordability, and full atlas coverage.

Every old paid rank is retained. Older known recipes are remembered by migration. Future purchases use the new prerequisites. Existing pending crafts keep their paid inputs and captured quality.

The unchanged 45-minute deterministic active opening policy uses no resource, level or unlock grants. First craft: 1.70 minutes. First sale: 3.97 minutes. Level 2: 13.92 minutes. First victory: 18.03 minutes. At 45 minutes: level 3, 54 gold, 46 crafts, 31 sales, 3 wins, 32 retreats, 54 ingots and two workers. Sampled saves remained valid and no hero return was overdue. This is an opening smoke test, not a full campaign balance proof.

## Browser and build

Source and portable builds were reviewed on an isolated server at port 8791. The player's port 8777 save was untouched. Desktop review used 1440 × 1000; phone review used 360 × 800. All fifteen upgrade sections were opened in the portable phone build: every branch had cards, with no page or dialog horizontal overflow. Legacy sections were also reviewed on a phone, including a successful rare-archive purchase. Forge prestige and customer-class purchases updated their balances and prerequisites correctly. No browser errors were observed.

The portable game embeds the new scripts and atlas, and renders its inventory sprites through a shared image URL. It has no external script or stylesheet dependency. Documentation, catalogues, UI diagrams, item tree and Legacy diagrams were rebuilt.

## Blender assets

Blender 5.2.1 rendered 273 original inventory icons with Cycles: 255 ordinary equipment variants and 18 ores, ingots, catalysts and supplies. The 16 × 18 transparent atlas is 3072 × 3456 pixels. Representative renders were inspected at full icon size and in Mine, Smelter and Forge. Shop and equipped-item views share the same sprite helper. The atlas coverage test checks every current recipe and obtainable material. Legacy archive designs reuse the corresponding prestige silhouette; they do not have 34 additional unique models.

The editable scene, atlas and manifest are in `assets/inventory`; generation source is `design/tools/render_blender_icons.py`. Room background illustrations remain unchanged.

Evidence: `version-2.1-tests.txt`, `version-2.1-opening.json`, `version-2.1-branches.json`, and the version-2.1 screenshots in this directory.
