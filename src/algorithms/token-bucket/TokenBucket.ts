import { RateLimitAlgorithm } from "../../core/RateLimitAlgorithm";

import { RateLimitResult } from "../../core/RateLimitResult";

import { TokenBucketStore } from "../../core/TokenBucketStore";

interface TokenBucketOptions {
  capacity: number;

  /**
   * Tokens generated per second.
   */
  refillRate: number;
}

export class TokenBucket implements RateLimitAlgorithm {
  constructor(
    private readonly store: TokenBucketStore,
    private readonly options: TokenBucketOptions,
  ) {}

  async consume(key: string): Promise<RateLimitResult> {
    const now = Date.now();

    const result = await this.store.consume(
      key,
      now,
      this.options.capacity,
      this.options.refillRate,
      1,
    );

    return {
      allowed: result.allowed,

      limit: this.options.capacity,

      remaining: Math.floor(result.remainingTokens),

      retryAfter: Math.ceil(result.retryAfter),

      resetAt: now + Math.ceil(result.retryAfter * 1000),
    };
  }
}
