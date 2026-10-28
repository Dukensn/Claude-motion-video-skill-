"""ideas.py — random story ingredients, so no two students get the same ideas.

    python3 SKILL/scripts/ideas.py <type> [n=12]
    types: whatif | documentary | emotional | action | explainer | comedy | moral | digital | history | any

It prints a fresh random mix every run (seeded from the OS). Claude uses these as dice, never as finished
ideas: combine, twist and sharpen them into 10 original topics that fit the student's niche.
"""
import random, sys

R = random.SystemRandom()

WHATIF = {
    "change": ["disappeared", "doubled in size", "stopped spinning", "became invisible", "moved twice as close", "turned to glass",
               "went silent", "lost all its color", "ran out", "froze for one day", "became free for everyone", "could talk",
               "reversed", "lasted forever", "happened every day", "became illegal", "was the size of a house", "never existed"],
    "subject": ["the Moon", "the Sun", "oceans", "gravity", "sleep", "money", "the internet", "insects", "trees", "dinosaurs",
                "humans", "every volcano", "Antarctica", "salt", "clouds", "bees", "night", "the wheel", "electricity", "your memory",
                "time zones", "the Amazon", "mountains", "rain", "colors", "pain", "fire", "the Pacific", "ants", "the Earth's core"],
    "angle": ["first hour / first day / first year", "what YOU would notice at home", "the hidden domino effect",
              "who would win and who would lose", "a countdown", "the surprising upside", "a single stickman living through it"],
}
DOC = {
    "era": ["Ice Age", "first farmers", "ancient Egypt", "Rome", "Vikings", "Aztec cities", "medieval villages", "the Silk Road",
            "pirate age", "the first cities", "Mongol empire", "ancient China", "the industrial revolution", "early humans in Africa",
            "the Caribbean before 1492", "Haitian revolution", "the space race", "the age of sail"],
    "question": ["how did they survive", "what did they eat", "how did they sleep", "what did kids do all day", "how did they fight disease",
                 "how did they keep warm", "how did they tell time", "what happened when it rained for weeks", "how did they find water",
                 "how did they build it without machines", "what was the most dangerous job", "how did they talk across distances"],
    "hook": ["start with something you did this morning", "start with a weird object found in the ground", "start with a number",
             "start with 'you'", "start in the middle of a disaster", "start with a myth everyone believes"],
}
EMO = {
    "relationship": ["father and daughter", "two old friends", "grandmother and grandson", "a teacher and a shy student", "siblings",
                     "a mother working two jobs and her son", "neighbors who never talked", "a dog and its old owner", "first love",
                     "a soldier and his little brother", "a boss and a cleaner", "a kid and the school bully", "twins separated young"],
    "object": ["a voicemail never deleted", "a lunchbox note", "an unfinished drawing", "a bus ticket", "a jar of coins", "a lost glove",
               "a recipe card", "a broken watch", "a kite", "a photo with one face torn off", "a guitar pick", "a birthday cake candle"],
    "antagonist": ["Pride", "Fear", "Someday", "Shame", "Anger", "Screens", "Silence", "Busyness", "Comparison", "Forgetting", "Doubt"],
    "twist": ["the other person was trying too", "the gift was for them all along", "it was the last time and nobody knew",
              "the roles reverse years later", "the small habit saved a life", "the letter arrives 20 years late"],
}
ACTION = {
    "setting": ["rooftops at night", "a desert temple", "a moving train", "a dojo in the rain", "a junkyard", "a frozen lake",
                "a skyscraper under construction", "a jungle bridge", "a subway station", "a volcano rim", "a library after hours"],
    "rival": ["a former best friend", "a robot copy of the hero", "a masked thief", "a giant much bigger than him", "an army of shadows",
              "his own reflection", "a champion who never lost"],
    "power": ["only a broom", "speed but no strength", "can't use his arms", "glitches in and out", "copies any move he sees",
              "a single arrow", "the environment itself"],
    "stakes": ["a kid's lost kite", "the last slice of pizza", "the city's power", "his master's honor", "a stolen sketchbook", "the final"],
}
EXPLAIN = {
    "topic": ["how vaccines train the body", "why the sky is blue", "how compound interest works", "how a plane stays up",
              "why we dream", "how the heart pumps", "how a bill becomes law", "how batteries store energy", "why we procrastinate",
              "how earthquakes happen", "how the stock market works", "why ice floats", "how habits form", "how GPS knows where you are"],
    "device": ["a stickman shrinks to see it up close", "a race between two stickmen", "a kitchen analogy", "a city as a body",
               "a countdown timer", "before / after split screen", "a stickman tries and fails three times"],
}
COMEDY = {
    "who": ["a baker", "a nervous robber", "a tiny boss", "a grandma with a leaf blower", "a security guard on day one", "a wedding DJ",
            "a delivery rider", "a magician whose tricks work too well", "a mime", "a lifeguard who can't swim", "a chef and a food critic"],
    "wants": ["the last croissant", "one quiet nap", "the perfect selfie", "to win the parking spot", "a cold drink on the hottest day",
              "to hide a broken vase", "to look cool in front of a crush", "the TV remote", "to catch the bus", "a free sample"],
    "obstacle": ["a pigeon", "a vending machine", "a sneeze", "an automatic door", "a GPS voice", "a toddler", "a goat", "a wet floor sign",
                 "a seagull gang", "a self-checkout", "a balloon", "the wind"],
    "button": ["the obstacle gets the prize", "it happens again to someone else", "the hero gives up and it works", "a tiny tender moment",
               "the camera reveals who was watching", "the prize was fake"],
}
MORAL = {
    "temptation": ["the phone at 3 AM", "pride", "envy", "comparison", "lust vs love", "procrastination", "anger", "fear of failing",
                   "shortcuts", "gossip", "money first", "people-pleasing", "laziness", "lying to look good"],
    "counter": ["SCROLLED / CALLED MOM", "SEEN / KNOWN", "DRAFTS / SENT", "PLANS / STARTED", "LIKES / FRIENDS", "EXCUSES / STEPS",
                "SAVED / SPENT", "SAID SORRY / MEANT IT"],
    "real_life": ["a mother waiting", "a friend at the café", "the bus stop girl with the yellow umbrella", "a little brother's drawing",
                  "a grandfather's last call", "a coach who believed", "a neighbour who needs help"],
    "ending": ["the shadow loses", "the shadow wins (bitter)", "too late, then a second chance", "open: the phone rings", "roles reverse"],
}
DIGITAL = {
    "world": ["a spreadsheet", "a code editor", "a phone home screen", "a settings menu", "a calculator", "a maps app", "a photo editor",
              "an email inbox", "a printer queue", "a music app", "a password form", "a loading bar", "a chat app", "a platform-game level"],
    "villain": ["an error message", "a pop-up ad", "a virus", "the spinning wheel", "autocorrect", "a captcha", "a low-battery warning",
                "a 404 page", "a cookie banner", "a stuck update"],
    "power": ["copy-paste clones", "Ctrl+Z rewinds time", "the delete key", "drag and drop", "zoom", "dark mode", "the undo history",
              "the fill handle", "the volume slider", "screenshot freeze"],
    "twist": ["the cursor is on the villain's side", "the user closes the app", "he escapes to the desktop", "the battery dies",
              "he becomes the new error", "it was all a tutorial"],
}
HISTORY = {
    "figure": ["Toussaint Louverture", "Jean-Jacques Dessalines", "Henri Christophe and the Citadelle", "Queen Nzinga", "Mansa Musa",
               "Hannibal crossing the Alps", "Cleopatra", "Genghis Khan", "Joan of Arc", "the Taíno before 1492", "Shaka Zulu",
               "the Great Wall builders", "Harriet Tubman", "Simón Bolívar", "the samurai's last battle", "the Library of Alexandria"],
    "angle": ["the profile card (✓ ✓ ✓)", "one decision that changed everything", "the betrayal", "the underdog", "what a normal day looked like",
              "the myth vs the fact", "the map that grows", "the object that survived"],
    "hook": ["start with the ending", "start with a number", "start with a quote", "start with 'imagine you are…'", "start with the map"],
}
SETS = {"whatif": WHATIF, "documentary": DOC, "emotional": EMO, "action": ACTION, "explainer": EXPLAIN,
        "comedy": COMEDY, "moral": MORAL, "digital": DIGITAL, "history": HISTORY}


def roll(kind, n):
    S = SETS[kind]
    print(f"# {kind} ingredients (random, combine and twist them; do not use as-is)")
    for i in range(n):
        print(f"{i + 1:2d}. " + "  |  ".join(f"{k}: {R.choice(v)}" for k, v in S.items()))


if __name__ == "__main__":
    kind = sys.argv[1] if len(sys.argv) > 1 else "any"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 12
    for k in (SETS if kind == "any" else [kind]):
        roll(k, n if kind != "any" else 4)
        print()
