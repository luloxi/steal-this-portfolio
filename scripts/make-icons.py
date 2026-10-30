"""Genera los íconos de public/icons desde brand/lulox-logo-master.jpg.
Solo redimensiona, rellena de negro lo que queda fuera del azulejo redondeado y optimiza; no redibuja el logo.
Todos los íconos son cuadrados, opacos y de fondo negro (sin bordes ni zonas claras).
  - PWA 192/512 (any y maskable), apple-touch 180: el azulejo se reduce al 88% centrado para quedar dentro de la zona segura (80%).
  - favicon 16/32/48: azulejo al 100% (más legible; los navegadores no aplican máscara).
Requiere Pillow. Si cambian los archivos, subir el sufijo de versión (.v2) en src/, public/ y el manifiesto."""
import os
from collections import deque
from PIL import Image

SRC = Image.open("brand/lulox-logo-master.jpg").convert("RGB")
W = SRC.size[0]
OUT = "public/icons"
os.makedirs(OUT, exist_ok=True)

# Región exterior: píxeles claros conectados con las esquinas.
px = SRC.load()
outside = [[False] * W for _ in range(W)]
dq = deque((x, y) for x, y in ((0, 0), (W - 1, 0), (0, W - 1), (W - 1, W - 1)))
for x, y in list(dq):
    outside[y][x] = True
while dq:
    x, y = dq.popleft()
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < W and 0 <= ny < W and not outside[ny][nx] and sum(px[nx, ny]) > 3 * 140:
            outside[ny][nx] = True
            dq.append((nx, ny))

# Exterior y franja antialias del borde (3 px) en negro puro; el interior del azulejo no se toca.
tile = SRC.copy()
tp = tile.load()
R = 3
for y in range(W):
    for x in range(W):
        if outside[y][x]:
            tp[x, y] = (0, 0, 0)
        elif any(0 <= x + dx < W and 0 <= y + dy < W and outside[y + dy][x + dx]
                 for dx in range(-R, R + 1) for dy in range(-R, R + 1)):
            tp[x, y] = (0, 0, 0)

def flat(size, scale):
    inner = round(size * scale)
    bg = Image.new("RGB", (size, size), (0, 0, 0))
    bg.paste(tile.resize((inner, inner), Image.LANCZOS), ((size - inner) // 2,) * 2)
    return bg

def save(im, name, colors=None):
    if colors:
        im = im.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    im.save(f"{OUT}/{name}", optimize=True)

save(flat(32, 1.0), "favicon-32.v2.png")
save(flat(48, 1.0), "favicon-48.v2.png")
save(flat(180, 0.88), "apple-touch-icon-180.v2.png", 256)
save(flat(192, 0.88), "icon-192.v2.png", 256)
save(flat(512, 0.88), "icon-512.v2.png", 256)
ico = [flat(s, 1.0) for s in (16, 32, 48)]
ico[2].save(f"{OUT}/favicon.v2.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
