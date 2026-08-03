// One-off: lift the chosen icon design out of the generated contact sheet
// (gpt.png) into two clean square masters, one per colour scheme.
//
//   node scripts/extract-icon-source.mjs gpt.png
//
// The sheet holds six designs rendered twice: dark tiles in the upper half,
// light tiles in the lower. Tiles are found by scanning for regions much darker
// or much brighter than the sheet's page background, rather than by hardcoded
// crops, so a re-render at a different size still works.
//
// Corners are cut to transparency afterwards: the sheet's page background sits
// in them, and a white corner around a black tile looks broken on a dark
// toolbar.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const CELL = { row: 0, col: 2 }; // top-right design
const OUT = "src/assets/icon";

const source = process.argv[2] || "gpt.png";
const meta = await sharp(source).metadata();
const { width: W, height: H } = meta;
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const ch = info.channels;

const lum = (x, y) => {
  const i = (y * W + x) * ch;
  return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
};

// Contiguous runs where the count exceeds a threshold, ignoring specks.
function bands(counts, thresh, min = 40) {
  const out = [];
  let start = null;
  counts.forEach((v, i) => {
    if (v > thresh && start === null) start = i;
    else if (v <= thresh && start !== null) {
      if (i - start >= min) out.push([start, i - 1]);
      start = null;
    }
  });
  if (start !== null) out.push([start, counts.length - 1]);
  return out;
}

function findRows(test, y0, y1) {
  const counts = [];
  for (let y = y0; y <= y1; y++) {
    let n = 0;
    for (let x = 0; x < W; x += 2) if (test(x, y)) n++;
    counts.push(n);
  }
  return bands(counts, 25).map(([a, b]) => [a + y0, b + y0]);
}

function findCols(test, top, bottom) {
  const counts = [];
  for (let x = 0; x < W; x++) {
    let n = 0;
    for (let y = top; y <= bottom; y += 2) if (test(x, y)) n++;
    counts.push(n);
  }
  return bands(counts, 25);
}

const half = Math.floor(H / 2);
const isDark = (x, y) => lum(x, y) < 45;
const isWhite = (x, y) => lum(x, y) > 252;

function pick(test, y0, y1, label) {
  const rows = findRows(test, y0, y1);
  const row = rows[CELL.row];
  if (!row) throw new Error(`${label}: no row ${CELL.row} (found ${rows.length})`);
  const cols = findCols(test, row[0], row[1]);
  const col = cols[CELL.col];
  if (!col) throw new Error(`${label}: no column ${CELL.col} (found ${cols.length})`);
  const w = col[1] - col[0] + 1;
  const h = row[1] - row[0] + 1;
  // Square it off from the centre; the scan can be a pixel or two uneven.
  const side = Math.min(w, h);
  return {
    left: col[0] + Math.floor((w - side) / 2),
    top: row[0] + Math.floor((h - side) / 2),
    width: side,
    height: side,
  };
}

const boxes = {
  light: pick(isWhite, half - 40, H - 1, "light"),
  dark: pick(isDark, 0, half + 40, "dark"),
};

await mkdir(OUT, { recursive: true });

for (const [scheme, box] of Object.entries(boxes)) {
  const side = box.width;
  const r = Math.round(side * 0.235); // matches the sheet's corner rounding
  const mask = Buffer.from(
    `<svg width="${side}" height="${side}">` +
      `<rect width="${side}" height="${side}" rx="${r}" ry="${r}" fill="#fff"/></svg>`
  );
  const out = path.join(OUT, `daybreak-${scheme}.png`);
  await sharp(source)
    .extract(box)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toFile(out);
  console.log(`${scheme}: ${side}x${side} at (${box.left},${box.top}) -> ${out}`);
}
