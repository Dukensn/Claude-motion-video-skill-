import sys, json, wave, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[1], device="cpu", compute_type="int8", cpu_threads=4)
w = wave.open(sys.argv[2]); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
segs, info = m.transcribe(a, language="ht", word_timestamps=True, beam_size=5, condition_on_previous_text=False, vad_filter=False)
out = []
for s in segs:
    out.append({"s": round(s.start, 2), "e": round(s.end, 2), "t": s.text.strip(), "w": [(round(x.start, 2), round(x.end, 2), x.word) for x in s.words]})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}", flush=True)
json.dump(out, open(sys.argv[3], "w"), ensure_ascii=False)
