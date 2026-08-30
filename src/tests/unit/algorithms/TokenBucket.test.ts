import { TokenBucket } from "../../../algorithms/token-bucket/TokenBucket";
import { TokenBucketStore } from "../../../core/TokenBucketStore";

describe("TokenBucket", () => {
  const capacity = 10;
  const refillRate = 2;

  let store: jest.Mocked<TokenBucketStore>;
  let algorithm: TokenBucket;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    store = {
      consume: jest.fn(),
    };

    algorithm = new TokenBucket(store, {
      capacity,
      refillRate,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should allow a request when tokens are available", async () => {
    store.consume.mockResolvedValue({
      allowed: true,
      remainingTokens: 9,
      retryAfter: 0,
    });

    const result = await algorithm.consume("user:123");

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(result.retryAfter).toBe(0);
  });

  it("should reject request when no token is available", async () => {
    store.consume.mockResolvedValue({
      allowed: false,
      remainingTokens: 0,
      retryAfter: 0.5,
    });

    const result = await algorithm.consume("user:123");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBe(1);
  });

  it("should call store with correct parameters", async () => {
    store.consume.mockResolvedValue({
      allowed: true,
      remainingTokens: 9,
      retryAfter: 0,
    });

    const now = Date.now();

    await algorithm.consume("user:123");

    expect(store.consume).toHaveBeenCalledWith(
      "user:123",
      now,
      capacity,
      refillRate,
      1,
    );
  });

  it("should floor fractional remaining tokens", async () => {
    store.consume.mockResolvedValue({
      allowed: true,
      remainingTokens: 8.75,
      retryAfter: 0,
    });

    const result = await algorithm.consume("user:123");

    expect(result.remaining).toBe(8);
  });

  it("should ceil retryAfter", async () => {
    store.consume.mockResolvedValue({
      allowed: false,
      remainingTokens: 0.2,
      retryAfter: 1.2,
    });

    const result = await algorithm.consume("user:123");

    expect(result.retryAfter).toBe(2);
  });

  it("should propagate store errors", async () => {
    store.consume.mockRejectedValue(new Error("Redis unavailable"));

    await expect(algorithm.consume("user:123")).rejects.toThrow(
      "Redis unavailable",
    );
  });
});
