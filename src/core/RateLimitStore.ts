export interface RateLimitStore {
  increment(
    key: string,
    windowMs: number,
  ): Promise<{
    count: number;
    ttl: number;
  }>;
}
