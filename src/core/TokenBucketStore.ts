export interface TokenBucketStore {
  consume(
    key: string,
    now: number,
    capacity: number,
    refillRate: number,
    requestedTokens: number,
  ): Promise<{
    allowed: boolean;
    remainingTokens: number;
    retryAfter: number;
  }>;
}
