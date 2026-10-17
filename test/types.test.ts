// Smoke test for type imports

import type { DealData, RoundStage } from '../src/types/deals';
import type { APIResponse } from '../src/types/api';
import type { TrackerItem, TrackerStatus } from '../src/types/tracker';
import type { StealthSignalData } from '../src/types/signals';
import type { ScrapedProfileData, ScrapedCompanyData } from '../src/types/linkedin';
import type { ExtensionMessage, MessageResponse, TrackerStatusResponse } from '../src/types/messages';


// Test DealData type
const mockDeal: DealData = {
  id: '1',
  companyName: 'Test Co',
  fundingAmount: 2000000,
  currency: 'USD',
  roundStage: 'Seed',
  dealDate: '2024-01-01',
  leadInvestor: { name: 'Test VC', type: 'VC' },
  verificationContent: 'Test raised $2M from Test VC',
};


// Test APIResponse type
const mockResponse: APIResponse<DealData> = {
  success: true,
  data: mockDeal,
};


// Test TrackerItem type
const mockTrackerItem: TrackerItem = {
  id: '1',
  companyName: 'Test Co',
  status: 'New Lead',
  addedAt: '2024-01-01',
  updatedAt: '2024-01-01',
};


// Test TrackerStatusResponse type (from messages)
const mockTrackerStatus: TrackerStatusResponse = {
  isTracked: true,
  status: 'Researching',
  item: mockTrackerItem,
};


// Test StealthSignalData type
const mockSignals: StealthSignalData = {
  companyName: 'Test Co',
  score: 85,
  signals: [],
  lastUpdated: '2024-01-01',
};


// Test ScrapedProfileData type
const mockProfile: ScrapedProfileData = {
  founderName: 'John Doe',
  currentCompany: 'Test Co',
  currentTitle: 'CEO',
  linkedInUrl: 'https://linkedin.com/in/johndoe',
  profilePictureUrl: null,
};


// Test ScrapedCompanyData type
const mockCompany: ScrapedCompanyData = {
  companyName: 'Test Co',
  website: 'https://test.co',
  linkedInUrl: 'https://linkedin.com/company/testco',
  industry: 'Technology',
  followerCount: 1000,
};


// Test ExtensionMessage type
const mockMessage: ExtensionMessage = {
  type: 'LOOKUP_DEAL',
  payload: { companyName: 'Test Co', linkedInUrl: 'https://linkedin.com/company/testco' },
  timestamp: Date.now(),
};


// Test MessageResponse type
const mockMessageResponse: MessageResponse<DealData> = {
  success: true,
  data: mockDeal,
  cached: false,
};


// Test RoundStage type
const stages: RoundStage[] = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C'];

// Test TrackerStatus type
const statuses: TrackerStatus[] = ['New Lead', 'Researching', 'Contacted', 'Invested', 'Passed'];
