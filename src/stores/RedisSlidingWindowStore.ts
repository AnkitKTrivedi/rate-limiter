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
  constructor(private readonly redis: RedisClientType) {}

  async consume(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<SlidingWindowStoreResult> {
    const now = Date.now();

    const requestId = `${now}-${Math.random().toString(36).slice(2)}`;

    const expirySeconds = Math.ceil(windowMs / 1000) + 1;

    const result = (await this.redis.eval(slidingWindowScript, {
      keys: [key],
      arguments: [
        now.toString(),
        windowMs.toString(),
        limit.toString(),
        requestId,
        expirySeconds.toString(),
      ],
    })) as number[];

    return {
      allowed: result[0] === 1,
      limit: result[1],
      remaining: result[2],
      retryAfter: result[3],
    };
  }
}
