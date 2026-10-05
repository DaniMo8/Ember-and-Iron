# Ember & Iron design documentation

The playable game is **House edition 3.2.5**. Start with `campaign-guide.html` for the long campaign and `house-guide.html` for the House systems. The root README records implemented changes and their verification.

The **5 October 2026 approved 3D direction** is `diorama-design.html`, with companion `diorama-design.css` and `diorama-design.js`. Open the HTML directly or serve the repository. It defines the handcrafted diorama direction, all eight room layouts and behaviours, evolving architecture, visible item properties, employees, browsing customers, a proposed real-time combat core, interface layouts and the Blender production plan. Its interactive drawings remain spatial and appearance studies. Printing includes an appendix with every room brief and station.

The first working 3D slice is now `../atelier.html`, served alongside the main game. It has its own accelerated resources and save: Forge, Showroom, four-person Arena, actual Blender GLB assets, a configurable rondel, paid production, auto-equipped team commissions, automatic displays and purchases, real-time deterministic combat and replays. The full campaign is unchanged. Editable source: `../assets/atelier/atelier-source.blend`; reproducible authoring script: `tools/build_atelier_assets.py`. Test evidence: `qa/atelier-regression-tests.txt`. The browser checks and captures cover real item routing, a completed bout/replay, a return popup and responsive layouts; they are not a full campaign balance review or physical-phone performance certification.

The earlier **Version 1.2** specification describes the historical five-room Classic campaign. Its `game-specification.html` and `game-specification.md` remain reference material, not the current House specification.

Historical Classic diagrams:

- `diagrams/game-flow.svg`: player crafting loop and autonomous adventurer loop.
- `diagrams/ui-layout.svg`: full-screen room hierarchy and contextual controls.
- `diagrams/item-tree.svg`: item access, slots and five material tiers.
- `diagrams/room-trees.svg`: four currencies and twelve upgrade paths.
- `diagrams/legacy-tree.svg`: the permanent 24-talent Legacy tree.

Regenerate the 96-node tables with `node design/tools/export_catalogue.js`, then run `python design/tools/build_document.py` to rebuild the illustrated HTML.

Earlier specifications, diagrams and portable releases are retained in `archive`. `qa/mobile-preview.html` is a 390-pixel viewport harness for visual checks of the source game.

Historical Classic reviews are `qa/idle-enthusiast-v2.md` and `qa/medieval-enthusiast-v2.md`; the House campaign review is `qa/house-campaign-review.md`. Controlled Classic UI fixture: run `node design/qa/build-preview-fixture.js`, serve the project on port 8781, and open `design/qa/campaign-preview.html`. The fixture loader refuses other ports to protect the normal workshop origin.
