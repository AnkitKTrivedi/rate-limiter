import { RateLimitAlgorithm } from "./RateLimitAlgorithm";
import { RateLimitResult } from "./RateLimitResult";

export class RateLimiter {
  constructor(private readonly algorithm: RateLimitAlgorithm) {}

  async check(key: string): Promise<RateLimitResult> {
    return this.algorithm.consume(key);
  }
}
