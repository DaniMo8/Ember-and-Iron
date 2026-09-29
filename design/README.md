# Foundry documentation

The current **Version 1.2** specification describes the playable five-room campaign with manual tier bosses, 180 medieval recipes and crafted-prefix/enchanted-suffix items. Open `game-specification.html` for the illustrated document or edit `game-specification.md`.

Current diagrams:

- `diagrams/game-flow.svg`: player crafting loop and autonomous adventurer loop.
- `diagrams/ui-layout.svg`: full-screen room hierarchy and contextual controls.
- `diagrams/item-tree.svg`: item access, slots and five material tiers.
- `diagrams/room-trees.svg`: four currencies and twelve upgrade paths.
- `diagrams/legacy-tree.svg`: the permanent 24-talent Legacy tree.

Regenerate the 96-node tables with `node design/tools/export_catalogue.js`, then run `python design/tools/build_document.py` to rebuild the illustrated HTML.

Earlier specifications, diagrams and portable releases are retained in `archive`. `qa/mobile-preview.html` is a 390-pixel viewport harness for visual checks of the source game.

The two current reviews are `qa/idle-enthusiast-v2.md` and `qa/medieval-enthusiast-v2.md`. Controlled UI fixture: run `node design/qa/build-preview-fixture.js`, serve the project on port 8781, and open `design/qa/campaign-preview.html`. The fixture loader refuses other ports to protect the normal workshop origin.
