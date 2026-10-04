"""Compress the rendered Blender scenes and build a labelled QA contact sheet.
Run after render_themed_rooms.py. Requires Pillow in the authoring environment only.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "assets" / "house"
ROOMS = ("smith", "mine", "smelter", "forge", "shop", "arena", "employees", "legacy")
sources = [ART / f"{room}-{stage}.png" for room in ROOMS for stage in range(5)]
for source in sources:
    with Image.open(source) as picture:
        if picture.size != (1440, 960):
            raise ValueError(f"Expected the new 1440×960 scene: {source.name}")

sheet = Image.new("RGB", (1600, 8 * 238), "#101b20")
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 15)
except OSError:
    font = ImageFont.load_default()
for row, room in enumerate(ROOMS):
    for stage in range(5):
        with Image.open(ART / f"{room}-{stage}.png") as source:
            picture = source.convert("RGB")
            picture.save(ART / f"{room}-{stage}.webp", "WEBP", quality=85, method=6)
            sheet.paste(picture.resize((320, 213), Image.Resampling.LANCZOS), (stage * 320, row * 238 + 25))
            draw.text((stage * 320 + 8, row * 238 + 3), f"{room.title()} · stage {stage + 1}", fill="#ead4a5", font=font)
sheet.save(ROOT / "design" / "qa" / "themed-room-contact-sheet.jpg", quality=90)
print("Packaged 40 themed WebP backgrounds and the visual review sheet.")
