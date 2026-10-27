"""scorelib — write a humanized film score as MIDI, cue by cue, in seconds.

Render the MIDI with FluidSynth and a sampled General MIDI soundfont (FluidR3_GM):
real recorded piano, strings, guitar, music box... never synth tones.

    from scorelib import *
    pedal(0.5); note("piano", 0.8, 3, "A4", 40)
    arp(7.0, 3.6, "Dm", vel=46)
    melody("piano", 17.0, [("A4", 1), ("D5", 1)], beat=0.9)
    write("score.mid")

Every time is in seconds of film time, so cues land exactly on the picture.
"""
import random
import mido

random.seed(7)
TPS = 960  # ticks per second (tempo 120 bpm, 480 ppq)
events = []  # (time_sec, order, msg)

NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
        "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def n(name):
    """'C#4' -> MIDI number"""
    i = 2 if len(name) > 2 and name[1] in "#b" else 1
    return 12 * (int(name[i:]) + 1) + NOTE[name[:i]]


# instrument -> MIDI channel and General MIDI program (channel 9 is drums: never used)
CH = {"piano": 0, "strings": 1, "cello": 2, "box": 3, "trem": 4, "timp": 5, "celesta": 6,
      "guitar": 7, "pad": 8, "violin": 10, "voice": 11}
PROG = {"piano": 0, "strings": 49, "cello": 42, "box": 10, "trem": 44, "timp": 47, "celesta": 8,
        "guitar": 24, "pad": 89, "violin": 40, "voice": 53}
VOLUME = {"piano": 100, "strings": 82, "cello": 86, "box": 70, "trem": 80, "timp": 66, "celesta": 70,
          "guitar": 90, "pad": 60, "violin": 70, "voice": 70}


def note(inst, t, dur, pitch, vel, human=True):
    """one note; human=True adds a little timing and velocity drift"""
    if isinstance(pitch, str):
        pitch = n(pitch)
    if human:
        t += random.gauss(0, 0.012)
        vel += random.randint(-6, 6)
    vel = max(1, min(127, int(vel)))
    t = max(0.0, t)
    c = CH[inst]
    events.append((t, 1, mido.Message("note_on", channel=c, note=pitch, velocity=vel)))
    events.append((t + dur, 0, mido.Message("note_off", channel=c, note=pitch, velocity=0)))


def cc(inst, t, ctrl, val):
    events.append((max(0, t), 0 if val == 0 else 2, mido.Message("control_change", channel=CH[inst], control=ctrl, value=int(val))))


def pedal(t):
    """re-pedal the piano: lift just before t, press just after"""
    cc("piano", t - 0.03, 64, 0)
    cc("piano", t + 0.04, 64, 100)


def pedal_off(t):
    cc("piano", t, 64, 0)


def silence(inst, t):
    """cut an instrument dead (all notes off) — for hard silences on picture"""
    cc(inst, t, 123, 0)


def swell(inst, a, b, v0, v1, steps=24):
    """expression ramp 0..127 between a and b seconds"""
    for i in range(steps + 1):
        k = i / steps
        cc(inst, a + (b - a) * k, 11, v0 + (v1 - v0) * k)


def chord(inst, t, dur, names, vel, spread=0.0):
    for i, nm in enumerate(names):
        note(inst, t + i * spread, dur, nm, vel)


# chord voicings: name -> (bass, [left hand], [four arpeggio tones]); add your own with V.update
V = {
    "C": ("C2", ["C3", "G3"], ["C4", "E4", "G4", "C5"]),
    "Cadd9": ("C2", ["C3", "G3"], ["D4", "E4", "G4", "D5"]),
    "Dm": ("D2", ["D3", "A3"], ["D4", "F4", "A4", "D5"]),
    "D": ("D2", ["D3", "A3"], ["D4", "F#4", "A4", "D5"]),
    "Dsus4": ("D2", ["D3", "A3"], ["D4", "G4", "A4", "D5"]),
    "Em": ("E2", ["E2", "B2"], ["B3", "E4", "G4", "B4"]),
    "E": ("E2", ["E2", "B2"], ["B3", "E4", "G#4", "B4"]),
    "F": ("F2", ["F2", "C3"], ["C4", "F4", "A4", "C5"]),
    "G": ("G1", ["G2", "D3"], ["B3", "D4", "G4", "B4"]),
    "Gm": ("G1", ["G2", "D3"], ["D4", "G4", "Bb4", "D5"]),
    "Am": ("A1", ["A2", "E3"], ["C4", "E4", "A4", "C5"]),
    "A": ("A1", ["A2", "E3"], ["C#4", "E4", "A4", "C#5"]),
    "Bb": ("Bb1", ["Bb2", "F3"], ["D4", "F4", "Bb4", "D5"]),
    "Bm": ("B1", ["B2", "F#3"], ["B3", "D4", "F#4", "B4"]),
}


def arp(t, dur, ch, vel=48, pattern=(0, 1, 2, 1, 3, 1, 2, 1), steps=8, lh=True, oct_up=0):
    """piano arpeggio over one chord, with bass and a push-pull feel"""
    bass, left, tones = V[ch]
    pedal(t)
    if lh:
        note("piano", t, dur * 0.95, bass, vel + 6)
        note("piano", t + 0.02, dur * 0.9, left[1], vel - 6)
    step = dur / steps
    for i in range(steps):
        p = n(tones[pattern[i % len(pattern)]]) + 12 * oct_up
        sw = 0.012 * (1 if i % 2 else -1)
        note("piano", t + i * step + sw, step * 2.2, p, vel - 8 + (6 if i == 0 else 0) - (i % 2) * 4)


def broken(t, dur, ch, vel=44, steps=6, pat=(0, 1, 2, 3, 2, 1)):
    arp(t, dur, ch, vel=vel, pattern=pat, steps=steps)


def progression(t, chords, dur, vel=44, steps=6):
    """broken piano chords back to back; returns the end time"""
    for ch in chords:
        broken(t, dur, ch, vel=vel, steps=steps)
        t += dur
    return t


def waltz(t, bar, ch, vel=46, inst="piano"):
    """oom-pah-pah: bass on 1, chord on 2 and 3"""
    bass, left, tones = V[ch]
    b = bar / 3
    if inst == "piano":
        pedal(t)
    note(inst, t, bar * 0.95, bass, vel + 6)
    for k in (1, 2):
        for nm in tones[:3]:
            note(inst, t + k * b + random.gauss(0, 0.006), b * 0.9, nm, vel - 10 - (k - 1) * 3)


def pad(inst, t, dur, ch, vel=50, top=True):
    """sustained chord for strings / pad / cello"""
    bass, left, tones = V[ch]
    names = [left[0], left[1]] + ([tones[1], tones[2]] if top else [tones[1]])
    for nm in names:
        note(inst, t, dur + 0.25, nm, vel, human=False)


def melody(inst, t0, line, beat, vel=62, legato=1.05):
    """line: list of (pitch or None, beats). Returns the end time."""
    t = t0
    for p, b in line:
        if p:
            note(inst, t + random.gauss(-0.01, 0.01), b * beat * legato, p, vel + random.randint(-4, 5))
        t += b * beat
    return t


def pick(t, ch, dur, vel=52, pattern=(0, 2, 1, 3, 2, 1, 3, 2)):
    """fingerpicked nylon guitar over one chord"""
    bass, left, tones = V[ch]
    b = n(bass) if n(bass) >= 40 else n(bass) + 12
    note("guitar", t, dur * 0.95, b, vel + 4)
    step = dur / len(pattern)
    for k, idx in enumerate(pattern):
        note("guitar", t + k * step, step * 2.4, n(tones[idx]) - 12, vel - (k % 2) * 6)


def strum(t, ch, vel=58, spread=0.03, down=True):
    """one guitar strum; spread is the time between strings (bigger = clumsier)"""
    bass, left, tones = V[ch]
    notes = [n(left[0]), n(left[1])] + [n(x) - 12 for x in tones]
    if not down:
        notes = notes[::-1]
    for i, p in enumerate(notes):
        note("guitar", t + i * spread, 1.6, p, vel - i * 2)


def bar_strums(t, ch, dur, vel=56):
    for off, d in [(0, True), (0.375, False), (0.5, True), (0.75, False)]:
        strum(t + off * dur, ch, vel - (0 if d else 10), 0.022, d)


def setup():
    for inst, c in CH.items():
        events.append((0, -1, mido.Message("program_change", channel=c, program=PROG[inst])))
        cc(inst, 0, 7, VOLUME[inst])
        cc(inst, 0, 91, 90)  # reverb send
        cc(inst, 0, 11, 100)
    cc("piano", 0, 91, 70)


setup()


def timeline(path=None):
    """narration timings by line id from build/timeline.json: T = timeline(); T["hook"]["a"], T["hook"]["b"]; T["_end"], T["_duration"]"""
    import json, os
    path = path or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "build", "timeline.json")
    tl = json.load(open(path))
    T = {l["id"]: l for l in tl["lines"]}
    T["_end"], T["_duration"] = tl["end"], tl["duration"]
    return T


def write(path):
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=500000, time=0))
    last = 0
    for tsec, _, msg in events:
        tick = int(round(tsec * TPS))
        msg.time = tick - last
        last = tick
        tr.append(msg)
    tr.append(mido.MetaMessage("end_of_track", time=int(2.0 * TPS)))
    mid.save(path)
    print("events", len(events), "->", path)
