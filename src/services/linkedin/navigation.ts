/**
 * LinkedIn SPA Navigation Handler
 *
 * LinkedIn is a Single Page Application (SPA) that doesn't reload the page
 * when navigating between profiles/companies. We use MutationObserver and
 * popstate events to detect navigation changes.
 */

import { logger } from '@/utils/logger';
import { detectPageType, type PageContext } from './detector';

export type NavigationCallback = (context: PageContext) => void;

/**
 * Start observing LinkedIn SPA navigation changes
 *
 * @param callback - Function to call when navigation occurs
 * @returns Cleanup function to stop observing
 */
export function observeNavigation(callback: NavigationCallback): () => void {
  let lastUrl = window.location.href;
  let lastPathname = window.location.pathname;

  logger.debug('Starting navigation observer', { url: lastUrl });

  // Simple debounce implementation for navigation callbacks
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedCallback = (context: PageContext) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
      logger.info('Navigation detected', {
        type: context.type,
        url: context.url,
        previousUrl: lastUrl,
      });
      callback(context);
      lastUrl = context.url;
      lastPathname = window.location.pathname;
    }, 300);
  };

  // Check for URL changes
  const checkUrlChange = () => {
    const currentUrl = window.location.href;
    const currentPathname = window.location.pathname;

    if (currentPathname !== lastPathname) {
      const context = detectPageType();
      debouncedCallback(context);
    }
  };

  // MutationObserver to detect DOM changes (SPA navigation)
  const observer = new MutationObserver(() => {
    checkUrlChange();
  });

  // Observe the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also listen to popstate (browser back/forward)
  const handlePopState = () => {
    logger.debug('Popstate event detected');
    checkUrlChange();
  };

  window.addEventListener('popstate', handlePopState);

  // Also listen to pushState/replaceState (LinkedIn SPA navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    logger.debug('pushState detected');
    checkUrlChange();
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    logger.debug('replaceState detected');
    checkUrlChange();
  };

  // Cleanup function
  return () => {
    logger.debug('Stopping navigation observer');
    observer.disconnect();
    window.removeEventListener('popstate', handlePopState);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
}

/**
 * Wait for navigation to complete and page to stabilize
 * Useful after detecting a navigation event
 *
 * @param timeout - Maximum wait time in milliseconds
 * @returns Promise that resolves when page is stable
 */
export function waitForNavigationComplete(timeout = 3000): Promise<void> {
  return new Promise((resolve) => {
    let lastMutationTime = Date.now();
    let mutationCount = 0;

    const observer = new MutationObserver(() => {
      lastMutationTime = Date.now();
      mutationCount++;
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Check if mutations have stopped
    const checkStability = setInterval(() => {
      const timeSinceLastMutation = Date.now() - lastMutationTime;

      // If no mutations for 500ms, consider page stable
      if (timeSinceLastMutation > 500) {
        clearInterval(checkStability);
        observer.disconnect();
        logger.debug('Navigation complete', { mutationCount });
        resolve();
      }
    }, 100);

    // Timeout fallback
    setTimeout(() => {
      clearInterval(checkStability);
      observer.disconnect();
      logger.warn('Navigation timeout', { mutationCount });
      resolve();
    }, timeout);
  });
}

/**
 * Observe navigation to specific page types only
 *
 * @param pageTypes - Array of page types to watch for
 * @param callback - Function to call when matching page is detected
 * @returns Cleanup function
 */
export function observePageTypes(
  pageTypes: Array<PageContext['type']>,
  callback: NavigationCallback
): () => void {
  return observeNavigation((context) => {
    if (pageTypes.includes(context.type)) {
      callback(context);
    }
  });
}

/**
 * One-time navigation listener
 * Automatically unsubscribes after first navigation
 *
 * @param callback - Function to call once on navigation
 * @returns Cleanup function (in case you want to cancel before it fires)
 */
export function onceNavigation(callback: NavigationCallback): () => void {
  let cleanup: (() => void) | null = null;

  cleanup = observeNavigation((context) => {
    callback(context);
    if (cleanup) {
      cleanup();
    }
  });

  return cleanup;
}
