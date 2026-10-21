"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const utm = require("../lib/utm");

test("ledger leaves a blank line between a new table and the text after it", function () {
  const added = utm.appendLedger("## UTM ledger\n\nNotes below.", "| 2026-10-20 | x | a | b | c |  |  |");
  assert.match(added, /\| 2026-10-20 \| x \| a \| b \| c \|  \|  \|\n\nNotes below\./);
});
