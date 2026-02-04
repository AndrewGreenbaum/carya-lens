# Carya Lens Extension - Current State

## Working Features

- Extension loads on LinkedIn pages
- Company page detection works
- **Profile page detection** - searches by founder name on /in/ pages
- Popup settings UI works with **Search tab** for deal lookup
- API connection to Railway backend works
- CVP logo icons generated and working
- **Add to Tracker** - Uses real API endpoint POST /tracker/from-deal
- Untrack feature to remove companies from tracker
- Settings auto-persist (defaults to production)
- All API calls route through background worker (no CORS issues)
- **UI Polish** - Carya branding, fade-in animations, hover effects, collapse/expand toggle

## Bugs Fixed (2026-02-02 - Session 2)

### BUG 5: Tracker says "Saved locally" instead of saving to Railway - DIAGNOSED & IMPROVED
- **Cause**: Tracker API endpoints (`POST /tracker/from-deal`, `POST /tracker`) require `X-API-Key` header
- **Root Issue**: User hasn't set API key in extension popup settings
- **Fix**: Improved error messages to guide users to set API key
- **Status**: Extension now shows "API key required - set in extension popup" when tracker fails due to auth

### BUG 6: Connection test required API key unnecessarily - FIXED
- **Cause**: Test connection required API key, but deal lookup endpoint doesn't need auth
- **Fix**: Removed API key requirement from connection test
- **Status**: Fixed - test connection now works without API key

## Bugs Fixed (2026-02-02 - Session 1)

### BUG 1: URL doubled - FIXED
- **Cause**: The user was running old built code with the old `api.carya.com` URL
- **Fix**: Removed unused `API_BASE_URL` import from endpoints.ts
- **Fix**: Updated package.json host_permissions to use Railway URL
- **Status**: Rebuild required (now done)

### BUG 2: CORS blocking API calls - FIXED
- **Analysis**: All fetch calls already go through background.js
- **Status**: Already working - popup uses chrome.runtime.sendMessage

### BUG 3: Error logging shows "[object Object]" - FIXED
- **Cause**: Error objects passed directly to logger instead of being serialized
- **Fix**: Updated all catch blocks to use `error instanceof Error ? error.message : String(error)`
- **Files fixed**:
  - src/background/index.ts (3 places)
  - src/services/api/client.ts (1 place)
  - src/services/api/tracker.ts (5 places)
  - src/services/api/signals.ts (1 place)
  - src/services/api/enrichment.ts (3 places)
  - src/services/api/feedback.ts (3 places)

### BUG 4: Settings don't persist - FIXED
- **Analysis**: Code already defaults to 'production' environment
- **Status**: Working - settings auto-load on startup

## Features Added (2026-02-02)

### FEATURE 1: Profile Pages (/in/ pages)
- Detects linkedin.com/in/{username} pages
- Scrapes founder name from profile h1
- Searches deals by founder name via LOOKUP_DEAL message
- Shows "No deals found for {name}" when no results
- Files: `src/content/linkedin-overlay.tsx`, `src/components/overlay/NotInDatabase.tsx`

### FEATURE 2: Tracker API Integration
- Uses real backend endpoints:
  - `POST /tracker/from-deal` when deal_id available (preferred)
  - `POST /tracker` for manual entries
- Requires X-API-Key header for authenticated requests
- Shows real success/failure messages based on API response
- Falls back to local storage if API unavailable
- Files: `src/services/api/tracker.ts`, `src/background/messages/tracker.ts`

### FEATURE 3: UI Polish
- Carya logo in card headers (blue circle with "C")
- Better card styling with enhanced shadows and 12px rounded corners
- Fade-in animation when overlay appears
- Collapse/expand toggle to minimize overlay
- Button hover effects with slight lift and shadow
- Loading spinner animation
- Files: `src/components/ui/Card.tsx`, `src/components/ui/Button.tsx`, `src/components/overlay/DealCard.tsx`

### FEATURE 4: Popup Search
- Two-tab interface: Search | Settings
- Search input with Enter key support
- Results show company name, funding amount, stage, lead investor
- Click result to open LinkedIn company page
- "No results" message when no matches found
- All actions logged with [Carya] [Popup] prefix
- Files: `src/popup.tsx`

## API Details

- **Production URL**: `https://bud-tracker-backend-production.up.railway.app`
- **Local URL**: `http://localhost:8000`

### Authentication
- **Deal lookup** (`GET /deals`): **NO API key required** - open access
- **Tracker operations** (`POST /tracker`, `POST /tracker/from-deal`): **API key REQUIRED**
  - Requires `X-API-Key` header
  - Without API key: tracker shows "Saved locally" with error message

### Endpoints
- `GET /deals?search={query}&limit=10` - Search deals (no auth)
- `POST /tracker/from-deal` - Add deal to tracker (requires API key)
- `POST /tracker` - Add manual entry to tracker (requires API key)

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
