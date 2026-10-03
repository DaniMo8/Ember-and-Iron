# Ember & Iron — The Foundry

A playable, local HTML blacksmith RPG with seven information-dense rooms, autonomous adventurers and a deliberately modest beginning.

## Play

Open **Ember-and-Iron.html** in a modern browser. This portable build embeds the code, styles and all sixteen location illustrations and the Blender inventory atlas. It works without an account, installation or internet connection. **index.html** runs the same game from the source files and the `assets` folder.

New players choose one of five professions and distribute 20 points. Attributes are uncapped; each smith level grants five more points. The seven rooms are **Smith (your name)**, **Mine**, **Smelter**, **Forge**, **Shop**, **Customers** and **Legacy**. Legacy is greyed out until the first tier 5 boss victory, then remains accessible across generations. Follow the single next-objective prompt, use the room’s information panels, or open its upgrades overlay.

You begin with 12 gold, basic supplies, one miner and three heroes. Mine copper, tin and coal, smelt bronze ingots, buy wood and leather in Mine or Forge, then forge useful equipment. Finished items occupy available displays. Customers browse, buy actual improvements, choose quests, retreat, recover and retry automatically.

The catalogue hides locked classes and tiers. A recipe remains visible if it is otherwise available but needs ingredients. Choose craft 1, 5 or the maximum affordable batch. Familiar classes gain proficiency; improving the same weapon competes with broadening a hero’s armour and accessories.

## Progression

- Five professions with distinct working bonuses; four uncapped attributes.
- 111 room upgrades across fifteen selectable sections, including fourteen Smelter upgrades.
- Individually assigned miners, automatic overflow assignments, seven workings and per-material storage.
- Seventeen item classes, 289 recipes (255 ordinary and 34 Legacy patterns), five material tiers, affixes, enchantments and quality breakthroughs up to 200.
- Three fixed starting customers; class unlocks attract further named customers automatically, up to twelve across six archetypes.
- Twenty quests, protected front/back lines, multi-round combat, 5-victory progression, recovery and commissions.
- Warehouse management, protected keepsakes, automatic restocking and optional salvage rules.
- Staff, furnishings, collection records and late automatic production rules.
- Defeat the tier 5 Void Sovereign to retire and open 36 permanent Legacy talents.

Mining earns **Prospecting**. Forge development spends **gold**. Shop development spends **Influence** earned through reputation. Adventurer development spends **Merits** earned by completed expeditions, including retreats. Repeated upgrade ranks cost 90% more; permanent Legacy talents can reduce that growth to 60%. First-rank costs and unlock requirements remain intact.

## Version 2.1.0 — Focused upgrades and Blender inventory art

Upgrade overlays have selectable sections across the top. Only the selected branch is shown, with rank progress, costs, benefits and prerequisites.

| Room | Main path | Other sections |
|---|---|---|
| Mine | Depth | Workers · Storage |
| Smelter | Alloys | Quality · Speed |
| Forge | Recipes | Quality · Speed |
| Shop | Price | Customer budgets · Customer relations |
| Customers | Classes | Quantity · Readiness |

Forge recipe investments unlock standard bronze and higher material patterns; the Master armoury unlocks prestige patterns. Attributes, mastery and material machinery still apply. Smelter Quality adds metal-preparation quality to newly started crafts. Readiness improves customer health, combat, recovery and travel. Quantity adds named buyers and party capacity; it requires the relevant class before adding a new customer of that class.

Legacy has **Workforce, Efficiency, Metallurgy and Archives** sections. Twelve new powers provide up to six extra starting miners, reduce room upgrade cost growth from 90% to 60%, add up to four ingots per batch, and unlock 17 rare plus 17 legendary patterns. Existing 24 talents remain. The new powers cost 524 sparks together, so a normal 46–66-spark campaign cannot buy the whole tree. Existing ranks, known patterns and paid jobs are retained when loading an older run.

**273 original Blender renders** replace symbolic inventory icons: 255 ordinary item variants and 18 ores, ingots, catalysts and supplies. The image atlas, manifest and editable `.blend` scene are in `assets/inventory`; reproduce them with `design/tools/render_blender_icons.py`. Legacy recipes share the appropriate class/material silhouette. Room background illustrations are unchanged.

Validation details: [upgrade, save, art and browser checks](design/qa/version-2.1-verification.md).

## Version 2.0.0 — Ore, alloys and customers

Name your smith and workshop, choose a profession, and distribute **20 points from a zero base**. All four attributes initially show 0. Your name appears in Smith. Customers keep fixed identities: Mara the Vanguard, Renn the Duelist and Wren the Ranger arrive first. Customer-class upgrades automatically attract further visitors and reveal equipment they can buy; there is no naming or class-selection form.

The new **Smelter** turns copper and tin into bronze, refines iron, and produces steel, mithril and starforged alloys. It has its own batch queue, animated hearth, ingredient refunds and three upgrade paths. Smelting continues alongside crafting and during offline progress. Full output bins discard excess metal.

**Forge** now follows recipe → material → enchantment. Queuing reserves both the ingredients and any enchantment fee. Finishing the same active or queued piece gives **+20, +10, +5, +2, then +1 quality**, limited by the forge ceiling. Each pass adds one normal craft duration; later passes offer diminishing prefix-chance gains too.

Existing runs retain their attributes, equipment, customers and unfinished work. Previously forge-ready metal stock becomes ingots one-for-one. The old forge furnace becomes a Power hammer; existing furnace investments unlock equivalent Smelter metallurgy. New generations use the zero-stat creation rules.

Validation: [151 checks, browser review and a 45-minute opening simulation](design/qa/version-2.0-verification.md).

## Version 1.4.2 — Shop stock at a glance

The Shop shows a compact warehouse list directly below its display shelves. Recent sales and the Warehouse / Craft stock shortcut buttons are removed. Stored items show their full name, material, quality and protection/reservation status, with direct Display, Sell and Scrap controls. Open an item for its complete details, enchantments and protection options. The list sorts by lowest quality first, and empty displays still restock automatically.

Automatic salvage settings now live inside Shop upgrades after unlocking the Salvage bench. Apply threshold saves an explicit quality limit without scrapping items while a number is being edited. All 137 automated checks pass, with desktop and phone checks for inventory actions, empty shelves and saved settings. See [verification](design/qa/version-1.4.2-verification.md).

## Version 1.4.1 — Three quest levels in every tier

Each tier now has **Level 1 → Level 2 → Level 3 → Boss**. Five victories at level 1 unlock level 2; five at level 2 unlock level 3; five at level 3 qualify the party for the boss. Defeating the boss opens level 1 of the next tier. There are 15 ordinary quests and five bosses. Party members still contribute one count each. Heroes continue reachable, unfinished quest levels toward five wins instead of treating the first victory as completion.

Smith shows **unspent attribute points** without an Improve smith button. Furnishings sit directly beneath People, before class mastery. Each has five permanent levels: each level adds the original bonuses, and prices rise by 2.4× per level. Cards show the current level, total bonuses, next gain and exact price. Existing purchases become level 1; levels survive Legacy.

Existing cleared bosses and already ordered boss parties retain their unlocked approaches, without granting extra loot, experience or Merits. Unfinished tiers gain the new intermediate quests. All 137 automated checks pass; a controlled accelerated company cleared all 20 encounters in order without stalls. See [verification](design/qa/version-1.4.1-verification.md).

## Version 1.4.0 — Five-win approaches and the Legacy hall

Each ordinary quest needs **5 hero victories** to open its next encounter. Each tier boss requires five on every earlier ordinary quest; the final boss checks all seven. Party members still contribute one count each. Enemy pressure reaches its existing ceiling at five counts. Previous boss clears remain required, and existing victory totals are retained.

Select heroes and press **Gather and launch** once. Ready parties depart immediately; away heroes finish their journey and recovery, then launch automatically when a berth is free. The reservation survives reload and offline play; **Cancel gathering** releases it. No repeat boss launches occur without another player order. Existing manual reservations wait for the new button.

**Legacy** is now a full screen with one ornate, permanent hall background, a prominent spark balance, retirement breakdown, collection records and four talent paths. It unlocks after the first Void Sovereign victory and remains available between generations; retirement still requires the current generation's final boss. Talent purchases are available before creating the next smith. Six-tab navigation fits desktop and phone.

Validation: 130 automated checks, plus desktop/phone interaction checks. See [version 1.4.0 verification](design/qa/version-1.4.0-verification.md).

## Version 1.3.7 — Progression at a glance

Each room now puts a large spendable balance beside a prominent gold upgrades button. A live indicator counts purchases that meet the actual currency and prerequisite requirements; otherwise it explains how to earn more points, or shows that the tree is fully developed. Smith uses the same treatment for attribute points and an Improve smith shortcut, with Legacy separately accessible. The progression control spans the phone layout for an easy touch target.

## Version 1.3.6 — Supplies sidebar and dim room transitions

Leather, wood and Alchemical Oil share one compact panel in the right-hand Mine and Forge sidebar. On phones it stacks above the work area. Room changes fade the artwork from dark to its dim resting level without the previous full-brightness flash. Panels stay readable, and reduced motion disables the fade.

## Version 1.3.5 — Responsive rooms and achievable requests

Mine uses a seam grid beside worker assignments, with stock and trading on each seam. Wide screens use more of the available width; phone layouts use readable recipe cards, compact empty shelves, stacked upgrade paths and a shorter hero roster. Changing rooms returns to the top.

All five rooms have three backgrounds. Established scenes require the tier 1 boss and local milestones. Grand scenes require generation 2+, the tier 4 boss in the current run, and late room milestones. **Room growth** shows the exact requirements.

Shop shows up to five open requests the smith can make, sorted by lowest tier then quality. There is no request-list button. Recipe discovery, machinery, attributes, mastery and attainable quality (including Quality finish) determine capability; temporary material shortages and full queues do not hide requests.

## Version 1.3.4 — Equipped items only

Adventurers show their detailed equipped items without forge suggestions or crafting shortcuts. Equipment requests remain in Shop → Customer requests.

## Version 1.3.3 — Hero screen layout

Hero profiles now lead with the name/class and live scene, followed by compact stats and XP, equipment compatibility, paired equipped-item/forge-upgrade rows, and one combined quest journal. Equipment includes material, quality, combat contributions, prefixes and enchantments. Recruitment and boss controls remain available beside the roster. The layout adapts to narrow screens.

## Version 1.3.2 — Quality finishing

Select Quality finish on active or queued work for +20 quality (up to the forge ceiling) and +10 percentage points prefix chance. It adds a complete normal craft's duration, doubling total time even when selected near completion. Queued estimates use current smith bonuses and are captured when a bench becomes available. No extra materials are charged. An older order with finishing already applied keeps its saved bonus and timing.

All 115 automated checks pass; see [finishing verification](design/qa/version-1.3.2-verification.md).

## Version 1.3.1 — Supplies and hero preparation

- Leather, wood and Alchemical Oil sit at the top of Mine and Forge with amounts and buy buttons. Oil is purchased for tier 3–5 patterns.
- Hero profiles show effective combat stats and XP, compatible item types, and forgeable upgrades compared with equipped gear.
- Choose the names and classes of starting heroes and later recruits.
- Employees sit below Smith attributes with XP, stamina, time off and manual return to duty. Larger mastery levels anchor the section; six stronger furnishings sit at the bottom.
- Coal first, coloured material diamonds, direct wood/leather purchases in Mine and Forge, and local buy/sell controls in Open workings.
- Weapons / Armour / Other filters; cloth, leather and mail protection, books/relics, instruments and talismans. Classes buy compatible gear.
- Training, standard and demanding prestige patterns. The next-pattern guide advances through training and standard gear.
- Five easiest requests, customers below them, and visible empty display slots.
- Frontline protection, two-round quests, three-round bosses, shorter travel, and 20 hero victories per ordinary quest path. Party victories add multiple counts.
- Exact refunds, lowest-quality-first restocking, Diablo-style prefixes/suffixes, tier bosses and late Legacy are retained.

The earlier v1.3 speed tests covered 18 simulated hours without grants; their timings precede the v1.3.1 oil requirement and v1.3.2 finishing time cost. The active six-hour run reached boss 3 at 325.5 minutes; the main stall was mastery/equipment between bosses 2 and 3. No returning heroes got stuck. See the verification reports for automated checks, controlled upgrade comparisons and remaining balance risks.

## Resetting a run

Open **Settings (menu) > Reset run**. A warning lists everything that will be erased, including Legacy sparks and talents. Choose **Cancel** to keep playing or **Yes, reset all progress** to return to character creation. Export is available before confirming. A reset grants no retirement rewards and replaces both the local save and its automatic backup.

## Saving

Progress saves locally with a backup. Use **Settings → Export save** before changing browsers, devices or file locations. Import validates the selected file before restoring it. Existing game saves migrate without discarding equipment or investments; old smiths receive the new point-allocation difference once.

One tab controls a workshop at a time. Other tabs are view-only; close the active tab and reload another to continue there. Up to eight hours of a continuous offline period are credited. Storage limits, safe reward delivery and procurement budgets continue to apply.

## Documentation

- [Complete illustrated specification](design/game-specification.html)
- [Editable specification](design/game-specification.md)
- [Game flow](design/diagrams/game-flow.svg)
- [Room layout](design/diagrams/ui-layout.svg)
- [Item tree](design/diagrams/item-tree.svg)
- [Room upgrade trees](design/diagrams/room-trees.svg)
- [Artwork gallery: all three stages](assets/gallery.html)
- [Artwork prompts and provenance](assets/ARTWORK.md)
- [Hero layout verification](design/qa/version-1.3.3-verification.md)
- [Supplies and hero-profile verification](design/qa/version-1.3.1-verification.md)
- [Company speed tests and balance findings](design/qa/version-1.3-verification.md)
- [Idle-game enthusiast review](design/qa/idle-enthusiast-v2.md)
- [Medieval enthusiast review](design/qa/medieval-enthusiast-v2.md)
- [Earlier accelerated AI playtest](design/qa/accelerated-playtest.md)
- [Full pricing audit](design/qa/economy-audit.md)

The earlier v0.5 and v1.0 portable games and design diagrams remain in `design/archive`.

## Development

Plain HTML, CSS and JavaScript; no package installation is required.

- `data.js`: original recipes, heroes, quests, effects and Legacy content.
- `campaign.js`: medieval patterns, prefixes/suffixes, quality grades and tier-boss data.
- `company.js`: chosen-company equipment classes, patterns, costs, furnishings and quest gates.
- `formation-combat.js`: deterministic protected front/back lines and multiple rounds.
- `progression.js`: professions, seams, recruitment access and all 96 room upgrades.
- `engine.js`: deterministic core simulation and save handling.
- `world-engine.js`: Foundry systems and migration.
- `workshop.js` / `workshop-engine.js`: ore refining, alloys, crafting choices, finishing passes and fixed customer arrivals.
- `room-model.js`: room stage milestones and hero-follow routing.
- `world-scenes.js`: compact live hero scenes for shopping, travel, battle and recovery.
- `app.js` / `styles.css`: seven-room interface, contextual overlays and accessible controls.
- `assets/*.png`: original generated full-screen illustrations.

Run checks:

```sh
node --test tests/*.test.js
node tests/company-speed-tests.js
node tests/company-balance.js
```

Build the portable game and update the specification:

```sh
python build_game.py
node design/tools/export_catalogue.js
python design/tools/build_document.py
```

To serve the source game locally:

```sh
python -m http.server 8777
```

Then open `http://localhost:8777/index.html`. The local build requires no external services. The documentation records the implemented formulas and the remaining need for longer-term human balance testing.
