# Claude development context

[README.md](README.md) covers the build, configuration, and current behavior. Use [test/MANUAL_TEST_INSTRUCTIONS.md](test/MANUAL_TEST_INSTRUCTIONS.md) when checking LinkedIn integration.

- Run `npm run verify` and `npm run build` after source changes. The build uses esbuild; `npm run dev` does not watch files.
- Content scripts and the popup send `chrome.runtime.sendMessage` requests. API calls belong in the background service worker.
- Environment URLs and Chrome storage keys are in `src/constants/config.ts`; endpoint paths are in `src/constants/endpoints.ts`.
- Map backend fields in the API layer: `startup_name` to `companyName`, `investment_stage` to `roundStage`, `amount_invested` to `fundingAmount`, `lead_investor` to `leadInvestor.name`, and `verification_snippet` to `verificationContent`.
- LinkedIn classes change frequently. Prefer URL patterns, semantic page structure, and metadata when updating selectors.
- Do not treat a saved local tracker record as confirmation of a successful backend write. Untrack currently removes only local state.
- Keep API keys out of source and logs. The extension stores its configured key in Chrome sync storage.
