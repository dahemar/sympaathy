# 🚀 Despliegue en Vercel

Este proyecto está configurado para desplegarse automáticamente en Vercel desde GitHub.

## 📋 Configuración Inicial

### 1. Conectar GitHub con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub
2. Haz clic en **"Add New Project"** o **"Import Project"**
3. Selecciona el repositorio `sympaathy` de tu cuenta de GitHub
4. **Configuración importante:**
   - **Framework Preset**: Vite (se detecta automáticamente)
   - **Root Directory**: `frontend` ⚠️ **IMPORTANTE**
   - **Build Command**: `npm run build` (se detecta automáticamente)
   - **Output Directory**: `dist` (se detecta automáticamente)
   - **Install Command**: `npm install` (se detecta automáticamente)

### 2. Variables de Entorno (si las necesitas)

Si tu proyecto necesita variables de entorno, agrégalas en:
- **Settings** → **Environment Variables**

### 3. Dominio Personalizado (opcional)

Si quieres usar un dominio personalizado:
1. Ve a **Settings** → **Domains**
2. Agrega tu dominio (ej: `sympaathy.com`)
3. Sigue las instrucciones de DNS que Vercel te proporciona

## 🔄 Despliegue Automático

Una vez configurado:
- ✅ Cada push a `main` desplegará automáticamente
- ✅ Cada pull request creará un preview deployment
- ✅ Los deployments se pueden ver en el dashboard de Vercel

## 📁 Estructura del Proyecto

```
sympaathy/
├── frontend/          ← Proyecto React/Vite (Root Directory en Vercel)
│   ├── vercel.json    ← Configuración de Vercel
│   ├── package.json
│   ├── vite.config.js
│   └── ...
└── ...
```

## ⚙️ Configuración Actual

El archivo `frontend/vercel.json` contiene:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite
- **Rewrites**: Todas las rutas redirigen a `index.html` (para HashRouter)

## 🐛 Solución de Problemas

### El build falla
- Verifica que el **Root Directory** esté configurado como `frontend`
- Revisa los logs de build en Vercel para ver errores específicos

### Las rutas no funcionan
- El `vercel.json` ya está configurado con rewrites para HashRouter
- Si usas BrowserRouter, necesitarías cambiar la configuración

### Las imágenes no cargan
- Asegúrate de que las imágenes estén en `frontend/public/`
- Verifica que las rutas en el código sean relativas (ej: `/images/...`)

## 📚 Recursos

- [Documentación de Vercel](https://vercel.com/docs)
- [Vite en Vercel](https://vercel.com/docs/frameworks/vite)

