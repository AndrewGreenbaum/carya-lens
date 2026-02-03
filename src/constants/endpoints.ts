// API endpoint URLs
// Note: The real API does not use version prefix (no /v1)

import { API_BASE_URL } from './config';

const createEndpoint = (path: string) => path;

// Deal Endpoints
export const DEALS_ENDPOINTS = {
  SEARCH: createEndpoint('/deals'),
  GET_BY_ID: (id: string) => createEndpoint(`/deals/${id}`),
} as const;

// Tracker Endpoints
export const TRACKER_ENDPOINTS = {
  LIST: createEndpoint('/tracker'),
  GET: (id: string) => createEndpoint(`/tracker/${id}`),
  ADD: createEndpoint('/tracker'),
  MOVE: (id: string) => createEndpoint(`/tracker/${id}/move`),
  DELETE: (id: string) => createEndpoint(`/tracker/${id}`),
  CHECK_STATUS: createEndpoint('/tracker/check'),
} as const;

// Stealth Signals Endpoints
export const SIGNALS_ENDPOINTS = {
  GET: createEndpoint('/stealth-signals'),
  GET_BY_COMPANY: (companyName: string) =>
    createEndpoint(`/stealth-signals?company_name=${encodeURIComponent(companyName)}`),
} as const;

// Enrichment Endpoints
export const ENRICHMENT_ENDPOINTS = {
  LINKEDIN: createEndpoint('/enrichment/linkedin'),
  COMPANY: createEndpoint('/enrichment/company'),
  FOUNDER: createEndpoint('/enrichment/founder'),
} as const;

// Feedback Endpoints
export const FEEDBACK_ENDPOINTS = {
  SUGGESTION: createEndpoint('/feedback/suggestion'),
  ISSUE: createEndpoint('/feedback/issue'),
  BUG_REPORT: createEndpoint('/feedback/bug'),
} as const;

// Health Check
export const HEALTH_ENDPOINT = createEndpoint('/health');

// Export all endpoints
export const ENDPOINTS = {
  DEALS: DEALS_ENDPOINTS,
  TRACKER: TRACKER_ENDPOINTS,
  SIGNALS: SIGNALS_ENDPOINTS,
  ENRICHMENT: ENRICHMENT_ENDPOINTS,
  FEEDBACK: FEEDBACK_ENDPOINTS,
  HEALTH: HEALTH_ENDPOINT,
} as const;
