// Data formatting utilities

// Format currency amount
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount}`;
}

// Format date to readable string
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Less than 7 days ago - show relative time
  if (diffInDays < 7) {
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  }

  // Otherwise show formatted date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

// Format large numbers (followers, stars, etc.)
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

// Truncate text to specified length
export function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Extract domain from URL
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

// Format round stage with emoji
export function formatRoundStage(stage: string): string {
  const stageMap: Record<string, string> = {
    'Pre-Seed': '🌱 Pre-Seed',
    'Seed': '🌱 Seed',
    'Series A': '🅰️ Series A',
    'Series B': '🅱️ Series B',
    'Series C': '©️ Series C',
    'Series D+': '🚀 Series D+',
    'Bridge': '🌉 Bridge',
    'Growth': '📈 Growth',
    'Acquisition': '🤝 Acquisition',
    'IPO': '📊 IPO',
  };
  return stageMap[stage] || stage;
}

// Sanitize text from DOM (remove extra whitespace)
export function sanitizeText(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.replace(/\s+/g, ' ').trim();
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

// Format time ago
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'Just now';
}
