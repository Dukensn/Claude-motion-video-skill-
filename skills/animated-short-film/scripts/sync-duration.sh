#!/usr/bin/env bash
# usage: sync-duration.sh <film-dir>  — copies FILM.DURATION from assets/js/film.js into every data-duration of index.html
set -euo pipefail
D="${1:?film dir}"
DUR=$(grep -oE 'const DURATION = [0-9.]+' "$D/assets/js/film.js" | grep -oE '[0-9.]+$')
[ -n "$DUR" ] || { echo "no 'const DURATION = N' in film.js" >&2; exit 1; }
sed -i.bak -E "s/data-duration=\"[0-9.]+\"/data-duration=\"$DUR\"/g" "$D/index.html" && rm -f "$D/index.html.bak"
echo "$DUR"
