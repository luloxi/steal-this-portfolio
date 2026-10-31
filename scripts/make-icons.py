"""Genera los íconos de public/icons desde brand/lulox-logo-master.jpg (1024x1024, negro puro a sangre).
Solo redimensiona y optimiza (paleta de 256 colores); no redibuja el logo.
Todos los íconos son cuadrados, opacos y de fondo negro (sin bordes ni zonas claras).
  - PWA 192/512 (any y maskable) y apple-touch 180: el logo se reduce al 88% centrado para quedar dentro de la zona segura (80%).
  - favicon 16/32/48: al 100% (más legible; los navegadores no aplican máscara).
Requiere Pillow. Si cambian los archivos, subir el sufijo de versión (.v3) en src/, public/ y el manifiesto."""
import os
from PIL import Image

SRC = Image.open("brand/lulox-logo-master.jpg").convert("RGB")
# El JPEG deja ruido casi negro alrededor del trazo: lo llevamos a negro puro.
SRC = SRC.copy()
px = SRC.load()
W = SRC.size[0]
for y in range(W):
    for x in range(W):
        if max(px[x, y]) < 8:
            px[x, y] = (0, 0, 0)
OUT = "public/icons"
os.makedirs(OUT, exist_ok=True)

def flat(size, scale):
    inner = round(size * scale)
    bg = Image.new("RGB", (size, size), (0, 0, 0))
    bg.paste(SRC.resize((inner, inner), Image.LANCZOS), ((size - inner) // 2,) * 2)
    return bg

def save(im, name, colors=None):
    if colors:
        im = im.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    im.save(f"{OUT}/{name}", optimize=True)

save(flat(32, 1.0), "favicon-32.v3.png")
save(flat(48, 1.0), "favicon-48.v3.png")
save(flat(180, 0.88), "apple-touch-icon-180.v3.png", 256)
save(flat(192, 0.88), "icon-192.v3.png", 256)
save(flat(512, 0.88), "icon-512.v3.png", 256)
ico = [flat(s, 1.0) for s in (16, 32, 48)]
ico[2].save(f"{OUT}/favicon.v3.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
