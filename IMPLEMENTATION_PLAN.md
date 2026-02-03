# Carya Lens - Production Architecture Plan

## Executive Summary

This plan outlines a complete production-grade architecture for the Carya Lens Chrome Extension, built with Plasmo framework. The extension will overlay LinkedIn profiles and company pages with deal intelligence, funding data, and quick-action workflows.

---

## 1. FILE STRUCTURE

```
carya-lens/
├── .plasmo/                          # Plasmo build artifacts (gitignored)
├── build/                            # Production builds (gitignored)
├── node_modules/                     # Dependencies (gitignored)
├── src/
│   ├── background/
│   │   ├── index.ts                 # Main background service worker
│   │   ├── messages/                # Message handlers for extension messaging
│   │   │   ├── index.ts
│   │   │   ├── deals.ts             # Handle deal lookup messages
│   │   │   ├── tracker.ts           # Handle tracker operations
│   │   │   └── enrichment.ts        # Handle enrichment requests
│   │   └── ports/                   # Long-lived connections handlers
│   │       └── index.ts
│   │
│   ├── content/                      # Content scripts (auto-injected by Plasmo)
│   │   ├── linkedin-overlay.tsx     # Main content script for LinkedIn
│   │   └── linkedin-overlay.css     # Isolated styles (Shadow DOM)
│   │
│   ├── components/                   # React components
│   │   ├── overlay/
│   │   │   ├── DealCard.tsx         # Main deal information card
│   │   │   ├── StealthSignals.tsx   # Pre-funding signals component
│   │   │   ├── RelationshipMap.tsx  # Founder relationship display
│   │   │   ├── NotInDatabase.tsx    # "Not found" state component
│   │   │   └── LoadingState.tsx     # Skeleton/loading UI
│   │   │
│   │   ├── actions/
│   │   │   ├── QuickActionsPanel.tsx  # Main actions dropdown
│   │   │   ├── AddToTrackerButton.tsx
│   │   │   ├── MoveStatusDropdown.tsx
│   │   │   ├── FlagIssueButton.tsx
│   │   │   ├── ExportButton.tsx
│   │   │   └── EnrichButton.tsx
│   │   │
│   │   └── ui/                       # Reusable UI primitives
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Dropdown.tsx
│   │       ├── Badge.tsx
│   │       └── Tooltip.tsx
│   │
│   ├── popup/                        # Extension popup (icon in toolbar)
│   │   ├── index.tsx                # Main popup component
│   │   └── index.css                # Popup styles
│   │
│   ├── services/                     # Business logic & API layer
│   │   ├── api/
│   │   │   ├── client.ts            # Base HTTP client with auth
│   │   │   ├── deals.ts             # Deal endpoints
│   │   │   ├── tracker.ts           # Tracker endpoints
│   │   │   ├── enrichment.ts        # Enrichment endpoints
│   │   │   ├── signals.ts           # Stealth signals endpoints
│   │   │   └── feedback.ts          # Feedback/suggestions endpoints
│   │   │
│   │   ├── linkedin/
│   │   │   ├── scraper.ts           # Extract data from LinkedIn DOM
│   │   │   ├── detector.ts          # Detect page type (profile/company)
│   │   │   ├── selectors.ts         # Stable DOM selector strategies
│   │   │   └── navigation.ts        # Handle SPA navigation changes
│   │   │
│   │   └── cache/
│   │       └── storage.ts           # Chrome Storage API wrapper (TTL cache)
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useLinkedInPage.ts       # Detect & parse current LinkedIn page
│   │   ├── useDealLookup.ts         # Fetch deal data with caching
│   │   ├── useTrackerStatus.ts      # Check if company is tracked
│   │   ├── useStealthSignals.ts     # Fetch pre-funding signals
│   │   └── useStorage.ts            # Plasmo storage hook wrapper
│   │
│   ├── context/
│   │   ├── ExtensionContext.tsx     # Global extension state
│   │   └── LinkedInContext.tsx      # Current page context provider
│   │
│   ├── types/                        # TypeScript definitions
│   │   ├── api.ts                   # API request/response types
│   │   ├── deals.ts                 # Deal data models
│   │   ├── tracker.ts               # Tracker item types
│   │   ├── linkedin.ts              # LinkedIn page data types
│   │   ├── signals.ts               # Stealth signal types
│   │   └── messages.ts              # Extension message types
│   │
│   ├── utils/
│   │   ├── dom.ts                   # DOM utility functions
│   │   ├── formatters.ts            # Data formatting (currency, dates)
│   │   ├── validators.ts            # Input validation
│   │   └── logger.ts                # Structured logging utility
│   │
│   └── constants/
│       ├── config.ts                # App-wide constants
│       ├── linkedin-selectors.ts    # LinkedIn DOM selectors
│       └── endpoints.ts             # API endpoint URLs
│
├── assets/                           # Extension assets
│   ├── icon.png                     # Extension icon (128x128)
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
│
├── .env.example                      # Environment variables template
├── .env                              # Local environment (gitignored)
├── .gitignore
├── package.json
├── package-lock.json
├── plasmo.config.ts                  # Plasmo configuration
├── postcss.config.js                 # PostCSS for Tailwind
├── tailwind.config.js                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── CLAUDE.md                         # Project context for Claude
├── IMPLEMENTATION_PLAN.md            # This file
└── README.md                         # Project documentation
```

---

## 2. DATA FLOW ARCHITECTURE

### 2.1 Overview Flow

```
LinkedIn DOM
    ↓
[MutationObserver detects page change]
    ↓
Content Script (linkedin-overlay.tsx)
    ↓
LinkedIn Scraper Service (extracts company/founder data)
    ↓
Chrome Extension Messaging
    ↓
Background Service Worker (handles API calls)
    ↓
Chrome Storage API (1-hour TTL cache check)
    ↓
Backend API (if cache miss)
    ↓
Background Worker processes response
    ↓
Chrome Extension Messaging (sends data back)
    ↓
Content Script React Component
    ↓
Overlay Card Renders on LinkedIn Page
```

### 2.2 Detailed Flow by Feature

#### A. Deal Lookup Flow
1. **LinkedIn DOM → Content Script**
   - MutationObserver in `linkedin-overlay.tsx` detects URL change
   - `detector.ts` identifies page type (profile/company)
   - `scraper.ts` extracts: company name, founder name, LinkedIn URL, domain

2. **Content Script → Background Worker**
   - Content script sends message: `{ type: 'LOOKUP_DEAL', payload: { companyName, founderName } }`
   - Uses `chrome.runtime.sendMessage()` API

3. **Background Worker Processing**
   - `background/messages/deals.ts` receives message
   - Checks `chrome.storage.local` for cached result (key: `deal:${companyName}`, TTL: 1 hour)
   - If cache hit: return cached data
   - If cache miss: call `GET /deals?search={query}` with X-API-Key header

4. **API Response → Cache → Content Script**
   - Background worker stores result in `chrome.storage.local` with timestamp
   - Sends response back to content script: `{ success: true, data: dealData }`

5. **Content Script → React UI**
   - `useDealLookup` hook receives data
   - Updates React state
   - `DealCard.tsx` component renders with deal info

#### B. Quick Actions Flow (Add to Tracker)
1. **User clicks "Add to Tracker" button**
2. **Component → Content Script → Background Worker**
   - `AddToTrackerButton.tsx` triggers action
   - Sends message: `{ type: 'ADD_TO_TRACKER', payload: { companyName, website, founderLinkedIn } }`

3. **Background Worker → API**
   - `background/messages/tracker.ts` handles message
   - Calls `POST /tracker` with pre-filled data

4. **API Response → UI Update**
   - Success response triggers cache invalidation for tracker status
   - Content script shows success toast
   - Button changes to "Move to {status}" dropdown

#### C. Stealth Signals Flow
1. **Triggered automatically** after deal lookup completes
2. **Background Worker** calls `GET /stealth-signals?company_name={name}`
3. **Cached separately** (key: `signals:${companyName}`, TTL: 1 hour)
4. **`StealthSignals.tsx`** displays: HN upvotes, YC batch, GitHub stars, hiring velocity

#### D. Enrichment Flow
1. **User clicks "Enrich Deal" button**
2. **Content Script → Background Worker**
   - `EnrichButton.tsx` sends: `{ type: 'ENRICH_DEAL', payload: { linkedInUrl, scrapedData } }`
   - `scrapedData` includes: current title, company, domain from LinkedIn

3. **Background Worker → API**
   - Calls `POST /enrichment/linkedin` with enriched payload
   - No caching (explicit action)

4. **Response → UI Feedback**
   - Shows "Enrichment submitted" confirmation
   - Invalidates deal cache to show updated data on next lookup

### 2.3 Error Handling
- **Network failures**: Retry with exponential backoff (3 attempts)
- **API errors**: Show user-friendly error in overlay
- **Cache corruption**: Fallback to API call, log error
- **LinkedIn DOM changes**: Graceful degradation, log selector failures

---

## 3. COMPONENT HIERARCHY

### 3.1 Content Script Root Component

```
<LinkedInOverlay>                     # Root content script component
  <ExtensionContextProvider>          # Global extension state
    <LinkedInContextProvider>         # Current page context
      {pageType === 'profile' && (
        <ProfileOverlay>
          <DealCard />              # Main deal information
          <StealthSignals />        # Pre-funding signals
          <RelationshipMap />       # Founder relationships
          <QuickActionsPanel />     # Action buttons
        </ProfileOverlay>
      )}

      {pageType === 'company' && (
        <CompanyOverlay>
          <DealCard />
          <StealthSignals />
          <QuickActionsPanel />
        </CompanyOverlay>
      )}

      {!dealFound && (
        <NotInDatabase>
          <SuggestAdditionButton />
        </NotInDatabase>
      )}
    </LinkedInContextProvider>
  </ExtensionContextProvider>
</LinkedInOverlay>
```

### 3.2 Component Breakdown

#### DealCard.tsx
**Props:**
- `dealData: DealData | null`
- `loading: boolean`
- `onRefresh: () => void`

**Displays:**
- Funding amount (formatted: "$2.5M")
- Lead investor name + logo
- Round stage (Seed, Series A, etc.)
- Verification snippet (short text from verification_content)
- Deal date (formatted: "Jan 2024")

#### StealthSignals.tsx
**Props:**
- `signals: StealthSignalData | null`
- `threshold: number` (default: 70)

**Conditional Rendering:**
- Only shows if `signals.score > threshold`
- Displays badges for: HN upvotes, YC batch, GitHub stars, LinkedIn hiring velocity
- Colored indicator (green = hot, yellow = warm)

#### RelationshipMap.tsx
**Props:**
- `founderName: string`
- `relationships: RelationshipData[]`

**Displays:**
- List of founder's previous companies
- For each: company name, funding received, lead investor, year

#### QuickActionsPanel.tsx
**Props:**
- `isTracked: boolean`
- `currentStatus: TrackerStatus | null`
- `companyData: ScrapedCompanyData`

**Actions:**
- `<AddToTrackerButton />` (if not tracked)
- `<MoveStatusDropdown />` (if tracked)
- `<FlagIssueButton />`
- `<ExportButton />`
- `<EnrichButton />`

#### NotInDatabase.tsx
**Props:**
- `companyName: string`
- `onSuggest: (companyName: string) => void`

**Displays:**
- "Not in Database" message
- "Suggest Addition" button → triggers `POST /feedback/suggestion`

### 3.3 Popup Component (Toolbar Icon)

```
<PopupRoot>
  <Header>
    <Logo />
    <SettingsButton />
  </Header>

  <Stats>
    <CacheStats />            # Show cache hit rate
    <APIStatus />             # Backend health
  </Stats>

  <Actions>
    <ClearCacheButton />
    <ReloadExtensionButton />
  </Actions>

  <Footer>
    <VersionInfo />
    <FeedbackLink />
  </Footer>
</PopupRoot>
```

---

## 4. DOM STRATEGY FOR LINKEDIN

### 4.1 Challenge: Obfuscated Selectors
LinkedIn uses dynamically generated class names (e.g., `artdeco-card__123abc`) that change frequently. We cannot rely on CSS classes.

### 4.2 Stable Selector Strategy

#### A. Use `data-*` Attributes
LinkedIn uses stable data attributes for analytics:
```typescript
// Profile page detection
const profileContainer = document.querySelector('[data-control-name="profile_highlights"]');

// Company page detection
const companyContainer = document.querySelector('[data-control-name="org_company_employees"]');
```

#### B. ARIA Labels (Accessibility Attributes)
```typescript
// Name extraction from profile
const nameElement = document.querySelector('[aria-label*="name"]');

// Company name from company page
const companyName = document.querySelector('[role="heading"][aria-level="1"]');
```

#### C. URL Pattern Matching
```typescript
function detectPageType(): 'profile' | 'company' | 'feed' | 'unknown' {
  const url = window.location.href;

  if (url.includes('/in/')) return 'profile';
  if (url.includes('/company/')) return 'company';
  if (url.includes('/feed/')) return 'feed';

  return 'unknown';
}
```

#### D. Structural Hierarchy (Last Resort)
```typescript
// Fallback: traverse DOM structure
const profile = document.querySelector('main section:first-of-type');
const name = profile?.querySelector('h1')?.textContent;
```

### 4.3 Extraction Functions (src/services/linkedin/scraper.ts)

```typescript
export interface ScrapedProfileData {
  founderName: string | null;
  currentCompany: string | null;
  currentTitle: string | null;
  linkedInUrl: string;
  profilePictureUrl: string | null;
}

export interface ScrapedCompanyData {
  companyName: string | null;
  website: string | null;
  linkedInUrl: string;
  industry: string | null;
  followerCount: number | null;
}

export function scrapeProfile(): ScrapedProfileData {
  // Strategy 1: Try data-control-name
  let nameElement = document.querySelector('[data-control-name="profile_highlights"] h1');

  // Strategy 2: Try ARIA labels
  if (!nameElement) {
    nameElement = document.querySelector('main section h1');
  }

  // Strategy 3: Structured fallback
  if (!nameElement) {
    nameElement = document.querySelector('main h1');
  }

  const founderName = nameElement?.textContent?.trim() || null;

  // Current company extraction
  const experienceSection = document.querySelector('[id*="experience"]');
  const currentCompanyElement = experienceSection?.querySelector('li:first-child [aria-hidden="true"]');
  const currentCompany = currentCompanyElement?.textContent?.trim() || null;

  return {
    founderName,
    currentCompany,
    currentTitle: extractCurrentTitle(),
    linkedInUrl: window.location.href,
    profilePictureUrl: extractProfilePicture(),
  };
}

export function scrapeCompany(): ScrapedCompanyData {
  // Company name (h1 in main section)
  const nameElement = document.querySelector('main h1');
  const companyName = nameElement?.textContent?.trim() || null;

  // Website link
  const websiteLink = document.querySelector('a[href*="http"]:not([href*="linkedin.com"])');
  const website = websiteLink?.getAttribute('href') || null;

  return {
    companyName,
    website,
    linkedInUrl: window.location.href,
    industry: extractIndustry(),
    followerCount: extractFollowerCount(),
  };
}
```

### 4.4 MutationObserver Setup

```typescript
// src/services/linkedin/navigation.ts
export function observeNavigation(callback: (pageType: PageType) => void): void {
  let lastUrl = window.location.href;

  // Observer for SPA navigation
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;

    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      const pageType = detectPageType();
      callback(pageType);
    }
  });

  // Observe body for any changes (LinkedIn SPA)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also listen to popstate (back/forward navigation)
  window.addEventListener('popstate', () => {
    const pageType = detectPageType();
    callback(pageType);
  });
}
```

### 4.5 Overlay Injection Strategy

**Shadow DOM** (recommended for isolation):
```typescript
// Create shadow root to avoid LinkedIn CSS conflicts
const container = document.createElement('div');
container.id = 'carya-lens-container';
document.body.appendChild(container);

const shadowRoot = container.attachShadow({ mode: 'open' });

// Inject Tailwind styles into shadow DOM
const styleSheet = document.createElement('style');
styleSheet.textContent = tailwindCss; // Bundled by Plasmo
shadowRoot.appendChild(styleSheet);

// Render React component
const reactRoot = document.createElement('div');
shadowRoot.appendChild(reactRoot);

ReactDOM.createRoot(reactRoot).render(<LinkedInOverlay />);
```

**Positioning:**
- Fixed position: `top-right` corner of viewport
- Z-index: `9999` (above LinkedIn modals)
- Responsive: Collapse on mobile viewports

---

## 5. SECURITY & PERMISSIONS

### 5.1 manifest.json Permissions (Minimum Required)

```json
{
  "manifest_version": 3,
  "name": "Carya Lens",
  "version": "1.0.0",
  "description": "Instant deal context overlay for LinkedIn profiles and companies",

  "permissions": [
    "storage",           // Required: Chrome Storage API for caching
    "activeTab"          // Required: Access current tab for overlay injection
  ],

  "host_permissions": [
    "https://www.linkedin.com/*",     // Required: Inject content script on LinkedIn
    "https://api.carya.com/*"         // Required: Make API calls to your backend
  ],

  "content_scripts": [
    {
      "matches": ["https://www.linkedin.com/*"],
      "js": ["content/linkedin-overlay.tsx"],
      "css": ["content/linkedin-overlay.css"],
      "run_at": "document_idle"       // Wait for DOM to be ready
    }
  ],

  "background": {
    "service_worker": "background/index.ts"
  },

  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "assets/icon-16.png",
      "48": "assets/icon-48.png",
      "128": "assets/icon-128.png"
    }
  },

  "icons": {
    "16": "assets/icon-16.png",
    "48": "assets/icon-48.png",
    "128": "assets/icon-128.png"
  }
}
```

### 5.2 Security Considerations

#### A. API Key Storage
**DO NOT** hardcode API keys in source code.

**Strategy:**
```typescript
// Store API key in chrome.storage.sync (encrypted by Chrome)
await chrome.storage.sync.set({ apiKey: userProvidedKey });

// Retrieve in background worker
const { apiKey } = await chrome.storage.sync.get('apiKey');
```

**First-run experience:**
- Popup shows "Enter API Key" form
- Store key in `chrome.storage.sync` (syncs across devices)
- Validate key by making test API call

#### B. Content Security Policy
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

#### C. Message Validation
```typescript
// background/index.ts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate sender is from our extension
  if (!sender.id || sender.id !== chrome.runtime.id) {
    sendResponse({ success: false, error: 'Invalid sender' });
    return;
  }

  // Validate message structure
  if (!message.type || !message.payload) {
    sendResponse({ success: false, error: 'Invalid message format' });
    return;
  }

  // Handle message...
});
```

#### D. XSS Prevention
- **Never** use `dangerouslySetInnerHTML`
- **Sanitize** all data from LinkedIn DOM before rendering
- **Escape** user inputs in API requests

---

## 6. CRITICAL FILES TO CREATE (Priority Order)

### Phase 1: Setup (Required Before Coding)
1. ✅ `package.json` - Dependencies (Plasmo, React, Tailwind, TypeScript)
2. ✅ `tsconfig.json` - TypeScript configuration
3. ✅ `tailwind.config.js` - Tailwind with Shadow DOM support
4. ✅ `postcss.config.js` - PostCSS for Tailwind
5. ✅ `.gitignore` - Ignore build/, .plasmo/, node_modules/
6. ✅ `.env.example` - Environment variable template

### Phase 2: Core Infrastructure ✅
1. ✅ `src/constants/config.ts` - App-wide constants
2. ✅ `src/constants/endpoints.ts` - API URLs
3. ✅ `src/constants/linkedin-selectors.ts` - LinkedIn DOM selectors
4. ✅ `src/types/` - All TypeScript type definitions (api, deals, tracker, linkedin, signals, messages)
5. ✅ `src/utils/` - Utility functions (logger, formatters, validators, dom)
6. ✅ `src/services/api/client.ts` - Base HTTP client
7. ✅ `src/services/api/` - API services (deals, tracker, signals, enrichment, feedback)
8. ✅ `src/services/cache/storage.ts` - Chrome Storage wrapper with TTL

### Phase 3: Background Worker ✅
1. ✅ `src/background/index.ts` - Main service worker with message routing
2. ✅ `src/background/messages/deals.ts` - Deal lookup handler
3. ✅ `src/background/messages/tracker.ts` - Tracker operations (add, check, move)
4. ✅ `src/background/messages/enrichment.ts` - Enrichment handler
5. ✅ `src/background/messages/index.ts` - Barrel export

### Phase 4: Build & Extension Loading ✅
1. ✅ `build.js` - esbuild configuration
2. ✅ `manifest.json` - Chrome Extension manifest
3. ✅ `src/popup.tsx` - Basic popup with status check
4. ✅ `assets/` - Extension icons (16, 32, 48, 128)

### Phase 5: LinkedIn Integration ✅
1. ✅ `src/services/linkedin/detector.ts` - Page type detection
2. ✅ `src/services/linkedin/scraper.ts` - Data extraction
3. ✅ `src/services/linkedin/navigation.ts` - MutationObserver
4. ✅ `src/services/linkedin/index.ts` - Barrel export

### Phase 6: React Components + Content Script (Next)
1. `src/components/ui/` - Base UI components (Button, Card, etc.)
2. `src/components/overlay/DealCard.tsx` - Main deal card
3. `src/components/overlay/NotInDatabase.tsx` - Not found state
4. `src/components/overlay/LoadingState.tsx` - Loading skeleton
5. `src/components/actions/QuickActionsPanel.tsx` - Action buttons
6. `src/content/linkedin-overlay.tsx` - Main content script
7. `src/content/linkedin-overlay.css` - Shadow DOM styles

### Phase 7: Hooks & Context
1. `src/hooks/useLinkedInPage.ts` - Page detection hook
2. `src/hooks/useDealLookup.ts` - Deal data hook
3. `src/hooks/useTrackerStatus.ts` - Tracker status hook
4. `src/context/ExtensionContext.tsx` - Global state

### Phase 8: Enhanced Popup
1. API key management UI
2. Cache statistics display
3. Clear cache functionality

---

## 7. IMPLEMENTATION PHASES

### Phase 1: Scaffold & Setup (Day 1) ✅
- Initialize Plasmo project
- Install dependencies
- Configure Tailwind for Shadow DOM
- Set up TypeScript
- Create folder structure

### Phase 2: Background Worker & API Layer (Day 2)
- Implement base HTTP client with auth
- Create API service modules
- Implement Chrome Storage caching
- Set up message handlers

### Phase 3: LinkedIn Scraping (Day 3)
- Implement page type detector
- Create DOM selector strategies
- Build scraper functions
- Set up MutationObserver

### Phase 4: Core UI Components (Day 4-5)
- Build base UI components (Button, Card, etc.)
- Create DealCard component
- Implement NotInDatabase state
- Style with Tailwind (Shadow DOM compatible)

### Phase 5: Content Script Integration (Day 6)
- Wire content script to background worker
- Implement React hooks for data fetching
- Set up context providers
- Inject overlay on LinkedIn pages

### Phase 6: Quick Actions (Day 7)
- Implement Add to Tracker
- Implement Move Status dropdown
- Implement Enrich Deal
- Implement Export to CSV

### Phase 7: Advanced Features (Day 8)
- Stealth Signals component
- Relationship Mapping component
- Flag Issue feature

### Phase 8: Popup & Settings (Day 9)
- Build toolbar popup
- Implement API key management
- Add cache management UI

### Phase 9: Testing & Polish (Day 10)
- Manual testing on LinkedIn
- Error handling
- Loading states
- Performance optimization

---

## 8. VERIFICATION PLAN

### Manual Testing Checklist

#### LinkedIn Profile Pages
1. Navigate to any LinkedIn profile (e.g., founder of a funded company)
2. Verify overlay appears in top-right corner
3. Verify deal data displays correctly (funding, investor, stage)
4. Click "Add to Tracker" → verify success message
5. Reload page → verify data loads from cache (fast)
6. Navigate to another profile → verify overlay updates

#### LinkedIn Company Pages
1. Navigate to any company page
2. Verify overlay appears
3. Verify company data displays
4. Test "Enrich Deal" button

#### Not in Database
1. Navigate to a profile/company not in backend
2. Verify "Not in Database" component shows
3. Click "Suggest Addition" → verify API call

#### Stealth Signals
1. Navigate to a high-signal company
2. Verify Stealth Signals component appears
3. Verify badges show correct data

#### SPA Navigation
1. Navigate from profile → company → feed → profile
2. Verify overlay updates correctly on each navigation
3. Verify no memory leaks (check Chrome DevTools)

#### Popup
1. Click extension icon
2. Verify popup displays stats
3. Click "Clear Cache" → verify cache clears
4. Enter API key → verify saves to chrome.storage

### Automated Testing (Future)
- Unit tests: API client, scraper functions, utilities
- Integration tests: Message passing, cache layer
- E2E tests: Playwright for LinkedIn interaction

---

## 9. DEPENDENCIES (package.json)

```json
{
  "dependencies": {
    "plasmo": "^0.84.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.253",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.2"
  }
}
```

---

## 10. OPEN QUESTIONS FOR USER

1. **API Base URL**: What is the production API base URL? (e.g., `https://api.carya.com`)
2. **API Key Management**: Should API key be user-provided (via popup) or team-shared?
3. **Rate Limiting**: Are there API rate limits we need to handle?
4. **Cache TTL**: Is 1 hour acceptable, or should it be configurable?
5. **Overlay Position**: Top-right fixed? Or draggable by user?
6. **Mobile Support**: Should extension work on mobile LinkedIn?
7. **Error Reporting**: Should errors be sent to a logging service (e.g., Sentry)?

---

## NEXT STEPS

Implementation proceeding in phases as outlined above. The architecture is designed to be:

- **Maintainable**: Clear separation of concerns (services, components, background)
- **Scalable**: Modular structure supports adding new features
- **Performant**: Caching layer minimizes API calls
- **Secure**: Minimal permissions, API key encryption, message validation
- **Testable**: Pure functions for scraping/parsing, mockable API layer

---

## STATUS TRACKING

### Completed
- ✅ **Phase 1: Project Setup** - package.json, tsconfig.json, tailwind.config.js, postcss.config.js, .gitignore, .env.example
- ✅ **Phase 2: Core Infrastructure** - Types, constants, utils, API services, cache layer
- ✅ **Phase 3: Verification** - Test suite created and passing (utils, logger, types)
- ✅ **Phase 4: Background Worker** - Service worker with message handlers (deals, tracker, enrichment)
- ✅ **Phase 5: LinkedIn Scraping** - detector.ts, scraper.ts, navigation.ts (100% verified)
- ✅ **Build Configuration** - esbuild bundler, manifest.json, extension loads in Chrome

### In Progress
- 🔄 **Phase 6: React Components + Content Script** - Next up

### Pending
- ⏳ Phase 7: Hooks & Context
- ⏳ Phase 8: Enhanced Popup
- ⏳ Phase 9: Testing & Polish

### Blocked
- None currently

---

Last Updated: 2026-02-02
