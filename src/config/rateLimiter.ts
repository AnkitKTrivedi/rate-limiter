import { FixedWindow } from "../algorithms/fixed-window/FixedWindow";
import { SlidingWindow } from "../algorithms/sliding-window/SlidingWindow";
import { RateLimiter } from "../core/RateLimiter";
import { RedisOperationExecutor } from "../infrastructure/RedisOperationExecutor";
import { RedisSlidingWindowStore } from "../stores/RedisSlidingWindowStore";
import { RedisStore } from "../stores/RedisStores";
import { redisClient } from "./redis";

// const store = new RedisStore(redisClient);

// const algorithm = new FixedWindow(store, {
//   limit: 5,
//   windowMs: 60 * 1000,
// });

const executor = new RedisOperationExecutor();

const store = new RedisSlidingWindowStore(redisClient, executor);

const algorithm = new SlidingWindow(store, {
  limit: 5,
  windowMs: 60 * 1000,
});

export const rateLimiter = new RateLimiter(algorithm);
