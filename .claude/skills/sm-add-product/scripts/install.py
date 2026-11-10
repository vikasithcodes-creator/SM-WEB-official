"""Install processed photos into the website under a product slug.

    PYTHON install.py --from OUT --dest src/assets/images/products SLUG=NAME1,NAME2,... [SLUG=...]

NAME is a processed photo name from process.py (e.g. IMG_7353); the first one listed is the main shot.
Each photo is copied in three sizes as <slug>-<n>-<tier>-<pixel width>.webp
(tier sm = 800 px, md = 1600 px, 4k = 3840 px), the naming src/data.ts expects.
Only files of the listed slugs are replaced; other products are untouched.
"""
import argparse, glob, os, re, shutil, sys
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--from", dest="src", required=True)
ap.add_argument("--dest", required=True)
ap.add_argument("mapping", nargs="+", help="slug=name1,name2,...")
args = ap.parse_args()
TIERS = {800: "sm", 1600: "md", 3840: "4k"}

plan = {}
for item in args.mapping:
    slug, _, names = item.partition("=")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug) or not names:
        sys.exit(f"bad mapping {item!r}: use lowercase-slug=NAME1,NAME2")
    plan[slug] = [n.strip() for n in names.split(",") if n.strip()]

missing = [f"{n}_{s}.webp" for names in plan.values() for n in names for s in TIERS
           if not os.path.exists(os.path.join(args.src, f"{n}_{s}.webp"))]
if missing:
    sys.exit("missing processed files: " + ", ".join(missing))

os.makedirs(args.dest, exist_ok=True)
for slug, names in plan.items():
    for old in glob.glob(os.path.join(args.dest, f"{slug}-*.webp")):
        if re.fullmatch(re.escape(slug) + r"-\d+-(sm|md|4k)-\d+\.webp", os.path.basename(old)):
            os.remove(old)
    for i, n in enumerate(names, 1):
        for size, tier in TIERS.items():
            src = os.path.join(args.src, f"{n}_{size}.webp")
            width = Image.open(src).width
            shutil.copy(src, os.path.join(args.dest, f"{slug}-{i}-{tier}-{width}.webp"))
    print(f"{slug}: {len(names)} photo(s) installed")
