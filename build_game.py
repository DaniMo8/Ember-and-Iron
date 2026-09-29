"""Bundle the local game into one portable HTML file using only Python's stdlib."""
from pathlib import Path
import re
import base64
import json


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
    css = read("styles.css")
    if re.search(r"</style", css, flags=re.IGNORECASE):
        raise ValueError("The stylesheet contains an HTML closing-style delimiter.")
    page = replace_once(
        page,
        r'<link\s+rel="stylesheet"\s+href="styles\.css(?:\?[^"<>]*)?"\s*/?>',
        f"<style>\n{css}\n</style>",
        "local stylesheet reference",
    )
    for filename in ("data.js", "engine.js", "campaign.js", "company.js", "formation-combat.js", "progression.js", "world-engine.js", "world-scenes.js", "room-model.js", "app.js"):
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
    artwork = {p.stem: 'data:image/png;base64,' + base64.b64encode(p.read_bytes()).decode('ascii') for p in (ROOT / 'assets').glob('*.png')}
    page = page.replace('<script>\n/* Bundled source: app.js */', '<script>window.EIArt=' + json.dumps(artwork) + ';</script>\n<script>\n/* Bundled source: app.js */')
    OUTPUT.write_text(page, encoding="utf-8", newline="\n")
    print(f"Built {OUTPUT.name}: {OUTPUT.stat().st_size:,} bytes; CSS and all game scripts included.")
    return OUTPUT


if __name__ == "__main__":
    build()
