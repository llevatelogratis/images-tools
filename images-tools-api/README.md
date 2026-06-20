# Image Tools API

Una API simple para subir imágenes y convertirlas automáticamente a AVIF.

## Características

- Sube un archivo de imagen (`PNG`, `JPG`, `WebP`, `AVIF`, `GIF`)
- Convierte la imagen a AVIF usando la librería `sharp` construida en el repositorio raíz
- Devuelve una URL pública para descargar la imagen convertida
- Expone los archivos convertidos desde `/public`

## Cómo usar

1. Instala dependencias:

```bash
cd images-tools-api
npm install
```

2. Inicia el servidor:

```bash
npm start
```

3. Abre en el navegador:

```text
http://localhost:3000/
```

4. Sube tu imagen y recibirás un JSON con la URL pública.

## API

### POST /upload

Campos:

- `file` (archivo, obligatorio)
- `quality` (número, opcional, default: 80)
- `effort` (número, opcional, default: 4)

Retorna:

```json
{
  "url": "http://localhost:3000/public/archivo.avif",
  "filename": "archivo-123456.avif",
  "size": 12345,
  "width": 1408,
  "height": 768,
  "format": "heif",
  "quality": 80,
  "effort": 4
}
```

## Deploy en Vercel

Opciones rápidas:

- Deploy como función serverless que devuelve el AVIF directamente (sin almacenamiento persistente). En este caso usamos `api/upload.js`.
- Para URLs públicas persistentes se recomienda subir el AVIF a un almacenamiento (S3, Cloud Storage) desde la función y devolver la URL.

Pasos para desplegar rápido en Vercel (sin almacenamiento externo):

1. Desde la carpeta `images-tools-api` añade las dependencias:

```bash
cd images-tools-api
npm install
```

2. Inicia sesión e importa el proyecto en Vercel, o usa la CLI:

```bash
npm i -g vercel
vercel login
vercel --prod
```

3. En Vercel, configura la ruta de despliegue al directorio `images-tools-api` si usas un monorepo.

4. Prueba el endpoint `POST /api/upload` con `curl`:

```bash
curl -X POST https://<your-deployment>/api/upload \
  -F "file=@/ruta/a/tu/imagen.png" \
  -F "quality=80" \
  -F "effort=4" --output imagen.avif
```

Notas:

- Vercel limita el tiempo de ejecución y espacio en disco; para imágenes grandes considera usar almacenamiento externo.
- Si quieres que la imagen sea accesible por URL pública sin redirigir o sin devolver el archivo directamente, puedo implementar subida a S3 dentro de la función.

