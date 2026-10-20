# Carya LinkedIn Deal Lookup

A Chrome extension that looks up Carya funding records while browsing LinkedIn. Company pages search by company name; profile pages search by founder name. The popup also has a deal search and API settings.

## Build and load

Requires Node.js 20 or later.

```sh
npm ci
npm run verify
npm run build
```

At `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist/`. After a source change, rebuild, reload the extension, and refresh the LinkedIn tab. `npm run dev` is currently a one-shot build too.

The extension uses React, TypeScript, and esbuild. It does not include the Carya backend.

## Backend settings

Open the popup's Settings tab to choose `mock`, `local`, or `production` and save an API key. Local mode uses `http://localhost:8000`; the production address is set in [src/constants/config.ts](src/constants/config.ts). That backend must be running for live lookups. Mock mode uses sample data.

Deal lookup calls `GET /deals`. Adding to the backend tracker requires an API key and uses `POST /tracker/from-deal` or `POST /tracker`. API keys are stored in Chrome sync storage, so use a key intended for this extension.

Adding a company saves a local record before attempting the backend request. If the request fails, the local record stays and the extension shows an error. **Untrack removes only the local record**; it does not delete the backend tracker item.

## Development

The content script detects LinkedIn navigation and sends messages to the background service worker, which makes API requests. Keep network calls there so they use the extension's host permissions.

- `src/content/linkedin-overlay.tsx`: page detection and overlay
- `src/background/`: message handlers
- `src/services/api/`: backend client and response mapping
- `src/services/linkedin/`: page detection and scraping helpers
- `src/popup.tsx`: search and settings
- `build.js`: bundles and `dist/` output

`npm run verify` type-checks and runs utility, logger, type, and mocked API tests. Live LinkedIn pages need a [manual check](test/MANUAL_TEST_INSTRUCTIONS.md), since their markup changes independently of this extension. The enrichment and signals service wrappers are not all exposed in the overlay.

If the overlay is missing, reload the extension and refresh a `/company/` or `/in/` page, then inspect `[Carya]` console messages. If lookup works but tracker writes fail, check the selected environment and API key.
