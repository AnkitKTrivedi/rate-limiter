import { RedisClientType } from "redis";

import { slidingWindowScript } from "./scripts/slidingWindowScript";
import { RedisOperationExecutor } from "../infrastructure/RedisOperationExecutor";

export interface SlidingWindowStoreResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
}

export class RedisSlidingWindowStore {
  constructor(
    private readonly redis: RedisClientType,
    private readonly executor: RedisOperationExecutor,
  ) {}

  async consume(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<SlidingWindowStoreResult> {
    const now = Date.now();

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

    const [allowed, resultLimit, remaining, retryAfter] = result;

    return {
      allowed: Number(allowed) === 1,
      limit: Number(resultLimit),
      remaining: Number(remaining),
      retryAfter: Number(retryAfter),
    };
  }
}
