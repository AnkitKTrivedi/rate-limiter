import { FixedWindow } from "../algorithms/FixedWindow";
import { RateLimiter } from "../core/RateLimiter";
import { RedisStore } from "../stores/RedisStores";
import { redisClient } from "./redis";

const store = new RedisStore(redisClient);

const algorithm = new FixedWindow(store, {
  limit: 5,
  windowMs: 60 * 1000,
});

export const rateLimiter = new RateLimiter(algorithm);
