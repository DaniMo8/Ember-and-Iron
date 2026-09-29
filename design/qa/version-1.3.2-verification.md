# Quality finishing — v1.3.2 verification

29 September 2026

Quality finishing adds the full original job duration, +20 quality up to the forge ceiling, and +10 percentage points prefix chance. It can be selected once on active or queued orders. Queued selections use the bonuses at actual start and survive save/reload. Finishing does not consume extra materials or change the job's random seed. Old active orders with the former finish already applied retain their saved timing and quality.

All **115 automated tests passed**. Six new scenarios cover late selection, queued/save/reload/start behavior, quality and chance caps, deterministic real prefix outcomes online and offline, exact cancellation refunds, and older finished orders. The existing core expectations now use the new quality bonus. Output: `finishing-regression-results.txt`.

Browser verification used only the disposable port-8786 workshop from `finishing-preview.html`. The user's normal saved workshop was not loaded or modified. Verified both Work in progress and Manage queue expose active and queued controls; selection changed quality 36→56 and prefix chance 14%→24%; work time doubled; repeated finishing was disabled; both selected orders survived reload; cancelling the first order started the queued finished order at quality 56 and 24% prefix chance with its doubled duration. No browser console errors occurred. The narrow layout was checked at 390px, with no horizontal document overflow.

The source game, illustrated specification and portable HTML were rebuilt. Earlier long campaign simulations predate both purchased oil and the new finishing duration and should not be read as current progression timings.
