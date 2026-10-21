"use strict";
// Minimal stand-in for the "obsidian" module, enough to load main.js in Node
// and drive commands, modals, and the settings tab from tests.
// It mirrors only the API calls the plugin makes; it is not the real Obsidian API.

const notices = [];

function makeEl(tag, opts) {
  const el = {
    tag: tag || "div",
    text: (opts && opts.text) || "",
    href: (opts && opts.href) || "",
    children: [],
    classes: [],
    createEl(childTag, childOpts) {
      const child = makeEl(childTag, childOpts);
      el.children.push(child);
      return child;
    },
    addClass(name) { el.classes.push(name); },
    empty() { el.children.length = 0; },
    allText() {
      return [el.text].concat(el.children.map((c) => c.allText())).filter(Boolean).join("\n");
    },
    find(predicate) {
      if (predicate(el)) return el;
      for (const child of el.children) {
        const hit = child.find(predicate);
        if (hit) return hit;
      }
      return null;
    },
  };
  return el;
}

class TextComponent {
  constructor() { this.value = ""; this.placeholder = ""; this.handler = null; }
  setPlaceholder(v) { this.placeholder = v; return this; }
  setValue(v) { this.value = v == null ? "" : String(v); return this; }
  onChange(fn) { this.handler = fn; return this; }
  async type(v) { this.value = v; if (this.handler) await this.handler(v); }
}

class ButtonComponent {
  constructor() { this.text = ""; this.cta = false; this.handler = null; }
  setButtonText(v) { this.text = v; return this; }
  setCta() { this.cta = true; return this; }
  onClick(fn) { this.handler = fn; return this; }
  click() { return this.handler && this.handler(); }
}

class Setting {
  constructor(containerEl) {
    this.name = "";
    this.texts = [];
    this.buttons = [];
    this.el = containerEl.createEl("div", { text: "" });
    this.el.setting = this;
  }
  setName(name) { this.name = name; this.el.text = name; return this; }
  setDesc(desc) { this.desc = desc; return this; }
  addText(fn) { const t = new TextComponent(); this.texts.push(t); fn(t); return this; }
  addButton(fn) { const b = new ButtonComponent(); this.buttons.push(b); fn(b); return this; }
}

function settingsIn(el) {
  const out = [];
  (function walk(node) {
    if (node.setting) out.push(node.setting);
    node.children.forEach(walk);
  })(el);
  return out;
}

class Modal {
  constructor(app) { this.app = app; this.contentEl = makeEl("div"); this.isOpen = false; }
  open() { this.isOpen = true; Modal.last = this; this.onOpen(); }
  close() { this.isOpen = false; this.onClose(); }
  onOpen() {}
  onClose() {}
}
Modal.last = null;

class PluginSettingTab {
  constructor(app, plugin) { this.app = app; this.plugin = plugin; this.containerEl = makeEl("div"); }
}

class Plugin {
  constructor(app, manifest) {
    this.app = app || {};
    this.manifest = manifest || {};
    this.commands = {};
    this.settingTabs = [];
    this.stored = null;
  }
  addCommand(cmd) { this.commands[cmd.id] = cmd; return cmd; }
  addSettingTab(tab) { this.settingTabs.push(tab); }
  async loadData() { return this.stored; }
  async saveData(data) { this.stored = JSON.parse(JSON.stringify(data)); }
}

class Notice {
  constructor(message) { this.message = message; notices.push(message); }
}

// Fake editor holding a single string, with Obsidian-like line/ch positions.
class FakeEditor {
  constructor(text, cursor, selection) {
    this.text = text || "";
    this.cursor = cursor || { line: 0, ch: 0 };
    this.selection = selection || "";
  }
  getValue() { return this.text; }
  setValue(v) { this.text = v; }
  getSelection() { return this.selection; }
  getCursor() { return this.cursor; }
  getLine(n) { return this.text.split("\n")[n] || ""; }
  offset(pos) {
    const lines = this.text.split("\n");
    let off = 0;
    for (let i = 0; i < pos.line; i++) off += lines[i].length + 1;
    return off + pos.ch;
  }
  replaceRange(insert, from) {
    const at = this.offset(from);
    this.text = this.text.slice(0, at) + insert + this.text.slice(at);
  }
  replaceSelection(insert) {
    if (this.selection) {
      const at = this.text.indexOf(this.selection);
      this.text = this.text.slice(0, at) + insert + this.text.slice(at + this.selection.length);
      this.selection = "";
      return;
    }
    this.replaceRange(insert, this.cursor);
  }
}

// Load main.js with require("obsidian") resolved to this stub.
function loadPlugin(mainPath) {
  const Module = require("module");
  const stub = module.exports;
  const original = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "obsidian") return stub;
    return original.apply(this, arguments);
  };
  try {
    delete require.cache[require.resolve(mainPath)];
    return require(mainPath);
  } finally {
    Module._load = original;
  }
}

module.exports = {
  Plugin, PluginSettingTab, Setting, Modal, Notice,
  FakeEditor, loadPlugin, settingsIn, notices,
};
