/**
 * Extension Popup
 *
 * Settings UI for Carya Lens Chrome Extension.
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

    // Check for API key
    if (!apiKey) {
      log('warn', 'Test connection failed - no API key');
      setConnectionStatus({
        status: 'error',
        message: 'API key required for non-mock environments',
      });
      return;
    }

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

  return (
    <div
      style={{
        width: '320px',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <h1 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
        Carya Lens
      </h1>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
        Deal intelligence overlay for LinkedIn
      </div>

      {/* Extension Status */}
      <div
        style={{
          padding: '10px 12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px',
          fontSize: '13px',
          marginBottom: '20px',
        }}
      >
        <strong>Extension:</strong> {extensionStatus}
      </div>

      {/* Settings Section */}
      <div style={{ marginBottom: '20px' }}>
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
            API Key {environment === 'mock' && <span style={{ color: '#9ca3af' }}>(optional in mock mode)</span>}
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
          marginBottom: '16px',
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

      {/* Footer */}
      <div
        style={{
          fontSize: '11px',
          color: '#9ca3af',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '12px',
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
