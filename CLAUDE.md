# Carya Lens - Chrome Extension

## Project Overview

**Carya Lens** is a Chrome Extension that provides instant deal intelligence overlays on LinkedIn. When VCs browse LinkedIn profiles or company pages, the extension automatically displays funding data, deal details, and quick-action workflows.

## Tech Stack

- **Build Tool**: esbuild (custom build.js)
- **Framework**: React 18 + TypeScript
- **Styling**: Inline styles with dark theme (Shadow DOM compatible)
- **State Management**: React useState + Chrome Storage API
- **DOM Strategy**: MutationObserver for LinkedIn SPA navigation
- **Design System**: Dark theme matching Carya Eagle Eye frontend

## Current Status

See `CURRENT_STATE.md` for detailed bug list and implementation history.

### Working Features
- Extension loads on LinkedIn pages
- Company page detection (`/company/` URLs)
- Profile page detection (`/in/` URLs) - searches by founder name
- Popup settings UI with Search and Settings tabs
- API connection to Railway backend
- **Add to Tracker** - saves to Railway backend (requires API key)
- **Untrack** - removes companies from local tracker
- Dark theme UI matching Carya Eagle Eye
- Collapse/expand toggle for overlay
- Loading states and error handling

### Authentication

| Feature | Auth Required |
|---------|--------------|
| Deal lookup (`GET /deals`) | No |
| Add to Tracker (`POST /tracker/from-deal`) | Yes (API key) |
| Manual tracker entry (`POST /tracker`) | Yes (API key) |

## Backend API

### Base URLs
```
Production: https://bud-tracker-backend-production.up.railway.app
Local:      http://localhost:8000
```

### Endpoints
```
GET  /deals?search={query}&limit=10     # No auth - deal search
POST /tracker/from-deal                  # Requires X-API-Key
POST /tracker                            # Requires X-API-Key
```

### Response Format (Deals)
```json
{
  "deals": [{
    "id": "2535",
    "startup_name": "Testkube",
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
| `src/background/messages/tracker.ts` | Tracker API operations |
| `src/content/linkedin-overlay.tsx` | LinkedIn page overlay |
| `src/popup.tsx` | Settings popup with Search tab |
| `src/services/api/client.ts` | API client with auth |
| `src/services/api/deals.ts` | Deal search with response mapping |
| `src/services/api/tracker.ts` | Tracker endpoints |
| `src/components/overlay/DealCard.tsx` | Main deal display card |
| `src/components/ui/Card.tsx` | UI card with CARYA_COLORS |
| `src/constants/config.ts` | Environment URLs |
| `src/constants/endpoints.ts` | API endpoint paths |

## Design System

Dark theme colors (defined in `src/components/ui/Card.tsx`):

```typescript
const CARYA_COLORS = {
  background: '#0d1117',
  cardBackground: '#161b22',
  cardBackgroundHover: '#1c2128',
  border: '#30363d',
  textPrimary: '#f0f6fc',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  accent: '#00d4aa',        // Teal for amounts
  accentHover: '#00f0c0',
  success: '#3fb950',
  error: '#f85149',
  warning: '#d29922',
};
```

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
- `carya_api_key` - API key (required for tracker operations)
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
| `ADD_TO_TRACKER` | content→bg | Add company to tracker |
| `CHECK_TRACKER_STATUS` | content→bg | Check if tracked |
| `MOVE_TRACKER` | content→bg | Update tracker status |
| `HEALTH_CHECK` | popup→bg | Test API connection |
| `RELOAD_SETTINGS` | popup→bg | Refresh config |

## Testing

Test URLs:
- `linkedin.com/company/anthropic` - Company page
- `linkedin.com/company/stripe` - Company page
- `linkedin.com/in/username` - Profile page (searches by founder name)

Check console for `[Carya]` logs.

## Troubleshooting

### "Saved locally" instead of Railway
- **Cause**: API key not set
- **Fix**: Open popup → Settings → Enter API key → Save

### Deal lookup works but tracker fails
- **Cause**: Deal lookup is open access, tracker requires auth
- **Fix**: Set API key in extension popup

### Extension not appearing on LinkedIn
- **Check**: `chrome://extensions/` - ensure enabled
- **Check**: Console for `[Carya]` errors
- **Try**: Reload extension and refresh LinkedIn page
