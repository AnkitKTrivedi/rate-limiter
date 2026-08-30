import { Request, Response, NextFunction } from "express";
import { rateLimiterMiddleware } from "../../../middleware/rateLimiter";

describe("rateLimiterMiddleware", () => {
  const createMockResponse = () => {
    const res = {
      setHeader: jest.fn(),
      status: jest.fn(),
      json: jest.fn(),
    };

    res.status.mockReturnValue(res);

    return res as unknown as Response;
  };

  it("should allow request", async () => {
    const service = {
      check: jest.fn().mockResolvedValue({
        allowed: true,
        limit: 100,
        remaining: 99,
        resetAt: Date.now() + 60000,
        retryAfter: 0,
      }),
    };

    const middleware = rateLimiterMiddleware({
      service: service as any,
    });

    const req = {
      method: "GET",
      path: "/api/users",
      ip: "127.0.0.1",
      headers: {},
    } as Request;

    const res = createMockResponse();

    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();

    expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", 100);

    expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Remaining", 99);
  });

  it("should return 429 when request is rejected", async () => {
    const service = {
      check: jest.fn().mockResolvedValue({
        allowed: false,
        limit: 5,
        remaining: 0,
        resetAt: Date.now() + 10000,
        retryAfter: 10,
      }),
    };

    const middleware = rateLimiterMiddleware({
      service: service as any,
    });

    const req = {
      method: "GET",
      path: "/api/users",
      ip: "127.0.0.1",
      headers: {},
    } as Request;

    const res = createMockResponse();

    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);

    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", 10);

    expect(res.json).toHaveBeenCalledWith({
      error: "Too Many Requests",
      message: "Rate limit exceeded",
      retryAfter: 10,
    });

    expect(next).not.toHaveBeenCalled();
  });
});
