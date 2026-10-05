# Ember & Iron — The House of the Hammer

A playable local HTML blacksmith RPG. Build a workshop, equip an owned gladiator team, fulfil contracts and earn the crown through craftsmanship.

## House 4.0 — the complete living campaign

**[Play Ember & Iron](index.html)**. The main game now combines the complete production, staff, arena and inherited-career systems with the living 3D rooms. The earlier [Atelier study](atelier.html) remains available as a separate, accelerated art/combat experiment; it is no longer needed to play the 3D campaign.

- All eight rooms have original Blender geometry. Hired specialists, resting employees, mining crews, the working smith and town browsers appear in their appropriate rooms. Seven rooms gain earned architectural additions; Legacy has its own memorial hall.
- The 340 recipes use 17 modular item families, including cloth, leather, mail, off-hand daggers, shields, tools and jewellery. Material, quality, pattern grade, treatment and enchantment change the visible piece. Forge options update a rotatable close-up; equipped items appear on the actual fighters, and displayed stock appears in the shop.
- Campaign bouts now advance a saved, deterministic combat state. Results are no longer calculated at launch. Front-line rules, damage, armour, wards, formations and progression keep their established balance; the 3D presentation adds approach, wind-up, impact, recovery, projectiles, damage cues and yielding. Original version-one replays remain playable.
- The whole economy continues offline, including active arena matches. Production escrow, protected commissions, automatic equipment/deliveries, full-bin smelting checks and the once-only return report remain covered by regressions.
- The Crown and 72 credited hours are both required for first Legacy access. Later generations add research, matched relic sets, oaths, inherited sigils and sixty Crucible trials. Mastering the final trial records the Eternal House ending, while the workshop remains playable.

The release review covers source readability, simulation correctness, asset coverage, responsive screens and rendering costs. The interface patches changed nodes instead of replacing controls and canvases. The renderer shares one GPU context, loads rooms on demand, reuses geometry, caches equipment and targets 30 fps on Balanced/Low or 60 fps on High. Hidden tabs stop drawing. Options retains illustrated backgrounds for lower-powered devices, reduced ambient motion, overlay transparency and audio controls.

The portable HTML embeds compressed models and expands them only when required. Play needs no account, CDN, network service or package installation. This is a local single-player game with authored rival houses, not a multiplayer ladder.

**Pacing evidence:** two earned first-generation runs, using the specified attendance pattern, reached Legacy at 120.25 and 144.25 elapsed hours, with 6 and 7 active hours respectively. These are prepared deterministic player policies, not a completion-time guarantee. See [release evidence](design/qa/house-release-4.json) for tests, limits and inherited-career results. Controlled late-game fixtures are reported separately from earned progression.

## Play

Open **[Ember-and-Iron.html](Ember-and-Iron.html)** for the portable game, or serve **[index.html](index.html)** with the source files. The portable edition embeds every script, style, background, miniature, inventory icon and compressed 3D model; it needs no installation, account or internet connection.

**House edition 4.0** keeps the existing House save, backup and active-tab ownership keys. Existing Classic saves are kept. The title/menu offers an explicit carry-over, with a preview of what is retained. **[classic.html](classic.html)** runs the preserved 2.3 game from the source folder. Export before changing browser or device.

**Menu → Options** offers live overlay transparency and background dimming, plus Readable, Balanced and Scenic presets. Master, music and effects volumes are independent, with a mute switch. Options are remembered on this device separately from the career. Eight original instrumental scores and procedural room sounds play locally after starting or continuing the game; they fade between rooms and pause when the page is hidden. No audio downloads are needed.

**Resume repair (3.2.4):** paid forge and smelter queues, including finishing passes, survive reopening. Mining, smelting, forging and enabled production/delivery automation advance during an absence, within the existing supply, storage and 24-hour limits. Catch-up finishes before live play can update the saved timestamp. An older tab reloads newer saved work before taking ownership, preventing it from overwriting paid queues. Imported saves also receive their elapsed production before being saved again. A resume popup shows earnings, production, new equipment, mastery gains, discoveries and completed studies, including productive short absences. Unread summaries are saved alongside production, survive reopening before Continue, and take priority over open upgrade windows. Suspended browser timers and returning from another window also trigger reconciliation; duplicate focus events cannot credit the same absence twice. Continue now explicitly reconciles time away: time on the title screen no longer runs as unreported live play, and closing from the title screen preserves the full absence. The title footer identifies the installed build.

**Item routing (3.2.2):** Contract orders stay in the warehouse and deliver automatically when enough qualifying pieces exist. Team commissions automatically equip a compatible fighter when they improve a combat stat; busy fighters wait until the bout ends, and spare gear stays protected. Shop stock fills display slots automatically, lowest quality first. Equipment suggestions hide equal or weaker pieces and show green gains/red tradeoffs. Ore licence locks remain; Mine upgrades distinguish the main ore path from optional exploration and list outstanding requirements. The Contract clerk now improves newly issued contract payments by 10%.

**Production balance (3.2.3):** mining crews take three times as long per load; manual loading takes 14 seconds. All equipment recipes need twice their previous ingots, including Legacy patterns. Supplies and enchanting charges are unchanged; already-paid crafts retain their original inputs and exact refunds. Smelting checks output space before each batch starts, including other furnaces’ committed output. A final partial batch can overflow, but later batches wait for room instead of wasting their inputs. The queue labels this state explicitly and resumes when ingots are used.

**Off-hand daggers (3.2.5):** classes that use daggers can equip them in either hand. Team armoury shows a separate comparison and equip button for each improving hand. Off-hand damage and bonuses contribute to combat while the main hand sets swing speed. Two-handed weapons still block the off hand. Team commissions can fill an off-hand upgrade without replacing a stronger main weapon. Saved equipment, warehouse returns and arena replays preserve the selected hand.

## The playable loop

**Mine → smelt → forge → automatic equipment or delivery → challenge → review → improve.**

- Seven callings, three origins and four working vows. Start with zero attributes and allocate 20 points; gain five per smith level, without an attribute cap.
- Eight rooms: **Smith, Mine, Smelter, Forge, Shop & armoury, Arena, Employees and Legacy**. First-visit introductions explain each room's purpose and its next step.
- Individually assigned miners; five material tiers; standard, toughened and spring-tempered ingots; protected team commissions, catalogue work and mastery practice.
- 17 item classes, 255 ordinary medieval patterns, 34 original Legacy patterns and 51 researched Oathbound, Astral and Eternal designs. Natural prefixes or deliberate treatments, enchanting suffixes, five diminishing finishing passes and quality ceilings up to 200.
- A fixed starting trio; free equipment comparisons/swaps; strict front/back lines; three rival styles; doctrines; five leagues. Each of three rungs needs five scoring match wins and all three styles, followed by a manually launched champion.
- Disclosed contracts finance the workshop. Town visitors buy spare displayed work while protected team gear and qualifying contract stock stay safe.
- Replays preserve the actual launch equipment, deterministic outcome and event log. Play, pause, step or scrub; rewatching never pays twice. The last twelve bouts are stored.
- Eight specialists in four employee departments, experience, stamina, manual leave and earned managed shifts. 59 room upgrade nodes plus 36 permanent Legacy talents.
- Gold buys ordinary development; mined materials, contracts and victories are access records. Repeated ranks cost 1.9×, reducible to 1.6× through Legacy. Furnishings cost 2.4× per rank and survive retirement.
- Ingot targets, contract catalogue production, automatic warehouse deliveries and cleared-rival exhibitions support prepared idle play. Offline work has a cumulative 24-hour allowance per absence and an explicit supply budget. A return ledger shows production, earnings, purchases, overflow and discoveries. Rotating contracts keep available work moving; exhibitions stop on defeat and never launch a champion. Only the first twelve suitable exhibition wins each day grant fighter XP.
- Legacy stays hidden until at least 72 credited hours and the fifth champion. Each promotion also needs current-material crafting and contracts; early-tier farming cannot replace that proof. Later careers shorten accreditation, while production and combat still matter. Defeat the fifth champion to retire. Choose a workforce, patron or archive charter; keep permanent talents, furnishings, chronicle and one chosen stored heirloom. A run reset has a typed warning and does not award sparks.

- Eleven discoveries reveal new methods, three enchantments and nine permanent research projects. Sixty increasingly difficult Crucible trials award persistent seals; optional oaths, inherited sigils and matched equipment sets give later careers different goals.
- Forty original Blender backgrounds: five fallback scenes for each of eight rooms, retained alongside the live 3D view. The mine has rough rock and packed earth, the smelter casting channels, the forge a masonry hearth, the arena fighting sand, and the house rooms warm timber interiors. Room investments and later generations change equipment and architecture quietly; the game does not reveal the thresholds.

## Design and verification

- **[Approved 3D diorama design book](design/diorama-design.html)**: room composition and evolution, visible employees/customers, item appearance rules, real-time arena design, responsive interface layouts and Blender production briefs. Its interactive figures remain planning diagrams; the main game implements all eight rooms with the complete campaign.
- **[Long campaign guide, flowcharts and background gallery](design/campaign-guide.html)**
- [House edition guide and room map](design/house-guide.html)
- [Independent long-campaign review](design/qa/house-campaign-review.md)
- [Automated test results](design/qa/version-4.0.0-tests.txt)
- [Offline resume browser checks](design/qa/offline-browser-checks.json)
- [Production balance and opening-hour checks](design/qa/production-balance-checks.json)
- [Persistent popup and full-bin browser checks](design/qa/production-browser-checks.json)
- [Continue-button regression and browser checks](design/qa/continue-browser-checks.json)
- [Off-hand dagger browser checks](design/qa/offhand-dagger-browser-checks.json)
- [Original room music and sound design](assets/AUDIO.md)
- [Original whole-game proposal](design/arena-loop-proposal.md)
- [Historical Classic specification](design/game-specification.html)

The scheduled player follows **one initial hour, then 15 minutes at hours 2, 4 and 6; later days use 15-minute visits at hours 0, 2, 4 and 6**. Overnight is simulated as offline work. No resources, equipment or levels are granted to earned runs. An informed first career reached the Crown at **100.08 elapsed hours**, about 4.2 days and 5.5 active hours; a conservative policy needed about 126 hours. The 72-hour floor prevents early retirement, but it does not guarantee victory at that time. These campaign timings predate the 3.2.2 automatic-delivery and equipment changes and 3.2.3 production rebalance; they are historical pacing evidence, not a newly measured campaign benchmark.

**325 automated checks pass**, including Classic compatibility, production escrow and cancellation, automatic delivery/equipment, full-bin waiting, once-only resume reporting, long-campaign gates and device preferences. New coverage verifies saved live combat, deterministic online/offline exchanges, old replay compatibility, persistent controls/canvases, all 340 recipe-to-model mappings, all eight room stages, and the final trial’s permanent ending. Source UI and the embedded portable build were exercised using isolated browser saves, including a fresh zero-stat character, return popups, gear previews, live bouts and replay seeking.

The portable build is approximately **45 MB**, including compressed 3D models, illustrated fallback rooms, inventory art and local music synthesis. Current visual checks cover desktop and phone layouts; older responsive checks also cover 320 and 768 pixels. The portable build was browser-tested over local HTTP. Direct `file://` navigation was blocked by the test browser, so opening the file directly remains unverified in that browser. See the [release evidence](design/qa/house-release-4.json) for the exact scope and limits.

## Code and development

No framework or package installation is required to play. Development tests and rebuilding the 3D bundle use the pinned dev dependencies (`npm ci`). Existing production, ownership and migration logic remains covered by the Classic regression suite. House-specific code is separated into:

| File                                                          | Responsibility                                                                                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `house-data.js`                                               | Callings, traits, room guidance, rivals, leagues, treatments and upgrade content                                                 |
| `house-combat.js`                                             | Serializable event-driven combat, deterministic advancement and bounded replay records                                           |
| `house-dom.js`                                                | Keyed updates that preserve controls, focus, scroll and live canvas buffers                                                      |
| `atelier/campaign-app.js` / `campaign-scene.js`               | Read-only full-campaign 3D presentation and lazy asset loading                                                                   |
| `house-3d.js`                                                 | Reproducible production bundle, including locally vendored Three.js                                                              |
| `house-engine.js`                                             | House economy, team ownership, contracts, progression, automation and explicit Classic conversion                                |
| `house-campaign.js`                                           | Accreditation, discoveries, research, inherited equipment families, Crucible trials, oaths, offline reporting and room evolution |
| `house-app.js` / `house.css`                                  | Event-delegated interface, responsive rooms, input preservation, introductions and overlays                                      |
| `house-settings.js`                                           | Validated, separate device preferences and live surface transparency                                                             |
| `house-audio.js`                                              | Eight original scores, synthesized instruments, procedural foley and bounded playback scheduling                                 |
| `house-input.js`                                              | Protects held mouse, touch and keyboard targets from periodic interface replacement                                              |
| `workshop-engine.js` and earlier engine modules               | Tested shared production, staff, materials, items, Legacy and Classic compatibility                                              |
| `build_game.py`                                               | Portable build in script order, embedded WebP fallback art and compressed GLB models                                             |
| `design/tools/render_themed_rooms.py` / `render_house_art.py` | Reproducible themed environments, five room stages and UI metalwork                                                              |
| `design/tools/render_house_fighters.py`                       | Reproducible fighter miniatures                                                                                                  |

The new code uses shared previews for commands and UI, atomic equipment moves, material/grade escrow, integer event deadlines, once-only payouts and bounded replay history. Simulation advances separately from rendering. Embedded artwork becomes one cached Blob URL per asset; there are no network or third-party font dependencies. See the guide for the audit's trade-offs and follow-up work.

The input fix defers automatic repainting during a press and its compatibility-click window. Simulation continues, and actions still validate current resources when activated. [Before/after browser checks](design/qa/input-browser-checks.json) reproduce the old missed-click behavior; [38 targeted checks](design/qa/input-regression-tests.txt) cover the repair and House regressions. Recreate the isolated browser fixture with `node design/tools/make_input_review.js` on port8792.

```sh
npm ci
npm test
npm run build:3d
# Additional earned progression review:
node design/qa/house-campaign-probe.js --label=review --days=7 --respond --stop-at-crown
python build_game.py
python -m http.server 8777
```

To regenerate original art, use Blender 5.x in background mode with the scene and fighter render scripts. PNGs are working outputs; the checked-in WebP files are the game assets. Editable source scenes are in `assets/house`.

The complete 3D library is reproducible with `design/tools/build_campaign_assets.py`, followed by `design/tools/package_campaign_rooms.py`, using Blender in background mode. Editable source is in `assets/house3d/house-source.blend`; the three original workrooms and character rig remain in `assets/atelier`. The shared item kits intentionally reuse topology and are not 340 separately sculpted models.

For isolated UI fixtures, run `node design/tools/make_campaign_review.js`, serve this folder on port **8792**, and open `design/qa/campaign-review.html`. The fixture page refuses other ports and never edits the normal 8777 save. These injected visual fixtures are not pacing evidence.

For resume checks, run `node design/tools/make_offline_review.js` and open `design/qa/offline-review.html` on that same isolated port. It offers short and one-hour absences with paid forge and smelter jobs, using controlled supplies.

## Historical Classic release notes

The following describes the separately preserved Classic game. The House edition above replaces its customers/quests loop with contracts and arena teams.

## Version 2.3.0 — The Employees room

Employees now have a dedicated room with **Mine, Smelter, Forge and Shop** departments. Eight named specialists learn from actual work, show their current bonuses and experience/stamina, and can take time off. The mining crew can also be hired and assigned here. Existing employees retain their levels, experience and stamina.

Twelve employee upgrades in **Training, Welfare and Organization** improve learning, specialist bonuses, rest, endurance and recruitment. Managed shift roster moves here with its original saved purchase preserved. Gold funds the new tree; prices grow exponentially. Smith retains attributes, furnishings and mastery.

**Original redesign proposal (now implemented in the separate House edition):** the idle enthusiast proposed a smithing house with an owned gladiator team, dependable contracts, rival-house leagues, deliberate equipment counters and saved replays. Explore the [interactive design atlas](design/arena-design-atlas.html), its five progression flowcharts and UI concepts, or read the [full proposal](design/arena-loop-proposal.md). This historical entry predates House edition 3.0; see its guide above for what shipped.

Validation: [191 tests and browser checks](design/qa/version-2.3-verification.md).

## Version 2.2.0 — Rewarding progression and dependable idle production

- Furnace stockkeeper (35g, smith level 2) maintains chosen ingot stocks, including intermediate alloys, input reserves and pending output. Automatic batches wait for space; manual batch buttons warn about potential overflow.
- Automatic production honours rare-input protection, supply reserves and offline budgets. Optional clearance sells surplus and outclassed stock while keeping protected, reserved, held and commission pieces. Demand-only production is optional.
- Breaker customers require 10 useful customer sales and 5 quest victories; Guardian and Mage require the tier 1 and tier 2 bosses respectively. Failed quests provide limited early assistance. Existing saves retain earned Merits and classes.
- Support upgrades follow shorter, purposeful paths. Cards show actual benefits, cumulative prerequisite costs and pinnable goals. Stats preview the next point, including rounded price and storage breakpoints.
- Shop stock explains current demand. Salvage bench can unlock optional stale-display rotation. Workshop shift roster (600g, smith level 5) can manage employee breaks, with rest still reducing output.
- Tighter desktop controls and a persistent phone crafting bar keep production accessible. Phone upgrade headings use less vertical space.
- Legacy costs and retirement rewards are unchanged; Founders Strength also grants 20% smelting speed.

See the [original idle review](design/qa/idle-enthusiast-v2.1-review.md), [follow-up review](design/qa/idle-enthusiast-v2.2-review.md) and [verification](design/qa/version-2.2-verification.md). All 180 automated checks passed. Twelve three-hour scenarios found no blocking regression in the covered opening; five- and fifteen-minute check-ins remained productive. Later tiers and Legacy still need longer natural playtests.

## Version 2.1.0 — Focused upgrades and Blender inventory art

Upgrade overlays have selectable sections across the top. Only the selected branch is shown, with rank progress, costs, benefits and prerequisites.

| Room      | Main path | Other sections                        |
| --------- | --------- | ------------------------------------- |
| Mine      | Depth     | Workers · Storage                     |
| Smelter   | Alloys    | Quality · Speed                       |
| Forge     | Recipes   | Quality · Speed                       |
| Shop      | Price     | Customer budgets · Customer relations |
| Customers | Classes   | Quantity · Readiness                  |

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
