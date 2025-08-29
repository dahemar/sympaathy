#!/bin/bash

# Script para convertir imágenes a WebP manteniendo las originales
# Uso: ./convert-to-webp.sh [directorio]

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}Script de conversión a WebP${NC}"
    echo "Convierte todas las imágenes a formato WebP manteniendo las originales"
    echo ""
    echo "Uso: $0 [directorio]"
    echo ""
    echo "Opciones:"
    echo "  -h, --help     Mostrar esta ayuda"
    echo "  -q, --quality  Calidad WebP (1-100, default: 80)"
    echo ""
    echo "Ejemplos:"
    echo "  $0                    # Convertir imágenes en el directorio actual"
    echo "  $0 images/            # Convertir imágenes en el directorio 'images'"
    echo "  $0 -q 90 images/     # Convertir con calidad 90"
    echo ""
}

# Variables por defecto
QUALITY=80
TARGET_DIR="."

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -q|--quality)
            QUALITY="$2"
            shift 2
            ;;
        -*)
            echo -e "${RED}Error: Opción desconocida $1${NC}"
            show_help
            exit 1
            ;;
        *)
            TARGET_DIR="$1"
            shift
            ;;
    esac
done

# Validar calidad
if ! [[ "$QUALITY" =~ ^[0-9]+$ ]] || [ "$QUALITY" -lt 1 ] || [ "$QUALITY" -gt 100 ]; then
    echo -e "${RED}Error: La calidad debe ser un número entre 1 y 100${NC}"
    exit 1
fi

# Verificar que el directorio existe
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}Error: El directorio '$TARGET_DIR' no existe${NC}"
    exit 1
fi

# Verificar que las herramientas están instaladas
if ! command -v cwebp &> /dev/null; then
    echo -e "${RED}Error: 'cwebp' no está instalado. Instala WebP tools primero:${NC}"
    echo "  brew install webp"
    exit 1
fi

echo -e "${BLUE}🚀 Iniciando conversión a WebP...${NC}"
echo -e "${BLUE}Directorio: ${YELLOW}$TARGET_DIR${NC}"
echo -e "${BLUE}Calidad: ${YELLOW}$QUALITY${NC}"
echo ""

# Contadores
TOTAL_IMAGES=0
CONVERTED=0
SKIPPED=0
ERRORS=0

# Función para convertir una imagen
convert_image() {
    local file="$1"
    local dir="$2"
    local filename=$(basename "$file")
    local name_without_ext="${filename%.*}"
    local extension="${filename##*.}"
    local webp_path="$dir/${name_without_ext}.webp"
    
    # Verificar si ya existe el WebP
    if [ -f "$webp_path" ]; then
        echo -e "${YELLOW}⏭️  Saltando: $filename (WebP ya existe)${NC}"
        ((SKIPPED++))
        return
    fi
    
    # Solo procesar formatos de imagen soportados
    case "${extension}" in
        jpg|JPG|jpeg|JPEG|png|PNG|tiff|TIFF|tif|TIF|bmp|BMP)
            echo -e "${BLUE}🔄 Convirtiendo: $filename${NC}"
            
            if cwebp -q "$QUALITY" "$file" -o "$webp_path" 2>/dev/null; then
                echo -e "${GREEN}✅ Convertido: $filename → ${name_without_ext}.webp${NC}"
                ((CONVERTED++))
            else
                echo -e "${RED}❌ Error convirtiendo: $filename${NC}"
                ((ERRORS++))
                # Limpiar archivo corrupto si existe
                [ -f "$webp_path" ] && rm "$webp_path"
            fi
            ;;
        *)
            echo -e "${YELLOW}⏭️  Saltando: $filename (formato no soportado: $extension)${NC}"
            ((SKIPPED++))
            ;;
    esac
}

# Función para procesar directorio recursivamente
process_directory() {
    local dir="$1"
    
    # Procesar archivos en el directorio actual
    for file in "$dir"/*; do
        if [ -f "$file" ]; then
            convert_image "$file" "$dir"
            ((TOTAL_IMAGES++))
        fi
    done
    
    # Procesar subdirectorios
    for subdir in "$dir"/*/; do
        if [ -d "$subdir" ]; then
            echo -e "${BLUE}📁 Procesando subdirectorio: $subdir${NC}"
            process_directory "$subdir"
        fi
    done
}

# Iniciar procesamiento
echo -e "${BLUE}🔍 Buscando imágenes en: $TARGET_DIR${NC}"
echo ""

process_directory "$TARGET_DIR"

# Resumen final
echo ""
echo -e "${BLUE}📊 Resumen de conversión:${NC}"
echo -e "${GREEN}✅ Convertidas: $CONVERTED${NC}"
echo -e "${YELLOW}⏭️  Saltadas: $SKIPPED${NC}"
echo -e "${RED}❌ Errores: $ERRORS${NC}"
echo -e "${BLUE}📁 Total procesadas: $TOTAL_IMAGES${NC}"

if [ $CONVERTED -gt 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ¡Conversión completada!${NC}"
    echo -e "${BLUE}💡 Las imágenes originales se mantuvieron intactas${NC}"
    echo -e "${BLUE}🚀 Los archivos WebP están listos para usar${NC}"
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Algunas imágenes no se pudieron convertir${NC}"
    echo -e "${YELLOW}   Revisa los errores arriba${NC}"
fi
