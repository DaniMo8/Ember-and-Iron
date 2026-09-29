# Foundry v1.0 verification

Date: 26 September 2026.

## Automated checks

- 40 existing engine and game-flow regression checks passed.
- 21 Foundry-system checks passed.
- An additional 24-hour offline request credited exactly 8 hours, completed 430 expeditions, kept mining within bin capacities and produced a valid exported save. A second offline request credited zero additional time.
- Source JavaScript syntax checks passed. Release sources decode as UTF-8 without replacement characters.
- The portable HTML build includes all six runtime scripts, the stylesheet and five PNG backgrounds. Final size is approximately 18.3 MB.

The Foundry tests cover creation allocations, profession effects, uncapped attributes, level rewards, individual assignments, overflow work, mining-point accounting, escalating thresholds, each room currency, upgrade prerequisites, worker capacity, recruitment/class access, forge metallurgy, enchanting, quality breakthroughs, crafting reservations, delivery holds, automatic salvage, restocking, hero training, travel, recovery, policies, legacy reset, migration, malformed saves and online/offline equivalence.

## Browser checks

The source game and portable build were exercised through the in-app browser on separate local test origins. User-origin saves were not reset.

- First-time creation appeared over the new Smith illustration.
- A Bladesmith and a Prospector were created through the UI.
- The initial roster contained Mara, Renn and Wren.
- Class filters hid unavailable hero classes and the first sword was queued.
- Careful finishing raised a live job’s quality by five and then became unavailable for that job.
- An autonomous customer bought the first sword; quest records showed victories and retreats, followed by browsing and recovery.
- Worker assignment changed from bronze to coal through the assignment overlay.
- Mining and other room upgrade overlays displayed connected paths, costs, ranks and prerequisites.
- The quest watcher displayed actual recorded combat events and health totals.
- Five room backgrounds, navigation, contextual objects, inventory access and live counters were visually inspected.
- A 390px iframe viewport showed the compact Forge layout, scrolling recipe strip and responsive navigation.
- The standalone HTML loaded its embedded art, accepted a new profession and supported crafting and the quality finish.

## Remaining tuning

This is a playable systems overhaul, not a claim of finished commercial balance. Multi-day human progression, late upgrade affordability, repeated customer demand and time to first retirement still need extended playtesting. Background equipment is decorative; owned machinery and sale stock are identified by the interactive labels and live controls.
