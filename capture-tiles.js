const { chromium } = require('@playwright/test');
const path = require('path');

const tiles = [
  { file: 'tile-small-440x280.html', width: 440, height: 280 },
  { file: 'tile-large-920x680.html', width: 920, height: 680 },
  { file: 'tile-large-1280x800.html', width: 1280, height: 800 },
  { file: 'tile-marquee-1400x560.html', width: 1400, height: 560 }
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const tile of tiles) {
    const filePath = path.join(__dirname, 'store-listing', 'tiles', tile.file);
    const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;

    await page.setViewportSize({ width: tile.width, height: tile.height });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    const outputPath = path.join(__dirname, 'store-listing', 'tiles', tile.file.replace('.html', '.png'));
    await page.screenshot({ path: outputPath });
    console.log(`Saved screenshot to ${outputPath}`);
  }

  await browser.close();
  console.log('All tiles captured successfully.');
})();
