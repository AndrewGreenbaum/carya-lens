// Deal-related types

export interface DealData {
  id: string;
  companyName: string;
  founderName?: string;
  fundingAmount: number;
  currency: string;
  roundStage: RoundStage;
  leadInvestor?: InvestorInfo;
  investors?: InvestorInfo[];
  dealDate: string;
  verificationContent?: string;
  source?: string;
  confidence?: number;
}

export type RoundStage =
  | 'Pre-Seed'
  | 'Seed'
  | 'Series A'
  | 'Series B'
  | 'Series C'
  | 'Series D+'
  | 'Bridge'
  | 'Growth'
  | 'Acquisition'
  | 'IPO'
  | 'Unknown';

export interface InvestorInfo {
  name: string;
  logo?: string;
  website?: string;
  type?: InvestorType;
}

export type InvestorType = 'VC' | 'Angel' | 'Corporate' | 'PE' | 'Accelerator' | 'Other';

export interface DealSearchParams {
  query: string;
  companyName?: string;
  founderName?: string;
  limit?: number;
}

export interface DealSearchResult {
  deals: DealData[];
  totalResults: number;
}
