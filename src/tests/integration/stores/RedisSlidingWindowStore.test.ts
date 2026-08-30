import { createClient, RedisClientType } from "redis";
import { RedisSlidingWindowStore } from "../../../stores/RedisSlidingWindowStore";

describe("RedisSlidingWindowStore", () => {
  let redis: RedisClientType;
  let store: RedisSlidingWindowStore;

  beforeAll(async () => {
    redis = createClient({
      url: process.env.REDIS_URL ?? "redis://localhost:6379",
    });

    await redis.connect();

    store = new RedisSlidingWindowStore(redis);
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

    const first = await store.consume(key, 3, 60_000);

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = await store.consume(key, 3, 60_000);

    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);

    const third = await store.consume(key, 3, 60_000);

    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("should reject requests after limit", async () => {
    const key = "test:rate-limit:user-2";

    await store.consume(key, 2, 60_000);

    await store.consume(key, 2, 60_000);

    const result = await store.consume(key, 2, 60_000);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThanOrEqual(1);
  });

  it("should keep keys isolated", async () => {
    const userA = await store.consume("test:rate-limit:A", 1, 60_000);

    const userB = await store.consume("test:rate-limit:B", 1, 60_000);

    expect(userA.allowed).toBe(true);
    expect(userB.allowed).toBe(true);
  });

  it("should enforce the limit under concurrency", async () => {
    const key = "test:rate-limit:concurrent";

    const requests = Array.from({ length: 50 }, () =>
      store.consume(key, 10, 60_000),
    );

    const results = await Promise.all(requests);

    const allowed = results.filter((result) => result.allowed);

    const rejected = results.filter((result) => !result.allowed);

    expect(allowed).toHaveLength(10);
    expect(rejected).toHaveLength(40);
  });
});
