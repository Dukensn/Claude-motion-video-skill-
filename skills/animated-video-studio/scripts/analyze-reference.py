"""analyze-reference.py — measure how a reference video is built, so we can learn its rhythm without copying it.

    python3 SKILL/scripts/analyze-reference.py <video.mp4> [subtitles.vtt]

Writes next to the video: report.md (duration, shot lengths, cuts per minute by quarter, pauses, loudness,
words per minute, the hook text) and sheet-1.png, sheet-2.png… (frames sampled across the video, 4×4 each).
Read report.md and look at the sheets; then describe the techniques (hook, pacing, caption style, structure)
to the student. Never reuse its characters, story, wording or images.
"""
import json, os, re, statistics, subprocess, sys


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", path])
    return float(json.loads(r.stdout)["format"]["duration"])


def cuts(path, thr=0.3):
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-vf", f"select='gt(scene,{thr})',showinfo", "-an", "-f", "null", "-"])
    return [float(m) for m in re.findall(r"pts_time:([0-9.]+)", r.stderr)]


def fades(path):
    # dips to black (fade transitions) — many story channels use these instead of hard cuts
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-vf", "blackdetect=d=0.08:pix_th=0.12", "-an", "-f", "null", "-"])
    return [(float(a) + float(b)) / 2 for a, b in re.findall(r"black_start:([0-9.]+) black_end:([0-9.]+)", r.stderr)]


def silences(path):
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "silencedetect=noise=-35dB:d=0.7", "-vn", "-f", "null", "-"])
    starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
    return list(zip(starts, ends))


def loudness(path):
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128", "-vn", "-f", "null", "-"])
    m = re.findall(r"I:\s+(-?[0-9.]+) LUFS", r.stderr)
    return float(m[-1]) if m else None


def vtt_text(path):
    words, hook, seen = [], [], set()
    t = 0.0
    for line in open(path, encoding="utf-8", errors="ignore"):
        line = line.strip()
        m = re.match(r"(\d+):(\d+):([\d.]+) -->", line) or re.match(r"(\d+):([\d.]+) -->", line)
        if m:
            g = m.groups()
            t = (int(g[0]) * 3600 + int(g[1]) * 60 + float(g[2])) if len(g) == 3 else (int(g[0]) * 60 + float(g[1]))
            continue
        if not line or line.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")) or line.isdigit():
            continue
        clean = re.sub(r"<[^>]+>", "", line).strip()
        if not clean or clean in seen:  # auto-captions repeat rolling lines
            continue
        seen.add(clean)
        ws = clean.split()
        words += ws
        if t < 30:
            hook += ws
    return words, " ".join(hook)


def sheets(path, dur, out_dir, n=32):
    # n frames spread across the video, 16 per sheet
    fps = n / max(dur, 1)
    pattern = os.path.join(out_dir, "sheet-%d.png")
    run(["ffmpeg", "-loglevel", "error", "-y", "-i", path, "-vf", f"fps={fps:.5f},scale=480:-2,tile=4x4", pattern])
    return sorted(f for f in os.listdir(out_dir) if f.startswith("sheet-"))


def main():
    video = sys.argv[1]
    subs = sys.argv[2] if len(sys.argv) > 2 else None
    out = os.path.dirname(os.path.abspath(video))
    dur = duration(video)
    hard = cuts(video, 0.22)
    fd = fades(video)
    c = sorted(set(round(x, 1) for x in hard + fd))
    c = [x for i, x in enumerate(c) if i == 0 or x - c[i - 1] > 0.3]
    bounds = [0.0] + c + [dur]
    shots = [b - a for a, b in zip(bounds, bounds[1:]) if b - a > 0.05]
    q = [0, 0, 0, 0]
    for x in c:
        q[min(3, int(4 * x / dur))] += 1
    per_q = [round(k / (dur / 4 / 60), 1) for k in q]
    sil = silences(video)
    lufs = loudness(video)
    files = sheets(video, dur, out)
    L = [f"# Reference analysis — {os.path.basename(video)}", "",
         f"- Duration: {int(dur // 60)}:{int(dur % 60):02d} ({dur:.1f} s)",
         f"- Shots: {len(shots)} · average {statistics.mean(shots):.1f} s · median {statistics.median(shots):.1f} s · shortest {min(shots):.1f} s · longest {max(shots):.1f} s",
         f"- Shot changes: {len(hard)} cuts + {len(fd)} fades through black",
         f"- Shot changes per minute: {len(c) / (dur / 60):.1f} overall · by quarter {per_q[0]} / {per_q[1]} / {per_q[2]} / {per_q[3]}",
         f"- First cut at {c[0]:.1f} s" if c else "- No hard cuts detected (one continuous shot, or soft transitions)",
         f"- Loudness: {lufs} LUFS" if lufs is not None else "- Loudness: n/a",
         f"- Silences ≥ 0.7 s: {len(sil)}" + (" at " + ", ".join(f"{a:.0f}s" for a, _ in sil[:12]) if sil else "")]
    if subs and os.path.exists(subs):
        words, hook = vtt_text(subs)
        L += [f"- Spoken words: {len(words)} · {len(words) / (dur / 60):.0f} words per minute",
              "", "## Hook (first 30 s of speech)", "", "> " + (hook or "(none)")]
    L += ["", "## Contact sheets", ""] + [f"- {f}" for f in files]
    L += ["", "## How to use this", "",
          "Describe to the student, in their language: how fast it opens (first cut, hook), how the pace changes by quarter,",
          "where the pauses fall, how dense the narration is, and what the frames show about framing, colour and captions.",
          "Then apply the *techniques* to an original idea. Never reuse its story, characters, lines, titles or images."]
    open(os.path.join(out, "report.md"), "w").write("\n".join(L) + "\n")
    print("\n".join(L[:10]))
    print("report ->", os.path.join(out, "report.md"))


if __name__ == "__main__":
    main()
