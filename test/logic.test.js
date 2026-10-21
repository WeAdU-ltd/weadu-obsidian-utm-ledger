"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const utm = require("./utm");

const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures.json"), "utf8"));

function codes(findings) {
  return findings.map(function (row) { return row.code; }).sort();
}

test("utm fixtures", function () {
  for (const row of fixtures.utm) {
    const built = utm.buildUtmUrl(row.input);
    assert.equal(built.ok, row.ok, row.name);
    if (row.ok) assert.equal(built.url, row.url, row.name);
    else assert.deepEqual(codes(built.errors), row.codes.slice().sort(), row.name);
  }
});

test("utm inspect and ledger", function () {
  const raw = "See https://shop.example/p?utm_source=google&utm_medium=cpc.";
  const urls = utm.extractUrls(raw);
  assert.deepEqual(urls, ["https://shop.example/p?utm_source=google&utm_medium=cpc"]);
  assert.deepEqual(codes(utm.inspectUrl(urls[0])), ["missing_utm_campaign"]);

  const input = { url: "https://shop.example/p", source: "google", medium: "cpc", campaign: "spring" };
  const row = utm.ledgerRow(input, "2026-10-16");
  assert.match(row, /2026-10-16/);
  assert.match(row, /utm_campaign=spring/);

  const note = "Brief\n";
  const once = utm.appendLedger(note, row);
  assert.match(once, /## UTM ledger/);
  const twice = utm.appendLedger(once, row);
  const occurrences = twice.split(row).length - 1;
  assert.equal(occurrences, 1, "the same URL is not added twice");
  assert.equal(twice.split("## UTM ledger").length - 1, 1);
});
