import { BasePolicy } from "./RateLimitAlgorithm";

export type RateLimitPolicy =
  | FixedWindowPolicy
  | SlidingWindowPolicy
  | TokenBucketPolicy
  | LeakyBucketPolicy;

export interface FixedWindowPolicy extends BasePolicy {
  algorithm: "fixed-window";
  limit: number;
  windowMs: number;
}

export interface SlidingWindowPolicy extends BasePolicy {
  algorithm: "sliding-window";
  limit: number;
  windowMs: number;
}

export interface TokenBucketPolicy extends BasePolicy {
  algorithm: "token-bucket";
  capacity: number;
  refillRate: number;
}

export interface LeakyBucketPolicy extends BasePolicy {
  algorithm: "leaky-bucket";
  capacity: number;
  leakRate: number;
}
