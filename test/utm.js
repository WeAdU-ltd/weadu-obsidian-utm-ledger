"use strict";
// Pure logic from src/utm.ts, compiled by test.sh (node esbuild.config.mjs test).
const utm = require("./.build/utm.cjs");
// Whole-note view of a ledger insertion, for readable assertions.
utm.appendLedger = function (markdown, row) {
  const insertion = utm.ledgerInsertion(markdown, row);
  return insertion ? utm.applyInsertion(markdown, insertion) : markdown;
};
module.exports = utm;
