// Stealth signal types

export interface StealthSignalData {
  companyName: string;
  score: number;
  signals: Signal[];
  lastUpdated: string;
}

export interface Signal {
  type: SignalType;
  value: number | string | boolean;
  label: string;
  weight: number;
  source?: string;
}

export type SignalType =
  | 'hacker_news_upvotes'
  | 'yc_batch'
  | 'github_stars'
  | 'hiring_velocity'
  | 'linkedin_growth'
  | 'domain_age'
  | 'tech_stack'
  | 'founder_background'
  | 'press_mentions';

export interface SignalThresholds {
  hot: number;
  warm: number;
  cold: number;
}

export const DEFAULT_SIGNAL_THRESHOLD = 70;

export const SIGNAL_THRESHOLDS: SignalThresholds = {
  hot: 80,
  warm: 60,
  cold: 40,
};

export interface SignalBadge {
  type: SignalType;
  label: string;
  value: string;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray';
  icon?: string;
}
