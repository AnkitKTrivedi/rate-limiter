import { RedisClientType } from "redis";

import { SlidingWindowStore } from "../core/SlidingWindowStore";

const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]

local now = tonumber(ARGV[1])
local windowStart = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local windowMs = tonumber(ARGV[4])
local requestId = ARGV[5]

redis.call(
    "ZREMRANGEBYSCORE",
    key,
    0,
    windowStart
)

local count =
    redis.call("ZCARD", key)

if count >= limit then

    local oldest =
        redis.call(
            "ZRANGE",
            key,
            0,
            0,
            "WITHSCORES"
        )

    local oldestTimestamp = 0

    if #oldest > 0 then
        oldestTimestamp =
            tonumber(oldest[2])
    end

    return {
        0,
        count,
        oldestTimestamp
    }
end

redis.call(
    "ZADD",
    key,
    now,
    requestId
)

redis.call(
    "PEXPIRE",
    key,
    windowMs
)

return {
    1,
    count + 1,
    0
}
`;

export class RedisSlidingWindowStore implements SlidingWindowStore {
  constructor(private readonly redisClient: RedisClientType) {}

  async consume(key: string, now: number, windowMs: number, limit: number) {
    const requestId = `${now}:${crypto.randomUUID()}`;

    const result = await this.redisClient.eval(SLIDING_WINDOW_SCRIPT, {
      keys: [key],
      arguments: [
        now.toString(),
        (now - windowMs).toString(),
        limit.toString(),
        windowMs.toString(),
        requestId,
      ],
    });

    if (!Array.isArray(result) || result.length !== 3) {
      throw new Error("Invalid Redis sliding window response");
    }

    return {
      allowed: Number(result[0]) === 1,
      count: Number(result[1]),
      oldestTimestamp: Number(result[2]) || null,
    };
  }
}
