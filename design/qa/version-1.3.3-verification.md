# Hero screen layout — v1.3.3 verification

29 September 2026

The Adventurers profile now reads name/class → live visual → compact combat list and XP → compatible types → current equipment paired with forge upgrades → combined quest journal. Company totals and management controls moved alongside the roster. Equipment details include material, tier, quality grade, combat contributions, prefixes, suffixes and enchant strength. Each slot exposes its best available improvement and an expandable list of alternatives. Quest progress is explicitly company-wide; recent adventures belong to the selected hero.

Validation:

- All 12 existing hero-supplies and room-model checks passed (`hero-layout-regression-results.txt`), including recommendations matching actual purchase comparisons, final stats, XP, offhand handling and follow routing. No simulation formulas were changed.
- Source and portable browser builds show the requested section order, nine compact stat entries, six equipment slots, the experience bar, and one combined journal.
- The disposable `hero-layout-preview.html` fixture on port 8787 verified a named crafted prefix, enchanted suffix, scaled resistance (19.5%), and correct weapon-only interval/damage-type reporting. The normal workshop save was not opened or changed.
- Mage armour suggestions were cloth. A bow-equipped Ranger showed the offhand as blocked. Worn starter gear and empty slots had distinct descriptions.
- Expanded alternatives stayed open through live updates; selecting another hero refreshed compatibility and comparisons. The active-expedition view exposed the battle-details control and live health in the compact stats.
- Forge 1 queued the chosen upgrade, and View in Forge selected the correct class and tier. Recruitment and boss controls opened correctly. Follow hero routed a browsing hero to Shop.
- Desktop screenshots and a 390px mobile check showed compact stat rows and readable paired/stacked equipment. Mobile document width equalled the viewport width (375px excluding the scrollbar), with no horizontal overflow. One source-page navigation failed to load its progression dependency; reloading restored the page, the resource returned HTTP 200, and subsequent source and portable interface checks succeeded.

The illustrated specification and portable HTML were rebuilt. The normal source server serves v1.3.3. This interface check does not add new campaign progression measurements.
