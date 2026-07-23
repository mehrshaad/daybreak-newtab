// One-off asset optimizer: converts the bundled background JPGs to WebP (full
// size, capped at 1920px) and generates small thumbnails for the picker.
// Run with: npm run optimize:wallpapers
import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/assets/backgrounds"
);
const thumbDir = path.join(dir, "thumbs");

const files = (await readdir(dir)).filter((f) => f.endsWith(".jpg"));
if (!existsSync(thumbDir)) await mkdir(thumbDir, { recursive: true });

for (const f of files) {
  const key = f.replace(/\.jpg$/, "");
  const src = path.join(dir, f);
  await sharp(src)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(dir, `${key}.webp`));
  await sharp(src)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toFile(path.join(thumbDir, `${key}.webp`));
  console.log("converted", key);
}
console.log(`done: ${files.length} wallpapers`);
