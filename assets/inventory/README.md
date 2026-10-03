# Blender inventory artwork

Original, procedural 3D models rendered with Blender 5.2.1 / Cycles. No downloaded models or textures are used.

- `inventory-atlas.png`: transparent 3072 × 3456 atlas, 192px cells, 16 columns and 18 rows.
- `manifest.json`: coordinates for 273 icons: 255 ordinary equipment variants and 18 resources.
- `inventory-models.blend`: editable meshes, materials, camera and lighting.
- `../../design/tools/render_blender_icons.py`: complete, deterministic model and render source. Run in a new Blender background process with `--factory-startup --python`.
- `../../inventory-icons.js`: generated browser metadata, included in the portable build.

Equipment keys use `item-{class}-{tier}-{variant}`. Resource keys use `material-{id}`. Rare and legendary Legacy designs share the prestige silhouette of their class and material tier. The old raw `steel` ID is obsolete; steel uses its alloy ingot icon.

The browser uses one cached atlas image for all sprites. The portable game embeds the atlas and converts it to one shared image URL. Rebuilding the portable game uses `build_game.py` after rendering.
