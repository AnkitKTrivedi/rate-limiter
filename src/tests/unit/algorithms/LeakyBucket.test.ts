import { LeakyBucket } from "../../../algorithms/leaky-bucket/LeakyBucket";
import { LeakyBucketStore } from "../../../core/LeakyBucketStore";

describe("LeakyBucket", () => {
  let store: jest.Mocked<LeakyBucketStore>;
  let algorithm: LeakyBucket;

  beforeEach(() => {
    store = {
      consume: jest.fn(),
    };

    algorithm = new LeakyBucket(store, {
      capacity: 5,
      leakRate: 2,
    });
  });

  it("should allow a request when capacity is available", async () => {
    store.consume.mockResolvedValue({
      allowed: true,
      queueSize: 1,
      retryAfter: 0,
    });

    const result = await algorithm.consume("user:123");

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(4);
  });

  it("should reject when bucket is full", async () => {
    store.consume.mockResolvedValue({
      allowed: false,
      queueSize: 5,
      retryAfter: 0.5,
    });

    const result = await algorithm.consume("user:123");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBe(1);
  });

  it("should delegate to store", async () => {
    store.consume.mockResolvedValue({
      allowed: true,
      queueSize: 1,
      retryAfter: 0,
    });

    const now = Date.now();

    await algorithm.consume("user:123");

    expect(store.consume).toHaveBeenCalledWith("user:123", now, 5, 2);
  });

  it("should propagate store errors", async () => {
    store.consume.mockRejectedValue(new Error("Redis unavailable"));

    await expect(algorithm.consume("user:123")).rejects.toThrow(
      "Redis unavailable",
    );
  });
});
