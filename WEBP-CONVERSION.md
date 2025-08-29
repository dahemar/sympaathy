# 🚀 Sistema de Conversión WebP

Este sistema convierte automáticamente tus imágenes a formato WebP manteniendo las originales como fallback.

## ✨ Características

- **WebP con fallback**: Usa `<picture>` element para máxima compatibilidad
- **Conversión automática**: Script que convierte todas las imágenes de una vez
- **Preserva originales**: Las imágenes originales se mantienen intactas
- **Calidad configurable**: Ajusta la calidad WebP (1-100)
- **Recursivo**: Procesa subdirectorios automáticamente
- **Inteligente**: No reconvierte archivos que ya existen

## 🛠️ Instalación

```bash
# Instalar WebP tools (solo una vez)
brew install webp

# Hacer ejecutables los scripts
chmod +x convert-to-webp.sh webp-convert
```

## 🚀 Uso Rápido

### Comando Simple
```bash
# Convertir imágenes en directorio actual
./webp-convert

# Convertir en directorio específico
./webp-convert images/

# Convertir con calidad específica
./webp-convert images/ 95
```

### Script Completo
```bash
# Ver ayuda
./convert-to-webp.sh -h

# Convertir con opciones
./convert-to-webp.sh -q 90 images/
```

## 📁 Estructura de Archivos

```
tu-proyecto/
├── imagen1.jpg          (original)
├── imagen1.webp         (WebP optimizado)
├── imagen2.png          (original)
├── imagen2.webp         (WebP optimizado)
└── ...
```

## 🎯 Formatos Soportados

- **Entrada**: JPG, JPEG, PNG, TIFF, TIF, BMP
- **Salida**: WebP
- **Calidad**: 1-100 (default: 80)

## 🔧 Configuración

### Calidad WebP
- **80 (default)**: Buen balance calidad/tamaño
- **90-95**: Alta calidad, archivos más grandes
- **60-70**: Menor calidad, archivos más pequeños

### Directorios
- **Recursivo**: Procesa subdirectorios automáticamente
- **Múltiples**: Puedes especificar varios directorios

## 📱 Beneficios para iPhone Safari

- **WebP**: 30-50% más rápido (si está disponible)
- **Fallback**: Siempre funciona con imágenes originales
- **Precarga**: Transiciones sin delays
- **Cache**: Mejor rendimiento en navegación

## 🚨 Solución de Problemas

### Error: "cwebp no está instalado"
```bash
brew install webp
```

### Error: "Directorio no existe"
Verifica la ruta exacta del directorio

### Imágenes no se convierten
- Verifica que sean formatos soportados
- Asegúrate de tener permisos de escritura
- Revisa el espacio en disco

## 📊 Ejemplo de Uso

```bash
# Convertir todas las imágenes del proyecto
./webp-convert

# Convertir solo las imágenes del slideshow
./webp-convert "frontend/public/images 2/"

# Convertir con máxima calidad
./webp-convert images/ 100
```

## 🎉 Resultado

Después de la conversión:
- ✅ Todas las imágenes tienen versión WebP
- ✅ Las originales se mantienen intactas
- ✅ Tu sitio web es más rápido
- ✅ Compatibilidad total con todos los navegadores

## 🔄 Actualización

Para convertir nuevas imágenes:
```bash
# Solo convierte las que no tienen WebP
./webp-convert

# Fuerza reconversión (reemplaza WebP existentes)
rm *.webp && ./webp-convert
```

---

**💡 Tip**: Usa calidad 80-85 para la mayoría de casos. Solo usa 90+ para imágenes críticas donde la calidad es esencial.
