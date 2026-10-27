# Guide élève — faire une vidéo animée avec Claude Code

## Français

## Sur téléphone (application Claude)

Une seule fois :
1. Créez un compte GitHub gratuit sur github.com.
2. Ouvrez https://github.com/Dukensn/claude-motion-video-skill- et touchez **Use this template → Create a new repository** (ou **Fork**). Vous avez maintenant votre propre copie du studio.
3. Dans l'application Claude, ouvrez **Code**, connectez GitHub quand c'est demandé, et choisissez votre copie.

Pour chaque vidéo : ouvrez une nouvelle session sur votre copie et écrivez **« Je veux faire une vidéo animée pour YouTube. »** Claude vous envoie un menu d'images numérotées : répondez avec le numéro de votre choix. Il s'en souviendra la prochaine fois. Tout s'installe tout seul au démarrage (la première fois, ça peut prendre quelques minutes). Claude vous envoie la vidéo et la miniature directement dans la conversation : enregistrez-les sur votre téléphone.

Pour montrer une vidéo qui vous inspire, joignez le fichier vidéo à votre message (les liens YouTube ne s'ouvrent pas toujours depuis le téléphone).

**Voix** : par défaut, Claude utilise une voix naturelle (rien à faire). **Pour une voix plus émotionnelle (facultatif)**, une seule fois :
1. Créez votre clé gratuite sur **aistudio.google.com/apikey** (compte Google → *Create API key*). La vidéo du cours montre comment.
2. Dans l'application Claude, ouvrez le menu de l'environnement dans le titre de la session → **Edit** → ajoutez une variable `GEMINI_API_KEY` avec votre clé → enregistrez.
3. Ouvrez une nouvelle session : c'est réglé pour toujours.
Ne collez jamais votre clé dans le chat ni dans le dépôt. Elle est personnelle : ne la partagez avec personne.

## Sur ordinateur (Claude Code)

1. Ouvrez Claude Code dans un dossier vide, par exemple `mes-videos`.
2. La première fois seulement, collez ceci :

   > Installe le skill https://github.com/Dukensn/claude-motion-video-skill- : clone le dépôt, copie le dossier `skills/animated-video-studio` dans `~/.claude/skills/`, puis lance `bash ~/.claude/skills/animated-video-studio/scripts/setup.sh` et règle tout ce qui manque.

3. Ensuite, pour chaque vidéo, écrivez simplement : **« Je veux faire une vidéo animée pour YouTube. »** (vous pouvez écrire en kreyòl ou en français).
4. Claude vous pose quelques questions, vous propose 10 idées, puis vous montre le script et des images avant de faire la vidéo. **Donnez votre avis à chaque étape** : c'est votre vidéo, et c'est là que vous apprenez.
5. Vous avez une vidéo YouTube qui vous inspire ? Collez son lien : Claude l'étudie pour s'en inspirer, sans la copier. Si ça ne marche pas, glissez le fichier vidéo dans la conversation.
6. Le résultat est dans `films/<nom>/renders/` (la vidéo et la miniature), avec le titre et la description dans `films/<nom>/youtube.md`.

Astuce : le rendu prend du temps, environ 2 à 3 fois la durée de la vidéo. Laissez l'ordinateur allumé.

## Kreyòl ayisyen

## Sou telefòn (aplikasyon Claude)

Yon sèl fwa :
1. Kreye yon kont GitHub gratis sou github.com.
2. Louvri https://github.com/Dukensn/claude-motion-video-skill- epi touche **Use this template → Create a new repository** (oswa **Fork**). Kounye a ou gen pwòp kopi studio a.
3. Nan aplikasyon Claude, louvri **Code**, konekte GitHub lè yo mande w, epi chwazi kopi pa w la.

Pou chak videyo : louvri yon nouvo sesyon sou kopi w la epi ekri **« Mwen vle fè yon videyo anime pou YouTube. »** Claude ap voye yon meni imaj ak nimewo ba ou : reponn ak nimewo ou chwazi a. L ap sonje l pwochen fwa. Tout bagay enstale poukont yo lè sesyon an kòmanse (premye fwa a ka pran kèk minit). Claude ap voye videyo a ak miniati a dirèkteman nan konvèsasyon an : anrejistre yo sou telefòn ou.

Pou montre yon videyo ki enspire w, mete fichye videyo a ak mesaj ou (lyen YouTube pa toujou louvri depi telefòn).

**Vwa** : pa defo, Claude itilize yon vwa natirèl (ou pa gen anyen pou fè). **Pou yon vwa ki gen plis emosyon (si w vle)**, yon sèl fwa :
1. Kreye kle gratis ou sou **aistudio.google.com/apikey** (kont Google → *Create API key*). Videyo kou a montre kijan.
2. Nan aplikasyon Claude, louvri meni anviwònman an nan tit sesyon an → **Edit** → ajoute yon varyab `GEMINI_API_KEY` ak kle ou → anrejistre.
3. Louvri yon nouvo sesyon : li regle pou toujou.
Pa janm kole kle ou nan chat la ni nan depo a. Se pou ou sèlman : pa pataje l ak pèsonn.

## Sou òdinatè (Claude Code)

1. Louvri Claude Code nan yon dosye vid, pa egzanp `videyo-mwen`.
2. Premye fwa sèlman, kole sa a :

   > Installe le skill https://github.com/Dukensn/claude-motion-video-skill- : clone le dépôt, copie le dossier `skills/animated-video-studio` dans `~/.claude/skills/`, puis lance `bash ~/.claude/skills/animated-video-studio/scripts/setup.sh` et règle tout ce qui manque.

3. Apre sa, pou chak videyo, ekri tou senpleman : **« Mwen vle fè yon videyo anime pou YouTube. »**
4. Claude ap poze w kèk kesyon, l ap ba w 10 lide, epi l ap montre w script la ak kèk imaj anvan l fè videyo a. **Bay opinyon w nan chak etap** : se videyo pa w, e se la ou aprann.
5. Ou gen yon videyo YouTube ki enspire w ? Kole lyen li : Claude ap etidye l pou l enspire l, san l pa kopye l. Si sa pa mache, glise fichye videyo a nan konvèsasyon an.
6. Rezilta a nan `films/<non>/renders/` (videyo a ak miniati a), ak tit la ak deskripsyon an nan `films/<non>/youtube.md`.

Konsèy : rann videyo a pran tan, apeprè 2 a 3 fwa longè videyo a. Kite òdinatè a limen.
