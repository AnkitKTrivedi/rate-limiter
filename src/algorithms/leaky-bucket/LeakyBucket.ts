import { RateLimitAlgorithm } from "../../core/RateLimitAlgorithm";

import { RateLimitResult } from "../../core/RateLimitResult";

import { LeakyBucketStore } from "../../core/LeakyBucketStore";

interface LeakyBucketOptions {
  capacity: number;
  leakRate: number;
}

export class LeakyBucket implements RateLimitAlgorithm {
  constructor(
    private readonly store: LeakyBucketStore,
    private readonly options: LeakyBucketOptions,
  ) {}

  async consume(key: string): Promise<RateLimitResult> {
    const now = Date.now();

    const result = await this.store.consume(
      key,
      now,
      this.options.capacity,
      this.options.leakRate,
    );

    return {
      allowed: result.allowed,

      limit: this.options.capacity,

      remaining: Math.max(
        0,
        this.options.capacity - Math.ceil(result.queueSize),
      ),

      retryAfter: Math.ceil(result.retryAfter),

      resetAt: now + Math.ceil(result.retryAfter * 1000),
    };
  }
}
