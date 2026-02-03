// App-wide configuration constants

export const APP_NAME = 'Carya Lens';
export const APP_VERSION = '1.0.0';

// Environment types
export type Environment = 'mock' | 'local' | 'production';

// API URLs per environment
export const API_URLS: Record<Environment, string> = {
  mock: 'mock://local', // Special URL that triggers mock data
  local: 'http://localhost:8000',
  production: 'https://bud-tracker-backend-production.up.railway.app',
} as const;

// Default environment - Production by default so extension works immediately
export const DEFAULT_ENVIRONMENT: Environment = 'production';

// API Configuration
export const API_BASE_URL = API_URLS[DEFAULT_ENVIRONMENT];
export const API_VERSION = 'v1';
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRIES = 3;

// Storage keys
export const STORAGE_KEYS = {
  API_KEY: 'carya_api_key',
  ENVIRONMENT: 'carya_environment',
  SETTINGS: 'carya_settings',
} as const;

// Cache Configuration
export const CACHE_TTL_HOURS = 1;
export const CACHE_TTL_MS = CACHE_TTL_HOURS * 60 * 60 * 1000;

// Cache Keys
export const CACHE_KEYS = {
  DEAL: (identifier: string) => `deal:${identifier}`,
  SIGNALS: (companyName: string) => `signals:${companyName}`,
  TRACKER: (identifier: string) => `tracker:${identifier}`,
  API_KEY: 'apiKey',
  SETTINGS: 'settings',
} as const;

// UI Configuration
export const OVERLAY_Z_INDEX = 9999;
export const OVERLAY_POSITION = {
  top: '80px',
  right: '20px',
} as const;

export const OVERLAY_WIDTH = '400px';
export const OVERLAY_MAX_HEIGHT = '600px';

// Debounce Configuration
export const NAVIGATION_DEBOUNCE_MS = 500;
export const SEARCH_DEBOUNCE_MS = 300;

// Error Messages
export const ERROR_MESSAGES = {
  NO_API_KEY: 'Set API key in extension popup',
  INVALID_API_KEY: 'Invalid API key - check settings',
  NETWORK_ERROR: 'Cannot connect to Carya API',
  API_ERROR: 'API error - try again later',
  SERVER_ERROR: 'Server error - try again later',
  NOT_FOUND: 'Resource not found',
  INVALID_PAGE: 'This page type is not supported.',
  SCRAPING_ERROR: 'Failed to extract data from LinkedIn page.',
  CACHE_ERROR: 'Cache error. Data may be stale.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ADDED_TO_TRACKER: 'Company added to tracker successfully!',
  STATUS_UPDATED: 'Status updated successfully!',
  ENRICHMENT_SUBMITTED: 'Enrichment request submitted!',
  ISSUE_FLAGGED: 'Issue reported. Thank you for the feedback!',
  CACHE_CLEARED: 'Cache cleared successfully!',
  CONNECTION_OK: 'Connected to Carya API',
} as const;

// Feature Flags
export const FEATURES = {
  STEALTH_SIGNALS: true,
  RELATIONSHIP_MAP: true,
  QUICK_ACTIONS: true,
  ENRICHMENT: true,
  EXPORT: true,
} as const;

// Development
export const IS_DEV = false;
export const LOG_LEVEL = 'debug' as 'debug' | 'info' | 'warn' | 'error'; // Set to debug for verbose logging

// Log environment on module load
console.log(`[Carya] Config loaded - Default environment: ${DEFAULT_ENVIRONMENT}, API URL: ${API_BASE_URL}`);
