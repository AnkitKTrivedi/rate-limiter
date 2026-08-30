import { RedisClientType } from "redis";

import { RedisOperationExecutor } from "../infrastructure/RedisOperationExecutor";
import { SlidingWindowStore } from "../core/SlidingWindowStore";
import { slidingWindowScript } from "./scripts/slidingWindowScript";

export class RedisSlidingWindowStore implements SlidingWindowStore {
  constructor(
    private readonly redis: RedisClientType,
    private readonly executor: RedisOperationExecutor,
  ) {}

  async consume(
    key: string,
    now: number,
    windowMs: number,
    limit: number,
  ): Promise<{
    allowed: boolean;
    count: number;
    oldestTimestamp: number | null;
  }> {
    const requestId = `${now}-${Math.random().toString(36).slice(2)}`;

    const expirySeconds = Math.ceil(windowMs / 1000) + 1;

    const result = await this.executor.execute(() =>
      this.redis.eval(slidingWindowScript, {
        keys: [key],
        arguments: [
          now.toString(),
          windowMs.toString(),
          limit.toString(),
          requestId,
          expirySeconds.toString(),
        ],
      }),
    );

    if (result === null) {
      throw new Error("Redis sliding-window script returned null");
    }

    if (!Array.isArray(result) || result.length < 3) {
      throw new Error("Invalid response from Redis sliding-window script");
    }

    const [allowed, count, oldestTimestamp] = result;

    return {
      allowed: Number(allowed) === 1,
      count: Number(count),
      oldestTimestamp:
        oldestTimestamp === null ? null : Number(oldestTimestamp),
    };
  }
}
