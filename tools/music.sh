#!/bin/sh
# Loops the funk track (68 s) with a crossfade to cover the 114.5 s film -> build/score.wav
set -e
ffmpeg -v error -y -i in/music-funk.mp3 -i in/music-funk.mp3 -filter_complex "[0:a][1:a]acrossfade=d=3:c1=tri:c2=tri,atrim=0:114.5,afade=t=out:st=112.0:d=2.5,aresample=48000,aformat=channel_layouts=stereo" -c:a pcm_s16le build/score.wav
