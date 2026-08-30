import { RedisClientType } from "redis";
import { RateLimitStore } from "../core/types";

export class RedisStore implements RateLimitStore {
  constructor(private readonly redisClient: RedisClientType) {}

  async increment(
    key: string,
    windowMs: number,
  ): Promise<{ count: number; ttl: number }> {
    const count = await this.redisClient.incr(key);

    if (count === 1) {
      await this.redisClient.pExpire(key, windowMs);
    }

    const ttl = await this.redisClient.pTTL(key);

    return {
      count,
      ttl,
    };
  }
}
