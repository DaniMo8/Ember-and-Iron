# Version 1.3.5 verification

29 September 2026

## Changes verified

- Mine: responsive seam cards with stock, mining and trading; adjacent worker assignment cards; no duplicated material sidebar. Large desktop crews scroll inside their panel.
- Smith: wider attribute, employee and mastery layouts; furnishings remain at the bottom.
- Forge: readable phone recipe cards, active orders before the catalogue on narrow screens, expandable material stock.
- Shop: up to five achievable requests directly in the panel, no request-list button. Customers remain below requests, with sales history after both. Compact empty display slots on phones.
- Adventurers: compact phone roster; existing name, viewer, final stats/XP, compatibility, equipped-only loadout and quest journal order preserved.
- Shared: wider desktop workspace, vertically stacked phone upgrade trees, room changes return to the top.
- All rooms: starter, middle and grand art; established requires the tier 1 boss and local milestones. Grand requires generation 2+, the tier 4 boss in the current run, established milestones and late local milestones. Room growth lists the gates.

## Automated checks

Full engine suite: **122 passed, 0 failed**, including four new request capability tests and seven room model checks. See `version-1.3.5-tests.txt` for the full run. After simplifying duplicate room-growth gates, reran the 11 request/room checks: all passed.

Requests are filtered before sorting/slicing. Tests cover recipe discovery, equipment class, machinery, attributes, proficiency, Quality finish, the quality ceiling, completed requests, temporary shortages, full queues/warehouse, limit and read-only behavior.

Room tests cover uncreated/fresh saves, independent middle milestones, first-life endgame blocked from grand art, deep second-generation eligibility, fresh Legacy rooms, local late milestones, hero follow routing and read-only behavior. All 15 PNGs have valid landscape image headers.

## Browser review

Used the in-app Browser with disposable fixtures from `layout-review.html` on port 8791. The normal workshop save on port 8777 was not loaded or modified.

- All five established rooms measured at widths 360, 768 and 1920: no horizontal document overflow.
- Visual review at 390px phone, 1366px desktop and 1920px wide desktop; character creation checked at 360px.
- Phone Room growth and Adventurer upgrades fit the dialog and use one column.
- Confirmed actual worker assignment via the select, manual mining, phone crafting and Quality finish.
- Confirmed navigation resets scroll to zero after visiting deep content.
- Gallery: all 15 images fully loaded and visually reviewed.
- Browser stage checks: starter fixtures use all five starter images; established and first-life endgame use all five middle images; late Legacy uses all five grand images.
- Standalone HTML: inline scripts, embedded images converted to local blob URLs, five visible requests, no removed request button, no browser errors. All five late Legacy rooms fit the 390px phone width.

These checks use seeded milestone saves to verify presentation and gates; they do not measure the real number of hours needed to reach each milestone.

## Deliverables

Rebuilt `Ember-and-Iron.html` (53,874,224 bytes), source entrypoint version 1.3.5 and rendered game specification. Confirmed the existing port 8777 server serves the updated entrypoint. Reset the test viewport and closed test tabs.
