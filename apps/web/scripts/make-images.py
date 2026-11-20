"""Genera las imágenes livianas de la web a partir de los maestros de public/brand.

uso: python3 -I scripts/make-images.py   (desde apps/web; requiere Pillow)
Los PNG de public/brand pesan ~17 MB y NO se publican: la web usa estos WebP.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND, OUT = ROOT / "public" / "brand", ROOT / "public" / "img"
OUT.mkdir(exist_ok=True)


def webp(src, name, widths, q=86):
    im = Image.open(BRAND / src).convert("RGBA")
    for w in widths:
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(OUT / f"{name}-{w}.webp", "WEBP", quality=q, method=6)


webp("mascota.png", "mascota", [640, 1280])
webp("logo-horizontal-fondo-claro.png", "logo-horizontal", [320, 640])
webp("logo-horizontal-fondo-azul.png", "logo-horizontal-azul", [320, 640])
webp("logo-principal-fondo-azul.png", "logo-principal-azul", [640, 1280])

# imagen para redes (1200x630): logo principal sobre crema
bg = Image.new("RGB", (1200, 630), (248, 247, 242))
logo = Image.open(BRAND / "logo-principal-fondo-claro.png").convert("RGBA")
h = 560
logo = logo.resize((round(logo.width * h / logo.height), h), Image.LANCZOS)
bg.paste(logo, ((1200 - logo.width) // 2, (630 - h) // 2), logo)
bg.save(OUT / "og.png", optimize=True)
print("ok")
