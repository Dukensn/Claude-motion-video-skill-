"""Creole subtitles on the cleaned voice (times already in cleaned seconds), cut into 2-4 word chunks."""
import json, re
L = [(0.30, 2.95, "Videyo sa, feyton sa, ak videyo sa…"),
 (2.95, 5.05, "se entèlijans atifisyèl ki fè yo."),
 (5.18, 7.46, "E y ap fè dega sou YouTube."),
 (7.62, 11.26, "Pa egzanp, chèn sa poko gen yon mwa, li gentan fè 8 milyon vi o total."),
 (11.74, 17.04, "E sa k bèl la, grenn videyo sa sèlman gentan fè plis pase 3 milyon vi nan mwens ke 4 semèn."),
 (17.70, 23.42, "Poutan, se pa sèlman bon zouti ou bezwen pou fè l: ou bezwen konpetans pou konn kòman pou fè l."),
 (23.42, 27.74, "Se sa k fè, n òganize yon gwo atelye: Atelye AI."),
 (28.20, 34.16, "Samdi 5 desanm, nan Lise Anacaona, depi 10è nan maten rive 4è apremidi,"),
 (34.30, 38.68, "yon jounen enfòmasyon ak pratik pou n aprann kreye tout kalite videyo ak IA,"),
 (38.88, 42.82, "kit se feyton, kit se videyo stickman, kit se videyo motion design."),
 (43.56, 47.78, "Epi n ap montre w kòman pou metrize Facebook Ads, yon konpetans ki vrèman enpòtan."),
 (48.18, 50.30, "Paske gras ak Facebook Ads jounen jodi a,"),
 (50.46, 54.10, "ou ka fè yon piblisite rive devan plizyè santèn milye kliyan,"),
 (54.52, 57.74, "menm yon milyon kliyan, avèk yon ti kras bidjè."),
 (58.25, 59.89, "N ap montre w kreye pwodwi dijital."),
 (60.53, 66.37, "Yon pwodwi dijital egziste sèlman an vityèl: sou telefòn, òdinatè, oswa nan cloud."),
 (66.37, 70.40, "Ou fè l yon sèl fwa, ou ka vann li plizyè dizèn milye fwa,"),
 (70.40, 74.51, "a plizyè santèn milye moun, san ou pa bezwen refè l ankò."),
 (75.29, 81.51, "E sa k bèl la, nou prepare tout zouti yo, tout aplikasyon yo, e n ap ba ou yo gratis."),
 (82.59, 87.31, "Pa bay tèt ou pwoblèm pou kat debi: n ap fè w jwenn youn gratis."),
 (87.31, 94.91, "E pou w kòmanse ak Claude, n ap fè w jwenn 7 jou Claude Pro gratis, san ou pa depanse yon goud."),
 (95.57, 101.73, "Apre atelye a, n ap mete w nan yon gwoup WhatsApp pou nou kontinye ba w sipò."),
 (102.33, 104.10, "Bon, plas yo limite."),
 (104.20, 108.83, "Kidonk si w enterese, tanpri kontakte n sou nimewo ki afiche sou ekran an,"),
 (109.31, 111.40, "oswa klike sou bouton WhatsApp ki anba videyo sa.")]
caps = []
for s, e, text in L:
    words = text.split(); ch = []; cur = []
    for w in words:
        cur.append(w)
        if len(cur) >= 4 or (len(cur) >= 2 and re.search(r"[,.:!?…»]$", w)): ch.append(cur); cur = []
    if cur:
        if ch and len(cur) == 1: ch[-1] += cur
        else: ch.append(cur)
    tot = sum(len(" ".join(c)) for c in ch); t = s
    for c in ch:
        d = (e - s) * len(" ".join(c)) / tot; caps.append([round(t, 2), round(t + d, 2), " ".join(c)]); t += d
HL = ["IA", "atifisyèl", "YouTube", "8", "milyon", "3", "4", "semèn", "konpetans", "Atelye", "AI", "5", "desanm", "Lise", "Anacaona", "10è", "4è",
      "pratik", "feyton", "stickman", "motion", "design", "Facebook", "Ads", "kliyan", "dijital", "sèl", "fwa", "gratis", "kat", "debi", "Claude", "Pro", "7", "jou",
      "goud", "WhatsApp", "limite", "sipò", "cloud"]
json.dump({"caps": caps, "hl": HL}, open("build/caps.json", "w"), ensure_ascii=False)
print(len(caps), "chunks")
