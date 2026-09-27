# SEO — Parcelas Santa Rita

Traspaso escrito el 2026-09-26, después de auditar invertedgearacademy.com.
Ese sitio se armó de forma parecida a este (una página partida en varias,
publicada desde un repo, con el `<head>` generado por un script), así que varios
de los problemas que se encontraron allá valía la pena buscarlos acá.

**Estado al 2026-09-26: hecho todo lo que no necesitaba a nadie.** Puntos 1 a 6
y el 9 están aplicados y en producción. Quedan el 7 (Search Console, necesita a
Nelson con sesión en Google) y el 8 (peso del video, esperar datos del 7).

Este archivo dice tres cosas: **qué de esa auditoría no aplica acá** (para no
perder tiempo buscándolo), **en qué estado está este sitio medido de verdad**, y
**qué falta, por orden de impacto**. Complementa a `NOTAS.md`, que sigue siendo
el documento del proyecto.

---

## Lo que NO aplica acá

Cuatro de los hallazgos más graves de la academia no existen en este sitio. Se
verificaron uno por uno el 2026-09-26.

**El canonical que se reescribía solo.** Allá diez páginas declaraban ser la
home después de hidratar, porque un hook de React recibía la ruta como parámetro
opcional. Acá no hay React ni hidratación: `index.html`, `desde-el-aire.html` y
`privacidad.html` son HTML estático. Lo que sirve el servidor es lo que lee
Google.

**La hidratación que botaba el prerender.** Mismo motivo. No hay prerender que
botar.

**Páginas huérfanas.** Las tres páginas se enlazan entre sí en las tres
direcciones. No hay nada colgando del sitemap sin enlaces internos, entre otras
cosas porque tampoco hay sitemap.

**Consolidar host y protocolo.** GitHub Pages ya lo hace solo y está confirmado:

```
http://parcelasquinchamali.cl/           301 -> https://parcelasquinchamali.cl/
https://www.parcelasquinchamali.cl/      301 -> https://parcelasquinchamali.cl/
https://npuentes86.github.io/parcelas-quinchamali/  301 -> el dominio propio
```

Una sola copia rastreable del sitio, sin tocar nada. En la academia esto costó
tres cambios en Cloudflare.

**Cacheo de assets.** Allá se resolvió con un archivo `_headers`. Acá **no se
puede**: GitHub Pages no lo soporta y sirve todo con `max-age=600`, sin forma de
cambiarlo. No es un pendiente, es un techo del hosting. Si algún día el peso de
los videos importa lo suficiente, ese es el motivo para mover el hosting, no
algo que arreglar en el repo.

---

## Estado medido el 2026-09-26

| Página | Título | Descripción | Canonical | JSON-LD | Palabras |
|---|---|---|---|---|---|
| `index.html` | 19 car. | 155 car. | falta | 0 | 934 |
| `desde-el-aire.html` | 57 car. | 113 car. | falta | 0 | 474 |
| `privacidad.html` | 32 car. | 96 car. | falta | 0 | 517 |

```
robots.txt    404
sitemap.xml   404
TXT del dominio: ninguno, o sea Search Console no está verificado
media en el repo: 21.1 MB, casi todo video (4 archivos mp4)
```

Lo que sí está bien y conviene no romper: las descripciones están bien escritas
y dentro de largo, las tres páginas se enlazan, las imágenes casi todas llevan
`alt`, y la galería aérea usa `loading="lazy"` en 11 de 13 imágenes.

---

## Pendientes, por orden de impacto

### 1. ~~El título de la home no dice dónde queda~~ HECHO

Es el peor detalle del sitio y el más barato de arreglar.

```
actual:    Parcelas Santa Rita                    (19 caracteres)
```

Diecinueve caracteres, ninguna geografía, ningún término que alguien tipee. La
`<meta description>` de esa misma página sí lo hace bien: nombra Quinchamalí,
Chillán y Ñuble. El título no. Quien busca no busca "Parcelas Santa Rita",
busca "parcelas en Quinchamalí" o "parcelas de agrado Chillán".

```
propuesto: Parcelas de agrado en Quinchamalí, Chillán | Santa Rita   (56)
```

El `<h1>` ya dice "Parcelas de agrado en Quinchamalí", así que el título solo
tiene que ponerse al día con la página.

**Ojo con `build.py`:** el título es lo único del `<head>` que sí viaja al
Artifact (ver más abajo). Cambiarlo cambia también el nombre del Artifact.

### 2. ~~No hay `robots.txt` ni `sitemap.xml`~~ HECHO

Los dos responden 404. Con tres páginas el sitemap no descubre nada que un
rastreador no encuentre solo, pero es lo que se le entrega a Search Console para
que informe cobertura, y sin él no hay nada que enviar.

**Corrección respecto de lo que decía antes este archivo:** el sitemap lleva
**dos** páginas, no tres. `privacidad.html` ya declara
`<meta name="robots" content="noindex, follow">`, así que meterla sería pedirle
a Google que indexe algo que la propia página le dice que no indexe.

`robots.txt` se escribió a mano. `sitemap.xml` lo genera `seo.py` con la fecha
del día. Los dos van en la raíz y se publican: no van en la lista de exclusión
de `_config.yml` porque son parte del sitio.

### 3. ~~Falta el `canonical` en las tres páginas~~ HECHO

Ninguna lo declara. El hosting ya resuelve las variantes de host, así que el
riesgo real es bajo, pero es una línea por página y cierra el tema:

```html
<link rel="canonical" href="https://parcelasquinchamali.cl/index.html">
```

Decidir si la home canoniza a `/` o a `/index.html`. GitHub Pages sirve las dos.
Conviene `/` y que `index.html` apunte ahí.

### 4. ~~Cero datos estructurados~~ HECHO

Ninguna página tiene JSON-LD. Para un loteo con precio, superficie y ubicación
conocidos esto es dejar información sobre la mesa. Lo que corresponde:

- Un bloque por el negocio, con `Organization` o `RealEstateAgent`, el teléfono
  de Horacio y `areaServed` Quinchamalí, Chillán y Ñuble.
- Un `Place` con `geo` del loteo. **Geocodificar, no estimar.** En la academia
  la primera coordenada estimada quedó a kilómetro y medio de la dirección real.
- `Product` con `Offer` para las parcelas: `price` en UF, `priceCurrency`,
  `availability`, y la superficie. Los datos ya están en `js/datos.js`, que
  `NOTAS.md` declara como la única fuente de verdad. Generar el JSON-LD desde
  ahí y no a mano, o los dos se van a desincronizar en la primera venta.

**Va en el `<head>`, no en el `<body>`.** Motivo en la sección de restricciones.

Hecho con `seo.py`, que lee `js/datos.js` y reescribe el bloque entre las marcas
`<!-- seo:jsonld -->` de `index.html`. Genera `RealEstateAgent`, `Place` con las
coordenadas del enlace de Maps que ya usa el sitio, y `Product` con
`AggregateOffer`. El precio va en **CLF**, que es el código ISO 4217 de la UF:
poner "UF" ahí sería inválido y Google descartaría la oferta completa. Correrlo
después de cada venta, o el conteo de disponibles se queda viejo.

### 5. ~~`og:image` apunta a github.io, no al dominio~~ HECHO

```
index.html:  https://npuentes86.github.io/parcelas-quinchamali/images/og-image.jpg
```

`desde-el-aire.html` sí usa `parcelasquinchamali.cl`. Las dos deberían usar el
dominio propio. Es el mismo error que tenía la academia entre `www` y el apex:
no rompe nada visible, pero reparte señales entre dos hosts.

### 6. ~~El atributo `lang` no coincide entre páginas~~ HECHO

`index.html` y `privacidad.html` declaran `es-CL`. `desde-el-aire.html` declara
`es`. Dejar `es-CL` en las tres.

### 7. Search Console sin verificar

El dominio no tiene **ningún** registro TXT, así que no está verificado. Es
exactamente el mismo hueco que tenía la academia: sin esto no hay datos de
consultas, ni informe de cobertura, ni forma de saber si las páginas están
indexadas o solamente rastreadas.

Verificar por **Dominio** (TXT en Cloudflare, que ya administra la zona aunque
esté en modo DNS only), no por prefijo de URL. Después enviar el sitemap del
punto 2.

Acá no hay GA4 que enlazar, así que el paso termina ahí.

### 8. Peso de los videos

21.1 MB de media, casi todo video:

```
  7.01 MB  video/terreno-dron.mp4        (fondo del hero)
  5.82 MB  video/aereo-largo.mp4
  5.68 MB  video/plano-sobre-vuelo.mp4
  0.61 MB  video/aereo-corto.mp4
```

El del hero es el que importa: carga en la primera pantalla de la home. Los
otros tres viven en la galería y pueden esperar.

No es urgente como lo era en la academia, donde la página de conversión
precargaba 25 MB de fotos. Acá es video, se transmite progresivamente y no
bloquea el render de la misma forma. Pero con `max-age=600` y sin poder
cambiarlo, cada visita que vuelve a los diez minutos lo baja de nuevo.

Si se toca: bajar el bitrate del hero antes que la resolución, y considerar un
póster en JPG para que la primera pintura no espere al video. `preparar-aereas.sh`
ya hace trabajo de este tipo y es el lugar natural para agregarlo.

### 9. ~~Detalles menores~~ ERAN FALSOS POSITIVOS

Los dos que había anotado resultaron no ser problemas al mirarlos de cerca:

- La imagen sin `alt` era el `<img>` de 1x1 del pixel de Meta, oculto con
  `display:none`. Se le puso `alt=""`, que es lo correcto para algo decorativo,
  y con eso los validadores se callan.
- La imagen sin `width` era `#lupa-img`, el overlay de la lupa, que arranca con
  `src=""` y recibe la imagen desde JavaScript. Su tamaño lo pone el CSS.
  Ponerle `width` fijo sería un error, no un arreglo.

---

## Restricciones del build que hay que conocer antes de tocar el `<head>`

**`build.py` reconstruye el `<head>` desde cero.** El paso 3 se queda con tres
cosas y descarta todo lo demás:

```python
titulo  = <title>
fuentes = los <link> de Google Fonts
estilo  = el <style>
salida  = titulo + fuentes + estilo + cuerpo
```

Eso significa que **la descripción, las etiquetas og, el canonical y el JSON-LD
que se agreguen a `index.html` NO aparecen en `dist/sitio.html`**. No es un bug:
es el mismo mecanismo por el que el beacon de analítica y el pixel de Meta se
caen solos del Artifact, y es lo correcto.

Dos consecuencias prácticas:

1. **No se puede verificar el SEO mirando `dist/sitio.html`.** Hay que mirar
   `index.html` o el sitio publicado. Más de una vez se va a ver un `<head>`
   vacío ahí y va a parecer que algo se rompió.
2. **El JSON-LD va en el `<head>`, nunca en el `<body>`.** Si va en el cuerpo
   sobrevive al empaquetado y termina dentro del Artifact, declarando un negocio
   real y una oferta real desde una página de claude.ai. En el `<head>` se cae
   solo, que es lo que se quiere.

**`_config.yml` tiene lista de exclusión y hay que mantenerla.** GitHub Pages
publicaba todo el repo hasta que se agregó. Cualquier archivo de trabajo nuevo
que no sea el sitio va en esa lista o queda descargable desde el dominio. Este
archivo ya está agregado.

**Al probar después de un deploy, forzar recarga.** Pages sirve con
`max-age=600`, así que el navegador sigue corriendo el JS viejo. El indicio es
`performance.getEntriesByType('resource')` con `transferSize: 0`. Y la API de
builds contesta `"status":"building"` desde caché mucho después de terminar:
confiar en `updated_at` o simplemente pedir el archivo con curl.

---

## Cómo volver a medir

Todo lo de arriba se vuelve a comprobar con esto:

```bash
B=https://parcelasquinchamali.cl

# hosts y archivos base
for u in "$B/" "http://parcelasquinchamali.cl/" "https://www.parcelasquinchamali.cl/" \
         "$B/robots.txt" "$B/sitemap.xml"; do
  printf '%-46s ' "$u"; curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' "$u"
done

# head de cada página
for f in index.html desde-el-aire.html privacidad.html; do
  echo "== $f"
  curl -s "$B/$f" | grep -oE '<title>[^<]*</title>|rel="canonical"[^>]*|application/ld\+json'
done

# verificación de Search Console
curl -s "https://cloudflare-dns.com/dns-query?name=parcelasquinchamali.cl&type=TXT" \
  -H 'accept: application/dns-json'
```

---

## Regenerar

```bash
python3 seo.py     # sitemap.xml + el JSON-LD de index.html, desde js/datos.js
python3 build.py   # dist/sitio.html para el Artifact (no lleva nada de lo de arriba)
```

`seo.py` hay que correrlo cada vez que cambie `js/datos.js`, típicamente cuando
se vende una parcela. No hay build en GitHub Pages que lo haga solo: el
resultado se commitea.

## Orden sugerido

1. Título de la home (punto 1). Un cambio, el de mayor efecto.
2. `robots.txt` y `sitemap.xml` (punto 2), porque el punto 7 los necesita.
3. Verificar Search Console y enviar el sitemap (punto 7). A partir de acá hay
   datos en vez de suposiciones.
4. Canonical, `lang` y `og:image` (puntos 3, 5 y 6). Media hora, todo junto.
5. JSON-LD generado desde `js/datos.js` (punto 4).
6. Video del hero (punto 8), solo si los datos del punto 3 muestran que importa.

Los puntos 1 a 4 se pueden hacer en una sola sesión sin necesitar nada de nadie.
El punto 7 necesita a Nelson con sesión iniciada en Google.

Ver `NOTAS.md` para el resto del proyecto: medición de visitas, el Worker de
leads, y por qué WhatsApp es el camino real y no el formulario.
