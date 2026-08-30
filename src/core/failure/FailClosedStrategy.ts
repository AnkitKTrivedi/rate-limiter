import { RateLimitContext } from "../PolicyResolver";
import { RateLimitResult } from "../RateLimitResult";
import { RateLimitFailureStrategy } from "../RateLimitFailureStrategy";

export class FailClosedStrategy implements RateLimitFailureStrategy {
  handle(_error: unknown, _context: RateLimitContext): RateLimitResult {
    return {
      allowed: false,
      limit: 0,
      remaining: 0,
      resetAt: 0,
      retryAfter: 1,
    };
  }
}
