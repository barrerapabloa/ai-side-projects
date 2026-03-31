import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const src = path.join(root, "src", "app", "icon.png");
const outIcon = path.join(root, "public", "icon-v5.png");
const outFavicon = path.join(root, "public", "favicon-v5.png");

async function main() {
  const input = await fs.readFile(src);

  // The provided icon has a black backdrop. We "zoom" into the center so the
  // backdrop is cropped out, then place it on a white square for favicon use.
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) throw new Error("Could not read icon dimensions");

  // 1) Trim solid black border/background if present
  const base = sharp(input)
    .resize(256, 256, { fit: "cover", position: "centre" })
    .png();

  // Circular mask to avoid any square "box" feel.
  const circleSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><circle cx="128" cy="128" r="120" fill="white"/></svg>`,
  );

  const composed = await base
    .composite([{ input: circleSvg, blend: "dest-in" }])
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();

  await fs.writeFile(outIcon, composed);
  await fs.writeFile(outFavicon, composed);

  console.log("Wrote", outIcon, "and", outFavicon);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

