import { createClient, RedisClientType } from "redis";
import { RedisSlidingWindowStore } from "../../../stores/RedisSlidingWindowStore";

describe("RedisSlidingWindowStore", () => {
  let redisClient: RedisClientType;
  let store: RedisSlidingWindowStore;

  const key = "test:rate-limit:user-123";

  beforeAll(async () => {
    redisClient = createClient({
      url: "redis://localhost:6379",
    });

    await redisClient.connect();

    store = new RedisSlidingWindowStore(redisClient);
  });

  beforeEach(async () => {
    await redisClient.del(key);
  });

  afterAll(async () => {
    await redisClient.del(key);
    await redisClient.quit();
  });

  it("should allow requests under the limit", async () => {
    const now = Date.now();

    const result = await store.consume(key, now, 60_000, 5);

    expect(result.allowed).toBe(true);

    expect(result.count).toBe(1);
  });

  it("should reject request when limit is reached", async () => {
    const now = Date.now();

    for (let i = 0; i < 5; i++) {
      await store.consume(key, now + i, 60_000, 5);
    }

    const result = await store.consume(key, now + 10, 60_000, 5);

    expect(result.allowed).toBe(false);

    expect(result.count).toBe(5);

    expect(result.oldestTimestamp).not.toBeNull();
  });

  it("should remove expired requests", async () => {
    const now = Date.now();

    await store.consume(key, now, 60_000, 5);

    const result = await store.consume(key, now + 60_001, 60_000, 5);

    expect(result.allowed).toBe(true);

    expect(result.count).toBe(1);
  });
});
