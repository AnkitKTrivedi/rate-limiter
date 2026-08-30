import { RateLimitAlgorithm } from "../../core/RateLimitAlgorithm";
import { RateLimitResult } from "../../core/RateLimitResult";
import { SlidingWindowStore } from "../../core/SlidingWindowStore";

interface SlidingWindowOption {
  limit: number;
  windowMs: number;
}
export class SlidingWindow implements RateLimitAlgorithm {
  constructor(
    private readonly store: SlidingWindowStore,
    private readonly options: SlidingWindowOption,
  ) {}

  async consume(key: string): Promise<RateLimitResult> {
    const now = Date.now();

    const result = await this.store.consume(
      key,
      now,
      this.options.windowMs,
      this.options.limit,
    );

    const remaining = Math.max(0, this.options.limit - result.count);

    let retryAfter = 0;

    if (!result.allowed && result.oldestTimestamp !== null) {
      retryAfter = Math.max(
        0,
        Math.ceil(
          (result.oldestTimestamp + this.options.windowMs - now) / 1000,
        ),
      );
    }

    return {
      allowed: result.allowed,
      limit: this.options.limit,
      remaining,
      retryAfter,
      resetAt: now + this.options.windowMs,
    };
  }
}
