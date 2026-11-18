#!/bin/sh
# Cleaned voice (cuts in tools/cut.py) + a livelier tone -> assets/audio/voice.wav
set -e
python3 tools/cut.py
ffmpeg -v error -y -i assets/audio/voice.wav -af "highpass=f=80,equalizer=f=200:t=q:w=1:g=1.5,equalizer=f=3000:t=q:w=1.2:g=4,equalizer=f=9000:t=h:w=1:g=2.5,acompressor=threshold=-24dB:ratio=4:attack=4:release=90:makeup=2,loudnorm=I=-15:TP=-1.5:LRA=7" -ar 48000 build/voice-live.wav
mv build/voice-live.wav assets/audio/voice.wav
