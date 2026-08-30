import { RedisClientType } from "redis";

import { LeakyBucketStore } from "../core/LeakyBucketStore";

const LEAKY_BUCKET_SCRIPT = `
local key = KEYS[1]

local now = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local leakRate = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local queueSize =
    redis.call("HGET", key, "queueSize")

local lastLeakTime =
    redis.call("HGET", key, "lastLeakTime")

if not queueSize then
    queueSize = 0
    lastLeakTime = now
else
    queueSize = tonumber(queueSize)
    lastLeakTime = tonumber(lastLeakTime)
end

local elapsed =
    (now - lastLeakTime) / 1000

local leaked =
    elapsed * leakRate

queueSize =
    math.max(0, queueSize - leaked)

lastLeakTime = now

if queueSize < capacity then

    queueSize = queueSize + 1

    redis.call(
        "HSET",
        key,
        "queueSize",
        queueSize,
        "lastLeakTime",
        lastLeakTime
    )

    redis.call(
        "PEXPIRE",
        key,
        ttl
    )

    return {
        1,
        queueSize,
        0
    }
end

local retryAfter =
    (queueSize - capacity + 1) / leakRate

redis.call(
    "HSET",
    key,
    "queueSize",
    queueSize,
    "lastLeakTime",
    lastLeakTime
)

redis.call(
    "PEXPIRE",
    key,
    ttl
)

return {
    0,
    queueSize,
    retryAfter
}
`;

export class RedisLeakyBucketStore implements LeakyBucketStore {
  constructor(private readonly redisClient: RedisClientType) {}

  async consume(key: string, now: number, capacity: number, leakRate: number) {
    const ttl = Math.ceil((capacity / leakRate) * 1000);

    const result = await this.redisClient.eval(LEAKY_BUCKET_SCRIPT, {
      keys: [key],
      arguments: [
        now.toString(),
        capacity.toString(),
        leakRate.toString(),
        ttl.toString(),
      ],
    });

    if (!Array.isArray(result) || result.length !== 3) {
      throw new Error("Invalid Redis leaky bucket response");
    }

    return {
      allowed: Number(result[0]) === 1,

      queueSize: Number(result[1]),

      retryAfter: Number(result[2]),
    };
  }
}
