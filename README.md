# Carya Lens - Chrome Extension

> Instant deal intelligence overlays on LinkedIn

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)]()
[![Verified](https://img.shields.io/badge/Codebase-Verified-success)]()
[![Tests](https://img.shields.io/badge/Tests-27%2F27%20Passing-success)]()

**Status:** ✅ Foundation verified - 24 files compiling with 0 errors

## Verification Status

See [VERIFICATION_SUMMARY.md](./VERIFICATION_SUMMARY.md) for complete verification results.

```bash
# Verify codebase health
npm run verify
# ✅ TypeScript: 0 errors
# ✅ Tests: 27/27 passing
```

## Quick Start

```bash
# Install dependencies
npm install

# Verify installation
npm run verify

# Start development server (when components are ready)
npm run dev

# Build for production
npm run build
```

## Load Extension in Chrome

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `build/chrome-mv3-dev` folder

## Configuration

1. Copy `.env.example` to `.env`
2. Update API configuration if needed
3. Click extension icon in Chrome toolbar
4. Enter your API key in the popup

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## Development

The extension uses:
- **Plasmo Framework** for Chrome Extension development
- **React** for UI components
- **TailwindCSS** for styling
- **TypeScript** for type safety

## Features

- Deal context overlay on LinkedIn profiles
- Stealth signal detection
- Quick actions (add to tracker, enrich, export)
- Relationship mapping
- 1-hour cache for performance

## Support

For issues or questions, contact support@carya.com
