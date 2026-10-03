# Ember & Iron v2.2 — idle-game enthusiast re-review

4 October 2026 · Review of the updated working tree

## Verdict

The early game is substantially healthier. The workshop now supports useful five- and fifteen-minute check-ins after an earned setup, and unattended heroes continue generating progress. Customer classes require achievements instead of repeated failure. I found no blocking regression in the covered simulations.

Keep this direction. Do not broadly increase timers or prices yet: the next balance work should measure later material tiers and Legacy, rather than make the improved opening more tedious.

## What was tested

I inspected the new engine, upgrade definitions, UI code, focused workflow tests, and v2.2 desktop/phone screenshots. Live browser checks were handled separately by the main implementation agent.

The simulation ran **three seeds × four attention schedules**, twelve scenarios in total. Each seed used a fresh balanced Bladesmith, earned the first hour through ordinary commands, then continued for two more hours with:

- Active attention every seven seconds, matching the mining cooldown.
- One visit every five minutes.
- One visit every fifteen minutes.
- No further player actions.

Preparation was identical within each seed. Checkpoints were reused for efficiency where possible. No gold, materials, levels, upgrades, recipes or equipment were granted; only the initial random seed differed. The policy bought the Furnace stockkeeper and Quartermaster when affordable, set a twelve-bronze-ingot target, and enabled production of two useful pieces of a selected pattern, with clearance, supply buying, a ten-gold reserve and a sixty-gold offline purchase limit. Non-active intervals used the offline simulation path.

The policy uses demand previews to pick equipment, buys sensible early support upgrades, and launches a boss only after a forecast of at least 65%. It is an informed synthetic player, not a novice or an optimal strategy. Every sampled save validated, and no sampled expedition was overdue on its return. A separate ninety-minute zero-crafting probe was repeated on all three seeds.

## Measured results

Across the three seeds, the stockkeeper was earned at **22.9–25.3 minutes**, the Quartermaster at **32.7–39.0 minutes**, and the first boss was beaten at **55.1–57.2 minutes**. First useful sale was about four minutes; first victory ranged from 17.6 to 21.4 minutes. These are observed policy outcomes, not universal pacing targets.

| Attention after the first hour | Crafts by 3 hours | Sales by 3 hours | Gold held at 3 hours | Second boss defeated |
|---|---:|---:|---:|---|
| Active | 179–182 | 176–179 | 1,502–1,541 | 83.1–88.0 min |
| Five-minute visits | 148–149 | 147–148 | 1,206–1,306 | 87.1–91.3 min |
| Fifteen-minute visits | 105–110 | 105–110 | 889–942 | 96.5–97.2 min |
| Unattended | 66–72 | 66–72 | 595–636 | Not launched |

Five-minute visits preserve much of the production and almost all early boss progress. Fifteen-minute visits remain productive with a clear throughput tradeoff. Active play earns more equipment, smith experience and cash. This is a useful reward for attention without making continuous clicking compulsory.

During the **first unattended hour**, the prepared workshop added **8–13 crafts, 9–13 sales, 29–30 quest victories and 246–274 gold**. Eventually demand-only forging paused because nobody needed the selected pattern. Ingot stocks remained at twelve or thirteen and the reason was shown explicitly; this was a demand pause, not the old broken supply chain. Quests continued earning rewards. The boss gate correctly waited for a player decision.

## Original concerns: outcome

**Defeat-funded class unlocks — fixed.** All three zero-crafting probes finished ninety minutes with 69 retreats, eight Merits, no wins and only the original three classes. Breaker remained blocked by useful-sales and victory milestones. The eight-point allowance was enough to buy the Companion charter if saved for it. In the informed progression runs, class unlocks followed sales and boss achievements.

**Broken mine → smelter → forge automation — fixed in the covered opening.** Every seed earned and enabled both automation components. Automatic smelting replenished consumed ingots, respected its targets and let production continue during check-in intervals. Intermediate-alloy replenishment, capacity protection and online/offline/reload consistency also have focused regression coverage. These opening probes primarily exercised bronze production, not a sustained tier-five supply chain.

**Inactive automation controls — addressed.** Clearance and rare-input permission now affect real engine behaviour. Code and focused tests cover held, reserved, protected and commission pieces, while the earned runs exercised ordinary clearance. The rare-material guards were not reached naturally during these short runs; they were reviewed through the dedicated controlled tests.

**Unrelated prerequisite purchases — improved.** Crew slots, benches, displays and useful support investments have more direct routes. Salvage now costs 22 Influence along its required path instead of 52. Pinning a goal and showing its remaining path makes saving more understandable. Material and recipe progression remain deliberate commitments.

**Weak feedback and excessive scrolling — improved.** Item demand labels explain why stock will or will not sell; next-point and upgrade previews show concrete benefits and quality-cap limits. The revised desktop screenshot exposes Craft controls in the first screen, and phone upgrades reach their first card much earlier. During this review, the main agent also added selected-recipe context to the fixed phone Craft bar and moved recipe selection ahead of the supplies sidebar.

**Stats, finishing and Legacy — retain the approach.** Diminishing attributes now have clearer previews; finishing still offers a meaningful time/quality decision. The late Workforce talent now adds smelting speed as well as starting Strength. The new optional shift roster preserves stamina management while providing a later convenience purchase. I did not earn these late systems in the opening simulation, so this is design/code feedback rather than measured long-run balance.

## Remaining feedback

1. **Medium, design follow-up: distinguish useful production from mastery practice.** Demand-only pauses are now correct, but they can also stop progress toward the next proficiency gate. A future explicit “Practice this class and clear practice stock” preset could show expected mastery gain and the lower town-sale return. Keep the choice; do not make customers buy endless duplicates to hide it.
2. **Medium, guidance: explain the limited early assistance.** The first eight retreat Merits can fund pairs, but can also be spent on health, recovery or attack. Our policy spent on cheaper support first and delayed the Companion charter into the opening half-hour. It still won and progressed, so this was not a lock. Explain the allowance and make the pair upgrade easy to pin when repeated solo retreats are the current obstacle.
3. **Low, later automation depth: offer a small production list as an earned upgrade.** A single-pattern policy eventually stops after its buyers are equipped. Five-minute visits solved this by changing patterns. A later two- or three-pattern priority list would provide a satisfying next convenience milestone, while keeping material choices, new recipes and bosses in the player's hands.
4. **Balance evidence still needed after tier two.** No scenario defeated the third boss or retired. The policy also used a simple party selection and only limited higher-alloy investment. The observed mid-run slowdown is not proof of an impossible progression gate. Test focused weapon mastery, broader support equipment, tier-three oil spending, and a second generation before adjusting late prices or Legacy rewards.

The original v2.1 opening used a different, simpler buying/crafting policy. Comparisons to it establish that the missing functionality is repaired; they should not be read as a controlled estimate of how much faster v2.2 is. The current attention schedules are comparable to one another within each seed.

Evidence: `idle-enthusiast-v2.2-probes.json`. Reproduce with `node design/qa/idle-enthusiast-v2.2-probes.js`; `--resume` continues completed scenarios without rerunning them. Production code and pricing were not edited by the reviewer.
