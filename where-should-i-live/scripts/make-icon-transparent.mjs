import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const src = path.join(root, "src", "app", "icon.png");
const outIcon = path.join(root, "public", "icon-v6.png");
const outFavicon = path.join(root, "public", "favicon-v6.png");

function isBackdropBlack(r, g, b) {
  // Backdrop is solid black in the provided PNG.
  return r === 0 && g === 0 && b === 0;
}

async function main() {
  const input = await fs.readFile(src);

  const image = sharp(input).resize(256, 256, { fit: "contain" }).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  // RGBA per pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Remove only pure-black backdrop pixels.
    if (isBackdropBlack(r, g, b)) {
      data[i + 3] = 0; // transparent
    }
  }

  const png = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    // Slight blur helps remove jaggy matte edges from thresholding.
    .blur(0.3)
    .png()
    .toBuffer();

  await fs.writeFile(outIcon, png);
  await fs.writeFile(outFavicon, png);
  console.log("Wrote", outIcon, "and", outFavicon);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

