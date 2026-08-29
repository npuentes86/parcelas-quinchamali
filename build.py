#!/usr/bin/env python3
"""
Empaqueta el sitio en un solo archivo HTML autocontenido.

  python3 build.py

Genera dist/sitio.html: CSS, JS e imágenes quedan incrustados, sin ninguna
petición a servidores externos salvo Google Fonts. Ese archivo es el que se
publica como Artifact; index.html + css/ + js/ + images/ siguen siendo la
fuente editable para hosting normal (GitHub Pages, Netlify, etc.).
"""
import base64
import mimetypes
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).parent
DIST = RAIZ / "dist"


def data_uri(ruta: pathlib.Path) -> str:
    tipo = mimetypes.guess_type(ruta.name)[0] or "application/octet-stream"
    return f"data:{tipo};base64," + base64.b64encode(ruta.read_bytes()).decode("ascii")


def main() -> int:
    html = (RAIZ / "index.html").read_text(encoding="utf-8")
    css = (RAIZ / "css" / "style.css").read_text(encoding="utf-8")
    js = "\n".join(
        (RAIZ / "js" / n).read_text(encoding="utf-8") for n in ("datos.js", "main.js")
    )

    # 1. imágenes → data URI (solo rutas relativas: las URL absolutas de las
    #    metaetiquetas og: deben seguir apuntando al hosting real)
    for img in sorted((RAIZ / "images").iterdir()):
        ref = f'"images/{img.name}"'
        if ref in html:
            html = html.replace(ref, '"' + data_uri(img) + '"')
            print(f"  incrustado {img.name} ({img.stat().st_size // 1024} KB)")

    # 1b. video del hero → data URI (mismo criterio que las imágenes)
    carpeta_video = RAIZ / "video"
    if carpeta_video.is_dir():
        for vid in sorted(carpeta_video.iterdir()):
            ref = f'"video/{vid.name}"'
            if ref in html:
                html = html.replace(ref, '"' + data_uri(vid) + '"')
                print(f"  incrustado {vid.name} ({vid.stat().st_size // 1024} KB)")

    # 2. CSS y JS → en línea
    html = html.replace(
        '<link rel="stylesheet" href="css/style.css">', f"<style>\n{css}\n</style>"
    )
    html = re.sub(
        r'<script src="js/datos\.js"></script>\s*<script src="js/main\.js"></script>',
        lambda _m: f"<script>\n{js}\n</script>",
        html,
    )

    # 3. El Artifact envuelve el contenido en su propio doctype/head/body:
    #    se entrega solo el interior, con <title>, la fuente y el <style> arriba.
    cabeza = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    cuerpo = re.search(r"<body>(.*?)</body>", html, re.S).group(1)

    titulo = re.search(r"<title>.*?</title>", cabeza, re.S).group(0)
    fuentes = re.findall(r'<link rel="stylesheet" href="https://fonts\.[^"]+">', cabeza)
    estilo = re.search(r"<style>.*?</style>", cabeza, re.S).group(0)

    salida = "\n".join([titulo, *fuentes, estilo, cuerpo.strip()])

    DIST.mkdir(exist_ok=True)
    destino = DIST / "sitio.html"
    destino.write_text(salida, encoding="utf-8")
    print(f"\n✓ {destino}  —  {len(salida.encode('utf-8')) / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
