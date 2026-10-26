"""ideas.py — random story ingredients, so no two students get the same ideas.

    python3 SKILL/scripts/ideas.py <type> [n=12]
    types: whatif | documentary | emotional | action | explainer | any

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
SETS = {"whatif": WHATIF, "documentary": DOC, "emotional": EMO, "action": ACTION, "explainer": EXPLAIN}


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
