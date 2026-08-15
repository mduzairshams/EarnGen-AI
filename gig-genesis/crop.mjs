import { Jimp } from "jimp";

async function main() {
  const logoPath = "./public/logo.png";
  console.log("Loading logo from:", logoPath);

  const image = await Jimp.read(logoPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  console.log(`Image loaded. Size: ${width}x${height}`);

  // Find the blue circle bounding box in the upper half of the image
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  // Scan the upper 70% of the image to find the blue circle, avoiding the text at the bottom
  const scanHeight = Math.floor(height * 0.7);

  for (let y = 0; y < scanHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) * 4;
      const r = image.bitmap.data[idx];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      const a = image.bitmap.data[idx + 3];

      // Check if it is a non-white, non-transparent pixel (distance from white)
      if (a > 50 && (r < 245 || g < 245 || b < 245)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`Found bounds: minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY}`);

  if (minX >= maxX || minY >= maxY) {
    console.error("Could not locate the logo circle.");
    return;
  }

  // Calculate coordinates for cropping
  // Give it a tiny 10px padding to avoid cutting the edges
  const padding = 15;
  let cropX = Math.max(0, minX - padding);
  let cropY = Math.max(0, minY - padding);
  let cropW = (maxX - minX) + (padding * 2);
  let cropH = (maxY - minY) + (padding * 2);

  // We want it to be a perfect square so the resulting image is round when we apply rounded-full
  const size = Math.max(cropW, cropH);
  console.log(`Cropping square box: x=${cropX}, y=${cropY}, size=${size}`);

  image.crop({ x: cropX, y: cropY, w: size, h: size });
  
  // Save the cropped image
  const outputPath = "./public/logo-cropped.png";
  await image.write(outputPath);
  console.log("Success! Cropped logo saved to:", outputPath);
}

main().catch(err => {
  console.error("Error cropping image:", err);
});
