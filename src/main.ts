import { App, Editor, Modal, Notice, Plugin, PluginSettingTab, Setting, SettingDefinitionItem } from "obsidian";
import { buildUtmUrl, checkNote, CheckReport, GOOGLE_ADS_TRACKING_NOTICE, ledgerInsertion, ledgerRow, UtmInput } from "./utm";

interface UtmSettings {
  source: string;
  medium: string;
  campaign: string;
}

const DEFAULTS: UtmSettings = { source: "", medium: "", campaign: "" };

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

type Submit = (values: UtmInput, withLedger: boolean) => boolean;

function today(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

class UtmModal extends Modal {
  values: UtmInput;
  private onSubmit: Submit;

  constructor(app: App, defaults: UtmSettings, onSubmit: Submit) {
    super(app);
    this.onSubmit = onSubmit;
    this.values = { url: "", source: defaults.source, medium: defaults.medium, campaign: defaults.campaign, content: "", term: "" };
  }

  onOpen(): void {
    this.contentEl.addClass("weadu-utm-modal");
    this.titleEl.setText("Campaign URL");
    this.contentEl.createEl("p", { cls: "setting-item-description", text: GOOGLE_ADS_TRACKING_NOTICE });
    this.field("Landing URL", "url", "https://");
    this.field("Source", "source", "google");
    this.field("Medium", "medium", "cpc");
    this.field("Campaign", "campaign", "spring-shirts");
    this.field("Content", "content", "");
    this.field("Term", "term", "");
    new Setting(this.contentEl)
      .addButton((button) =>
        button
          .setButtonText("Insert URL")
          .setCta()
          .onClick(() => {
            if (this.onSubmit(this.values, false)) this.close();
          }),
      )
      .addButton((button) =>
        button.setButtonText("Insert URL and ledger row").onClick(() => {
          if (this.onSubmit(this.values, true)) this.close();
        }),
      );
  }

  private field(name: string, key: keyof UtmInput, placeholder: string): void {
    new Setting(this.contentEl).setName(name).addText((text) =>
      text
        .setPlaceholder(placeholder)
        .setValue(this.values[key] ?? "")
        .onChange((value) => {
          this.values[key] = value;
        }),
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

class CheckModal extends Modal {
  private report: CheckReport;

  constructor(app: App, report: CheckReport) {
    super(app);
    this.report = report;
  }

  onOpen(): void {
    const { faulty, complete, withoutUtm } = this.report;
    this.titleEl.setText("Campaign link check");
    this.contentEl.createEl("p", { cls: "setting-item-description", text: GOOGLE_ADS_TRACKING_NOTICE });
    this.contentEl.createEl("p", {
      text: `${plural(faulty.length, "link")} to fix, ${complete} complete, ${withoutUtm} without UTM parameters (not checked).`,
    });
    const list = this.contentEl.createEl("ul");
    for (const link of faulty) {
      const item = list.createEl("li");
      item.createDiv({ text: `Line ${link.line}: ${link.findings.map((row) => row.message).join(" ")}` });
      item.createEl("code", { text: link.url });
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

class UtmSettingTab extends PluginSettingTab {
  private plugin: WeaduUtmLedger;

  constructor(app: App, plugin: WeaduUtmLedger) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // Obsidian 1.13 and later: declarative settings, searchable from the settings search.
  getSettingDefinitions(): SettingDefinitionItem[] {
    const text = (name: string, key: keyof UtmSettings, placeholder: string): SettingDefinitionItem => ({
      name,
      control: { type: "text", key, placeholder },
    });
    return [
      text("Default source", "source", "google"),
      text("Default medium", "medium", "cpc"),
      text("Default campaign", "campaign", "spring-shirts"),
      { name: "About", searchable: false, render: (setting: Setting) => this.credit(setting.descEl) },
    ];
  }

  getControlValue(key: string): unknown {
    return this.plugin.settings[key as keyof UtmSettings];
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    this.plugin.settings[key as keyof UtmSettings] = typeof value === "string" ? value.trim() : "";
    await this.plugin.saveSettings();
  }

  // Obsidian before 1.13.
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    this.pref("Default source", "source");
    this.pref("Default medium", "medium");
    this.pref("Default campaign", "campaign");
    this.credit(containerEl);
  }

  private credit(el: HTMLElement): void {
    const line = el.createEl("p", { cls: "setting-item-description weadu-utm-credit", text: "Made by " });
    line.createEl("a", { text: "weadu.com", href: "https://weadu.com" });
  }

  private pref(name: string, key: keyof UtmSettings): void {
    new Setting(this.containerEl).setName(name).addText((text) =>
      text.setValue(this.plugin.settings[key]).onChange(async (value) => {
        this.plugin.settings[key] = value.trim();
        await this.plugin.saveSettings();
      }),
    );
  }
}

export default class WeaduUtmLedger extends Plugin {
  settings: UtmSettings = { ...DEFAULTS };

  async onload(): Promise<void> {
    this.settings = Object.assign({}, DEFAULTS, (await this.loadData()) as Partial<UtmSettings> | null);
    this.addSettingTab(new UtmSettingTab(this.app, this));

    this.addCommand({
      id: "insert-utm-url",
      name: "Insert campaign URL",
      editorCallback: (editor: Editor) => {
        new UtmModal(this.app, this.settings, (values, withLedger) => {
          const built = buildUtmUrl(values);
          if (!built.ok) {
            new Notice(built.errors.map((row) => row.message).join(" "));
            return false;
          }
          editor.replaceSelection(built.url);
          if (built.lowercased.length) {
            const detail = built.lowercased.map((row) => row.field + ": " + row.from + " -> " + row.to).join(", ");
            new Notice("Stored in lower case. " + detail + ".");
          }
          if (withLedger) {
            const insertion = ledgerInsertion(editor.getValue(), ledgerRow(values, today()));
            if (insertion) editor.replaceRange(insertion.text, insertion.pos);
            else new Notice("This URL is already in the ledger: no new row.");
          }
          return true;
        }).open();
      },
    });

    this.addCommand({
      id: "check-utm-links",
      name: "Check campaign links in the current note",
      editorCallback: (editor: Editor) => {
        const report = checkNote(editor.getValue());
        if (!report.faulty.length) {
          new Notice(`No UTM link to fix: ${report.complete} complete, ${report.withoutUtm} without UTM parameters. ${GOOGLE_ADS_TRACKING_NOTICE}`);
          return;
        }
        new CheckModal(this.app, report).open();
      },
    });
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
