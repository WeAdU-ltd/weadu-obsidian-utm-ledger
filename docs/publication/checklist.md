# Before publication

Nothing in this folder may be posted before every box below is ticked.

- [ ] Pull requests #1 and #2 reviewed independently and merged.
- [ ] `sh test.sh` green on `main` (and the GitHub Actions workflow enabled: copy `ci/github-actions-test.yml` to `.github/workflows/test.yml` with a token that has the `workflow` scope).
- [ ] Manual test in a real Obsidian vault (desktop): both commands, the ledger, the settings tab, and the WeAdU link.
- [ ] Known issue fixed or accepted: when a `## UTM ledger` heading exists without a table, the new table is written directly above the next line of text, so Markdown reads that line as a table row (see the `todo` test in `test/plugin.test.js`).
- [ ] GitHub release `1.0.0` created with `main.js`, `manifest.json`, and `styles.css` attached (the tag must match `manifest.json`).
- [ ] Plugin submitted to the Obsidian community directory (https://community.obsidian.md) and accepted.
- [ ] Public link sent to the person who posts, so `LINK` can be replaced.
