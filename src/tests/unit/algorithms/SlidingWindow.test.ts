import { SlidingWindow } from "../../../algorithms/sliding-window/SlidingWindow";
import { SlidingWindowStore } from "../../../core/SlidingWindowStore";

describe("SlidingWindow", () => {
  const limit = 5;
  const windowMs = 60_000;

  let store: jest.Mocked<SlidingWindowStore>;
  let algorithm: SlidingWindow;

  beforeEach(() => {
    store = {
      consume: jest.fn(),
    };

    algorithm = new SlidingWindow(store, {
      limit,
      windowMs,
    });
  });

  it("should allow request when under limit", async () => {
    store.consume.mockResolvedValue({
      allowed: true,
      count: 3,
      oldestTimestamp: null,
    });

    const result = await algorithm.consume("user:123");

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(2);
  });

  it("should allow request when count reaches limit", async () => {
    store.consume.mockResolvedValue({
      allowed: true,
      count: 5,
      oldestTimestamp: null,
    });

    const result = await algorithm.consume("user:123");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("should reject request when limit is exceeded", async () => {
    const now = Date.now();

    store.consume.mockResolvedValue({
      allowed: false,
      count: 5,
      oldestTimestamp: now - 10_000,
    });

    const result = await algorithm.consume("user:123");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);

    expect(result.retryAfter).toBeGreaterThanOrEqual(49);
  });

  it("should call store with correct parameters", async () => {
    store.consume.mockResolvedValue({
      allowed: true,
      count: 1,
      oldestTimestamp: null,
    });

    await algorithm.consume("user:123");

    expect(store.consume).toHaveBeenCalledWith(
      "user:123",
      expect.any(Number),
      windowMs,
      limit,
    );
  });

  it("should propagate store errors", async () => {
    store.consume.mockRejectedValue(new Error("Redis unavailable"));

    await expect(algorithm.consume("user:123")).rejects.toThrow(
      "Redis unavailable",
    );
  });
});
