#!/bin/sh
# Local checks. Shared logic tests come from WeAdU-ltd/weadu-com-webflow tools/wea-323.
set -eu
cd "$(dirname "$0")"
node build.js && git diff --quiet -- main.js 2>/dev/null || true
cmp lib/utm.js test/utm.js
node --test --test-name-pattern="utm" test/logic.test.js
node -e "JSON.parse(require(\"fs\").readFileSync(\"manifest.json\"))"
echo "weadu-obsidian-utm-ledger ok"
