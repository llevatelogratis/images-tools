import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from '../dist/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const publicDir = path.join(__dirname, 'public');
const uploadDir = path.join(__dirname, 'uploads');

fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  fileFilter: (req, file, callback) => {
    const accepted = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'];
    callback(null, accepted.includes(file.mimetype));
  }
});

app.use('/public', express.static(publicDir));

app.get('/', (req, res) => {
  res.send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Image Converter API</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 760px; margin: 40px auto; line-height: 1.6; }
    h1 { color: #222; }
    label { display: block; margin: 16px 0 6px; }
    input, button { width: 100%; padding: 10px; font-size: 1rem; }
    button { margin-top: 16px; cursor: pointer; }
    .note { margin-top: 24px; padding: 16px; border: 1px solid #ddd; background: #f8f8f8; }
  </style>
</head>
<body>
  <h1>Convertir PNG a AVIF</h1>
  <p>Sube una imagen y el servidor la convertirá automáticamente a AVIF. La imagen convertida se publica en <code>/public</code>.</p>
  <form action="/upload" method="post" enctype="multipart/form-data">
    <label for="file">Selecciona un archivo PNG, JPG, WebP o GIF</label>
    <input type="file" id="file" name="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" required>

    <label for="quality">Calidad AVIF (1-100)</label>
    <input type="number" id="quality" name="quality" min="1" max="100" value="80">

    <label for="effort">Esfuerzo de compresión (0-9)</label>
    <input type="number" id="effort" name="effort" min="0" max="9" value="4">

    <button type="submit">Convertir y obtener URL pública</button>
  </form>
  <div class="note">
    <strong>Uso de la API:</strong>
    <pre>POST /upload</pre>
    <p>Formulario con campo <code>file</code>, opcional <code>quality</code> y <code>effort</code>.</p>
  </div>
  <div class="note">
    <strong>Ejemplo CURL:</strong>
    <pre>curl -X POST http://localhost:3000/upload \
  -F "file=@/ruta/a/tu/imagen.png" \
  -F "quality=80" \
  -F "effort=4"</pre>
    <p>Devuelve JSON con la URL pública del archivo convertido.</p>
  </div>
</body>
</html>`);
});

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Se requiere un archivo válido.' });
  }

  const originalName = req.file.originalname;
  const inputPath = req.file.path;
  const quality = Number(req.body.quality) || 80;
  const effort = Number(req.body.effort) || 4;
  const baseName = path.basename(originalName, path.extname(originalName))
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '') || 'image';
  const outputName = `${baseName}-${Date.now()}.avif`;
  const outputPath = path.join(publicDir, outputName);

  try {
    await sharp(inputPath)
      .avif({ quality, effort })
      .toFile(outputPath);

    fs.unlinkSync(inputPath);
    const metadata = await sharp(outputPath).metadata();
    const stats = fs.statSync(outputPath);

    const url = `${req.protocol}://${req.get('host')}/public/${encodeURIComponent(outputName)}`;
    const payload = {
      url,
      filename: outputName,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      quality,
      effort
    };

    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Conversión completada</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 760px; margin: 40px auto; line-height: 1.6; }
    a.button { display: inline-block; padding: 12px 18px; background: #2774e6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
    .meta { margin-top: 24px; padding: 16px; background: #f4f4f4; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>Conversión completada</h1>
  <p>Tu archivo se ha convertido correctamente a AVIF.</p>
  <p><a class="button" href="${url}" target="_blank">Descargar imagen AVIF</a></p>
  <div class="meta">
    <p><strong>Archivo:</strong> ${outputName}</p>
    <p><strong>URL pública:</strong> <a href="${url}" target="_blank">${url}</a></p>
    <p><strong>Dimensiones:</strong> ${metadata.width}x${metadata.height}</p>
    <p><strong>Tamaño:</strong> ${(stats.size / 1024).toFixed(2)} KB</p>
    <p><strong>Calidad:</strong> ${quality}</p>
    <p><strong>Esfuerzo:</strong> ${effort}</p>
  </div>
  <p><a href="/">Volver al formulario</a></p>
</body>
</html>`);
    }

    return res.json(payload);
  } catch (error) {
    fs.unlinkSync(inputPath);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Image converter API running at http://localhost:${port}`);
  console.log(`Public files: http://localhost:${port}/public/`);
});
