---
name: sm-add-product
description: Add new products to the SM Studios website from raw product photos. Removes photo backgrounds, upscales them to 4K with Real-ESRGAN, installs responsive sizes (800/1600/4K), and adds the product entries to the catalogue in src/data.ts. Use when the user shares product photos (HEIC/JPG/PNG) to put on the site, asks to add or replace product images, or asks to upscale or clean up product photos.
---

# SM Studios: add products from photos

End-to-end workflow: raw photos → grouped by product → background removed → 4K upscaled →
installed in `src/assets/images/products/` → catalogue entries in `src/data.ts` → verified → committed on a branch.

## Ground rules

- Pull `main` first and work on a new branch (e.g. `feat/add-<product>`). Commit only when the user asks; never push without approval.
- Never run `server.ts` locally to test: `firebase-applet-config.json` points at the **production** Firebase project. Test the frontend only with `npx vite preview` after `npm run build`.
- Never invent sizes, weights or materials the photos don't show. Prices the user hasn't given are placeholders and must be marked `// PLACEHOLDER PRICE`.
- Image processing is CPU-heavy (~35–60 s per photo). Tell the user the estimate up front, run large batches in the background, and test on 1–2 photos first.

## 1. One-time setup

```bash
python .claude/skills/sm-add-product/scripts/setup_env.py
```

Creates a venv and downloads the models (~410 MB) into `~/.sm-add-product` (your home folder, not AppData, which packaged Windows apps redirect), then prints `PYTHON=` and `MODELS=`. Use that `PYTHON` for all scripts below. Rerun with `--check` to verify. `rembg` is deliberately not used: Windows Application Control blocks its numba dependency, so the scripts call ONNX Runtime directly.

## 2. Look at the photos and group them

Work in the session scratchpad, never in the repo.

```bash
"$PYTHON" .claude/skills/sm-add-product/scripts/preview.py "$SCRATCH/preview" PHOTOS...
```

Read the contact sheets. Group shots into products (front shot first), and compare against the existing catalogue (`src/data.ts`, `src/assets/images/`) to spot photos of products that already exist.

## 3. Interview the user

Ask only what you can't see, in one `AskUserQuestion` call, recommendations first:

- Photos of existing products: replace their images, or add as new products?
- Variants (e.g. gold vs hand-painted): one product with finishes, or separate products?
- Section for each product: existing categories are `god-idols` (Sacred God Idols), `figurines` (Art & Divine Figurines), `home-decor` (Home Decor & Gifts). A new section needs extra code (step 6).
- Prices (or placeholders), and whether any product should be `featured` (homepage carousel shows only `featured: true` products; keep it to 3–4).

Names and descriptions can be proposed from the photos.

## 4. Remove backgrounds and upscale to 4K

```bash
"$PYTHON" .claude/skills/sm-add-product/scripts/process.py --models "$MODELS" --out "$SCRATCH/processed" PHOTOS...
```

Default model is BiRefNet (accurate). Add `--model isnet` for a faster pass on simple shots. Outputs `<name>_3840.webp`, `_1600.webp`, `_800.webp` and `<name>_check.jpg`.

Review **every** cutout: run `preview.py` on the `*_check.jpg` files and read the sheets. Look for a missing or hazy base (table reflections), see-through areas, leftover background, or stray specks. Rerun failures with the other `--model`. Don't install a cutout you haven't looked at.

## 5. Install into the site

```bash
"$PYTHON" .claude/skills/sm-add-product/scripts/install.py --from "$SCRATCH/processed" --dest src/assets/images/products \
  hanuman-gold=IMG_7357,IMG_7358,IMG_7359 dragon=IMG_7369
```

Slugs are lowercase-hyphen. The first name is the main shot. Files become `<slug>-<n>-<sm|md|4k>-<width>.webp`; only the listed slugs are replaced.

## 6. Add the catalogue entries (`src/data.ts`)

Near the top, add `const <name>Photos = photos('<slug>');` next to the others. Then add an entry to `PRODUCTS` (copy the shape of an existing new-style entry such as `fig-05`):

```ts
{
  id: 'fig-08',                       // next free id: fig-NN for idols/figurines, decor-NN for home decor
  name: 'PRODUCT NAME',               // uppercase, like the others
  subtitle: 'Short descriptive line',
  category: 'god-idols',              // god-idols | figurines | home-decor
  categoryLabel: 'Sacred God Idol',   // 'Art & Divine Figurine' | 'Home Decor & Gifts'
  edition: 'Divine Gold Edition',
  price: 1299, // PLACEHOLDER PRICE  (remove the comment once the user confirms)
  basePrice: 1299,
  image: xPhotos[0],
  src: xPhotos[0],
  gallery: xPhotos,
  bg: '#B45309', panel: '#D97706',    // carousel background colours that suit the product
  printTech: 'Silk Gold PLA 3D Print',
  description: 'What the photos show, in one or two sentences.',
  available: true,
  featured: false,                    // true only for the 3-4 homepage carousel products
  highlights: ['…', '…', '…', '…'],
  idealPlacement: 'Home Mandir, Study Desk',
  availableFinishes: [{ key: 'gold-leaf', label: 'Silk Gold Finish', priceDelta: 0 }],
  availableScales: [{ key: '120mm', label: 'Standard Size', priceDelta: 0 }],
},
```

`key` values must exist in the `FinishOption` / `ScaleOption` types in `src/types.ts`. To replace images of an existing product, point its `image`/`src`/`gallery` at the new `photos('<slug>')` instead.

**New section only:** add the category to `ProductCategory` (`src/types.ts`) and `normalizeCategory` (`src/data.ts`). In `src/components/StoreCatalog.tsx`, add it to `CATEGORIES`, `CATEGORY_SECTIONS`, and both scroll-tracking lists (`sections` and `targetIds`). In `src/App.tsx`, extend `handleJumpToCategory` and add a quick-link button.

## 7. Verify

```bash
npm run lint
npm run build
npx vite preview --port 4173 --strictPort    # run in the background
```

In the browser pane: each section shows the expected product count (`[id^=category-section-]` → count `[id^=product-card-]`). Open a new product's popup and click through the gallery thumbnails. Check the homepage carousel shows only the featured products. Stop the preview server afterwards.

## 8. Finish

Summarise for the user: products added and their sections, prices still marked as placeholders, any photo that needed the other model, and what wasn't verified (checkout isn't testable without the backend). Then offer to commit. Push and open a pull request only when asked.
