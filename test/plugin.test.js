"use strict";
// Tests for the shipped files of this plugin: lib/utm.js, the built main.js
// (loaded with a stubbed "obsidian" module), manifest.json, and versions.json.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const utm = require("./utm");
const stub = require("./obsidian-stub");

function codes(list) {
  return list.map(function (row) { return row.code; }).sort();
}

async function loadPlugin(saved) {
  const PluginClass = stub.loadPlugin(path.join(root, "main.js"));
  const plugin = new PluginClass({}, {});
  plugin.stored = saved || null;
  await plugin.onload();
  return plugin;
}

function modalSettings() {
  return stub.settingsIn(stub.Modal.last.contentEl);
}

async function fill(values) {
  for (const setting of modalSettings()) {
    if (setting.name && Object.prototype.hasOwnProperty.call(values, setting.name)) {
      await setting.texts[0].type(values[setting.name]);
    }
  }
}

function button(label) {
  for (const setting of modalSettings()) {
    for (const b of setting.buttons) if (b.text === label) return b;
  }
  throw new Error("button not found: " + label);
}

test("manifest follows Obsidian community plugin rules", function () {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  const versions = JSON.parse(fs.readFileSync(path.join(root, "versions.json"), "utf8"));
  for (const key of ["id", "name", "version", "minAppVersion", "description", "author", "authorUrl"]) {
    assert.ok(manifest[key], "manifest." + key);
  }
  assert.match(manifest.id, /^[a-z0-9-]+$/);
  assert.equal(/obsidian/i.test(manifest.id), false, "id must not contain obsidian");
  assert.equal(/obsidian/i.test(manifest.name), false, "name must not contain Obsidian");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.ok(manifest.description.length <= 250);
  assert.match(manifest.description, /\.$/);
  assert.equal(versions[manifest.version], manifest.minAppVersion);
  assert.equal(manifest.authorUrl, "https://weadu.com");
});

test("shipped code makes no network call", function () {
  const bundle = fs.readFileSync(path.join(root, "main.js"), "utf8");
  for (const word of ["fetch(", "requestUrl", "XMLHttpRequest", "WebSocket", "require(\"http", "require(\"https", "sendBeacon"]) {
    assert.equal(bundle.includes(word), false, word);
  }
});

test("plugin registers its two commands and a settings tab", async function () {
  const plugin = await loadPlugin();
  assert.deepEqual(Object.keys(plugin.commands).sort(), ["check-utm-links", "insert-utm-url"]);
  assert.equal(plugin.commands["insert-utm-url"].name, "Insert campaign URL");
  assert.equal(plugin.commands["check-utm-links"].name, "Check campaign links in the current note");
  assert.equal(plugin.settingTabs.length, 1);
  assert.deepEqual(plugin.settings, { source: "", medium: "", campaign: "" });
});

test("settings tab (before Obsidian 1.13) shows a discreet WeAdU credit and saves trimmed defaults", async function () {
  const plugin = await loadPlugin();
  const tab = plugin.settingTabs[0];
  tab.display();
  assert.equal(tab.containerEl.find(function (el) { return el.tag === "h2"; }), null, "no heading");
  const credit = tab.containerEl.find(function (el) { return el.tag === "p"; });
  assert.ok(credit.classes.includes("setting-item-description"));
  assert.equal(credit.text, "Made by ");
  assert.equal(credit.children[0].href, "https://weadu.com");
  assert.equal(credit.children[0].text, "weadu.com");
  assert.equal(tab.containerEl.children[tab.containerEl.children.length - 1], credit, "credit comes last");
  const settings = stub.settingsIn(tab.containerEl);
  assert.deepEqual(settings.map(function (s) { return s.name; }), ["Default source", "Default medium", "Default campaign"]);
  await settings[0].texts[0].type("  newsletter ");
  assert.deepEqual(plugin.stored, { source: "newsletter", medium: "", campaign: "" });
});

test("declarative settings (Obsidian 1.13+) list the same fields and trim on save", async function () {
  const plugin = await loadPlugin({ source: "google", medium: "", campaign: "" });
  const tab = plugin.settingTabs[0];
  const defs = tab.getSettingDefinitions();
  assert.deepEqual(defs.map(function (d) { return d.name; }), ["Default source", "Default medium", "Default campaign", "About"]);
  assert.deepEqual(defs.slice(0, 3).map(function (d) { return d.control.key; }), ["source", "medium", "campaign"]);
  assert.equal(defs[3].searchable, false);
  assert.equal(tab.getControlValue("source"), "google");
  await tab.setControlValue("medium", "  cpc ");
  assert.deepEqual(plugin.stored, { source: "google", medium: "cpc", campaign: "" });
  const setting = new stub.Setting({ createEl: function () { return { createEl: function () { return {}; } }; } });
  setting.descEl = { children: [], createEl: function (tag, opts) { const el = { tag: tag, text: opts.text, children: [], createEl: function (t, o) { const c = { tag: t, text: o.text, href: o.href }; el.children.push(c); return c; } }; this.children.push(el); return el; } };
  defs[3].render(setting);
  assert.equal(setting.descEl.children[0].children[0].href, "https://weadu.com");
});

test("insert command writes the URL and adds only the ledger lines, without rewriting the note", async function () {
  const plugin = await loadPlugin({ source: "google", medium: "cpc", campaign: "" });
  const editor = new stub.FakeEditor("Brief\n", { line: 1, ch: 0 });
  plugin.commands["insert-utm-url"].editorCallback(editor);
  const modal = stub.Modal.last;
  assert.ok(modal.isOpen);
  assert.equal(modal.titleEl.text, "Campaign URL");
  assert.equal(modal.values.source, "google", "default source is prefilled");
  await fill({ "Landing URL": "https://shop.example/p?color=blue", Campaign: "Spring" });
  button("Insert URL and ledger row").click();
  assert.equal(modal.isOpen, false);
  assert.equal(editor.setValueCalls, 0, "the note is never replaced as a whole");
  const url = "https://shop.example/p?color=blue&utm_source=google&utm_medium=cpc&utm_campaign=spring";
  assert.ok(editor.text.startsWith("Brief\n" + url), editor.text);
  assert.match(editor.text, /## UTM ledger\n\n\| Date \| URL \| Source \| Medium \| Campaign \| Content \| Term \|/);
  assert.match(editor.text, /\| \d{4}-\d{2}-\d{2} \| https:\/\/shop\.example\/p\?color=blue&utm_source=google&utm_medium=cpc&utm_campaign=spring \| google \| cpc \| spring \|  \|  \|\n$/);

  // Second insertion: one more row in the same table, nothing else moves.
  const before = editor.text;
  editor.cursor = { line: 0, ch: 0 };
  plugin.commands["insert-utm-url"].editorCallback(editor);
  await fill({ "Landing URL": "https://shop.example/q", Campaign: "fall" });
  button("Insert URL and ledger row").click();
  assert.equal(editor.setValueCalls, 0);
  assert.equal(editor.text.split("## UTM ledger").length - 1, 1);
  assert.equal(editor.text.split("| Date |").length - 1, 1);
  assert.ok(editor.text.endsWith(before.slice(before.indexOf("| --- |")).replace(/\n$/, "") + "\n" + editor.text.split("\n").filter(function (l) { return l.includes("utm_campaign=fall"); }).pop() + "\n") || /utm_campaign=spring[^\n]*\n\| [^\n]*utm_campaign=fall/.test(editor.text), editor.text);
});

test("insert command with invalid input shows a notice and leaves the note alone", async function () {
  const plugin = await loadPlugin();
  const editor = new stub.FakeEditor("Brief", { line: 0, ch: 5 });
  plugin.commands["insert-utm-url"].editorCallback(editor);
  const modal = stub.Modal.last;
  await fill({ "Landing URL": "ftp://shop.example", Source: "google ads", Medium: "cpc", Campaign: "spring" });
  const before = stub.notices.length;
  button("Insert URL").click();
  assert.equal(modal.isOpen, true);
  assert.equal(editor.text, "Brief");
  const message = stub.notices[before];
  assert.match(message, /Landing URL must start with http:\/\/ or https:\/\//);
  assert.match(message, /no spaces/);
});

test("check command reports only faulty campaign links, in a modal, without editing the note", async function () {
  const plugin = await loadPlugin();
  const note = [
    "Good: https://shop.example/a?utm_source=google&utm_medium=cpc&utm_campaign=spring.",
    "Docs: https://help.example/article (no UTM, not a campaign link)",
    "Bad: https://shop.example/b?utm_source=google&utm_source=bing&utm_campaign=",
  ].join("\n");
  const editor = new stub.FakeEditor(note, { line: 1, ch: 0 });
  plugin.commands["check-utm-links"].editorCallback(editor);
  assert.equal(editor.text, note, "the note is not modified");
  const modal = stub.Modal.last;
  assert.ok(modal.isOpen);
  assert.equal(modal.titleEl.text, "Campaign link check");
  const text = modal.contentEl.allText();
  assert.match(text, /1 link to fix, 1 complete, 1 without UTM parameters/);
  assert.match(text, /Line 3: utm_source is repeated\. utm_medium is missing\. utm_campaign is empty\./);
  assert.match(text, /https:\/\/shop\.example\/b/);
  assert.equal(/shop\.example\/a|help\.example/.test(text), false, "good and non-campaign links are not listed");

  const before = stub.notices.length;
  const clean = new stub.FakeEditor("Only https://help.example/x and https://shop.example/a?utm_source=g&utm_medium=c&utm_campaign=s", { line: 0, ch: 0 });
  stub.Modal.last = null;
  plugin.commands["check-utm-links"].editorCallback(clean);
  assert.equal(stub.Modal.last, null, "no modal when nothing to fix");
  assert.match(stub.notices[before], /No UTM link to fix: 1 complete, 1 without UTM parameters\./);
});

test("inspectUrl edge cases", function () {
  assert.deepEqual(codes(utm.inspectUrl("not a url")), ["url_invalid"]);
  assert.deepEqual(codes(utm.inspectUrl("mailto:a@b.example")), ["url_protocol"]);
  assert.deepEqual(codes(utm.inspectUrl("https://a.example/?utm_source=goo%20gle&utm_medium=cpc&utm_campaign=x")), ["utm_value_invalid"]);
  assert.deepEqual(codes(utm.inspectUrl("https://a.example/")), [], "a link without any utm_ parameter is not a campaign link");
  assert.deepEqual(codes(utm.inspectUrl("https://a.example/?utm_source=x")), ["missing_utm_campaign", "missing_utm_medium"]);
});

test("buildUtmUrl rejects long values and missing URL", function () {
  const long = utm.buildUtmUrl({ url: "https://a.example", source: "a".repeat(81), medium: "cpc", campaign: "x" });
  assert.deepEqual(codes(long.errors), ["utm_value_invalid"]);
  const ok = utm.buildUtmUrl({ url: "https://a.example", source: "a".repeat(80), medium: "cpc", campaign: "x" });
  assert.equal(ok.ok, true);
  assert.deepEqual(codes(utm.buildUtmUrl({}).errors), ["url_required", "utm_campaign_required", "utm_medium_required", "utm_source_required"]);
});

test("ledger row keeps an invalid value visible but leaves the URL cell empty", function () {
  const row = utm.ledgerRow({ url: "https://a.example", source: "a", medium: "b", campaign: "c", content: "x|y" }, "2026-10-20");
  assert.equal(row, "| 2026-10-20 |  | a | b | c | x\\|y |  |");
});

test("ledger is created under an existing heading and keeps the text after it", function () {
  const row = "| 2026-10-20 | https://a.example/ | a | b | c |  |  |";
  const added = utm.appendLedger("Intro\n\n## UTM ledger\n\nNotes below.", row);
  assert.match(added, /## UTM ledger\n\n+\| Date \|.*\n\| --- \|.*\n\| 2026-10-20 \|/);
  assert.match(added, /Notes below\./);
  assert.equal(added.split("## UTM ledger").length - 1, 1);
});

test("ledger rows are appended inside an existing table", function () {
  const table = utm.appendLedger("## UTM ledger\n\n" + utm.ledgerHeader() + "\n| old |\n\nAfter", "| new |");
  assert.match(table, /\| old \|\n\| new \|\n\nAfter/);
});

test("ledger leaves a blank line between a new table and the text after it", function () {
  const added = utm.appendLedger("## UTM ledger\n\nNotes below.", "| 2026-10-20 | x | a | b | c |  |  |");
  assert.match(added, /\|\n\nNotes below\./);
});

test("extractUrls trims trailing punctuation", function () {
  assert.deepEqual(utm.extractUrls("(see https://a.example/x), then https://b.example/y; done"), [
    "https://a.example/x",
    "https://b.example/y",
  ]);
});
