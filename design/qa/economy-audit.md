# Economy audit — 26 September 2026

The audit confirmed three pricing problems: repeat victories could buy the entire Legacy tree in one retirement; procurement discounts allowed profitable instant resale of rare common materials; and late worker prices were thousands of times out of scale with the whole mine tree. These are fixed. Paid storage bonuses that had no effect in the new bin model are also repaired.

The audit covers all 96 room nodes, all 24 Legacy talents, 60 recipe clearance prices, every tradable material, workers, staff, permanent decorations, enchanting, commissions, refunds, salvage and retirement. Eight focused economic tests supplement the 68 existing checks. Six more hours of public-action policy simulation were run after tuning, bringing this iteration's reported playtest coverage to 28 simulated hours.

## Legacy: reward progress, not repeated easy fights

Previously the reward was `1 + floor(level / 5) + floor(victories / 5) + floor(distinct masterworks / 3)`. The entire talent tree cost just 52 sparks. A level-8 smith with 300 easy victories earned 62 sparks, enough for every talent immediately.

The new per-generation reward is:

```
2
+ floor(log2(max(1, smith level / 8)))
+ floor(distinct quest designs won / 3)
+ floor(distinct masterwork recipe designs / 6)
```

Victory count still contributes to ordinary reputation and completed-quest Merits. Repeating the same encounter does not produce additional Legacy milestones. Retirement still requires level 8 and six victories. Quest history and masterwork designs used for this reward reset each generation; lifetime collection entries cannot repeatedly inflate the new generation's score.

Talent cost at branch depth `d` is now `ceil(2 × 1.75^(d−1))`: **2, 4, 7, 11, 19, 33 sparks**, or 76 per branch and **304 for all four branches**. This supports one or two meaningful early purchases, saving toward later talents, and sustained multi-generation growth.

| Controlled retirement fixture | Old sparks | New sparks |
|---|---:|---:|
| Level 8, six wins of one quest | 3 | 2 |
| Level 8, 300 wins of one quest | 62 | 2 |
| Level 16, 300 wins, six distinct quests, 12 masterwork designs | 68 | 7 |
| Level 32, 1,000 wins, all 12 quests, 30 masterwork designs | 217 | 13 |

Ten minimum-eligible retirement cycles now earn 20 sparks in total and cannot purchase half the tree. This is a controlled lifecycle test, not a claim that ten normal runs can be played instantly. Already-earned sparks and already-owned talents are retained exactly; no balances or purchases are removed from existing saves.

## Raw trading and clearance

A maximum legitimate procurement stack provides 57% discount: 16% old Supply Logistics, 16% mine Supply Contracts, 10% trained Quartermaster and 15% Legacy Trade Network. Previously starforged stock could be bought for 31 gold and immediately sold for 35; mithril could be bought for 13 and sold for 15. Buying and selling required no game time.

A batch of `q` materials now sells for:

```
floor(q × min(50% of base unit price, 60% of current supplier unit price))
```

The engine's `materialSalePrice(id, quantity)` is the shared UI/execution quote. All tradable materials and quantities 1–30 were checked at normal and maximum discounts: every immediate buy/resell cycle loses gold. Cheap materials may quote zero for a single unit; ten wood still sell for five gold. Splitting a batch no longer creates coins through repeated minimum-one-gold rounding. Buying and selling wood to train a Quartermaster now has a real cost.

Town clearance previously paid the full undiscounted input cost plus one gold. The new offer is:

```
max(1, min(floor(65% of current replacement inputs),
           floor(55% of ordinary customer item value)))
```

Every recipe at qualities 1, 50, 100 and 200 was checked with and without procurement discounts. Clearance stays below both purchased replacement inputs and the normal customer price. Crafting with mined resources still produces useful clearance income; buying every input merely to liquidate is no longer an automatic profit loop. Customer pricing itself is unchanged, preserving the reward for producing useful equipment.

## Room trees and workforce

Room upgrade ranks retain `ceil(base cost × 1.9^owned rank)`, prerequisite branches and their distinct currencies. All 96 nodes were checked for positive, strictly increasing rank prices. The all-rank costs below are structural totals, not a promise of completion within the six-hour economy playtest.

| Section | Nodes / purchasable ranks | All first ranks | Every rank | Currency |
|---|---:|---:|---:|---|
| Mine | 24 / 82 | 1,112 | 19,141 | Prospecting |
| Forge | 24 / 78 | 63,625 | 898,835 | Gold |
| Shop | 24 / 89 | 1,530 | 19,279 | Influence |
| Adventurers | 24 / 67 | 2,040 | 13,796 | Merits |

The former worker formula charged **15,609,452 Prospecting for the 29th worker**, versus just 19,141 to buy every mine upgrade rank. That was an extreme outlier.

With `n` workers currently owned, recruitment now costs:

```
ceil(2 × 1.8^min(n−1, 2) × 1.25^max(0, n−3))
```

The early prices remain **2, 4, 7**. Subsequent prices still grow exponentially, at 25% rather than 80% per hire: the 11th worker costs 31 instead of 397, the 21st costs 288 instead of 141,648, and the 29th costs 1,716. Existing workers and spent Prospecting are retained.

Prospecting accrual remains one point after 25 mined materials, then 30 more, then 35 more, etc. Purchases, refunds and salvage do not earn Prospecting. Room ranks remain paid from banked currencies; reputation and quest history are not erased when spending their corresponding points.

## Other prices and paid benefits

- **Staff:** authored hiring costs remain 55–120 gold, with bounded Charisma/Legacy discounts and a minimum multiplier. Subsequent staff ranks are earned through work rather than another hiring charge. There is no upkeep or rehiring refund loop.
- **Storage bug fixed:** the Quartermaster's former global `materialCapacity` bonus did nothing because world-game storage uses independent bins. Each rank now adds **3 capacity to every bin**, plus its existing 2% procurement discount. Existing Material Warehouse ranks similarly give **4 per bin per rank**. Existing hires and investments immediately benefit.
- **Permanent decorations:** one-time costs remain 45, 60, 80 and 120 gold (305 total). They survive retirement, cannot be bought twice and cannot be sold back. Retained benefits are intentional long-term investment.
- **Enchanting:** fees remain 8–28 gold plus consumed gems/quest catalysts. Slot, level and station gates apply; reapplying the identical enchantment is rejected. Rare catalysts are not directly purchasable. These costs were reviewed structurally; late-game enchanting throughput was not simulated.
- **Commissions:** require and consume a matching item once, apply their authored premium and bonus payment, and cannot be fulfilled repeatedly. Existing exactly-once tests pass.
- **Cancellation and salvage:** cancellation returns the exact escrowed inputs; salvage returns at most half of common inputs and excludes rare catalysts. Neither creates mining points. Existing queue, storage and duplicate-refund tests pass.
- **Legacy loops:** retirement resets working resources, statistics, workers, progression and unlocked quests while retaining only promised Legacy assets. Creating a new smith is still required. Existing spark banks/talents are not retroactively repriced or removed.

## Post-tuning accelerated playtest

Both policies use ordinary commands, normal starting resources, a deterministic seed and 30-second decision intervals. These are policy-agent results, not claims about all players.

| Profile | Duration | Crafts / total sales | Wins / defeats | Level | First iron craft | Retirement reward |
|---|---:|---:|---:|---:|---:|---:|
| Sword specialist | 4 hours | 194 / 191 | 156 / 21 | 8 | 40 minutes | **4 sparks**, eligible |
| Generalist | 2 hours | 68 / 50 | 79 / 10 | 5 | Not reached | 4 projected sparks, ineligible |

The specialist's first retirement can purchase two root talents, or one root and save toward its next upgrade. Under the old formula that same run would have generated 33 sparks. Its mastery/quest progression therefore grants an improvement without consuming the Legacy system in one run.

The specialist ended with 4,449 gold; the generalist with 1,479. First craft/sale/victory timings remained approximately 1.5/3–3.5/5.5 minutes. No overdue return, invalid save or failed policy command occurred. The specialist policy currently prioritizes iron machinery; remaining at iron is not evidence that the steel progression is broken.

The workforce adjustment does not alter these policies' hiring costs because they employ at most three workers. Further late-game and multi-seed tests should measure full-tree completion timing, late quest income, and twelve-hero throughput before changing the remaining large structural costs. Mine progression has both increasing point thresholds and escalating node costs; that deserves particular observation during longer idle runs.

Reproduce with `node --test tests/economy.test.js` and `node tests/economy-sim.js`. Exact scenarios, totals and checkpoints are in `economy-audit.json`. The earlier `accelerated-playtest.json` is deliberately retained as the pre-pricing baseline.
