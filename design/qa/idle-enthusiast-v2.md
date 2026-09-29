# Idle-game enthusiast AI review — campaign v2

This is an AI review through an idle-game enthusiast lens, backed by deterministic engine simulations. It is not a human playtest. Final measured results are in `idle-enthusiast-v2.json`.

## Method

The active policy starts with the real 12 gold, one worker, three heroes and normal material allowance. It makes decisions every 30 simulated seconds: mines scarce stock, buys small wood/leather supplies, fills useful equipment categories, finishes crafts, sells stale stock, purchases affordable first-rank upgrades and gathers a three-hero boss party when the estimated chance reaches 65%. It does not grant currency, levels, equipment or quest wins. The second profile leaves a new empty shop unattended for eight hours.

Separate synthetic fixtures grant prerequisite wins and full equipment in every compatible slot, including slots not yet normally unlocked, to isolate all five boss launch/return paths, party gathering, tier gates and Legacy checks. These fixtures are not evidence of a normal full-campaign completion.

## Final measured results

| Measure | Four-hour active manager | Eight-hour untouched shop |
|---|---:|---:|
| Crafted / sold | 257 / 251 | 0 / 0 |
| Victories / defeats | 97 / 13 | 0 / 315 |
| Smith level | 10 | 1 |
| Hero levels | 6-7 | 1 |
| Highest crafted tier | 3 | None |
| Gold remaining | 5445 | 12 |
| Legacy sparks available | 0 | 0 |
| Overdue expeditions | 0 | 0 |
| Failed sampled save validations | 0 | 0 |

First craft completed at 1.5 minutes, first sale at 5 minutes, first victory at 12.5 minutes. Tier bosses fell at 22.5, 46.5 and 192 minutes. The active workshop discarded 13 materials at full bins; no overflow cargo or mailbox accumulated. These results use the tuned first boss and the save-validation repair.

My assessment: the opening provides visible progress without rushing hero levels, and Legacy is safely out of early reach. The roughly 145-minute gap between the second and third boss is the biggest pacing risk. In this policy the shop still had 5,445 gold, so more cash alone would not resolve readiness: directed proficiency, equipment coverage and training matter. The policy buys first ranks and uses five classes, so this is a diagnostic plateau rather than an optimized completion benchmark.

## Bugs found during review

- A normal active run generated a Signature Masterwork commission requiring quality 115. Save validation still limited commissions to 100, so the save could not reload. The main agent raised that validation limit to the current quality ceiling.
- Repeatedly preparing a boss party while its expedition was already running could reserve the same heroes again and leave them gathered after victory. Preparation for a boss already underway is now rejected.
- The original first boss had a 100% predicted win rate against three completely unequipped level-one heroes. It was retuned to 220 health and 20 attack; the final active profile above uses that encounter.

## Pricing assessment

Legacy is now a genuine campaign reward: 10,000 ordinary wins cannot unlock retirement or earn sparks. A first completion of all five bosses gives 46 sparks before smith/masterwork bonuses; the overall reward cap is 66. The full talent tree costs 304. Repeating the same boss does not increase the boss milestone reward. This supports several completed generations without allowing a short early run to buy the tree.

Basic unenchanted item quotes exceed purchased input value across all 180 patterns at the starting attribute allocation (using base input prices and basic quotes). This is not guaranteed revenue: customers still require budget, compatibility and an equipment improvement. Town liquidation deliberately pays below replacement cost, so buying inputs just to dump finished goods is not a profitable loop. Tier-scaled customer budgets support increasingly expensive equipment; relationships and shop upgrades remain useful for premium variants and enchantments.

## Prioritized recommendations

1. Preserve meaningful boss preparation. Gear, party choice and resistance should determine readiness; a boss should not merely be a button unlocked by repeating easy quests.
2. Explain the mid-game proficiency bottleneck. Show the closest useful recipe and missing proficiency beside the selected type, and retain affordable repeatable recipes. More patterns are welcome, but spreading proficiency too broadly can delay the next tier.
3. Keep the loss-Merit catch-up system visible. An untouched empty shop earns 315 Merits from 315 defeats over eight hours, without earning gold or hero levels. This is an intentional recovery path, but merits alone can buy considerable training. If later balancing shows it bypasses equipment preparation, consider diminishing rewards from repeated identical defeats rather than removing catch-up entirely.
4. Continue longer, varied-policy runs before fixing a target time for the final boss. This test covers early and middle progression; synthetic high-tier victories establish feasibility, not realistic acquisition time.

## Verification limits

The harness checks that no expedition remains overdue and that no overflow mailbox/cargo accumulates. It audits the quest prerequisite graph for cycles, all 180 recipe slots, manual party launch for every tier, and late Legacy gating. Browser interaction, visual clarity, long-term offline returns, prestige-to-prestige pacing and optimized speedruns need separate checks.
