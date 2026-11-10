"""Remove the background from product photos and upscale them to 4K.

    PYTHON process.py --models MODELS --out OUT [--model birefnet|isnet] PHOTO [PHOTO ...]

For each photo (HEIC/JPG/PNG):
  1. Locate the product on the full frame (background-removal model, 1024 px pass).
  2. Re-segment a close crop around it for a sharp outline; drop stray specks.
  3. Upscale the crop 4x with Real-ESRGAN (General x4v3), tile by tile.
  4. Export transparent WebP at three sizes: OUT/<name>_3840.webp (4K), _1600.webp and _800.webp,
     plus OUT/<name>_check.jpg (on a checkerboard) for review.

--model birefnet (default) is accurate but slower (~60 s/photo on CPU);
--model isnet is faster (~35 s/photo) and fine for plain backgrounds. If a cutout is wrong
(missing base, haze, see-through areas), rerun that photo with the other model.
"""
import argparse, os, time
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps, ImageFilter, ImageDraw
import pillow_heif

pillow_heif.register_heif_opener()
ap = argparse.ArgumentParser()
ap.add_argument("--models", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--model", choices=["birefnet", "isnet"], default="birefnet")
ap.add_argument("photos", nargs="+")
args = ap.parse_args()
os.makedirs(args.out, exist_ok=True)

SIZES = (3840, 1600, 800)
SR_INPUT_LONG = 1280  # long side fed to the 4x upscaler (-> 5120, resampled to 3840)
CPU = ["CPUExecutionProvider"]
seg_file = {"birefnet": "birefnet_lite.onnx", "isnet": "isnet.onnx"}[args.model]
seg = ort.InferenceSession(os.path.join(args.models, seg_file), providers=CPU)
sr = ort.InferenceSession(os.path.join(args.models, "real_esrgan_general_x4v3.onnx"), providers=CPU)


def mask_for(im):
    x = np.asarray(im.convert("RGB").resize((1024, 1024), Image.LANCZOS), dtype=np.float32) / 255.0
    if args.model == "birefnet":
        x = (x - np.array([0.485, 0.456, 0.406], np.float32)) / np.array([0.229, 0.224, 0.225], np.float32)
    else:
        x = x - 0.5
    pred = seg.run(None, {seg.get_inputs()[0].name: x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0, 0]
    if args.model == "birefnet":
        pred = 1 / (1 + np.exp(-pred))
    pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-8)
    m = Image.fromarray((pred * 255).astype(np.uint8)).resize(im.size, Image.LANCZOS)
    a = np.clip((np.asarray(m, dtype=np.float32) / 255.0 - 0.15) / 0.7, 0, 1)  # drop faint haze
    return keep_main_object(a)


def keep_main_object(a):
    """Keep connected regions at least 5% the size of the largest (removes stray specks)."""
    h0, w0 = a.shape
    small = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((max(1, w0 // 6), max(1, h0 // 6)))) > 100
    h, w = small.shape
    labels = np.zeros((h, w), np.int32); sizes = [0]
    for sy in range(h):
        for sx in range(w):
            if small[sy, sx] and not labels[sy, sx]:
                lab = len(sizes); stack = [(sy, sx)]; labels[sy, sx] = lab; n = 0
                while stack:
                    y, x = stack.pop(); n += 1
                    for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                        if 0 <= ny < h and 0 <= nx < w and small[ny, nx] and not labels[ny, nx]:
                            labels[ny, nx] = lab; stack.append((ny, nx))
                sizes.append(n)
    if len(sizes) == 1:
        return a
    keep = [i for i, n in enumerate(sizes) if i and n >= 0.05 * max(sizes)]
    kept = Image.fromarray((np.isin(labels, keep) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    return a * (np.asarray(kept.resize((w0, h0))) > 0)


def upscale4x(im):
    """4x super-resolution with overlapping 128 px tiles (model input is fixed at 128x128)."""
    x = np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0
    H, W, _ = x.shape
    T, O = 128, 16
    step = T - 2 * O
    out = np.zeros((H * 4, W * 4, 3), np.float32)
    pad = np.pad(x, ((O, O + T), (O, O + T), (0, 0)), mode="reflect")
    for y in range(0, H, step):
        for xx in range(0, W, step):
            tile = np.ascontiguousarray(pad[y:y + T, xx:xx + T].transpose(2, 0, 1)[None])
            res = sr.run(None, {"image": tile})[0][0].transpose(1, 2, 0)
            core = res[O * 4:(O + step) * 4, O * 4:(O + step) * 4]
            hh, ww = min(step, H - y) * 4, min(step, W - xx) * 4
            out[y * 4:y * 4 + hh, xx * 4:xx * 4 + ww] = core[:hh, :ww]
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))


def checker_preview(rgba, path):
    v = rgba.copy(); v.thumbnail((1000, 1000))
    bg = Image.new("RGB", v.size, "white"); d = ImageDraw.Draw(bg)
    for y in range(0, v.height, 24):
        for x in range(0, v.width, 24):
            if (x // 24 + y // 24) % 2:
                d.rectangle([x, y, x + 23, y + 23], fill=(205, 205, 205))
    bg.paste(v, (0, 0), v); bg.save(path, quality=82)


for photo in args.photos:
    t0 = time.time()
    name = os.path.splitext(os.path.basename(photo))[0]
    full = ImageOps.exif_transpose(Image.open(photo)).convert("RGB")
    probe = full.copy(); probe.thumbnail((2000, 2000))
    bbox = Image.fromarray(((mask_for(probe) > 0.16) * 255).astype(np.uint8)).getbbox()
    if not bbox:
        print(name, "ERROR: no product found"); continue
    sx, sy = full.width / probe.width, full.height / probe.height
    l, t, r, b = bbox[0] * sx, bbox[1] * sy, bbox[2] * sx, bbox[3] * sy
    pad = 0.06 * max(r - l, b - t)
    crop = full.crop((int(max(0, l - pad)), int(max(0, t - pad)), int(min(full.width, r + pad)), int(min(full.height, b + pad))))
    alpha = mask_for(crop)
    sr_in = crop
    scale = SR_INPUT_LONG / max(crop.size)
    if scale < 1:
        sr_in = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.LANCZOS)
    big = upscale4x(sr_in)
    big.thumbnail((SIZES[0], SIZES[0]), Image.LANCZOS)
    a_img = Image.fromarray((alpha * 255).astype(np.uint8)).resize(big.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.0))
    rgba = big.copy(); rgba.putalpha(a_img)
    tb = a_img.point(lambda v: 255 if v > 40 else 0).getbbox()
    m = int(0.03 * max(rgba.size))
    rgba = rgba.crop((max(0, tb[0] - m), max(0, tb[1] - m), min(rgba.width, tb[2] + m), min(rgba.height, tb[3] + m)))
    for s in SIZES:
        ratio = s / max(rgba.size)
        v = rgba.resize((round(rgba.width * ratio), round(rgba.height * ratio)), Image.LANCZOS)
        v.save(os.path.join(args.out, f"{name}_{s}.webp"), "WEBP", quality=86 if s == SIZES[0] else 84, method=6)
    checker_preview(rgba, os.path.join(args.out, f"{name}_check.jpg"))
    kb = [os.path.getsize(os.path.join(args.out, f"{name}_{s}.webp")) // 1024 for s in SIZES]
    print(f"{name}: {args.model}, 4K/1600/800 = {kb} KB, {time.time() - t0:.0f}s", flush=True)
