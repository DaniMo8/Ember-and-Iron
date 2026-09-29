# Design verification notes

The specification is a design proposal, not a tested production game. Recipe prices, starting stat totals, quality examples and proficiency thresholds were independently reviewed. The offline cap, customer expiry and deterministic targeting rules were clarified during review.

A small numerical model using the documented combat fixtures, integer event timestamps and 64 Mulberry32 seeds checked progression reachability. These results validate selected examples only and do not establish overall game balance.

| Scenario | Victories |
| --- | --- |
| Vanguard with Bronze Shortsword Q44 and worn armor against Quarry Road | 64 of 64 |
| Vanguard with Iron Longsword and Iron Cuirass Q50 against Ember Shrine | 64 of 64 |
| Duelist with Iron Stiletto and Iron Cuirass Q50 against Ember Shrine | 53 of 64 |
| Breaker with Iron Flanged Mace and Iron Cuirass Q50 against Ember Shrine | 64 of 64 |
| Breaker with Iron War Axe and Iron Cuirass Q50 against Ember Shrine | 64 of 64 |

The Duelist has a lower survival rate and needs playtesting; no required unlock relies on a guaranteed victory. The Q20 versus Q80 fixed-damage example reproduces a loss at 12 seconds and a victory at 12 seconds with 5 health respectively.

The HTML document was inspected at desktop and 320-pixel widths with no outer horizontal overflow. Navigation anchors resolve, four diagrams are embedded and 18 comparison tables render. The four standalone SVGs were rendered and visually checked.
