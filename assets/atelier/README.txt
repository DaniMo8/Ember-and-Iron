EMBER & IRON — ORIGINAL 3D ATELIER ASSETS

Authored for the approved handcrafted-diorama direction, 5 October 2026.
Editable source: atelier-source.blend (Blender 5.2).
Rebuild: Blender in a separate background process with
  --background --factory-startup --python design/tools/build_atelier_assets.py

All meshes, procedural texture maps and materials were created in Blender for
this project. These are real GLB models, not background screenshots. No external
art pack or downloaded character model was used. The Blender file contains
separate ASSET_* collections; unhide a collection to edit it.

Packages: Forge, Showroom, Arena, articulated character, rondel dagger, heater
shield and smith's hammer. The prototype animates named rigid joints at runtime.
It does not yet contain a full skinned animation library or all recipe families.

Named QualityDetail / PrefixDetail / RuneDetail groups drive item appearance.
Mail and Apron groups are separate visibility variants. Static environment
meshes are joined by material; character parts are joined only within a joint.
Coordinate convention: glTF +Y up, characters face +Z. Assets share geometry
between instances; mutable item materials are cloned and disposed separately.

The asset manifest contains actual exported byte and polygon counts. Device
quality presets change resolution and shadows without changing simulation.
World-item LODs, texture deduplication across packages and further animation
work remain useful production improvements before full campaign integration.

Measured weathered revision, 5 October 2026: GLB packages total 17,836,464 bytes. The initial
Forge plus shared people and equipment is 10,553,152 bytes before locally served
renderer code. Shop and Arena load on first visit. These are uncompressed asset
sizes; the basic local server sends them uncompressed. The design book's
8 MB compressed production target has not been certified for this build.
The earlier slice's desktop balanced-preset sample reported 138 FPS, 319 renderer draw calls
(including shadows), 252,000 triangles and 73 textures. It is not a mobile
benchmark. Real-device testing, LODs and lower draw counts remain rollout work.

Three.js 0.186.1 is separately vendored under atelier/vendor/three with its MIT
licence. The game makes no runtime requests to a third-party asset or code CDN.

Weathered revision: soot-toned brick, aged timber and leather, uneven limewash,
fine blade grinding marks, restrained enchantment emission and smaller heads.
These remain prototype characters; final adult rigs are specified in the design
book. The live item close-up uses the existing WebGL renderer only when its
configuration, angle or size changes, then copies to the UI canvas.
