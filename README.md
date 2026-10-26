# WeAdU UTM Ledger

An Obsidian plugin that builds campaign URLs with UTM parameters, checks the links in a note for missing UTM parameters, and keeps a ledger of the URLs you built as a Markdown table in the note.

Everything runs inside Obsidian. The plugin makes no network request.

## Features

- **Insert campaign URL**: a form for the landing URL, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term`. The URL is inserted at the cursor.
- **Insert URL and ledger row**: same form, and the URL is also added as a dated row in a `## UTM ledger` table in the current note. The heading and the table are created at the end of the note if they do not exist yet. Only the new lines are added: the rest of the note is not rewritten, so undo, cursor, and folds stay as they were. A URL that is already in the ledger table is not added again (a notice says so).
- **Check campaign links in the current note**: looks at the links that carry `utm_` parameters and lists, with their line number, only those with a missing, repeated, or empty `utm_source`, `utm_medium`, or `utm_campaign`, a value longer than 80 characters, a value with characters outside the allowed set, or a value that is not already lower case. Links without any `utm_` parameter are not campaign links and are only counted. The result opens in a window; the note is not modified.
- **Google Ads**: the form and the check both say that Google Ads clicks are tracked with auto-tagging (`gclid`) and a tracking template, not by pasting UTM parameters on the final URL. The tool still builds UTM links for other channels.
- **Default values**: set a default source, medium, and campaign in the settings. They prefill the form.

### Rules applied when a URL is built

- The landing URL must start with `http://` or `https://`.
- `utm_source`, `utm_medium`, and `utm_campaign` are required. `utm_content` and `utm_term` are optional.
- Values may contain letters, digits, `.`, `_`, `~`, and `-`, with no spaces, up to 80 characters. The same 80-character limit is applied when a note is checked, including `utm_content` and `utm_term`.
- Values are stored in lower case. If you typed capitals, a notice shows the change (`Spring` becomes `spring`). GA4 treats the two as different values.
- Existing `utm_*` parameters in the landing URL are replaced. Other parameters and the `#fragment` are kept.

## Installation

### From the Obsidian community plugins

Once the plugin is listed: open **Settings → Community plugins → Browse**, search for "WeAdU UTM Ledger", then install and enable it. If Restricted mode is on, turn it off first.

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release of this repository.
2. Create the folder `<your vault>/.obsidian/plugins/weadu-utm-ledger/` and copy the three files into it.
3. Restart Obsidian, then enable **WeAdU UTM Ledger** in **Settings → Community plugins**.

Requires Obsidian 1.5.0 or later.

## Usage

1. Open a note and place the cursor where the URL should go.
2. Open the command palette and run **WeAdU UTM Ledger: Insert campaign URL**.
3. Fill in the form, then choose **Insert URL** or **Insert URL and ledger row**.

If a value is not valid, a notice explains what to fix and the note is left unchanged.

To review the links of a note, run **WeAdU UTM Ledger: Check campaign links in the current note**.

## Settings

| Setting | Effect |
| --- | --- |
| Default source | Prefills `utm_source` in the form. |
| Default medium | Prefills `utm_medium` in the form. |
| Default campaign | Prefills `utm_campaign` in the form. |

Settings are stored by Obsidian in the plugin folder of your vault (`data.json`).

## Privacy

The plugin makes no network request and has no telemetry. It reads and edits only the note you run a command on, and it stores only the three default values above.

## Development

```sh
npm ci
npm run build   # type-check src/ and bundle main.js with esbuild
sh test.sh      # type-check, eslint-plugin-obsidianmd, build, tests (Node.js 20 or later)
```

`main.js` is generated from `src/main.ts` and `src/utm.ts`. The tests fail if `main.js` is out of date or if the Obsidian lint reports any error or warning.

## License

[MIT](LICENSE)

## About

Made by [WeAdU](https://weadu.com). WeAdU is not affiliated with Obsidian or Google.
