# House campaign review

Independent idle-game enthusiast review · 4 October 2026

## Verdict

The first campaign is now earned and mechanically completable under the requested attendance pattern. A player policy that responds to a fallen front-line fighter reached the Crown at **100.08 elapsed hours**, using **5.5 hours of active time**. A less responsive policy took **126.01 hours** after a late formation adjustment. Both exceed the 72-hour minimum; neither demonstrates a three-day completion guarantee.

The later-material duration changes substantially improved progression. The earlier implementation reached every late champion almost exactly when its calendar restriction expired, with over one million spare gold. The revised implementation requires meaningful equipment work and recoverable failures. Further blanket timer increases are not recommended before testing more deliberate builds.

The second-generation run exposed a genuine automatic-production stall, which was repaired during review. The actual saved run subsequently earned a second Crown at **143.75 career hours**, including its earlier stalled time. This proves recovery and completion across the fix; it is **not a clean second-generation pacing benchmark**.

## Method and scope

- Fresh saves, normal starting resources and 20 allocated points. Gameplay changes use public commands and normal online/offline simulation. No money, material, XP, mastery, equipment, licence or time-credit grants.
- First day: one active opening hour, then 15-minute visits at hours 2, 4 and 6. Later days: 15 minutes at hours 0, 2, 4 and 6. The remaining time is offline, including the 17.75-hour night after the final visit. Each active decision is evaluated every 20 seconds.
- The controller funds miners, stockkeeper, production ledger and clerk; explicitly enables rotating work and purchased supplies with a generous 50,000g absence spending limit. It maintains an operating reserve, allocates earned points, queues useful equipment, applies one finishing pass and uses controlled treatments when affordable. This is a prepared workshop policy, not a test of untouched defaults.
- Equipment selection uses visible combat statistics. Battle results are not inspected before committing. The informed variant moves Renn behind Mara after an actual replay reports Renn falling first. Neither policy optimizes enchantments, alloy grades, alternative rosters or attribute retraining.
- Only the original default random sequence was used. Seven professions were compared in the opening, not across seven full campaigns.
- Second generation continues the same real attendance schedule; it receives **no extra opening hour**.

`house-campaign-probe.js` is the reproducible controller. `house-campaign-results.json` contains compact observations and source hashes; the large local raw reports and checkpoints preserve continuation state. Reports labelled baseline refer to earlier implementations, not repeated samples of the final balance.

## Earned evidence

| Run | Result | Interpretation |
|---|---|---|
| Earlier 8-hour offline implementation | At 72 wall hours, only 42.75 hours credited; champion 2; 434 crafts | Overnight cap and finite selected-pattern work limited progress. Exhibition repeats nevertheless raised fighters to level 25. |
| Rotating work before later-tier duration changes | Crown at 72.006 hours; at 72.25 hours, 7,057 crafts, smith 49 and 1,261,206g | Almost purely calendar-limited after the opening; unsuitable as the final pacing result. |
| Revised durations, initially unchanged formation | Champions approximately 2.01, 24.01, 28.01 and 54.01 hours; final champion resisted repeated attempts | Real preparation replaced the earlier immediate promotions. |
| Revised durations with late replay response | Crown at 126.01 hours; 2,847 crafts, 1,036 contracts, smith 28, 136,977g at the final visit | Earned proof of completion, not an optimal route. Total active time across continuation files was 6.75 hours. |
| Revised durations with response from first relevant casualty | Crown at 100.08 hours; 2,650 crafts, 967 contracts, smith 27, 74,294g; 330 active minutes | Earlier tactical learning saved about 26 hours. Remaining preparation still mattered. |

The informed run moved Renn back at 2.21 hours. Its fourth champion fell at 52.01 hours. At the final visit it had made 104 starforged pieces and fulfilled 24 tier-five contracts, against requirements of 36 and 12. The last obstacle was therefore combat preparation, not an insufficient production counter.

### Seven starting professions

All seven reached smith level 3, completed the three initial qualification rungs and configured stockkeeper, catalogue production and automatic delivery within the first hour under the prepared policy. The champion remained correctly unavailable before two hours.

| Calling | Crafts | Contracts | Gold left | Miners |
|---|---:|---:|---:|---:|
| Oathblade | 42 | 4 | 36 | 2 |
| Bastion smith | 39 | 4 | 39 | 2 |
| Cinderwright | 38 | 4 | 25 | 2 |
| Deep delver | 37 | 4 | 59 | 2 |
| Guild factor | 39 | 5 | 90 | 3 |
| Clockwork founder | 37 | 4 | 77 | 2 |
| Archive keeper | 40 | 6 | 87 | 3 |

The first Cinderwright controller overspent on its immediately available Warding treatment and stalled itself at 5g. Reserving 25g and making plain work when treatment was unaffordable resolved this without a game balance change. The perk is useful, but its cost must remain prominent. A separate entirely earned check spent **all starting gold on wood** and successfully recovered through smelting, crafting and contract delivery.

## Second generation and the repaired stall

The first completed house won an optional Crucible fight through the ordinary battle command, earning one seal. Retirement then awarded **69 sparks** once, retained the chosen sword and discoveries, and reset career progress. The player selected Workforce and purchased Inherited Crew, Fuller Moulds and Enduring Tools for 44 sparks, retaining 25.

Retirement happened after the day's last visit. The following 17.74-hour night produced no crafts because the new workshop's production controls had not yet been rebuilt. Automation was running by the second 15-minute visit. This is a useful onboarding finding: inherited mining capacity is not the same as an operating production chain.

At 113.74 career hours the second house had reached champion four, with 2,048 crafts and 713 contracts, but automatic production had stopped. The state contained two starforged talisman orders and one bronze safety order. Star patterns and the crucible were purchased, while the star gallery required **6,000 extracted materials** and the house had only **4,919**. Every accessible raw-material bin was full. Rotation repeatedly selected inaccessible star work and ignored the feasible bronze order. The last 19.75 hours produced **zero crafts and zero contracts**; only exhibition gold continued.

The implementation now checks every ore and intermediate-alloy path when issuing contracts and selecting rotating work. The independent regression reproduces that exact dependency shape. Continuing the actual earned save after the fix produced 130 crafts/63 contracts in the first absence and 330/164 in the next. The renewed activity earned the remaining mining requirement and opened the star gallery. This is a **rescued run across a bug fix**, not a clean second-generation timing benchmark.

The rescue spent 24 remaining earned sparks on the Rare Armoury Archive and completed four paid studies: the guild route, heat ladder, silent-gallery survey and Oathbound folio. It then earned the second Crown at 143.75 career hours, with 50 starforged crafts and exactly 12 tier-five contracts. Its final visit had smith level 25, 2,879 crafts, 1,063 contracts and 90,269g. No resources were granted in the rescue.

The Oathbound folio was earned, but the balanced smith still lacked the 85-point primary attribute and some class mastery needed to forge its equipment. This is research-unlock evidence, **not an earned Oathbound-item claim**. Astral/Eternal equipment and the entire Crucible ladder remain outside the earned evidence. A fresh successor campaign on the corrected build is still needed before claiming that Legacy reliably shortens the campaign.

## Priorities to retain or improve

1. **Keep replay advice actionable.** “Renn fell at six seconds” should lead directly to the legal formation change, with Mara still guarding the front. The measured difference between the two policies was substantial. Equipment-only advice encourages unnecessary repeated forging.
2. **Make each return a short plan.** Put the current material licence, required work still missing, next useful equipment project and the actual reason a production chain stopped together. A paid pattern is not proof that its mine and intermediate alloys are available.
3. **Treat the successor's workshop as a setup task.** Show miners, smelter targets, catalogue, clerk and purchase allowance as explicit readiness checks. Warn before retiring at the end of a visit if the next long absence will contain only mining. The reduced generation-two time restriction does not guarantee a faster second career.
4. **Avoid punishing efficient inheritance with extraction totals.** Fuller Moulds makes more equipment from fewer mined inputs. That can delay a 6,000-material licence even in a productive inherited house. The fallback now prevents a hard stall, but a future design could accept a relevant surveying project or completed production work as an alternate licence requirement.
5. **Explain exceptional attribute builds.** Oathbound recipes require generation two, a seal-funded study, smith 25, mastery 90 and an 85-point primary attribute. A balanced smith at level 25 is not automatically close. Show the exact attribute shortfall and the retraining option. Research completion must not imply immediate craftability.
6. **Preserve meaningful costs rather than adding more blanket waits.** Higher-tier commissioning now matters. The observed first-Crown range is approximately four to five days for these policies. Keep the calendar floor, but measure additional tactics, grades and suffixes before further slowing every recipe.

## Independent checks and limits

Seven regression checks cover zero-cash recovery, the cumulative 24-hour offline allowance, rejection of early retirement, exact graded-metal research consumption, higher-tier contract renewal, equivalent whole-absence/small-step discovery timing, and the locked-star rotation failure. Controlled fixtures deliberately grant state for invariant checks; their results are **not campaign pacing evidence**.

The initial empty 24-hour fixture took around 55 seconds while another simulation ran. The effect-cache change reduced that to roughly 15–16 seconds in later runs; these are indicative Node timings, not a browser performance benchmark. The implementation agent is separately verifying asynchronous browser catch-up and its return ledger.

No claim is made here about a full earned Oathbound/Astral/Eternal collection, the 60th Crucible trial, all profession campaigns, random-seed robustness or competitive optimal play. Engine evidence does not replace phone/desktop visual QA.

## Keeping the repository compact

Keep this report, `house-campaign-probe.js`, `house-campaign-results.json`, `house-campaign-invariants.txt` and `tests/house-campaign-review.test.js`. The local `house-campaign-*-checkpoint.json` files contain large replay archives and can be ignored. Opening `.log` files and the larger per-session run JSON files can also remain local once their compact summaries are retained. Do not delete the earned checkpoints while follow-up testing is still useful.
