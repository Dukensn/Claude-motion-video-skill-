# Video studio

This repository is an animation studio. When the user asks for a video (stickman, What if, documentary, short film, action, explainer, YouTube…), use the `animated-video-studio` skill (`skills/animated-video-studio/SKILL.md`) and follow it.

- Talk with the user in their language (Haitian Creole, French, English…).
- The user never installs or configures anything. In cloud sessions a start hook runs `skills/animated-video-studio/scripts/setup.sh`; if its log (`$TMPDIR/video-studio-setup.log` or `/tmp/video-studio-setup.log`) shows something missing, fix it yourself.
- Many users are on a phone: deliver finished videos, thumbnails and the YouTube text with the file-sending tool so they appear in the app, and keep messages short.
- Films go in `films/<slug>/` (git-ignored); don't commit renders.
