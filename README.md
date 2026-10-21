# WeAdU UTM Ledger

An Obsidian plugin that builds campaign URLs with UTM parameters, checks the links in a note for missing UTM parameters, and keeps a ledger of the URLs you built as a Markdown table in the note.

Everything runs inside Obsidian. The plugin makes no network request.

## Features

- **Insert UTM URL**: a form for the landing URL, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term`. The URL is inserted at the cursor.
- **Insert URL and ledger row**: same form, and the URL is also added as a dated row in a `## UTM ledger` table in the current note. The heading and the table are created if they do not exist yet.
- **Check UTM links in the current note**: lists every `http` or `https` link in the note and flags a missing, repeated, or empty `utm_source`, `utm_medium`, or `utm_campaign`, and values with characters outside the allowed set. The result is inserted as a `## UTM check` section below the cursor line.
- **Default values**: set a default source, medium, and campaign in the settings. They prefill the form.

### Rules applied when a URL is built

- The landing URL must start with `http://` or `https://`.
- `utm_source`, `utm_medium`, and `utm_campaign` are required. `utm_content` and `utm_term` are optional.
- Values may contain letters, digits, `.`, `_`, `~`, and `-`, with no spaces, up to 80 characters. They are converted to lowercase.
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
2. Open the command palette and run **WeAdU UTM Ledger: Insert UTM URL**.
3. Fill in the form, then choose **Insert URL** or **Insert URL and ledger row**.

If a value is not valid, a notice explains what to fix and the note is left unchanged.

To review the links of a note, run **WeAdU UTM Ledger: Check UTM links in the current note**.

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
node build.js   # rebuild main.js from src.main.js and lib/
sh test.sh      # run the tests (Node.js 20 or later)
```

`main.js` is generated: edit `src.main.js` or `lib/utm.js`, then run `node build.js`. The tests fail if `main.js` is out of date.

## License

[MIT](LICENSE)

## About

Made by [WeAdU](https://weadu.com). WeAdU is not affiliated with Obsidian or Google.
