/**
 * LinkedIn Scraper Manual Test
 *
 * INSTRUCTIONS:
 * 1. Navigate to any LinkedIn profile page (e.g., linkedin.com/in/someone)
 * 2. Open Chrome DevTools (F12 or Cmd+Option+I)
 * 3. Go to Console tab
 * 4. Copy and paste this entire file
 * 5. Press Enter
 *
 * Expected output: A detailed report of what data was extracted
 */

(function() {
  console.clear();
  console.log('%c🧪 LinkedIn Scraper Manual Test', 'font-size: 20px; font-weight: bold; color: #0077b5;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #0077b5;');

  // Utility functions (inline versions from our codebase)
  function getTextContent(element) {
    if (!element) return null;
    return element.textContent?.trim() || null;
  }

  function getAttribute(element, attribute) {
    if (!element) return null;
    return element.getAttribute(attribute);
  }

  // Detect page type
  function detectPageType() {
    const pathname = window.location.pathname;

    if (pathname.match(/^\/in\/([^\/]+)\/?$/)) {
      return { type: 'profile', pathname };
    }
    if (pathname.match(/^\/company\/([^\/]+)\/?$/)) {
      return { type: 'company', pathname };
    }
    return { type: 'unknown', pathname };
  }

  // Profile scraping functions
  function extractFounderName() {
    console.log('\n📝 Extracting founder name...');

    // Strategy 1: LinkedIn 2024 class
    let nameElement = document.querySelector('h1.top-card-layout__title');
    if (nameElement) {
      console.log('  ✅ Strategy 1: h1.top-card-layout__title (LinkedIn 2024)');
      return getTextContent(nameElement);
    }
    console.log('  ❌ Strategy 1 failed');

    // Strategy 2: Main profile section h1
    nameElement = document.querySelector('main section h1');
    if (nameElement) {
      console.log('  ✅ Strategy 2: main section h1');
      return getTextContent(nameElement);
    }
    console.log('  ❌ Strategy 2 failed');

    // Strategy 3: Entity lockup title (older)
    nameElement = document.querySelector('[class*="entity-lockup__title"]');
    if (nameElement) {
      console.log('  ✅ Strategy 3: entity-lockup__title');
      return getTextContent(nameElement);
    }
    console.log('  ❌ Strategy 3 failed');

    console.log('  ⚠️  All strategies failed');
    return null;
  }

  function extractCurrentCompany() {
    console.log('\n🏢 Extracting current company...');

    // Strategy 1: LinkedIn 2024 experience class
    let companyElement = document.querySelector('.experience-item__subtitle');
    if (companyElement) {
      console.log('  ✅ Strategy 1: .experience-item__subtitle (LinkedIn 2024)');
      return getTextContent(companyElement);
    }
    console.log('  ❌ Strategy 1 failed');

    // Strategy 2: Fallback to older pattern
    const experienceSection = document.querySelector('[class*="experience"]');
    if (!experienceSection) {
      console.log('  ❌ Experience section not found');
      return null;
    }
    console.log('  ✅ Found experience section');

    const firstExperience = experienceSection.querySelector('li:first-child');
    if (!firstExperience) {
      console.log('  ❌ No experience entries found');
      return null;
    }
    console.log('  ✅ Found first experience entry');

    companyElement = firstExperience.querySelector('[class*="entity-lockup__subtitle"]') ||
                    firstExperience.querySelector('span[aria-hidden="true"]');

    if (companyElement) {
      console.log('  ✅ Strategy 2: Extracted company name (older pattern)');
      return getTextContent(companyElement);
    }

    console.log('  ❌ Company name not found in experience');
    return null;
  }

  function extractCurrentTitle() {
    console.log('\n💼 Extracting current title...');

    // Strategy 1: Try headline (contains "Title at Company")
    let titleElement = document.querySelector('h2.top-card-layout__headline');
    if (titleElement) {
      const headline = getTextContent(titleElement);
      if (headline) {
        // Extract title part before " at "
        const titlePart = headline.split(' at ')[0];
        console.log('  ✅ Strategy 1: h2.top-card-layout__headline (LinkedIn 2024)');
        console.log('  📄 Headline:', headline);
        console.log('  📄 Extracted title:', titlePart);
        return titlePart;
      }
    }
    console.log('  ❌ Strategy 1 failed');

    // Strategy 2: Try experience-item__title
    titleElement = document.querySelector('.experience-item__title');
    if (titleElement) {
      console.log('  ✅ Strategy 2: .experience-item__title');
      return getTextContent(titleElement);
    }
    console.log('  ❌ Strategy 2 failed');

    // Strategy 3: Fallback to older pattern
    titleElement = document.querySelector('main section [class*="entity-lockup__subtitle"]') ||
                  document.querySelector('main section .text-body-medium');

    if (titleElement) {
      console.log('  ✅ Strategy 3: Found title element (older pattern)');
      return getTextContent(titleElement);
    }

    console.log('  ❌ Title not found');
    return null;
  }

  function extractProfilePicture() {
    console.log('\n📷 Extracting profile picture...');

    // Strategy 1: Find by name in alt attribute
    const nameElement = document.querySelector('h1.top-card-layout__title');
    const name = getTextContent(nameElement);

    if (name) {
      const firstName = name.split(' ')[0];
      const imgByName = document.querySelector(`img[alt*="${firstName}"]`);

      if (imgByName) {
        const url = getAttribute(imgByName, 'src');
        if (url) {
          console.log('  ✅ Strategy 1: Found by name in alt attribute');
          console.log('  📎 URL preview:', url.substring(0, 60) + '...');
          return url;
        }
      }
      console.log('  ❌ Strategy 1 failed (no img with name in alt)');
    }

    // Strategy 2: Look for profile photo by class patterns
    const imgElement = document.querySelector('img[class*="profile-photo"]') ||
                      document.querySelector('img[class*="presence-entity__image"]') ||
                      document.querySelector('img[class*="profile-displayphoto"]');

    if (!imgElement) {
      console.log('  ❌ Profile picture not found');
      return null;
    }

    const url = getAttribute(imgElement, 'src');
    if (url) {
      console.log('  ✅ Strategy 2: Found profile picture by class');
      console.log('  📎 URL preview:', url.substring(0, 60) + '...');
      return url;
    }

    console.log('  ❌ Profile picture src attribute missing');
    return null;
  }

  function scrapeProfile() {
    console.log('\n🎯 Starting profile scrape...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const founderName = extractFounderName();
    const currentCompany = extractCurrentCompany();
    const currentTitle = extractCurrentTitle();
    const linkedInUrl = window.location.href;
    const profilePictureUrl = extractProfilePicture();

    return {
      founderName,
      currentCompany,
      currentTitle,
      linkedInUrl,
      profilePictureUrl,
    };
  }

  // Company scraping functions
  function extractCompanyName() {
    console.log('\n🏢 Extracting company name...');

    const nameElement = document.querySelector('main h1') ||
                       document.querySelector('[class*="org-top-card"] h1');

    if (nameElement) {
      console.log('  ✅ Found company name');
      return getTextContent(nameElement);
    }

    console.log('  ❌ Company name not found');
    return null;
  }

  function extractCompanyWebsite() {
    console.log('\n🌐 Extracting company website...');

    const links = Array.from(document.querySelectorAll('a[href^="http"]'));
    const externalLink = links.find(link => {
      const href = link.getAttribute('href') || '';
      return !href.includes('linkedin.com');
    });

    if (!externalLink) {
      console.log('  ❌ No external links found');
      return null;
    }

    const website = getAttribute(externalLink, 'href');
    if (website) {
      console.log('  ✅ Found company website');
      console.log('  📎 URL:', website);
      return website;
    }

    console.log('  ❌ Website URL not found');
    return null;
  }

  function extractIndustry() {
    console.log('\n🏭 Extracting industry...');

    const industryElement = document.querySelector('[class*="org-top-card"] [class*="industry"]') ||
                           document.querySelector('[class*="org-about-us"] dt:contains("Industry") + dd');

    if (industryElement) {
      console.log('  ✅ Found industry');
      return getTextContent(industryElement);
    }

    console.log('  ❌ Industry not found');
    return null;
  }

  function extractFollowerCount() {
    console.log('\n👥 Extracting follower count...');

    const followerElements = Array.from(document.querySelectorAll('[class*="org-top-card"] span'));
    const followerElement = followerElements.find(el =>
      el.textContent?.toLowerCase().includes('follower')
    );

    if (!followerElement) {
      console.log('  ❌ Follower count not found');
      return null;
    }

    const text = getTextContent(followerElement);
    if (!text) return null;

    const match = text.match(/[\d,]+/);
    if (!match) {
      console.log('  ❌ Could not parse follower count from:', text);
      return null;
    }

    const count = parseInt(match[0].replace(/,/g, ''), 10);
    console.log('  ✅ Found follower count:', count.toLocaleString());
    return count;
  }

  function scrapeCompany() {
    console.log('\n🎯 Starting company scrape...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const companyName = extractCompanyName();
    const website = extractCompanyWebsite();
    const linkedInUrl = window.location.href;
    const industry = extractIndustry();
    const followerCount = extractFollowerCount();

    return {
      companyName,
      website,
      linkedInUrl,
      industry,
      followerCount,
    };
  }

  // Main test execution
  console.log('\n📍 Current page:', window.location.href);

  const pageContext = detectPageType();
  console.log('📄 Page type:', pageContext.type);

  if (pageContext.type === 'profile') {
    const result = scrapeProfile();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('%c📊 PROFILE SCRAPE RESULTS', 'font-size: 16px; font-weight: bold; color: #0077b5;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.table({
      'Founder Name': result.founderName || '❌ Not found',
      'Current Company': result.currentCompany || '❌ Not found',
      'Current Title': result.currentTitle || '❌ Not found',
      'LinkedIn URL': result.linkedInUrl || '❌ Not found',
      'Profile Picture': result.profilePictureUrl ? '✅ Found' : '❌ Not found',
    });

    console.log('\n📦 Full result object:');
    console.log(result);

    // Success analysis
    const foundFields = Object.values(result).filter(v => v !== null).length;
    const totalFields = Object.keys(result).length;
    const successRate = ((foundFields / totalFields) * 100).toFixed(0);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`%c✨ Success Rate: ${foundFields}/${totalFields} fields (${successRate}%)`,
                `font-size: 14px; font-weight: bold; color: ${successRate >= 60 ? '#10b981' : '#f59e0b'};`);

    if (successRate < 60) {
      console.log('\n⚠️  Low success rate detected. Possible causes:');
      console.log('   • LinkedIn updated their DOM structure');
      console.log('   • Profile is incomplete');
      console.log('   • Selectors need updating');
      console.log('\n💡 Check the extraction logs above to see which strategies failed');
    } else {
      console.log('\n✅ Scraper is working correctly!');
    }

  } else if (pageContext.type === 'company') {
    const result = scrapeCompany();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('%c📊 COMPANY SCRAPE RESULTS', 'font-size: 16px; font-weight: bold; color: #0077b5;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.table({
      'Company Name': result.companyName || '❌ Not found',
      'Website': result.website || '❌ Not found',
      'LinkedIn URL': result.linkedInUrl || '❌ Not found',
      'Industry': result.industry || '❌ Not found',
      'Follower Count': result.followerCount !== null ? result.followerCount.toLocaleString() : '❌ Not found',
    });

    console.log('\n📦 Full result object:');
    console.log(result);

    // Success analysis
    const foundFields = Object.values(result).filter(v => v !== null).length;
    const totalFields = Object.keys(result).length;
    const successRate = ((foundFields / totalFields) * 100).toFixed(0);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`%c✨ Success Rate: ${foundFields}/${totalFields} fields (${successRate}%)`,
                `font-size: 14px; font-weight: bold; color: ${successRate >= 60 ? '#10b981' : '#f59e0b'};`);

    if (successRate < 60) {
      console.log('\n⚠️  Low success rate detected. Possible causes:');
      console.log('   • LinkedIn updated their DOM structure');
      console.log('   • Company page is incomplete');
      console.log('   • Selectors need updating');
      console.log('\n💡 Check the extraction logs above to see which strategies failed');
    } else {
      console.log('\n✅ Scraper is working correctly!');
    }

  } else {
    console.log('\n❌ ERROR: Not a profile or company page');
    console.log('Please navigate to a LinkedIn profile (linkedin.com/in/someone) or company page (linkedin.com/company/something)');
    console.log('Current pathname:', pageContext.pathname);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('%c🏁 Test Complete', 'font-size: 16px; font-weight: bold; color: #0077b5;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

})();
