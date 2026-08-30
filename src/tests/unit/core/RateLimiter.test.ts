import { RateLimitAlgorithm } from "../../../core/RateLimitAlgorithm";
import { RateLimiter } from "../../../core/RateLimiter";

describe("RateLimiter", () => {
  it("should delegate request to algorithm", async () => {
    const algorithm: jest.Mocked<RateLimitAlgorithm> = {
      consume: jest.fn(),
    };

    algorithm.consume.mockResolvedValue({
      allowed: true,
      limit: 5,
      remaining: 4,
      retryAfter: 0,
      resetAt: Date.now() + 60_000,
    });

    const rateLimiter = new RateLimiter(algorithm);

    const result = await rateLimiter.check("user:123");

    expect(algorithm.consume).toHaveBeenCalledWith("user:123");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});
