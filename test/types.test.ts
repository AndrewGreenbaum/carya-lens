// Smoke test for type imports

import type { DealData, RoundStage } from '../src/types/deals';
import type { APIResponse } from '../src/types/api';
import type { TrackerItem, TrackerStatus } from '../src/types/tracker';
import type { StealthSignalData } from '../src/types/signals';
import type { ScrapedProfileData, ScrapedCompanyData } from '../src/types/linkedin';
import type { ExtensionMessage, MessageResponse, TrackerStatusResponse } from '../src/types/messages';

console.log('🧪 Running type import smoke tests...\n');

// Test DealData type
const mockDeal: DealData = {
  id: '1',
  companyName: 'Test Co',
  fundingAmount: 2000000,
  currency: 'USD',
  roundStage: 'Seed',
  dealDate: '2024-01-01',
  leadInvestor: 'Test VC',
  verificationContent: 'Test raised $2M from Test VC',
};

console.log('  ✅ DealData type imports correctly');

// Test APIResponse type
const mockResponse: APIResponse<DealData> = {
  success: true,
  data: mockDeal,
};

console.log('  ✅ APIResponse type imports correctly');

// Test TrackerItem type
const mockTrackerItem: TrackerItem = {
  id: '1',
  companyName: 'Test Co',
  status: 'New Lead',
  addedAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

console.log('  ✅ TrackerItem type imports correctly');

// Test TrackerStatusResponse type (from messages)
const mockTrackerStatus: TrackerStatusResponse = {
  isTracked: true,
  status: 'Researching',
  item: mockTrackerItem,
};

console.log('  ✅ TrackerStatusResponse type imports correctly');

// Test StealthSignalData type
const mockSignals: StealthSignalData = {
  companyName: 'Test Co',
  overallScore: 85,
  signals: {},
  lastUpdated: '2024-01-01',
};

console.log('  ✅ StealthSignalData type imports correctly');

// Test ScrapedProfileData type
const mockProfile: ScrapedProfileData = {
  founderName: 'John Doe',
  currentCompany: 'Test Co',
  currentTitle: 'CEO',
  linkedInUrl: 'https://linkedin.com/in/johndoe',
  profilePictureUrl: null,
};

console.log('  ✅ ScrapedProfileData type imports correctly');

// Test ScrapedCompanyData type
const mockCompany: ScrapedCompanyData = {
  companyName: 'Test Co',
  website: 'https://test.co',
  linkedInUrl: 'https://linkedin.com/company/testco',
  industry: 'Technology',
  followerCount: 1000,
};

console.log('  ✅ ScrapedCompanyData type imports correctly');

// Test ExtensionMessage type
const mockMessage: ExtensionMessage = {
  type: 'LOOKUP_DEAL',
  payload: { companyName: 'Test Co', linkedInUrl: 'https://linkedin.com/company/testco' },
  timestamp: Date.now(),
};

console.log('  ✅ ExtensionMessage type imports correctly');

// Test MessageResponse type
const mockMessageResponse: MessageResponse<DealData> = {
  success: true,
  data: mockDeal,
  cached: false,
};

console.log('  ✅ MessageResponse type imports correctly');

// Test RoundStage type
const stages: RoundStage[] = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+'];
console.log('  ✅ RoundStage type imports correctly');

// Test TrackerStatus type
const statuses: TrackerStatus[] = ['New Lead', 'Researching', 'Contacted', 'Invested', 'Passed'];
console.log('  ✅ TrackerStatus type imports correctly');

console.log('\n✅ All type imports work correctly!');
