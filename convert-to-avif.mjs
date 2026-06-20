#!/usr/bin/env node

import sharp from './dist/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║      🖼️  Sharp PNG to AVIF Conversion Tool                  ║
╚════════════════════════════════════════════════════════════╝

Uso:
  node convert-to-avif.mjs <input-file> [options]

Opciones:
  --quality <num>    Calidad AVIF (1-100, default: 80)
  --effort <num>     Esfuerzo de compresión (0-9, default: 4)
  --output <file>    Archivo de salida (default: input-name.avif)
  --help            Mostrar esta ayuda

Ejemplos:
  node convert-to-avif.mjs image.png
  node convert-to-avif.mjs image.png --quality 90 --effort 6
  node convert-to-avif.mjs image.png --output resultado.avif
  `);
  process.exit(0);
}

// Parse arguments
let inputFile = args[0];
let outputFile = null;
let quality = 80;
let effort = 4;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--quality' && args[i + 1]) {
    quality = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--effort' && args[i + 1]) {
    effort = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    outputFile = args[i + 1];
    i++;
  }
}

// Validate quality and effort
if (quality < 1 || quality > 100) {
  console.error('❌ Error: Calidad debe estar entre 1 y 100');
  process.exit(1);
}
if (effort < 0 || effort > 9) {
  console.error('❌ Error: Esfuerzo debe estar entre 0 y 9');
  process.exit(1);
}

// Generate output filename if not provided
if (!outputFile) {
  const ext = path.extname(inputFile);
  outputFile = inputFile.replace(new RegExp(ext + '$'), '.avif');
}

// Make paths absolute if relative
if (!path.isAbsolute(inputFile)) {
  inputFile = path.join(process.cwd(), inputFile);
}
if (!path.isAbsolute(outputFile)) {
  outputFile = path.join(process.cwd(), outputFile);
}

console.log('🖼️  PNG to AVIF Conversion Tool');
console.log('================================\n');

try {
  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: Archivo no encontrado: ${inputFile}`);
    process.exit(1);
  }

  console.log(`📂 Archivo de entrada: ${path.relative(process.cwd(), inputFile)}`);
  const inputStats = fs.statSync(inputFile);
  console.log(`   Tamaño: ${(inputStats.size / 1024).toFixed(2)} KB\n`);

  // Get metadata
  console.log('📊 Metadatos de entrada:');
  const inputMetadata = await sharp(inputFile).metadata();
  console.log(`   Formato: ${inputMetadata.format}`);
  console.log(`   Dimensiones: ${inputMetadata.width}x${inputMetadata.height}px`);
  console.log(`   Espacio de color: ${inputMetadata.space}`);
  console.log(`   Tiene transparencia: ${inputMetadata.hasAlpha ? 'Sí' : 'No'}\n`);

  // Convert
  console.log(`⏳ Convirtiendo a AVIF (calidad: ${quality}, esfuerzo: ${effort})...`);
  const startTime = Date.now();
  
  await sharp(inputFile)
    .avif({ quality, effort })
    .toFile(outputFile);

  const duration = Date.now() - startTime;
  console.log(`✅ Conversión completada en ${(duration / 1000).toFixed(2)}s\n`);

  // Output file info
  const outputStats = fs.statSync(outputFile);
  console.log(`📂 Archivo de salida: ${path.relative(process.cwd(), outputFile)}`);
  console.log(`   Tamaño: ${(outputStats.size / 1024).toFixed(2)} KB\n`);

  // Compression stats
  const compressionRatio = ((1 - outputStats.size / inputStats.size) * 100).toFixed(2);
  const savings = (inputStats.size - outputStats.size) / 1024;
  
  console.log(`📈 Estadísticas de compresión:`);
  console.log(`   Reducción: ${compressionRatio}%`);
  console.log(`   Ahorro: ${savings.toFixed(2)} KB`);
  console.log(`   Tamaño original: ${(inputStats.size / 1024).toFixed(2)} KB`);
  console.log(`   Tamaño comprimido: ${(outputStats.size / 1024).toFixed(2)} KB\n`);

  // Output metadata
  console.log('📊 Metadatos de salida:');
  const outputMetadata = await sharp(outputFile).metadata();
  console.log(`   Formato: ${outputMetadata.format}`);
  console.log(`   Dimensiones: ${outputMetadata.width}x${outputMetadata.height}px`);
  console.log(`   Espacio de color: ${outputMetadata.space}`);
  console.log(`   Tiene transparencia: ${outputMetadata.hasAlpha ? 'Sí' : 'No'}\n`);

  console.log('✨ ¡Conversión exitosa!\n');

} catch (error) {
  console.error('❌ Error durante la conversión:');
  console.error(error.message);
  process.exit(1);
}
