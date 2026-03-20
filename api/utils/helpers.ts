import crypto from 'crypto';

/**
 * Creates a unique SHA-256 hash for a given text to be used as a cache key.
 */
export const hashText = (text: string): string => {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
};

/**
 * Normalizes a URL by removing fragments, tracking parameters, and trailing slashes.
 */
export const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    parsed.hash = ''; // Remove fragment
    // Remove common tracking params
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
    paramsToRemove.forEach(param => parsed.searchParams.delete(param));
    
    let normalized = parsed.toString();
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized.toLowerCase();
  } catch (e) {
    // If invalid URL, return lowercased original
    return url.trim().toLowerCase();
  }
};

/**
 * Normalizes a query text for better semantic and keyword matching.
 */
export const normalizeQuery = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s\d]/gi, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
};


/**
 * Executes a Promise-returning operation with exponential backoff retries.
 * NOTE: Rate limit errors (429) are NOT retried — retrying a rate-limited key
 * immediately makes the quota worse. They are thrown immediately so the user
 * sees a clear error fast.
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelayMs: number = 1000
): Promise<T> => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.toLowerCase().includes('quota') || error?.message?.includes('429');
      
      // Never retry rate limits — throw immediately
      if (isRateLimit) {
        console.warn(`[Retry Utility] Rate limit hit — not retrying (would burn more quota).`);
        throw error;
      }

      if (attempt < maxRetries - 1) {
        attempt++;
        const delay = baseDelayMs * Math.pow(2, attempt) + (Math.random() * 500);
        console.warn(`[Retry Utility] Transient error. Retrying in ${Math.round(delay)}ms (Attempt ${attempt}/${maxRetries - 1})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error("Max retries exceeded");
};
