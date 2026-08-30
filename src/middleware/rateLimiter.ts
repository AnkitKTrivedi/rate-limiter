import { Request, Response, NextFunction } from "express";

import { RateLimitService } from "../core/RateLimitService";

import { setRateLimitHeaders } from "../http/RateLimitHeaders";

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

      // No applicable policy.
      if (!result) {
        return next();
      }

      setRateLimitHeaders(res, result);

      if (!result.allowed) {
        return res.status(429).json({
          error: "Too Many Requests",
          message: "Rate limit exceeded",
          retryAfter: result.retryAfter,
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
