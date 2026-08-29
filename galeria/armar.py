#!/usr/bin/env python3
"""Incrusta los videos y fotogramas en la página del vuelo."""
import base64, pathlib, mimetypes

AQUI = pathlib.Path(__file__).parent
GAL = AQUI / "gal"


def uri(p):
    tipo = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    return f"data:{tipo};base64," + base64.b64encode(p.read_bytes()).decode("ascii")


# fotogramas: (archivo, toma, segundo)
FRAMES = [
    ("largo-1.jpg",   "Toma larga", "00:01"),
    ("largo-6.jpg",   "Toma larga", "00:06"),
    ("largo-11.jpg",  "Toma larga", "00:11"),
    ("largo-16.jpg",  "Toma larga", "00:16"),
    ("largo-21.jpg",  "Toma larga", "00:21"),
    ("largo-26.jpg",  "Toma larga", "00:26"),
    ("largo-31.jpg",  "Toma larga", "00:31"),
    ("largo-34.jpg",  "Toma larga", "00:34"),
    ("corto-0.3.jpg", "Toma corta", "00:00"),
    ("corto-2.jpg",   "Toma corta", "00:02"),
    ("corto-3.9.jpg", "Toma corta", "00:04"),
]

trozos = []
for arch, toma, tc in FRAMES:
    d = uri(GAL / arch)
    trozos.append(
        f'<button class="frame" type="button">'
        f'<img src="{d}" alt="{toma}, segundo {tc}" loading="lazy">'
        f'<span class="tc"><em>{toma.split()[1]}</em>{tc}</span></button>'
    )

html = (AQUI / "vuelo.tpl.html").read_text(encoding="utf-8")
html = html.replace("{{VIDEO_LARGO}}", uri(GAL / "vuelo-largo.mp4"))
html = html.replace("{{VIDEO_CORTO}}", uri(GAL / "vuelo-corto.mp4"))
html = html.replace("{{POSTER_CORTO}}", uri(GAL / "corto-2.jpg"))
html = html.replace("{{POSTER}}", uri(GAL / "largo-1.jpg"))
html = html.replace("{{FRAMES}}", "\n".join(trozos))

destino = AQUI / "vuelo-santa-rita.html"
destino.write_text(html, encoding="utf-8")
print(f"✓ {destino} — {len(html.encode('utf-8'))/1048576:.2f} MB")
