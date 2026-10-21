#!/bin/sh
# Local checks: rebuild main.js, fail if it drifted, run the tests.
set -eu
cd "$(dirname "$0")"
node build.js
git diff --exit-code -- main.js
node --test test/
node -e "JSON.parse(require(\"fs\").readFileSync(\"manifest.json\"))"
echo "weadu-obsidian-utm-ledger ok"
