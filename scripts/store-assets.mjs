// Builds the Chrome Web Store listing images from raw screenshots.
//
// The screenshots are captured from the running extension at whatever aspect the
// browser window happens to be, and the store wants 1280x800. Rather than
// stretch or crop the UI, each capture is inset on a card that uses the
// extension's own dark Mesh palette, with a caption above it — the standard
// store-card shape, and the UI inside stays at its captured resolution so it
// stays sharp.
//
//   node scripts/store-assets.mjs <raw-dir>
//
// <raw-dir> holds the captures named 1.jpg .. 5.jpg — and 5-dark.jpg /
// 5-light.jpg, the two halves the split card is built from (see CARDS for what
// each one is meant to show). Outputs land in store-assets/.

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const outDir = join(root, "store-assets");

const W = 1280;
const H = 800;

// Straight from src/core/tokens.js — the dark theme's base and the default
// accent, so the cards and the product cannot drift apart.
const BASE = "#0a0b0e";
const ACCENT = "#6f9bff";
const FG = "#f4f5f8";

const FONTS = "'Segoe UI', 'DM Sans', system-ui, -apple-system, sans-serif";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const CARDS = [
  // The five are a sequence, not five goes at the same picture. A visitor
  // scrolls them in order and gives the first one about a second: it has to
  // land the idea, and the rest earn the install. So the arc is want it,
  // trust it can do the job, see it become yours, see it fit your life,
  // and finally see it is not going to fight your taste.
  //
  // Each is shot from its own board in store-assets/boards, on a different
  // theme, accent and background. The old set used one board five times in
  // one colour, which quietly said "this is all it does".
  {
    file: "1.jpg",
    title: "A new tab worth opening",
    sub: "Your day, laid out the moment you need it — the time, the weather, what's next, and the places you actually go.",
  },
  {
    file: "2.jpg",
    // The count is checked against packages/widget-* by a test, because it
    // said "seventeen" for two releases after it stopped being seventeen.
    title: "Twenty-two widgets, all offline-first",
    sub: "Weather, prayer times, the moon, habits, a focus timer, the news. Browse by category, see what each one can access, add it in a click.",
  },
  {
    file: "3.jpg",
    title: "Give every widget its own colour",
    sub: "Fifteen accents, twelve generated backgrounds, and a colour per tile — so a full board reads at a glance instead of being searched.",
  },
  {
    file: "4.jpg",
    title: "Work and home, kept apart",
    sub: "Up to three boards on one install. Each keeps its own layout, its own look and its own settings, and each syncs on its own.",
  },
  {
    file: "5.jpg",
    // Built from the two halves rather than captured: the same board, same
    // arrangement, same moment, under both themes.
    split: ["5-dark.jpg", "5-light.jpg"],
    title: "Dark or light, and yours either way",
    sub: "Follow your system or pick a side. Corners, opacity, zoom, frosted glass or flat — every dial is where you can find it.",
  },
];

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// The Mesh wallpaper, restated in SVG: two accent blooms and a cool counter
// light, over the dark base.
function backdrop(w, h) {
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="a" cx="8%" cy="-10%" r="78%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity=".42"/>
      <stop offset="62%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b" cx="97%" cy="4%" r="62%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity=".22"/>
      <stop offset="58%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="c" cx="50%" cy="118%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".07"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${BASE}"/>
  <rect width="${w}" height="${h}" fill="url(#a)"/>
  <rect width="${w}" height="${h}" fill="url(#b)"/>
  <rect width="${w}" height="${h}" fill="url(#c)"/>
</svg>`);
}

const caption = ({ title, sub }) =>
  Buffer.from(`<svg width="${W}" height="220" xmlns="http://www.w3.org/2000/svg">
  <text x="64" y="104" font-family="${FONTS}" font-size="44" font-weight="600"
        letter-spacing="-1" fill="${FG}">${escape(title)}</text>
  <text x="64" y="150" font-family="${FONTS}" font-size="19" font-weight="400"
        fill="${FG}" fill-opacity=".62">${escape(sub)}</text>
</svg>`);

// Up in the caption band, opposite the title, rather than along the bottom of
// the card, where it landed on top of the screenshot.
const footer = () =>
  Buffer.from(`<svg width="${W}" height="220" xmlns="http://www.w3.org/2000/svg">
  <text x="${W - 64}" y="104" text-anchor="end" font-family="${FONTS}" font-size="15"
        letter-spacing="3" fill="${FG}" fill-opacity=".38">DAYBREAK</text>
</svg>`);

// Rounded corners, done by masking rather than by an SVG clip path, so the
// screenshot itself is never re-encoded through a rasteriser.
async function rounded(buffer, width, radius) {
  const shot = sharp(buffer).resize({ width });
  const { height } = await shot.clone().metadata().then(async () => {
    const meta = await sharp(await shot.clone().toBuffer()).metadata();
    return meta;
  });
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
       <rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#fff"/>
     </svg>`
  );
  const out = await shot
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  return { buffer: out, width, height };
}

// Chrome's own scrollbar lands on the right edge of a capture. It is not part of
// the extension, so it is trimmed off.
const SCROLLBAR = 12;

// A capture taken through browser automation carries a highlight along its
// edges, and the mouse pointer has to be parked somewhere — the bottom-right
// corner is the only place it is not over the UI.
//
// Per side rather than one number: the highlight is a few pixels, but the
// pointer and the scrollbar are only ever bottom and right. Trimming all four
// sides by enough to lose the pointer took the wordmark in the page's own
// top-left corner with it.
const TRIM = { top: 8, left: 8, right: 26, bottom: 26 };

// The card's own margins. The screenshot is fitted inside what is left under
// the caption — it used to be pinned to a fixed 1160px wide at a fixed y, which
// is only ever right for one capture aspect: anything taller ran off the bottom
// of the card with no margin under it at all, which is exactly what it looked
// like. Sizing to the box instead means a capture of any shape lands centred
// with the same air around it.
const MARGIN = 56;
const SHOT_TOP = 196;

// Trim, then fit into the card's box without cropping or distorting.
async function place(rawPath) {
  const src = sharp(rawPath);
  const { width: rawW, height: rawH } = await src.metadata();
  const trimmedW = rawW - TRIM.left - TRIM.right - SCROLLBAR;
  const trimmedH = rawH - TRIM.top - TRIM.bottom;
  const raw = await src
    .extract({ left: TRIM.left, top: TRIM.top, width: trimmedW, height: trimmedH })
    .toBuffer();

  const boxW = W - MARGIN * 2;
  const boxH = H - MARGIN - SHOT_TOP;
  const width = Math.round(Math.min(boxW, (trimmedW * boxH) / trimmedH));

  const shot = await rounded(raw, width, 14);
  return {
    shot,
    x: Math.round((W - shot.width) / 2),
    y: SHOT_TOP + Math.round((boxH - shot.height) / 2),
  };
}

// One image of the same screen in both themes, split down the middle. Saying
// "dark and light" in a caption is weaker than showing the seam, and the two
// halves have to be the same board in the same arrangement or it reads as two
// unrelated screenshots rather than one page under two themes.
//
// Both captures must be the same size, which they are: nothing between them
// changes but the stored theme.
async function splitThemes(darkPath, lightPath, outPath) {
  const dark = sharp(darkPath);
  const { width, height } = await dark.metadata();
  const light = sharp(lightPath);
  const lightMeta = await light.metadata();
  if (lightMeta.width !== width || lightMeta.height !== height) {
    throw new Error(
      `split halves differ: ${width}x${height} vs ${lightMeta.width}x${lightMeta.height}`
    );
  }

  const half = Math.round(width / 2);
  const left = await dark.extract({ left: 0, top: 0, width: half, height }).toBuffer();
  const right = await light
    .extract({ left: half, top: 0, width: width - half, height })
    .toBuffer();

  const joined = await sharp({
    create: { width, height, channels: 3, background: BASE },
  })
    .composite([
      { input: left, left: 0, top: 0 },
      { input: right, left: half, top: 0 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  await writeFile(outPath, joined);
  return outPath;
}

async function card(rawPath, meta) {
  const { shot, x, y } = await place(rawPath);

  // A soft drop shadow: the same rounded rect, blurred, under the screenshot.
  const shadow = await sharp({
    create: {
      width: shot.width + 80,
      height: shot.height + 80,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${shot.width + 80}" height="${shot.height + 80}" xmlns="http://www.w3.org/2000/svg">
             <rect x="40" y="40" width="${shot.width}" height="${shot.height}"
                   rx="14" fill="#000" fill-opacity=".55"/>
           </svg>`
        ),
      },
    ])
    .blur(18)
    .png()
    .toBuffer();

  return sharp(backdrop(W, H))
    .composite([
      { input: shadow, left: x - 40, top: y - 28 },
      { input: shot.buffer, left: x, top: y },
      // A hairline over the screenshot edge, so it reads as a panel on the card.
      {
        input: Buffer.from(
          `<svg width="${shot.width}" height="${shot.height}" xmlns="http://www.w3.org/2000/svg">
             <rect x=".5" y=".5" width="${shot.width - 1}" height="${shot.height - 1}"
                   rx="14" fill="none" stroke="#ffffff" stroke-opacity=".14"/>
           </svg>`
        ),
        left: x,
        top: y,
      },
      { input: caption(meta), left: 0, top: 40 },
      { input: footer(), left: 0, top: 40 },
    ])
    // No alpha: the store wants 24-bit PNG.
    .flatten({ background: BASE })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// 1400x560 marquee tile, for the store's featured carousel: the mark and name on
// the left, a slice of the real board on the right. The slice is cropped out of a
// screenshot rather than shrunk from the whole page, so the UI in it stays at a
// size where it reads as a product and not as texture.
const SLICE_W = 880;

async function marquee(rawPath) {
  const W2 = 1400;
  const H2 = 560;

  const src = sharp(rawPath);
  const { width: rawW, height: rawH } = await src.metadata();
  // The tiles, not the header: from just under the greeting to the bottom of the
  // capture, and stopping short of the scrollbar.
  const width = Math.min(rawW - TRIM.left - TRIM.right - SCROLLBAR, Math.round(rawW * 0.58));
  const top = Math.round(rawH * 0.4);
  // The slice is scaled to SLICE_W on the tile and its shadow needs 40px of
  // margin all round, so the crop cannot be taller than what leaves room for
  // both. Derived rather than fixed: a capture from a taller window would
  // otherwise produce a shot bigger than the canvas it composites onto.
  const maxHeight = Math.floor((width * (H2 - 80)) / SLICE_W);
  const crop = {
    left: TRIM.left,
    top,
    width,
    height: Math.min(rawH - top - TRIM.bottom, maxHeight),
  };
  const slice = await src.extract(crop).toBuffer();
  const shot = await rounded(slice, SLICE_W, 16);

  const icon = await sharp(join(root, "public", "icon-128.png"))
    .resize({ width: 96 })
    .toBuffer();

  const text = Buffer.from(`<svg width="${W2}" height="${H2}" xmlns="http://www.w3.org/2000/svg">
  <text x="88" y="322" font-family="${FONTS}" font-size="62" font-weight="600"
        letter-spacing="-1.5" fill="${FG}">Daybreak</text>
  <text x="90" y="366" font-family="${FONTS}" font-size="21" font-weight="400"
        fill="${FG}" fill-opacity=".62">Every tab, arranged your way</text>
</svg>`);

  const shadow = await sharp({
    create: {
      width: shot.width + 80,
      height: shot.height + 80,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${shot.width + 80}" height="${shot.height + 80}" xmlns="http://www.w3.org/2000/svg">
             <rect x="40" y="40" width="${shot.width}" height="${shot.height}"
                   rx="16" fill="#000" fill-opacity=".55"/>
           </svg>`
        ),
      },
    ])
    .blur(20)
    .png()
    .toBuffer();

  // Runs off the right edge on purpose: a floating card needs a right border,
  // and a border landing mid-tile reads as a rendering artifact. Bleeding it off
  // the canvas says "the page carries on" instead.
  const shotX = 560;
  const shotY = Math.round((H2 - shot.height) / 2);

  return sharp(backdrop(W2, H2))
    .composite([
      { input: shadow, left: shotX - 40, top: shotY - 28 },
      { input: shot.buffer, left: shotX, top: shotY },
      {
        input: Buffer.from(
          `<svg width="${shot.width}" height="${shot.height}" xmlns="http://www.w3.org/2000/svg">
             <rect x=".5" y=".5" width="${shot.width - 1}" height="${shot.height - 1}"
                   rx="16" fill="none" stroke="#ffffff" stroke-opacity=".14"/>
           </svg>`
        ),
        left: shotX,
        top: shotY,
      },
      { input: icon, left: 88, top: 168 },
      { input: text, left: 0, top: 0 },
    ])
    .flatten({ background: BASE })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// The listing icon. Not the same file as the extension's own icon: the store's
// image guidelines ask for the artwork at 96x96 inside a 128x128 canvas with
// transparent padding, whereas public/icon-128.png is full-bleed because that is
// what Chrome's own surfaces want. Rendered from the 288px master, so it is a
// downscale rather than an upscale of the shipped png.
//
// The dark tile, like the extension icon, because the store shows icons on white.
async function storeIcon() {
  const art = await sharp(join(root, "src", "assets", "icon", "daybreak-dark.png"))
    .resize({ width: 96, height: 96, fit: "contain", background: TRANSPARENT })
    .toBuffer();
  return sharp({
    create: { width: 128, height: 128, channels: 4, background: TRANSPARENT },
  })
    .composite([{ input: art, left: 16, top: 16 }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// 440x280 small promo tile: the mark, the name, and nothing else.
async function promo() {
  const icon = await sharp(join(root, "public", "icon-128.png"))
    .resize({ width: 92 })
    .toBuffer();
  const text = Buffer.from(`<svg width="440" height="280" xmlns="http://www.w3.org/2000/svg">
  <text x="220" y="196" text-anchor="middle" font-family="${FONTS}" font-size="38"
        font-weight="600" letter-spacing="-.5" fill="${FG}">Daybreak</text>
  <text x="220" y="228" text-anchor="middle" font-family="${FONTS}" font-size="15"
        letter-spacing="3" fill="${FG}" fill-opacity=".55">NEW TAB</text>
</svg>`);
  return sharp(backdrop(440, 280))
    .composite([
      { input: icon, left: 174, top: 44 },
      { input: text, left: 0, top: 0 },
    ])
    .flatten({ background: BASE })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const rawDir = process.argv[2];
if (!rawDir) {
  console.error("usage: node scripts/store-assets.mjs <raw-screenshot-dir>");
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const present = new Set(await readdir(rawDir));

for (const [i, meta] of CARDS.entries()) {
  // A split card's own file is generated from its two halves, so it is the
  // halves that have to be on disk.
  if (meta.split && meta.split.every((half) => present.has(half))) {
    await splitThemes(
      join(rawDir, meta.split[0]),
      join(rawDir, meta.split[1]),
      join(rawDir, meta.file)
    );
    present.add(meta.file);
  }
  if (!present.has(meta.file)) {
    console.warn(`skipped ${meta.file} — not in ${rawDir}`);
    continue;
  }
  const buf = await card(join(rawDir, meta.file), meta);
  const name = `screenshot-${i + 1}.png`;
  await writeFile(join(outDir, name), buf);
  const { width, height } = await sharp(buf).metadata();
  console.log(`${name}  ${width}x${height}  ${(buf.length / 1024).toFixed(0)}KB`);
}

const listingIcon = await storeIcon();
await writeFile(join(outDir, "store-icon-128.png"), listingIcon);
console.log(`store-icon-128.png  ${(listingIcon.length / 1024).toFixed(1)}KB`);

const tile = await promo();
await writeFile(join(outDir, "promo-tile-440x280.png"), tile);
console.log(`promo-tile-440x280.png  ${(tile.length / 1024).toFixed(0)}KB`);

if (present.has(CARDS[0].file)) {
  const wide = await marquee(join(rawDir, CARDS[0].file));
  await writeFile(join(outDir, "marquee-1400x560.png"), wide);
  const { width, height } = await sharp(wide).metadata();
  console.log(`marquee-1400x560.png  ${width}x${height}  ${(wide.length / 1024).toFixed(0)}KB`);
}
