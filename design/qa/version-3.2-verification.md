# House edition 3.2 — atmosphere and options

- Replaced all 40 room backgrounds with original Blender environments. Reviewed the complete contact sheet, mine and forge close-ups, later shop and smelter scenes, and the arena. The mine uses natural rock and bare earth throughout all five stages.
- Live options: overlay transparency 0–85%, background dimming 0–70%, three transparency presets, master/music/effects volumes and mute. Text is kept solid. Device preferences are separate from game saves and survive reloads.
- Browser checks covered live keyboard slider changes, preset buttons, mute, restoring defaults, persistence, room switching and phone layout. A 390px pass visited every ordinary room; the Legacy room and options were checked at 320px. Desktop options and scenery were reviewed at 1440px. No horizontal overflow or preview errors occurred in these checks.
- The portable HTML loads the new scenery through embedded assets, contains no external scripts/stylesheets, and exposes the same saved options and room music. Final size: 12,969,974 bytes.
- Eight original 32-bar scores render through the actual synthesizer. Eighteen-second opening samples are finite, audible and unclipped at default settings. Mute and zero-volume checks are silent; music and effects buses work independently. Rapid transitions dispose of old voices; visibility suspension, resumption and stopping pass. Audio evidence covers sampled openings and lifecycle behavior, not subjective listening to every full loop.
- All 260 automated tests pass. The final audio cleanup change also passed the browser lifecycle fixture and the 11 focused atmosphere/input checks.
- Gameplay rules, costs and progression gates were not changed in this update.

Evidence: `version-3.2-tests.txt`, `room-audio-checks.json`, `room-audio-lifecycle.json`, `atmosphere-browser-checks.json`, `options-desktop.png`, `options-phone.png`, `themed-mine-desktop.png`, `themed-room-contact-sheet.jpg`. Visual game fixtures ran only on the isolated localhost port8792 save.
