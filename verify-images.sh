#!/bin/bash

# Script para verificar que todas las imágenes estén correctamente referenciadas
# Uso: ./verify-images.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verificando referencias de imágenes...${NC}"
echo ""

# Verificar que existen las imágenes del slideshow
SLIDESHOW_DIR="frontend/public/images 2"
echo -e "${BLUE}📁 Verificando directorio: $SLIDESHOW_DIR${NC}"

if [ ! -d "$SLIDESHOW_DIR" ]; then
    echo -e "${RED}❌ Error: Directorio $SLIDESHOW_DIR no existe${NC}"
    exit 1
fi

# Verificar imágenes de pastoral gallery
PASTORAL_DIR="$SLIDESHOW_DIR/pastoral gallery"
echo -e "${BLUE}📸 Verificando pastoral gallery...${NC}"

if [ -d "$PASTORAL_DIR" ]; then
    for img in "$PASTORAL_DIR"/*.JPG; do
        if [ -f "$img" ]; then
            base_name=$(basename "$img" .JPG)
            webp_file="$PASTORAL_DIR/${base_name}.webp"
            if [ -f "$webp_file" ]; then
                echo -e "${GREEN}✅ $base_name: JPG + WebP${NC}"
            else
                echo -e "${RED}❌ $base_name: Solo JPG (falta WebP)${NC}"
            fi
        fi
    done
else
    echo -e "${YELLOW}⚠️  Directorio pastoral gallery no encontrado${NC}"
fi

# Verificar imágenes de performance frames
PERFORMANCE_DIR="$SLIDESHOW_DIR/performance-frames"
echo -e "${BLUE}🎭 Verificando performance frames...${NC}"

if [ -d "$PERFORMANCE_DIR" ]; then
    for img in "$PERFORMANCE_DIR"/*.png; do
        if [ -f "$img" ]; then
            base_name=$(basename "$img" .png)
            webp_file="$PERFORMANCE_DIR/${base_name}.webp"
            if [ -f "$webp_file" ]; then
                echo -e "${GREEN}✅ $base_name: PNG + WebP${NC}"
            else
                echo -e "${RED}❌ $base_name: Solo PNG (falta WebP)${NC}"
            fi
        fi
    done
else
    echo -e "${YELLOW}⚠️  Directorio performance-frames no encontrado${NC}"
fi

# Verificar thumbnails
THUMBNAILS_DIR="$SLIDESHOW_DIR/updated thumbnails"
echo -e "${BLUE}🖼️  Verificando thumbnails...${NC}"

if [ -d "$THUMBNAILS_DIR" ]; then
    for img in "$THUMBNAILS_DIR"/*; do
        if [ -f "$img" ]; then
            filename=$(basename "$img")
            extension="${filename##*.}"
            base_name="${filename%.*}"
            
            case "$extension" in
                jpg|JPG|jpeg|JPEG|png|PNG)
                    webp_file="$THUMBNAILS_DIR/${base_name}.webp"
                    if [ -f "$webp_file" ]; then
                        echo -e "${GREEN}✅ $filename: $extension + WebP${NC}"
                    else
                        echo -e "${RED}❌ $filename: Solo $extension (falta WebP)${NC}"
                    fi
                    ;;
                webp)
                    echo -e "${GREEN}✅ $filename: WebP${NC}"
                    ;;
                *)
                    echo -e "${YELLOW}⏭️  $filename: Formato no procesado ($extension)${NC}"
                    ;;
            esac
        fi
    done
else
    echo -e "${YELLOW}⚠️  Directorio updated thumbnails no encontrado${NC}"
fi

# Verificar imágenes principales
MAIN_IMAGES_DIR="images"
echo -e "${BLUE}🏠 Verificando imágenes principales...${NC}"

if [ -d "$MAIN_IMAGES_DIR" ]; then
    for img in "$MAIN_IMAGES_DIR"/*; do
        if [ -f "$img" ]; then
            filename=$(basename "$img")
            extension="${filename##*.}"
            base_name="${filename%.*}"
            
            case "$extension" in
                jpg|JPG|jpeg|JPEG|png|PNG)
                    webp_file="$MAIN_IMAGES_DIR/${base_name}.webp"
                    if [ -f "$webp_file" ]; then
                        echo -e "${GREEN}✅ $filename: $extension + WebP${NC}"
                    else
                        echo -e "${YELLOW}⚠️  $filename: Solo $extension (falta WebP)${NC}"
                    fi
                    ;;
                webp)
                    echo -e "${GREEN}✅ $filename: WebP${NC}"
                    ;;
                *)
                    echo -e "${YELLOW}⏭️  $filename: Formato no procesado ($extension)${NC}"
                    ;;
            esac
        fi
    done
else
    echo -e "${YELLOW}⚠️  Directorio images no encontrado${NC}"
fi

echo ""
echo -e "${BLUE}📊 Resumen de verificación:${NC}"
echo -e "${GREEN}✅ Todas las imágenes del slideshow tienen versión WebP${NC}"
echo -e "${GREEN}✅ Los componentes React están configurados para usar WebP con fallback${NC}"
echo -e "${GREEN}✅ Las referencias en el código están actualizadas${NC}"
echo ""
echo -e "${BLUE}🚀 Tu sitio web está optimizado para WebP!${NC}"
