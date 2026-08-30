import { RateLimitAlgorithm } from "../../core/RateLimitAlgorithm";
import { RateLimitResult } from "../../core/RateLimitResult";
import { RateLimitStore } from "../../core/RateLimitStore";

interface FixedWindowsOptions {
  limit: number;
  windowMs: number;
}

export class FixedWindow implements RateLimitAlgorithm {
  constructor(
    private readonly store: RateLimitStore,
    private readonly options: FixedWindowsOptions,
  ) {}

  async consume(key: string): Promise<RateLimitResult> {
    const result = await this.store.increment(key, this.options.windowMs);

    const allowed = result.count <= this.options.limit;

    const remaining = Math.max(0, this.options.limit - result.count);

    const retryAfter = Math.max(0, Math.ceil(result.ttl / 1000));

    const resetAt = Date.now() + result.ttl;

    return {
      allowed,
      limit: this.options.limit,
      remaining,
      retryAfter,
      resetAt,
    };
  }
}
