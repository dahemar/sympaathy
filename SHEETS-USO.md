# Uso de Google Sheets para imágenes y vídeos (versión sencilla)

Esta guía breve explica cómo pegar URLs en la hoja de Google Sheets para que las imágenes y vídeos aparezcan en la web.
```markdown
- Qué pegar: copia y pega la URL pública completa del archivo, por ejemplo:
  - https://pub-968c4f8cd5bc4dadb4ec1aa19cf615a2.r2.dev/Screenshot%202026-02-18%20at%2010.58.00.png
  - https://pub-968c4f8cd5bc4dadb4ec1aa19cf615a2.r2.dev/videos/clip.mp4

- Dónde pegar: pega la URL en la celda destinada a la imagen/video en la hoja (una URL por celda).

- Formato: puedes pegar URLs que tengan espacios o caracteres especiales; Google Sheets las maneja tal cual. No hace falta añadir comillas.

- Qué funciona:
  - Imágenes (.jpg, .png, .webp, etc.) se mostrarán automáticamente.
  - Vídeos (.mp4, .webm, .mov, .ogg) se reproducirán usando el reproductor integrado.

- Si pegaste una ruta relativa (por ejemplo `landing/landing-1.jpg`) en lugar de la URL completa, la web intentará combinarla con la dirección base configurada por el desarrollador (`VITE_R2_BASE`). Esto es opcional — para evitar confusiones, lo más sencillo es siempre pegar la URL completa.

- Verificar: tras pegar la URL, espera unos segundos y recarga la página web para ver la imagen o el vídeo.

- Privacidad/Seguridad: usa sólo URLs públicas (compartibles). Si el archivo no carga, pide al desarrollador que compruebe que el archivo es público.

Si quieres, puedo añadir un ejemplo de hoja con columnas ya preparadas para pegar las URLs.
```

## Nueva sección editable por proyecto

Se ha añadido una sección editable que aparece debajo de la zona principal del proyecto (`project detail`). Para cada fila de `LiveDetails` puedes ahora añadir dos columnas nuevas:

- `detail_header` — título para la sección (se renderiza con el estilo del sitio)
- `detail_text` — texto libre; soporta saltos de línea y tokens de enlace (mismos formatos que el resto de campos de texto)

El frontend leerá estas columnas y mostrará la `detail_header` y `detail_text` en la página del proyecto.

### Script para actualizar la hoja desde local (service account)

He añadido `scripts/update_live_details_section.mjs` que permite añadir/actualizar las columnas `detail_header` y `detail_text` en la hoja `LiveDetails` usando una service account.

Requisitos:
- Node.js
- Instalar dependencia `googleapis` (ejecute `npm install googleapis` desde el root del repo)

Uso:

```bash
node scripts/update_live_details_section.mjs /path/to/service-account.json SPREADSHEET_ID data.json
```

- `service-account.json` — la clave JSON de la service account
- `SPREADSHEET_ID` — el id de la hoja de Google (parte en la URL)
- `data.json` — un JSON que contiene un array de objetos con al menos `slug` y opcionalmente `detail_header` y `detail_text`. Ejemplo:

```json
[
  { "slug": "pastoral", "detail_header": "Sobre Pastoral", "detail_text": "Texto editable para pastoral." },
  { "slug": "licitir", "detail_header": "Licitir info", "detail_text": "Más detalles aquí." }
]
```

El script intentará crear las columnas si no existen, y luego hará upsert por `slug`.