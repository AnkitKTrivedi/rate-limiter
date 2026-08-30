import { AlgorithmRegistry } from "../core/AlgorithmRegistry";
import { RateLimitService } from "../core/RateLimitService";
import { PolicyEngine } from "../core/PolicyEngine";

import { StaticPolicyResolver } from "../policies/StaticPolicyResolver";

import { DefaultRateLimitKeyGenerator } from "../core/DefaultRateLimitKeyGenerator";

import { RedisSlidingWindowStore } from "../stores/RedisSlidingWindowStore";
import { RedisTokenBucketStore } from "../stores/RedisTokenBucketStore";
import { RedisLeakyBucketStore } from "../stores/RedisLeakyBucketStore";
import { RedisStore as RedisFixedWindowStore } from "../stores/RedisStores";

import { FixedWindow } from "../algorithms/fixed-window/FixedWindow";
import { SlidingWindow } from "../algorithms/sliding-window/SlidingWindow";
import { TokenBucket } from "../algorithms/token-bucket/TokenBucket";
import { LeakyBucket } from "../algorithms/leaky-bucket/LeakyBucket";

import { RateLimitPolicy } from "../core/RateLimitPolicy";

import { redisClient } from "./redis";
import { FailOpenStrategy } from "../core/failure/FailOpenStrategy";
import { ConsoleRateLimitMetrics } from "../observability/ConsoleRateLimitMetrics";
import { RedisOperationExecutor } from "../infrastructure/RedisOperationExecutor";

export function createRateLimitService(
  policies: RateLimitPolicy[],
  redis: typeof redisClient,
): RateLimitService {
  /*
   * Redis is already connected by server.ts.
   *
   * Do NOT create another Redis client here.
   * Do NOT call redis.connect() here.
   */

  const fixedWindowStore = new RedisFixedWindowStore(redis);
  const redisExecutor = new RedisOperationExecutor(
    Number(process.env.REDIS_OPERATION_TIMEOUT_MS ?? 300),
  );

  const slidingWindowStore = new RedisSlidingWindowStore(redis, redisExecutor);

  const tokenBucketStore = new RedisTokenBucketStore(redis, redisExecutor);

  const leakyBucketStore = new RedisLeakyBucketStore(redis, redisExecutor);

  const registry = new AlgorithmRegistry();

  const failureStrategy = new FailOpenStrategy();

  const metrics = new ConsoleRateLimitMetrics();

  registry.register("fixed-window", (policy) => {
    if (policy.algorithm !== "fixed-window") {
      throw new Error("Invalid fixed-window policy");
    }

    return new FixedWindow(fixedWindowStore, {
      limit: policy.limit,
      windowMs: policy.windowMs,
    });
  });

  registry.register("sliding-window", (policy) => {
    if (policy.algorithm !== "sliding-window") {
      throw new Error("Invalid sliding-window policy");
    }

    return new SlidingWindow(slidingWindowStore, {
      limit: policy.limit,
      windowMs: policy.windowMs,
    });
  });

  registry.register("token-bucket", (policy) => {
    if (policy.algorithm !== "token-bucket") {
      throw new Error("Invalid token-bucket policy");
    }

    return new TokenBucket(tokenBucketStore, {
      capacity: policy.capacity,
      refillRate: policy.refillRate,
    });
  });

  registry.register("leaky-bucket", (policy) => {
    if (policy.algorithm !== "leaky-bucket") {
      throw new Error("Invalid leaky-bucket policy");
    }

    return new LeakyBucket(leakyBucketStore, {
      capacity: policy.capacity,
      leakRate: policy.leakRate,
    });
  });

  const resolver = new StaticPolicyResolver(policies);

  const keyGenerator = new DefaultRateLimitKeyGenerator();

  const policyEngine = new PolicyEngine(resolver, keyGenerator);

  return new RateLimitService(policyEngine, registry, failureStrategy, metrics);
}
