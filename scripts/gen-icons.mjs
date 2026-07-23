// Rasterize the Daybreak logo (public/logo.svg) into the extension icon PNGs.
// Run with: npm run gen:icons
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const pub = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public"
);
const svg = await readFile(path.join(pub, "logo.svg"));

for (const size of [16, 32, 48, 128]) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(pub, `icon-${size}.png`));
  console.log(`icon-${size}.png`);
}
console.log("done");
