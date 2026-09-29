# Company chapter — verification and pacing review

29 September 2026 · version 1.3

## Delivered

Starting and hired heroes now have player-chosen names and classes. Smith shows employees below attributes, with XP, stamina and manual time off; enlarged class mastery levels and six costlier permanent furnishings complete the page. Mining uses coal-first coloured materials, local trade controls, and direct leather/wood purchases shared with Forge. There are 17 classes and 255 patterns, grouped as Weapons, Armour and Other, with class-specific cloth/leather/mail and new offhand, tool and charm families. Training, standard and prestige patterns differ substantially. The next-pattern guide skips prestige and names the actual forge machinery needed.

Shop shows all display slots, five easiest requests and then current visitors. Combat has protected front/back lines, two ordinary rounds and three boss rounds. Short travel leaves most expedition time for combat. Ordinary paths need 20 hero-victory counts; a winning trio contributes three, while a boss needs one clear.

## Accelerated ordinary play

Reproduce with `node tests/company-speed-tests.js`. The script runs isolated Node game instances, issuing normal commands every 30 simulated seconds; it never loads or changes a browser save. No currency, equipment, levels, quest wins or unlocks were granted. The policy mines shortages, hires/assigns up to four workers, spreads production over all available classes, finishes crafts, sells old stock, buys selected first-rank upgrades and launches a gathered boss party at a forecast of at least 65%. It recruits one Mage when a charter becomes available. It does not optimize enchanting, furnishings, or repeated specialization.

| Profile | Simulated time | Crafted | Expedition wins / losses | Smith level | Highest crafted tier | Gold at end |
|---|---:|---:|---:|---:|---:|---:|
| Active, staff given leave below 20 stamina and resumed at 95+ | 6 hours | 564 | 167 / 34 | 13 | 3 | 8,431 |
| Same broad policy, no staff leave | 4 hours | 387 | 111 / 37 | 10 | 2 | 2,862 |
| Untouched empty shop | 8 hours | 0 | 0 / 369 | 1 | None | 12 |

The two active profiles have different durations: their final totals are not a controlled percentage estimate of the staff benefit. In the first profile, employees reached level 5 through matching work except Runekeeper, which remained level 1 because the policy never enchanted. All four employees were exhausted by the end of the no-rest profile.

The staffed run's first craft completed at 1.5 minutes, first customer sale at 4, first smith level-up at 8 and first victory at 18. Boss 1 fell at 43.5 minutes; boss 2 at 68; boss 3 at 325.5. Legacy remained locked with zero available retirement rewards. Every sampled save validated, every run returned on schedule, no rejected command was recorded, and neither cargo nor a reward mailbox accumulated.

Raw output: `company-speed-tests.json`. The tier-3/4 prestige mastery thresholds were subsequently raised from 52/72 to 55/80 to keep them above the next material tier. Those prestige recipes require 46/66 attributes and were beyond the level-13 profile's reachable attributes; its practiced content and measured outcomes are unaffected. Current-data gates are covered by the final automated tests.

## Stall points and upgrade findings

1. **Boss 2 to boss 3 takes 257.5 minutes in the broad crafting policy.** Gold rises after the third hour while class proficiency and useful equipment lag. The path also has multiple 20-count ordinary encounters, and the policy deliberately waits for a 65% boss forecast. This is the main remaining pacing risk. A focused weapon/body crafting comparison is the next useful tuning experiment; reducing every cost would miss the bottleneck.
2. **The opening is harsh but recoverable.** The first victory arrives after 18 minutes and several retreats. Multiple cheap bronze recipes only break even at quality 45 when every input is purchased. Mining is therefore essential, and standard patterns become the practical income step. Clearance intentionally pays below replacement inputs.
3. **Staff need deliberate shifts.** Exhaustion takes 50 minutes from full stamina. Full recovery takes 10 minutes without furnishings, about 6.7 with the Rest Chamber, and about 5.9 with Chamber plus Brazier. Bonuses fade before zero stamina, then stop. Passive ownership of employees does not permanently accelerate the game; physical Quartermaster bin space is retained during rest.
4. **Training is valuable but did not replace equipment.** Against boss 3, a fixed level-6 trio in full iron standard quality-65 gear won 0/160 baseline trials. Training Yard rank 1 raised this to 1/160; rank 5 (55 Merits) to 47/160. Max Sparring Partners with its required first health rank (57 Merits total) won 49/160. Max early speed training plus first-rank prerequisites cost 229 and won 48/160. Cheapest health/attack training gives better early value than speed in this fixture, but none guarantees the boss.
5. **Defeat Merits remain the main passive currency risk.** An empty shop generated 369 from failed expeditions in eight hours. A separate fixture spent 323 on early training and still produced 0/160 first-boss wins with level-1 worn starting equipment, versus 0/160 before training. Catch-up points cannot clear that boss alone in this test, but later training inflation deserves observation.
6. **Prestige should outperform its tier.** It grants 1.95× the standard pattern's core combat stats and +12 quality, but costs more material and work and requires attributes above the next tier's entry point. It is deliberately omitted from the next-pattern guide. Tests enforce the higher gates for every class and tier. Natural late-game prestige acquisition time remains unmeasured.
7. **Furnishings are long-term purchases.** At balanced starting stats, the 420g Brazier changes a training sword from 49.34 to 45.04 seconds; the 700g Plaque adds exactly five quality. The 1,700g Rest Chamber and 2,600g Library are significant investments. Permanent bonuses across Legacy are intentional; these tests do not establish the ideal multi-generation return on investment.

## Controlled comparisons and economy checks

Reproduce with `node tests/company-balance.js`. This uses explicitly granted fixture equipment to compare identical seeds; it is not campaign progression evidence. There are 3,200 seeded boss outcomes: 18 upgrade/loadout cases ×160 seeds and two worn-gear defeat-Merit cases ×160. Tier-1 comparisons use weapon and body pieces only; tier-2 comparisons use full compatible loadouts. No prefixes or enchantments are supplied. Training costs include required parents at rank 1.

All 255 recipes were priced at quality 1, 45, 100 and 200: 1,020 comparisons. Customer prices stayed positive and town clearance stayed below current replacement inputs. The regression suite also checks maximum legitimate material discounts and raw-material resale. Raw comparisons and furnishing effects are in `company-balance.json`.

## Regression and interface checks

`node --test tests/*.test.js` passes **101/101**. New coverage includes chosen names/classes and save identity; invalid and duplicate creation names without partial mutation; paid empty recruitment slots; Mage cloth compatibility; employee effects, work XP, exhaustion, leave and offline equivalence; permanent physical storage; furnishing effects and Legacy retention; all pattern gates; strict rear-line protection, deterministic multi-round replay and bounded combat logs; party contributions toward 20; pressure stopping at 20; old-save migration; and exact old in-progress recipe escrow refunds after costs change.

Browser checks use separate test origins, leaving the user's port-8777 workshop untouched. Creation accepted custom names/classes and correctly exposed Mage equipment. Smith employee XP/stamina and leave/resume actions worked; the narrow 390px layout had no horizontal overflow. Forge groups and the next-tier guide showed the expected patterns. Mine showed coal first, direct supplies and per-working trade controls. Shop showed six empty displays and only the five lowest-tier/quality requests from nine seeded requests. Adventurers showed selected hero identities, front/back health, two-round ordinary battles, three-round boss battles and 20-count bars. Paid charters opened name/class selection, and the chosen recruit appeared in the company. No browser console errors were recorded in these checks.

The source and standalone `Ember-and-Iron.html` share the same code. The portable build embeds all fifteen illustrations and requires no external scripts or styles. Existing saves migrate instead of being reset. Historical item instances are retained; new purchases enforce the expanded class compatibility.

## Limits

No natural full tier-5 campaign or multi-generation economy was completed in this update. Estimates are seeded simulations, not guaranteed win probabilities. The broad automatic play policy is repeatable but not a substitute for human pacing sessions. The mastery gap and defeat-Merit accumulation are reported for the next balancing pass; they have not been hidden by granting resources or lowering the requested 20-victory gates.
