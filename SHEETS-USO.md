# Uso de Google Sheets para imágenes y vídeos (versión sencilla)

Esta guía breve explica cómo pegar URLs en la hoja de Google Sheets para que las imágenes y vídeos aparezcan en la web.

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