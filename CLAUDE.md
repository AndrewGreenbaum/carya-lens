# Carya Lens - Chrome Extension

## Project Overview

**Carya Lens** is a Chrome Extension that provides instant deal intelligence overlays on LinkedIn. When VCs browse LinkedIn profiles or company pages, the extension automatically displays funding data, deal details, and quick-action workflows.

## Tech Stack

- **Build Tool**: esbuild (custom build.js)
- **Framework**: React 18 + TypeScript
- **Styling**: Inline styles (Shadow DOM compatible)
- **State Management**: React useState + Chrome Storage API
- **DOM Strategy**: MutationObserver for LinkedIn SPA navigation

## Current Status

See `CURRENT_STATE.md` for detailed bug list and fixes needed.

### Working Features
- Extension loads on LinkedIn pages
- Company/profile page detection
- Popup settings UI with environment selector
- API connection to Railway backend (open access, no auth)
- Add to Tracker saves locally to chrome.storage
- CVP logo icons

### Known Bugs
1. URL doubled in API calls
2. CORS blocking popup fetch (should use background worker)
3. Error logging shows "[object Object]"
4. Settings don't auto-persist

## Backend API (ACTUAL)

### Base URLs
```
Production: https://bud-tracker-backend-production.up.railway.app
Local:      http://localhost:8000
```

### Endpoints
```
GET /deals?search={query}&limit=10
```

### Authentication
**No auth required** - API is open access

### Response Format
```json
{
  "deals": [{
    "id": "2535",
    "startup_name": "Testkube",        // NOT companyName
    "investment_stage": "series_a",
    "amount_invested": "$8M",
    "date": "2025-09-23",
    "lead_investor": "Insight Partners",
    "verification_snippet": "Lead investors: Insight Partners"
  }],
  "total": 1,
  "limit": 1
}
```

### Field Mapping (API → Internal)
| API Field | Internal Field |
|-----------|---------------|
| `startup_name` | `companyName` |
| `investment_stage` | `roundStage` |
| `amount_invested` | `fundingAmount` (parsed) |
| `lead_investor` | `leadInvestor.name` |
| `verification_snippet` | `verificationContent` |

## Architecture

```
Content Script (linkedin-overlay.tsx)
    ↓ chrome.runtime.sendMessage
Background Worker (background/index.ts)
    ↓ handles message, calls API
API Client (services/api/client.ts)
    ↓ fetch()
Railway Backend
```

**IMPORTANT**: All fetch() calls MUST happen in background.js (service worker) to avoid CORS. Content scripts and popup use chrome.runtime.sendMessage.

## Key Files

| File | Purpose |
|------|---------|
| `build.js` | esbuild config |
| `manifest.json` | Extension manifest |
| `src/background/index.ts` | Service worker, message handlers |
| `src/content/linkedin-overlay.tsx` | LinkedIn page overlay |
| `src/popup.tsx` | Settings popup |
| `src/services/api/client.ts` | API client |
| `src/services/api/deals.ts` | Deal search with response mapping |
| `src/constants/config.ts` | Environment URLs |
| `src/constants/endpoints.ts` | API endpoint paths |

## Manifest Permissions

```json
{
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "*://*.linkedin.com/*",
    "https://bud-tracker-backend-production.up.railway.app/*",
    "http://localhost:8000/*"
  ]
}
```

## Build Commands

```bash
node build.js          # Build to dist/
npx tsc --noEmit       # Type check
```

## Load in Chrome

1. `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/` folder

## Logging Convention

All logs use `[Carya]` prefix:
```typescript
console.log('[Carya] [Component] [LEVEL] - message', { data });
```

Levels: DEBUG, INFO, WARN, ERROR

## Environment Configuration

Default: `production` (so extension works immediately without setup)

Environments:
- `mock` - Local mock data, no API calls
- `local` - http://localhost:8000
- `production` - Railway backend

Settings stored in `chrome.storage.sync`:
- `carya_api_key` - API key (not required)
- `carya_environment` - Current environment

## LinkedIn DOM Selectors

LinkedIn uses obfuscated classes. Use stable selectors:
1. URL patterns: `/in/` for profiles, `/company/` for companies
2. Structural: `main h1` for names
3. Meta tags: `og:title` as fallback

## Data Flow

1. Content script detects LinkedIn page type
2. Scrapes company/profile name from DOM
3. Sends `LOOKUP_DEAL` message to background
4. Background checks cache, calls API if miss
5. Maps API response to internal format
6. Returns data to content script
7. React renders DealCard overlay

## Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `PING` | popup→bg | Health check |
| `LOOKUP_DEAL` | content→bg | Search deals |
| `ADD_TO_TRACKER` | content→bg | Add company |
| `HEALTH_CHECK` | popup→bg | Test API |
| `RELOAD_SETTINGS` | popup→bg | Refresh config |

## Testing

Test URLs:
- `linkedin.com/company/anthropic`
- `linkedin.com/company/stripe`
- `linkedin.com/in/username`

Check console for `[Carya]` logs.
