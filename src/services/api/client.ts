/**
 * API Client with verbose logging
 *
 * Every operation logs with [Carya] prefix.
 * No silent failures - all errors are logged and surfaced.
 */

import type { APIResponse, APIError, RequestOptions } from '../../types/api';
import {
  API_TIMEOUT,
  API_RETRIES,
  API_URLS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  type Environment
} from '../../constants/config';

// Logging helper - all logs use [Carya] prefix
const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const prefix = `[Carya] [API] [${level.toUpperCase()}] ${timestamp}`;
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (data !== undefined) {
    logFn(prefix, '-', message, data);
  } else {
    logFn(prefix, '-', message);
  }
};

export interface APIClientSettings {
  apiKey: string | null;
  environment: Environment;
}

export type APIErrorType = 'NO_API_KEY' | 'INVALID_API_KEY' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'NOT_FOUND' | 'UNKNOWN';

export interface APIErrorResponse {
  success: false;
  error: string;
  errorType: APIErrorType;
  statusCode?: number;
}

export class APIClient {
  private apiKey: string | null = null;
  private environment: Environment = 'production'; // Default to production
  private timeout: number;
  private maxRetries: number;
  private settingsLoaded: boolean = false;

  constructor() {
    log('debug', 'APIClient constructor called');
    this.timeout = API_TIMEOUT;
    this.maxRetries = API_RETRIES;
    // Auto-load settings on construction
    this.loadSettings().catch(err => {
      log('error', 'Failed to auto-load settings', {
        errorMessage: err instanceof Error ? err.message : String(err),
        errorName: err instanceof Error ? err.name : 'Unknown',
      });
    });
  }

  /**
   * Ensure settings are loaded before making requests
   */
  private async ensureSettingsLoaded(): Promise<void> {
    if (!this.settingsLoaded) {
      await this.loadSettings();
    }
  }

  /**
   * Get base URL for current environment
   */
  private getBaseUrl(): string {
    const url = API_URLS[this.environment];
    log('debug', 'getBaseUrl called', { environment: this.environment, url });
    return url;
  }

  /**
   * Check if we're in mock mode
   */
  isMockMode(): boolean {
    return this.environment === 'mock';
  }

  /**
   * Load settings from chrome.storage.sync
   * Defaults to 'production' if no settings saved
   */
  async loadSettings(): Promise<APIClientSettings> {
    log('info', 'loadSettings called');

    try {
      const result = await chrome.storage.sync.get([STORAGE_KEYS.API_KEY, STORAGE_KEYS.ENVIRONMENT]);

      const apiKey = result[STORAGE_KEYS.API_KEY] || null;
      // Default to 'production' if no environment saved
      const environment = (result[STORAGE_KEYS.ENVIRONMENT] as Environment) || 'production';

      this.apiKey = apiKey;
      this.environment = environment;
      this.settingsLoaded = true;

      log('info', 'Settings loaded from storage', {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        environment,
        baseUrl: API_URLS[environment]
      });

      return { apiKey, environment };
    } catch (error) {
      log('error', 'Failed to load settings from storage', {
        error: error instanceof Error ? error.message : String(error)
      });
      // Default to production on error
      this.environment = 'production';
      this.settingsLoaded = true;
      return { apiKey: null, environment: 'production' };
    }
  }

  /**
   * Save settings to chrome.storage.sync
   */
  async saveSettings(settings: Partial<APIClientSettings>): Promise<boolean> {
    log('debug', 'saveSettings called', {
      hasApiKey: !!settings.apiKey,
      environment: settings.environment
    });

    try {
      const toSave: Record<string, unknown> = {};

      if (settings.apiKey !== undefined) {
        toSave[STORAGE_KEYS.API_KEY] = settings.apiKey;
        this.apiKey = settings.apiKey;
      }

      if (settings.environment !== undefined) {
        toSave[STORAGE_KEYS.ENVIRONMENT] = settings.environment;
        this.environment = settings.environment;
      }

      await chrome.storage.sync.set(toSave);

      log('info', 'Settings saved to storage', {
        keys: Object.keys(toSave),
        environment: this.environment
      });

      return true;
    } catch (error) {
      log('error', 'Failed to save settings to storage', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Set API key
   */
  setApiKey(apiKey: string | null): void {
    log('debug', 'setApiKey called', { hasKey: !!apiKey, length: apiKey?.length || 0 });
    this.apiKey = apiKey;
  }

  /**
   * Set environment
   */
  setEnvironment(env: Environment): void {
    log('info', 'setEnvironment called', { from: this.environment, to: env });
    this.environment = env;
  }

  /**
   * Get current settings
   */
  getSettings(): APIClientSettings {
    return {
      apiKey: this.apiKey,
      environment: this.environment,
    };
  }

  /**
   * Build headers for request
   */
  private buildHeaders(customHeaders?: Record<string, string>): Headers {
    log('debug', 'buildHeaders called');

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...customHeaders,
    });

    if (this.apiKey) {
      headers.set('X-API-Key', this.apiKey);
      log('debug', 'API key added to headers');
    } else {
      log('warn', 'No API key available for request');
    }

    return headers;
  }

  /**
   * Make HTTP request with comprehensive logging
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {},
    retryCount = 0
  ): Promise<APIResponse<T> & { errorType?: APIErrorType }> {
    // Ensure settings are loaded before making request
    await this.ensureSettingsLoaded();

    const startTime = Date.now();
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const {
      method = 'GET',
      body,
      headers: customHeaders,
      timeout = this.timeout,
      retries = this.maxRetries,
    } = options;

    // Log request details
    log('info', 'API request starting', {
      url,
      method,
      hasBody: !!body,
      bodySize: body ? JSON.stringify(body).length : 0,
      timeout,
      retryCount,
      environment: this.environment,
    });

    // Note: API is open access, no API key required

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        log('warn', 'Request timeout - aborting', { url, timeout });
        controller.abort();
      }, timeout);

      const headers = this.buildHeaders(customHeaders);

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;

      // Log response details
      log('info', 'API response received', {
        url,
        status: response.status,
        statusText: response.statusText,
        elapsed: `${elapsed}ms`,
        ok: response.ok,
      });

      // Handle non-2xx responses
      if (!response.ok) {
        return this.handleErrorResponse<T>(response, url, options, retryCount, elapsed);
      }

      // Parse response
      const data: T = await response.json();
      const responseSize = JSON.stringify(data).length;

      log('info', 'API request successful', {
        url,
        elapsed: `${elapsed}ms`,
        responseSize,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;

      // Handle network errors - log full details
      log('error', 'API request failed with exception', {
        url,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorString: String(error),
        elapsed: `${elapsed}ms`,
        retryCount,
      });

      // Retry on network errors
      if (retryCount < retries) {
        const delay = this.getRetryDelay(retryCount);
        log('info', 'Retrying request after delay', { url, delay, nextRetry: retryCount + 1 });
        await this.delay(delay);
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }

      return {
        success: false,
        error: ERROR_MESSAGES.NETWORK_ERROR,
        errorType: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Handle error responses with specific error types
   */
  private async handleErrorResponse<T>(
    response: Response,
    url: string,
    options: RequestOptions,
    retryCount: number,
    elapsed: number
  ): Promise<APIResponse<T> & { errorType?: APIErrorType }> {
    let errorDetails: unknown;

    try {
      errorDetails = await response.json();
      log('debug', 'Error response body', { errorDetails });
    } catch {
      log('debug', 'Error response body is not JSON');
    }

    // Handle specific status codes
    switch (response.status) {
      case 401:
        log('error', 'API request failed - Invalid API key (401)', { url, elapsed: `${elapsed}ms` });
        return {
          success: false,
          error: ERROR_MESSAGES.INVALID_API_KEY,
          errorType: 'INVALID_API_KEY',
        };

      case 404:
        log('warn', 'API request failed - Not found (404)', { url, elapsed: `${elapsed}ms` });
        return {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND,
          errorType: 'NOT_FOUND',
        };

      case 500:
      case 502:
      case 503:
      case 504:
        log('error', 'API request failed - Server error', {
          url,
          status: response.status,
          elapsed: `${elapsed}ms`
        });

        // Retry on 5xx errors
        if (retryCount < (options.retries || this.maxRetries)) {
          const delay = this.getRetryDelay(retryCount);
          log('info', 'Retrying after server error', { url, delay, nextRetry: retryCount + 1 });
          await this.delay(delay);
          return this.makeRequest<T>(url.replace(this.getBaseUrl(), ''), options, retryCount + 1);
        }

        return {
          success: false,
          error: ERROR_MESSAGES.SERVER_ERROR,
          errorType: 'SERVER_ERROR',
        };

      default:
        log('error', 'API request failed - Unknown error', {
          url,
          status: response.status,
          statusText: response.statusText,
          elapsed: `${elapsed}ms`
        });
        return {
          success: false,
          error: `${response.status}: ${response.statusText}`,
          errorType: 'UNKNOWN',
        };
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private getRetryDelay(retryCount: number): number {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    log('debug', 'Calculated retry delay', { retryCount, delay });
    return delay;
  }

  /**
   * Sleep for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<APIResponse<T> & { errorType?: APIErrorType }> {
    log('debug', 'GET request', { endpoint });
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<APIResponse<T> & { errorType?: APIErrorType }> {
    log('debug', 'POST request', { endpoint, hasBody: !!body });
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<APIResponse<T> & { errorType?: APIErrorType }> {
    log('debug', 'PUT request', { endpoint, hasBody: !!body });
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<APIResponse<T> & { errorType?: APIErrorType }> {
    log('debug', 'DELETE request', { endpoint });
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Health check with detailed logging
   * Tests connection by making a simple deal search request
   */
  async healthCheck(): Promise<{ success: boolean; message: string; latency?: number }> {
    log('info', 'Health check starting', { environment: this.environment, baseUrl: this.getBaseUrl() });

    const startTime = Date.now();

    try {
      // Test connection with a simple deal search
      const response = await this.get<unknown>('/deals?search=test&limit=1');
      const latency = Date.now() - startTime;

      if (response.success) {
        log('info', 'Health check passed', { latency: `${latency}ms` });
        return { success: true, message: 'Connected to API', latency };
      } else {
        log('warn', 'Health check failed', { error: response.error, errorType: response.errorType, latency: `${latency}ms` });
        // Provide specific messages based on error type
        let message = response.error || 'Health check failed';
        if (response.errorType === 'INVALID_API_KEY') {
          message = 'Invalid API key - check your settings';
        } else if (response.errorType === 'NO_API_KEY') {
          message = 'API key required';
        }
        return { success: false, message, latency };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      log('error', 'Health check exception', {
        error: error instanceof Error ? error.message : String(error),
        latency: `${latency}ms`
      });
      return { success: false, message: 'Cannot reach API' };
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();

log('info', 'API client module loaded');
