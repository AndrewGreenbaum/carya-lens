// Base API types

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface APIError {
  status: number;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface APIConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HTTPMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}
