# Version 1.2 verification

27 September 2026. Local source and portable game updated together.

## Delivered

- 180 medieval patterns: three variants in each of twelve classes and five tiers.
- Twelve craft-generated prefixes and eight chosen enchanting suffixes; names, combat effects, pricing and saved gear agree.
- Fixed quality bands through Legendary at180; Masterwork begins at115.
- Five manual tier-boss gates with selected parties, gathering through recovery, live forecasts and enemy/party protection details.
- Harder, slower ordinary quests; Legacy requires the tier5 boss, yields46–66 sparks per complete campaign, and has304 sparks of talents.
- Type-only catalogue and next-pattern requirements.
- Full-bin excess discarded without delaying heroes. Exact craft cancellation refunds require room before cancellation.
- Lowest-quality-first automatic display filling; manual Hold/Release, protection and reservations respected. Direct display Sell/Scrap. Player sales close inspection without a moved-item warning.
- Documentation, game-flow and item-tree diagrams, and the single-file build regenerated. All15 backgrounds remain embedded.

## Automated and reviewer evidence

The complete regression suite passed88/88. After the final masterwork-count display correction, the16 campaign/economy tests passed again. Separate reviewer harnesses covered four hours of active normal-action play, eight untouched hours,1,080 item price cases and4,080 controlled battles. The first-boss calibration search tested20,160 candidate fights; its final benchmark is included in those4,080 final battles.

See `idle-enthusiast-v2.md` and `medieval-enthusiast-v2.md`, and their matching JSON files. The four-hour profile does not establish naturally earned endgame completion time. Controlled boss/equipment fixtures are labelled accordingly.

## Browser checks

Source checked on isolated QA origins8779 and8781, with no reset or acceleration of the user's8777 save. The dedicated campaign fixture loader refuses all ports except8781.

- Type filter contains no All-items option; next Bronze Falchion displays proficiency0/4.
- Craft and cancel restored2 Bronze,1 Leather and1 Coal exactly; queue emptied.
- Boss-party checkbox changed the party from3 to2; explicit Launch sent exactly those heroes and activated following.
- Returning boss party completed the home/recovery cycle without remaining stuck.
- Named legendary item showed Balanced Bronze Arming Sword of Embers, both modifier effects, full quality thresholds and its price. Player sale closed the drawer cleanly; remaining display item could be scrapped directly.
- Phone-width390px iframe layout visually inspected.
- Portable HTML opened successfully with embedded background art and the final boss preparation panel.

Review-driven fixes included commission quality validation, magical-item value premiums, a stronger first boss and duplicate gathering prevention. Review suggestions now reflected in UI include weapon-pattern tradeoffs and boss damage/protection details. The midgame boss2-to3 plateau and strength of stacking counter-enchantments remain documented tuning considerations.
