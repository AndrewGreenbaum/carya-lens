// LinkedIn-related types

export type PageType = 'profile' | 'company' | 'feed' | 'unknown';

export interface ScrapedProfileData {
  founderName: string | null;
  currentCompany: string | null;
  currentTitle: string | null;
  linkedInUrl: string;
  profilePictureUrl: string | null;
  headline?: string | null;
  location?: string | null;
}

export interface ScrapedCompanyData {
  companyName: string | null;
  website: string | null;
  linkedInUrl: string;
  industry: string | null;
  followerCount: number | null;
  companySize?: string | null;
  headquarters?: string | null;
  tagline?: string | null;
}

export interface LinkedInPageContext {
  pageType: PageType;
  url: string;
  profileData?: ScrapedProfileData;
  companyData?: ScrapedCompanyData;
  isReady: boolean;
}

export interface DOMSelector {
  selector: string;
  attribute?: string;
  fallback?: DOMSelector;
}

export interface SelectorStrategy {
  primary: DOMSelector;
  fallbacks: DOMSelector[];
}
