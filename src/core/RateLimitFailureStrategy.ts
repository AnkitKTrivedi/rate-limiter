import { RateLimitContext } from "./PolicyResolver";
import { RateLimitResult } from "./RateLimitResult";

export interface RateLimitFailureStrategy {
  handle(error: unknown, context: RateLimitContext): RateLimitResult;
}
