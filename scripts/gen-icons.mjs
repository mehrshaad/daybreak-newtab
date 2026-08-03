// Build the extension icons and the new-tab favicons from the two masters in
// src/assets/icon/ (produced once by scripts/extract-icon-source.mjs).
//
//   npm run gen:icons
//
// Two sets are generated, and they behave differently:
//
//   public/icon-{16,32,48,128}.png   The extension icon: chrome://extensions,
//                                    the puzzle menu, the Web Store. Chrome has
//                                    no manifest key for per-colour-scheme
//                                    icons, so this is one static set. It uses
//                                    the dark tile, which stays visible on both
//                                    light and dark browser chrome.
//
//   public/favicon-{light,dark}.png  The tab icon for the new tab page. This
//                                    one *is* swapped at runtime to follow the
//                                    browser/OS colour scheme — see
//                                    src/core/favicon.js.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const asset = (name) => path.join(root, "src/assets/icon", name);
const master = (scheme) => asset(`daybreak-${scheme}.png`);
const pub = (name) => path.join(root, "public", name);
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

// 16px gets simplified artwork. The full mark has eight rays and three horizon
// bars; at 16px the rays land on single pixels and the bars merge into one
// block, so it renders as a smudge. Verified by magnifying the actual output
// rather than assuming the downscale would cope.
const small = await readFile(asset("daybreak-small.svg"));
await sharp(small, { density: 600 })
  .resize(16, 16, { fit: "contain", background: transparent })
  .png()
  .toFile(pub("icon-16.png"));
console.log("icon-16.png (simplified artwork)");

for (const size of [32, 48, 128]) {
  await sharp(master("dark"))
    .resize(size, size, { fit: "contain", background: transparent })
    // A touch of sharpening keeps the rays crisp at 32px.
    .sharpen(size <= 32 ? { sigma: 0.5 } : { sigma: 0.3 })
    .png()
    .toFile(pub(`icon-${size}.png`));
  console.log(`icon-${size}.png`);
}

// 64px so the favicon stays crisp on hidpi while Chrome scales it to 16.
for (const scheme of ["light", "dark"]) {
  await sharp(master(scheme))
    .resize(64, 64, { fit: "contain", background: transparent })
    .png()
    .toFile(pub(`favicon-${scheme}.png`));
  console.log(`favicon-${scheme}.png`);
}

console.log("done");
