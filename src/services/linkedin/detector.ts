/**
 * LinkedIn Page Type Detection
 *
 * Detects what type of LinkedIn page the user is currently viewing.
 * Uses URL patterns as the primary detection method (most reliable).
 */

import { logger } from '@/utils/logger';

export type PageType = 'profile' | 'company' | 'feed' | 'search' | 'messaging' | 'unknown';

export interface PageContext {
  type: PageType;
  url: string;
  profileUsername?: string;  // For profile pages: /in/username
  companySlug?: string;      // For company pages: /company/slug
}

/**
 * Detect the current LinkedIn page type based on URL patterns
 *
 * @returns PageContext with type and extracted identifiers
 */
export function detectPageType(): PageContext {
  const url = window.location.href;
  const pathname = window.location.pathname;

  logger.debug('Detecting LinkedIn page type', { url, pathname });

  // Profile page: /in/username or /in/username/
  const profileMatch = pathname.match(/^\/in\/([^\/]+)\/?$/);
  if (profileMatch) {
    const profileUsername = profileMatch[1];
    logger.info('Detected profile page', { profileUsername });
    return {
      type: 'profile',
      url,
      profileUsername,
    };
  }

  // Company page: /company/slug or /company/slug/
  const companyMatch = pathname.match(/^\/company\/([^\/]+)\/?$/);
  if (companyMatch) {
    const companySlug = companyMatch[1];
    logger.info('Detected company page', { companySlug });
    return {
      type: 'company',
      url,
      companySlug,
    };
  }

  // Feed page: /feed/
  if (pathname.startsWith('/feed')) {
    logger.info('Detected feed page');
    return {
      type: 'feed',
      url,
    };
  }

  // Search page: /search/
  if (pathname.startsWith('/search')) {
    logger.info('Detected search page');
    return {
      type: 'search',
      url,
    };
  }

  // Messaging page: /messaging/
  if (pathname.startsWith('/messaging')) {
    logger.info('Detected messaging page');
    return {
      type: 'messaging',
      url,
    };
  }

  // Unknown page type
  logger.warn('Unknown LinkedIn page type', { pathname });
  return {
    type: 'unknown',
    url,
  };
}

/**
 * Check if current page is a profile page
 */
export function isProfilePage(): boolean {
  return detectPageType().type === 'profile';
}

/**
 * Check if current page is a company page
 */
export function isCompanyPage(): boolean {
  return detectPageType().type === 'company';
}

/**
 * Check if current page is relevant for deal overlay
 * (profile or company pages only)
 */
export function isRelevantPage(): boolean {
  const pageType = detectPageType().type;
  return pageType === 'profile' || pageType === 'company';
}

/**
 * Wait for page to be fully loaded before detecting
 * Useful for SPA navigation
 */
export function waitForPageLoad(): Promise<PageContext> {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve(detectPageType());
    } else {
      window.addEventListener('load', () => {
        resolve(detectPageType());
      });
    }
  });
}
