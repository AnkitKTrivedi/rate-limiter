export interface RateLimitState {
  count: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
  resetAt: number;
}

export interface RateLimitStore {
  increment(
    key: string,
    windowMs: number,
  ): Promise<{
    count: number;
    ttl: number;
  }>;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
  resetAt: number;
}

export interface RateLimitAlgorithm {
  consume(key: string): Promise<RateLimitResult>;
}
