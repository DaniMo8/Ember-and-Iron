# Arena house implementation review

4 October 2026 · Idle-game enthusiast · Implementation checklist before the new build

## Recommendation

Implement the whole game around a **player-owned team whose equipment is the reason it wins**. Contracts pay for the workshop; the arena gives the workshop a purpose. The meaningful loop is: inspect a rival, choose a response, produce the equipment, equip the team, watch the result, and invest in the next capability.

The implementation should preserve the current game's useful foundation—finite bins, ore-to-ingot production, diminishing finishing, earned automation, staff experience and stamina, manual promotion fights, and late Legacy—while explicitly replacing the customer-dependent progression paths. Renaming Customers to Arena will not do this by itself.

This is a **code-informed implementation review**, not a playtest of an implemented arena build. I inspected the current workshop, progression, employee, combat, save and interface paths alongside `design/arena-loop-proposal.md`. Numerical targets below are tuning hypotheses. The previous v2.2 simulations measure the old customer game and cannot establish the new campaign's duration or balance.

## 1. Decisions to fix before connecting the new screens

| Decision | Recommended implementation contract |
|---|---|
| Campaign identity | A versioned Arena house campaign, with the previous Classic save preserved separately. |
| Starting team | Mara, Renn and Wren are authored house fighters; no hero naming/class-selection form. Three active fighters, later reserve roster. |
| Equipment ownership | All crafted and retained gear belongs to the house. Equipping is free and returns displaced gear. A piece has one owner/location at a time. |
| Main income | Persistent, achievable contracts with known payout and input costs. Display sales and arena purses supplement them. |
| Main progression | Five leagues; each has three qualification rungs, then one deliberately launched champion. |
| Qualification | Five **match** wins at each rung, including a win against each of its three rival styles. Three fighters winning once is one match win. |
| Ordinary purchases | Gold/materials; relevant achievements are permanent access requirements. Legacy sparks remain separate. |
| Forge work | Team commission, catalogue contract, or explicit mastery practice. Each has an honest destination and stopping rule. |
| Combat | Automatic, front/back lines, selected formation and doctrine, frozen match inputs, deterministic event log. |
| Offline scope | Previously authorised production and cleared exhibitions only. No new champion, rare project, retirement or unapproved sale. |

Keep these rules in shared data and engine commands. Screen labels and scene animation should display those rules rather than independently approximate them.

## 2. Highest-priority engine hazards

These are observed behaviours in the current code that need explicit treatment during the redesign, not claims that the new build already contains these defects.

### P0 — Equipping must not destroy the replaced item

`engine.js::_equip` overwrites the previous slot and clears the offhand when a two-handed weapon is equipped. The current sale/gift paths remove the incoming piece from inventory and do not return the displaced gear. That was a customer transaction; it is unsuitable for an owned armoury.

- [ ] Create an atomic house-equipment command with compatibility, owner, capacity and in-battle checks.
- [ ] Return the replaced weapon and any displaced offhand; reserve their destination before committing.
- [ ] If storage cannot accept the exchange, reject it without changing any item or stat, or use an explicitly bounded equipment rack.
- [ ] Maintain one canonical item ID across inventory, equipment, reservations, contracts and heirlooms. Do not clone a sellable second copy.
- [ ] Explicitly allow compatible sidegrades; the old sale preview's positive gear-score requirement must not prevent a deliberate counter-build.
- [ ] Protect equipped and team-reserved pieces from display filling, sales, salvage, contract delivery and automated clearance.

Acceptance: equip a two-handed weapon over a weapon plus shield with nearly full storage, reload, then unequip. The same three item IDs still exist exactly once; an unsuccessful transaction changes nothing.

### P0 — Old customer automation must not control the house team

`engine.js::_runNpcs`, `_return`, `_sell` and `world-engine.js::_runNpcs` still browse, buy, choose quests, depart and return to shopping. `Workshop::_tree` also calls arrivals after purchases. House fighters cannot quietly buy a different weapon or leave for an old quest while the Arena screen is preparing a team.

- [ ] Separate townspeople/display customers from house fighters in state and scheduling.
- [ ] Stop the customer purchase, auto-dispatch and relationship-commission paths for the owned roster.
- [ ] Make the new arena scheduler the only authority that changes a fighter between ready, fighting and recovery states.
- [ ] Preserve or archive pending Classic runs deliberately during conversion; do not leave both schedulers live.

Acceptance: after an hour unattended, a reserved promotion team has the same equipment and has launched no unapproved match. Townspeople can still browse and buy unreserved shop stock.

### P0 — Five wins must mean five bouts, with no hidden quest scaling

`engine.js::_return` currently adds `run.heroIds.length` to ordinary quest progress. `formation-combat.js::simulate` also derives enemy pressure from current quest mastery and constructs quest waves. Reusing those paths unchanged would clear a five-win rung in two three-person fights and alter rival strength while the player tries to understand a rematch.

- [ ] Use a separate arena qualification record: league, rung, total scoring wins, rival-style wins, champion clear.
- [ ] Award one scoring win per completed eligible match, exactly once.
- [ ] Keep a named rival snapshot stable during a challenge. Later rungs can have stronger disclosed versions.
- [ ] Remove implicit quest-win pressure from arena simulation. Multi-round arena rules must be explicit, not inherited patrol waves.
- [ ] Count losses, repeats of cleared rungs and imported exhibitions correctly: no new qualification.

Acceptance: a trio wins four scoring matches including all three styles; promotion remains locked at 4/5. The fifth eligible match unlocks the next rung. After rung three, the champion unlocks. Winning the champion opens the next league only once.

### P0 — Replacing sales must not remove the only route to progress

`Workshop::classMilestones` currently requires useful customer sales and old boss IDs. `craftableRequests` and `_commissionNeeds` depend on relationship commissions. `World::currencies` spends Prospecting, Influence and Merits. These conditions will strand a new player if the customer loop disappears first.

- [ ] Introduce starter contracts independently of purchases, relationships, quest victories or new-class unlocks.
- [ ] Rewrite class, material, pattern, Legacy and room-art gates against arena achievements.
- [ ] Audit all old quest IDs and customer-sales requirements, including hidden recipe and background conditions.
- [ ] A champion must be defeatable with the material tier available before its reward.
- [ ] Recruiting a class unlocks its training patterns at the same time; it cannot require sales of a class whose patterns remain locked.

Acceptance: a new save can complete the full required production and arena path while customer auto-shopping is disabled. No progression node requires an action the new game no longer offers.

## 3. The economy: slow investment without dead ends

### Contracts are a reliable business, not another luck gate

- [ ] Keep at least one basic order available that the current workshop can fulfil. Generate requirements from known patterns and achievable quality, not future licences or a lucky prefix.
- [ ] Show quantity, minimum quality, deadline policy, remaining deliveries, exact payout and purchased-supply cost before commitment.
- [ ] Permit partial delivery, with unambiguous per-piece payment or escrow rules. Cancelling a partial order must never erase already earned payment or refund an item that was delivered.
- [ ] Do not expire routine orders on real-world daily timers. Refresh through completed work or an explicit replacement action.
- [ ] Lock an accepted order's price and requirements. Buying an upgrade midway should not make it impossible or multiply a past payout.
- [ ] Reward actual delivery. Opening, refreshing, reserving and cancelling must not earn reputation, mastery or cash.
- [ ] Low-quality stock has a small lawful outlet; it should not become an infinite high-margin substitute for worthwhile contracts.

For every catalogue pattern calculate:

`cash margin = payout − purchased supplies − enchantment/treatment charges − any direct contract fee`

Then also measure effective gold per minute including mining, smelting and crafting. Ore gathered for free is still production time. A positive cash margin alone does not make a six-hour design competitive with fifty cheap blades.

The baseline contract must remain profitable without Charisma, rare prefixes or finishing. Charisma should improve terms, reputation or commercial throughput, not be mandatory to avoid losses. Finishing a sale item is a conscious premium-quality decision; the contract UI should show whether the extra work qualifies for a better payout.

### Protect the recovery route

- [ ] Normal seams never permanently run dry; first-tier material access remains available.
- [ ] Provide a disclosed zero-gold recovery route if the player spends all cash on upgrades: a basic no-purchased-supply product/order, raw-material sale, or another bounded workshop action. Verify the chosen route in-game.
- [ ] Losses cost time and recovery; early matches do not create fees or compounding debt.
- [ ] Do not charge recurring wages in the opening. Recruitment, facilities and training already provide meaningful sinks.
- [ ] Failed fights cannot fund infinite unlocks. If a tutorial lesson reward exists, record its one-time claim.
- [ ] Replays, practice comparisons and imported opponent files pay nothing toward official progression.

### Price upgrades by what they accomplish

Preserve exponential rank growth, but measure each purchase against the bottleneck it solves. Avoid a universal price increase to manufacture slowness.

| Upgrade family | What the player should notice next | Check |
|---|---|---|
| Mine crew/storage | A shortage eases, or a longer unattended interval fits | More ore helps a real pending recipe; full bins have a visible cause |
| Alloy/material access | A different competitive build becomes possible | Ore, smelt, pattern and licence gates form one achievable path |
| Forge quality/control | An item crosses a relevant threshold or gains consistency | Preview actual gain after the cap and rounding |
| Throughput | A commission finishes sooner or work can run in parallel | Downstream supplies and buyers can absorb it |
| Shop contracts/patrons | New profitable demand appears | Better orders repay investment without requiring a lucky affix |
| Staff training/welfare | Measurable output, learning or shift improvement | Rest and exhaustion remain visible; passive bins do not shrink |
| Arena preparation | New formation, reserve option or recovery policy | Does not become an unconditional combat-stat stack that replaces equipment |
| Legacy | The next opening removes a known chore or enables a new approach | Benefits activate when stated and respect material/tier requirements |

## 4. Production and item depth that must be real

### Mine and Smelter

- [ ] Keep coal prominent and wood/leather/oil together as purchased supplies. Move shopping information into the relevant room rather than another market destination.
- [ ] Give depth unlocks one clear next material. Preview the next inaccessible seam and the resulting alloy opportunity.
- [ ] Let crews wait or follow an approved fallback when full. Manual overflow remains visible and is not secretly stored elsewhere.
- [ ] Stock targets account for pending output, intermediate alloys, reserved inputs, bin capacity and bench capacity.
- [ ] A lower-priority catalogue order cannot consume material reserved for the pinned team commission.
- [ ] Represent a material treatment/grade in inventory and the finished item, or explicitly store it as a captured craft input. A label alone must not promise different stats.
- [ ] If stock stacks differ by grade, define stacking and bin-space accounting. Do not put twenty separate sliders in the opening.

Current `smelterDerived().quality` is a global bonus captured by newly started crafts, not a physical per-ingot quality record. The new assay/grade presentation must match whichever model is actually implemented. An upgrade must not silently improve every previously forged item.

### Forge and armoury lifecycle

- [ ] Team commission outputs arrive reserved for their fighter/project.
- [ ] Catalogue production stops at the accepted quantity or stock target, and knows which contract consumes it.
- [ ] Mastery practice openly shows its cost and intended outlet. Demand-only pauses do not silently disable this intentional training mode.
- [ ] Retain +20/+10/+5/+2/+1 finishing, each costing one normal work duration, limited by the cap; show revised completion time.
- [ ] Preserve paid ingredients, enchantment gold, chosen treatment and finishing history in queued/active jobs. Cancellation uses escrow, not today's recipe cost.
- [ ] Prefix control changes a documented probability/floor. Enchantment suffixes have known effects and costs. Both appear in item inspection and combat stats.
- [ ] Practice and salvage do not grant extraction progress; repeated salvage/refund loops cannot manufacture net inputs, XP or reputation.
- [ ] Later refitting preserves the piece's pass count and history. It cannot reset diminishing returns indefinitely.
- [ ] House hallmarks and item history are achievements or cosmetic identity, not an uncapped hidden damage multiplier.

Stable recipe IDs already protect older equipment. Keep them, or supply explicit aliases. If combat values become captured per item, migrate old recipe-derived values once using a declared rules version.

## 5. Essential arena mechanics and learning from defeat

- [ ] Start with three recognisable fighters, clear compatible item types and compact final health, damage, attack interval, armour, penetration and resistances.
- [ ] Equipment has an obvious effect. Level grinding and global upgrades should not trivialise the first champion while the team still wears borrowed kit.
- [ ] Honour player-selected front/back positions. The existing simulator derives line from archetype; a formation UI must change the actual resolved match inputs.
- [ ] Ordinary attacks cannot bypass living frontliners. Any exception has an explicit ability and visible event.
- [ ] Implement each displayed doctrine mechanically; avoid three labels backed by identical combat.
- [ ] Give rivals concrete differences—shield defence, burst damage, wards—not merely increasing health.
- [ ] Every champion has at least two plausible solutions using available gear/formation. Essential success must not require a rare random prefix.
- [ ] Recovery has a visible clock and eventual exit. A fighter is in exactly one state and match at a time; no inherited “returning home” limbo.
- [ ] The roster does not immediately auto-launch again while a selected deliberate match is gathering.

Loss explanations must be derived from the event log. For example, identify the first frontliner to fall, damage prevented by blocks, the damaging element, or surviving enemy threat. A canned “forge more armour” message is misleading if the real failure was elemental resistance or damage output. Initially report observed facts rather than claim a particular craft guarantees victory.

### Replay contract

- [ ] Freeze resolved stats, equipment identities/properties, formation, doctrine, fatigue/recovery effects, rival rules/version and seed at launch.
- [ ] Make simulation a pure operation on that snapshot. `formation-combat.js` currently reads live engine effects and quest wins, so passing the same seed alone is insufficient for archival replay.
- [ ] Store result and event log; viewing uses the stored record, not the current team and current upgrades.
- [ ] Issue and persist an official challenge seed before retries. Reloading a save or changing rooms cannot reroll that already issued challenge.
- [ ] Persist a unique match ID and reward-applied record. Reward commitment is atomic with progression.
- [ ] Handle a bounded replay history without deleting the only record that prevents reward duplication. Champions and player-pinned memories can have separate retention.
- [ ] Playback speed, skipping, pausing and stepping have no economic or simulation effect.
- [ ] Imported rivals are labelled unverified exhibitions. Keep trusted online ranking outside this local-save release unless an authoritative service actually exists.

## 6. Creation, section introductions and useful visual polish

Deeper creation should preview meaningful decisions, not add more mandatory forms.

- [ ] Retain zero base stats, twenty assignable points, uncapped attributes and five points per smith level.
- [ ] Show the profession's first capability and a sample first craft/contract comparison. Offer a suggested spread and accessible plus/minus controls.
- [ ] Every valid allocation, including 20/0/0/0 variants, can make starter training gear and recover economically. Warn about tradeoffs without hiding a valid build.
- [ ] Charisma previews must refer to the new contract economy; remove the obsolete buyer-budget justification where it no longer matters.
- [ ] Free correction remains available before meaningful investment, and later retraining has an affordable, explicit rule.
- [ ] Do not ask the player to name/class the authored starting heroes again.

Each first-visit overview should answer only: **what this room does, what to do now, and what unlocks next**. Make it dismissible, replayable from Help, and persist its seen flag independently of gameplay rewards. Dismissing a tutorial must never be a licence prerequisite. Opening another tab, reloading or switching rooms must not repeatedly show the same overlay or launch an action underneath it.

| Room | Useful first-visit action |
|---|---|
| Smith | Choose identity; understand the next attribute point and prominent mastery level |
| Mine | Assign the crew and identify coal/copper/tin supply |
| Smelter | Convert the first ore batch and see which stock the Forge needs |
| Forge | Select the first team piece; show recipient, cost, quality and completion |
| Shop & Armoury | Equip the piece and accept one profitable starter order |
| Arena | Watch a safe demonstration, then inspect the first real rival |
| Employees | Identify a bottleneck; see the first affordable specialist and rest policy |
| Legacy | Preview what persists; remain locked until the final championship |

Blender scenes, furniture, icons and rendered controls should support this information. Keep actual amounts, comparisons, timers, requirements and buttons as semantic interface elements, not text baked into art. A visually impressive forge with the Craft action below the fold repeats the old problem.

Desktop: primary room action, active job and pinned goal visible at 1440×900. Phone: recipe and recipient visible before side information; a contextual fixed action does not cover content or the navigation. Inspect 360×800 and a wider phone with menus open, longer names, missing resources and an active battle. Preserve reduced motion, room-transition dimming and readable focus states. High-tier backgrounds should retain their late-generation progression requirements after quest gates move.

## 7. Employees: retain the working foundation

The current dedicated room, eight specialists, actual-work experience, stamina/manual leave, earned managed breaks and twelve upgrades are a useful foundation. Do not replace them with a second overlapping staffing system solely to match proposed role names.

- [ ] Keep mine crews as reliable baseline extraction. Specialist rest can slow production; it must not erase storage capacity or disable every essential source of cash.
- [ ] Assign XP only for completed relevant work. Queuing/cancelling, blocked batches, previewing and replay viewing do not train staff.
- [ ] Explain which benefits are captured at job start versus applied live.
- [ ] Manual leave remains manual even after managed shifts unlock; the player should not find a rested employee silently reassigned against their choice.
- [ ] Add delegated responsibilities to existing roles where useful: stock targets, contract fulfilment, equipment protection and scheduled exhibitions.
- [ ] Compare upgrade price against its benefit: 8% stronger on a 6% specialist bonus is 6.48%, not an extra 8% total factory speed. The impact preview must make this understandable.

## 8. Migration and save safety are release gates

### Separate modes and versions

`app.js` currently uses one primary save, one backup and one ownership lease. A replacement campaign must not let Classic and Arena tabs write to the same keys. Give campaign slots explicit identities, independent backup/lease keys and an export format carrying mode/schema version.

Validate the old schema before converting it; then validate the new result. The current inheritance chain validates recipe IDs, quest IDs, staff, upgrade parents, spending and pinned goal sections before normal migration executes. Deleting old content first can make an otherwise legitimate save unreadable. The recently fixed Forge→Employees pinned shift goal is a small example of this wider risk.

- [ ] Leave the original Classic save/export unchanged until an explicit migration choice.
- [ ] Conversion preview lists retained items, people, upgrades, balances, achievements, pending jobs and retired systems.
- [ ] Conversion is idempotent: reopening it does not duplicate gold, staff, items, milestones or inheritance.
- [ ] Paid obsolete ranks receive explicit equivalent capability/credit. Nonspendable achievement records are not silently cashed out twice as both rewards and balances.
- [ ] Preserve old recipe and item references, including gear nested in heroes, active jobs, run snapshots, collections, commissions and heirlooms.
- [ ] Preserve unfinished paid jobs or refund exact escrow through a capacity-aware conversion rule. Ordinary bin overflow must not silently erase a migration refund.
- [ ] Settle an existing expedition once under its old frozen outcome, or archive it under a disclosed conversion rule; clear stale hero/run/return references.
- [ ] Migrate renamed rooms and pinned goals, saved production recipes, class unlocks, old purchasing policies and first-visit flags.
- [ ] Decide how previously earned T5/Legacy eligibility maps to the new championship. Preserve existing ownership/investment; never claim old PvE progress is official online rank.
- [ ] Reset warns which slot and which Legacy it removes. It must not erase the archived Classic slot when resetting Arena.

Required fixtures: untouched starter; midgame with active forge/smelt jobs; full bins and warehouse; equipped two-handed weapon plus older saved offhand edge case; resting/managed staff; old pinned shift goal; boss in progress; returning expedition; late game with rare items and earned Legacy; generation-two creation before allocating points. Reload and export/import each converted result.

## 9. Slow, rewarding progression: test the whole chain

Suggested targets remain those in the proposal: see a crafted item matter within the first ten minutes; establish a contract and earn first delegation during the opening session; reach a meaningful first final roughly 45–120 minutes into a competent new run. These are **targets to test**, not promises or grounds to insert waiting timers.

Use ordinary public commands for fair pacing simulations. No resource, level, item or licence grants. Seed control and restored checkpoints are acceptable if disclosed. Controlled state injection is appropriate for isolated invariants, but it is not campaign pacing evidence.

| Scenario | Measure and inspect |
|---|---|
| Fresh player, balanced build, at least three seeds | First useful craft/equip, first contract, first hire/automation, first rung, first champion; cash and blocker timeline |
| Different professions and extreme legal allocations | Recovery route, complete starter team, no inaccessible mandatory recipe |
| Active versus five- and fifteen-minute visits | Useful output, gold, mastery, waiting reason, first promotion; distinguish a deliberate manual boss wait |
| Prepared one-hour idle and longer late-game idle | Accepted work completes; reserves respected; no exhausted-state deadlock or unapproved sale/boss |
| Several deliberate early losses | Economy remains recoverable; qualification unchanged; explanation matches events |
| Each material/league transition | Old tier can beat its champion; reward makes the next ore/alloy/pattern path achievable |
| Full first campaign | Actual first-retirement time, upgrade costs, cash sources, repeated chores, recipe/material deadlocks |
| Second generation | Inheritance applies, previous investment remains recorded, opening feels materially different |

Record each milestone plus the **longest interval with no useful action or visible completion**, the reason, and whether it is an intended long project or an accidental blockage. Log where money comes from: if trivial exhibitions finance everything while crafting stops, the new fantasy has failed. If contracts demand endless clicking to remain viable, the idle loop has failed.

Keep the earlier v2.2 measurements only as context: they achieved first boss around 55–57 minutes with an informed policy, but bronze demand later exhausted. Contracts and an owned roster should solve that finite-demand problem without removing meaningful production choices.

## 10. Implementation order and completion checklist

These are dependency stages toward the authorised full implementation, not a recommendation to call a partial prototype complete.

1. **State boundaries and migration:** campaign identity, equipment ownership, canonical goals, independent contracts and arena records; preserve Classic.
2. **One working loop:** mine/smelt/forge a piece, equip it, deliver a contract, challenge an authored rival, inspect a loss and rematch with a saved replay.
3. **All room progression:** material treatments, pattern/control unlocks, staff responsibility, commercial growth, full league gates and Legacy inheritance.
4. **Automation and recovery:** production intent, reservations, priority fallbacks, cleared exhibitions, rest, meaningful offline summaries.
5. **Creation and scene/interface integration:** first-visit overviews, room scenes and assets, compact PC/phone workflows, accessible interactions.
6. **Whole-campaign verification and cleanup:** measured progression, migration fixtures, second generation, packaged/portable build and dead-path removal.

Extract pure combat and small state transitions rather than adding another deeply layered override for every feature. Keep Classic compatibility in an explicit boundary. Have one source of truth for eligibility, price, job escrow and resolved equipment stats, used by both previews and commands. Update the portable build's module order and asset manifest when files split; passing source-page tests does not prove the packaged HTML works.

Release is ready when the player can explain **why the last item mattered**, the next upgrade changes a visible decision, a prepared workshop can be left alone productively, every league has an achievable path, and old work is preserved. Visual polish should make those facts clear at a glance.

---

## Implemented-build review — House of the Hammer

4 October 2026 · Independent engine review and isolated simulations

### Verdict after fixes

The new loop works through the first champion and into iron production. My earned run produced a useful loss, a specific investment and a successful rematch: the workshop visibly caused the improvement. I found no remaining blocking defect in the paths covered by the final probes. This is **not a full-campaign balance approval**; later leagues and second-generation transitions were checked with controlled fixtures, rather than earned from scratch.

The implementation agent fixed the concrete issues below during this review. I edited only this report, a standalone probe and a separate regression-test file. I did not edit production code or access browser/player saves.

### Evidence and method

- `design/qa/arena-review-probes.js` runs isolated Node probes; its JSON output records hashes of the reviewed engine/data/combat files.
- `design/qa/arena-review-probes.json` contains the complete measured opening, catalogue comparisons, conversion/grade checks and later-tier capability fixtures.
- `tests/house-review.test.js` contains seven independent regression tests; all pass. Captured output is in `design/qa/arena-review-regressions.txt`.
- All seven professions created valid fresh houses with the fixed named trio and the expected three or four opening orders.
- The **earned opening** used ordinary commands, normal starting supplies and the default random sequence. It received no money, material, XP, equipment, level, licence or upgrade grants.
- Other probes deliberately funded or equipped isolated fixtures. They verify transactions, prerequisites, combat capability or reset behaviour; their results are not estimates of how long a player takes to earn those capabilities.

The earned policy first fulfilled the three opening contracts, then made every compatible bronze training equipment slot for the original trio with one finishing pass. It did not spend points or buy upgrades before its first champion attempt. After losing, it allocated earned points, bought Guild patterns, one grinder rank and Tactical folio, selected Hold formation, and replaced the trio's weapons with finished standard designs. It then earned iron access and practised swords until the iron pattern became available. This is an informed, deliberately conservative policy, not a novice observation or an optimal speedrun.

### Measured opening

| Milestone | Simulated elapsed time | Outcome |
|---|---:|---|
| First contract delivered | 1.87 min | Basic crafting produces useful cash immediately |
| Second and third opening contracts | 5.05 / 8.50 min | The workshop has earned a viable investment reserve |
| Complete bronze training loadouts | 39.27 min | 24 crafts total; one finishing pass on team equipment |
| All three qualification rungs cleared | 45.91 min | Exactly 15 wins; each rung covered all three styles |
| First champion attempt | 46.54 min | Defeat; 321g and five unspent attribute points remained |
| Champion rematch after investment | 55.87 min | Victory with improved weapons and Hold formation; 259g remained |
| Iron mine, patterns and crucible; first ingots | 56.70 min | Two iron ingots produced; no circular material gate |
| First finished iron sword equipped | 91.32 min | Swords mastery 15; Q73 weapon; smith level 4 |

The run ended with 51 crafts, 16 victories, one defeat and 60g. Every checked match/recovery save validates in the final run. The first champion was a productive difficulty wall: the player had both a reason to improve and the means to do it, and could see the result of the investment.

The **34.6-minute gap between iron supply access and the first iron sword** is the main measured pacing concern. It is a mastery requirement, not a broken supply route. Make the remaining practice effort explicit when the licence is earned: current mastery, target mastery, useful practice pattern and approximate crafts remaining. Do not advertise an immediately usable new weapon when the player's actual next job is a sizeable training project. Other policies could prepare that mastery earlier; this one did not.

### Bugs found and verification status

| Finding | Why it mattered | Final check |
|---|---|---|
| Furnishing action sent `decorationId` instead of inherited `decorId` | The visible purchase button called the wrong API shape | Reported and corrected by the implementation agent |
| Catalogue offline purchasing checked nonexistent `offlineBudget` | Prepared offline production would stop when supplies ran out | Online/offline fixtures now each buy the same missing leather, spend 1g and start a job |
| Catalogue stock count omitted minimum tier | Bronze stock could suppress an iron contract's required production | Wrong-tier fixture now starts the required iron job |
| Selling graded ingots left their grade credits behind | Later ordinary ingots inherited free premium properties | Selling all three tough ingots now leaves zero tough credits; ordinary replacements stay ordinary |
| Alloy consumption/cancellation needed exact grade escrow | Turning premium intermediate metal into another alloy could erase or duplicate grade ownership | Independent cancellation test restores the exact spring-iron inputs and material totals |
| Classic paid recipe discovery did not carry over | Paid iron/steel patterns became hidden until bought again | Converted fixture retains the previously known iron pattern and its paid investments |
| Classic runs were removed without an actual archive | The conversion wording promised more history preservation than it performed | Implementation now settles/archives them; paid-pattern conversion independently retested |
| Fractional combat durations created non-integer match/recovery times | Normal battles produced saves rejected as “Invalid match” or “Invalid recovery time” | Integer scheduling regression and every pending/completed match in the earned run now pass validation |
| Craft max omitted treatment gold and graded quantities | An enabled maximum batch button requested more than the player could afford | With 6g and two tough ingots, a Warding dagger correctly offers max 1 and queues it |
| Smelt max omitted grade-specific coal | The displayed maximum batch failed when selected | Four coal with Spring bronze now offers max 1, consumes three and leaves one |
| Concurrent smelts attributed grades from combined stock growth | A standard batch filling the last bin space could wrongly become premium when a simultaneous premium batch overflowed | Standard-then-tough parallel completion at cap−1 now accepts one standard ingot, zero tough ingots, and loses five output as expected |
| Unequip ignored space reserved for unfinished crafts | A 22-slot warehouse could reach 23 items without buying storage | Unequip is now rejected atomically when 21 stored pieces plus one active output already reserve all 22 slots |

The review also identified that a champion's style should belong to the league rather than change with the previously selected ordinary rival. The implementation agent fixed the champion style mapping. The first-champion earned test deliberately challenged the same Iron Choir configuration before and after upgrading.

### Later-tier and Legacy checks

The controlled capability scan set the necessary achievements, attributes, mastery and funds, then purchased material/pattern paths through commands. All **51 ordinary patterns per tier across tiers 1–5** were craftable when their intended gates were met. Legacy-exclusive patterns were excluded. This found no residual old-quest machinery gate or circular material dependency, but it does not prove that earning all those resources has good pacing.

A baseline combat scan equipped matching-tier Q80 standard gear without treatments or enchantments. That baseline beat the first champion styles and lost at the later tiers. Do not treat this as proof of an impossible campaign: the scan deliberately omitted the new preparation systems, later quality investment and strong character progression. It does show why later testing must measure actual build choices rather than assume a material upgrade alone guarantees promotion.

The independent late-game regression uses an explicitly controlled first-generation team with high attributes, level-30 fighters and Q200 prestige equipment, including legal high-tier affixes, grades, treatments and enchantments. It wins the final champion through the real command/simulation/settlement path and opens Legacy. This establishes that the final gate is mechanically completable by available systems; it is not a fair economy or probability test for acquiring that exact loadout.

From that completed state, all three charters were checked separately through retirement and new character creation:

- **Workforce:** the next generation begins with two regular miners.
- **Patron:** the normal 12g opening receives the promised additional 60g.
- **Archive:** Guild patterns and mastery level four are present.
- Sparks are awarded once; league progress resets; a chosen heirloom retains its identity, grade, treatment and protection; all resulting saves validate.

### Remaining validation limits and recommendations

1. **The full earned campaign remains unmeasured.** No claim is made about first-retirement duration, later-tier contract profitability, getting prestige mastery on several equipment classes, or the total preparation needed for later champions.
2. **One earned policy is not a profession balance study.** Fresh creation works for seven callings; this review did not earn an entire opening with each profession or test several random seeds of the new economy.
3. **The new opening was actively supplied.** The online/offline supply comparison is a controlled invariant check, not a multi-hour unattended earnings comparison. Run five-minute, fifteen-minute and longer idle policies once the complete campaign path is stable.
4. **Mastery should explain the next task.** The first material promotion feels earned, but the following 35-minute class-practice interval needs clear feedback and useful commercial outlets. Measure this interval across shields, armour and ranged weapons before increasing timers or prices.
5. **Preserve the observed loss-and-rematch shape.** The first defeat left cash, options and retained equipment. That is a better basis for slow, satisfying progression than adding fees, losing qualification or making every timer longer.

Browser layout, Blender assets and portable packaging were outside this engine review and are being verified separately. The final result here is a sound tested opening and repaired transaction/save invariants, with explicit later-campaign balance work still to measure.
