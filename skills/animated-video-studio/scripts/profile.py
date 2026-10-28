"""profile.py — the student's studio memory: their chosen menu number, settings, and every video already made
(so the next idea, cast and set are always new).

    python3 SKILL/scripts/profile.py get                 # prints the profile JSON ({} if none)
    python3 SKILL/scripts/profile.py set key=value ...   # e.g. number=8 voice=gemini format=16:9 language=fr count=3
    python3 SKILL/scripts/profile.py made '<json>'       # append a finished video: {"title","premise","cast","sets","tone","date"}
    python3 SKILL/scripts/profile.py used                # one line per past video, to read before inventing a new one

The file is .studio/profile.json in the current directory (the student's copy of the repository).
Cloud sessions start from a fresh clone, so `get` also looks for the newest copy on any branch already pushed
(git) and restores it; after `set` / `made`, commit and push .studio/profile.json with the session's work.
"""
import json, os, subprocess, sys, time

PATH = os.path.join(".studio", "profile.json")


def git(*a):
    r = subprocess.run(["git", *a], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else ""


def newest_from_branches():
    """Newest committed .studio/profile.json across local and remote branches (cloud sessions start on a new branch)."""
    if not git("rev-parse", "--is-inside-work-tree"):
        return None
    git("fetch", "--quiet", "--all")
    best = None
    for ref in git("for-each-ref", "--format=%(refname)", "refs/heads", "refs/remotes").splitlines():
        ts = git("log", "-1", "--format=%ct", ref, "--", PATH)
        if ts and (best is None or int(ts) > best[0]):
            best = (int(ts), ref)
    if not best:
        return None
    raw = git("show", f"{best[1]}:{PATH}")
    try:
        return json.loads(raw)
    except ValueError:
        return None


def load():
    if os.path.exists(PATH):
        return json.load(open(PATH))
    p = newest_from_branches()
    if p:
        save(p)
    return p or {}


def save(p):
    os.makedirs(os.path.dirname(PATH), exist_ok=True)
    json.dump(p, open(PATH, "w"), indent=1, ensure_ascii=False)


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "get"
    p = load()
    if cmd == "get":
        print(json.dumps(p, indent=1, ensure_ascii=False))
    elif cmd == "set":
        for kv in sys.argv[2:]:
            k, _, v = kv.partition("=")
            p[k] = int(v) if v.isdigit() else v
        p["updated"] = time.strftime("%Y-%m-%d")
        save(p); print(json.dumps(p, indent=1, ensure_ascii=False))
    elif cmd == "made":
        v = json.loads(sys.argv[2]); v.setdefault("date", time.strftime("%Y-%m-%d"))
        p.setdefault("made", []).append(v); save(p); print(f"{len(p['made'])} videos in the profile")
    elif cmd == "used":
        for v in p.get("made", []):
            print(f"- {v.get('title')} | {v.get('premise')} | cast: {v.get('cast')} | sets: {v.get('sets')} | tone: {v.get('tone')}")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
