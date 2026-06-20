import { pipeline } from 'node:stream/promises';
import Busboy from 'busboy';
import sharp from '../../dist/index.mjs';

export const config = {
  api: {
    bodyParser: false,
  },
};

function slugify(name) {
  return name
    .toString()
    .normalize('NFKD')
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9\-._~]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }

  const bb = new Busboy({ headers: req.headers });
  let fileBuffer = [];
  let filename = 'upload';
  let quality = 80;
  let effort = 4;

  bb.on('file', (fieldname, file, info) => {
    filename = info.filename || filename;
    file.on('data', (data) => {
      fileBuffer.push(data);
    });
  });

  bb.on('field', (name, val) => {
    if (name === 'quality') quality = Number(val) || quality;
    if (name === 'effort') effort = Number(val) || effort;
  });

  bb.on('close', async () => {
    try {
      const input = Buffer.concat(fileBuffer);
      const base = slugify(filename.replace(/\.[^.]+$/, '')) || 'image';
      const outName = `${base}.avif`;

      const avifBuffer = await sharp(input).avif({ quality, effort }).toBuffer();

      res.setHeader('Content-Type', 'image/avif');
      res.setHeader('Content-Disposition', `attachment; filename="${outName}"`);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.statusCode = 200;
      res.end(avifBuffer);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  req.pipe(bb);
}
