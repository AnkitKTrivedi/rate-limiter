import { RedisClientType } from "redis";

import { TokenBucketStore } from "../core/TokenBucketStore";

const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]

local now = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local refillRate = tonumber(ARGV[3])
local requestedTokens = tonumber(ARGV[4])
local ttl = tonumber(ARGV[5])

local tokens =
    redis.call("HGET", key, "tokens")

local lastRefillTime =
    redis.call("HGET", key, "lastRefillTime")

if not tokens then
    tokens = capacity
    lastRefillTime = now
else
    tokens = tonumber(tokens)
    lastRefillTime = tonumber(lastRefillTime)
end

local elapsed =
    (now - lastRefillTime) / 1000

local newTokens =
    elapsed * refillRate

tokens =
    math.min(
        capacity,
        tokens + newTokens
    )

lastRefillTime = now

if tokens >= requestedTokens then

    tokens =
        tokens - requestedTokens

    redis.call(
        "HSET",
        key,
        "tokens",
        tokens,
        "lastRefillTime",
        lastRefillTime
    )

    redis.call(
        "PEXPIRE",
        key,
        ttl
    )

    return {
        1,
        tokens,
        0
    }

end

local missingTokens =
    requestedTokens - tokens

local retryAfter =
    missingTokens / refillRate

redis.call(
    "HSET",
    key,
    "tokens",
    tokens,
    "lastRefillTime",
    lastRefillTime
)

redis.call(
    "PEXPIRE",
    key,
    ttl
)

return {
    0,
    tokens,
    retryAfter
}
`;

export class RedisTokenBucketStore implements TokenBucketStore {
  constructor(private readonly redisClient: RedisClientType) {}

  async consume(
    key: string,
    now: number,
    capacity: number,
    refillRate: number,
    requestedTokens: number,
  ) {
    const ttl = Math.ceil((capacity / refillRate) * 1000);

    const result = await this.redisClient.eval(TOKEN_BUCKET_SCRIPT, {
      keys: [key],
      arguments: [
        now.toString(),
        capacity.toString(),
        refillRate.toString(),
        requestedTokens.toString(),
        ttl.toString(),
      ],
    });

    if (!Array.isArray(result) || result.length !== 3) {
      throw new Error("Invalid Redis token bucket response");
    }

    return {
      allowed: Number(result[0]) === 1,

      remainingTokens: Number(result[1]),

      retryAfter: Number(result[2]),
    };
  }
}
