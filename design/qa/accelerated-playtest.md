# Accelerated AI playtest — 26 September 2026

The returning-home bug was reproduced and fixed. Five deterministic scenarios covered **22 simulated hours**, including eight hours with every material bin full and all 25 mailbox slots occupied. No overdue expeditions remained after the fix. Seven new regression tests pass; the original 61 checks also passed with the lifecycle changes.

## Method

A decision-making agent exercises the real `EIWorldEngine` through public commands every 30 simulated seconds. It mines, allocates earned attribute points, buys fittings, hires miners, assigns seams, buys affordable upgrades, crafts, finishes, displays, and liquidates excess stock. NPC shopping, combat, recovery, retries and quest selection remain fully automatic. All player profiles start with normal resources, 20 distributed creation points and seed 2463534242. No currency, materials, experience or equipment are granted to those profiles.

The congestion scenario deliberately constructs a full-storage save. Focused regression fixtures additionally force successful and failed combat outcomes to isolate lifecycle behavior. These are engine playtests, not a substitute for human visual/usability testing or a complete late-game balance study. Results depend on the documented policy and seed.

Reproduce all scenarios with `node tests/playtest-ai.js`. Run the lifecycle checks with `node --test tests/return-home.test.js`. Raw checkpoints and results are in `accelerated-playtest.json` beside this report.

## Results

| Profile | Simulated time | Crafts / sales* | Wins / defeats | Final level | Final gold | Best proficiency / tier |
|---|---:|---:|---:|---:|---:|---:|
| Generalist bladesmith | 2 hours | 68 / 50 | 79 / 10 | 5 | 1,479 | 9 / bronze |
| Prospector generalist | 2 hours | 67 / 49 | 81 / 8 | 5 | 2,034 | 9 / bronze |
| Sword specialist | 2 hours | 94 / 92 | 79 / 16 | 6 | 1,843 | 35 / iron |
| Unattended empty shop | 8 hours | 0 / 0 | 6 / 424 | 1 | 18 | 0 / none |
| Full bins + full mailbox | 8 hours | 0 / 0 | 6 / 424 | 1 | — | 0 / none |

*Sales include autonomous customer purchases and the agent's ordinary town-buyer liquidation command; they are not exclusively adventurer purchases.*

- Active profiles finished a first item at 1.5 minutes, sold one at 3–3.5 minutes, and first won at 5.5 minutes. Level 2 arrived at 7–7.5 minutes.
- The specialist first crafted iron at 34 minutes using quest-supplied material. Opening its own iron seam came later, at 56.5 minutes. Quest rewards correctly provide an alternative source of materials.
- The prospector opened iron mining at 35 minutes versus 56.5 minutes for the generalist, and extracted 1,069 materials versus 638. Its profession has a substantial measurable effect.
- Generalists spread proficiency over many classes and remained below the iron proficiency gate after two hours. The specialist reached sword proficiency 35. That is a meaningful specialization tradeoff.
- An initial specialist policy that only replenished two unsold swords stopped at 14 crafts/proficiency 10. Explicitly liquidating an old sword to continue practicing produced the final specialist result above. This is a policy limitation and a discoverability finding, not a broken craft command.
- An empty unattended shop won only 6 of 430 attempts. Heroes spent most sampled time recovering. Supplying gear matters substantially.
- Active generalists accumulated up to 131–155 surplus quest materials. Material overflow is a frequent ordinary-play condition, not only a pathological stress case.
- The full-storage stress ended with 25 mailbox bundles, six materials in quest cargo, 18 retained/current runs and a valid save. Its heroes continued fighting and recovering. No pending return remained.

## Confirmed bugs and fixes

**Quest rewards prevented heroes from arriving.** `_return` previously required the entire reward to fit in material storage or the mailbox before it completed the run. A full bin plus 25 mailbox bundles caused `pending` runs, left heroes marked returning, occupied expedition capacity and blocked future customer cycles.

World-game quest rewards now credit gold and recipe discoveries immediately. Material overflow goes into a persistent aggregate `questCargo` chest. Cargo automatically unloads, including partial loads, when bin space opens. Heroes finish their journey independently of cargo, and the existing `rewardApplied` guard prevents duplicate currencies, reputation, merits or hero progression. Ordinary cancellation/salvage/commission mailbox behavior is preserved.

**Old saves could retain stale travelling/fighting/returning labels.** Pending returns are now completed when a world save loads. A reconciliation pass reconnects an active expedition or returns an orphaned/completed-run hero to the shop/recovery state without replaying its reward. A read-only `heroActivity(heroId)` supplies consistent location, phase and timer information for the follow interface.

Regression checks cover full bins plus full mailbox, migration of pending saves, partial cargo unloading, save/reload, duplicate return calls, missing/completed run links, each follow phase, invalid cargo, and 50 consecutive successful full-storage returns. The latter retains only 16 completed runs while preserving all 200 overflow materials and 350 gold.

## Suggestions, in priority order

1. **Make cargo visible without making it a hero status.** Show queued materials and explain that crafting, trading or expanding storage unloads them automatically. A returning hero must never appear to be waiting for a storage action again.
2. **Show a selected hero's next useful gear improvement.** Include empty equipment slots, current item quality, and why visible stock is unsuitable or unaffordable. Generalist surplus and the empty-shop failure rate show why demand guidance matters.
3. **Expose practice as an explicit progression choice.** Show class proficiency and the next tier requirement beside craft actions; offer clear liquidation/salvage of superseded stock. A two-item shelf target alone can strand a specialist below the next tier.
4. **Separate journey phases and recovery timers.** Display outgoing travel, live combat, homeward travel and rest with a single clear countdown, and follow the hero into the shop when it arrives. This also makes real stalls distinguishable from normal downtime.
5. **Keep the opening deliberate; retest the middle economy.** First sales around three minutes and frequent ungeared defeats fit the slow-start brief. Active profiles nevertheless reached 1,479–2,034 gold after two hours. A broader multi-seed test should measure the split between quest income, NPC purchases and liquidation before adjusting prices or rewards.
6. **Explain profession outcomes during creation.** Prospector's earlier seam unlock and higher extraction are substantial; show these as concrete strengths. Avoid claiming all professions have equal pacing from this limited sample.

Suggested later coverage: all professions over multiple seeds, mithril/starforged progression, multiple legacy generations, and long sessions with all twelve heroes. Those outcomes were not measured in this pass.
