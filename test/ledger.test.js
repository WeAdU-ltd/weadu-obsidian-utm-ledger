"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const utm = require("./utm");

test("ledger leaves a blank line between a new table and the text after it", function () {
  const added = utm.appendLedger("## UTM ledger\n\nNotes below.", "| 2026-10-20 | x | a | b | c |  |  |");
  assert.match(added, /\| 2026-10-20 \| x \| a \| b \| c \|  \|  \|\n\nNotes below\./);
});

test("ledger insertion touches only the end of the note or the table", function () {
  const row = "| r |";
  const header = utm.ledgerHeader();
  const cases = [
    ["", "## UTM ledger\n\n" + header + "\n| r |\n"],
    ["Brief", "Brief\n\n## UTM ledger\n\n" + header + "\n| r |\n"],
    ["Brief\n", "Brief\n\n## UTM ledger\n\n" + header + "\n| r |\n"],
    ["Brief\n\n", "Brief\n\n## UTM ledger\n\n" + header + "\n| r |\n"],
    ["## UTM ledger", "## UTM ledger\n\n" + header + "\n| r |\n"],
    ["## UTM ledger\n", "## UTM ledger\n\n" + header + "\n| r |\n"],
    ["## UTM ledger\n\n", "## UTM ledger\n\n" + header + "\n| r |\n"],
    ["## UTM ledger\n\n" + header + "\n| a |", "## UTM ledger\n\n" + header + "\n| a |\n| r |"],
    ["## UTM ledger\n\n" + header + "\n| a |\n\nAfter", "## UTM ledger\n\n" + header + "\n| a |\n| r |\n\nAfter"],
  ];
  for (const [before, after] of cases) {
    const ins = utm.ledgerInsertion(before, row);
    assert.equal(utm.applyInsertion(before, ins), after, JSON.stringify(before));
    // The insertion is pure addition: removing the inserted text gives back the original note.
    assert.equal(utm.applyInsertion(before, ins).replace(ins.text, ""), before);
  }
});

test("check ignores links without UTM and reports line numbers", function () {
  const report = utm.checkNote("a https://x.example/\nb https://x.example/?utm_source=a&utm_medium=b\nc https://x.example/?utm_source=a&utm_medium=b&utm_campaign=c");
  assert.equal(report.withoutUtm, 1);
  assert.equal(report.complete, 1);
  assert.equal(report.faulty.length, 1);
  assert.equal(report.faulty[0].line, 2);
  assert.deepEqual(report.faulty[0].findings.map((f) => f.code), ["missing_utm_campaign"]);
});
