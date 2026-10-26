/* WeAdU UTM Ledger. Built with esbuild from src/. Do not edit. */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WeaduUtmLedger
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/utm.ts
var GOOGLE_ADS_TRACKING_NOTICE = "Google Ads clicks are tracked with auto-tagging (gclid) and a tracking template, not by pasting UTM parameters on the final URL.";
var UTM_ORDER = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
var REQUIRED = ["utm_source", "utm_medium", "utm_campaign"];
var OPTIONAL = ["utm_content", "utm_term"];
var VALUE_RE = /^[A-Za-z0-9._~-]+$/;
var MAX_VALUE = 80;
var FIELDS = ["source", "medium", "campaign", "content", "term"];
var LEDGER_HEADING = "## UTM ledger";
var MESSAGES = {
  url_required: "Landing URL is required.",
  url_invalid: "Landing URL is not a valid URL.",
  url_protocol: "Landing URL must start with http:// or https://.",
  utm_source_required: "utm_source is required.",
  utm_medium_required: "utm_medium is required.",
  utm_campaign_required: "utm_campaign is required.",
  utm_value_invalid: "Use letters, digits, and . _ ~ - with no spaces (80 characters max).",
  missing_utm_source: "utm_source is missing.",
  missing_utm_medium: "utm_medium is missing.",
  missing_utm_campaign: "utm_campaign is missing.",
  duplicate_utm_source: "utm_source is repeated.",
  duplicate_utm_medium: "utm_medium is repeated.",
  duplicate_utm_campaign: "utm_campaign is repeated.",
  empty_utm_source: "utm_source is empty.",
  empty_utm_medium: "utm_medium is empty.",
  empty_utm_campaign: "utm_campaign is empty."
};
function finding(code, field) {
  var _a;
  return { code, field, message: (_a = MESSAGES[code]) != null ? _a : code };
}
function normalizeValue(raw, field, required, errors, lowercased) {
  const value = (typeof raw === "string" ? raw : "").trim();
  if (!value) {
    if (required) errors.push(finding("utm_" + field + "_required", field));
    return "";
  }
  if (value.length > MAX_VALUE || !VALUE_RE.test(value)) {
    errors.push(finding("utm_value_invalid", field));
    return "";
  }
  const stored = value.toLowerCase();
  if (stored !== value) lowercased.push({ field, from: value, to: stored });
  return stored;
}
function parseHttpUrl(raw) {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch (e) {
    return null;
  }
}
function buildUtmUrl(input) {
  var _a;
  const errors = [];
  const lowercased = [];
  const rawUrl = ((_a = input.url) != null ? _a : "").trim();
  if (!rawUrl) errors.push(finding("url_required", "url"));
  const values = {};
  FIELDS.forEach((field, i) => {
    values[field] = normalizeValue(input[field], field, i < 3, errors, lowercased);
  });
  let parsed = null;
  if (rawUrl) {
    try {
      parsed = new URL(rawUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        errors.push(finding("url_protocol", "url"));
        parsed = null;
      }
    } catch (e) {
      errors.push(finding("url_invalid", "url"));
    }
  }
  if (errors.length || !parsed) return { ok: false, url: "", errors, lowercased };
  for (const name of UTM_ORDER) parsed.searchParams.delete(name);
  for (const field of FIELDS) {
    if (values[field]) parsed.searchParams.append("utm_" + field, values[field]);
  }
  return { ok: true, url: parsed.toString(), errors: [], lowercased };
}
function queryKeys(parsed) {
  const raw = parsed.search.startsWith("?") ? parsed.search.slice(1) : parsed.search;
  const keys = [];
  for (const part of raw.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const key = eq === -1 ? part : part.slice(0, eq);
    try {
      keys.push(decodeURIComponent(key));
    } catch (e) {
      keys.push(key);
    }
  }
  return keys;
}
function inspectUrl(raw) {
  let url;
  try {
    url = new URL(raw.trim());
  } catch (e) {
    return [finding("url_invalid", "url")];
  }
  const parsed = parseHttpUrl(url.toString());
  if (!parsed) return [finding("url_protocol", "url")];
  const keys = queryKeys(parsed);
  if (!keys.some((key) => key.toLowerCase().startsWith("utm_"))) return [];
  const findings = [];
  for (const name of REQUIRED) {
    const count = keys.filter((key) => key === name).length;
    if (count === 0) findings.push(finding("missing_" + name, name));
    else if (count > 1) findings.push(finding("duplicate_" + name, name));
    const value = parsed.searchParams.get(name);
    if (value !== null && value.trim() === "") findings.push(finding("empty_" + name, name));
    else noteValue(name, value, findings);
  }
  for (const name of OPTIONAL) noteValue(name, parsed.searchParams.get(name), findings);
  return findings;
}
function noteValue(name, value, findings) {
  if (value === null || value.trim() === "") return;
  if (value.length > MAX_VALUE || !VALUE_RE.test(value)) {
    findings.push(finding("utm_value_invalid", name));
    return;
  }
  if (value !== value.toLowerCase()) {
    findings.push({
      code: "utm_not_lowercase",
      field: name,
      message: name + " is not lower case (" + value + "). Stored form: " + value.toLowerCase() + "."
    });
  }
}
function extractUrls(text) {
  const re = /https?:\/\/[^\s<>\])"'`]+/gi;
  const out = [];
  let match;
  while ((match = re.exec(text)) !== null) out.push(match[0].replace(/[.,);:]+$/g, ""));
  return out;
}
function checkNote(text) {
  const report = { faulty: [], complete: 0, withoutUtm: 0 };
  text.split("\n").forEach((lineText, index) => {
    for (const url of extractUrls(lineText)) {
      const parsed = parseHttpUrl(url);
      const hasUtm = parsed !== null && queryKeys(parsed).some((key) => key.toLowerCase().startsWith("utm_"));
      if (!hasUtm) {
        report.withoutUtm++;
        continue;
      }
      const findings = inspectUrl(url);
      if (findings.length) report.faulty.push({ line: index + 1, url, findings });
      else report.complete++;
    }
  });
  return report;
}
function escapeCell(value) {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
function ledgerHeader() {
  return ["| Date | URL | Source | Medium | Campaign | Content | Term |", "| --- | --- | --- | --- | --- | --- | --- |"].join("\n");
}
function ledgerRow(input, isoDate) {
  const built = buildUtmUrl(input);
  const cells = [isoDate, built.ok ? built.url : ""].concat(FIELDS.map((field) => {
    var _a;
    return ((_a = input[field]) != null ? _a : "").trim().toLowerCase();
  }));
  return "| " + cells.map(escapeCell).join(" | ") + " |";
}
function ledgerInsertion(markdown, row) {
  const lines = markdown.split("\n");
  const lastLine = lines.length - 1;
  const end = { line: lastLine, ch: lines[lastLine].length };
  const table = ledgerHeader() + "\n" + row;
  const headingAt = lines.findIndex((line) => line.trim() === LEDGER_HEADING);
  if (headingAt === -1) {
    let lead = "";
    if (markdown.trim() !== "") lead = markdown.endsWith("\n\n") ? "" : markdown.endsWith("\n") ? "\n" : "\n\n";
    return { pos: end, text: lead + LEDGER_HEADING + "\n\n" + table + "\n" };
  }
  let cursor = headingAt + 1;
  while (cursor < lines.length && lines[cursor].trim() === "") cursor++;
  if (cursor >= lines.length) {
    const lead = headingAt === lastLine ? "\n\n" : end.ch === 0 && lines[lastLine - 1].trim() === "" ? "" : "\n";
    return { pos: end, text: lead + table + "\n" };
  }
  if (!lines[cursor].startsWith("| Date |")) {
    return { pos: { line: cursor, ch: 0 }, text: table + "\n\n" };
  }
  let last = cursor;
  while (last + 1 < lines.length && lines[last + 1].startsWith("|")) last++;
  const url = rowUrl(row);
  if (url && lines.slice(cursor + 2, last + 1).some((line) => rowUrl(line) === url)) return null;
  if (last === lastLine) return { pos: end, text: "\n" + row };
  return { pos: { line: last + 1, ch: 0 }, text: row + "\n" };
}
function rowUrl(row) {
  const cells = row.split(/(?<!\\)\|/);
  return cells.length > 2 ? cells[2].trim() : "";
}

// src/main.ts
var DEFAULTS = { source: "", medium: "", campaign: "" };
function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
function today() {
  const date = /* @__PURE__ */ new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
var UtmModal = class extends import_obsidian.Modal {
  constructor(app, defaults, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
    this.values = { url: "", source: defaults.source, medium: defaults.medium, campaign: defaults.campaign, content: "", term: "" };
  }
  onOpen() {
    this.contentEl.addClass("weadu-utm-modal");
    this.titleEl.setText("Campaign URL");
    this.contentEl.createEl("p", { cls: "setting-item-description", text: GOOGLE_ADS_TRACKING_NOTICE });
    this.field("Landing URL", "url", "https://");
    this.field("Source", "source", "google");
    this.field("Medium", "medium", "cpc");
    this.field("Campaign", "campaign", "spring-shirts");
    this.field("Content", "content", "");
    this.field("Term", "term", "");
    new import_obsidian.Setting(this.contentEl).addButton(
      (button) => button.setButtonText("Insert URL").setCta().onClick(() => {
        if (this.onSubmit(this.values, false)) this.close();
      })
    ).addButton(
      (button) => button.setButtonText("Insert URL and ledger row").onClick(() => {
        if (this.onSubmit(this.values, true)) this.close();
      })
    );
  }
  field(name, key, placeholder) {
    new import_obsidian.Setting(this.contentEl).setName(name).addText(
      (text) => {
        var _a;
        return text.setPlaceholder(placeholder).setValue((_a = this.values[key]) != null ? _a : "").onChange((value) => {
          this.values[key] = value;
        });
      }
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var CheckModal = class extends import_obsidian.Modal {
  constructor(app, report) {
    super(app);
    this.report = report;
  }
  onOpen() {
    const { faulty, complete, withoutUtm } = this.report;
    this.titleEl.setText("Campaign link check");
    this.contentEl.createEl("p", { cls: "setting-item-description", text: GOOGLE_ADS_TRACKING_NOTICE });
    this.contentEl.createEl("p", {
      text: `${plural(faulty.length, "link")} to fix, ${complete} complete, ${withoutUtm} without UTM parameters (not checked).`
    });
    const list = this.contentEl.createEl("ul");
    for (const link of faulty) {
      const item = list.createEl("li");
      item.createDiv({ text: `Line ${link.line}: ${link.findings.map((row) => row.message).join(" ")}` });
      item.createEl("code", { text: link.url });
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var UtmSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  // Obsidian 1.13 and later: declarative settings, searchable from the settings search.
  getSettingDefinitions() {
    const text = (name, key, placeholder) => ({
      name,
      control: { type: "text", key, placeholder }
    });
    return [
      text("Default source", "source", "google"),
      text("Default medium", "medium", "cpc"),
      text("Default campaign", "campaign", "spring-shirts"),
      { name: "About", searchable: false, render: (setting) => this.credit(setting.descEl) }
    ];
  }
  getControlValue(key) {
    return this.plugin.settings[key];
  }
  async setControlValue(key, value) {
    this.plugin.settings[key] = typeof value === "string" ? value.trim() : "";
    await this.plugin.saveSettings();
  }
  // Obsidian before 1.13.
  display() {
    const { containerEl } = this;
    containerEl.empty();
    this.pref("Default source", "source");
    this.pref("Default medium", "medium");
    this.pref("Default campaign", "campaign");
    this.credit(containerEl);
  }
  credit(el) {
    const line = el.createEl("p", { cls: "setting-item-description weadu-utm-credit", text: "Made by " });
    line.createEl("a", { text: "weadu.com", href: "https://weadu.com" });
  }
  pref(name, key) {
    new import_obsidian.Setting(this.containerEl).setName(name).addText(
      (text) => text.setValue(this.plugin.settings[key]).onChange(async (value) => {
        this.plugin.settings[key] = value.trim();
        await this.plugin.saveSettings();
      })
    );
  }
};
var WeaduUtmLedger = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULTS };
  }
  async onload() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());
    this.addSettingTab(new UtmSettingTab(this.app, this));
    this.addCommand({
      id: "insert-utm-url",
      name: "Insert campaign URL",
      editorCallback: (editor) => {
        new UtmModal(this.app, this.settings, (values, withLedger) => {
          const built = buildUtmUrl(values);
          if (!built.ok) {
            new import_obsidian.Notice(built.errors.map((row) => row.message).join(" "));
            return false;
          }
          editor.replaceSelection(built.url);
          if (built.lowercased.length) {
            const detail = built.lowercased.map((row) => row.field + ": " + row.from + " -> " + row.to).join(", ");
            new import_obsidian.Notice("Stored in lower case. " + detail + ".");
          }
          if (withLedger) {
            const insertion = ledgerInsertion(editor.getValue(), ledgerRow(values, today()));
            if (insertion) editor.replaceRange(insertion.text, insertion.pos);
            else new import_obsidian.Notice("This URL is already in the ledger: no new row.");
          }
          return true;
        }).open();
      }
    });
    this.addCommand({
      id: "check-utm-links",
      name: "Check campaign links in the current note",
      editorCallback: (editor) => {
        const report = checkNote(editor.getValue());
        if (!report.faulty.length) {
          new import_obsidian.Notice(`No UTM link to fix: ${report.complete} complete, ${report.withoutUtm} without UTM parameters. ${GOOGLE_ADS_TRACKING_NOTICE}`);
          return;
        }
        new CheckModal(this.app, report).open();
      }
    });
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
