# Ember and Iron Game Specification

Version 0.5 • 24 September 2026 • A clear next step in a living blacksmith RPG

## 1 Vision and complete game scope

The player is the blacksmith behind an adventuring frontier. They turn materials into memorable equipment, develop a personal smithing build, grow a staffed workshop and watch customers succeed or struggle because of the work they sold. The promise is **make something, see it matter, become a better smith**.

The player runs the forge, quarry and shelves. Adventurers run their own lives: they walk into the shop, browse useful equipment, buy what they can afford, prepare expeditions, form parties, battle, recover and return. This revision puts a clear next goal above one focused workspace with Mine, Forge and Shop tabs. Expressive, colorful 16-bit scenes reflect the actual simulation. The complete RPG system remains accessible through a single Manage drawer.

The player's decisions are what to mine, what to make, which class to practice, what to put on display and where to invest. A high-quality sword on a shelf is an indirect decision about the next adventure; the player does not need to assign every customer a quest or confirm every sale.

![Living village and player agency](diagrams/living-village.svg)

| Area | Expanded local playable scope |
| --- | --- |
| Smith | Four meaningful stats, 50 levels, three points per level, twelve proficiencies |
| Items | 60 authored recipes: twelve classes across five tiers |
| Equipment | Weapon, body, offhand, ring, charm and tool slots; two-handed restrictions |
| Workshop | 20 ranked upgrades, up to three ordinary production lanes and a fourth through Legacy |
| Quarry | Owned material production, five improvement tracks and four worker roles |
| People | Four shop staff roles, six autonomous hero archetypes, up to twelve named adventurers |
| World | Six regions, twelve quests, branches, parties of up to three and phased bosses |
| Collection | Recipe discoveries, affixes, enchantments, masterworks and epic/legendary stories |
| Legacy | Optional retirement, one physical heirloom and recipe exemption, 24 permanent talents |
| Presentation | One next goal, three focused workspaces, original 16-bit scenes and an optional adventure theatre |
| Persistence | Local save, backup, export/import and eight-hour offline catch-up |
| Optional service | A future cloud-save adapter and automatic cross-device synchronization |

The local game is a standalone HTML application with no required account or server. Optional cloud saves require a real service and are not claimed as connected functionality in the local build. Manual export/import allows moving a save between devices now.

The opening is deliberately lean. Basic crafts take roughly 30–50 seconds before modifiers, authored duration multipliers across the five tiers are 1 / 1.8 / 2.8 / 4 / 5.5, and expeditions take 60–240 seconds. A first iron specialization should take roughly 30–60 minutes of engaged play. Small margins, limited quarry output and unreliable adventurers make early choices matter. Progress still begins within minutes through stats and proficiency. All numerical tuning is proposed and subject to playtesting.

There is no premium currency, energy meter, forced daily streak, permanent adventurer death or mandatory retirement.

## 2 Smith agency and the autonomous world

**Stats must matter.** Several invested points should visibly change speed, quality, income or access, rather than merely changing a number in the character sheet.

**Equipment has consequences.** Reports attribute damage, protection, resistance and support to the actual named item.

**Specialization stays flexible.** Deep proficiency improves both quality and production speed. Discovering a new recipe creates a choice, not an instruction to abandon the profitable class already mastered. Diversifying attracts different customers and counters; practicing the current class produces better equipment faster.

**Shelves are the sales policy.** Displayed stock is offered for sale from the start, including rare items. Protected and reserved items are excluded. The production assistant controls repeat crafting and material procurement; ordinary customer life does not require hiring an assistant.

**Discovery has finite routes.** Stories, milestones and pity prevent essential unlocks from depending indefinitely on luck.

**Legacy is optional.** A player can keep their workshop. Retirement creates another progression path and unlocks permanent talents.

1. Mine or develop quarry production, then choose an available recipe.
2. Queue work, optionally improve its technique, and decide whether to deepen that class or diversify.
3. Finished work fills free shelf spaces. Overflow stays in the stockroom until the player fills empty shelves.
4. NPCs walk in, browse displayed equipment and buy compatible, affordable improvements automatically.
5. Shoppers choose suitable quests and form eligible guild parties. They depart without player dispatch commands.
6. Battles resolve through the same seeded simulation while the player keeps crafting.
7. Victories bring gifts, discoveries and relationships. Defeats bring a recovery period and a search for better gear or an easier route.
8. The smith reinvests in stats, proficiency, stations, quarry, staff, decor and an optional Legacy.

![Autonomous living-village game flow](diagrams/game-flow.svg)

Crafts, visitors, expeditions and rewards have independent states. A sold item cannot also be salvaged. A returned quest pays once. Walking, browsing and checkout animations present those real events; they never invent a sale or create a second reward.

The deeper decisions remain: a mature sword specialization can produce reliable stock efficiently, while a new bow line may attract Rangers and open different expedition counters. Access to another recipe is an opportunity, not a command to abandon a useful specialty.

## 3 Character creation, levels and strong stats

Start at level 1 with Strength 2, Precision 2, Charisma 2 and Knowledge 2. Distribute eight additional points, with a creation maximum of 6 per stat. Every ordinary starting build totals 16. Legacy starting-stat bonuses are applied separately after the initial allocation and may exceed this creation limit.

Every smith level grants three unspent stat points, up to level 50. The next level costs `ceil(60 × currentLevel^1.15)` XP since the previous level. A completed craft awards `12 × recipeTier` smith XP. At the level cap, retain excess XP for future content without awarding unintended points.

| Stat | Exact base effect | Additional value |
| --- | --- | --- |
| Strength | Craft speed denominator gains 0.07 for each point above 2 | +2 finished-item slots per full three points above 2; heavy-class quality +0.5 per point above 2 |
| Precision | +2.5 quality per point in the quality formula | Affix chance starts at 10%, gains 0.8 percentage points per point above 2, with a final 55% cap including declared modifiers |
| Charisma | Sale multiplier is 1 + 0.035 × (C − 2), capped at 2 | Customer budgets ×(1 + 0.04 × (C − 2)); hiring discount up to 40%; customers wait six extra seconds per point above 2 |
| Knowledge | +1.5 quality per point in the quality formula | Proficiency XP ×(1 + 0.06 × (K − 2)); enchant strength +3% per point above 2 |

The Charisma hiring discount is `min(0.40, 0.015 × (C − 2))`. Stat effects and talent effects are listed separately in previews, with the final combined number shown before committing.

Example starts in Strength / Precision / Charisma / Knowledge order:

- Forge specialist: **6 / 4 / 2 / 4**.
- Meticulous smith: **3 / 6 / 3 / 4**.
- Merchant: **3 / 3 / 6 / 4**.

Compared with Strength 2, Strength 6 gives a 1.28 crafting denominator and about 22% shorter times, plus two finished-item slots and +2 quality on heavy classes. Raising Precision from 2 to 6 adds 10 quality and 3.2 percentage points of ordinary affix chance. These differences should be visible immediately.

Respec is free before the first completed craft. Later respec costs 200 gold and requires an empty queue and no active jobs. It returns only spendable run stat points; it does not remove permanent talent bonuses or wipe collection records. Basic recovery production remains possible for every legal allocation.

### Proficiency and specialization

Track twelve independent proficiencies: Daggers, Swords, Axes, Maces, Polearms, Bows, Foci, Armor, Shields, Rings, Charms and Tools. Crafting awards only the relevant class XP.

The next proficiency rank costs `6 + 2 × currentProficiency` XP. A craft awards `8 × tier` before Knowledge and talent modifiers. Trivial tier-one work awards reduced XP after proficiency 25; use 25% of its usual XP. Retain fractional XP.

Fifteen ranks require 300 XP: approximately 34 basic crafts at Knowledge 4, or 38 at Knowledge 2. Higher tiers require proficiency 0 / 15 / 30 / 50 / 75 respectively. The full iron transition also needs materials, stats and a station; its pacing target is 30–60 minutes rather than an automatic unlock after a few crafts. The Ancient Script talent reduces a recipe's proficiency gate by five, with a floor of zero.

Each proficiency point adds 0.65 quality and 0.006 to the craft-speed denominator. Fifteen ranks therefore add 9.75 quality and 0.09 speed denominator, making continued practice valuable even after a new recipe is discovered. Later classes begin at zero unless Living Archive grants their starting proficiency. Repeated sales, cancellations and report views award no craft XP.

## 4 Item category tree and five-tier catalogue

![Full item category tree](diagrams/item-tree.svg)

| Class | Main identity | Typical users |
| --- | --- | --- |
| Daggers | Fast precision weapons | Duelist |
| Swords | Flexible, balanced weapons | Vanguard, Duelist |
| Axes | Slow, powerful hits | Breaker |
| Maces | Armor penetration | Breaker |
| Polearms | Reach and frontline equipment | Guardian |
| Bows | Ranged damage and critical attacks | Ranger |
| Foci | Elemental damage and magical support | Mage |
| Armor | Body health and defense | All archetypes |
| Shields | Offhand protection | Compatible frontline archetypes |
| Rings | Focused offensive or defensive bonuses | All compatible archetypes |
| Charms | Resistance and expedition utility | All compatible archetypes |
| Tools | Material acquisition and specialist support | All compatible archetypes |

The complete content registry is the Cartesian set of these twelve classes and five authored tiers, totaling 60 recipes. The visible catalogue contains only the currently unlocked subset. Each entry has its own ID, name, cost, time, combat contribution, requirements and traits. Names reflect construction: a bow can be reinforced with an alloy rather than made entirely of that metal; armor can combine leather and metal.

| Tier | Material family | Stat gate | Proficiency gate | Ordinary discovery route |
| --- | --- | --- | --- | --- | --- |
| 1 | Bronze and basic wood/leather | 2 | 0 | Starter construction knowledge and stations |
| 2 | Iron and reinforced components | 5 | 15 | Smith level 3 OR the Quarry milestone |
| 3 | Steel | 9 | 30 | Ember region clear |
| 4 | Mithril and exotic components | 14 | 50 | Frost region clear and its epic story |
| 5 | Starforged alloys | 20 | 75 | Starfall/Void finale or its alternate legendary story |

Apply the tier's stat gate to the recipe's listed relevant stat or stats, not automatically to all four stats. Charisma is not a universal crafting gate. The recipe catalogue shows only entries whose discovery, station, stat and proficiency gates are met. A visible recipe can still lack materials; its card explains that shortage. Progression summaries describe newly earned capabilities without filling the catalogue with locked future items.

The world order is Town, Quarry, Ember, Wildwood, Frost and Starfall. Wildwood expands party and counter choices between steel and mithril rather than adding an unlisted sixth equipment tier.

No quest requires the only equipment it unlocks. Quarry can be cleared with bronze; Ember with iron; Wildwood and Frost with suitable steel and teamwork; Starfall's unlock route must remain possible with mithril, party levels, counters and supporting equipment.

### Separate item properties

Every item has a recipe, class, material tier, rarity, numeric quality, affix, enchantment and provenance. A common item may be a masterwork, and a rare item may be poorly made.

Authored rarity progresses broadly as tier 1 Common; tier 2 Common or Uncommon; tier 3 Uncommon or Rare; tier 4 Epic; tier 5 Legendary. Rarity denotes availability and special properties, not a substitute for quality or a hidden second material multiplier.

Quality bands are Rough 0–19, Serviceable 20–39, Fine 40–59, Superior 60–84 and Masterwork 85–100. Masterwork collection recognition and masterwork commissions use the same threshold of **85**.

## 5 Crafting mathematics, affixes and enchanting

`quality = round(clamp(18 + 2.5×Precision + 1.5×Knowledge + 0.65×proficiency + stationQuality + talentQuality + heavyBonus + techniqueBonus − recipeDifficulty, 0, 100))`

`craftSeconds = recipeBaseSeconds / (1 + 0.07×(Strength − 2) + 0.006×proficiency + speedBonuses)`

`itemQualityMultiplier = 0.70 + 0.008×quality`

Heavy bonus applies to the content-defined heavy classes, including axes, maces, polearms, armor and shields. Its base value is `0.5 × (Strength − 2)`; Heavy Forms adds six further quality to those classes.

At Precision 4, Knowledge 4 and no other bonuses, an ordinary difficulty-zero item has quality 34 and a combat multiplier of 0.972. Quality 85 gives 1.38. This multiplier applies to item contributions, not the hero's entire innate attack or health. Tier strength belongs in recipe data, avoiding double-counted material multipliers.

Technique is a single optional +5 quality choice for the active item. It has no timing hurdle or miss penalty. Automated items receive no manual technique bonus unless that active job had already earned it before the player left.

### Affixes and enchantments

An affix is a seeded property of an individual craft. Its chance uses Precision and declared modifiers, captured when work starts. Measured Lines adds 15 percentage points, subject to the final 55% affix-chance cap. The affix pool and effect are visible in the collection, and reloads cannot reroll a completed item.

Enchanting becomes available through its station. The player selects an owned eligible item and a defined enchantment, sees its cost and exact change, and confirms the operation. One enchantment slot prevents unlimited stacking; replacing it consumes the new cost and replaces the old effect. Enchant strength is `1 + 0.03 × (Knowledge − 2) + enchantBonuses`; Runic Resonance adds 0.25 to that coefficient. Flat enchant additions and percentage affixes are separate data fields so a +8-health enchant cannot accidentally multiply health ninefold.

Affixes and enchantments can improve damage, health, armor, resistance or utility only where the corresponding effect is implemented. Item cards list their actual contributions. Rarity color alone never promises an invisible combat effect.

### Masterworks and recipe stories

Quality 85 or greater adds the appropriate crafted entry to the masterwork collection. A named masterwork commission additionally asks for a class, tier and optional trait, then awards its stated reward once. Repeated copies remain sellable but do not repeatedly add the same collection achievement or inflate the run's unique-masterwork count.

Epic and legendary stories connect victories, discoveries and demanding crafts. Milestone rewards guarantee their recipe route. Alternate story branches can offer different materials or relationship rewards while preserving a later path to the complete collection.

## 6 Queues, parallel production and capacity

Begin with one active lane and three waiting slots. One item consumes one job slot; a quantity request creates separate jobs. Ordinary station upgrades add up to two production lanes, and Twin Anvils can add a fourth.

Reserve inputs when queueing. Snapshot stats, stations, duration, automatic quality and seed when a job starts. Reserve a finished-item slot before starting. Waiting jobs use values at their actual start. Finishing consumes escrow permanently, creates one item and awards XP once.

Starting finished capacity is `24 + 2×floor((Strength − 2)/3)`, plus upgrades and talents. Materials, display slots, waiting slots and output capacity are separate limits.

Cancellation returns all reserved inputs and discards elapsed work. Deterministic quality and saved item seeds prevent cancellation or reload from becoming a profitable reroll. Refund overflow remains safely pending or enters the mailbox. Reordering cannot duplicate reservations.

An item can be stored, displayed, protected, reserved, enchanted, bought by a customer, consumed by a matching commission or salvaged. These are mutually consistent states. Completing a craft automatically uses a free shelf position; overflow stays private in the stockroom. “Fill empty shelves” lists additional unprotected, unreserved stock in one action. Taking an item off display withdraws it from sale. Rare equipment is sellable when deliberately displayed; the inherited heirloom starts protected. Salvage returns only its declared common-material fraction; it does not refund rare ingredients or create an enchantment-cost loop.

## 7 Economy and 20 ranked workshop upgrades

Start with **18 gold, six bronze, four wood, four leather and six fuel**. This supports about three ordinary starter crafts, depending on the chosen class. The shop initially makes only one to three gold of margin per suitable sale using purchased common inputs. Early speed, quality and capacity improvements begin at 24–36 gold; specialist stations begin around 40–50 gold, with larger investments at 70–160 gold. Hiring the first quarry worker costs 12. Ordinary materials have repeatable suppliers; advanced suppliers and exotic materials have explicit unlock sources.

`salePrice = round(basePrice × (0.75 + 0.004×quality) × charismaMultiplier × otherPriceBonuses)`

Starter nominal prices are 6 gold for a dagger; 8 for sword, axe, mace or armor; and 7 for a shield. At quality 34 and Charisma 2, a sword sells for 7 gold against roughly 6 gold of retail inputs: only 1 gold margin. Charisma, proficiency and owned material production gradually improve this. Sale value combines authored recipe price, quality and the Charisma multiplier. Customer budgets gain their separate Charisma adjustment. Trusted Name increases final sales by 10%; Guild Purse increases budgets by 20%. Previews show the total, and no hidden budget adjustment forces a purchase.

The town buyer gives a low-margin recovery offer for unwanted player-crafted stock. A reclaimed-material action provides basic work if the player owns no sellable stock and cannot afford a basic bundle. Every legal build can recover ordinary income.

Customer budgets scale with the equipment economy rather than remaining at cellar prices. Before Charisma and other budget bonuses, quest tiers 1–5 provide **16 / 40 / 110 / 300 / 850 gold** respectively. This keeps early trade lean while allowing customers to buy steel, mithril and starforged equipment. New visitors can consider any unlocked quest within the guild's party capacity; defeated returnees retain their failed objective while autonomously comparing a retry with a safer route.

The following matrix defines twenty upgrade roles. Exact rank prices and caps are content data and must be shown in the UI; a capped purchase becomes visibly complete rather than silently charging again.

| Upgrade role | What a rank or unlock changes |
| --- | --- |
| Precision anvil | Adds crafting quality |
| Improved bellows | Adds craft-speed bonus |
| Heavy forge | Enables demanding heavy constructions |
| Fine tool set | Enables fine weapon construction |
| Bowyer's bench | Enables advanced bows |
| Rune workbench | Enables advanced foci and charms |
| Jeweler's bench | Enables advanced rings |
| Armor fitting bench | Enables advanced armor and shields |
| Toolwright's bench | Enables advanced utility tools |
| Research library | Supports complex recipe work and proficiency |
| Enchanting table | Unlocks and improves enchanting |
| Parallel stations | Adds up to two ordinary production lanes |
| Queue racks | Adds waiting job slots |
| Material warehouse | Increases loose-material storage |
| Display shelving | Expands finished inventory and visible stock |
| Guild hall | Enables parties and increases party size up to three |
| Trade counter | Improves customer flow |
| Automation desk | Enables explicit repeat-production and material-procurement policies |
| Supply logistics | Improves permitted material procurement |
| Expedition office | Improves expedition support and return handling |

The registry gives each role its concrete implemented modifier. A construction unlock, extra lane and percentage improvement are different effects and are labeled accordingly. Upgrades never erase material, proficiency or story requirements unless they explicitly say so.

### Staff and decoration

| Staff | Purpose | Development |
| --- | --- | --- |
| Apprentice | Supports assigned production | Gains ranks from completed workshop work |
| Quartermaster | Supports supplies and material policy | Gains ranks through relevant logistics work |
| Envoy | Supports customers and commercial policy | Gains ranks through relevant trade |
| Runekeeper | Supports advanced craft and magical work | Gains ranks through relevant craft/enchantment work |

Staff has a one-time hiring cost, modified by Charisma and Fair Contracts. Assignment is optional. Work-based ranks and each rank's exact effect appear on its card. Staff does not imply recurring wages unless a future version explicitly adds them. Their bonuses improve an already living shop; they never unlock permission for customers to buy or travel.

Four decorations provide visible shop growth and modest, real bonuses in morale/production, reputation, customer activity or a lasting workshop benefit. Their IDs and modifiers are authored content. Decor survives retirement, so the retirement screen shows its retained effects.

The shop scene reflects station, staff and decoration milestones. Furnace activity, craft completion and character presence make growth visible without making artwork responsible for simulation timing.

### Owned quarry and processed material production

The player owns a small quarry from the beginning. It is a second investment loop: develop a deposit, assign workers, improve extraction and processing, then use the resulting better material in better items. It reduces cash spending without providing unlimited immediate output.

The initial worked deposit produces **one bronze unit every 45 seconds** without wages. An optional manual action has a **five-second cooldown** and yields one selected basic bronze or fuel unit. It speeds active recovery but is not required for idle progress. The quarry includes simple on-site processing: the interface states “Ore processed into usable metal stock,” and completed output enters the same material inventory used for crafting. There is no hidden second smelting queue or fuel deduction in this version.

Quarry sources cover ores, coal/fuel and gems. Wood and leather remain vendor or expedition supplies. Better deposits change the material tier and its authored recipe power, rather than adding an undisclosed quality multiplier to an otherwise identical ingot.

| Deposit or process | Unlock and purpose |
| --- | --- |
| Starter bronze working | Available immediately; limited common metal production |
| Iron seam | Depth 2 and smith level 3; supports the iron transition |
| Steel processing | Smelter upgrade, depth 2 and Ember Shrine victory |
| Mithril seam | Depth 4 and the relevant Frost/epic milestone |
| Star ore | Final-boss or alternate legendary-story completion |
| Coal and gem pockets | Explicit depth/survey discoveries for fuel and enchanting |

Four worker types are **Miner**, **Digger**, **Smelter** and **Surveyor**. Miners improve usable yield, diggers improve extraction cadence, smelters improve processing and advanced material access, and surveyors support richer deposits or discoveries. Hiring the first worker costs 12 gold; later hires and ranks have visible costs and effects. Workers have no recurring wages. Assignment and ranks are saved, and a purchased rank must visibly change its stated output.

Five improvement tracks are **Depth**, **Tools**, **Haulage**, **Smelter** and **Safety**. Depth unlocks deposits; tools improve extraction; haulage expands collection capacity or transfer throughput; smelter enables alloy processing; safety improves reliable working efficiency. Costs and prerequisites appear before purchase. Safety does not introduce worker death or an unexplained random loss tax.

Output respects loose-material capacity and any collection buffer. A full destination pauses production safely, with a visible reason. Manual mining cannot bypass the cooldown, capacity or an undiscovered deposit. The same scheduler credits passive quarry production offline up to the ordinary eight-hour cap. Legacy resets development to the basic owned quarry while preserving the selected heirloom and other stated permanent benefits.

## 8 Six adventurer archetypes and equipment

| Archetype | Typical equipment | Distinct combat contribution |
| --- | --- | --- |
| Vanguard | Sword, armor, compatible shield | Balanced frontline performance |
| Duelist | Dagger or sword, light accessories | Faster attack cadence |
| Breaker | Axe or mace, armor | Armor penetration |
| Ranger | Bow, tools and charms | Critical attacks |
| Guardian | Polearm or compatible shield setup | Reduces damage suffered by the party |
| Mage | Focus, rings and charms | Area attacks where enemies permit |

Each hero has a named identity, archetype, level/XP, equipment, relationships and history. Keep the recruitable named roster to twelve heroes. Hero XP comes from actual expedition progress; Field Notes increases it by 20%. The level and passive effects are shown rather than hidden in the class name.

Slots are weapon, body, offhand, ring, charm and tool. Two-handed weapons block the offhand. Rings, charms and tools provide their own defined effects. Replacing equipment retires the old NPC item without duplicating it into player inventory.

Every archetype keeps a baseline chance to visit. Additional attraction is normalized from compatible displayed stock, with duplicate caps. Protected storage and unfinished work do not inflate attraction. Stocking bows attracts Rangers; foci attract Mages; armor and accessories provide broader demand.

New arrivals have usable baseline gear and seek an improvement. They never require a complete player-made set before trading. Each NPC considers compatible, affordable, useful displayed equipment, buys automatically on the shop clock, and equips it once. A brief browsing/checkout interval lets the player see the purchase happen. The log and optional customer inspection explain what improved.

Customers keep their identity, gear and defeat memory between visits. Shop capacity and a full roster must never strand every hero at the counter: people finish browsing, prepare a trip, wait for needed gear, recover, or leave and return. A missing useful item creates a readable shopping reason, not a required player decision.

NPC decisions run every two seconds. A new arrival first inspects shelves after four seconds, then every six seconds. Its browsing period is 45 seconds plus six seconds per Charisma point above 2. It can buy several useful pieces within its budget before automatically preparing to leave.

Quest selection first favors an accessible, undiscovered objective with at least a 35% forecast. Otherwise it prefers the furthest known route with at least a 65% forecast, then the best available easier attempt. This permits risky exploration and recoverable failure without freezing an under-equipped village. Guild companions must have browsed for at least eight seconds and are selected for different archetypes where possible, up to the unlocked party size.

Relationships progress through purchases and expeditions. Milestones unlock reports, commissions, loyalty options and gifts once each. Ordinary commissions state their class, quality, tier, trait and reward; named masterwork commissions use the same interface with more demanding requirements.

### Automatic named commissions and relationship milestones

Each adventurer's relationship milestones trigger at 5, 15 and 30 points without a player claim action. The first awards simple fittings, the second a gem, and the third rare materials plus an eligible unknown recipe where available. Store the achieved milestones so reloading or revisiting the hero cannot repeat a gift.

| Relationship | Named commission | Minimum item | Payment and extra reward |
| --- | --- | --- | --- |
| 5 | A Trusted Commission | Compatible weapon class, tier 1+, quality 50+ | 1.5× normal sale value +3 gold; leather and 12 smith XP |
| 15 | Veteran Equipment | Compatible weapon class, tier 2+, quality 70+ | 1.75× normal sale value +8 gold; a gem and 24 smith XP |
| 30 | A Signature Masterwork | Compatible weapon class, tier 3+, quality 85+ | 2× normal sale value +15 gold; two gems and 40 smith XP |

NPCs accept their named commission automatically and look for a matching piece on the shelves. The item must be displayed, unprotected, unreserved, in the requested class, sufficiently advanced and good enough. The adventurer must be home and recovered. The shop log reports the contract and its payment; the player can inspect its needs and decide what to manufacture.

Automatic delivery consumes the item once, awards the stated payment and XP once, adds relationship progress and marks the commission complete. The customer equips the piece when it improves their loadout; a weaker commissioned piece does not replace stronger equipment already worn. A protected heirloom cannot be submitted. Commission rewards are a separate contracted budget, so an ordinary customer's browsing purse does not invalidate an accepted order.

## 9 World progression, branching quests and parties

| Region | Two-quest design role | Main progression |
| --- | --- | --- |
| Town | Tutorial encounter and a first repeatable commission route | Demonstrate equipment, returns and customer identity |
| Quarry | Road encounter and an armored sentinel | Iron access and armor-penetration counters |
| Ember | Fire-threat approach and shrine boss | Steel discovery and resistance choices |
| Wildwood | Scout route and coordinated encounter | Party composition, tools and branching rewards |
| Frost | Expedition approach and phased guardian | Mithril/epic story access and demanding protection |
| Starfall | Outer approach and a three-hero Void finale | Starforged/legendary story and endgame mastery |

There are twelve quests total, two per region. Exact enemy profiles, travel phases and rewards are authored content. Their ordinary total durations fall roughly between 60 and 240 seconds. Adventurers compare a safer familiar route with a more demanding reward using their equipment and the shared combat forecast.

Each run divides time into travel, a combat presentation budget and return. Resolve the seeded combat at departure; reveal its authoritative log over the expedition clock. Unused battle time becomes preparation or return waiting. Reward delivery occurs at the scheduled return, not when a player skips the animation.

NPCs resolve story branches such as more materials versus more loyalty as part of their expedition. The current preference is the alternate Starforge recovery route when offered, then a lasting-bonus branch, then the first authored branch. Persist the selected branch and announce the result in the journal. A branch can change rewards or unlock the next story objective; it must not permanently strand an entire equipment class. Repeatable reconciliation or the alternate story route preserves collection access.

### Party rules

The Guild Hall enables NPC-organized parties of up to three. A party with distinct roles receives 10% synergy; Shared Purpose replaces this with 20%, rather than adding another 20 points. Apply the bonus to its declared combat contribution once.

Each hero keeps an independent health total, attack schedule and loadout. Guardian protection applies according to its passive; Mage area damage affects valid enemies; Ranger critical attacks and other variable effects use the saved battle seed.

Party rewards belong to the expedition transaction and are not accidentally multiplied once per hero. Individual XP and relationship awards are applied separately. The finale explicitly requires three participating heroes, which the guild must gather automatically, so roster development and equipment breadth matter even though the player does not assemble parties manually.

### Boss phases

Bosses change behavior at 50% health. Their profile declares the new damage, cadence, defense, target rule or damage type. The battle log announces the phase and the preview explains its threat.

A transition does not heal the boss or erase accumulated damage unless that encounter explicitly declares it. Save phase state and process thresholds in a stable order. Offline, watched and replayed versions show the same transition and outcome.

## 10 Combat, forecast and overgeared returns

At departure, freeze complete hero stats, loadouts, enchantments, passives, talents, enemy content, branch choices and a seed. The combat model generates one authoritative event log. Attacks, critical results, target selection, protection and phases use the same deterministic event order.

Quality scales item contributions. Material tier sets authored base power. Armor, penetration and matching resistance alter damage according to their displayed effects. Minimum damage and target rules are fixed in the simulation and used by forecasts as well as live runs.

Victory requires the actual combat objectives before defeat or timeout. **There is no separate quest-success roll.** A replay shows the existing result and cannot reroll it.

Estimate success using **20 alternate seeds** of the same model. Show a rounded probability labeled estimate, alongside the main equipment or party mismatch. Cache by complete loadout and quest version. A forecast is uncertain and is never a promise.

Compare a party or hero with the quest's versioned benchmark appropriate to its participant count and roles. A score at least **125%** of that benchmark is Well equipped. The actual battle must still be won to receive the bonus.

A successful Well equipped return grants extra common materials and a seeded discovery opportunity. The **fifth consecutive eligible return without a discovery guarantees one**. Store the counter and reward seed. Unknown eligible recipes are preferred; exhausted recipe pools award useful rare materials instead of useless duplicates.

Ordinary milestones and epic/legendary stories provide guaranteed recipe routes. Discovering a recipe early bypasses its discovery condition only; it does not remove materials, stations, stats or proficiency.

Retreat returns the party with a defeat report and **90–180 seconds of recovery**. The smith keeps legitimate sale proceeds. The same named hero then returns to browsing with remembered gear and the failed quest, seeks an improvement and can retry. The NPC compares retrying with a safer unlocked route and chooses automatically. Quest selection uses the same success estimator as the battle watcher, with suitable party formation when a harder objective needs it. A missing suitable route produces waiting for equipment or another shopper cycle; it does not open a dispatch dialog. No permanent hero death or mandatory rescue fee is required.

Opening balance targets are deliberately uneven: the easiest Rat route with an ordinary crafted starter loadout should win roughly 70–85% of forecast seeds; the next Smuggler route only 25–45% until quality, armor or hero progress improves. A tutorial explains retreat and retry instead of secretly guaranteeing every first expedition. These are tuning targets verified against the actual battle model, not separate outcome rolls.

## 11 Optional Legacy and retained inheritance

Legacy first becomes available at **smith level 8 and six quest wins in the current run**. Retirement is optional. The first completed retirement unlocks the permanent talent tree.

Earn Sparks for the completed run:

`Sparks = 1 + floor(smithLevel/5) + floor(questWins/5) + floor(uniqueMasterworks/3)`

For example, level 8 with six wins and no unique masterworks grants three Sparks. Record the retirement transaction once and clear its run counters. A fresh workshop cannot repeatedly qualify using retained history. Collection achievements and run reward counters are distinct.

The confirmation screen shows eligibility, Sparks gained, existing permanent currency, the selected heirloom, losses and retained benefits. Retain a backup before applying the transaction.

| Retained permanently | Reset for the next workshop |
| --- | --- |
| Unspent Sparks and purchased talents | Run level, XP and allocated run stats |
| All discovered collection records and Legacy history | Run proficiency, except starting talent effects |
| Four purchased decorations and their benefits | Ordinary stations, staff, shop upgrades and quarry development |
| One selected physical heirloom | Other current-run inventory, gold and materials |
| Discovery exemption for that heirloom's recipe | Other active recipe discoveries and supplier milestones |
| Permanent talent effects | Heroes, relationships, party and quest-run state |

Collection records mean “discovered in the family history”; they do not automatically mean “craftable in this generation.” This distinction makes the chosen heirloom recipe valuable. It bypasses its discovery gate while still requiring its current stat, proficiency, station and materials.

The physical heirloom is protected on the new run and retains its quality, affix, enchantment and provenance. Heirloom Bond strengthens its combat contribution by 20%. Selecting a different inheritance requires another legitimate retirement.

Decor and collection survive, but ordinary run reputation and active story progression restart unless a named permanent reward explicitly says otherwise. The new-run screen summarizes the permanent advantages that were applied.

## 12 The 24-node permanent talent tree

There are four independent six-node chains. Every node has one rank and requires the previous node in its branch. Costs by depth are **1 / 1 / 2 / 2 / 3 / 4 Sparks**. The tree is previewable before retirement but becomes purchasable only after the first Legacy.

![Permanent Legacy talent tree](diagrams/legacy-tree.svg)

| Branch | Depth | Talent | Cost | Permanent effect |
| --- | --- | --- | --- | --- |
| Force | 1 | Practiced Hands | 1 | +12% crafting speed bonus |
| Force | 2 | Deep Stores | 1 | +8 finished-item capacity |
| Force | 3 | Heavy Forms | 2 | +6 quality for heavy classes |
| Force | 4 | Tireless Furnace | 2 | +2 waiting queue slots |
| Force | 5 | Twin Anvils | 3 | +1 production lane |
| Force | 6 | Founders Strength | 4 | +2 starting Strength after allocation |
| Artifice | 1 | Steady Eye | 1 | +4 crafting quality |
| Artifice | 2 | Keen Edges | 1 | +8% item attack contribution |
| Artifice | 3 | Measured Lines | 2 | +15 percentage points of affix chance |
| Artifice | 4 | Runic Resonance | 2 | +25% enchant strength |
| Artifice | 5 | Masterwork Tradition | 3 | +8 crafting quality |
| Artifice | 6 | Heirloom Bond | 4 | +20% heirloom combat contribution |
| Commerce | 1 | Trusted Name | 1 | +10% sale value |
| Commerce | 2 | Busy Counter | 1 | +20% customer-arrival cadence bonus |
| Commerce | 3 | Guild Purse | 2 | +20% customer budgets |
| Commerce | 4 | Fair Contracts | 2 | Staff hiring 25% cheaper |
| Commerce | 5 | Trade Network | 3 | Common materials 15% cheaper |
| Commerce | 6 | Family Fortune | 4 | +250 starting gold |
| Lore | 1 | Patient Study | 1 | +20% proficiency XP |
| Lore | 2 | Field Notes | 1 | +20% hero XP |
| Lore | 3 | Hidden Veins | 2 | +25% material loot |
| Lore | 4 | Ancient Script | 2 | Recipe proficiency gates reduced by five, minimum zero |
| Lore | 5 | Shared Purpose | 3 | Distinct-role party synergy becomes 20% instead of 10% |
| Lore | 6 | Living Archive | 4 | Start every proficiency at rank 10 |

Add like quality and capacity modifiers directly. Apply the Strength/speed denominator as written. Sale bonuses multiply the Charisma-adjusted price. Enchant, proficiency-XP and hiring-discount bonuses combine with their corresponding base coefficient; previews show each contribution and the final value. Customer interval is `baseInterval / (1 + totalArrivalBonus)`. Purchases round up to whole gold, so small-price discounts may only become visible after further investment. Never interpret faster arrivals as permission for negative intervals.

Permanent talent purchases are deliberate, single-rank transactions. No talent respec is assumed in the local build; the full effect and prerequisite are shown before purchase. Completing every branch costs 52 Sparks, giving several generations a long-term target without requiring completion to enjoy the current workshop.

## 13 Autonomous customers, production policies and offline time

Customer arrivals, browsing, purchases, commissions, expedition selection, eligible parties, battles, returns and recovery operate from the start, both online and offline. They are ordinary world behavior and do not depend on the production assistant or an auto-sale checkbox.

The player's commercial authorization is visible stock. Only displayed, unprotected, unreserved items are offered. A protected heirloom and private stock never enter the purchase candidates. Gold and item ownership change once at the actual purchase event, not when a sprite reaches a visual waypoint.

The production assistant is separate. Its policies select a recipe, target stock, permitted material buying, a minimum gold reserve and a maximum offline procurement budget. Leaving these policies off stops new automatic manufacture and purchasing; it does not stop villagers from buying existing shelf stock or pursuing their quests.

The quarry remains independently productive. Manual gathering is never synthesized offline. An ordinary absence can therefore contain quarry output, completion of queued jobs, shoppers buying the resulting displayed items, expeditions and returning rewards even before the assistant is hired.

Credit up to **eight hours** in one continuous offline period. Store simulation time separately from observed wall time and persist the credited duration and procurement spend for that period. Reloading while still absent cannot reclaim the cap or refresh its spending allowance. A genuine foreground return starts the next session according to the documented lifecycle.

Process returns, craft completions, quarry output, customer actions, permitted procurement and new job starts in a stable order. A large catch-up and equivalent smaller updates produce equivalent outcomes. Customer browsing and recovery timers advance during catch-up; no special frozen-customer mode remains.

Output space is reserved before production. Refunds remain owned even if loose storage is full. Overflow rewards enter a mailbox and unpack automatically when material space is available. A full mailbox keeps the next return pending, occupying its expedition slot while existing combat can finish safely. Material disposal and the recovery path prevent a full stock of the wrong resource from becoming a softlock.

The return recap groups production, sales, net gold, material use, wins, retreats and discoveries. It highlights actionable shortages or blocked capacity rather than interrupting for every transaction. Reading the recap never reapplies rewards.

## 14 A clear goal and one focused workspace

![Desktop living-village layout](diagrams/ui-layout.svg)

The ordinary screen has a compact header, a persistent **Next goal**, three primary tabs and one current workspace. Header information is limited to the shop identity, gold, smith level and Settings. **Mine / Forge / Shop** are the only primary work tabs. **Manage** opens the secondary drawer for Upgrades, Smith, Journal and Legacy. Returning from that drawer restores the current workspace and selection.

### The next useful step

The goal states an achievable outcome, the immediate action and why it helps. It offers one clear action that opens the relevant place. For example, “Forge your first Bronze Shortsword” leads to its material needs and craft button; “Make room for a delivery” leads to the relevant storage. Progress is based on actual state and cannot require clicking a completion or reward button.

Early guidance follows the concrete loop: obtain missing inputs, craft a useful item, let it reach a shelf, see the first real purchase, then invest or improve another piece. A running job changes guidance to its progress or an available supporting action. An empty shelf, blocked production or a missing input receives an actionable explanation. Later goals can suggest class mastery, an affordable improvement, a useful commission or another reachable milestone.

Show one priority at a time. The goal should remain stable until it is completed, blocked or superseded by a relevant interruption; it should not alternate rapidly with every customer event. It is guidance, not a compulsory quest: the player may choose another recipe or investment. Never promise an NPC sale or a battle victory as guaranteed. A wait state explains what is happening and leaves the player free to work elsewhere.

### Focused places and progressive detail

| Place | Visible work | Context kept nearby |
| --- | --- | --- |
| Mine | Gather bronze or fuel; select a usable deposit | Focused quarry scene, current output and the immediately relevant worker or improvement controls |
| Forge | One selected recipe, concise available-recipe picker, material requirements and one craft action | Focused forge scene, quality and time, the active job and optional technique; queue details expand when useful |
| Shop | Display places, fill empty shelves, withdraw or protect stock | Focused shop scene and one recent actual customer outcome; stockroom and special requests are secondary details |
| Manage → Upgrades | Compare and buy stations, staff, decor and production improvements | Relevant price, prerequisites and effect |
| Manage → Smith | Allocate stats and inspect class mastery | Current bonuses and meaningful advancement choices |
| Manage → Journal | Review collection, discovered adventures and records | Read-only customer stories and completed outcomes |
| Manage → Legacy | Review retirement, inheritance and permanent talents | Explicit retained and reset progress |
| Settings | Presentation, local save, export/import | Save status and recovery |

The Forge's selected item and the recipe picker must agree after filtering or changing class. A concise picker expands when the player wants a different recipe; a full catalogue must not dominate the default workspace. Material needs appear beside that recipe, and relevant shortages link to Mine or suppliers. There is no permanent material strip across every place.

Keep the active work and its main action visually stronger than supporting numbers. Customers remain visible in the Shop scene, with one recent outcome such as “Mara bought your sword · +8 gold.” Their roster, needs, gifts and history remain inspectable through secondary detail. Multiple counter, news, commission and battle cards must not compete with the current work. Empty secondary panels collapse.

### Original, expressive 16-bit presentation

Each place has a focused **640 × 240** scene, retaining an 8:3 aspect ratio. Forge shows the furnace on the left, smith and anvil in the center, and workbench on the right. Shop shows the display, checkout and entrance at a readable character scale. Mine shows a large quarry entrance, workers and processing in the foreground. The interface no longer presents all three rooms as a small repeated cutaway.

Use the visual language of colorful 16-bit platformers: saturated landscapes, strong silhouettes, dark sprite outlines, expressive poses, several shading tones and clear foreground/background separation. Characters are approximately 40 native pixels high, rising to roughly 60 pixels in focused rooms. Art is original; familiar period style does not require reused characters, logos, tiles, sprites or other Nintendo assets.

The scene remains a view of real state. Furnace activity follows active crafts; hammering follows the smith's work; shelves show listed item classes and empty positions; quarry workers and carts reflect assignments and output; customers follow actual browse, purchase, departure and return events. Owned improvements appear where appropriate. Animation never invents stock, a hired worker, a purchase or a victory. Accessible labeled controls provide every essential action without requiring precise clicks on sprites.

### Unlocked content only

Hide recipe entries until every non-material gate is satisfied: discovery, stats, proficiency, station and mandatory milestone. A known but currently unusable future recipe does not appear as a disabled card. Material shortages do not hide an otherwise usable recipe; show its precise missing inputs and normal supply actions.

A newly usable recipe receives one small announcement and appears in the relevant class. Empty categories collapse instead of displaying rows of locks. The collection emphasizes seen or crafted entries; optional aggregate progress may show how much remains without a wall of unavailable items.

### Optional adventure theatre and quiet feedback

The adventure theatre is a collapsible, watch-only side panel on wide screens and an expandable section below the current work on narrow screens. It starts compact and does not take space from the principal action when closed. Opening it reveals actual expeditions, health, phases and reports; it adds no party, quest, dispatch or reward-claim decisions. Changing the watched run cannot affect its result. Crafting continues while the theatre is open.

Use short, nonblocking notices for earned milestones. Shop shows recent real trade feedback, while Journal holds the longer history. Group repeated sales and routine returns. A defeat explains recovery without demanding a rescue click. Full storage, blocked production and unavailable saving are actionable exceptions. Delivered overflow rewards unpack automatically when material space exists.

### Responsive and accessible presentation

![Mobile living-village layout](diagrams/ui-mobile.svg)

On mobile, preserve the same order: compact header, Next goal, Mine/Forge/Shop tabs, focused scene and the current work. Manage opens a drawer rather than expanding the primary navigation into a long menu. Keep the main action and selected item's inputs close together. A closed adventure theatre occupies one small row. Expanded theatre and management content must be closable without losing the user's selection.

Controls support keyboard focus, explicit labels and touch-sized targets. Reduced motion holds the scene in readable poses while progress, stock, purchases and battle health still update. Quality, rarity and health use text as well as color. Technique remains an untimed choice. At 320- and 390-pixel widths, the objective and principal action remain readable without horizontal scrolling.

## 15 Local persistence and optional cloud adapter

Use a versioned local save with a last-known-good backup and a pre-retirement backup. Persist all state that affects outcomes: stats, proficiency XP, item instances, escrow, job snapshots, upgrades, staff work, decor, quarry deposits/workers/production clocks, visitors and their autonomous shopping/departure clocks, recent shop events, hero loadouts, parties, quest seeds and logs, phases, story choices, claimed reward IDs, collection, run counters, Sparks and talents.

Export creates a portable save file. Import validates schema and ranges before showing a replacement summary. Invalid files leave the current save intact; imported content is data and is never executed. Migrations preserve valid older progress.

Only one tab owns write access; other tabs observe or explicitly take ownership. Clamp negative elapsed time to zero. Crafts, sales, returns, talent purchases and retirement transactions are idempotent.

Optional cloud saving needs a real adapter with identity, secure storage and conflict handling. Automatic cross-device sync remains future service work. The local build offers functioning export/import and must label any unconnected service as unavailable, not simulate a connection.

## 16 Implementation and acceptance

Use vanilla browser HTML, CSS and JavaScript with a deterministic simulation independent of presentation. A shared content registry defines recipe objects, material costs, class compatibility, heroes, quests, phase rules, upgrades, staff, decor, enchants and talents. UI previews and commands use the same formulas.

The living-village design preserves all existing RPG content while shifting moment-to-moment control to mining, crafting and merchandising. The playable build implements the connected scope with autonomous NPC behavior. Artwork and narrative text may be concise in the initial release; a control promising an unimplemented effect is a defect.

### Required checks

1. Every legal starting build can craft, trade, progress through the tutorial after either combat outcome and recover from zero useful resources.
2. All 60 recipes have valid data and a reachable discovery route; all twelve proficiencies advance correctly.
3. Entry quests can be beaten using equipment available before their own unlock rewards.
4. Changing each stat causes its promised quality, speed, capacity, price, budget, waiting, hiring, XP or enchant effect.
5. Parallel production, cancellation, reload and refunds preserve all material and output reservations.
6. Affixes, enchants, 20 upgrades, four staff and four decor effects match their descriptions; owned improvements have truthful scene feedback.
7. Six equipment slots obey compatibility and two-handed rules without item duplication.
8. Hero levels, class passives, party synergy and automatic formation of the three-hero finale function.
9. Boss 50% phases and branching rewards resolve identically live, offline and after reload.
10. Forecasts use the combat model; no independent success roll contradicts the log.
11. Fifth-eligible-return pity, story guarantees and duplicate discovery handling work.
12. Quality-85 unique masterworks update collection and run counters once.
13. Production automation respects budgets and rare-material rules; autonomous NPC shopping respects display, protection and reservation states; full storage pauses safely.
14. Eight-hour offline reconciliation cannot be reclaimed by repeated reloads.
15. Retirement eligibility, Spark calculation, losses, retained records, decor and physical heirloom match the preview.
16. All 24 talent nodes enforce costs and prerequisites and apply their actual effects.
17. Export/import round-trips and invalid imports preserve the current save; write ownership prevents duplicate progress.
18. Desktop and narrow-screen layouts expose the village, craft/shelf/quarry actions and passive battle status without clipping, and essential actions work by keyboard.

19. Quarry manual cooldowns, passive yields, deposit unlocks, worker ranks and offline production respect storage and never award the same output twice.
20. Defeated heroes autonomously recover, seek improved gear and retry or take an easier route without disappearing from the roster or waiting for manual dispatch.
21. Early material costs, sale margins and forecast rates match the lean-opening targets; deeper proficiency remains competitive with diversifying.
22. Customers buy, fulfill commissions, choose quests, form parties and return online and offline without an assistant or player dispatch action.
23. Locked recipes never appear in the ordinary catalogue; eligible recipes remain visible when materials are missing.
24. The scene's shelves, walkers, checkout, forge and quarry visuals correspond to actual saved state and events; reduced motion preserves usable information.
25. A new player can identify the next useful action from one visible goal. Mine, Forge and Shop expose only relevant work, while the Manage drawer preserves access to every deeper system.
26. Changing tabs, recipe filters, the Manage drawer or the optional adventure theatre preserves valid selections and never reveals locked recipes or adds manual adventurer chores.

Measure first sale, return, meaningful stat choice, first quarry hire, new tier, automation cycle, party victory, masterwork and first Legacy. Watch for production outrunning demand, a dominant stat or branch, meaningless lower-tier recipes, weak diversification and long stretches without an interesting decision. Tune those relationships before adding further systems.
