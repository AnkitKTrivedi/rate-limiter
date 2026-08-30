import { setRateLimitHeaders } from "../../../src/http/RateLimitHeaders";

describe("RateLimitHeaders", () => {
  const createResponse = () => {
    const headers = new Map<string, unknown>();

    return {
      setHeader: jest.fn((name: string, value: unknown) => {
        headers.set(name, value);
      }),
      headers,
    };
  };

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(1_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should set rate limit headers", () => {
    const res = createResponse();

    setRateLimitHeaders(res as any, {
      allowed: true,
      limit: 100,
      remaining: 75,
      retryAfter: 0,
      resetAt: 1_060_000,
    });

    expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", 100);

    expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Remaining", 75);

    expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Reset", 60);
  });

  it("should set Retry-After when request is rejected", () => {
    const res = createResponse();

    setRateLimitHeaders(res as any, {
      allowed: false,
      limit: 100,
      remaining: 0,
      retryAfter: 10,
      resetAt: 1_010_000,
    });

    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", 10);
  });

  it("should not set Retry-After when request is allowed", () => {
    const res = createResponse();

    setRateLimitHeaders(res as any, {
      allowed: true,
      limit: 100,
      remaining: 50,
      retryAfter: 0,
      resetAt: 1_060_000,
    });

    expect(res.setHeader).not.toHaveBeenCalledWith(
      "Retry-After",
      expect.anything(),
    );
  });

  it("should never return negative reset value", () => {
    const res = createResponse();

    setRateLimitHeaders(res as any, {
      allowed: true,
      limit: 100,
      remaining: 0,
      retryAfter: 0,
      resetAt: 999_000,
    });

    expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Reset", 0);
  });

  it("should never return negative remaining", () => {
    const res = createResponse();

    setRateLimitHeaders(res as any, {
      allowed: true,
      limit: 100,
      remaining: -5,
      retryAfter: 0,
      resetAt: 1_060_000,
    });

    expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Remaining", 0);
  });
});
