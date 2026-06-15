#!/usr/bin/env python3
"""Generate GoSlash placeholder icons: a dark rounded square with a white slash.

Rendered at 4x and downsampled for clean anti-aliasing. Swap these out anytime;
the manifest just references icons/icon{16,32,48,128}.png.
"""
import os
from PIL import Image, ImageDraw

INK = (55, 53, 47, 255)   # Notion ink
WHITE = (255, 255, 255, 255)
SIZES = [16, 32, 48, 128]
OUT = os.path.join(os.path.dirname(__file__), "icons")


def make(size: int) -> Image.Image:
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    radius = int(s * 0.22)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=radius, fill=INK)

    # Diagonal slash, bottom-left -> top-right, rounded caps.
    w = max(2, int(s * 0.11))
    d.line([(s * 0.34, s * 0.72), (s * 0.66, s * 0.28)], fill=WHITE, width=w)
    r = w / 2
    for cx, cy in [(s * 0.34, s * 0.72), (s * 0.66, s * 0.28)]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for size in SIZES:
        path = os.path.join(OUT, f"icon{size}.png")
        make(size).save(path)
        print("wrote", path)


if __name__ == "__main__":
    main()
