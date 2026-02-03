/**
 * Background Service Worker
 *
 * Handles extension lifecycle, API calls, and message passing.
 * All errors are logged with [Carya] prefix - no silent failures.
 */

// Simple log function with prefix
const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const prefix = `[Carya] [${level.toUpperCase()}] ${timestamp}`;
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (data !== undefined) {
    logFn(prefix, '-', message, data);
  } else {
    logFn(prefix, '-', message);
  }
};

log('info', 'Script starting...');

// Message listener - registered immediately at top level
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log('debug', 'Message received', { type: message.type, from: sender.tab ? 'content-script' : 'popup' });

  // Handle PING synchronously
  if (message.type === 'PING') {
    log('info', 'PING received, responding with pong');
    sendResponse({ success: true, message: 'pong' });
    return true;
  }

  // Handle other messages asynchronously with lazy imports
  handleMessageAsync(message)
    .then((response) => {
      log('debug', 'Sending response', { type: message.type, success: (response as { success?: boolean })?.success });
      sendResponse(response);
    })
    .catch((error) => {
      log('error', 'Message handler failed', { type: message.type, error: error instanceof Error ? error.message : String(error) });
      sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    });

  return true; // Keep channel open for async response
});

log('info', 'Message listener registered');

// Async handler with lazy imports to avoid blocking service worker registration
async function handleMessageAsync(message: { type: string; payload?: unknown }): Promise<unknown> {
  log('debug', 'handleMessageAsync called', { type: message.type });

  try {
    switch (message.type) {
      case 'LOOKUP_DEAL': {
        log('info', 'Processing LOOKUP_DEAL');
        const { handleDealLookup } = await import('./messages/deals');
        return await handleDealLookup(message as Parameters<typeof handleDealLookup>[0]);
      }

      case 'ADD_TO_TRACKER': {
        log('info', 'Processing ADD_TO_TRACKER');
        const { handleAddToTracker } = await import('./messages/tracker');
        return await handleAddToTracker(message as Parameters<typeof handleAddToTracker>[0]);
      }

      case 'CHECK_TRACKER_STATUS': {
        log('info', 'Processing CHECK_TRACKER_STATUS');
        const { handleCheckTrackerStatus } = await import('./messages/tracker');
        return await handleCheckTrackerStatus(message as Parameters<typeof handleCheckTrackerStatus>[0]);
      }

      case 'MOVE_TRACKER': {
        log('info', 'Processing MOVE_TRACKER');
        const { handleMoveTracker } = await import('./messages/tracker');
        return await handleMoveTracker(message as Parameters<typeof handleMoveTracker>[0]);
      }

      case 'ENRICH_DEAL': {
        log('info', 'Processing ENRICH_DEAL');
        const { handleEnrichment } = await import('./messages/enrichment');
        return await handleEnrichment(message as Parameters<typeof handleEnrichment>[0]);
      }

      case 'HEALTH_CHECK': {
        log('info', 'Processing HEALTH_CHECK');
        const { apiClient } = await import('@/services/api/client');
        // Load settings first to ensure we have current environment/apiKey
        await apiClient.loadSettings();
        const result = await apiClient.healthCheck();
        log('info', 'HEALTH_CHECK result', result);
        return result;
      }

      case 'RELOAD_SETTINGS': {
        log('info', 'Processing RELOAD_SETTINGS');
        const { apiClient } = await import('@/services/api/client');
        const settings = await apiClient.loadSettings();
        log('info', 'Settings reloaded', { environment: settings.environment, hasApiKey: !!settings.apiKey });
        return { success: true, message: 'Settings reloaded', settings: { environment: settings.environment, hasApiKey: !!settings.apiKey } };
      }

      default:
        log('warn', 'Unknown message type', { type: message.type });
        return { success: false, error: `Unknown message type: ${message.type}` };
    }
  } catch (error) {
    log('error', 'handleMessageAsync error', { type: message.type, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Extension lifecycle handlers
chrome.runtime.onInstalled.addListener(async (details) => {
  log('info', 'Extension installed/updated', { reason: details.reason, version: chrome.runtime.getManifest().version });

  // Auto-load settings on install
  try {
    const { apiClient } = await import('@/services/api/client');
    const settings = await apiClient.loadSettings();
    log('info', 'Settings loaded on install', {
      environment: settings.environment,
      hasApiKey: !!settings.apiKey,
    });
  } catch (error) {
    log('error', 'Failed to load settings on install', { error });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  log('info', 'Extension started (browser startup)');

  // Auto-load settings on browser startup
  try {
    const { apiClient } = await import('@/services/api/client');
    const settings = await apiClient.loadSettings();
    log('info', 'Settings loaded on startup', {
      environment: settings.environment,
      hasApiKey: !!settings.apiKey,
    });
  } catch (error) {
    log('error', 'Failed to load settings on startup', { error });
  }
});

// Also load settings immediately when background script loads
(async () => {
  try {
    const { apiClient } = await import('@/services/api/client');
    const settings = await apiClient.loadSettings();
    log('info', 'Settings loaded on script load', {
      environment: settings.environment,
      hasApiKey: !!settings.apiKey,
    });
  } catch (error) {
    log('error', 'Failed to load settings on script load', { error });
  }
})();

log('info', 'Background script fully loaded');
