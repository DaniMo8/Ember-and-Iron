# Version 1.4.2 verification

29 September 2026

## Shop layout

Removed the Recent sales panel and the Warehouse / Craft stock shortcut buttons. Warehouse stock is now a compact, quality-sorted list immediately below Items for sale. Item inspection, enchantments, keepsake protection, manual display transfers, liquidation and salvage remain available. The list distinguishes stored pieces from the total storage capacity used by both displays and warehouse.

Automatic salvage controls moved into Shop upgrades, behind the existing Salvage bench unlock. A separate Apply threshold action validates whole values from 0 to 200 and commits the setting explicitly. Draft edits do not alter the active rule.

## Verification

- All 137 automated checks passed; see version-1.4.2-tests.txt. No simulation or pricing rules changed.
- Desktop at 1440 × 1000 and phone at 360 × 800: compact rows, readable controls and no horizontal page overflow.
- Mixed stock: sorted quality order, complete prefixed/suffixed names, material indicators, and protected, reserved and manually held states.
- Display is disabled while shelves are full. Selling and scrapping are disabled for protected/reserved pieces.
- Holding a displayed item refills its slot from the lowest-quality eligible warehouse stock. Selling and scrapping stored items remove the correct piece. Moving a held piece onto a free display works.
- Opening a stored keepsake preserves the full item-detail and protection controls.
- Empty Shop retains all six empty display slots and explains where future stock goes.
- Unlocked automatic salvage can be toggled, and an applied Q1 threshold persists after reloading. An invalid Q201 draft leaves the saved threshold unchanged.
- No browser console errors during these checks. Browser checks use synthetic saves on isolated port 8791; the player's port 8777 save was untouched.

Fixture: shop-stock-review.html. Documentation and the portable HTML build were rebuilt from the final source.
