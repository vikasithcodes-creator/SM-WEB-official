"""One-time setup for the sm-add-product skill.

Creates a Python virtual environment and downloads the three ONNX models into a per-user cache
folder (outside the repository), then prints the paths the other scripts need.

    python setup_env.py            # create/refresh, print paths
    python setup_env.py --check    # only report what is present

Cache folder: ~/.sm-add-product (e.g. C:\\Users\\<you>\\.sm-add-product).
Models (~410 MB total):
  - isnet.onnx           IS-Net general-use, fast background removal (rembg release)
  - birefnet_lite.onnx   BiRefNet general lite, accurate background removal (rembg release)
  - real_esrgan_general_x4v3.onnx (+ .data)  Real-ESRGAN 4x upscaler (Qualcomm AI Hub release)
"""
import os, sys, subprocess, urllib.request, zipfile, shutil, argparse

# Home folder, not %LOCALAPPDATA%: packaged Windows apps (like the Claude desktop app) get a redirected
# view of AppData\Local, which splits model files across two locations.
CACHE = os.path.join(os.path.expanduser("~"), ".sm-add-product")
VENV = os.path.join(CACHE, "venv")
MODELS = os.path.join(CACHE, "models")
PY = os.path.join(VENV, "Scripts", "python.exe") if os.name == "nt" else os.path.join(VENV, "bin", "python")
PACKAGES = ["pillow", "pillow-heif", "numpy", "onnxruntime"]

DOWNLOADS = {
    "isnet.onnx": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx",
    "birefnet_lite.onnx": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-bb_swin_v1_tiny-epoch_232.onnx",
}
ESRGAN_ZIP = ("https://qaihub-public-assets.s3.us-west-2.amazonaws.com/qai-hub-models/models/"
              "real_esrgan_general_x4v3/releases/v0.66.0/real_esrgan_general_x4v3-onnx-float.zip")
ESRGAN = os.path.join(MODELS, "real_esrgan_general_x4v3.onnx")


def status():
    have = {
        "venv": os.path.exists(PY),
        **{n: os.path.exists(os.path.join(MODELS, n)) for n in DOWNLOADS},
        "real_esrgan_general_x4v3.onnx": os.path.exists(ESRGAN),
    }
    for k, v in have.items():
        print(f"  {'OK ' if v else 'MISSING'}  {k}")
    return all(have.values())


def download(url, dest):
    print(f"downloading {os.path.basename(dest)} ...", flush=True)
    tmp = dest + ".part"
    urllib.request.urlretrieve(url, tmp)
    os.replace(tmp, dest)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    os.makedirs(MODELS, exist_ok=True)
    if args.check:
        sys.exit(0 if status() else 1)

    if not os.path.exists(PY):
        print("creating virtual environment ...", flush=True)
        subprocess.check_call([sys.executable, "-m", "venv", VENV])
    uv = shutil.which("uv")
    if uv:
        subprocess.check_call([uv, "pip", "install", "-q", "--python", PY, *PACKAGES])
    else:
        subprocess.check_call([PY, "-m", "pip", "install", "-q", *PACKAGES])

    for name, url in DOWNLOADS.items():
        if not os.path.exists(os.path.join(MODELS, name)):
            download(url, os.path.join(MODELS, name))
    if not os.path.exists(ESRGAN):
        z = os.path.join(MODELS, "esrgan.zip")
        download(ESRGAN_ZIP, z)
        with zipfile.ZipFile(z) as zf:
            for member in zf.namelist():
                base = os.path.basename(member)
                if base.endswith((".onnx", ".data")):
                    with zf.open(member) as src, open(os.path.join(MODELS, base), "wb") as out:
                        shutil.copyfileobj(src, out)
        os.remove(z)

    # Smoke test: every library must load (Windows Application Control can block some DLLs).
    subprocess.check_call([PY, "-c", "import PIL, pillow_heif, numpy, onnxruntime; print('libraries OK')"])
    ok = status()
    print(f"\nPYTHON={PY}\nMODELS={MODELS}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
