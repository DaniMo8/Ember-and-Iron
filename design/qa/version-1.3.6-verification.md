# Version 1.3.6 verification

29 September 2026

- Leather, wood and Alchemical Oil now appear together in one compact right-hand panel in Mine and Forge. Each retains its amount and Buy 1 / Buy 5 controls without a stock bar.
- On narrow screens this panel stacks above the main work. Mine workers remain after workings, while active Forge work precedes the catalogue.
- Replaced the inherited background animation that reached 100% opacity with a background-only fade from 8% to 42% over 0.6 seconds. The dark overlay remains present. Normal interface updates do not restart it.
- Reduced motion disables the background fade and preserves the 42% resting opacity.

## Verification

JavaScript syntax check passed. This update changes presentation only; no new engine tests were added or a full progression simulation run.

In-app browser checks used an isolated established-workshop fixture on port 8791:

- Desktop screenshots verified both supply panels sit to the right of the main work at 1366px.
- At 360px, 768px and 1024px, both rooms contain exactly one panel and all three supplies. No horizontal document overflow or supply-button clipping.
- Phone screenshot at 390px verified supplies and active Forge work stack clearly before the catalogue.
- Oil purchases from Mine and Forge increased the displayed count 20 → 21 → 22.
- Background opacity observed below its final 42% during the transition; room content opacity remained 1.
- Reduced motion checked through Settings: background animation became none and opacity remained 0.42 after switching rooms.
- Standalone HTML checked in Mine and Forge: correct panels, background animation and no external scripts or browser errors.

Rebuilt the game specification and `Ember-and-Iron.html` (53,876,340 bytes). Test tabs closed and viewport reset. The normal workshop save was not loaded or modified.
