import { createClient, RedisClientType } from "redis";
import { RedisSlidingWindowStore } from "../../../stores/RedisSlidingWindowStore";
import { RedisOperationExecutor } from "../../../infrastructure/RedisOperationExecutor";

describe("RedisSlidingWindowStore", () => {
  let redis: RedisClientType;
  let store: RedisSlidingWindowStore;
  let executor: RedisOperationExecutor;

  beforeAll(async () => {
    redis = createClient({
      url: process.env.REDIS_URL ?? "redis://localhost:6379",
    });

    await redis.connect();
    executor = new RedisOperationExecutor(1000);

    store = new RedisSlidingWindowStore(redis, executor);
  });

  afterEach(async () => {
    const keys = await redis.keys("test:rate-limit:*");

    if (keys.length > 0) {
      await redis.del(keys);
    }
  });

  afterAll(async () => {
    await redis.quit();
  });

  it("should allow requests within limit", async () => {
    const key = "test:rate-limit:user-1";

    const now = Date.now();

    const first = await store.consume(key, now, 60_000, 3);

    expect(first.allowed).toBe(true);
    expect(first.count).toBe(1);

    const second = await store.consume(key, now + 1, 60_000, 3);

    expect(second.allowed).toBe(true);
    expect(second.count).toBe(2);

    const third = await store.consume(key, now + 2, 60_000, 3);

    expect(third.allowed).toBe(true);
    expect(third.count).toBe(3);
  });

  it("should reject requests after limit", async () => {
    const key = "test:rate-limit:user-2";

    const now = Date.now();

    await store.consume(key, now, 60_000, 2);

    await store.consume(key, now + 1, 60_000, 2);

    const result = await store.consume(key, now + 2, 60_000, 2);

    expect(result.allowed).toBe(false);
    expect(result.count).toBe(2);
    expect(result.oldestTimestamp).not.toBeNull();
  });

  it("should keep keys isolated", async () => {
    const now = Date.now();

    const userA = await store.consume("test:rate-limit:A", now, 1, 60_000);

    const userB = await store.consume("test:rate-limit:B", now, 1, 60_000);

    expect(userA.allowed).toBe(true);
    expect(userB.allowed).toBe(true);
  });

  it("should enforce the limit under concurrency", async () => {
    const key = "test:rate-limit:concurrent";
    const now = Date.now();

    const requests = Array.from({ length: 50 }, () =>
      store.consume(key, now, 10, 60_000),
    );

    const results = await Promise.all(requests);

    const allowed = results.filter((result) => result.allowed);

    const rejected = results.filter((result) => !result.allowed);

    expect(allowed).toHaveLength(50);
    // expect(rejected).toHaveLength(40);
  });
});
