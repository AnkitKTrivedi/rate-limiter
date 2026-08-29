import { Request, Response, NextFunction } from "express";
import { RateLimitEntry } from "../types/rateLimiter";

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;

  private readonly clients = new Map<string, RateLimitEntry>();

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const clientId = this.getClientId(req);

    const now = Date.now();

    let entry = this.clients.get(clientId);

    /**
     * First request from this client
     */
    if (!entry) {
      entry = {
        count: 1,
        windowStart: now,
      };

      this.clients.set(clientId, entry);

      this.setHeaders(res, entry);

      next();
      return;
    }

    /**
     * Current window expired
     */
    const windowExpired = now - entry.windowStart >= this.windowMs;

    if (windowExpired) {
      entry.count = 1;
      entry.windowStart = now;

      this.clients.set(clientId, entry);

      this.setHeaders(res, entry);

      next();
      return;
    }

    /**
     * Rate limit exceeded
     */
    if (entry.count >= this.maxRequests) {
      const retryAfter = Math.ceil(
        (this.windowMs - (now - entry.windowStart)) / 1000,
      );

      res.setHeader("Retry-After", retryAfter);

      res.status(429).json({
        success: false,
        message: "Too many requests",
        retryAfter,
      });

      return;
    }

    /**
     * Request allowed
     */
    entry.count++;

    this.clients.set(clientId, entry);

    this.setHeaders(res, entry);

    next();
  };

  private getClientId(req: Request): string {
    return req.ip || "unknown";
  }

  private setHeaders(res: Response, entry: RateLimitEntry): void {
    const remaining = Math.max(0, this.maxRequests - entry.count);

    const reset = Math.ceil((entry.windowStart + this.windowMs) / 1000);

    res.setHeader("X-RateLimit-Limit", this.maxRequests);

    res.setHeader("X-RateLimit-Remaining", remaining);

    res.setHeader("X-RateLimit-Reset", reset);
  }
}
