import { Response } from "express";
import { RateLimitResult } from "../core/RateLimitResult";

export function setRateLimitHeaders(
  res: Response,
  result: RateLimitResult,
): void {
  const resetAfterSeconds = Math.max(
    0,
    Math.ceil((result.resetAt - Date.now()) / 1000),
  );

  res.setHeader("RateLimit-Limit", result.limit);

  res.setHeader("RateLimit-Remaining", Math.max(0, result.remaining));

  res.setHeader("RateLimit-Reset", resetAfterSeconds);

  if (!result.allowed) {
    res.setHeader("Retry-After", Math.max(0, result.retryAfter));
  }
}
