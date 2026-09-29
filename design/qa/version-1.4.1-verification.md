# Version 1.4.1 verification

29 September 2026.

## Result

All **137 automated checks pass**. A separate accelerated progression simulation cleared all **20 encounters in the intended order**, with five explicit boss orders and no progression stalls. Desktop and phone UI checks used disposable saves on port 8791; the player's port-8777 save was not loaded or modified.

## Campaign correction

The previous campaign had only one ordinary quest in tiers 1, 2, 4 and 5. Each tier now contains three ordinary levels and one boss. Tests cover the four-versus-five boundary at every level in every tier, the boss requirement for all three local levels, and the requirement to defeat that boss before entering the next tier. Legacy still requires the tier-5 boss.

Eight new ordinary encounters fill the missing levels. Existing quest IDs, story choices and bosses remain. The added encounters have increasing enemy strength, time and rewards within their tier and do not copy story-choice rewards. The existing party rule remains: each victorious hero contributes one count; a three-hero party can therefore reach six counts in two successful expeditions.

Balanced heroes now prioritize reachable unfinished levels until five counts, rather than only until the first victory. Cautious parties rank safe quests by level as well as tier. The controlled simulation grants level-30 heroes, strong tier-5 equipment and party capacity to isolate progression and scheduling from the economy. It cleared tier bosses at 18.18, 44.58, 78.35, 123.17 and 174.08 simulated minutes. These are **not natural-play balance estimates**. Detailed milestones are in `version-1.4.1-progression.json`.

Old completed boss milestones and existing reserved/in-flight boss parties receive their missing approach counts once, without loot, XP, gold or Merits. Unfinished old tiers must complete the new intermediate levels. Existing wins are never reduced. The migration is idempotent; new games receive no free clears.

## Furnishings and Smith

- Smith's toolbar contains only the unspent attribute-point balance. No Improve smith button remains. Direct attribute spending was checked in the browser: five points became four.
- Section order is attributes → People → Furnishings → Class mastery. Existing sidebar records and progression remain.
- All six furnishings have five permanent levels. Level `n` costs `ceil(base × 2.4^(n−1))`; each level adds the original effect once. Exact charges, cumulative effects, insufficient funds, maximum level and unknown furnishing rejection are covered.
- Owned old furnishings load as level 1 without losing bonuses. Higher levels survive reload and retirement. Invalid, fractional, excessive or unowned furnishing levels are rejected during save validation.
- Browser purchases verified Hearth Banner: install for 260g, level 2 for 624g, then a 1,498g level-3 preview. Level 2 shows +30% cadence and +16% budgets and survives reload. Level marks remain visible on narrow screens.

## Browser checks

- Reviewed at 1440 × 1000 desktop, 390 × 844 phone and 360 × 800 narrow phone, without horizontal page overflow.
- At level 2 with four wins, level 3 displays the missing fifth Mill Cellar win. At level 3 with four wins, the boss remains disabled and shows Smugglers Road 4 / 5.
- At five wins on all three levels, the boss selector enables. Selecting three heroes and pressing Gather and launch starts exactly one boss expedition.
- A completed tier-1 boss opens Quarry Road as Tier 2 / Level 1; Abandoned Pit remains gated by its five victories. The next boss board shows all three tier-2 level counts in order.
- Current quests, progress cards, the expedition map and recent histories identify tier and quest level separately.
- No game console errors were observed.

The source, portable game, specification, flow diagram and layout diagram were rebuilt. Current test output is `version-1.4.1-tests.txt`; browser fixtures are in `quest-levels-review.html`.
