/**
 * LinkedIn Overlay Content Script
 *
 * Injected into LinkedIn pages to display deal information.
 * Uses Shadow DOM for style isolation.
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { DealData } from '../types/deals';
import type { PageType, PageContext } from '../services/linkedin';
import type { APIErrorType } from '../services/api/client';
import { detectPageType, scrapeCompany, scrapeProfile } from '../services/linkedin';
import { LoadingState } from '../components/overlay/LoadingState';
import { NotInDatabase } from '../components/overlay/NotInDatabase';
import { DealCard } from '../components/overlay/DealCard';

// Logging helper
const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) => {
  const prefix = `[Carya] [Content] [${level.toUpperCase()}]`;
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (data !== undefined) {
    logFn(prefix, message, data);
  } else {
    logFn(prefix, message);
  }
};

// Container ID
const CONTAINER_ID = 'carya-lens-root';

// Error state with type for better display
interface ErrorState {
  message: string;
  type?: APIErrorType;
}

// Main overlay component
function LinkedInOverlay() {
  const [pageType, setPageType] = useState<PageType>('unknown');
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<DealData | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [founderName, setFounderName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null); // What we searched for
  const [isTracked, setIsTracked] = useState(false);
  const [isAddingToTracker, setIsAddingToTracker] = useState(false);
  const [trackerMessage, setTrackerMessage] = useState<string | null>(null);

  // Detect page type and scrape data
  useEffect(() => {
    log('info', 'Overlay mounted, detecting page type');

    const detectAndScrape = () => {
      try {
        const context: PageContext = detectPageType();
        log('info', 'Page type detected', { pageType: context.type, url: context.url });
        setPageType(context.type);

        if (context.type === 'company') {
          const companyData = scrapeCompany();
          if (!companyData) {
            log('warn', 'Failed to scrape company page');
            setLoading(false);
            return;
          }
          log('info', 'Company data scraped', companyData);
          setCompanyName(companyData.companyName);
          if (companyData.companyName) {
            lookupDeal(companyData.companyName);
          } else {
            log('warn', 'No company name found on page');
            setLoading(false);
          }
        } else if (context.type === 'profile') {
          const profileData = scrapeProfile();
          if (!profileData) {
            log('warn', 'Failed to scrape profile page');
            setLoading(false);
            return;
          }
          log('info', 'Profile data scraped', profileData);
          setFounderName(profileData.founderName);
          setCompanyName(profileData.currentCompany);

          // For profile pages, search by founder name to find their deals
          if (profileData.founderName) {
            log('info', 'Searching deals by founder name', { founderName: profileData.founderName });
            setSearchQuery(profileData.founderName);
            lookupDealByFounder(profileData.founderName);
          } else {
            log('warn', 'No founder name found on profile');
            setLoading(false);
          }
        } else {
          log('info', 'Not a supported page type', { pageType: context.type });
          setLoading(false);
        }
      } catch (err) {
        log('error', 'Error detecting/scraping page', { error: err instanceof Error ? err.message : String(err) });
        setError({ message: 'Failed to read page data' });
        setLoading(false);
      }
    };

    // Small delay to let LinkedIn finish rendering
    const timeout = setTimeout(detectAndScrape, 500);
    return () => clearTimeout(timeout);
  }, []);

  // Look up deal data by company name via background worker
  const lookupDeal = async (query: string) => {
    log('info', 'Looking up deal by company', { query });
    setLoading(true);
    setError(null);
    setSearchQuery(query);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LOOKUP_DEAL',
        payload: { companyName: query },
      });

      log('info', 'Deal lookup response', response);

      if (chrome.runtime.lastError) {
        log('error', 'Runtime error on deal lookup', { error: chrome.runtime.lastError.message });
        setError({ message: chrome.runtime.lastError.message || 'Connection error', type: 'NETWORK_ERROR' });
        setLoading(false);
        return;
      }

      if (response?.success && response.data) {
        log('info', 'Deal found', { companyName: response.data.companyName });
        setDeal(response.data);
      } else if (response?.success && !response.data) {
        log('info', 'No deal found for query', { query });
        setDeal(null);
      } else {
        log('warn', 'Deal lookup failed', { error: response?.error, errorType: response?.errorType });
        setError({
          message: response?.error || 'Lookup failed',
          type: response?.errorType,
        });
      }
    } catch (err) {
      log('error', 'Exception during deal lookup', { error: err instanceof Error ? err.message : String(err) });
      setError({ message: 'Failed to look up deal', type: 'NETWORK_ERROR' });
    } finally {
      setLoading(false);
    }
  };

  // Look up deal data by founder name via background worker
  const lookupDealByFounder = async (name: string) => {
    log('info', 'Looking up deal by founder name', { founderName: name });
    setLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LOOKUP_DEAL',
        payload: { founderName: name },
      });

      log('info', 'Founder deal lookup response', response);

      if (chrome.runtime.lastError) {
        log('error', 'Runtime error on founder deal lookup', { error: chrome.runtime.lastError.message });
        setError({ message: chrome.runtime.lastError.message || 'Connection error', type: 'NETWORK_ERROR' });
        setLoading(false);
        return;
      }

      if (response?.success && response.data) {
        log('info', 'Deal found for founder', { founderName: name, companyName: response.data.companyName });
        setDeal(response.data);
      } else if (response?.success && !response.data) {
        log('info', 'No deal found for founder', { founderName: name });
        setDeal(null);
      } else {
        log('warn', 'Founder deal lookup failed', { error: response?.error, errorType: response?.errorType });
        setError({
          message: response?.error || 'Lookup failed',
          type: response?.errorType,
        });
      }
    } catch (err) {
      log('error', 'Exception during founder deal lookup', { error: err instanceof Error ? err.message : String(err) });
      setError({ message: 'Failed to look up deal', type: 'NETWORK_ERROR' });
    } finally {
      setLoading(false);
    }
  };

  // Handle add to tracker
  const handleAddToTracker = async () => {
    if (!deal) {
      log('warn', 'Add to Tracker clicked but no deal data');
      return;
    }

    log('info', 'Add to Tracker clicked', {
      companyName: deal.companyName,
      linkedInUrl: window.location.href,
      dealId: deal.id,
    });

    setIsAddingToTracker(true);
    setTrackerMessage(null);

    try {
      // First, try to save locally to chrome.storage (works without API)
      const trackedCompanies = await getTrackedCompanies();
      const alreadyTracked = trackedCompanies.some(
        (c: { companyName: string }) => c.companyName.toLowerCase() === deal.companyName.toLowerCase()
      );

      if (alreadyTracked) {
        log('info', 'Company already tracked locally', { companyName: deal.companyName });
        setIsTracked(true);
        setTrackerMessage('Already in tracker');
        setIsAddingToTracker(false);
        return;
      }

      // Save to local storage
      const newEntry = {
        companyName: deal.companyName,
        linkedInUrl: window.location.href,
        fundingAmount: deal.fundingAmount,
        roundStage: deal.roundStage,
        addedAt: new Date().toISOString(),
      };

      trackedCompanies.push(newEntry);
      await chrome.storage.local.set({ trackedCompanies });

      log('info', 'Saved to local tracker', { companyName: deal.companyName, totalTracked: trackedCompanies.length });

      // Send to background worker to call real API (saves to Railway backend)
      log('info', 'Calling ADD_TO_TRACKER API', {
        companyName: deal.companyName,
        dealId: deal.id,
      });

      const response = await chrome.runtime.sendMessage({
        type: 'ADD_TO_TRACKER',
        payload: {
          companyName: deal.companyName,
          dealId: deal.id, // Pass deal_id for /tracker/from-deal endpoint
          linkedInUrl: window.location.href,
          website: deal.source,
        },
      });

      if (chrome.runtime.lastError) {
        log('error', 'Runtime error calling tracker API', { error: chrome.runtime.lastError.message });
        setTrackerMessage('Saved locally (API unavailable)');
      } else {
        log('info', 'Add to Tracker API response', {
          success: response?.success,
          error: response?.error,
          data: response?.data,
        });

        if (response?.success) {
          setTrackerMessage('Added to Railway tracker!');
        } else {
          // API call failed - show helpful error message
          const errorMsg = response?.error || 'API error';
          log('warn', 'Tracker API returned error', { error: errorMsg });

          // Check for auth-related errors
          if (errorMsg.includes('401') || errorMsg.includes('Invalid API') || errorMsg.includes('API key')) {
            setTrackerMessage('API key required - set in extension popup');
          } else if (errorMsg.includes('Network') || errorMsg.includes('fetch')) {
            setTrackerMessage('Saved locally (network error)');
          } else {
            setTrackerMessage(`Saved locally (${errorMsg})`);
          }
        }
      }

      // Update UI - local save succeeded
      setIsTracked(true);

    } catch (err) {
      log('error', 'Exception adding to tracker', {
        errorMessage: err instanceof Error ? err.message : String(err),
        errorName: err instanceof Error ? err.name : 'Unknown',
      });
      setTrackerMessage('Failed to add');
    } finally {
      setIsAddingToTracker(false);
      // Clear message after 3 seconds
      setTimeout(() => setTrackerMessage(null), 3000);
    }
  };

  // Handle untrack
  const handleUntrack = async () => {
    if (!deal) {
      log('warn', 'Untrack clicked but no deal data');
      return;
    }

    log('info', 'Untrack clicked', {
      companyName: deal.companyName,
    });

    setIsAddingToTracker(true); // Reuse loading state
    setTrackerMessage(null);

    try {
      // Remove from local storage
      const trackedCompanies = await getTrackedCompanies();
      const updatedCompanies = trackedCompanies.filter(
        (c: { companyName: string }) => c.companyName.toLowerCase() !== deal.companyName.toLowerCase()
      );

      await chrome.storage.local.set({ trackedCompanies: updatedCompanies });

      log('info', 'Removed from local tracker', {
        companyName: deal.companyName,
        remainingTracked: updatedCompanies.length,
      });

      // Update UI
      setIsTracked(false);
      setTrackerMessage('Removed from tracker');

    } catch (err) {
      log('error', 'Exception removing from tracker', {
        errorMessage: err instanceof Error ? err.message : String(err),
        errorName: err instanceof Error ? err.name : 'Unknown',
      });
      setTrackerMessage('Failed to remove');
    } finally {
      setIsAddingToTracker(false);
      // Clear message after 3 seconds
      setTimeout(() => setTrackerMessage(null), 3000);
    }
  };

  // Helper to get tracked companies from local storage
  const getTrackedCompanies = async (): Promise<Array<{ companyName: string }>> => {
    try {
      const result = await chrome.storage.local.get('trackedCompanies');
      return result.trackedCompanies || [];
    } catch {
      return [];
    }
  };

  // Check if company is already tracked on mount
  useEffect(() => {
    if (deal?.companyName) {
      getTrackedCompanies().then((companies) => {
        const tracked = companies.some(
          (c) => c.companyName.toLowerCase() === deal.companyName.toLowerCase()
        );
        if (tracked) {
          log('info', 'Company already tracked', { companyName: deal.companyName });
          setIsTracked(true);
        }
      });
    }
  }, [deal?.companyName]);

  // Handle refresh
  const handleRefresh = () => {
    if (pageType === 'profile' && founderName) {
      lookupDealByFounder(founderName);
    } else if (companyName) {
      lookupDeal(companyName);
    }
  };

  // Handle suggest addition
  const handleSuggest = async () => {
    log('info', 'Suggesting addition', { companyName });
    // TODO: Implement feedback API call
  };

  // Don't render on unsupported pages
  if (pageType !== 'company' && pageType !== 'profile') {
    log('debug', 'Not rendering overlay - unsupported page type', { pageType });
    return null;
  }

  // Get error display info based on error type
  const getErrorDisplay = (err: ErrorState) => {
    switch (err.type) {
      case 'NO_API_KEY':
        return {
          title: 'API Key Required',
          message: 'Please set your API key in the extension popup.',
          style: configErrorStyle,
        };
      case 'INVALID_API_KEY':
        return {
          title: 'Invalid API Key',
          message: 'Your API key was rejected. Check settings in the extension popup.',
          style: configErrorStyle,
        };
      case 'NETWORK_ERROR':
        return {
          title: 'Connection Error',
          message: `Cannot reach the API. ${err.message}`,
          style: networkErrorStyle,
        };
      case 'SERVER_ERROR':
        return {
          title: 'Server Error',
          message: 'The API server is experiencing issues. Try again later.',
          style: errorStyle,
        };
      default:
        return {
          title: 'Error',
          message: err.message,
          style: errorStyle,
        };
    }
  };

  // Render overlay
  return (
    <div style={overlayContainerStyle}>
      {loading && <LoadingState />}
      {!loading && error && (() => {
        const display = getErrorDisplay(error);
        return (
          <div style={display.style}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{display.title}</div>
            <div>{display.message}</div>
            {(error.type === 'NETWORK_ERROR' || error.type === 'SERVER_ERROR') && (
              <button
                onClick={handleRefresh}
                style={retryButtonStyle}
              >
                Retry
              </button>
            )}
          </div>
        );
      })()}
      {!loading && !error && deal && (
        <>
          <DealCard
            deal={deal}
            isTracked={isTracked}
            onAddToTracker={handleAddToTracker}
            onUntrack={handleUntrack}
            onRefresh={handleRefresh}
          />
          {trackerMessage && (
            <div style={trackerMessageStyle}>
              {trackerMessage}
            </div>
          )}
          {isAddingToTracker && (
            <div style={trackerMessageStyle}>
              Adding to tracker...
            </div>
          )}
        </>
      )}
      {!loading && !error && !deal && (
        <NotInDatabase
          companyName={companyName}
          founderName={founderName}
          searchQuery={searchQuery}
          onSuggest={handleSuggest}
        />
      )}
    </div>
  );
}

// Styles
const overlayContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: '80px',
  right: '20px',
  width: '320px',
  zIndex: 9999,
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

// Dark theme colors matching Carya Eagle Eye
const DARK_THEME = {
  cardBackground: '#161b22',
  border: '#30363d',
  textPrimary: '#f0f6fc',
  textSecondary: '#8b949e',
  accent: '#00d4aa',
  error: '#f85149',
  warning: '#d29922',
  success: '#3fb950',
};

const errorStyle: React.CSSProperties = {
  backgroundColor: 'rgba(248, 81, 73, 0.15)',
  color: DARK_THEME.error,
  padding: '12px',
  borderRadius: '8px',
  fontSize: '13px',
  border: `1px solid ${DARK_THEME.error}40`,
};

const configErrorStyle: React.CSSProperties = {
  backgroundColor: 'rgba(210, 153, 34, 0.15)',
  color: DARK_THEME.warning,
  padding: '12px',
  borderRadius: '8px',
  fontSize: '13px',
  border: `1px solid ${DARK_THEME.warning}`,
};

const networkErrorStyle: React.CSSProperties = {
  backgroundColor: DARK_THEME.cardBackground,
  color: DARK_THEME.textSecondary,
  padding: '12px',
  borderRadius: '8px',
  fontSize: '13px',
  border: `1px solid ${DARK_THEME.border}`,
};

const retryButtonStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 500,
  color: '#000',
  backgroundColor: DARK_THEME.accent,
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const trackerMessageStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '8px 12px',
  backgroundColor: 'rgba(63, 185, 80, 0.15)',
  color: DARK_THEME.success,
  borderRadius: '6px',
  fontSize: '13px',
  textAlign: 'center',
  fontWeight: 500,
  border: `1px solid ${DARK_THEME.success}40`,
};

// Initialize overlay
function initOverlay() {
  log('info', 'Initializing overlay');

  // Check if already mounted
  if (document.getElementById(CONTAINER_ID)) {
    log('debug', 'Overlay already mounted, skipping');
    return;
  }

  // Create container
  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  document.body.appendChild(container);

  // Create shadow root for style isolation
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Create React mount point inside shadow root
  const mountPoint = document.createElement('div');
  shadowRoot.appendChild(mountPoint);

  // Mount React app
  try {
    const root = createRoot(mountPoint);
    root.render(<LinkedInOverlay />);
    log('info', 'Overlay mounted successfully');
  } catch (err) {
    log('error', 'Failed to mount overlay', { error: err instanceof Error ? err.message : String(err) });
  }
}

// Listen for URL changes (LinkedIn is an SPA)
function setupNavigationListener() {
  log('info', 'Setting up navigation listener');

  let lastUrl = window.location.href;

  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      log('info', 'URL changed', { from: lastUrl, to: window.location.href });
      lastUrl = window.location.href;

      // Remove old overlay and re-initialize
      const existing = document.getElementById(CONTAINER_ID);
      if (existing) {
        existing.remove();
      }

      // Re-initialize after a short delay
      setTimeout(initOverlay, 500);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  log('info', 'Navigation listener active');
}

// Main entry point
log('info', 'Content script loaded');
initOverlay();
setupNavigationListener();
