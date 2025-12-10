#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports, no-console */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSVG = path.join(__dirname, '../public/icon-source.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 Generating PWA icons from SVG...\n');

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    await sharp(inputSVG).resize(size, size).png().toFile(outputPath);

    console.log(`✅ Generated icon-${size}x${size}.png`);
  }

  console.log('\n✨ All icons generated successfully!');
  console.log(`📁 Output directory: ${outputDir}`);
}

generateIcons().catch(console.error);
