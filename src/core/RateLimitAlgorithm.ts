import { RateLimitResult } from "./RateLimitResult";

export interface RateLimitAlgorithm {
  consume(key: string): Promise<RateLimitResult>;
}
