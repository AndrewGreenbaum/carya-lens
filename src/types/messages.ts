// Chrome extension message types

import type { DealData, DealSearchParams } from './deals';
import type { TrackerItem, AddToTrackerPayload, MoveStatusPayload, TrackerStatus } from './tracker';
import type { StealthSignalData } from './signals';
import type { ScrapedProfileData, ScrapedCompanyData } from './linkedin';

// Message types
export type MessageType =
  | 'LOOKUP_DEAL'
  | 'ADD_TO_TRACKER'
  | 'MOVE_STATUS'
  | 'GET_TRACKER_STATUS'
  | 'ENRICH_DEAL'
  | 'GET_STEALTH_SIGNALS'
  | 'EXPORT_DEAL'
  | 'FLAG_ISSUE'
  | 'CLEAR_CACHE'
  | 'GET_API_KEY'
  | 'SET_API_KEY'
  | 'VALIDATE_API_KEY';

// Base message structure
export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload?: T;
  timestamp?: number;
}

// API error types (imported from client for consistency)
export type APIErrorType = 'NO_API_KEY' | 'INVALID_API_KEY' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'NOT_FOUND' | 'UNKNOWN';

// Response structure
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: APIErrorType;
  cached?: boolean;
}

// Message payloads
export interface LookupDealPayload {
  companyName?: string;
  founderName?: string;
  linkedInUrl: string;
}

export interface EnrichDealPayload {
  linkedInUrl: string;
  scrapedData: ScrapedProfileData | ScrapedCompanyData;
}

export interface GetStealthSignalsPayload {
  companyName: string;
}

export interface ExportDealPayload {
  dealData: DealData;
  format: 'csv' | 'json';
}

export interface FlagIssuePayload {
  companyName: string;
  linkedInUrl: string;
  issueType: IssueType;
  description?: string;
}

export type IssueType =
  | 'not_in_database'
  | 'incorrect_data'
  | 'missing_investor'
  | 'wrong_amount'
  | 'outdated'
  | 'other';

export interface SetAPIKeyPayload {
  apiKey: string;
}

// Message response data types
export interface LookupDealResponse {
  deal: DealData | null;
  found: boolean;
}

export interface TrackerStatusResponse {
  isTracked: boolean;
  status?: TrackerStatus;
  item?: TrackerItem;
}

export interface StealthSignalsResponse {
  signals: StealthSignalData | null;
  hasHighSignals: boolean;
}

export interface ValidateAPIKeyResponse {
  valid: boolean;
  message?: string;
}

// Helper type for message handlers
export type MessageHandler<T = unknown, R = unknown> = (
  payload: T,
  sender: chrome.runtime.MessageSender
) => Promise<MessageResponse<R>>;
