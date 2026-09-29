# Ember and Iron Game Specification

Version 0.1 • 17 September 2026 • Browser incremental RPG

## 1 Game concept and design direction

The player runs a blacksmith shop on the edge of an adventuring frontier. They forge weapons and armor, build expertise, attract customers through the equipment they display, and watch those customers use their work in battle. Successful expeditions return gold, materials, relationships and new crafting possibilities to the shop.

The central promise is **make something, see it matter, become a better smith**. The player is the craftsperson behind an expanding cast of heroes. A blade should have a maker, an owner and a memorable result.

This specification defines the game systems, progression, interface, initial content and implementation boundaries for a first playable HTML game. All balance values are proposed starting values for testing, not measured outcomes. The working title is provisional.

### Player experience

- Short visits of 3–10 minutes support useful decisions: queue work, fulfil an order, spend a level point, improve a station or inspect a quest result.
- Longer sessions reward equipment planning and watching adventurers, with a small optional crafting bonus.
- Offline progress completes authorised work. Later automation can keep the business operating within limits the player chooses.
- RPG depth comes from smith builds, six crafting proficiencies, gear traits, adventurer relationships and quest unlocks.

The initial game is single player, local-first and playable without an account. There is no energy meter, premium currency, forced daily streak, permanent adventurer death or mandatory prestige reset in the first version.

### Design principles

**Equipment has visible consequences.** Battle records identify the item responsible for damage, protection and special effects. A better item can change the result of a quest.

**Specialization remains flexible.** Every initial stat allocation can craft starter equipment. The player can pursue a class deeply, then expand into another without resetting the shop.

**Idle play remains productive.** Optional interaction adds a modest bonus. Ordinary production never requires repeated clicking or attention to every craft.

**The next useful action is legible.** Locked recipes show exact missing requirements and where to obtain them. Progress bars display the next proficiency and level reward.

## 2 Scope and content plan

| System | First playable version | Expansion after validation |
| --- | --- | --- |
| Smith | Four stats, level points, six proficiencies | Specialization talents and masterwork commissions |
| Crafting | 12 recipes, bronze and iron, deterministic quality | Steel and exotic alloys, enchanting, affixes |
| Shop | One production lane, queue, display, seven upgrades | Parallel stations, apprentices and shop decoration |
| Customers | Vanguard, Duelist and Breaker; named repeat visitors | Ranger, Guardian, Mage and party contracts |
| Quests | Three regions, six repeatable quests, automatic combat | Parties, bosses with phases, branching quest chains |
| Rewards | Gold, materials, reputation, one rare recipe | Epic and legendary recipe stories |
| Persistence | Local save, export and import, eight offline hours | Optional cloud save and cross-device play |
| Presentation | Responsive workshop and persistent battle watcher | Illustrated shop growth and richer battle scenes |

The first version should prove a satisfying first hour and a repeatable several-hour economy. Timing targets below are goals for playtesting. The full category tree includes expansion branches deliberately outside the initial build.

## 3 Core game loop

1. Inspect stock, waiting customers and the next useful unlock.
2. Select an eligible recipe and a quantity. Reserve its materials and queue capacity.
3. Forge the item automatically. Optional technique input adds a small quality bonus.
4. Receive the finished item, smith XP and item-class proficiency XP.
5. Display or reserve the item. Displayed equipment influences future visitors.
6. Sell an appropriate upgrade to an adventurer or fulfil a commission.
7. The adventurer equips the purchase and departs on a quest. Crafting continues.
8. Watch the fight or let it resolve in the background. Successful adventurers return rewards and relationship progress.
9. Buy supplies and shop equipment, allocate level points, and unlock more demanding recipes.

![Game flow with crafting and quests operating in parallel](diagrams/game-flow.svg)

### Connected progression loops

| Loop | Main reward | Next decision |
| --- | --- | --- |
| One craft | Item, smith XP and class XP | Sell, display, reserve or salvage |
| Customer order | Gold and relationship progress | Which visitor and quest to support |
| Expedition | Gifts, reputation and discovery | Which recipe or shop upgrade to pursue |
| Specialization | More quality and recipe access | Deepen one class or develop a second |
| Business growth | Larger queues, better tools and automation | Production mix and resource budgets |

### State transitions

Craft jobs move through **queued → working → complete**. A job waiting for an output slot stays queued. Cancellation is a separate final state.

Customers move through **browsing → purchased → travelling → fighting → returning → available**. A failed quest inserts **recovering** after returning. A customer can also leave browsing without buying; this is not a combat failure.

Rewards move through **generated → delivered to inventory or mailbox → claimed**. Every reward has a unique identifier and can be applied only once.

## 4 Creating and improving the smith

Start at level 1 with Strength 2, Precision 2, Charisma 2 and Knowledge 2. Distribute eight additional points. No stat may exceed 6 during creation, so every starting build totals 16 points. The player sees quality, craft time and likely sales effects while allocating.

Every smith level grants two freely assigned stat points. The first build caps level at 20 and individual stats at 20; excess XP is retained for later content. All starter recipes require only the baseline stats of 2.

| Stat | Direct effect | Typical requirements |
| --- | --- | --- |
| Strength | Shortens crafting time | Heavy blades, axes, plate and reinforced equipment |
| Precision | Raises item quality | Daggers, fine edges and intricate fittings |
| Charisma | Raises customer prices and return gratuities | No mandatory crafting gates in the first version |
| Knowledge | Raises quality and explains quest counters | Advanced construction and rare recipes |

Example starts are Forge specialist **6 / 4 / 2 / 4**, Meticulous smith **3 / 6 / 3 / 4**, and Merchant **3 / 3 / 6 / 4**, in Strength / Precision / Charisma / Knowledge order.

The next level requires `round(80 × currentLevel^1.25)` XP, measured since the previous level. Basic crafts award 8 smith XP and advanced crafts award 14. A customer's first completed commission awards another 12; repeating the same commission does not farm this bonus. Sales and quest replay screens do not award craft XP again.

Point allocation is reversible before the first craft. Level 5 grants one free respec token; later resets cost 200 gold. Respec requires an empty craft queue. Learned recipes, class proficiency and quest milestones persist, but future crafts must still satisfy the current stats. Requirements are checked before materials are reserved.

### Class proficiency

Track Daggers, Swords, Axes, Maces, Armor and Shields separately from level. Proficiency ranges from 0 to 100. Crafting a sword improves Swords only. Light, medium and heavy armor share Armor proficiency in the first version.

The XP required for the next proficiency point is `10 + currentProficiency`. Basic recipes award 10 class XP; advanced recipes award 18. Basic XP falls to 25% once the class reaches proficiency 20. Store fractional XP so rounding cannot erase small gains. Apply XP on completion only, including offline completions; cancellation grants none.

The first 15 proficiency points require 255 XP, or 26 basic crafts. This makes an advanced class unlock a visible medium-term target. Proficiency also adds 0.35 quality per point. Later content can use milestones at 30, 60 and 100 for techniques and signature equipment.

## 5 Item taxonomy and identity

![Equipment category tree showing initial and expansion classes](diagrams/item-tree.svg)

Every item has several independent attributes. The interface must show them separately.

| Attribute | Meaning | Example |
| --- | --- | --- |
| Recipe | Shape, combat profile and requirements | Shortsword |
| Class | Which smith proficiency applies | Swords |
| Material | Construction tier and properties | Bronze or iron |
| Rarity | Recipe availability and special traits | Common or rare |
| Quality | Craftsmanship of this specific item | 44 out of 100 |
| Provenance | Identity and history | Forged by the player, sold to Mara |

A common sword can be beautifully made. A rare recipe can produce a poor specimen. Material is part of each recipe variant in the first version: Bronze Shortsword and Iron Longsword are separate recipes, rather than allowing every material in every recipe.

Quality labels are Rough at 0–19, Serviceable at 20–39, Fine at 40–59, Superior at 60–79 and Masterwork at 80–100. These labels never replace the numeric quality. Rarity labels are Common, Uncommon, Rare, Epic and Legendary; only Common and one Rare recipe ship initially.

Weapons contribute attack damage, attack interval and a class trait. Armor contributes defense and health. Shields contribute defense and a compatible block trait. Use three adventurer slots: weapon, body and offhand. Two-handed weapons occupy the weapon slot and prohibit an offhand item. The initial hatchets and maces are one-handed.

### Class combat identity

| Class | Role | Initial distinguishing rule |
| --- | --- | --- |
| Daggers | Fast attacks against lightly armored enemies | Short attack interval and high mobility profile |
| Swords | General purpose | Balanced damage and attack interval |
| Axes | Heavy hits | Damage profile favors fewer, larger attacks |
| Maces | Armored opponents | Ignore 1 point of enemy armor |
| Armor | Survivability | Adds health and armor; medium and heavy variants reduce evasion |
| Shields | Defensive support | Adds armor; later traits add blocks or resistance |

Armor weight penalties and evasion are expansion mechanics. Initial armor uses health and defense only, keeping the first combat model small. Material and recipe data carry the actual numeric combat profiles.

## 6 Crafting rules and quality

Crafting eligibility is **known recipe AND required station AND sufficient materials AND every listed stat requirement AND required class proficiency AND any mandatory quest milestone**. Empty requirement groups pass. An alternate unlock route must be written explicitly, such as `recipe scroll OR named quest milestone`; the rest of the requirements still apply. The first build uses the explicit gates in the recipe catalogue below.

Every locked item displays the full checklist, for example: Strength **6 / 5 met**, Sword proficiency **12 / 15 missing 3**, Reinforced anvil **missing**, Quarry milestone **met**. Selecting a missing condition shows its source. A locked item cannot consume materials.

### Proposed equations

`quality = round(clamp(24 + 3×Precision + 2×Knowledge + 0.35×classProficiency + toolBonus + techniqueBonus − difficulty, 0, 100))`

`craftSeconds = baseSeconds / (1 + 0.025×(Strength − 2) + stationSpeedBonus)`

`qualityScalar = 0.75 + 0.0075×quality`

Apply the quality scalar to the item's contributed damage, defense and health, never to the adventurer's entire baseline. Keep combat values as decimals internally; round only displayed numbers. Material differences belong in recipe combat values, avoiding a second hidden tier multiplier.

Quality is deterministic. There is no random failure roll, item destruction or hidden quality reroll. With Precision 4, Knowledge 4, zero proficiency and starter tools, a basic item has quality 44. At proficiency 15 with a +5 tool rack, the same item reaches quality 54 after rounding.

An optional technique prompt during a craft offers up to +5 quality. It can be completed with keyboard or pointer, and an untimed accessibility option uses the same reward. Missing or ignoring it gives +0. One input sequence per item is sufficient. Batch and offline crafts use +0 unless that specific active craft already earned its bonus. Technique is a later polish feature; the first implementation can use automatic quality only.

### Queue and storage policy

Start with one active production lane and three waiting job slots. An item consumes one job slot; a quantity selector splits batches into individual jobs. Materials are reserved when queued and cannot be spent elsewhere. At job start, snapshot stats, tools, duration and expected automatic quality. Jobs waiting in line use the smith's values when they actually start.

Reserve one finished-item slot before starting. If no slot is available, wait without consuming the reserved inputs. Canceling any uncompleted job refunds its reserved materials fully, releases its output reservation and discards elapsed time. Deterministic quality makes cancellation unprofitable as a reroll.

Start with capacity for 200 loose material units and 12 finished items; reserved materials remain in an escrow pool outside loose storage and are still owned by the player. Refund overflow goes to the mailbox. Finishing an item consumes the escrow materials permanently, produces exactly one item and awards XP exactly once.

The player can keep an item in storage, display it for sale, reserve it for a named customer, or salvage it. Salvage returns 50% of its original common materials, rounded down by material type. Quest materials are not recovered. Sales and salvage are mutually exclusive transactions.

## 7 Initial recipe catalogue

All basic recipes are Common, known from the start, use the starter forge and need no class proficiency. All their listed stats are 2. All advanced recipes require proficiency 15 in their own class and have difficulty 8. The rare shield has difficulty 12 instead. Prices are nominal base prices before quality and Charisma.

Material abbreviations: B = bronze ingot, I = iron ingot, W = wood, L = leather, E = ember shard. All crafting needs one fuel unit, included in material costs. A material bundle contains the exact recipe ingredients and its fuel.

| Recipe | Class | Inputs | Base time | Material cost | Base price |
| --- | --- | --- | --- | --- | --- |
| Bronze Dagger | Daggers | 1 B, 1 L | 20 s | 4 g | 8 g |
| Bronze Shortsword | Swords | 2 B, 1 L | 30 s | 6 g | 12 g |
| Bronze Hatchet | Axes | 2 B, 1 W | 30 s | 6 g | 12 g |
| Bronze Mace | Maces | 2 B, 1 W | 35 s | 6 g | 13 g |
| Riveted Leather Vest | Armor | 1 B, 3 L | 40 s | 6 g | 13 g |
| Bronze Buckler | Shields | 1 B, 2 W | 30 s | 5 g | 11 g |
| Iron Stiletto | Daggers | 2 I, 1 L | 60 s | 10 g | 23 g |
| Iron Longsword | Swords | 3 I, 1 L | 75 s | 14 g | 31 g |
| Iron War Axe | Axes | 3 I, 1 W | 75 s | 14 g | 31 g |
| Iron Flanged Mace | Maces | 3 I, 1 W | 80 s | 14 g | 32 g |
| Iron Cuirass | Armor | 4 I, 2 L | 90 s | 19 g | 42 g |
| Emberguard Buckler | Shields | 3 I, 2 W, 1 E | 90 s | 15 g plus shard | 46 g |

Common material unit prices are bronze 2 g, iron 4 g, wood 1 g, leather 1 g and fuel 1 g. Quest shards have no vendor purchase price. The rare shield adds fire resistance as its special trait; this affects Ember-region enemy fire damage only.

| Advanced recipe | Stat gates | Station gate | Discovery gate |
| --- | --- | --- | --- |
| Iron Stiletto | Precision 5, Knowledge 3 | Fine tools | First Quarry Road victory |
| Iron Longsword | Strength 5, Precision 4 | Reinforced anvil | First Quarry Road victory |
| Iron War Axe | Strength 5 | Reinforced anvil | First Quarry Road victory |
| Iron Flanged Mace | Strength 5, Knowledge 3 | Reinforced anvil | First Quarry Road victory |
| Iron Cuirass | Strength 5, Precision 3 | Fitting bench | First Quarry Road victory |
| Emberguard Buckler | Strength 4, Knowledge 5 | Fitting bench | Ember Shrine reward or eligible return discovery |

The Quarry milestone unlocks the first five advanced recipes and the iron supplier together. Bronze equipment with good quality is sufficient for Quarry Road. Ember Shrine can be cleared using ordinary iron equipment; it never requires its own shield reward. An eligible rare return can unlock the shield earlier but cannot bypass its stats, proficiency or station requirements.

## 8 Shop economy and equipment

Start with 30 gold, the starter forge, three Bronze Shortsword bundles and three Bronze Dagger bundles. Allow free exchange of unused starter bundles into any other basic recipe bundle during the tutorial. This supports every starting specialty without charging for the choice.

`salePrice = round(basePrice × (0.8 + 0.004×quality) × charismaMultiplier)`

`charismaMultiplier = min(1.30, 1 + 0.015×(Charisma − 2))`

At quality 44 and Charisma 2, a Bronze Shortsword sells for 12 gold. Its material bundle costs 6 gold, leaving 6 gold before upgrades. A Strength 6 smith forges it in about 27.3 seconds. Real income is also limited by customer arrivals and what they will buy.

NPC budgets come from a quest tier: 8–20 g for cellar visitors, 20–45 g for quarry visitors, and 35–65 g for Ember visitors. Generate an offer only if at least one compatible item fits the budget, or show a commission request instead. Budgets are not secretly increased to afford whatever the player has made. Automated sales obey displayed prices; manual discounts may lower a price to the customer's budget.

The town buyer is always available and buys any player-crafted common item for original common-material cost plus 1 gold, independent of quality. This is a deliberate recovery outlet with a lower margin than suitable customer sales. Purchased equipment resale is outside scope. Rare ingredients contribute no extra town-buyer value; show the exact offer before sale.

| Upgrade | Cost | Requirement | Effect |
| --- | --- | --- | --- |
| Tool rack | 75 g | Available at start | +5 quality for every class |
| Improved bellows | 100 g | Smith level 2 | +0.15 in the craft speed denominator |
| Reinforced anvil | 180 g | Smith level 3 | Enables advanced sword, axe and mace recipes |
| Fine tools | 180 g | Smith level 3 | Enables advanced dagger recipes |
| Fitting bench | 180 g | Smith level 3 | Enables advanced armor and shield recipes |
| Expanded shelving | 120 g | Smith level 2 | Finished capacity 12 → 24 and display slots 3 → 6 |
| Shop assistant | 300 g | Smith level 5, any advanced craft completed | Repeat queue, material buying and customer auto-sales |

Upgrades are permanent, purchased once and give their stated effect immediately. None adds a second production lane. Early choices are quality, speed, capacity or a class unlock; the economy must make each choice useful.

### Automation controls

The assistant follows an explicit production plan: selected recipe, stock target, maximum gold spend per offline session, and minimum gold reserve. Default reserve is 12 g and default offline spending cap is 60 g. Auto-buy is disabled until the player enables it. Buying never spends below the reserve, never purchases quest ingredients and never exceeds available material capacity.

Auto-sales sell displayed items only; reserved and protected items remain untouched. Default auto-sale filter excludes Rare items. An item listed automatically uses the same price equation as a manual listing. Pause production when stock targets, queue limits or storage capacity are reached.

### Recovery from zero resources

If the player cannot afford any basic bundle and owns no sellable item, offer a free reclaimed-material job once every 60 seconds. It yields one basic bundle chosen from known recipes. The recovery check includes queued materials and mailbox items to prevent repeated free claims while wealth is merely hidden. This has no premium cost and keeps every save recoverable.

## 9 Adventurers and stock driven demand

Adventurers are named repeat visitors with an archetype, level, base stats, budget, three equipment slots, relationship level and an active quest. Each arrives with functional starter equipment and seeks one meaningful upgrade. The player does not need to supply a whole set before the character can leave.

| Archetype | Preferred purchases | Combat identity | Typical early request |
| --- | --- | --- | --- |
| Vanguard | Sword, shield, armor | Reliable offense and survival | Protection for the quarry road |
| Duelist | Dagger, sword, armor | Frequent attacks | A fast blade for cellar pests |
| Breaker | Axe, mace, armor | Strong individual hits | A tool for cracking stone creatures |

Make an arrival attempt every 60 seconds while the shop has space, with at most three browsing customers. They wait three minutes of active play. Waiting timers pause offline when customer automation is disabled; with it enabled, arrivals and waiting timers advance normally. On a full shop, skip the new arrival rather than building an infinite backlog.

For each archetype, sum its compatible **displayed** stock, capping each class at three units. Call this score `s`. If the total score is positive, the archetype's chance is `0.15 + 0.55×s/sum(all scores)`. These chances sum to 1 across three archetypes. With no display stock, each has a one-third chance. Protected inventory, duplicates beyond the cap and items in the forge do not attract extra visitors.

The arrival mix changes when items are sold, displayed or withdrawn; existing visitors do not change identity. Armor appeals to all three classes and therefore supplies broad demand. New expansion archetypes need their own normalized version of the arrival formula.

### Purchase decision

A customer considers only compatible, affordable items. Use the same combat model to compare the current loadout and candidate loadouts for that customer's quest. Prefer the item with the largest projected improvement; use higher remaining health, then lower price to break ties. A commission can request a particular class, minimum quality or resistance, all visible before acceptance.

The player can suggest a candidate and see the predicted effect before selling. Items from a named commission remain reserved until explicitly released. The tutorial customer guarantees purchase of one correctly crafted basic item at the displayed price; normal customers then use the regular rules.

### Relationships

A purchase adds 1 relationship point, a quest victory adds 2 and an overgeared victory adds 1 more. Relationship levels use thresholds 0, 5, 15 and 30. Rewards are more detailed quest reports, a named commission, and a guaranteed recipe clue or rare material gift at the final threshold. Each milestone triggers once per adventurer.

Keep adventurer power bounded by region; a familiar customer can mentor a new recruit after outgrowing early quests. Do not silently scale enemies upward to cancel the value of better equipment. In the initial game, adventurer level is a content parameter and advances only at named quest milestones.

## 10 Quests and watchable combat

| Region | Quest | Target duration | Purpose and milestone |
| --- | --- | --- | --- |
| Town cellars | Rat Nest | 2 min | Tutorial battle and first returning customer |
| Town cellars | Smuggler Cache | 3 min | Basic weapon choice and common material gift |
| Old quarry | Quarry Road | 5 min | Unlock iron supplier and five advanced recipes |
| Old quarry | Stone Sentinel | 6 min | Demonstrate armor penetration and larger rewards |
| Ember ruins | Ash Courtyard | 8 min | Introduce fire damage and ember shard gifts |
| Ember ruins | Ember Shrine | 10 min | Rare shield recipe milestone |

Quest duration includes travel, a combat budget and return. Rat Nest uses 30 / 60 / 30 seconds for those phases; Smuggler Cache uses 60 / 60 / 60; Quarry Road 90 / 120 / 90; Stone Sentinel 120 / 120 / 120; Ash Courtyard 180 / 120 / 180; and Ember Shrine 240 / 120 / 240. The combat budget is the encounter deadline. Unused combat time becomes post-battle preparation, preserving the listed return time. Reward delivery happens on return, not when the last enemy falls.

Regions unlock through the preceding region's first quest victory. Every region contains a repeatable entry quest that is possible with equipment from the preceding tier. Quest previews show enemies, their major threat, likely survival, and relevant counter equipment. Knowledge 5 adds a concrete explanation of the counter; all players can see essential stats and the estimate.

### One battle model for every mode

At departure, freeze the adventurer, gear item IDs and stats, enemy roster, quest rules and a saved random seed. Each fighter has health, attack damage, armor and an attack interval. The hero targets the living enemy with the lowest stable ID; all enemies target the hero. The first attack occurs after its interval. Process events in timestamp order; when timestamps tie, the adventurer acts before enemies, with enemies ordered by stable ID.

`damage = max(1, attackDamage × seededVariation − effectiveTargetArmor)`

Seeded variation ranges from 0.9 to 1.1. A mace reduces effective target armor by 1, with a floor of zero. Apply resistance to the matching damage type before the minimum-damage floor. The initial model omits evasion, critical hits, mana and complex status stacking.

Victory occurs when all enemies are defeated before the adventurer's health reaches zero or the encounter deadline expires. Defeat or timeout means retreat. **There is no separate quest success roll.** The viewer presents the authoritative event log; watching never changes the result or slows crafting.

Before purchase or departure, simulate 64 alternate seeds using the same rules. Show the success proportion rounded to 5 percentage points, labeled **estimate**, with the most significant equipment mismatch. Cache by loadout and quest version. The estimate is uncertain because the actual departure has its own saved seed; it is never a promise.

### Example showing quality changing a battle

For a fixed-damage explanation with variation set to 1.0, take a hero with 55 health, 8 base attack and 2 armor. A sword adds 10 attack before quality. The opponent has 100 health, 12 attack and 3 armor. Both attack every two seconds, hero first on a tie.

At quality 20, the sword contributes 9 attack and each hero hit deals 14 damage. The hero falls to the sixth enemy hit before defeating the opponent. At quality 80, the sword contributes 13.5 attack and each hit deals 18.5 damage. The hero wins on the sixth hero attack with 5 health left. Only the item's quality changed.

### Initial combat content

These are starting fixtures for implementation and balance tests. Gear contributions below are multiplied by the item's quality scalar. Attack intervals and the shield's resistance percentage are not multiplied by quality. An equipped weapon replaces the previous weapon's contribution and interval; armor and shields replace their own slots. Base attack, health and armor remain.

| Recipe | Added attack | Attack interval | Added health | Added armor |
| --- | --- | --- | --- | --- |
| Bronze Dagger | 4.5 | 1.2 s | 0 | 0 |
| Bronze Shortsword | 9 | 2.0 s | 0 | 0 |
| Bronze Hatchet | 13 | 2.6 s | 0 | 0 |
| Bronze Mace | 11 | 2.5 s | 0 | 0 |
| Riveted Leather Vest | 0 | Unchanged | 18 | 2 |
| Bronze Buckler | 0 | Unchanged | 0 | 2 |
| Iron Stiletto | 8 | 1.2 s | 0 | 0 |
| Iron Longsword | 16 | 2.0 s | 0 | 0 |
| Iron War Axe | 22 | 2.6 s | 0 | 0 |
| Iron Flanged Mace | 18 | 2.5 s | 0 | 0 |
| Iron Cuirass | 0 | Unchanged | 32 | 5 |
| Emberguard Buckler | 0 | Unchanged | 0 | 4 |

The Emberguard Buckler also grants 20% fire resistance. Each enemy below is a single combatant, so the initial content requires no group targeting interface. Enemy armor reduces incoming physical attacks; their listed attack type matters for the hero's resistance. Apply armor to raw incoming damage, then the applicable resistance, then the minimum-damage floor.

| Archetype | Base health | Base attack | Base armor | Initial worn weapon | Initial worn armor |
| --- | --- | --- | --- | --- | --- |
| Vanguard | 80 | 6 | 2 | +5 attack, 2.0 s | +10 health, +1 armor |
| Duelist | 65 | 7 | 1 | +3 attack, 1.2 s | +8 health, +1 armor |
| Breaker | 95 | 8 | 1 | +8 attack, 2.8 s | +10 health, +1 armor |

Worn equipment uses its listed flat values and has no quality multiplier. Initial offhands are empty. Vanguard and Breaker can equip shields; Duelists reserve the offhand for mobility in the initial content and do not buy shields. All three can buy armor. No additional baseline stat growth is required for the six initial quests.

| Quest opponent | Health | Attack | Armor | Attack interval | Attack type |
| --- | --- | --- | --- | --- | --- |
| Rat Nest | 35 | 5 | 0 | 2.4 s | Physical |
| Smuggler Cache | 65 | 8 | 1 | 2.2 s | Physical |
| Quarry Road | 100 | 10 | 3 | 2.5 s | Physical |
| Stone Sentinel | 155 | 16 | 6 | 2.2 s | Physical |
| Ash Courtyard | 140 | 13 | 4 | 2.4 s | Fire |
| Ember Shrine | 220 | 15 | 6 | 2.2 s | Fire |

Set early-quest benchmarks to the archetype's compatible bronze weapon at quality 20 plus its worn armor. Quarry benchmarks use a compatible bronze weapon and leather vest at quality 50. Ember benchmarks use a compatible iron weapon and Iron Cuirass at quality 50. Use an empty offhand in every benchmark. Preferred benchmark weapons are shortsword or longsword for Vanguard, dagger or stiletto for Duelist, and mace or flanged mace for Breaker. These baselines make better equipment on an easier quest eligible for Well equipped returns. Benchmark values are versioned with quest content.

### Battle viewer

The workshop keeps a compact watcher beside crafting: selected adventurer, current enemy, health bars, equipped item names and recent actions. Selecting it opens the fuller report without canceling or pausing forge work. Reduced-motion mode replaces attacks with health updates and a readable log.

Live mode follows the real quest clock. Replay controls can step, pause or accelerate completed battle playback; these controls never accelerate production or quest rewards. Multiple expeditions run concurrently, initially capped at three. A fourth purchased customer waits to depart until a slot is free.

## 11 Returns and rare discoveries

A successful return grants a small material bundle, +1 shop reputation and the relationship awards above. Gold gratuities use `round(baseTip × (1 + min(0.20, 0.01×(Charisma − 2))))`. Base tips are 2, 5 and 10 gold for cellar, quarry and Ember quests. Snapshot Charisma at departure so reloads or later allocations do not change the reward.

Reputation is permanent and displays the shop's public standing. At 5 reputation unlock named commissions; at 15 unlock the Ember-region narrative invitation if Quarry Road is already cleared. Ash Courtyard also requires the invitation. Reputation never falls for a retreat in the first version.

### Overgearing

For each quest, define a benchmark loadout with the same baseline hero stats. Compute gear score as `10×expectedDamagePerSecond + effectiveHealth`, using the same enemy profile as the quest. Effective health is hero health divided by the fraction of incoming damage remaining after armor and resistance, with that fraction floored at 0.25. Calculate that fraction as total mitigated enemy damage per second divided by total raw enemy damage per second, using variation 1.0, attack intervals and the minimum-damage floor; if raw damage is zero, use a fraction of 1. Expected outgoing damage per second uses variation 1.0 and the actual weapon interval, averaged equally across the quest's enemies after their armor. Store a benchmark per archetype and quest so naturally durable classes are not favored by the score.

An adventurer is **Well equipped** when their score is at least 125% of that benchmark. Show this before sale and departure. The score describes readiness; combat still decides victory. Successful Well equipped returns guarantee an extra common-material bundle and become eligible for a discovery roll. Ordinary successful returns can still advance guaranteed quest milestones.

Eligible returns have a 20% chance of a rare discovery, with a guaranteed discovery on the fifth consecutive eligible return without one. Persist a single shop-wide pity counter and the reward seed. An unknown eligible recipe is preferred; when all eligible recipes are known, award rare materials. Never give a duplicate useless recipe. Failed or ordinary returns do not reset the counter. Each departure can trigger this once.

The third Ember Shrine victory guarantees the Emberguard Buckler recipe if it has not dropped earlier. Ash Courtyard supplies ember shards before the shield is available. Repeated Ember victories continue supplying them after the recipe is known. This makes the rare path finite and avoids dependence on lucky drops.

A retreat returns the adventurer after the normal return delay, followed by a two-minute recovery. The smith keeps the sale proceeds. The adventurer retains equipment, and the report shows what failed. No corpse retrieval fee or permanent relationship loss is required.

## 12 Idle and offline behavior

Use the same event scheduler online and offline. Simulate up to eight hours of elapsed time per absence at the normal production rate. Track simulation time separately from the last observed wall-clock time. After reconciliation, advance the wall-clock timestamp to the actual present and discard excess elapsed time, so reloading cannot claim it again. Pending work retains its remaining simulated duration. Explain the cap in the return report. No offline efficiency penalty is necessary.

Without the assistant, queued crafts and already-departed quests complete offline. Existing customers remain waiting and no new browsing customers spawn. No materials are purchased, stock sold or new quests launched without enabled automation. This keeps early offline behavior understandable.

With the assistant, process configured buying, crafting, compatible customer arrivals, sales and departures chronologically, subject to exactly the same capacities and budgets. Automated customers do not require a manual confirmation for each sale. Named commission choices and rare-item sales stay pending unless specifically allowed by settings.

At equal timestamps, apply quest returns, craft completions, customer sales, material purchases and new job starts in that order. Each transaction checks and reserves resources atomically. The same commands, enabled automation policies, credited duration and seeds produce the same final state whether processed in many updates or one catch-up. Unassisted offline play intentionally pauses customer activity; it therefore differs from leaving an unattended shop open online.

### Capacity and time safeguards

- Overflow rewards enter a 25-bundle mailbox with no expiry. Bundle identity groups one quest's rewards together.
- A full mailbox keeps the next completed return pending and pauses further departures. A pending return still occupies its expedition slot. Existing battles can finish and wait safely.
- Crafting pauses before starting if it cannot reserve an output slot. Refunds can remain pending if both storage and mailbox are full.
- Clamp negative clock changes to zero and forward elapsed time to the offline cap. Never create negative durations or duplicate rewards.
- Save the last processed event and timestamp after each transaction batch. Reloading resumes from this point.

On return, show elapsed and credited time, items forged and sold, net gold, materials spent, quest results, discoveries and the first reason each automation rule stopped. Example: “Forge stopped after 48 minutes because finished storage was full.” Claiming the summary must not apply the rewards again.

## 13 Interface layout and interactions

The workshop is the primary screen. Production, waiting customers and one current battle remain visible together on desktop. Detailed progression and bookkeeping are secondary destinations.

![Desktop interface layout](diagrams/ui-layout.svg)

### Desktop zones

| Zone | Content | Primary action |
| --- | --- | --- |
| Status bar | Gold, smith level and XP, stat points, common materials | Allocate points or buy supplies |
| Navigation | Workshop, Adventurers, Upgrades, Ledger, Settings | Change view without stopping simulation |
| Recipe catalogue | Classes, known and locked recipes, requirements | Select recipe or inspect an unlock |
| Forge workspace | Item result, quality, time, inputs and station | Queue one item or a batch |
| Customer area | Three requests, budgets and equipment fit | Offer a matching item |
| Battle watcher | Hero, enemy, health and recent item effects | Follow another quest or open report |
| Queue strip | Active craft and waiting jobs, capacity and pause reason | Reorder waiting jobs or cancel |

Use a warm charcoal, iron and parchment visual language with amber for forge actions, muted teal for progress, and clear textual state labels. Item rarity may use color, but a written rarity label is always present. Reserve animation for the furnace, craft completion and attacks; avoid constant decorative movement.

### Secondary screens

**Adventurers** lists named customers, relationships, loadouts and quest states. Selecting a hero shows equipment impact and previous battle reports. **Upgrades** compares price, requirement and concrete effect before purchase. **Ledger** shows inventory, class proficiencies, recipes, transaction history and offline reports. **Settings** includes audio, reduced motion, large text, numeric detail, offline explanation and save export/import.

The first launch uses a compact character-creation overlay, followed by a guided recipe selection. It should not require navigating several empty screens before the first craft.

### Mobile layout

At narrow widths, switch to one column with bottom navigation. Put current craft progress and remaining time above the selected task. Place the battle watcher in a collapsible panel that shows the hero and quest state even when collapsed. Customers and recipes are separate views; opening a view never stops the forge. Avoid squeezing the three-column desktop layout onto a phone.

![Mobile interface layout](diagrams/ui-mobile.svg)

### Required feedback states

| State | Message or behavior |
| --- | --- |
| Recipe locked | Show every missing gate and a direct route to its source |
| Materials missing | Exact deficit and affordable bundle price |
| Queue full | Show current capacity and the waiting jobs |
| Output storage full | Keep the job queued; offer inventory and town buyer |
| No suitable customer item | Offer another class or a commission; no forced purchase |
| Customer cannot afford item | Show budget and voluntary discount option |
| No active quest | Explain that equipping a customer starts the first expedition |
| Reward pending | Show mailbox capacity and the waiting adventurer |
| Save failed | Persistent message and a working export option |
| Offline cap reached | Show credited time and the eight-hour limit |

All controls support keyboard focus and meaningful labels. Use 44-pixel touch targets, text alternatives for health and progress bars, and sufficient contrast. Important requirements cannot depend on hover. The battle log announces summary events rather than every animation frame. Respect reduced motion and allow muting sound independently.

## 14 First session and pacing targets

| Approximate time | Player experience | System introduced |
| --- | --- | --- |
| 0–2 min | Name the shop, allocate stats and begin the first item | Build identity and clear craft feedback |
| 2–5 min | Sell to a guaranteed tutorial customer | Matching gear to a customer's quest |
| 5–10 min | Watch a return and buy the first useful improvement | Gear consequences and reinvestment |
| 10–25 min | Develop a preferred class and meet repeat visitors | Proficiency and relationships |
| 25–45 min | Clear Quarry Road and craft an iron item | Combined recipe requirements |
| 45–90 min | Configure the assistant and prepare Ember quests | Idle production policies and specialization |

These times assume engaged play and are not guarantees. Customer cadence, proficiency requirements and upgrade costs must be tuned together. Starter supplies should cover mistakes; the first ordinary material purchase should be funded by earlier sales.

The tutorial guarantees a successful Rat Nest with the correctly matched starter purchase. Use a fixed tutorial enemy and seed, then transition to ordinary quest estimation. Make the guarantee explicit in tutorial content rather than altering ordinary battle results in secret.

### Example progression story

Mara arrives seeking a sword for Rat Nest. The player makes a Fine Bronze Shortsword, sees her win and receives leather and a small tip. Repeated sword crafting unlocks better workmanship. Quarry Road reveals iron plans, but the player still needs a reinforced anvil and Sword proficiency 15. After completing those requirements, an Iron Longsword helps Mara outperform an early quest benchmark. Her Well equipped return earns a bonus bundle and progresses the rare discovery counter.

Meanwhile, a displayed mace starts attracting breakers. The shop grows into a different customer mix through what the player chooses to make, rather than through a forced class selection.

## 15 Browser implementation outline

Build a small deterministic simulation independent of presentation. The browser UI issues commands and renders state; it does not own timers, reward rolls or production truth. HTML and CSS can handle the workshop, with an optional canvas layer for battle presentation. Framework choice can be made during implementation without changing these rules.

| Module | Responsibility |
| --- | --- |
| Content registry | Recipes, materials, upgrades, archetypes, enemies and quests |
| Command layer | Validate craft, cancel, buy, sell, allocate and depart actions |
| Simulation | Advance scheduled events and calculate authoritative results |
| Economy | Escrow, gold, pricing, reservations and capacity |
| Combat | Seeded battle events, forecasts and replay logs |
| Persistence | Versioned state, transactions, backups and offline reconciliation |
| Presentation | Responsive screens, craft feedback, watcher and accessible controls |

### Minimum saved records

- **Player:** level, XP, four stats, unused points, respec tokens, proficiency XP, gold, reputation and unlocked milestones.
- **Recipe:** ID, class, material tier, rarity, input quantities, duration, price, combat contribution, difficulty and explicit requirements.
- **Item instance:** unique ID, recipe ID, final quality, combat stats, creation time, reserved customer and sale state.
- **Craft job:** unique ID, recipe ID, escrowed inputs, output reservation, state and start snapshot when active.
- **Adventurer:** unique ID, name, archetype, baseline stats, equipment IDs, budget, relationships and current state.
- **Quest run:** unique ID, content version, frozen loadout, seed, start and return times, event cursor, outcome and reward claim IDs.
- **Shop:** upgrades, display slots, protected stock, assistant rules, mailbox and offline limits.
- **Save metadata:** schema version, content version, simulation time, last observed wall-clock time, last committed event, active save ownership and checksum.

Use local IndexedDB for structured state and retain a last-known-good backup. Provide a downloadable JSON export and validated import; import must show the replacement summary before overwriting an existing save. Do not execute imported data. Preserve progress through explicit schema migrations.

The simulation should use integer milliseconds, stable event ordering and a seeded random generator. Store monetary amounts as integers. Advance to the next meaningful event instead of rendering every missed frame. Chunk long catch-up work so the interface stays responsive. One active writer owns the save; another open tab is read-only until ownership transfers, preventing duplicate processing.

Local saves are player-controlled. Anti-cheat and server accounts are outside the first version. Content errors should produce a recoverable message and preserve a backup rather than reset the player's profile.

## 16 Build milestones and acceptance criteria

| Milestone | Deliverable | Completion criterion |
| --- | --- | --- |
| A Core workshop | Stat creation, six basic recipes, queue, inventory, sales and saving | A fresh player can forge and sell without running out of recoverable actions |
| B Living customers | Three archetypes, inventory-weighted arrivals and quest departures | Changing displayed classes measurably changes the visitor mix |
| C Equipment consequences | Seeded combat, watcher, returns and relationship rewards | The same saved battle result appears live, after reload and offline |
| D RPG progression | Six advanced recipes, stations, proficiency and rare discovery | Every gate has a reachable source and a useful explanatory UI |
| E Idle play | Assistant policies, offline catch-up, mailbox and reports | Eight-hour catch-up respects capacity, reserves and reward uniqueness |
| F Presentation and tuning | Responsive UI, accessibility, tutorial and balance pass | The first-hour targets are observed in playtests without forced waiting or softlocks |

### Essential verification scenarios

1. Every legal starting stat allocation can craft every basic recipe and complete the tutorial.
2. Queueing multiple jobs cannot reserve the same materials or output capacity twice. Cancel and reload restore the correct balances.
3. Craft completion, sale, quest return and reward claim are each idempotent: a duplicate event produces no duplicate benefit.
4. The same initial state, commands, automation policies, seeds and credited duration of up to eight hours produce identical stepped and offline catch-up results. Reloading after the cap grants no discarded time again.
5. A full inventory or mailbox stops the relevant activity without destroying items or rewards.
6. A shop with zero gold and no useful stock can recover with the reclaimed-material rule.
7. No advanced recipe is required for the only quest that unlocks it. The rare shield's unlock is independent of owning the shield.
8. The combat fixture in section 10 loses at quality 20 and wins at quality 80 with exactly the same hero and enemy.
9. The fifth consecutive eligible missed discovery awards the guaranteed reward; reloads do not reroll it.
10. The 320-pixel layout exposes crafting, customers and battle status without horizontal clipping, and key actions work by keyboard.
11. Invalid imports leave the current save intact. Two tabs cannot both award the same production or return event.
12. Forecast percentages come from the combat model and are labeled estimates. No hidden success roll disagrees with the battle log.

### Playtest questions

Observe whether players can explain their next recipe unlock, identify why a quest failed, distinguish rarity from quality, and make a meaningful choice between two upgrades. Track the time to first sale, first return, first upgrade, first advanced item and assistant unlock. Also record stockouts, unwanted inventory, idle stop reasons and how often the recovery job is needed.

The highest design risks are repetitive starter crafting, too much waiting between suitable customers, weak reasons to diversify stock, and a battle watcher that feels disconnected from the forge. Address these through recipe cadence, arrival weighting, clear item attribution and visible counter choices before adding more content.

## 17 Expansion direction

After the initial economy is enjoyable, extend the existing systems with polearms, bows, arcane foci and accessories; steel and exotic alloys; class talents; multi-adventurer parties; and recipe stories tied to named quest chains. Add assistants with distinct specialties only when multiple production lanes are economically useful.

A later legacy system could let a retired master leave one heirloom recipe or shop tradition to a successor. Make it optional, preserve the player's collection and validate that restarting is enjoyable before implementing it. The initial progression must stand on its own.

The next implementation step is milestone A followed immediately by one tutorial adventurer and one observable battle from milestones B and C. This small vertical slice tests the game's defining promise before producing the rest of the catalogue.
