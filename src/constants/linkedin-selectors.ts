// LinkedIn DOM selector strategies

import type { SelectorStrategy } from '../types/linkedin';

// Profile Page Selectors
export const PROFILE_SELECTORS = {
  // Name
  NAME: {
    primary: {
      selector: '[data-control-name="profile_highlights"] h1',
    },
    fallbacks: [
      { selector: 'main section h1' },
      { selector: 'main h1' },
      { selector: '.pv-text-details__left-panel h1' },
    ],
  } as SelectorStrategy,

  // Headline (current title)
  HEADLINE: {
    primary: {
      selector: '[data-control-name="profile_highlights"] .text-body-medium',
    },
    fallbacks: [
      { selector: '.pv-text-details__left-panel .text-body-medium' },
      { selector: 'main section .text-body-medium' },
    ],
  } as SelectorStrategy,

  // Profile Picture
  PROFILE_PICTURE: {
    primary: {
      selector: '.pv-top-card-profile-picture__image',
      attribute: 'src',
    },
    fallbacks: [
      { selector: '[data-test-profile-picture] img', attribute: 'src' },
      { selector: 'main img[alt*="profile picture"]', attribute: 'src' },
    ],
  } as SelectorStrategy,

  // Location
  LOCATION: {
    primary: {
      selector: '.pv-text-details__left-panel .text-body-small',
    },
    fallbacks: [
      { selector: '[data-control-name="profile_highlights"] .text-body-small' },
    ],
  } as SelectorStrategy,

  // Current Experience (first experience item)
  CURRENT_COMPANY: {
    primary: {
      selector: '#experience ~ div li:first-child [aria-hidden="true"]',
    },
    fallbacks: [
      { selector: '.experience-item:first-child .t-14' },
      { selector: '[data-section="experience"] li:first-child' },
    ],
  } as SelectorStrategy,

  CURRENT_TITLE: {
    primary: {
      selector: '#experience ~ div li:first-child .t-14.t-bold',
    },
    fallbacks: [
      { selector: '.experience-item:first-child .t-bold' },
      { selector: '[data-section="experience"] li:first-child .t-bold' },
    ],
  } as SelectorStrategy,
} as const;

// Company Page Selectors
export const COMPANY_SELECTORS = {
  // Company Name
  NAME: {
    primary: {
      selector: 'main h1',
    },
    fallbacks: [
      { selector: '.org-top-card-summary__title' },
      { selector: '[data-control-name="org_company_name"]' },
    ],
  } as SelectorStrategy,

  // Website
  WEBSITE: {
    primary: {
      selector: 'a[href*="http"]:not([href*="linkedin.com"])',
      attribute: 'href',
    },
    fallbacks: [
      { selector: '.org-page-details__definition-text a', attribute: 'href' },
      { selector: '[data-test-company-website] a', attribute: 'href' },
    ],
  } as SelectorStrategy,

  // Tagline
  TAGLINE: {
    primary: {
      selector: '.org-top-card-summary__tagline',
    },
    fallbacks: [
      { selector: 'main h2' },
      { selector: '.org-top-card-summary__info-item' },
    ],
  } as SelectorStrategy,

  // Industry
  INDUSTRY: {
    primary: {
      selector: '.org-top-card-summary-info-list__info-item:has-text("Industry")',
    },
    fallbacks: [
      { selector: '[data-test-company-industry]' },
      { selector: '.org-page-details__definition-text' },
    ],
  } as SelectorStrategy,

  // Company Size
  COMPANY_SIZE: {
    primary: {
      selector: '.org-top-card-summary-info-list__info-item:has-text("employees")',
    },
    fallbacks: [
      { selector: '[data-test-company-size]' },
    ],
  } as SelectorStrategy,

  // Follower Count
  FOLLOWERS: {
    primary: {
      selector: '.org-top-card-summary-info-list__info-item:has-text("followers")',
    },
    fallbacks: [
      { selector: '[data-test-follower-count]' },
    ],
  } as SelectorStrategy,

  // Headquarters
  HEADQUARTERS: {
    primary: {
      selector: '.org-top-card-summary-info-list__info-item:has-text("Headquarters")',
    },
    fallbacks: [
      { selector: '[data-test-company-location]' },
    ],
  } as SelectorStrategy,
} as const;

// Feed Page Selectors (for future use)
export const FEED_SELECTORS = {
  POSTS: {
    primary: {
      selector: '.feed-shared-update-v2',
    },
    fallbacks: [
      { selector: '[data-id*="urn:li:activity"]' },
    ],
  } as SelectorStrategy,
} as const;

// URL Patterns for Page Detection
export const URL_PATTERNS = {
  PROFILE: /linkedin\.com\/in\/[^/]+\/?$/,
  COMPANY: /linkedin\.com\/company\/[^/]+\/?$/,
  FEED: /linkedin\.com\/feed\/?/,
  POST: /linkedin\.com\/posts\//,
  SEARCH: /linkedin\.com\/search\//,
} as const;

// Helper function to extract text content
export function extractTextContent(element: Element | null): string | null {
  if (!element) return null;
  return element.textContent?.trim() || null;
}

// Helper function to extract attribute
export function extractAttribute(
  element: Element | null,
  attribute: string
): string | null {
  if (!element) return null;
  return element.getAttribute(attribute);
}

// Helper function to try multiple selectors
export function trySelectors(
  strategy: SelectorStrategy,
  container: Document | Element = document
): Element | null {
  // Try primary selector
  const primaryElement = container.querySelector(strategy.primary.selector);
  if (primaryElement) return primaryElement;

  // Try fallback selectors
  for (const fallback of strategy.fallbacks) {
    const element = container.querySelector(fallback.selector);
    if (element) return element;
  }

  return null;
}
