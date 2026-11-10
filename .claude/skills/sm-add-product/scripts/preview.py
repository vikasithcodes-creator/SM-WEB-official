"""Labelled contact sheets of product photos (HEIC/JPG/PNG/WebP), 9 per sheet, for grouping shots.

    PYTHON preview.py OUT_DIR PHOTO [PHOTO ...]

Writes OUT_DIR/sheet1.jpg, sheet2.jpg, ... Each tile is labelled with the file name (without extension).
Also works on processed cutouts: transparent images are shown on a checkerboard so leftover
background is easy to spot.
"""
import os, sys
from PIL import Image, ImageOps, ImageDraw, ImageFont
import pillow_heif

pillow_heif.register_heif_opener()
out, files = sys.argv[1], sys.argv[2:]
os.makedirs(out, exist_ok=True)
font = ImageFont.load_default(size=26)


def checker(size, cell=20):
    im = Image.new("RGB", size, "white"); d = ImageDraw.Draw(im)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(205, 205, 205))
    return im


tiles = []
for f in files:
    im = ImageOps.exif_transpose(Image.open(f))
    im.thumbnail((400, 400))
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = checker(im.size); bg.paste(im, (0, 0), im); im = bg
    tiles.append((os.path.splitext(os.path.basename(f))[0], im.convert("RGB")))

for s in range(0, len(tiles), 9):
    sheet = Image.new("RGB", (3 * 410, 3 * 440), "white"); d = ImageDraw.Draw(sheet)
    for i, (label, t) in enumerate(tiles[s:s + 9]):
        x, y = (i % 3) * 410, (i // 3) * 440
        sheet.paste(t, (x + (400 - t.width) // 2, y + 35 + (400 - t.height) // 2))
        d.text((x + 8, y + 2), label, fill="red", font=font)
    path = os.path.join(out, f"sheet{s // 9 + 1}.jpg")
    sheet.save(path, quality=85)
    print(path)
