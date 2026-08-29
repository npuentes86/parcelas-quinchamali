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
