import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "public", "media", "Text Document Banners");
const TARGET_DIR = path.join(ROOT, "public", "media", "text-document-banners");

const MAPPINGS = [
  { from: "Art1.png", to: "mist-valley.webp" },
  { from: "Art2.png", to: "ink-mountains.webp" },
  { from: "Art3.png", to: "river-mist.webp" },
  { from: "Art4.png", to: "forest-path.webp" },
  { from: "Art5.png", to: "desert-dawn.webp" },
  { from: "blenz_banner.png", to: "blenz-banner.webp" },
];

fs.mkdirSync(TARGET_DIR, { recursive: true });

for (const { from, to } of MAPPINGS) {
  const input = path.join(SOURCE_DIR, from);
  const output = path.join(TARGET_DIR, to);

  if (!fs.existsSync(input)) {
    console.warn(`Skip missing: ${from}`);
    continue;
  }

  const inputSize = fs.statSync(input).size;
  const info = await sharp(input)
    .webp({ quality: 85, effort: 4 })
    .toFile(output);

  console.log(
    `${from} -> ${to}: ${(inputSize / 1024).toFixed(0)} KB -> ${(info.size / 1024).toFixed(0)} KB`,
  );
}
