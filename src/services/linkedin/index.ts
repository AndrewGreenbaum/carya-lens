/**
 * LinkedIn Services
 *
 * Barrel export for all LinkedIn-related services
 */

// Page detection
export {
  detectPageType,
  isProfilePage,
  isCompanyPage,
  isRelevantPage,
  waitForPageLoad,
  type PageType,
  type PageContext,
} from './detector';

// DOM scraping
export {
  scrapeProfile,
  scrapeCompany,
} from './scraper';

// SPA navigation
export {
  observeNavigation,
  waitForNavigationComplete,
  observePageTypes,
  onceNavigation,
  type NavigationCallback,
} from './navigation';
