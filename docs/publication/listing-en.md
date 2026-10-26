# Listing texts (English)

## Name

WeAdU UTM Ledger

## Short description (manifest, 250 characters max)

Build campaign URLs, flag links missing utm_source, utm_medium, or utm_campaign, and keep a Markdown ledger. Local only.

## Long description

WeAdU UTM Ledger helps you build and review campaign URLs without leaving your notes.

- Insert campaign URL: fill in the landing URL, source, medium, campaign, and optionally content and term. The URL is inserted at the cursor.
- Ledger: add each URL you build as a dated row in a "UTM ledger" table at the end of the current note. Only the new lines are added, and a URL already in the ledger is not added twice.
- Check campaign links: list only the campaign links (with utm_ parameters) that have a missing, repeated, or empty utm_source, utm_medium, or utm_campaign, a value over 80 characters, or a value that is not lower case. The note is not edited.
- Defaults: save a default source, medium, and campaign in the settings.

Values are stored in lower case, and a notice shows the change when you typed capitals. They may contain letters, digits, and . _ ~ - with no spaces, up to 80 characters. Google Ads clicks are tracked with auto-tagging (gclid) and a tracking template, not by UTM parameters on the final URL. Existing UTM parameters are replaced; other parameters are kept.

The plugin makes no network request and has no telemetry. Free and open source (MIT), made by WeAdU.
