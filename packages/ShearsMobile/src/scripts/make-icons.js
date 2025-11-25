
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ---------- CONFIG ----------
const ICONS_DIR = path.resolve(__dirname, 'icons');   // <-- change if you store elsewhere
const ANDROID_ROOT = path.resolve(__dirname, '../../android/app/src');

const FLAVORS = [
  { name: 'shear',   file: 'shear.png'   },
  { name: 'purpose', file: 'purpose.png' }
];

const DENSITIES = [
  { folder: 'mdpi',    size: 48 },
  { folder: 'hdpi',    size: 72 },
  { folder: 'xhdpi',   size: 96 },
  { folder: 'xxhdpi',  size: 144 },
  { folder: 'xxxhdpi', size: 192 }
];
// --------------------------------

(async () => {
  console.log('Generating Android icons…\n');

  for (const flavor of FLAVORS) {
    const srcPath = path.join(ICONS_DIR, flavor.file);
    if (!fs.existsSync(srcPath)) {
      console.error(`ERROR: Missing source icon → ${srcPath}`);
      process.exit(1);
    }

    console.log(`Flavor: ${flavor.name}`);

    for (const d of DENSITIES) {
      const outDir = path.join(ANDROID_ROOT, flavor.name, 'res', `mipmap-${d.folder}`);
      const outFile = path.join(outDir, `ic_${flavor.name}.png`);

      // Ensure folder exists
      fs.mkdirSync(outDir, { recursive: true });

      await sharp(srcPath)
        .resize(d.size, d.size)
        .png()
        .toFile(outFile);

      console.log(`  ${d.folder} → ${path.relative(process.cwd(), outFile)}`);
    }
    console.log('');
  }

  console.log('All icons generated successfully!');
})();