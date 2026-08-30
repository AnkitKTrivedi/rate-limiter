import { FixedWindow } from "../../../algorithms/fixed-window/FixedWindow";
import { RateLimitStore } from "../../../core/RateLimitStore";

describe("FixedWindow", () => {
  const limit = 5;
  const windowMs = 60_000;

  let store: jest.Mocked<RateLimitStore>;
  let algorithm: FixedWindow;

  beforeEach(() => {
    store = {
      increment: jest.fn(),
    };

    algorithm = new FixedWindow(store, {
      limit,
      windowMs,
    });
  });

  it("should allow request when count is below limit", async () => {
    store.increment.mockResolvedValue({
      count: 3,
      ttl: 50_000,
    });

    const result = await algorithm.consume("user:123");

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(2);
    expect(result.retryAfter).toBe(50);

    expect(store.increment).toHaveBeenCalledWith("user:123", windowMs);
  });

  it("should allow the request when count equals limit", async () => {
    store.increment.mockResolvedValue({
      count: 5,
      ttl: 30_000,
    });

    const result = await algorithm.consume("user:123");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("should reject request when count exceeds limit", async () => {
    store.increment.mockResolvedValue({
      count: 6,
      ttl: 20_000,
    });

    const result = await algorithm.consume("user:123");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBe(20);
  });

  it("should never return negative remaining requests", async () => {
    store.increment.mockResolvedValue({
      count: 100,
      ttl: 10_000,
    });

    const result = await algorithm.consume("user:123");

    expect(result.remaining).toBe(0);
  });

  it("should propagate store errors", async () => {
    store.increment.mockRejectedValue(new Error("Redis unavailable"));

    await expect(algorithm.consume("user:123")).rejects.toThrow(
      "Redis unavailable",
    );
  });
});
