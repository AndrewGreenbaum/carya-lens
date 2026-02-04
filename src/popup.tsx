/**
 * Extension Popup
 *
 * Settings UI for Carya Lens Chrome Extension.
 * Features: Settings, Connection Test, Deal Search
 * Every user action is logged with [Carya] [Popup] prefix.
 * No silent failures - all errors are logged and surfaced.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { STORAGE_KEYS, type Environment } from './constants/config';

// Logging helper - all logs use [Carya] prefix
const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const prefix = `[Carya] [Popup] [${level.toUpperCase()}] ${timestamp}`;
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (data !== undefined) {
    logFn(prefix, '-', message, data);
  } else {
    logFn(prefix, '-', message);
  }
};

interface ConnectionStatus {
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  latency?: number;
}

// Deal search result type
interface SearchResult {
  id: string;
  companyName: string;
  fundingAmount: number;
  roundStage: string;
  leadInvestor?: string;
}

// Format currency for display
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

function IndexPopup() {
  // State - default to 'production' so extension works immediately
  const [apiKey, setApiKey] = React.useState<string>('');
  const [environment, setEnvironment] = React.useState<Environment>('production');
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [extensionStatus, setExtensionStatus] = React.useState<string>('Checking...');
  const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>({
    status: 'idle',
    message: 'Not tested',
  });

  // Search state
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'search' | 'settings'>('search');

  // Load saved settings on mount
  React.useEffect(() => {
    log('info', 'Popup mounted, loading settings...');

    // Check extension is running
    checkExtensionRunning();

    // Load saved settings from chrome.storage.sync
    loadSettings();
  }, []);

  const checkExtensionRunning = () => {
    log('debug', 'Sending PING to background worker...');

    if (!chrome.runtime?.sendMessage) {
      log('error', 'chrome.runtime.sendMessage not available');
      setExtensionStatus('❌ Runtime not available');
      return;
    }

    try {
      chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          log('error', 'Runtime error on PING', { error: lastError.message });
          setExtensionStatus(`❌ ${lastError.message}`);
          return;
        }

        log('info', 'PING response received', { response });
        if (response?.success) {
          setExtensionStatus('✅ Extension is running');
        } else {
          setExtensionStatus('❌ Background worker not responding');
        }
      });
    } catch (err) {
      log('error', 'Exception sending PING', { error: err instanceof Error ? err.message : String(err) });
      setExtensionStatus('❌ Exception sending message');
    }
  };

  const loadSettings = async () => {
    log('info', 'Loading settings from chrome.storage.sync...');

    try {
      const result = await chrome.storage.sync.get([STORAGE_KEYS.API_KEY, STORAGE_KEYS.ENVIRONMENT]);

      const savedApiKey = result[STORAGE_KEYS.API_KEY] || '';
      // Default to 'production' if no environment saved
      const savedEnvironment = (result[STORAGE_KEYS.ENVIRONMENT] as Environment) || 'production';

      setApiKey(savedApiKey);
      setEnvironment(savedEnvironment);

      log('info', 'Settings loaded from storage', {
        hasApiKey: !!savedApiKey,
        apiKeyLength: savedApiKey?.length || 0,
        environment: savedEnvironment,
      });

      // If production is selected and no settings were saved, auto-save production as default
      if (!result[STORAGE_KEYS.ENVIRONMENT]) {
        log('info', 'No environment saved, saving production as default');
        await chrome.storage.sync.set({ [STORAGE_KEYS.ENVIRONMENT]: 'production' });
      }
    } catch (error) {
      log('error', 'Failed to load settings', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    log('debug', 'API key input changed', { length: newValue.length });
    setApiKey(newValue);
    setSaveMessage(null); // Clear save message on change
  };

  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as Environment;
    log('info', 'Environment changed', { from: environment, to: newValue });
    setEnvironment(newValue);
    setSaveMessage(null); // Clear save message on change
  };

  const handleSave = async () => {
    log('info', 'Save button clicked', { apiKeyLength: apiKey.length, environment });
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await chrome.storage.sync.set({
        [STORAGE_KEYS.API_KEY]: apiKey,
        [STORAGE_KEYS.ENVIRONMENT]: environment,
      });

      log('info', 'Settings saved successfully', { environment });
      setSaveMessage('✅ Settings saved!');

      // Notify background worker to reload settings
      chrome.runtime.sendMessage({ type: 'RELOAD_SETTINGS' }, (response) => {
        if (chrome.runtime.lastError) {
          log('warn', 'Failed to notify background worker of settings change', {
            error: chrome.runtime.lastError.message,
          });
        } else {
          log('debug', 'Background worker notified of settings change', { response });
        }
      });
    } catch (error) {
      log('error', 'Failed to save settings', {
        error: error instanceof Error ? error.message : String(error),
      });
      setSaveMessage('❌ Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    log('info', 'Test Connection button clicked', { environment });

    setConnectionStatus({ status: 'testing', message: 'Testing...' });

    // If mock mode, just return success
    if (environment === 'mock') {
      log('info', 'Mock mode - connection test skipped');
      setConnectionStatus({
        status: 'success',
        message: 'Mock mode - no API connection needed',
      });
      return;
    }

    // Note: Deal lookup doesn't require API key, but tracker does
    // We'll test connection without API key requirement

    // Send health check request to background worker
    const startTime = Date.now();

    try {
      chrome.runtime.sendMessage(
        { type: 'HEALTH_CHECK' },
        (response) => {
          const latency = Date.now() - startTime;
          const lastError = chrome.runtime.lastError;

          if (lastError) {
            log('error', 'Health check runtime error', { error: lastError.message });
            setConnectionStatus({
              status: 'error',
              message: lastError.message || 'Unknown runtime error',
            });
            return;
          }

          log('info', 'Health check response', { response, latency });

          if (response?.success) {
            setConnectionStatus({
              status: 'success',
              message: response.message || 'Connected',
              latency: response.latency || latency,
            });
          } else {
            setConnectionStatus({
              status: 'error',
              message: response?.error || 'Connection failed',
            });
          }
        }
      );
    } catch (error) {
      log('error', 'Health check exception', {
        error: error instanceof Error ? error.message : String(error),
      });
      setConnectionStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus.status) {
      case 'success':
        return '#22c55e'; // green
      case 'error':
        return '#ef4444'; // red
      case 'testing':
        return '#f59e0b'; // amber
      default:
        return '#6b7280'; // gray
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      log('warn', 'Search attempted with empty query');
      return;
    }

    log('info', 'Search initiated', { query: searchQuery });
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LOOKUP_DEAL',
        payload: { query: searchQuery.trim() },
      });

      if (chrome.runtime.lastError) {
        log('error', 'Search runtime error', { error: chrome.runtime.lastError.message });
        setSearchError(chrome.runtime.lastError.message || 'Search failed');
        return;
      }

      log('info', 'Search response received', response);

      if (response?.success && response.data) {
        // Single result from lookup
        const result: SearchResult = {
          id: response.data.id,
          companyName: response.data.companyName,
          fundingAmount: response.data.fundingAmount,
          roundStage: response.data.roundStage,
          leadInvestor: response.data.leadInvestor?.name,
        };
        setSearchResults([result]);
        log('info', 'Search found result', { companyName: result.companyName });
      } else if (response?.success && !response.data) {
        log('info', 'Search returned no results', { query: searchQuery });
        setSearchResults([]);
      } else {
        log('warn', 'Search failed', { error: response?.error });
        setSearchError(response?.error || 'Search failed');
      }
    } catch (err) {
      log('error', 'Search exception', { error: err instanceof Error ? err.message : String(err) });
      setSearchError('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle opening LinkedIn company page
  const handleOpenLinkedIn = (companyName: string) => {
    log('info', 'Opening LinkedIn for company', { companyName });
    const linkedInUrl = `https://www.linkedin.com/company/${encodeURIComponent(companyName.toLowerCase().replace(/\s+/g, '-'))}`;
    chrome.tabs.create({ url: linkedInUrl });
  };

  // Handle search input keypress
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div
      style={{
        width: '340px',
        padding: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header with logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="11" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1"/>
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="system-ui">C</text>
        </svg>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Carya Lens</h1>
          <div style={{ fontSize: '11px', color: '#666' }}>Deal intelligence for LinkedIn</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            backgroundColor: activeTab === 'search' ? '#2563eb' : 'transparent',
            color: activeTab === 'search' ? 'white' : '#6b7280',
            transition: 'all 0.2s',
          }}
        >
          🔍 Search
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            backgroundColor: activeTab === 'settings' ? '#2563eb' : 'transparent',
            color: activeTab === 'settings' ? 'white' : '#6b7280',
            transition: 'all 0.2s',
          }}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div>
          {/* Search Input */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="Search company or founder..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'white',
                  backgroundColor: isSearching ? '#9ca3af' : '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                }}
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchError && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '12px',
            }}>
              {searchError}
            </div>
          )}

          {searchResults.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                Results
              </div>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleOpenLinkedIn(result.companyName)}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                        {result.companyName}
                      </div>
                      {result.leadInvestor && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          Lead: {result.leadInvestor}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#059669' }}>
                        {formatCurrency(result.fundingAmount)}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginTop: '2px',
                      }}>
                        {result.roundStage}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '8px' }}>
                    Click to open LinkedIn →
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && !searchError && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '13px',
            }}>
              No results found for "{searchQuery}"
            </div>
          )}

          {!searchQuery && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px',
            }}>
              Enter a company or founder name to search
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div>
          {/* Extension Status */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            <strong>Extension:</strong> {extensionStatus}
          </div>

          {/* Settings Section */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>
              API Settings
            </h2>

        {/* Environment Dropdown */}
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151',
            }}
          >
            Environment
          </label>
          <select
            value={environment}
            onChange={handleEnvironmentChange}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '13px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="mock">Mock (Testing)</option>
            <option value="local">Local (localhost:8000)</option>
            <option value="production">Production (Railway)</option>
          </select>
        </div>

        {/* API Key Input */}
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151',
            }}
          >
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="Enter your API key"
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '13px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{
            fontSize: '11px',
            color: '#6b7280',
            marginTop: '4px',
          }}>
            {environment === 'mock' ? (
              'Optional in mock mode'
            ) : (
              <>Required for <strong>Add to Tracker</strong> feature. Deal lookup works without key.</>
            )}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#fff',
            backgroundColor: isSaving ? '#9ca3af' : '#2563eb',
            border: 'none',
            borderRadius: '6px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            marginBottom: '8px',
          }}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>

        {/* Save Message */}
        {saveMessage && (
          <div
            style={{
              fontSize: '12px',
              textAlign: 'center',
              marginBottom: '8px',
            }}
          >
            {saveMessage}
          </div>
        )}

        {/* Test Connection Button */}
        <button
          onClick={handleTestConnection}
          disabled={connectionStatus.status === 'testing'}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#2563eb',
            backgroundColor: '#fff',
            border: '1px solid #2563eb',
            borderRadius: '6px',
            cursor: connectionStatus.status === 'testing' ? 'not-allowed' : 'pointer',
          }}
        >
          {connectionStatus.status === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>
          </div>

          {/* Connection Status */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              borderLeft: `3px solid ${getConnectionStatusColor()}`,
              marginBottom: '12px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
              Connection Status
            </div>
            <div style={{ fontSize: '13px', fontWeight: '500' }}>
              {connectionStatus.message}
              {connectionStatus.latency && (
                <span style={{ color: '#9ca3af', fontWeight: 'normal' }}>
                  {' '}({connectionStatus.latency}ms)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          fontSize: '11px',
          color: '#9ca3af',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '12px',
          marginTop: '12px',
        }}
      >
        v{chrome.runtime.getManifest().version} • {environment} mode
      </div>
    </div>
  );
}

// Mount the component
log('info', 'Popup script loaded');

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<IndexPopup />);
  log('info', 'Popup component mounted');
} else {
  log('error', 'Root element not found - cannot mount popup');
}
