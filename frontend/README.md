# React App - Optimized Performance

## Dev

```bash
npm install
npm run dev -- --host
```

Local: http://localhost:5173

## Performance notes

- Sheets data is cached in `sessionStorage` (5 min) and also persisted in `localStorage` (24h) for fast loads across sessions.
- The app adds `preconnect` / `dns-prefetch` hints for Google Sheets and (when `VITE_R2_BASE` is set) for the R2/Cloudflare origin.
- Key images (landing hero, grid thumbnails, first slide per slider) are warmed in idle via `preload` + async decode.

## Slideshow navigation arrows

- Desktop: minimal textual arrows `<` `>`.
- Mobile: SVG arrows.
