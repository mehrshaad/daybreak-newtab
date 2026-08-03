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
// <raw-dir> holds the captures named 1.jpg .. 5.jpg (see CARDS below for what
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

const CARDS = [
  {
    file: "1.jpg",
    title: "Every tab, arranged your way",
    sub: "A widget board instead of a blank page — drag, resize, and keep only what you use.",
  },
  {
    file: "2.jpg",
    title: "Eleven widgets, all offline-first",
    sub: "Weather, world clocks, tasks, habits, links, a focus timer, a scratchpad and more.",
  },
  {
    file: "3.jpg",
    title: "Rearrange it in seconds",
    sub: "Layout mode: drag tiles anywhere, cycle sizes, or start from a preset.",
  },
  {
    file: "4.jpg",
    title: "Add and remove in a click",
    sub: "Browse the widgets by category, see exactly what each one can access.",
  },
  {
    file: "5.jpg",
    title: "Dark, light, and eight backgrounds",
    sub: "Six accents, adjustable tile opacity and corner radius, generated wallpapers.",
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

const footer = () =>
  Buffer.from(`<svg width="${W}" height="40" xmlns="http://www.w3.org/2000/svg">
  <text x="${W / 2}" y="26" text-anchor="middle" font-family="${FONTS}" font-size="15"
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

async function card(rawPath, meta) {
  const src = sharp(rawPath);
  const { width: rawW, height: rawH } = await src.metadata();
  const raw = await src
    .extract({ left: 0, top: 0, width: rawW - SCROLLBAR, height: rawH })
    .toBuffer();
  const shotWidth = 1160;
  const shot = await rounded(raw, shotWidth, 14);
  const x = Math.round((W - shot.width) / 2);
  const y = 252;

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
      { input: footer(), left: 0, top: H - 62 },
    ])
    // No alpha: the store wants 24-bit PNG.
    .flatten({ background: BASE })
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

const tile = await promo();
await writeFile(join(outDir, "promo-tile-440x280.png"), tile);
console.log(`promo-tile-440x280.png  ${(tile.length / 1024).toFixed(0)}KB`);
