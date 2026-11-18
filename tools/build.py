"""Fill src/index.src.html (dark theme) -> index.html."""
import json, math, random
random.seed(11)
c = json.load(open('build/caps.json')); s = open('src/index.src.html').read()
burst = "".join(f'<line data-x="{280*math.cos(a):.0f}" data-y="{280*math.sin(a):.0f}" x1="0" y1="0" x2="0" y2="0"/>' for a in [i * math.pi / 7 for i in range(14)])
PORT = {"n4.jpg", "n5.jpg", "n6.jpg", "n7.jpg", "n8.jpg", "n9.jpg", "n10.jpg"}
def tile(f):
    w = 203 if (f.startswith("rw") or f in PORT) else 640
    return f'<div style="flex:none;width:{w}px;height:360px;border-radius:24px;overflow:hidden;border:4px solid #fff"><img src="assets/img/{f}" style="width:100%;height:100%;object-fit:cover" alt=""></div>'
row1 = "".join(tile(f) for f in ["n4.jpg", "n1.jpg", "n7.jpg", "stickman-3.jpg", "n9.jpg", "n2.jpg", "rw1.jpg", "stickman-4.jpg", "n5.jpg"])
row2 = "".join(tile(f) for f in ["n3.jpg", "n8.jpg", "stickman-5.jpg", "n10.jpg", "n6.jpg", "stickman-6.jpg", "rw2.jpg", "n1.jpg", "rw3.jpg"])
nodes = []
while len(nodes) < 26:
    x, y = random.uniform(60, 1020), random.uniform(120, 1380)
    if 200 < x < 880 and 160 < y < 1260: continue
    if any((x - a) ** 2 + (y - b) ** 2 < 110 ** 2 for a, b in nodes): continue
    nodes.append((x, y))
nodes.sort(key=lambda n: (n[0] - 540) ** 2 + (n[1] - 700) ** 2)
net = "".join(f'<line x1="540" y1="700" x2="{x:.0f}" y2="{y:.0f}" stroke="#1877f2" stroke-width="3" stroke-dasharray="8 10" opacity="0"/>' for x, y in nodes)
net += "".join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="30" fill="#1877f2"/>' for x, y in nodes)
person = '<svg width="70" height="110" viewBox="0 0 70 110" style="opacity:.12"><circle cx="35" cy="24" r="18" fill="#fff"/><path d="M6 110 C6 66 18 50 35 50 C52 50 64 66 64 110 Z" fill="#e2553f"/></svg>'
bell = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 004 0"/></svg>'
def attendee(x, y, k, hand, i):
    g = f'<g transform="translate({x:.0f},{y:.0f}) scale({k:.2f})"><g class="att">'
    if hand: g += '<path class="hand" d="M30 -10 L52 -95" stroke="#8a8a92" stroke-width="13" stroke-linecap="round"/>'
    g += '<path d="M-40 70 Q-40 0 0 -6 Q40 0 40 70 Z" fill="#3a3a42"/><circle class="head" cx="0" cy="-34" r="28" fill="#4a4a52"/>'
    g += f'<rect class="lap" x="-34" y="44" width="68" height="40" rx="5" fill="{"#e2553f" if i % 4 == 0 else "#f2efe9"}" opacity=".15"/><rect x="-44" y="84" width="88" height="7" rx="3" fill="#55555c"/></g></g>'
    return g
klass = ""
for r, (y, k, n) in enumerate([(930, 0.78, 7), (1060, 0.95, 6), (1215, 1.15, 5)]):
    w = 1000 / n
    for j in range(n):
        klass += attendee(40 + w * (j + 0.5) + (20 if r % 2 else 0), y, k, (r * 7 + j) % 5 == 2, r * 10 + j)
s = s.replace("__CLASS__", klass)
s = (s.replace("__BURST__", burst).replace("__ROW1__", row1).replace("__ROW2__", row2).replace("__NET__", net)
      .replace("__CROWD__", person * 36).replace("__BELL__", bell)
      .replace("__CAPS__", json.dumps(c["caps"], ensure_ascii=False)).replace("__HL__", json.dumps(c["hl"], ensure_ascii=False)))
assert "__" not in s.replace("__timelines", "")
open("index.html", "w").write(s); print("ok")
