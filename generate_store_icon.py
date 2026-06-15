#!/usr/bin/env python3
"""Chrome Web Store listing icon: 128x128 with the mark in a ~96px safe area
(Chrome recommends ~16px padding so it sits consistently next to other icons).
Rendered at 4x and downsampled. Transparent padding is allowed for store icons.
"""
import os
from PIL import Image, ImageDraw

INK = (55, 53, 47, 255)
WHITE = (255, 255, 255, 255)
OUT = os.path.join(os.path.dirname(__file__), "store", "store_icon_128.png")


def make() -> Image.Image:
    S = 128 * 4
    pad = int(S * (16 / 128))          # 16px padding at final size
    box = S - 2 * pad                  # ~96px mark
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    radius = int(box * 0.24)
    d.rounded_rectangle([pad, pad, pad + box - 1, pad + box - 1], radius=radius, fill=INK)

    # Diagonal slash, bottom-left -> top-right, rounded caps.
    w = max(2, int(box * 0.12))
    x0, y0 = pad + box * 0.33, pad + box * 0.72
    x1, y1 = pad + box * 0.67, pad + box * 0.28
    d.line([(x0, y0), (x1, y1)], fill=WHITE, width=w)
    r = w / 2
    for cx, cy in [(x0, y0), (x1, y1)]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)

    return img.resize((128, 128), Image.LANCZOS)


if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    make().save(OUT)
    print("wrote", OUT)
