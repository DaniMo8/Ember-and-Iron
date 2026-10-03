# Version 2.3: Employees and the whole-game design proposal

4 October 2026.

## Implemented gameplay

Employees have their own room and upgrade overlay. Eight named specialists occupy Mine, Smelter, Forge and Shop departments. The original four hires keep their IDs, signing costs, experience, levels, stamina and leave state. Four new specialists contribute mining speed, smelting speed, metal-preparation quality and sale prices. The basic mining crew can also be hired and assigned here and continues working during specialist breaks.

The Employees tree contains twelve upgrades across Training, Welfare and Organization. Eleven are new; Managed shift roster moves from Forge with its existing paid rank preserved. Training changes actual earned XP and active effects, welfare changes fatigue/recovery, and organization affects hiring and shifts. Signing costs are one-time costs, with no recurring wage debt. Quartermaster bin space remains permanent during leave; employee power does not inflate or shrink that capacity.

Smith now contains attributes, furnishings and mastery. Department links lead from the relevant production room to Employees. Eight phone navigation buttons occupy two rows with 44-pixel-high targets. All eight staff and employee upgrades reset with the generation, while the existing furnishing and Legacy rules remain.

## Regression checks

**191 tests passed, zero failures.** Run `node --test tests/*.test.js`. Output: [version-2.3-tests.txt](version-2.3-tests.txt).

Eleven new employee cases verify department counts, gold spending and exponential prices, hire gates and duplicate charging, real production/price effects, work-earned experience, leave, training, stable bin capacity, endurance and recovery, migration of existing hires and paid shifts, online/offline/reload equivalence, prerequisite validation, room-art gates, and migration of an old pinned shift goal on load and import.

The idle reviewer found a specific migration error in the first implementation: moving the shift node to Employees made an older goal pinned under Forge fail validation. The final code accepts only that specific old goal and normalises it to Employees, preserving its rank. The new regression also verifies that arbitrary mismatched room/goal IDs still fail validation.

Existing crafting, refund, inventory, quest, automation, price, migration and retirement checks remain green. These checks verify behaviour and safeguards; they do not establish a fresh full-campaign balance curve with every new employee upgrade.

## Browser verification

Browser tests used disposable saves at port 8791. The player's save on port 8777 was not read or changed.

- At 1440 × 900: opened Employees, hired the Quartermaster, Pit foreman, Furnace tender and Assayer through actual controls; assigned the miner to coal; gave the Quartermaster manual leave; purchased Induction journals, Common room and Managed shift roster; enabled managed breaks. Gold, department counts, current contributions, XP and recovery values updated visibly.
- Reload retained the hires, purchases, miner assignment and managed-break setting. Manual leave remained manual.
- At 360 × 800: all eight navigation targets fit in two rows, all four department selectors fit one row, and the Employees screen and upgrade overlay had no horizontal page overflow. Organization's label fits on one line.
- Opened the rebuilt standalone HTML in Employees with the test save. It loaded the room and saved shift setting with no external script references and no horizontal overflow.

Screenshots: [desktop Employees](version-2.3-employees-desktop.png), [phone upgrades](version-2.3-employees-phone.png).

## Whole-game proposal and visual artifacts

The idle-game enthusiast produced [The House of the Hammer](../arena-loop-proposal.md): a whole-game redesign covering all rooms, mining, materials, forging, mastery, stats and professions, contracts and armoury, gladiators, rival-house leagues, deterministic replays, staffing, economy, Legacy, onboarding and migration.

The [interactive design atlas](../arena-design-atlas.html) includes the complete proposal, five SVG progression maps with Mermaid sources, desktop and phone UI ideas, a clickable rival-to-crafting-goal concept and a phased build order. All five chart choices loaded their graphics in the browser. Selecting The Glass Lantern and pinning its response updated the concept's persistent goal to “Weather the first spell burst.” The concept had no horizontal page overflow on desktop or phone; large charts and tables use their own scroll regions on narrow screens.

Screenshot: [arena interface concept](arena-interface-concept.png).

The reviewer separately checked the atlas's distinction between implemented and proposed systems. **Arena combat, an owned-team armoury, revised contracts, new economic rules, rival ladders and replays are design proposals, not shipped gameplay.** The mockup changes no game save. Current quests and customer shopping remain playable. Pacing figures in the proposal are targets for a future prototype; they are not claimed as new simulation results.

## Build

The playable specification, current diagrams and upgrade catalogue were updated. The catalogue now contains 124 room upgrades, including twelve Employee nodes and fifteen Smelter nodes. The portable HTML embeds the updated game and existing artwork. The design atlas and charts build using `python design/tools/build_arena_atlas.py`, without external libraries or a network request.
