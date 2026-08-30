import express from "express";

import { rateLimiterMiddleware } from "./middleware/rateLimiter";

import { RateLimitService } from "./core/RateLimitService";

import { RedisHealthCheck } from "./health/RedisHealthCheck";

import { redisClient } from "./config/redis";

export function createApp(rateLimitService: RateLimitService) {
  const app = express();

  app.use(express.json());

  const redisHealthCheck = new RedisHealthCheck(redisClient);

  app.get("/health", async (_req, res) => {
    res.json({
      status: "ok",
    });
  });

  app.get("/ready", async (_req, res) => {
    const healthy = await redisHealthCheck.check();

    if (!healthy) {
      return res.status(503).json({
        status: "not_ready",
      });
    }

    return res.json({
      status: "ready",
    });
  });

  app.use(
    rateLimiterMiddleware({
      service: rateLimitService,
    }),
  );

  app.get("/api/users", (_req, res) => {
    res.json({
      success: true,
      message: "Users fetched successfully",
    });
  });

  return app;
}
