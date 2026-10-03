# Ember & Iron v2.1 — idle-game enthusiast review

4 October 2026 · Review of main `3b9e058` · Production code and prices unchanged

## Verdict

The game has the ingredients for slow, satisfying progression, but its pacing is uneven. Workshop progress needs repeated attention while the entire customer-class catalogue can unlock through unattended failures. The next improvement should make each investment produce a visible new capability and let a prepared workshop run for longer. Broadly increasing prices or timers would amplify the empty stretches.

Keep the core: shared gold pressure between Forge and Smelter, proficiency versus equipment breadth, five-win quest gates, deliberately launched bosses, time-consuming finishing, and a tier-5 gate before powerful permanent Legacy rewards. These create worthwhile decisions.

## Evidence and limits

I inspected the current engine, content, upgrade registry, UI rendering, v2.1 verification notes, and the existing desktop Forge / upgrade / phone screenshots. I ran five fresh, deterministic engine scenarios with balanced starting attributes and the default Bladesmith profession. They use public game commands, no resource or level grants, and separate engines; the player's save is untouched. Samples every five simulated minutes validated successfully.

The active policy reproduces `tests/workshop-speed-test.js`: frequent manual mining, two eventual miners, bronze smelting, mixed training/standard crafts, early finishing, two Forge investments, supplies and occasional clearance. It is deliberately simple, not an optimal player. The readiness comparison changes only Merit spending. After minute 45, all active scenarios stop taking player actions for another hour. The repeat-production scenario additionally hires the Quartermaster at minute 45 and enables a dagger stock target of 20 with auto-buy and a zero gold reserve. This deliberately permissive setting probes the system rather than recommending it.

| Scenario | Observation |
|---|---|
| Existing active opening, 45 minutes | First craft 1.70 min; first sale 3.97; smith level 2 at 13.92; first victory 18.03. At 45 min: 46 crafts, 31 sales, 3 wins, 32 retreats, 54 gold. |
| Same opening plus pairs/readiness | At 45 min: 44 crafts, 35 sales, 12 wins, 18 retreats, 143 gold. Companion charter bought at 10.20 min. |
| Fresh game, no actions for 90 minutes | 0 crafts, 0 sales, 0 wins, 69 retreats and 69 Merits; smith level 1. |
| Fresh game, buy only class unlocks | Breaker at 6.30 min, Guardian at 14.10, Mage at 25.90. All six classes unlocked with zero crafts, sales or victories. |
| Active opening, then one idle hour | Only the existing queued piece completes. Sales remain at 31; 16 pieces remain unsold. |
| Active opening, then Quartermaster/repeat forge | Seven additional repeat crafts consume the remaining ingots. By minute 50 production has stopped; minute 105 still has zero ingots and full copper/tin/coal bins. |

The readiness case continues earning useful quest progress while unattended: 35 wins and 212 gold by minute 105, versus eight wins and 62 gold without those investments. This is evidence that informed upgrade choices already matter. It is not evidence that the whole campaign is too easy or too hard.

These probes cover one deterministic seed and at most 105 minutes. They do not establish optimal builds, first-boss timing, a full campaign duration, high-tier economy, or multi-generation balance. UI comments come from current source and saved screenshots, not a new live browser playthrough. Suggested targets below are design proposals, not measured outcomes.

## Priority findings

### 1. High — failures unlock the whole class progression without a functioning shop

**Observed:** Three new class upgrades cost 4, 8 and 16 Merits, and a failed expedition awards exactly as much currency as a successful one. The zero-crafting probe unlocks every customer class in 25.9 minutes. More customers then produce more failed expeditions: 125 retreats after 90 minutes, versus 69 with the starting three.

**Why it matters:** New customer types should celebrate the smith becoming useful. Currently, waiting through repeated defeat opens the entire class catalogue before the first sale. Defeats need consolation, but this currency makes them a substitute for the shop's central objective.

**Suggestion:** Keep limited recovery assistance from failure, but require an earned milestone for new classes: useful equipment sales, a regional quest clear, or a relevant boss. Award greater Merits for victories and restrict repeated failure income to a small catch-up allowance. Retain an early route to pairs so struggling beginners can recover.

**Code:** `world-engine.js:75`; `progression.js:100`; `advancement.js:19`; `engine.js:972`.

### 2. High — automated production stops at the Smelter

**Observed:** The Smelter supports only finite batches. Forge repeat-production does not request more ingots; auto-buy cannot purchase ingots because they are neither open seams nor purchased supplies. The Quartermaster probe stops within five minutes of enabling production, with raw materials still available. It also accumulates repeat stock that nobody buys.

**Why it matters:** This is an unattended production chain that breaks even after the player pays for automation. Buying more speed shortens how long it can run before attention is needed. The starting Smelter queue has six total batch positions: only 144 seconds of bronze work, before any speed upgrades.

**Suggestion:** Offer an early, modest “keep N ingots” policy, with ore reserves and a stop at the output cap. Later automation can coordinate multiple alloys and several customer-specific patterns. Keep manual intervention for discovering recipes, selecting priorities, upgrading equipment and bosses. The gold reserve should protect supplies rather than quietly allowing a stuck chain.

**Code:** `workshop-engine.js:99`; `workshop-engine.js:101`; `workshop-engine.js:109`; `engine.js:1011`; `world-engine.js:115`.

### 3. High — two visible automation promises are not implemented

**Code finding:** “Sell surplus to town” (`autoSell`) and “Allow rare-material crafting” (`allowRare`) are saved by `_automation`, but `_runAutomation` never checks either setting. The former does not clear surplus; the latter does not protect rare inputs.

**Suggestion:** Implement both rules with clear precedence and reserved/protected-item handling, or remove the controls until they work. Show an explicit reason when automation stops: no ingots, no demand, reserved gold, full inventory or forbidden material. Reliable controls matter more than another speed upgrade.

**Code:** `app.js:274`; `engine.js:745`; `engine.js:1011`.

### 4. Medium — the shop needs a clearer explanation of demand and stale stock

**Observed:** After the active opening, an unattended hour produces no further sales despite 16 finished pieces in stock. This is not by itself a buying bug: customers correctly require an affordable improvement. However, the player needs to see why each piece fails that test. Display restocking takes the lowest-quality stock first and does not rotate unsellable displays; automatic scrapping excludes displayed pieces.

**Suggestion:** Add short demand labels such as “Mara: useful, budget 18g”, “already outclassed”, “no customer can equip”, or “too expensive”. Show requests for the next useful improvement. Offer an optional stale-display rotation/clearance policy, preserving the user's lowest-quality-first restocking rule. Do not solve this by making adventurers buy infinite duplicates.

**Code:** `engine.js:341`; `engine.js:856`; `world-engine.js:97`; `world-engine.js:99`; `app.js:182`; `app.js:184`.

### 5. Medium — upgrade sections are readable, but many prerequisites are unrelated taxes

**Code finding:** The new branch construction sorts nodes by price and makes most into a single chain. Crew quarters requires a manual-mining lamp. Display expansion requires a patience upgrade. Reaching Salvage bench requires eight purchases costing at least 52 Influence in total, including relationship, stockroom, sponsorship and porter nodes. Most repeat ranks are optional because one rank unlocks the next node.

**Why it matters:** There are many nodes but fewer real choices than the count suggests. A player choosing an idle mining build must first buy a manual benefit; a player wanting stock management is sent through a long social chain. Conversely, cost-growth Legacy talents do little for paths mostly bought at one rank.

**Suggestion:** Keep the material and recipe main paths linear. Split support sections into short purposeful branches, with optional specialisation ranks. Show cumulative cost to a selected goal and actual next benefit, not only a rank counter. Use deliberate rank or milestone gates where needed instead of automatically chaining unrelated nodes by price.

**Code:** `advancement.js:21`; `advancement.js:24`; `progression.js:5`; `app.js:230`.

### 6. Medium — production actions and useful next steps are too far from the player's attention

**Visual evidence:** The 1440×1000 Forge screenshot places recipe selection around 600 pixels down and the primary Craft action below the visible viewport. On the 360×800 upgrade screenshot, the heading, wallet, explanation, tabs and branch total use about 450 pixels before the first card. The palette and inventory art are attractive; the issue is vertical priority.

**Suggestion:** Compress the room title, wallet and routine metrics into a tighter toolbar. Keep recipe/material/enchantment and Craft controls visible together, with a compact sticky action bar on phones. Preserve prominent upgrades, but attach one optional pinned milestone: “First iron weapon — ore ✓, crucible 65g, hammer 75g, swords mastery 9/15.” The generic far-off Legacy objective is less useful than the current production constraint. Warn about output loss when “Max” queues more ingots than will fit.

**Code/evidence:** `app.js:43`; `app.js:77`; `app.js:89`; `app.js:179`; `app.js:230`; `design/qa/version-2.1-forge.png`; `design/qa/version-2.1-phone.png`.

## Stats, quality and Legacy

**Stats:** Keep the diminishing returns and distinct roles. Show a next-point preview, including integer breakpoints and recipe requirements. An actual-engine spot check from 5/5/5/5 on a Bronze Short Sword gives Q34, 49.34 seconds, 6g and an 18g customer budget. Strength 5→6 changes work to 48.76 seconds but not storage or quality; Charisma 5→6 leaves this price and budget unchanged after rounding; Precision 5→6 gives Q36 and 14.8% prefix chance instead of 14%; Knowledge gives Q35 and raises proficiency gain from ×1.30 to ×1.36. These benefits should be understandable at allocation time. Do not broadly buff all four stats to compensate for weak explanations. `workshop-engine.js:65` and `workshop-engine.js:73`; `app.js:65`.

**Finishing:** The +20/+10/+5/+2/+1 sequence is a good decision between one excellent commission and several ordinary pieces. Keep it. Show the actual capped gain and total completion time; help the player recognise when a final pass is for a specific request rather than profitable routine production. Global quality purchases should visibly warn when the current quality cap suppresses their benefit. `workshop-engine.js:95`; `advancement.js:39`.

**Staff:** Stamina currently means full effectiveness only for the first 15 minutes, exhaustion after 50 minutes, and manual time-off/resume. This matches the requested mechanic but creates a check-in chore. A later paid shift-roster option could manage rest at lower average productivity, making automation an earned convenience. `world-engine.js:111`; `app.js:48`.

**Legacy:** Tier-5 eligibility and 46–66 sparks per completed campaign now support selective purchases. Workers and extra ingots are memorable rewards. All talents cost 828 sparks, implying roughly 13–18 campaigns for full completion before considering actual reward variation; this is arithmetic, not a forecast of elapsed playtime. Do not increase these costs again until full campaign and second-generation tests exist. First ensure a first retirement visibly shortens the repeated opening. The 33-spark final old Workforce talent gives only +2 starting Strength, while a new 12-spark talent gives a whole starting miner; that is a candidate for a more distinctive late-branch reward. `world-engine.js:20`; `advancement.js:51`; `data.js:187`.

## Recommended next balance pass

1. Fix the broken automation promises and give the Smelter a bounded repeat policy.
2. Make customer classes require successful smithing/quest milestones while retaining a failure safety net.
3. Add demand, next-point and next-upgrade impact previews; reduce scrolling to core actions.
4. Re-test active, five-minute check-in, fifteen-minute check-in and one-hour unattended policies across several seeds. Record first worker, first useful sale, first reliable quest, first material upgrade, first boss and time spent with no productive task running.
5. Only then set campaign/Legacy duration targets and tune costs. A useful proposed feel is a visible small improvement every few minutes early on, with larger material/class/boss milestones spaced farther apart. Slowness should come from planning and accumulating progress, not an unexplained idle machine.

Reproduce the engine probes with `node design/qa/idle-enthusiast-v2.1-probes.js`. Raw evidence is `design/qa/idle-enthusiast-v2.1-probes.json`.
