import { Request, Response, NextFunction } from "express";

import { RateLimitService } from "../core/RateLimitService";

export interface RateLimiterMiddlewareOptions {
  service: RateLimitService;
}

export function rateLimiterMiddleware(options: RateLimiterMiddlewareOptions) {
  const { service } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = {
        route: req.route?.path ?? req.path,

        method: req.method,

        ip: req.ip,

        userId: (
          req as Request & {
            user?: {
              id?: string;
            };
          }
        ).user?.id,

        apiKey: req.headers["x-api-key"] as string | undefined,
      };

      const result = await service.check(context);

      // No policy = no rate limiting
      if (!result) {
        return next();
      }

      res.setHeader("RateLimit-Limit", result.limit);

      res.setHeader("RateLimit-Remaining", result.remaining);

      res.setHeader(
        "RateLimit-Reset",
        Math.ceil((result.resetAt - Date.now()) / 1000),
      );

      if (!result.allowed) {
        res.setHeader("Retry-After", result.retryAfter);

        return res.status(429).json({
          error: "Too Many Requests",

          message: "Rate limit exceeded",

          retryAfter: result.retryAfter,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
