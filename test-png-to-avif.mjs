#!/usr/bin/env node

import sharp from './dist/index.mjs';
import fs from 'fs';
import path from 'path';

const inputFile = './test/fixtures/test-pattern.png';
const outputFile = './test/fixtures/output.png-to-avif.avif';

console.log('🖼️  PNG to AVIF Conversion Test');
console.log('================================\n');

try {
  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  console.log(`📂 Input file: ${inputFile}`);
  const inputStats = fs.statSync(inputFile);
  console.log(`   Size: ${(inputStats.size / 1024).toFixed(2)} KB\n`);

  // Get metadata from PNG
  console.log('📊 PNG Metadata:');
  const pngMetadata = await sharp(inputFile).metadata();
  console.log(`   Format: ${pngMetadata.format}`);
  console.log(`   Width: ${pngMetadata.width}px`);
  console.log(`   Height: ${pngMetadata.height}px`);
  console.log(`   Color space: ${pngMetadata.space}`);
  console.log(`   Has alpha: ${pngMetadata.hasAlpha}\n`);

  // Convert PNG to AVIF
  console.log('⏳ Converting PNG to AVIF...');
  const startTime = Date.now();
  
  await sharp(inputFile)
    .avif({ quality: 80, effort: 4 })
    .toFile(outputFile);

  const duration = Date.now() - startTime;
  console.log(`✅ Conversion completed in ${duration}ms\n`);

  // Check output file
  const outputStats = fs.statSync(outputFile);
  console.log(`📂 Output file: ${outputFile}`);
  console.log(`   Size: ${(outputStats.size / 1024).toFixed(2)} KB\n`);

  // Calculate compression ratio
  const compressionRatio = ((1 - outputStats.size / inputStats.size) * 100).toFixed(2);
  console.log(`📈 Compression Statistics:`);
  console.log(`   Size reduction: ${compressionRatio}%`);
  console.log(`   Original size: ${(inputStats.size / 1024).toFixed(2)} KB`);
  console.log(`   Compressed size: ${(outputStats.size / 1024).toFixed(2)} KB\n`);

  // Get metadata from AVIF
  console.log('📊 AVIF Metadata:');
  const avifMetadata = await sharp(outputFile).metadata();
  console.log(`   Format: ${avifMetadata.format}`);
  console.log(`   Width: ${avifMetadata.width}px`);
  console.log(`   Height: ${avifMetadata.height}px`);
  console.log(`   Color space: ${avifMetadata.space}`);
  console.log(`   Has alpha: ${avifMetadata.hasAlpha}\n`);

  console.log('✨ Conversion successful! The AVIF file is ready.');

} catch (error) {
  console.error('❌ Error during conversion:');
  console.error(error.message);
  process.exit(1);
}
