#!/bin/sh
# Full rebuild: voice, music, mix, page, long render, short cut.
set -e
mkdir -p build renders assets/audio
sh tools/voice.sh
sh tools/music.sh
python3 tools/mix.py
ffmpeg -v error -y -i build/premix.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 assets/audio/mix.wav
python3 tools/stems.py
python3 tools/build.py
npx hyperframes check
npx hyperframes render -o renders/atelye-ai-pub-nwa.mp4
python3 tools/build.py white
npx hyperframes render -o renders/atelye-ai-pub-blan.mp4
python3 tools/build.py
python3 tools/short.py renders/atelye-ai-pub-nwa.mp4
echo "Done: renders/atelye-ai-pub-nwa.mp4, renders/atelye-ai-pub-blan.mp4 and renders/atelye-ai-pub-5desanm-kout.mp4"
