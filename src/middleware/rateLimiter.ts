import { Request, Response, NextFunction } from "express";

import { RateLimiter } from "../core/RateLimiter";
import { KeyGenerator } from "../core/keyGenerator";

export const rateLimiterMiddleware = (
  rateLimiter: RateLimiter,
  keyGenerator: KeyGenerator,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const key = keyGenerator(req);

    const result = await rateLimiter.check(key);

    res.setHeader("RateLimit-Limit", result.limit);

    res.setHeader("RateLimit-Remaining", result.remaining);

    res.setHeader("RateLimit-Reset", result.resetAt);

    if (!result.allowed) {
      res.setHeader("Retry-After", result.retryAfter);

      res.status(429).json({
        success: false,
        message: "Too many requests",
        retryAfter: result.retryAfter,
      });

      return;
    }

    next();
  };
};
