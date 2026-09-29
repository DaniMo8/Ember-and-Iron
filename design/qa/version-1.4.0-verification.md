# Version 1.4.0 verification

29 September 2026.

## Result

All **130 automated checks pass**, including eight new campaign, boss-order and Legacy checks. The source game and rebuilt portable HTML were exercised in the browser using disposable saves on port 8791. The player's save on port 8777 was not loaded or changed.

## Quest progression and boss orders

- Four victories fail each ordinary approach gate; five satisfy it. Every boss checks all earlier ordinary quests. Void Sovereign checks all seven at five, plus the preceding boss clear. Boss mastery remains one victory.
- Successful ordinary parties still contribute one count per hero. Existing mastery-pressure tests now verify the enemy health/attack ceiling at five counts rather than twenty.
- Gather and launch dispatches a ready selected party immediately. Away heroes finish returning; a forced retreat enters recovery and automatically launches the reserved party after recovery ends.
- A selected party waits when all expedition berths are occupied and launches after a berth opens.
- Online and offline advancement after reloading a pending order produces the same boss expedition. Launch clears the reservation, cannot repeat itself, and rejects concurrent duplicate boss orders.
- Cancel gathering removes the order. Invalid/duplicate hero selections cannot overwrite an existing reservation. Old saves containing manual reservations remain manual until the player presses the combined button.
- Existing material delivery, returns, automatic shelf restocking, salvage, employee, combat, finishing and save-validation checks continue to pass.

## Legacy and browser review

- At four Rat Nest victories, the boss button shows 4 / 5 and is disabled. The Legacy navigation tab is greyed out and disabled. Opening `?room=legacy` on a locked save returns to Smith.
- At five victories, selecting a ready party exposes one Gather and launch action. Clicking it changes the boss board to Expedition underway.
- With a hero travelling, the combined button creates an automatic gathering order. The board explains the wait, retains the order after reload and removes it after Cancel gathering.
- First-life final-boss victory opens the dedicated Hall of legacies, showing a 46-spark campaign reward and four previews of the talent branches.
- Retirement uses the existing confirmation and heirloom selection, then returns to character creation. Entering Legacy before creating the next smith exposes all 24 talents. Buying Practiced Hands reduces 46 sparks to 44, and both purchase and balance survive reload.
- Checked 1440 × 1000 desktop, 820 × 1000 tablet, 390 × 844 phone and 360 × 800 narrow phone. Six navigation buttons fit; the Legacy panels and talent cards have no horizontal page overflow. Phone talent paths stack vertically.
- The new hall is one full-screen background, with the existing dim room transition. It stays the same across generations. The other five rooms retain their three artwork stages.
- Portable build displays the Legacy hall from an embedded blob URL, with zero external script references. No game console errors were observed.

## Artifacts

- `Ember-and-Iron.html`: 57,579,254 bytes; 16 embedded backgrounds.
- `assets/legacy.png`: original background made with the built-in image-generation tool; no raster edits. Exact brief: `assets/legacy-background-prompt.txt`.
- `design/qa/boss-legacy-review.html`: explicit-button, isolated-origin browser fixture.
- `design/qa/version-1.4.0-tests.txt`: complete automated test output.
- Specification, game-flow diagram, UI-layout diagram, artwork gallery and README updated.

The historical multi-hour economy profiles in earlier reports predate the five-victory change; this verification covers the new thresholds, launch lifecycle, persistence and presentation.
