"use strict";
// Pure logic from src/utm.ts, compiled by test.sh (node esbuild.config.mjs test).
const utm = require("./.build/utm.cjs");
// Whole-note view of a ledger insertion, for readable assertions.
utm.appendLedger = function (markdown, row) {
  return utm.applyInsertion(markdown, utm.ledgerInsertion(markdown, row));
};
module.exports = utm;
