import { RedisClientType } from "redis";
import { RateLimitStore } from "../core/RateLimitStore";

const FIXED_WINDOW_SCRIPT = `
local current = redis.call("INCR", KEYS[1])

if current == 1 then
    redis.call("PEXPIRE", KEYS[1], ARGV[1])
end

local ttl = redis.call("PTTL", KEYS[1])

return {
    current,
    ttl
}
`;

export class RedisStore implements RateLimitStore {
  constructor(private readonly redisClient: RedisClientType) {}

  async increment(
    key: string,
    windowMs: number,
  ): Promise<{ count: number; ttl: number }> {
    const result = await this.redisClient.eval(FIXED_WINDOW_SCRIPT, {
      keys: [key],
      arguments: [windowMs.toString()],
    });

    if (!Array.isArray(result) || result.length !== 2) {
      throw new Error("Invalid Redis rate limiter response");
    }

    const [count, ttl] = result;

    return {
      count: Number(count),
      ttl: Number(ttl),
    };
  }
}
