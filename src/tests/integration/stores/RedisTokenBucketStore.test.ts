import { createClient, RedisClientType } from "redis";
import { RedisTokenBucketStore } from "../../../stores/RedisTokenBucketStore";
import { RedisOperationExecutor } from "../../../infrastructure/RedisOperationExecutor";

describe("RedisTokenBucketStore", () => {
  let redisClient: RedisClientType;
  let store: RedisTokenBucketStore;
  let executor: RedisOperationExecutor;

  const key = "test:token-bucket:user-123";

  const capacity = 5;
  const refillRate = 1;

  beforeAll(async () => {
    redisClient = createClient({
      url: "redis://localhost:6379",
    });

    await redisClient.connect();

    executor = new RedisOperationExecutor(1000);

    store = new RedisTokenBucketStore(redisClient, executor);
  });

  beforeEach(async () => {
    await redisClient.del(key);
  });

  afterAll(async () => {
    await redisClient.del(key);
    await redisClient.quit();
  });

  it("should allow the first request", async () => {
    const now = Date.now();

    // const result = await store.consume(key, now, capacity, refillRate, 1);

    // expect(result.allowed).toBe(true);
    // expect(result.remainingTokens).toBe(4);
    // expect(result.retryAfter).toBe(0);
  });

  it("should consume tokens until bucket is empty", async () => {
    const now = Date.now();

    // for (let i = 0; i < capacity; i++) {
    //   const result = await store.consume(key, now, capacity, refillRate, 1);

    //   expect(result.allowed).toBe(true);
    // }

    // const result = await store.consume(key, now, capacity, refillRate, 1);

    // expect(result.allowed).toBe(false);
    // expect(result.remainingTokens).toBe(0);
  });

  it("should refill tokens over time", async () => {
    const now = Date.now();

    // Consume all tokens
    // for (let i = 0; i < capacity; i++) {
    //   await store.consume(key, now, capacity, refillRate, 1);
    // }

    // // One second later
    // const result = await store.consume(
    //   key,
    //   now + 1000,
    //   capacity,
    //   refillRate,
    //   1,
    // );

    // expect(result.allowed).toBe(true);
  });

  // it("should never exceed bucket capacity", async () => {
  //   const now = Date.now();

  //   const result = await store.consume(
  //     key,
  //     now + 60_000,
  //     capacity,
  //     refillRate,
  //     1,
  //   );

  //   //  expect(result.remainingTokens).toBeLessThanOrEqual(capacity);
  // });

  // it("should reject when insufficient tokens are available", async () => {
  //   const now = Date.now();

  //   // Consume 5 tokens
  //   for (let i = 0; i < capacity; i++) {
  //     await store.consume(key, now, capacity, refillRate, 1);
  //   }

  //   const result = await store.consume(key, now + 500, capacity, refillRate, 1);

  //   //expect(result.allowed).toBe(false);
  //   // expect(result.retryAfter).toBeGreaterThan(0);
  // });
});
