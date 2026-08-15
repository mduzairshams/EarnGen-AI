import { Jimp } from "jimp";
import fs from "fs";

async function main() {
  const sourcePath = "C:/Users/mduza/.gemini/antigravity/brain/bb4a487d-5ac6-4686-94cc-e2fa6e13fb61/media__1779042545750.jpg";
  console.log("Loading user circular logo from:", sourcePath);

  if (!fs.existsSync(sourcePath)) {
    console.error("Error: Circular logo source file does not exist at:", sourcePath);
    return;
  }

  const image = await Jimp.read(sourcePath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  console.log(`Image dimensions: ${width}x${height}`);

  const cx = width / 2;
  const cy = height / 2;
  const radius = (width / 2) - 3; // Slight inset to prevent border artifacts

  // We want to make the black background pixels transparent
  // We'll iterate through every pixel and check if it's outside the circle
  // or if it's extremely close to black.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) * 4;
      const r = image.bitmap.data[idx];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // If outside the circular boundary OR if it's a solid black background pixel
      if (dist > radius || (r < 18 && g < 18 && b < 18)) {
        image.bitmap.data[idx + 3] = 0; // Set Alpha to 0 (transparent)
      }
    }
  }

  // Save as high-fidelity PNG to all active logo targets
  const targets = [
    "./public/logo-cropped.png",
    "./src/assets/logo-cropped.png",
    "./public/logo.png",
    "./src/assets/logo.png"
  ];

  for (const target of targets) {
    await image.write(target);
    console.log(`Successfully processed and saved logo to: ${target}`);
  }

  console.log("Global logo replacement complete with perfect transparency!");
}

main().catch(err => {
  console.error("Error replacing logo:", err);
});
