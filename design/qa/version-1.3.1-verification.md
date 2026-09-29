# Supplies and hero profiles — v1.3.1 verification

29 September 2026

## Changes

- Leather, wood and Alchemical Oil are the first content on Mine and Forge, below the shared room heading/objective. They show only names, amounts and buy controls, with no progress bars or duplicate rows below. Mined-material buy/sell remains in Open workings.
- Oil costs 8g before discounts. Tier 3/4/5 patterns require 1/2/3 units; prestige adds one. Oil cannot be mined, awarded by current quests or recovered through salvage. Cancelling paid work refunds its captured oil; old orders that never paid oil return none. Advanced base prices include 80% of the added oil's base value, rounded up.
- Hero profiles list all compatible item types and slots. The roster always names class and line. Recommended patterns use the same quest-aware gear comparison as purchases, accounting for the complete loadout, current forge quality, existing enchantments and two-handed offhand removal. Ready, supply-blocked and space-blocked options are distinguished; locked patterns and downgrades are excluded. Other improving patterns remain in a comparison expander. Crafting uses shared stock and does not force or reserve a sale.
- Combat cards show final derived damage per hit, health, expected single-target DPS, interval, armour, penetration, crit, block, evasion, resistances and class effects. Damage is before enemy defences. Active expeditions show their captured party stats and replay health, including synergy. XP bars use actual 25 × level thresholds and cap correctly at level 30.

## Verification

`node --test tests/*.test.js`: **109 tests passed**. Eight new tests cover oil purchase/consumption/refund, no mining or salvage source, full-bin purchasing, idempotent content, old supply-free jobs, read-only recommendations matching purchase comparisons, class compatibility, shortages/queue limits, exclusion of weak replacements, two-handed interactions, effective stats, XP rollover/cap and captured expedition stats.

The existing economy tests include every recipe at multiple qualities, legitimate material discounts and resale constraints. No additional long campaign timings are claimed for the new oil cost. The earlier 18-hour Company results remain historical v1.3 evidence. The reusable speed-policy script now buys oil when an otherwise unlocked advanced recipe needs it.

Browser checks used an isolated port-8785 workshop and an explicitly granted advanced fixture. The user's normal workshop was not loaded or altered. Verified:

- Fresh Mine shows leather/wood at 4 and oil at 0, before room metrics. Buying one oil deducts 8g and updates the amount.
- A steel training sword is disabled at zero oil; buying oil enables crafting and the queued job consumes exactly one unit.
- Mage compatibility shows cloth and books/relics; incompatible mail is absent from recommendations.
- Recommendations show real stat changes and navigate to the matching Forge class/tier.
- An advanced hero at level 4 shows 50/100 XP, with matching progressbar attributes.
- Derived stats and live expedition health render without console errors.
- At 390px viewport width, Mine and Adventurers have no horizontal document overflow. The supply section contains zero progress bars.
- Source and portable HTML are rebuilt from the same files; all fifteen backgrounds remain embedded. The portable edition was also opened in the browser and its hero stats, XP bar, equipment types and forge suggestions rendered without console errors.

Artifacts: `supplies-regression-results.txt`, `build-hero-supplies-preview.js`, `hero-supplies-preview.html` and `hero-supplies-preview-save.json`. The fixture loader refuses to write saves outside its dedicated QA port.
