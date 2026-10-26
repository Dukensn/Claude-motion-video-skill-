# Claude Motion Video Skill — films d'animation émouvants pour YouTube

Un skill pour **Claude Code** qui fabrique un court-métrage d'animation complet, sans voix, d'environ 4 minutes, dans le style des chaînes d'histoires émouvantes : une histoire originale, des personnages dessinés, des sous-titres, une musique générée (piano, cordes, guitare : de vrais instruments échantillonnés, pas un son robotique), des bruitages, la vidéo MP4 en 1920×1080, la miniature et le texte YouTube.

Deux styles :

| Bean (trait dessiné) | Silhouettes |
| --- | --- |
| ![](skills/animated-short-film/examples/thumbnails/unsent_thumbnail.png) | ![](skills/animated-short-film/examples/thumbnails/someday_thumbnail.png) |

## Installer

**Option 1 — le plus simple.** Dans Claude Code, collez :

> Installe le skill https://github.com/Dukensn/claude-motion-video-skill- : clone le dépôt et copie le dossier `skills/animated-short-film` dans `~/.claude/skills/`, puis lance son `scripts/setup.sh`.

**Option 2 — comme plugin.**

```
/plugin marketplace add Dukensn/claude-motion-video-skill-
/plugin install animated-short-film@motion-video
```

**Option 3 — à la main.**

```bash
git clone https://github.com/Dukensn/claude-motion-video-skill-.git
mkdir -p ~/.claude/skills && cp -R claude-motion-video-skill-/skills/animated-short-film ~/.claude/skills/
bash ~/.claude/skills/animated-short-film/scripts/setup.sh
```

Il faut : Node.js 18+, Python 3 (`mido`, `numpy`), ffmpeg, FluidSynth. `setup.sh` vérifie tout et installe ce qu'il peut. Sous Windows, utilisez WSL.

## Utiliser

Dans un dossier vide, dites à Claude Code :

> Fais-moi un court-métrage d'animation émouvant pour YouTube.

Le skill pose 4 questions (style, histoire ou « tu choisis », langue, durée), puis :

1. écrit l'histoire et vous montre le synopsis pour validation ;
2. construit le film et vous montre des planches d'images ;
3. compose la musique et le mixage ;
4. fait le rendu vidéo (10 à 20 minutes pour 4 minutes de film) ;
5. crée la miniature et le titre, la description et les chapitres YouTube.

Tout sort dans `./films/<nom-du-film>/` : `renders/<nom>.mp4`, `renders/thumbnail.png`, `youtube.md`.

Deux moments sont faits pour **votre** jugement : le synopsis et les planches d'images. C'est là que votre goût fait la différence.

## Ce qu'il y a dedans

```
skills/animated-short-film/
  SKILL.md              le déroulé que Claude suit
  references/           questions, structure des histoires, API des deux styles, musique, miniatures, YouTube, checklist qualité
  templates/            les deux moteurs de dessin (+ un film démo de 36 s chacun), la bibliothèque musique et mixage, les miniatures
  scripts/              setup, new-film, sheet (planches), audio, render, thumb
  examples/             quatre films complets (UNSENT, AGAIN, LITTLE BEAN, SOMEDAY) : code, musique, miniatures, textes YouTube
  licenses/             licences des polices et de GSAP
```

Les histoires doivent rester originales : même genre de personnages et de rythme que les chaînes de référence, jamais leurs personnages, intrigues ou titres.

Le rendu utilise [HyperFrames](https://github.com/heygen-com/hyperframes) en local ; aucune vidéo ni aucun fichier n'est envoyé en ligne.
