/**
 * LinkedIn DOM Scraper
 *
 * Extracts data from LinkedIn profile and company pages.
 * Uses multiple selector strategies to handle LinkedIn's frequently changing DOM.
 */

import type { ScrapedProfileData, ScrapedCompanyData } from '@/types/linkedin';
import {
  PROFILE_SELECTORS,
  COMPANY_SELECTORS,
  trySelectors,
  extractTextContent,
  extractAttribute,
} from '@/constants/linkedin-selectors';
import { logger } from '@/utils/logger';
import { getTextContent, getAttribute } from '@/utils/dom';

/**
 * Scrape data from a LinkedIn profile page
 *
 * Strategy:
 * 1. Try stable data attributes first
 * 2. Fall back to ARIA labels
 * 3. Fall back to structural selectors
 *
 * @returns ScrapedProfileData or null if extraction fails
 */
export function scrapeProfile(): ScrapedProfileData | null {
  logger.debug('Starting profile scrape');

  try {
    // Extract founder name (multiple strategies)
    const founderName = extractFounderName();
    if (!founderName) {
      logger.warn('Failed to extract founder name');
      return null;
    }

    // Extract current company
    const currentCompany = extractCurrentCompany();

    // Extract current title
    const currentTitle = extractCurrentTitle();

    // LinkedIn URL
    const linkedInUrl = window.location.href;

    // Profile picture
    const profilePictureUrl = extractProfilePicture();

    const result: ScrapedProfileData = {
      founderName,
      currentCompany,
      currentTitle,
      linkedInUrl,
      profilePictureUrl,
    };

    logger.info('Profile scrape successful', {
      founderName: result.founderName,
      currentCompany: result.currentCompany,
      currentTitle: result.currentTitle,
    });
    return result;
  } catch (error) {
    logger.error('Profile scrape failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

/**
 * Scrape data from a LinkedIn company page
 *
 * @returns ScrapedCompanyData or null if extraction fails
 */
export function scrapeCompany(): ScrapedCompanyData | null {
  logger.debug('Starting company scrape');

  try {
    // Extract company name
    const companyName = extractCompanyName();
    if (!companyName) {
      logger.warn('Failed to extract company name');
      return null;
    }

    // Extract website
    const website = extractCompanyWebsite();

    // LinkedIn URL
    const linkedInUrl = window.location.href;

    // Industry
    const industry = extractIndustry();

    // Follower count
    const followerCount = extractFollowerCount();

    const result: ScrapedCompanyData = {
      companyName,
      website,
      linkedInUrl,
      industry,
      followerCount,
    };

    logger.info('Company scrape successful', {
      companyName: result.companyName,
      website: result.website,
      industry: result.industry,
    });
    return result;
  } catch (error) {
    logger.error('Company scrape failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

/**
 * Extract founder name from profile page
 * Uses multiple fallback strategies
 */
function extractFounderName(): string | null {
  // Strategy 1: Try the actual LinkedIn class (2024)
  let nameElement = document.querySelector('h1.top-card-layout__title');

  // Strategy 2: Fallback to main section h1
  if (!nameElement) {
    nameElement = document.querySelector('main section h1');
  }

  // Strategy 3: Try by class pattern (older LinkedIn)
  if (!nameElement) {
    nameElement = document.querySelector('[class*="entity-lockup__title"]');
  }

  const name = getTextContent(nameElement);
  logger.debug('Extracted founder name', { name, strategy: nameElement ? 'success' : 'failed' });

  return name;
}

/**
 * Extract current company from experience section
 */
function extractCurrentCompany(): string | null {
  // Strategy 1: Try the actual LinkedIn experience class (2024)
  let companyElement = document.querySelector('.experience-item__subtitle');

  // Strategy 2: Fallback to older pattern
  if (!companyElement) {
    const experienceSection = document.querySelector('[class*="experience"]');
    if (experienceSection) {
      const firstExperience = experienceSection.querySelector('li:first-child');
      if (firstExperience) {
        companyElement = firstExperience.querySelector('[class*="entity-lockup__subtitle"]') ||
                        firstExperience.querySelector('span[aria-hidden="true"]');
      }
    }
  }

  const company = getTextContent(companyElement);
  logger.debug('Extracted current company', { company });

  return company;
}

/**
 * Extract current title from profile
 */
function extractCurrentTitle(): string | null {
  // Strategy 1: Try headline in top card (2024) - contains "Title at Company"
  let titleElement = document.querySelector('h2.top-card-layout__headline');

  if (titleElement) {
    const headline = getTextContent(titleElement);
    // Headline is "Chairman and CEO at Microsoft", extract just the title part
    if (headline) {
      const titlePart = headline.split(' at ')[0];
      logger.debug('Extracted title from headline', { titlePart });
      return titlePart;
    }
  }

  // Strategy 2: Try experience-item__title (actual job title in experience section)
  titleElement = document.querySelector('.experience-item__title');
  if (titleElement) {
    const title = getTextContent(titleElement);
    logger.debug('Extracted title from experience', { title });
    return title;
  }

  // Strategy 3: Fallback to older pattern
  titleElement = document.querySelector('main section [class*="entity-lockup__subtitle"]') ||
                document.querySelector('main section .text-body-medium');

  const title = getTextContent(titleElement);
  logger.debug('Extracted current title (fallback)', { title });

  return title;
}

/**
 * Extract profile picture URL
 */
function extractProfilePicture(): string | null {
  // Strategy 1: Find image with person's name in alt attribute
  // Get the name first to match against alt
  const nameElement = document.querySelector('h1.top-card-layout__title');
  const name = getTextContent(nameElement);

  if (name) {
    const firstName = name.split(' ')[0];
    const imgElement = document.querySelector(`img[alt*="${firstName}"]`);

    if (imgElement) {
      const url = getAttribute(imgElement, 'src');
      logger.debug('Extracted profile picture by name', { url });
      return url;
    }
  }

  // Strategy 2: Look for profile photo by class patterns
  const imgElement = document.querySelector('img[class*="profile-photo"]') ||
                    document.querySelector('img[class*="presence-entity__image"]') ||
                    document.querySelector('img[class*="profile-displayphoto"]');

  if (!imgElement) {
    logger.debug('Profile picture not found');
    return null;
  }

  const url = getAttribute(imgElement, 'src');
  logger.debug('Extracted profile picture', { url });

  return url;
}

/**
 * Extract company name from company page
 */
function extractCompanyName(): string | null {
  logger.debug('Attempting to extract company name...');

  // Strategy 1: Main h1 in company page (most common)
  let nameElement = document.querySelector('main h1');
  if (nameElement) {
    const name = getTextContent(nameElement);
    if (name) {
      logger.debug('Extracted company name via main h1', { name });
      return name;
    }
  }

  // Strategy 2: org-top-card h1
  nameElement = document.querySelector('[class*="org-top-card"] h1');
  if (nameElement) {
    const name = getTextContent(nameElement);
    if (name) {
      logger.debug('Extracted company name via org-top-card', { name });
      return name;
    }
  }

  // Strategy 3: Look for h1 with specific classes (2024 LinkedIn)
  nameElement = document.querySelector('h1[class*="org-top-card-summary__title"]') ||
               document.querySelector('h1[class*="top-card-layout__title"]') ||
               document.querySelector('h1[class*="ember-view"]');
  if (nameElement) {
    const name = getTextContent(nameElement);
    if (name) {
      logger.debug('Extracted company name via class pattern', { name });
      return name;
    }
  }

  // Strategy 4: Any h1 on page (last resort)
  nameElement = document.querySelector('h1');
  if (nameElement) {
    const name = getTextContent(nameElement);
    if (name) {
      logger.debug('Extracted company name via any h1 (fallback)', { name });
      return name;
    }
  }

  // Strategy 5: Look in meta tags
  const metaTitle = document.querySelector('meta[property="og:title"]');
  if (metaTitle) {
    const content = metaTitle.getAttribute('content');
    if (content) {
      // Usually "Company Name | LinkedIn"
      const name = content.split('|')[0].trim();
      logger.debug('Extracted company name via meta tag', { name });
      return name;
    }
  }

  logger.warn('All company name extraction strategies failed');
  return null;
}

/**
 * Extract company website
 */
function extractCompanyWebsite(): string | null {
  // Strategy 1: Look for external links (not linkedin.com)
  const links = Array.from(document.querySelectorAll('a[href^="http"]'));
  const externalLink = links.find(link => {
    const href = link.getAttribute('href') || '';
    return !href.includes('linkedin.com');
  });

  if (!externalLink) {
    logger.debug('Company website not found');
    return null;
  }

  const website = getAttribute(externalLink, 'href');
  logger.debug('Extracted company website', { website });

  return website;
}

/**
 * Extract company industry
 */
function extractIndustry(): string | null {
  logger.debug('Attempting to extract industry...');

  // Strategy 1: Look for industry text in company details by class
  let industryElement = document.querySelector('[class*="org-top-card"] [class*="industry"]');
  if (industryElement) {
    const industry = getTextContent(industryElement);
    if (industry) {
      logger.debug('Extracted industry via class', { industry });
      return industry;
    }
  }

  // Strategy 2: Look for industry in about section
  industryElement = document.querySelector('[class*="org-about-module"] [class*="industry"]');
  if (industryElement) {
    const industry = getTextContent(industryElement);
    if (industry) {
      logger.debug('Extracted industry via about module', { industry });
      return industry;
    }
  }

  // Strategy 3: Look in the top card subtitle/tagline area
  industryElement = document.querySelector('[class*="org-top-card-summary"] [class*="tagline"]') ||
                   document.querySelector('[class*="top-card"] [class*="subline"]');
  if (industryElement) {
    const industry = getTextContent(industryElement);
    if (industry) {
      logger.debug('Extracted industry via tagline', { industry });
      return industry;
    }
  }

  logger.debug('Industry not found');
  return null;
}

/**
 * Extract follower count
 */
function extractFollowerCount(): number | null {
  // Strategy 1: Look for follower count text
  const followerElements = Array.from(document.querySelectorAll('[class*="org-top-card"] span'));
  const followerElement = followerElements.find(el =>
    el.textContent?.toLowerCase().includes('follower')
  );

  if (!followerElement) {
    logger.debug('Follower count not found');
    return null;
  }

  const text = getTextContent(followerElement);
  if (!text) return null;

  // Extract number from text like "1,234 followers"
  const match = text.match(/[\d,]+/);
  if (!match) return null;

  const count = parseInt(match[0].replace(/,/g, ''), 10);
  logger.debug('Extracted follower count', { count });

  return count;
}

