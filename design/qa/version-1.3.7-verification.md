# Version 1.3.7 verification

29 September 2026

## Progression controls

- Large spendable currency balance, prominent gold upgrade button, and a live count of affordable upgrades at the top of each room.
- Ready counts use the existing upgrade preview, including costs, current rank, parents, smith level and required equipment. No balance rules changed.
- With no available purchases, an earning hint appears; maxed trees show that all upgrades are fully developed. The button remains available for reviewing requirements.
- Smith emphasizes attribute points with an Improve smith shortcut. Legacy remains separate, displaying saved sparks in later generations.
- Phone controls span the content width; tested button heights were 53–58px.

## Browser checks

Used the existing Browser connection and disposable port 8791 fixtures. The ordinary workshop save was not opened or modified.

- Desktop screenshot at 1366px and phone screenshot at 360px verified visual hierarchy and readable controls.
- All five rooms at 360px, 768px and 1024px: no horizontal page overflow.
- Ready counts matched enabled tree purchases in Mine (2), Forge (3), Shop (4), and Adventurers (3).
- Purchased Alloy workings for 8 Prospecting: prominent balance changed 20 → 12 and ready count 3 → 2, matching the tree.
- Used the Smith shortcut and retraining in the disposable fixture, then allocated Strength: prominent attribute points changed 94 → 93 and retained the available-points highlight.
- Fresh Mine showed 0 points and an earning hint, with the tree still accessible.
- Completed Mine showed 195 points, All upgrades fully developed, and no ready highlight.
- Standalone HTML contains the progression control and opens Mine development; no external scripts or browser errors.

JavaScript syntax check passed. This was a presentation change using existing game eligibility checks; no additional engine tests or progression simulation were added.

Rebuilt specification and portable HTML (53,881,199 bytes). Reset the test viewport and closed the test tab.
