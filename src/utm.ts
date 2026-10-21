// Pure UTM logic: no Obsidian import, so it can be tested with Node.

export interface UtmInput {
  url?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface Finding {
  code: string;
  field: string;
  message: string;
}

export interface BuildResult {
  ok: boolean;
  url: string;
  errors: Finding[];
}

export interface Position {
  line: number;
  ch: number;
}

export interface Insertion {
  pos: Position;
  text: string;
}

export interface LinkReport {
  line: number;
  url: string;
  findings: Finding[];
}

export interface CheckReport {
  faulty: LinkReport[];
  complete: number;
  withoutUtm: number;
}

const UTM_ORDER = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const REQUIRED = ["utm_source", "utm_medium", "utm_campaign"];
const VALUE_RE = /^[A-Za-z0-9._~-]+$/;
const MAX_VALUE = 80;
const FIELDS: (keyof UtmInput)[] = ["source", "medium", "campaign", "content", "term"];
export const LEDGER_HEADING = "## UTM ledger";

const MESSAGES: Record<string, string> = {
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
  empty_utm_campaign: "utm_campaign is empty.",
};

function finding(code: string, field: string): Finding {
  return { code, field, message: MESSAGES[code] ?? code };
}

function normalizeValue(raw: unknown, field: string, required: boolean, errors: Finding[]): string {
  const value = (typeof raw === "string" ? raw : "").trim();
  if (!value) {
    if (required) errors.push(finding("utm_" + field + "_required", field));
    return "";
  }
  if (value.length > MAX_VALUE || !VALUE_RE.test(value)) {
    errors.push(finding("utm_value_invalid", field));
    return "";
  }
  return value.toLowerCase();
}

function parseHttpUrl(raw: string): URL | null {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

export function buildUtmUrl(input: UtmInput): BuildResult {
  const errors: Finding[] = [];
  const rawUrl = (input.url ?? "").trim();
  if (!rawUrl) errors.push(finding("url_required", "url"));
  const values: Record<string, string> = {};
  FIELDS.forEach((field, i) => {
    values[field] = normalizeValue(input[field], field, i < 3, errors);
  });
  let parsed: URL | null = null;
  if (rawUrl) {
    try {
      parsed = new URL(rawUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        errors.push(finding("url_protocol", "url"));
        parsed = null;
      }
    } catch {
      errors.push(finding("url_invalid", "url"));
    }
  }
  if (errors.length || !parsed) return { ok: false, url: "", errors };
  for (const name of UTM_ORDER) parsed.searchParams.delete(name);
  for (const field of FIELDS) {
    if (values[field]) parsed.searchParams.append("utm_" + field, values[field]);
  }
  return { ok: true, url: parsed.toString(), errors: [] };
}

function queryKeys(parsed: URL): string[] {
  const raw = parsed.search.startsWith("?") ? parsed.search.slice(1) : parsed.search;
  const keys: string[] = [];
  for (const part of raw.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const key = eq === -1 ? part : part.slice(0, eq);
    try {
      keys.push(decodeURIComponent(key));
    } catch {
      keys.push(key);
    }
  }
  return keys;
}

/** Findings for one link. A link with no utm_ parameter at all has none: it is not a campaign link. */
export function inspectUrl(raw: string): Finding[] {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return [finding("url_invalid", "url")];
  }
  const parsed = parseHttpUrl(url.toString());
  if (!parsed) return [finding("url_protocol", "url")];
  const keys = queryKeys(parsed);
  if (!keys.some((key) => key.toLowerCase().startsWith("utm_"))) return [];
  const findings: Finding[] = [];
  for (const name of REQUIRED) {
    const count = keys.filter((key) => key === name).length;
    if (count === 0) findings.push(finding("missing_" + name, name));
    else if (count > 1) findings.push(finding("duplicate_" + name, name));
    const value = parsed.searchParams.get(name);
    if (value !== null && value.trim() === "") findings.push(finding("empty_" + name, name));
    else if (value && !VALUE_RE.test(value)) findings.push(finding("utm_value_invalid", name));
  }
  return findings;
}

export function extractUrls(text: string): string[] {
  const re = /https?:\/\/[^\s<>\])"'`]+/gi;
  const out: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) out.push(match[0].replace(/[.,);:]+$/g, ""));
  return out;
}

/** Only the links that carry UTM parameters and get them wrong, with their 1-based line. */
export function checkNote(text: string): CheckReport {
  const report: CheckReport = { faulty: [], complete: 0, withoutUtm: 0 };
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

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function ledgerHeader(): string {
  return ["| Date | URL | Source | Medium | Campaign | Content | Term |", "| --- | --- | --- | --- | --- | --- | --- |"].join("\n");
}

export function ledgerRow(input: UtmInput, isoDate: string): string {
  const built = buildUtmUrl(input);
  const cells = [isoDate, built.ok ? built.url : ""].concat(FIELDS.map((field) => (input[field] ?? "").trim().toLowerCase()));
  return "| " + cells.map(escapeCell).join(" | ") + " |";
}

/**
 * Where to put a new ledger row, as one small insertion: the rest of the note is not rewritten.
 * Creates the "## UTM ledger" section at the end of the note, or the table under an existing heading.
 * Returns null when the URL of the row is already in the ledger table: it is not added twice.
 */
export function ledgerInsertion(markdown: string, row: string): Insertion | null {
  const lines = markdown.split("\n");
  const lastLine = lines.length - 1;
  const end: Position = { line: lastLine, ch: lines[lastLine].length };
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
    // Keep a blank line after the table so the next paragraph is not read as a table row.
    return { pos: { line: cursor, ch: 0 }, text: table + "\n\n" };
  }
  let last = cursor;
  while (last + 1 < lines.length && lines[last + 1].startsWith("|")) last++;
  const url = rowUrl(row);
  if (url && lines.slice(cursor + 2, last + 1).some((line) => rowUrl(line) === url)) return null;
  if (last === lastLine) return { pos: end, text: "\n" + row };
  return { pos: { line: last + 1, ch: 0 }, text: row + "\n" };
}

// The URL cell (second column) of a ledger row.
function rowUrl(row: string): string {
  const cells = row.split(/(?<!\\)\|/);
  return cells.length > 2 ? cells[2].trim() : "";
}

/** Applies an insertion to a string the way Editor.replaceRange does. Used by tests. */
export function applyInsertion(markdown: string, insertion: Insertion): string {
  const lines = markdown.split("\n");
  let offset = 0;
  for (let i = 0; i < insertion.pos.line; i++) offset += lines[i].length + 1;
  offset += insertion.pos.ch;
  return markdown.slice(0, offset) + insertion.text + markdown.slice(offset);
}
