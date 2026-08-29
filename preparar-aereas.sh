#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# Regenera el material de desde-el-aire.html a partir de las
# tomas originales del dron, que no viven en el repo.
#
#   ./preparar-aereas.sh DJI_0311_00000325.mp4 DJI_0320_00000420.mp4
#
# Escribe video/aereo-*.mp4 e images/aereas/*.jpg, que SÍ se
# versionan: GitHub Pages los sirve tal cual.
# ═══════════════════════════════════════════════════════════
set -euo pipefail

LARGO="${1:?falta la toma larga (DJI_0311_00000325.mp4)}"
CORTO="${2:?falta la toma corta (DJI_0320_00000420.mp4)}"
RAIZ="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$RAIZ/video" "$RAIZ/images/aereas"

# Corrección de color del set, definida en la máquina "Escritorio".
# El ORDEN importa: eq → selectivecolor → curves. Cambiarlo da otro
# resultado. Los valores de selectivecolor son CMYK en rango -1..1,
# separados por espacios, por rango de color. No pasar por LUT: hornear
# la cadena a Hald CLUT falla por espacio de color (la cadena trabaja en
# YUV y haldclut fuerza ida y vuelta a RGB).
GRADE="eq=contrast=1.10:saturation=1.26,\
selectivecolor=greens=0.10 -0.22 0.16 0:yellows=0.06 -0.10 0.10 0:\
cyans=0.20 0.02 -0.20 0:blues=0.16 0.02 -0.24 0:whites=0.05 0 -0.08 0,\
curves=all='0/0 0.22/0.19 0.78/0.81 1/1'"

# El material DJI viene full range (yuvj420p). Salimos a yuv420p porque
# esto va a un <video> en el navegador, que espera rango limitado; la
# conversión de rango la inserta ffmpeg en el escalado.
comun=(-map 0:v:0 -an -sn -c:v libx264 -preset veryslow -profile:v high
       -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709
       -colorspace bt709 -movflags +faststart)

echo "→ toma larga"
ffmpeg -v error -y -i "$LARGO" "${comun[@]}" \
  -vf "scale=1280:720:flags=lanczos,fps=30,$GRADE" -b:v 1300k "$RAIZ/video/aereo-largo.mp4"

echo "→ toma corta"
ffmpeg -v error -y -i "$CORTO" "${comun[@]}" \
  -vf "scale=1280:720:flags=lanczos,fps=30,$GRADE" -b:v 1400k "$RAIZ/video/aereo-corto.mp4"

# Los segundos de acá son los que rotula la hoja de contacto en
# desde-el-aire.html: si cambias uno, cambia el otro.
echo "→ fotogramas"
for t in 1 6 11 16 21 26 31 34; do
  ffmpeg -v error -y -ss "$t" -i "$LARGO" -frames:v 1 \
    -vf "scale=1200:-1:flags=lanczos,$GRADE" -q:v 6 \
    "$RAIZ/images/aereas/largo-$(printf %02d "$t").jpg"
done
i=0
for t in 0.3 2 3.9; do
  ffmpeg -v error -y -ss "$t" -i "$CORTO" -frames:v 1 \
    -vf "scale=1200:-1:flags=lanczos,$GRADE" -q:v 6 \
    "$RAIZ/images/aereas/corto-$(printf %02d "$i").jpg"
  i=$((i + 2))
done

echo
echo "✓ video/aereo-*.mp4 · images/aereas/*.jpg"
du -ch "$RAIZ/video/aereo-"*.mp4 "$RAIZ/images/aereas/"*.jpg | tail -1
