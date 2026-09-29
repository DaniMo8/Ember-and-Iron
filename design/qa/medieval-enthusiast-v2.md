# Medieval-fantasy enthusiast review — campaign v2

**Date:** 27 September 2026. **Perspective:** an AI reviewing the experience as a medieval-fantasy game enthusiast; this is not a claim of human identity or a historical-authenticity assessment.

The new named patterns and crafted-prefix/enchanted-suffix combinations make the catalogue much more expressive. Combat tests confirm that equipment coverage, weapon pattern and counter-enchantments can change a party's prospects substantially. This pass also found a save-breaking commission defect and two balance/value issues; the implementation owner fixed them and the final rerun confirms those fixes.

## What was tested

- **180 recipes**, organized as 60 class/material families with three named patterns each. Every family has three distinct names and finite combat values.
- **1,080 price cases:** all 180 recipes at quality 45, 80, 115, 150, 180 and 200. Clearance stays below ordinary customer value and the current cost of purchasing the inputs. No negative customer crafting margin appeared in the recorded Q80 comparison.
- **12 crafted prefixes and 8 enchanted suffixes.** Every modifier changes actual item combat values; they are not merely names.
- **4,080 final seeded combat trials**, covering five bosses, gear quality, party sizes, full versus partial loadouts, three sword patterns, target armour, counter-enchantments, and the corrected first boss.
- A separate first-boss calibration searched **42 health/attack combinations**, three loadouts and 160 seeds each: **20,160 tuning trials**.
- All 12 quest approach requirement sets were inspected; every manual boss becomes launchable when its stated approach requirements and party readiness are satisfied. A hero already travelling was successfully gathered, recovered and launched with the selected three-hero boss party.
- Masterwork commission save/reload validation and exact quality-grade boundaries were checked.

These are **controlled engine fixtures**, with equipment, levels and prerequisite quest histories explicitly supplied. They do not establish the time required to acquire those loadouts. They complement the other reviewer's normal-action idle-game profiles. No browser save was touched.

## Confirmed defects and resolutions

### Masterwork commissions broke saving

Campaign masterwork orders now request quality 115, but save validation still rejected commissions above 100. Raising a hero to relationship 30 and generating its normal milestone commissions reproduced `Invalid save: Invalid commission.` The implementation owner corrected validation. The final same fixture now exports and validates successfully with its Q115 commission.

### Crafted and enchanted value was missing from prices

A plain Q115 Mithril Arming Sword and a legal **Peerless Mithril Arming Sword of Embers** previously both quoted 256 gold, despite the latter's real combat advantages and enchanting investment. The owner added a prefix premium and partial enchanting-cost recovery. The final quotes are **256 versus 288 gold**. This makes the Diablo-style item identity carry a visible financial benefit without reimbursing the entire enchantment investment.

### Three ungeared beginners trivialized the first boss

Before tuning, three level-1 heroes with only their starting worn weapon/body defeated Smuggler Cache in **80/80** seeds. The other four bosses defeated that same group in every seed.

The recommended and applied first-boss values are **220 health, 20 attack, 0.8 armour and a 2.5-second attack interval**. Final calibration uses three level-1 starting heroes, no training bonuses, prefixes or enchantments:

| Starting party equipment | Wins / 160 | Win rate |
|---|---:|---:|
| Default worn weapon/body only | 0 | 0% |
| Bronze Q45 weapon and body armour | 91 | 56.875% |
| Complete starter-craftable bronze Q55 loadouts | 160 | 100% |

The complete starter loadout includes rings/tools and Mara's shield, but **excludes charms**, which are not an initial crafting class. This provides a useful early lesson: a basic outfit has a plausible chance; preparing the whole party is reliable. These seeded percentages are observations, not guarantees for every build or random sequence.

## Weapon choices have a real purpose

In an isolated weapon experiment, Mara was level 5 with the same iron Q80 body armour in every case. Only the sword changed. Against an unarmoured target, the Falchion finished the fight in **15.64 seconds on average**, versus **18.275** for the Arming Sword and **18.408** for the Longsword. All three won 80/80 trials.

Against the same target with armour raised to 9, the Arming Sword and Falchion won **0/80**, while the Longsword's harder hits and penetration won **17/80**. This is a useful speed-versus-armour distinction. It should be stated directly in recipe comparison text, alongside the extra materials, proficiency requirement and work time.

The heavier **non-weapon** patterns currently increase health/armour without a mobility, speed or other combat penalty. Their tradeoffs are higher resource costs and unlock requirements. That is valid as an upgrade ladder, but it is less interesting as a permanent build choice. A future pass could give light armour stronger evasion or travel advantages and distinguish shield patterns through block, coverage or aggressive bonuses. These are design suggestions, not historical claims.

## Bosses reward broader loadouts and counters

The following benchmark uses the same three starting archetypes, no training upgrades or enchantments, and quality 80 throughout. Equipment and hero levels are seeded. A full benchmark loadout includes compatible rings, tools, charms and Mara's shield; it assumes the corresponding crafting classes have been unlocked.

| Boss | Hero level | Equipment material | Weapon + body only | Full loadout |
|---|---:|---|---:|---:|
| Smuggler Cache | 3 | Bronze | 40/40 wins | 40/40 |
| Stone Sentinel | 5 | Iron | 40/40 | 40/40 |
| Wildwood Heart | 8 | Steel | 37/40 | 40/40 |
| Frost Citadel | 12 | Steel | 0/40 | 40/40 |
| Void Sovereign | 16 | Mithril | 0/40 | 9/40 |

Frost Citadel is a pronounced transition from simply improving the weapon to completing the outfit. The finale can be beaten with full Q115 mithril in this benchmark: **40/40 wins**, so it does not require winning the finale first to acquire a compulsory higher material tier.

Counter-enchantment fixtures show another viable route:

- Full steel Q45, three level-12 heroes against Frost Citadel: **2/80** wins without enchantments, **80/80** with Frost Ward on every compatible slot.
- Full mithril Q80, three level-16 heroes against Void Sovereign: **14/80** without enchantments, **80/80** with Starlight on every compatible slot.

These are substantial, real benefits. Show elemental threats and the party's relevant resistance in the boss preparation panel so players can discover the intended response. A forecast alone tells the player that a loadout is weak; it does not explain which missing protection or empty slot matters.

## Enthusiast recommendations

1. **Let the physical pattern lead the item identity.** Arming Sword, Falchion, Brigandine and Kite Shield are much more evocative than generic weapon numbers. Retain the full prefix + pattern + suffix name, but keep material and quality easy to scan separately.
2. **Clarify composite objects.** A label such as “Iron Longbow” can suggest that the whole bow is iron. Optional wording such as “Longbow · iron fittings” would make wood/leather inputs feel coherent while preserving the fantasy material system. This is a presentation preference, not a claim about historical construction.
3. **Explain what each pattern is for.** “Fast against light protection” and “slower strikes that pierce armour” communicate more than “variant 1/2.” Keep the base pattern useful as the affordable, quick-to-produce option.
4. **Make empty gear slots a boss objective.** The Frost result shows that a player focused only on weapon quality can hit a wall. List missing body/offhand/accessory coverage and recommend an appropriate craftable class.
5. **Separate quality from material.** The tested fixed thresholds behave correctly: Fine45, Superior80, Masterwork115, Epic150 and Legendary180 on the 200-point scale. A low-quality exotic item and an excellent ordinary-material item should remain visually distinguishable concepts.
6. **Use boss dossiers to teach counters.** Show damage type, armour, a relevant protective enchantment and a concise explanation of the current forecast. This is more useful than merely demanding the next numerical tier.
7. **Retest the middle bosses through natural progression.** Prepared level-5 iron parties reliably defeated Stone Sentinel in the controlled fixture, while Frost is much stricter about complete equipment. That may make a satisfying progression, but the actual time to earn those levels, patterns and accessories belongs to longer ordinary-action tests.

## Reproduction and limits

Run `node tests/playtest-medieval-v2.js` for the final checks and JSON results. Run the same script with `--tune-boss` to reproduce the calibration search. The complete data is in `medieval-enthusiast-v2.json`.

This review did not complete an organically earned five-tier campaign, measure every profession, inspect every party composition, play multiple Legacy generations, or validate historical weapon classifications against museum collections. It makes no claim that every possible build is balanced. The price audit checks the stated quality points and fixture attributes, not every uncapped Charisma value or upgrade combination.
