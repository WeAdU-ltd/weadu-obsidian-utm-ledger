"use strict";

const { Plugin, PluginSettingTab, Setting, Modal, Notice } = require("obsidian");
const { buildUtmUrl, inspectUrl, extractUrls, ledgerRow, appendLedger } = require("./lib/utm");

const DEFAULTS = { source: "", medium: "", campaign: "" };

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

class UtmModal extends Modal {
  constructor(app, defaults, onSubmit) {
    super(app);
    this.defaults = defaults;
    this.onSubmit = onSubmit;
    this.values = {
      url: "",
      source: defaults.source || "",
      medium: defaults.medium || "",
      campaign: defaults.campaign || "",
      content: "",
      term: "",
    };
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("weadu-utm-modal");
    contentEl.createEl("h2", { text: "UTM URL" });
    this.field("Landing URL", "url", "https://");
    this.field("Source", "source", "google");
    this.field("Medium", "medium", "cpc");
    this.field("Campaign", "campaign", "spring-shirts");
    this.field("Content", "content", "");
    this.field("Term", "term", "");
    const modal = this;
    new Setting(contentEl)
      .addButton(function (button) {
        button.setButtonText("Insert URL").setCta().onClick(function () {
          if (modal.onSubmit(modal.values, false)) modal.close();
        });
      })
      .addButton(function (button) {
        button.setButtonText("Insert URL and ledger row").onClick(function () {
          if (modal.onSubmit(modal.values, true)) modal.close();
        });
      });
  }

  field(name, key, placeholder) {
    new Setting(this.contentEl).setName(name).addText(function (text) {
      text.setPlaceholder(placeholder).setValue(this.values[key]).onChange(function (value) {
        this.values[key] = value;
      }.bind(this));
    }.bind(this));
  }

  onClose() {
    this.contentEl.empty();
  }
}

class UtmSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "WeAdU UTM Ledger" });
    this.pref("Default source", "source");
    this.pref("Default medium", "medium");
    this.pref("Default campaign", "campaign");
  }

  pref(name, key) {
    new Setting(this.containerEl).setName(name).addText(function (text) {
      text.setValue(this.plugin.settings[key]).onChange(async function (value) {
        this.plugin.settings[key] = value.trim();
        await this.plugin.saveSettings();
      }.bind(this));
    }.bind(this));
  }
}

class WeaduUtmLedger extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());
    this.addSettingTab(new UtmSettingTab(this.app, this));

    this.addCommand({
      id: "insert-utm-url",
      name: "Insert UTM URL",
      editorCallback: function (editor) {
        new UtmModal(this.app, this.settings, function (values, withLedger) {
          const built = buildUtmUrl(values);
          if (!built.ok) {
            new Notice(built.errors.map(function (row) { return row.message; }).join(" "));
            return false;
          }
          editor.replaceSelection(built.url);
          if (withLedger) {
            const row = ledgerRow(values, today());
            editor.setValue(appendLedger(editor.getValue(), row));
          }
          return true;
        }).open();
      }.bind(this),
    });

    this.addCommand({
      id: "check-utm-links",
      name: "Check UTM links in the current note",
      editorCallback: function (editor) {
        const urls = extractUrls(editor.getValue());
        const lines = ["## UTM check", ""];
        if (!urls.length) lines.push("No http(s) link in this note.");
        urls.forEach(function (url) {
          const findings = inspectUrl(url);
          if (!findings.length) lines.push("- OK: " + url);
          else lines.push("- " + findings.map(function (row) { return row.code; }).join(", ") + ": " + url);
        });
        const cursor = editor.getCursor();
        editor.replaceRange("\n" + lines.join("\n") + "\n", { line: cursor.line, ch: editor.getLine(cursor.line).length });
      },
    });
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

module.exports = WeaduUtmLedger;
module.exports.default = WeaduUtmLedger;
