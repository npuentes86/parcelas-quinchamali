#!/usr/bin/env python3
"""
Genera los datos estructurados y el sitemap desde js/datos.js.

  python3 seo.py

js/datos.js es la única fuente de verdad del loteo (precio, superficie, estado
de cada lote). Escribir el JSON-LD a mano significaría mantener los mismos
números en dos lugares, y se desincronizarían en la primera venta. Este script
los lee de ahí y reescribe:

  sitemap.xml   las páginas indexables, con lastmod
  index.html    el bloque JSON-LD entre las marcas seo:jsonld

Correrlo después de cada cambio en js/datos.js. El resultado se commitea: no
hay build en GitHub Pages que lo genere solo.

Nota sobre build.py: el paso 3 de ese script se queda solo con <title>, las
fuentes y el <style>, así que este JSON-LD NO viaja a dist/sitio.html. Es lo
que se quiere. Por eso va en el <head> y nunca en el <body>: en el cuerpo
sobreviviría al empaquetado y el Artifact terminaría declarando una oferta real
de venta de terrenos desde una página de claude.ai.
"""
import json
import pathlib
import re
import sys
from datetime import date

RAIZ = pathlib.Path(__file__).parent
SITIO = "https://parcelasquinchamali.cl"

# Coordenadas del loteo. Salen del enlace de Google Maps que ya usa el sitio
# (datos.js → mapsUrl), no de una estimación: son los valores !3d/!4d a los que
# resuelve ese enlace corto. Es el mismo punto al que se manda a la gente desde
# el botón "ver en el mapa".
LAT, LON = -36.6457297, -72.4008285

# Páginas indexables. privacidad.html queda fuera a propósito: ya declara
# <meta name="robots" content="noindex, follow">, y meterla en el sitemap sería
# pedirle a Google que indexe algo que la propia página le dice que no indexe.
PAGINAS = ["/", "/desde-el-aire.html"]


def leer_datos() -> dict:
    """Saca lo que se necesita de js/datos.js sin ejecutar JavaScript."""
    js = (RAIZ / "js" / "datos.js").read_text(encoding="utf-8")

    def campo(nombre, patron=r"'([^']*)'"):
        m = re.search(rf"\b{nombre}:\s*{patron}", js)
        if not m:
            sys.exit(f"seo.py: no encontré '{nombre}' en js/datos.js")
        return m.group(1)

    lotes = re.findall(r"\{\s*n:\s*(\d+),\s*estado:\s*'(\w+)'", js)
    if not lotes:
        sys.exit("seo.py: no encontré la lista de lotes en js/datos.js")

    return {
        "nombre": campo("nombre"),
        "comuna": campo("comuna"),
        "telefono": campo("telefono"),
        "telefonoE164": campo("telefonoE164"),
        "vendedor": campo("vendedor"),
        "mapsUrl": campo("mapsUrl"),
        "precioUF": float(campo("precioUF", r"([\d.]+)")),
        "superficieM2": int(campo("superficieM2", r"(\d+)")),
        "total": len(lotes),
        "disponibles": sum(1 for _, e in lotes if e == "disponible"),
    }


def jsonld(d: dict) -> str:
    # priceCurrency CLF: la UF tiene código ISO 4217 propio, no es un invento.
    # Poner "UF" ahí sería inválido y Google descartaría la oferta entera.
    grafo = [
        {
            "@type": "RealEstateAgent",
            "@id": f"{SITIO}/#vendedor",
            "name": d["nombre"],
            "description": (
                f"Venta directa de {d['total']} parcelas de agrado de "
                f"≈{d['superficieM2']:,} m² en {d['comuna']}."
            ).replace(",", "."),
            "url": SITIO,
            "telephone": f"+{d['telefonoE164']}",
            "image": f"{SITIO}/images/og-image.jpg",
            "logo": f"{SITIO}/images/logo-santa-rita.png",
            "areaServed": [
                {"@type": "Place", "name": "Quinchamalí"},
                {"@type": "City", "name": "Chillán"},
                {"@type": "AdministrativeArea", "name": "Región de Ñuble"},
            ],
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Quinchamalí",
                "addressRegion": "Ñuble",
                "addressCountry": "CL",
            },
            "hasMap": d["mapsUrl"],
        },
        {
            "@type": "Place",
            "@id": f"{SITIO}/#loteo",
            "name": f"Loteo {d['nombre']}",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Quinchamalí",
                "addressRegion": "Ñuble",
                "addressCountry": "CL",
            },
            "geo": {"@type": "GeoCoordinates", "latitude": LAT, "longitude": LON},
            "hasMap": d["mapsUrl"],
        },
        {
            "@type": "Product",
            "@id": f"{SITIO}/#parcelas",
            "name": f"Parcela de agrado de ≈{d['superficieM2']:,} m²".replace(",", "."),
            "description": (
                f"Parcela de ≈{d['superficieM2']:,} m² en el loteo {d['nombre']}, "
                f"{d['comuna']}. Título saneado y acceso por camino público."
            ).replace(",", "."),
            "image": f"{SITIO}/images/og-image.jpg",
            "category": "Terreno",
            "brand": {"@id": f"{SITIO}/#vendedor"},
            "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "CLF",
                "lowPrice": d["precioUF"],
                "highPrice": d["precioUF"],
                "offerCount": d["disponibles"],
                "availability": (
                    "https://schema.org/InStock"
                    if d["disponibles"]
                    else "https://schema.org/SoldOut"
                ),
                "seller": {"@id": f"{SITIO}/#vendedor"},
                "areaServed": {"@id": f"{SITIO}/#loteo"},
            },
        },
    ]
    datos = {"@context": "https://schema.org", "@graph": grafo}
    return json.dumps(datos, ensure_ascii=False, indent=2)


def escribir_sitemap() -> None:
    hoy = date.today().isoformat()
    urls = "\n".join(
        f"  <url><loc>{SITIO}{p}</loc><lastmod>{hoy}</lastmod></url>" for p in PAGINAS
    )
    (RAIZ / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>\n",
        encoding="utf-8",
    )
    print(f"  sitemap.xml    {len(PAGINAS)} páginas")


def inyectar_jsonld(bloque: str) -> None:
    ruta = RAIZ / "index.html"
    html = ruta.read_text(encoding="utf-8")
    abre, cierra = "<!-- seo:jsonld -->", "<!-- /seo:jsonld -->"
    if abre not in html or cierra not in html:
        sys.exit(f"seo.py: faltan las marcas {abre} … {cierra} en index.html")
    nuevo = f'{abre}\n<script type="application/ld+json">\n{bloque}\n</script>\n{cierra}'
    html = re.sub(
        re.escape(abre) + r".*?" + re.escape(cierra), lambda _m: nuevo, html, flags=re.S
    )
    ruta.write_text(html, encoding="utf-8")
    print(f"  index.html     JSON-LD, {len(bloque)} caracteres")


def main() -> int:
    d = leer_datos()
    print(f"js/datos.js → {d['disponibles']} de {d['total']} parcelas disponibles, "
          f"UF {d['precioUF']:.0f} cada una")
    escribir_sitemap()
    inyectar_jsonld(jsonld(d))
    print("\n✓ listo. Acordarse de commitear sitemap.xml e index.html.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
