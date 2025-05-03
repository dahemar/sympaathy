#!/bin/bash
# Convierte todas las imágenes JPG, JPEG y PNG de ./images a WebP

for img in ./images/*.{jpg,jpeg,png,JPG,JPEG,PNG}; do
  [ -e "$img" ] || continue
  cwebp -q 90 "$img" -o "${img%.*}.webp"
done

echo "Conversión a WebP completada." 