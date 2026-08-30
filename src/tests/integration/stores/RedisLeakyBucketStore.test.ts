import { createClient, RedisClientType } from "redis";
import { RedisLeakyBucketStore } from "../../../stores/RedisLeakyBucketStore";
import { RedisOperationExecutor } from "../../../infrastructure/RedisOperationExecutor";

describe("RedisLeakyBucketStore", () => {
  let redisClient: RedisClientType;
  let store: RedisLeakyBucketStore;
  let executor: RedisOperationExecutor;

  const key = "test:leaky-bucket:user-123";

  const capacity = 3;
  const leakRate = 1;

  beforeAll(async () => {
    redisClient = createClient({
      url: "redis://localhost:6379",
    });

    await redisClient.connect();
    executor = new RedisOperationExecutor(1000);

    store = new RedisLeakyBucketStore(redisClient, executor);
  });

  beforeEach(async () => {
    await redisClient.del(key);
  });

  afterAll(async () => {
    await redisClient.del(key);
    await redisClient.quit();
  });

  it("should allow requests while capacity exists", async () => {
    const now = Date.now();

    for (let i = 0; i < capacity; i++) {
      const result = await store.consume(key, now, capacity, leakRate);

      expect(result.allowed).toBe(true);
    }
  });

  it("should reject when bucket is full", async () => {
    const now = Date.now();

    for (let i = 0; i < capacity; i++) {
      await store.consume(key, now, capacity, leakRate);
    }

    const result = await store.consume(key, now, capacity, leakRate);

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("should leak queued requests over time", async () => {
    const now = Date.now();

    for (let i = 0; i < capacity; i++) {
      await store.consume(key, now, capacity, leakRate);
    }

    const result = await store.consume(key, now + 1000, capacity, leakRate);

    expect(result.allowed).toBe(true);
  });

  it("should never exceed capacity", async () => {
    const now = Date.now();

    const result = await store.consume(key, now + 60_000, capacity, leakRate);

    expect(result.queueSize).toBeLessThanOrEqual(capacity);
  });
});
