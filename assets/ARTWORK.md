# House edition 3.2 — original Blender artwork

The active game has **40 room backgrounds: eight rooms × five architectural stages**, plus the existing splash, rendered button/frame surfaces, six fighter miniatures and inventory atlas. Every room includes its own starting workshop and later inherited estate. Models, materials and lights are original local Blender geometry, with no downloaded models or textures.

`design/tools/render_themed_rooms.py` imports the modelling primitives in `render_house_art.py`, replacing the old shared tiled diorama shell. It generates the Mine, Smelter, Forge, Shop, Arena, Smith, Employees and Legacy scenes. Editable sources are the eight `assets/house/*-evolution.blend` files. Scenes use Blender 5.2, Cycles with 20 samples and denoising, 1440×960 output, and WebP quality85 encoding. CUDA is used when available; CPU rendering is the fallback. This is format compression, not AI image editing.

Each room has its own materials, architecture, lighting and five development stages:

| Room | Visual theme | Later additions |
|---|---|---|
| Mine | Uneven packed earth, natural cavern walls, timber pit props, lanterns and cart rails; no tiled floor | Sorting bench, ore hoist, underground pool, deep crystal seams |
| Smelter | Refractory furnaces, molten crucibles, casting gutters, moulds and coal | Additional furnaces, lifting gantry, assay tables, celestial alloy bath |
| Forge | Soot-dark masonry hearth and chimney, anvil, tongs, bellows and quench tub | Grinding wheel, power hammer, tempering vessels, runed heat stones |
| Shop | Oak boards, counter, ledger, coins and weapon racks | Shields, carpet runner, armour displays and relics |
| Smith | Quiet timber study, drafting vellum, books and candlelight | Additional desk, guild trophies and armillary |
| Employees | Communal table, pewter cups, benches and warm hearth | Rest bunks, duty board, training desk and artisan pennants |
| Arena | Fighting sand, training dummies, banners and open mountain skyline | Spectator stands, champion gate, seals and Crucible runes |
| Legacy | Blue marble, memorial inscriptions, candlelit columns and ceremonial anvil | Braziers, ancestral crystals and celestial armillary |

Rooms evolve independently from their own upgrades; later stages also require subsequent generations and permanent research. Exact thresholds are intentionally absent from the player interface. Perspective cameras keep the working area central for desktop and phone crops. Options change panel surface alpha and scenery dimming independently; text itself is never made transparent.

`render_house_art.py` also reproduces the original splash and semantic-control metalwork; `render_house_fighters.py` reproduces transparent miniatures. Text is never baked into a button image. Runtime dimming and responsive cropping keep information legible. Unused historical artwork below remains available to Classic but is excluded from the active portable build.

# Original artwork — The Foundry

Five original cinematic backgrounds were generated with the built-in image-generation tool for this project. No external reference images were used. Original generated files remain in the Codex generated-images folder; copies are included here without raster edits.

| Location | Game asset | Original generated file |
|---|---|---|
| Smith / creation | smith.png | exec-30be7029-ddf1-42d0-899a-c4677e0cfcdc.png |
| Mine | mine.png | exec-969fd983-999e-488c-b2a2-011bc2d90495.png |
| Forge | forge.png | exec-51637fd5-fd6e-4eda-9f9b-183ace946794.png |
| Shop | shop.png | exec-d942ccd8-9949-4e3a-bf14-2c33838548a8.png |
| Adventurers | adventurers.png | exec-8983f51d-c9cc-4ea4-a587-fceeab124098.png |

Original directory: `C:\Users\DaniMo\.codex\generated_images\01a0adfe-093c-7711-a91f-fa6c1515dda3`.

## Shared generation prompt

Use case: stylized-concept. Asset: full-screen background for a polished HTML fantasy management RPG, landscape 16:9 composition. Original hand-painted cinematic game environment, richly detailed, elegant semi-realistic illustration, strong depth, restrained magical glow, crisp focal objects, beautiful volumetric light, premium modern strategy-game art.

No text, no lettering, no logo, no UI, no pixel art, no retro style, no collage. Entire canvas one coherent environment. Leave lower foreground navigable and uncluttered. Output a landscape image.

## Location briefs

**Smith:** A master blacksmith’s private study for character creation. Stone arched windows overlook mountains at dawn. A leather journal, exquisite sword and tools sit on an oak desk; an empty coat stand holds a dark leather apron. Embers glow in a hearth. No people. Keep the central and left composition calm enough for interface overlays.

**Mine:** A majestic vaulted underground mine with blue-green mineral seams, brass lanterns, wooden supports, minecart railway and ore crates. Leave a clear foreground for animated workers. Outcrops spread horizontally through the middle: copper and coal on the left, higher iron and violet crystal on the right. No people.

**Forge:** An immense foundry with a central stone forge and amber fire, a basic anvil on the left, a grinding wheel on the right, a smelter in the background, and a water trough and tempering rack at the far right. Clear floor for a walking smith. No people.

**Shop:** A fantasy sword shop with walnut display cases, sword racks, shield stands, glass counter, burgundy rugs, a warehouse door on the left and a sunlit entrance on the right. Brass lamps, a clear foreground and lightly stocked decorative displays. No people.

**Adventurers:** A spectacular guild hall with arches overlooking a valley, a central map table, three empty rest alcoves, banners, supplies and a hearth. Clear foreground, blue daylight and warm candles. No people.

## Runtime treatment

The game layers readable dark gradients and brass information panels over these images. Illustrations are passive backgrounds; hero activity has a separate live viewer. Ownership is reflected by gameplay controls; painted equipment and decorative merchandise are background scenery. The portable build embeds all sixteen images as data URLs. No external image URLs are required.
## Version 1.1 additions

Ten new starting and middle-stage backgrounds join the five preserved late-game originals. See [new image provenance](NEW-ARTWORK.md), [exact prompt set](background-prompts.json) and [all fifteen scenes](gallery.html). All were generated with the built-in image-generation tool and copied into this assets folder without raster edits.

## Version 1.3.5 progression

Every room begins with its starter scene. Established scenes require the tier 1 boss and room-specific milestones. Grand scenes require generation 2+, the tier 4 boss in the current run, all established milestones and late room milestones. See the game specification or Room growth in each room for exact requirements.

## Version 1.4.0 — Legacy hall

`legacy.png` is the single permanent background for the separate Legacy screen. Generated using the built-in image-generation tool from [this exact prompt](legacy-background-prompt.txt), without reference images or raster editing. Original: `exec-ab34e8ba-cdac-42b9-8d49-85d4bdc499b4.png` in the original directory above. Gold-inlaid marble, monumental arches and a ceremonial anvil distinguish the permanent hall from the five evolving workrooms. The screen unlocks after the first Void Sovereign victory and remains accessible in subsequent generations.
