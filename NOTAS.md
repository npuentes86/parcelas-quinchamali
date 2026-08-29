# Parcelas Santa Rita — Quinchamalí, Ñuble

Sitio de venta directa del loteo (Hijuela Número Dos).
Publicado como Artifact: https://claude.ai/code/artifact/02360787-0e71-4dd3-999f-d151ae509740

## Estructura

```
index.html          fuente del sitio (para GitHub Pages / Netlify)
css/style.css
js/datos.js         ← ÚNICA fuente de verdad: precio, UF, estado de cada lote
js/main.js          plano interactivo, filtros, conmutador UF/pesos, formulario
images/             logo, plano de subdivisión, og-image, fotograma del dron
video/              terreno-dron.mp4 — toma aérea de fondo del hero
build.py            empaqueta todo en dist/sitio.html (autocontenido, para el Artifact)
desde-el-aire.html  galería aérea (página del sitio, no Artifact)
css/galeria.css     estilos propios de esa página
js/galeria.js       superposición del plano sobre el video + lupa
video/aereo-*.mp4   las dos tomas comprimidas, con el color corregido
images/aereas/      los fotogramas de la hoja de contacto
preparar-aereas.sh  regenera ese material desde las tomas originales del dron
dist/sitio.html     archivo publicado
_original/          el zip que trajiste, sin tocar
```

**Para actualizar disponibilidad o precio:** editar `js/datos.js`, correr `python3 build.py`
y volver a publicar `dist/sitio.html`. Los contadores, el plano, las fichas y el
conversor a pesos se recalculan solos — no hay ningún número escrito a mano.

## Datos

- **Precio:** UF 620 por parcela · **superficie:** ≈ 5.000 m² cada una (dato tuyo, 23-08-2026).
  Reemplaza los valores del zip original (UF 950–3.400, lotes de 5.200–20.000 m²).
- **UF al 23 de agosto de 2026:** $40.863,23 → UF 620 ≈ **$25.335.203**.
  Fuente: mindicador.cl (Banco Central). Sube ~$1,32 al día.
- **17 lotes**, numerados del 2 al 18. Vendidos: 6, 13, 15, 17 y 18 → **12 disponibles**.
- Lotes pares al interior, impares hacia el camino (según el plano de subdivisión).

## Datos confirmados por el propietario

- [x] **Teléfono.** Listo: **+56 9 2939 8797** (Horacio Puentes), dato tuyo del 23-08-2026.
      Reemplaza al +1 908 400 8492 del zip original. Va en el WhatsApp, en el botón de llamar y en el pie.
- [x] **Superficies por lote.** Se queda el ≈ 5.000 m² parejo (decisión tuya, 23-08-2026).
      El "cuadro de superficies" del plano no se alcanza a leer en el escaneo; si algún día
      aparece el PDF, se pueden poner los m² reales lote por lote.
- [x] **Lote 9.** Confirmado **disponible** (23-08-2026). El zip se contradecía — la grilla lo
      daba por reservado y la tabla por disponible; queda zanjado.
- [x] **Testimonio Familia Vergara.** Eliminado (23-08-2026). También se había sacado antes la
      frase "13 años vendiendo parcelas". El sitio ya no afirma nada que no puedas respaldar.
- [x] **Agua.** Dato tuyo del 23-08-2026: hay **factibilidad de agua potable**, con **pozo
      profundo o puntera**, a cargo del comprador después de la venta. No se entrega ninguna
      perforación hecha. El sitio decía "pozo profundo con estudio de napa, se entrega el informe
      antes de firmar" (venía del zip). Saqué el estudio y el informe porque no fueron confirmados.
- [x] **Rol de avalúo.** Dato tuyo del 23-08-2026: cada parcela tiene **rol independiente
      autorizado por el SII**. Va en la tarjeta de garantías, que pasó de "Plano inscrito" a
      "Rol propio en el SII" — es el argumento más fuerte de esa sección.
- [x] **Subdivisión.** Dato tuyo del 23-08-2026: **inscrita y aprobada por el SAG**. Va así en
      los dos lugares donde se menciona. Los deslindes se describen solo como *medidos* y
      *topografiados* en terreno — sin el término que pediste eliminar (23-08-2026).
- [x] **Título saneado y escritura en 30 días.** Confirmadas por ti (23-08-2026). Se mantienen
      tal como venían del zip.
- [x] **Ubicación en Google Maps.** Confirmada (23-08-2026): maps.app.goo.gl/z5vMNq7yuHu4amJP6.

Cerrados sin acción, por decisión tuya del 23-08-2026:

- **Número de resolución del SAG** en el sitio: no se agrega.
- **Estudio de napa:** no existe. Por eso el texto del agua habla de *factibilidad*, no de un
  estudio, y deja la perforación a cargo del comprador.

## Galería aérea

`desde-el-aire.html` — **una página del sitio**, servida por GitHub Pages en
https://parcelasquinchamali.cl/desde-el-aire.html

No es un Artifact. Se probó como Artifact primero y se descartó: los Artifacts son privados
salvo que se compartan a mano, así que un enlace desde el sitio público llevaba a un muro de
acceso. Como página del repo no depende de nadie, el navegador cachea el video en vez de
tragarse 10 MB de base64, y queda indexable.

El sitio la enlaza desde la navegación y desde la sección del plano, con enlaces relativos
normales — sin pasar por `datos.js`, para que funcionen aunque el JS falle. `build.py` los
reescribe a la URL absoluta al empaquetar `dist/sitio.html`, porque dentro del Artifact del
sitio un enlace relativo no resuelve.

Los lotes salen de `js/datos.js`, igual que en el resto del sitio: `galeria.js` lee
`window.LOTEO` y de ahí saca cuáles están vendidos y los contadores.

**Para regenerar el material** (no está en el repo el original de 4K):

```
./preparar-aereas.sh ~/Downloads/DJI_0311_00000325.mp4 ~/Downloads/DJI_0320_00000420.mp4
```

Escribe `video/aereo-*.mp4` e `images/aereas/*.jpg`, que **sí** se versionan porque Pages los
sirve tal cual. Son ~7,6 MB en total.

**El plano sobre el video.** `video/plano-sobre-vuelo.mp4` — los lotes van **grabados en la
imagen**, no dibujados en el navegador. Sale de `npuentes86/loteo-overlay` (render3.py, OpenCV):
homografía calzada al primer fotograma y propagada con el movimiento de cámara. La fuente es
DJI_0310 corregido (drone04, 20 s), que es una tercera toma distinta de las dos de la sección
"Las tomas". El original de 22 MB se recomprime a CRF 26 → 5,7 MB, sin pérdida visible en los
rótulos.

Hubo antes una versión que dibujaba el plano en el navegador con SVG proyectado (cámara
estenopeica sobre plano de suelo). **Se descartó: el calce se desviaba a media toma.** Asumía
velocidad constante del dron y solo coincidía en los extremos, que fue justo donde la verifiqué
al principio. Si alguna vez se retoma esa vía, el problema a resolver es ese, no los parámetros.

**Lo que el video quemado cuesta.** No lee `datos.js`: no distingue lotes vendidos y no se
actualiza sola cuando cambia el estado de uno. El color solo separa pares (verde, al poniente)
de impares (naranjo, hacia el camino), y la página remite al catálogo para la disponibilidad.
Cambiar los polígonos exige re-renderizar en la máquina "Escritorio".

**Y una salvedad de fondo.** `equal_area_lots` dibuja las 17 parcelas de igual superficie, pero
las cotas del plano inscrito van de 5.526 a 4.909 m² — un 12% entre el mayor y el menor, y la
brecha crece hacia el norte. Los deslindes del video son la idealización, no las medidas. Está
dicho en el texto de la sección y en el banner del propio video.

**Corrección de color.** Las tomas llevan el grade del set, definido en la máquina
"Escritorio": `eq → selectivecolor → curves`, en ese orden, sin LUT (hornearla a Hald CLUT
falla por espacio de color: la cadena trabaja en YUV). Está literal en `preparar-aereas.sh`.

**Pendiente:** falta `drone10` (37,6 s de la misma zona, en `Escritorio`), que hay que copiar
a mano — no hay ruta de red entre las máquinas.

## Decisiones de esta versión

- **Toma aérea de fondo en el hero** (29-08-2026). Original: `DJI_0311_00000325.mp4`,
  4K 60 fps, 35 s, 209 MB. Se recomprimió a 1080p 30 fps, sin audio, dos pasadas a
  1,6 Mbps → `video/terreno-dron.mp4` (~7 MB), que es lo que cabe en el Artifact
  (tope de 16 MB, y el base64 infla un tercio). Va en bucle, mudo y en autoplay, bajo
  un velo de papel para que el texto siga legible; en pantallas de menos de 700 px y
  con *reduced-motion* queda solo el fotograma `images/hero-dron.jpg`.
  El original de 209 MB **no** está en el proyecto: sigue en `~/Downloads`.
- **El plano es el protagonista.** El zip usaba fotos de Unsplash de paisajes que no son el
  terreno; las saqué. El hero ahora muestra un plano esquemático interactivo (clic en un lote
  → salta a su ficha) y más abajo va el plano de subdivisión real, ampliable.
- **Se quitó la foto del vendedor** (era un retrato de banco de imágenes con el nombre de
  Horacio encima). Quedó un monograma.
- **El formulario ahora funciona sin servidor:** arma el mensaje y abre WhatsApp con la
  consulta ya escrita, con botón de respaldo y opción de enviarlo por correo.
- **Conmutador UF / pesos** en el catálogo, con la UF del día y su fecha a la vista.
- Tipografías Fraunces + Karla; paleta olivo/greda/papel tomada del logotipo. Modo claro y
  oscuro.
- El mapa de OpenStreetMap se reemplazó por un esquema de ubicación en SVG (el Artifact
  bloquea los iframes externos) + enlace a Google Maps.
