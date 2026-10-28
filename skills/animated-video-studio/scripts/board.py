"""board.py — turn freshly drawn previews into the menu the student sees: numbered cards + one board.

    python3 SKILL/scripts/board.py films/_menu/menu.json [films/_menu/out]

menu.json: {"title": "Choisis ton numéro", "items": [{"image": "films/_menu/out/p1.png", "name": "…", "line": "…"}, …]}
Writes <out>/board.jpg and <out>/01.jpg, 02.jpg… (JPEG, phone-friendly). Vertical images are shown on a blurred fill.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FT = os.path.join(SKILL, "templates/stickman/assets/fonts/LilitaOne.ttf")
FI = os.path.join(SKILL, "templates/stickman/assets/fonts/Inter.ttf")
W, H = 1920, 1080


def font(p, s, w=None):
    f = ImageFont.truetype(p, s)
    if w:
        try: f.set_variation_by_axes([w])
        except Exception: pass
    return f


def fit(im):
    if abs(im.width / im.height - 16 / 9) < 0.05:
        return im.resize((W, H), Image.LANCZOS)
    bg = im.resize((W, W * im.height // im.width)).crop((0, 0, W, H)).filter(ImageFilter.GaussianBlur(40))
    v = im.resize((H * im.width // im.height, H), Image.LANCZOS); bg.paste(v, ((W - v.width) // 2, 0)); return bg


def main():
    spec = json.load(open(sys.argv[1])); out = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(sys.argv[1]) + "/out"
    os.makedirs(out, exist_ok=True)
    NUM, NAME, DESC = font(FT, 120), font(FT, 78), font(FI, 38, 600)
    cards = []
    for i, it in enumerate(spec["items"], 1):
        c = Image.new("RGB", (W, H + 230), (20, 20, 28)); c.paste(fit(Image.open(it["image"]).convert("RGB")), (0, 0)); d = ImageDraw.Draw(c)
        d.ellipse([W - 230, 30, W - 30, 230], fill=(255, 196, 0), outline=(20, 20, 20), width=10)
        d.text((W - 130, 132), str(i), font=NUM, fill=(20, 20, 20), anchor="mm")
        d.text((50, H + 40), f"{i}. {it['name']}", font=NAME, fill=(255, 255, 255))
        d.text((52, H + 150), it.get("line", ""), font=DESC, fill=(200, 200, 210))
        c.save(os.path.join(out, f"{i:02d}.jpg"), quality=86); cards.append(c)
    cols = 2 if len(cards) <= 4 else 3
    rows = (len(cards) + cols - 1) // cols
    cw = 960; ch = cw * (H + 230) // W; gap = 24
    B = Image.new("RGB", (cols * cw + (cols + 1) * gap, rows * ch + (rows + 1) * gap + 220), (12, 12, 18)); d = ImageDraw.Draw(B)
    d.text((B.width // 2, 110), spec.get("title", "Choisis ton numéro"), font=font(FT, 120), fill=(255, 196, 0), anchor="mm")
    for k, c in enumerate(cards):
        r, q = divmod(k, cols); B.paste(c.resize((cw, ch), Image.LANCZOS), (gap + q * (cw + gap), 220 + gap + r * (ch + gap)))
    B.save(os.path.join(out, "board.jpg"), quality=86)
    print(f"board -> {out}/board.jpg + {len(cards)} cards")


if __name__ == "__main__":
    main()
