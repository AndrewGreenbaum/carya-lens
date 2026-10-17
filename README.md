# Carya Lens

A Chrome extension that shows Carya deal records while viewing LinkedIn company and profile pages. Company pages search by company name; profiles search by founder name.

## Development

Requires Node.js 20 or later.

```sh
npm ci
npm run verify
npm run build
```

Load the generated `dist/` directory through **Load unpacked** at `chrome://extensions`. Rebuild and reload the extension after changing its source. The build uses esbuild, React and TypeScript with component styles; unused Plasmo and Tailwind/PostCSS tooling has been removed. `npm run dev` currently performs the same one-shot build.

## Configuration and behavior

Open the extension popup to select the API environment and save an API key. Deal lookup depends on the configured Carya/Bud backend. Tracker writes require its API key.

Adding a company saves it in local Chrome storage, then attempts to add it to the backend tracker. A failed backend request leaves the local record available and displays an error. **Untrack** removes the local record only; it does not delete the backend tracker item.

The overlay depends on LinkedIn's current page markup. Live LinkedIn behavior and backend integrations require a manual check with an authorized account. API wrappers for enrichment and signals are present, but are not a guarantee that every feature is exposed in the overlay.

## Checks

`npm run verify` type-checks source and test fixtures, runs utility assertions, and exercises the API client with mocked requests. The checks do not call a live service. Build output is written only after all bundles succeed.
