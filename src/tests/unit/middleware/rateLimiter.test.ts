import { Request, Response, NextFunction } from "express";
import { RateLimiter } from "../../../core/RateLimiter";
import { rateLimiterMiddleware } from "../../../middleware/rateLimiter";

describe("rateLimiterMiddleware", () => {
  let rateLimiter: jest.Mocked<RateLimiter>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    rateLimiter = {
      check: jest.fn(),
    } as unknown as jest.Mocked<RateLimiter>;

    req = {
      ip: "127.0.0.1",
    };

    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  it("should call next when request is allowed", async () => {
    rateLimiter.check.mockResolvedValue({
      allowed: true,
      limit: 5,
      remaining: 4,
      retryAfter: 0,
      resetAt: Date.now() + 60_000,
    });

    const middleware = rateLimiterMiddleware(
      rateLimiter,
      (req) => `ip:${req.ip}`,
    );

    await middleware(req as Request, res as Response, next);

    expect(rateLimiter.check).toHaveBeenCalledWith("ip:127.0.0.1");

    expect(next).toHaveBeenCalled();

    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 429 when request is rejected", async () => {
    rateLimiter.check.mockResolvedValue({
      allowed: false,
      limit: 5,
      remaining: 0,
      retryAfter: 10,
      resetAt: Date.now() + 10_000,
    });

    const middleware = rateLimiterMiddleware(
      rateLimiter,
      (req) => `ip:${req.ip}`,
    );

    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(429);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Too many requests",
      retryAfter: 10,
    });

    expect(next).not.toHaveBeenCalled();
  });
});
