# LinkedIn Scraper Manual Test Instructions

## Quick Test (5 minutes)

### Step 1: Open LinkedIn
Navigate to any LinkedIn profile or company page. Examples:
- **Profile**: `https://www.linkedin.com/in/satyanadella/` (Microsoft CEO)
- **Company**: `https://www.linkedin.com/company/microsoft/`

### Step 2: Open Chrome DevTools
- **Mac**: `Cmd + Option + I`
- **Windows/Linux**: `F12` or `Ctrl + Shift + I`

### Step 3: Go to Console Tab
Click on the "Console" tab in DevTools

### Step 4: Run the Test Script

**Option A: Copy from file**
```bash
# From project root:
cat test/linkedin-scraper-manual.js | pbcopy
```
Then paste into Console and press Enter

**Option B: Manual copy-paste**
1. Open `test/linkedin-scraper-manual.js`
2. Select all (`Cmd+A` / `Ctrl+A`)
3. Copy (`Cmd+C` / `Ctrl+C`)
4. Paste into Console (`Cmd+V` / `Ctrl+V`)
5. Press `Enter`

### Step 5: Review Results

The script will output:
- ✅ What data was successfully extracted
- ❌ What data failed to extract
- 📊 Success rate percentage
- 🔍 Detailed logs showing which DOM strategies worked

## Expected Results

### For Profile Pages
Should extract:
- ✅ Founder Name (e.g., "Satya Nadella")
- ✅ Current Company (e.g., "Microsoft")
- ✅ Current Title (e.g., "Chairman and CEO")
- ✅ LinkedIn URL
- ✅ Profile Picture URL

**Success threshold**: ≥60% (3/5 fields)

### For Company Pages
Should extract:
- ✅ Company Name (e.g., "Microsoft")
- ✅ Website (e.g., "https://www.microsoft.com")
- ✅ LinkedIn URL
- ⚠️ Industry (may not be visible on all pages)
- ⚠️ Follower Count (may not be visible on all pages)

**Success threshold**: ≥60% (3/5 fields)

## Troubleshooting

### If success rate < 60%

**Possible causes:**
1. **LinkedIn updated DOM structure** - Check extraction logs to see which strategies failed
2. **Incomplete profile/page** - Try a different, more complete LinkedIn profile
3. **Privacy settings** - Some profiles hide information
4. **Page not fully loaded** - Wait a few seconds and run the script again

### If you see "Not a profile or company page"

Make sure you're on:
- Profile URL pattern: `linkedin.com/in/{username}`
- Company URL pattern: `linkedin.com/company/{company-slug}`

Not on:
- Feed (`linkedin.com/feed`)
- Search results (`linkedin.com/search`)
- Messaging (`linkedin.com/messaging`)

## What to Report Back

Please share:
1. **Success rate** (e.g., "4/5 fields - 80%")
2. **Which fields failed** (if any)
3. **LinkedIn page tested** (profile or company, public or private)
4. **Any error messages** from the console

## Example Output

```
🧪 LinkedIn Scraper Manual Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Current page: https://www.linkedin.com/in/satyanadella/
📄 Page type: profile

🎯 Starting profile scrape...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Extracting founder name...
  ✅ Strategy 1: main section h1

🏢 Extracting current company...
  ✅ Found experience section
  ✅ Found first experience entry
  ✅ Extracted company name

💼 Extracting current title...
  ✅ Found title element

📷 Extracting profile picture...
  ✅ Found profile picture URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PROFILE SCRAPE RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────┬──────────────────────────────────────┐
│ Founder Name    │ Satya Nadella                        │
│ Current Company │ Microsoft                            │
│ Current Title   │ Chairman and CEO                     │
│ LinkedIn URL    │ https://www.linkedin.com/in/...      │
│ Profile Picture │ ✅ Found                             │
└─────────────────┴──────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Success Rate: 5/5 fields (100%)
✅ Scraper is working correctly!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏁 Test Complete
```

## Next Steps

After confirming the scraper works:
- ✅ Report success rate
- ✅ Continue to Phase 4 (Background Worker)
- 🔧 If issues found, we'll update selectors before continuing
