#!/bin/sh
# Local checks: type-check, lint with eslint-plugin-obsidianmd, rebuild main.js and fail if it drifted, run the tests.
set -eu
cd "$(dirname "$0")"
[ -d node_modules ] || npm ci --no-audit --no-fund
npx tsc --noEmit -p .
npx eslint --max-warnings 0 .
node esbuild.config.mjs
git diff --exit-code -- main.js
node esbuild.config.mjs test
node --test test/*.js
node -e "JSON.parse(require(\"fs\").readFileSync(\"manifest.json\"))"
echo "weadu-obsidian-utm-ledger ok"
