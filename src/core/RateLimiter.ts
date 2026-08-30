import { RateLimitAlgorithm, RateLimitResult } from "./types";

export class RateLimiter {
  constructor(private readonly algorithm: RateLimitAlgorithm) {}

  async check(key: string): Promise<RateLimitResult> {
    return this.algorithm.consume(key);
  }
}
