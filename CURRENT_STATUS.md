# Carya Lens - Current Status

Last Updated: 2026-02-02

## Overview

The Carya Lens Chrome Extension has completed core infrastructure phases. The extension loads in Chrome with a working background service worker and popup.

---

## What's Working

### Extension Loading
- Extension loads successfully in Chrome via `chrome://extensions`
- Service worker initializes and logs startup message
- Popup renders and communicates with background worker
- Icons display correctly in toolbar

### Background Service Worker
- Initializes on extension load
- Handles 6 message types:
  - `PING` - Health check (popup uses this)
  - `LOOKUP_DEAL` - Search for deal data with caching
  - `ADD_TO_TRACKER` - Add company to tracker
  - `CHECK_TRACKER_STATUS` - Check if company is tracked
  - `MOVE_TRACKER` - Update tracker item status
  - `ENRICH_DEAL` - Submit enrichment request
- Logs all operations with structured logger

### Cache Layer
- Chrome Storage API wrapper with TTL support
- 1-hour default TTL for cached data
- Cache keys: `deal:`, `signals:`, `tracker:`
- Automatic expiration checking

### API Services
- HTTP client with auth header support
- Retry logic with exponential backoff
- Error handling and response parsing
- Services: deals, tracker, signals, enrichment, feedback

### LinkedIn Scraping
- Page type detection (profile, company, feed, search, unknown)
- Profile scraping (name, company, title, LinkedIn URL)
- Company scraping (name, website, industry, followers)
- MutationObserver for SPA navigation
- Debounced URL change detection

### Type Safety
- Full TypeScript coverage
- All types compile without errors
- Barrel exports for clean imports

### Tests
- Smoke tests pass: `npm run test`
- Tests cover: formatters, validators, logger, type imports

---

## Files Created (36 files)

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS config
- `postcss.config.js` - PostCSS config
- `build.js` - esbuild bundler
- `manifest.json` - Chrome Extension manifest
- `.gitignore` - Git ignore rules
- `.env.example` - Environment template

### Types (`src/types/`)
- `api.ts` - API response types
- `deals.ts` - Deal data models
- `tracker.ts` - Tracker item types
- `linkedin.ts` - LinkedIn page types
- `signals.ts` - Stealth signal types
- `messages.ts` - Extension message types
- `index.ts` - Barrel export

### Constants (`src/constants/`)
- `config.ts` - App configuration
- `endpoints.ts` - API endpoints
- `linkedin-selectors.ts` - DOM selectors
- `index.ts` - Barrel export

### Utils (`src/utils/`)
- `logger.ts` - Structured logging
- `formatters.ts` - Currency, date formatting
- `validators.ts` - Input validation
- `dom.ts` - DOM utilities
- `index.ts` - Barrel export

### Services (`src/services/`)
- `api/client.ts` - HTTP client
- `api/deals.ts` - Deal API
- `api/tracker.ts` - Tracker API
- `api/signals.ts` - Signals API
- `api/enrichment.ts` - Enrichment API
- `api/feedback.ts` - Feedback API
- `api/index.ts` - Barrel export
- `cache/storage.ts` - Chrome Storage wrapper
- `linkedin/detector.ts` - Page type detection
- `linkedin/scraper.ts` - DOM data extraction
- `linkedin/navigation.ts` - MutationObserver for SPA
- `linkedin/index.ts` - Barrel export

### Background Worker (`src/background/`)
- `index.ts` - Main service worker
- `messages/deals.ts` - Deal message handler
- `messages/tracker.ts` - Tracker message handler
- `messages/enrichment.ts` - Enrichment message handler
- `messages/index.ts` - Barrel export

### UI
- `src/popup.tsx` - Extension popup

### Tests (`test/`)
- `utils.test.ts` - Utility tests
- `logger.test.ts` - Logger tests
- `types.test.ts` - Type import tests

### Assets (`assets/`)
- `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

---

## Build Output

```
dist/
├── background.js     (98.2kb) - Service worker bundle
├── popup.js          (685.4kb) - Popup bundle
├── popup.html        - Popup HTML
├── manifest.json     - Copied manifest
└── assets/           - Extension icons
```

---

## Known Issues

### 1. No Content Script Yet
- LinkedIn overlay not implemented
- DOM scraping services exist but not wired to UI
- Extension doesn't inject anything into LinkedIn pages

### 2. API Not Connected
- Using placeholder URL: `https://api.carya.com`
- No real API key configured
- All API calls will fail until backend is connected

### 3. Popup is Minimal
- Only shows status check
- No settings, cache management, or API key input
- Version display works

### 4. Large Bundle Sizes
- popup.js is 685KB (includes all of React)
- Could be optimized with:
  - Minification (currently disabled for debugging)
  - Tree shaking
  - Code splitting

### 5. No Error Boundary
- React errors in popup will crash silently
- Need error boundary component

---

## Incomplete Items

### Phase 5: React Components + Content Script (Next)
- [ ] `src/components/ui/` - Button, Card, Badge, etc.
- [ ] `src/components/overlay/DealCard.tsx`
- [ ] `src/components/overlay/NotInDatabase.tsx`
- [ ] `src/components/overlay/LoadingState.tsx`
- [ ] `src/components/actions/QuickActionsPanel.tsx`
- [ ] `src/content/linkedin-overlay.tsx` - Main content script
- [ ] Shadow DOM injection and CSS isolation

### Phase 6: Hooks & Context
- [ ] `src/hooks/useDealLookup.ts`
- [ ] `src/hooks/useLinkedInPage.ts`
- [ ] `src/hooks/useTrackerStatus.ts`
- [ ] `src/context/ExtensionContext.tsx`

### Phase 7: Enhanced Popup
- [ ] API key management
- [ ] Cache statistics
- [ ] Clear cache button

---

## Commands

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Type check
npm run type-check

# Run tests
npm run test

# Full verification
npm run verify
```

---

## Loading in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder
5. Click extension icon to see popup

---

## Console Verification

After loading, check service worker console:
1. Click "Inspect views: service worker" on extension card
2. Should see:
   ```
   [Carya Lens] [INFO] - Background service worker initialized
   [Carya Lens] [INFO] - Extension installed/updated
   ```

---

## Next Steps

1. **Phase 5: React Components + Content Script**
   - Build UI component library (Button, Card, Badge)
   - Create DealCard overlay component
   - Create content script with Shadow DOM injection
   - Inject overlay into LinkedIn pages
   - Wire up to background worker via message passing

2. **Phase 6: Hooks & Context**
   - Create useDealLookup hook for data fetching
   - Create useLinkedInPage hook for page detection
   - Set up ExtensionContext for global state

3. **Phase 7: Enhanced Popup**
   - Add API key management UI
   - Add cache statistics display
   - Add clear cache functionality

---

## Architecture Notes

### Message Flow
```
Popup/Content Script
    ↓ chrome.runtime.sendMessage()
Background Worker
    ↓ Check cache (chrome.storage.local)
    ↓ If miss: API call
    ↓ Store in cache
    ↓ Return response
Popup/Content Script
    ↓ Update UI
```

### Build System
- **esbuild** (not Plasmo) for faster, simpler builds
- **IIFE format** for service worker (ESM not supported)
- **ESM format** for popup
- **Path aliases** via esbuild-plugin-alias (`@/` → `src/`)

### Key Decisions
1. Switched from Plasmo to plain esbuild for build control
2. Using IIFE for service worker (Chrome MV3 requirement)
3. Static config values (no process.env in browser)
4. Structured logging for debugging
