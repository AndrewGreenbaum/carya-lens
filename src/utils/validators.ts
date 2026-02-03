// Input validation utilities

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate URL format
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validate LinkedIn profile URL
export function isLinkedInProfileUrl(url: string): boolean {
  return /linkedin\.com\/in\/[^/]+\/?$/.test(url);
}

// Validate LinkedIn company URL
export function isLinkedInCompanyUrl(url: string): boolean {
  return /linkedin\.com\/company\/[^/]+\/?$/.test(url);
}

// Validate any LinkedIn URL
export function isLinkedInUrl(url: string): boolean {
  return url.includes('linkedin.com');
}

// Validate API key format (basic check)
export function isValidApiKey(key: string): boolean {
  // API keys should be at least 20 characters
  return key.length >= 20 && /^[A-Za-z0-9_-]+$/.test(key);
}

// Validate company name
export function isValidCompanyName(name: string): boolean {
  return name.trim().length >= 2;
}

// Validate founder name
export function isValidFounderName(name: string): boolean {
  return name.trim().length >= 2 && name.includes(' ');
}

// Validate funding amount
export function isValidFundingAmount(amount: number): boolean {
  return amount > 0 && Number.isFinite(amount);
}

// Validate round stage
export function isValidRoundStage(stage: string): boolean {
  const validStages = [
    'Pre-Seed',
    'Seed',
    'Series A',
    'Series B',
    'Series C',
    'Series D+',
    'Bridge',
    'Growth',
    'Acquisition',
    'IPO',
  ];
  return validStages.includes(stage);
}

// Sanitize input for XSS prevention
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Validate date string
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Check if string is empty or whitespace
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

// Check if object has required fields
export function hasRequiredFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): boolean {
  return fields.every((field) => {
    const value = obj[field];
    if (typeof value === 'string') {
      return !isEmpty(value);
    }
    return value !== null && value !== undefined;
  });
}
