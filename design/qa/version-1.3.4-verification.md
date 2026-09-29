# Equipped items only — v1.3.4

Removed forge recommendations, per-slot alternatives and crafting/navigation controls from Adventurers and individual hero records. All six equipment slots retain detailed equipped-item information, worn starting gear and two-handed restrictions. Desktop equipment uses two columns; narrow screens use one. Equipment requests remain in Shop → Customer requests, using the existing commission system.

Verified source and portable previews contain six equipped-item slots and zero upgrade cards or hero crafting controls. The 390px layout has no horizontal overflow. The Shop request panel and commission overlay still open. Three targeted existing commission tests pass: relationship-generated requests, masterwork requirements/protection, and automatic matching-stock delivery. Game source and portable HTML are v1.3.4; the specification is rebuilt.

Testing used the disposable port-8787 workshop. An initial connection attempt preceded server readiness and left a browser-generated error tab that its URL policy would not allow the tool to close. Checks succeeded in a fresh tab once the server was ready; the working preview was closed afterward. The normal saved workshop was not loaded or altered.
