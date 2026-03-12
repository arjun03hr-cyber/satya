import crypto from 'crypto';

/**
 * Creates a unique SHA-256 hash for a given text to be used as a cache key.
 */
export const hashText = (text: string): string => {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
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
