# Manual LinkedIn checks

Build and load the extension as described in [README.md](../README.md). Use a LinkedIn account and pages you are authorized to access. For backend writes, use a development backend and a test API key.

1. Choose the API environment in the popup. Use mock mode to check the UI without a backend, or local mode with the API running on port 8000.
2. Open a `/company/` page and check that the overlay searches the company name.
3. Navigate to a `/in/` profile without reloading the tab and check that it searches the founder name. Check the collapse toggle and the no-results state too.
4. Search from the popup and verify that the results match the selected environment.
5. Add a record to the tracker. Confirm the backend write separately from the local saved state. Try a missing or invalid key and check that the error is visible while the local record remains.
6. Untrack a record and confirm that it disappears locally. The backend item should remain; backend deletion is not wired to this action.
7. Reopen the popup and check that the environment and key settings persist.

Inspect `[Carya]` messages in the page console and the extension's background service worker console when a step fails. Record the page type, selected environment, expected behavior, and error message; leave API keys out of reports.

## Standalone selector check

[test/linkedin-scraper-manual.js](linkedin-scraper-manual.js) can be pasted into DevTools on a company or profile page to inspect which fields its selectors find. Read it before running it. It uses inline copies of scraping helpers, so its output does not test the installed extension or the backend.

Compare extracted names and fields with the visible page. A percentage printed by the script counts fields found; it is not a measure of deal-lookup accuracy. If fields are missing, check whether the page has finished loading, whether the information is visible, and whether LinkedIn changed the markup.
