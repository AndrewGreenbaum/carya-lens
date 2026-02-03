# Carya Lens Extension - Current State

## Working Features

- Extension loads on LinkedIn pages
- Company page detection works
- Popup settings UI works
- API connection to Railway backend works (tested manually in browser)
- CVP logo icons generated and working
- Add to Tracker saves locally to chrome.storage

## Bugs to Fix

Give this prompt to Claude Code to continue:

```
Critical bugs to fix in Carya Lens extension:

BUG 1: URL doubled - "https://api.carya.comhttps://api.carya.com/v1/deals"
- Fix URL concatenation in src/services/api/client.ts or src/constants/endpoints.ts
- The baseUrl is being concatenated incorrectly with the endpoint

BUG 2: CORS blocking API calls from popup
- Move ALL fetch calls to background.js (service worker)
- Popup/content scripts must use chrome.runtime.sendMessage
- Background service worker is exempt from CORS
- Currently the popup's "Test Connection" tries to fetch directly

BUG 3: Error logging shows "[object Object]"
- Serialize errors properly: error instanceof Error ? error.message : String(error)
- Add JSON.stringify for objects in log statements

BUG 4: Settings don't persist - must click Test Connection every time
- Load environment from chrome.storage.sync on content script startup
- Default to production, not mock
- Settings should auto-load when extension initializes
```

## API Details

- **Production URL**: `https://bud-tracker-backend-production.up.railway.app`
- **Local URL**: `http://localhost:8000`
- **Deals Endpoint**: `GET /deals?search={query}&limit=10`
- **No auth required** - API is open access
- **Response format**: Field is `startup_name` not `companyName`

Example response:
```json
{
  "deals": [{
    "id": "2535",
    "startup_name": "Testkube",
    "investment_stage": "series_a",
    "amount_invested": "$8M",
    "date": "2025-09-23",
    "lead_investor": "Insight Partners",
    "verification_snippet": "Lead investors: Insight Partners, Ratmir Timashev"
  }],
  "total": 1,
  "limit": 1
}
```

## Key Files

| File | Purpose |
|------|---------|
| `src/services/api/client.ts` | API client with fetch calls |
| `src/services/api/deals.ts` | Deal search with response mapping |
| `src/constants/config.ts` | Environment URLs and defaults |
| `src/constants/endpoints.ts` | API endpoint paths |
| `src/background/index.ts` | Service worker message handlers |
| `src/content/linkedin-overlay.tsx` | LinkedIn page overlay |
| `src/popup.tsx` | Extension popup settings UI |
| `manifest.json` | Extension manifest with permissions |

## Architecture

```
Content Script (linkedin-overlay.tsx)
    ↓ chrome.runtime.sendMessage
Background Worker (background/index.ts)
    ↓ handles message
API Client (services/api/client.ts)
    ↓ fetch()
Railway Backend (bud-tracker-backend-production.up.railway.app)
```

## Manifest Permissions

```json
{
  "host_permissions": [
    "*://*.linkedin.com/*",
    "https://bud-tracker-backend-production.up.railway.app/*",
    "http://localhost:8000/*"
  ]
}
```

## Response Field Mapping

The API returns different field names than our internal types:

| API Field | Internal Field |
|-----------|---------------|
| `startup_name` | `companyName` |
| `investment_stage` | `roundStage` |
| `amount_invested` | `fundingAmount` (parsed from "$8M" to 8000000) |
| `lead_investor` | `leadInvestor.name` |
| `verification_snippet` | `verificationContent` |

## Build Commands

```bash
node build.js          # Build extension to dist/
npx tsc --noEmit       # Type check
```

## Test URLs

- `linkedin.com/company/anthropic` - Company page
- `linkedin.com/company/stripe` - Company page
- `linkedin.com/in/username` - Profile page
