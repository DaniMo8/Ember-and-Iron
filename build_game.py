"""Bundle the local game into one portable HTML file using only Python's stdlib."""
from pathlib import Path
import re
import base64
import json
import tempfile


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "Ember-and-Iron.html"


def read(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


def replace_once(source: str, pattern: str, replacement: str, label: str) -> str:
    result, count = re.subn(pattern, lambda _: replacement, source, count=0)
    if count != 1:
        raise ValueError(f"Expected exactly one {label}; found {count}.")
    return result


def build() -> Path:
    page = read("index.html")
    css = read("house.css")
    if re.search(r"</style", css, flags=re.IGNORECASE):
        raise ValueError("The stylesheet contains an HTML closing-style delimiter.")
    page = replace_once(
        page,
        r'<link\s+rel="stylesheet"\s+href="house\.css(?:\?[^"<>]*)?"\s*/?>',
        f"<style>\n{css}\n</style>",
        "local stylesheet reference",
    )
    scripts = re.findall(r'<script\s+src="([\w-]+\.js)(?:\?[^"<>]*)?"', page)
    for filename in scripts:
        script = read(filename)
        # Prevent a string/comment in a source file from ending its HTML script element.
        script = re.sub(r"</script", r"<\\/script", script, flags=re.IGNORECASE)
        page = replace_once(
            page,
            rf'<script\s+src="{re.escape(filename)}(?:\?[^"<>]*)?"\s*>\s*</script>',
            f"<script>\n/* Bundled source: {filename} */\n{script}\n</script>",
            filename,
        )
    if re.search(r'<script\b[^>]*\bsrc\s*=', page, flags=re.IGNORECASE):
        raise ValueError("An external script remains in the standalone output.")
    if re.search(r'<link\b[^>]*\brel=[\"\']stylesheet[\"\']', page, flags=re.IGNORECASE):
        raise ValueError("An external stylesheet remains in the standalone output.")
    required_art = {"splash", "legacy", "button", "frame"}
    required_art.update(f"{room}-{stage}" for room in ("smith", "mine", "smelter", "forge", "shop", "arena", "employees") for stage in range(3))
    required_art.update(f"fighter-{role}" for role in ("vanguard", "duelist", "ranger", "breaker", "guardian", "mage"))
    artwork = {p.stem: 'data:image/webp;base64,' + base64.b64encode(p.read_bytes()).decode('ascii') for p in sorted((ROOT / 'assets/house').glob('*.webp'))}
    if required_art - artwork.keys():
        raise ValueError("Missing House artwork: " + ", ".join(sorted(required_art - artwork.keys())))
    page = page.replace('<script>\n/* Bundled source: house-app.js */', '<script>window.EIHouseArt=' + json.dumps(artwork) + ';</script>\n<script>\n/* Bundled source: house-app.js */')
    atlas = base64.b64encode((ROOT / 'assets/inventory/inventory-atlas.png').read_bytes()).decode('ascii')
    page = page.replace('<script>window.EIHouseArt=', '<script>window.EIInventoryArt="data:image/png;base64,' + atlas + '";</script><script>window.EIHouseArt=')
    # Keep the last playable build intact if writing is interrupted.
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", newline="\n", dir=ROOT, prefix=".ember-build-", suffix=".tmp", delete=False) as target:
        target.write(page)
        staged_output = Path(target.name)
    staged_output.replace(OUTPUT)
    print(f"Built {OUTPUT.name}: {OUTPUT.stat().st_size:,} bytes; CSS and all game scripts included.")
    return OUTPUT


if __name__ == "__main__":
    build()
