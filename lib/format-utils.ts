// Utility functions for formatting prices, numbers, addresses, and times

/**
 * Format a price with appropriate decimal places
 */
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (price >= 0.01) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 });
  } else {
    return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  }
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(num: number, decimals: number = 1): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(decimals)}B`;
  } else if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(decimals)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(decimals)}K`;
  }
  return num.toFixed(decimals);
}

/**
 * Format currency with $ symbol
 */
export function formatCurrency(amount: number, decimals?: number): string {
  return `$${formatNumber(amount, decimals)}`;
}

/**
 * Format percentage with + or - sign
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Shorten wallet address (0x1234...5678)
 */
export function shortenAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Calculate time ago from a date
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }
  
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate days until goal based on current rate
 */
export function estimateDaysToGoal(raised: number, goal: number, daysActive: number): string {
  if (raised >= goal) {
    return 'Goal reached!';
  }
  
  if (daysActive === 0 || raised === 0) {
    return 'Calculating...';
  }
  
  const dailyRate = raised / daysActive;
  const remaining = goal - raised;
  const daysNeeded = Math.ceil(remaining / dailyRate);
  
  if (daysNeeded > 365) {
    return `~${Math.round(daysNeeded / 365)} years`;
  } else if (daysNeeded > 30) {
    return `~${Math.round(daysNeeded / 30)} months`;
  }
  
  return `~${daysNeeded} days`;
}

/**
 * Get color class based on percentage change
 */
export function getPriceChangeColor(change: number): string {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-muted-foreground';
}

/**
 * Calculate SOL to USD conversion (mock rate)
 */
export function solToUsd(sol: number, solPrice: number = 100): number {
  return sol * solPrice;
}

/**
 * Calculate USD to SOL conversion (mock rate)
 */
export function usdToSol(usd: number, solPrice: number = 100): number {
  return usd / solPrice;
}


