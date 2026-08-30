import express from "express";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";
import { RateLimitService } from "./core/RateLimitService";
import { RedisHealthCheck } from "./health/RedisHealthCheck";
import { createHealthRouter } from "./routes/health";
import { redisClient } from "./config/redis";

export const createApp = (rateLimitService: RateLimitService) => {
  const app = express();

  app.use(express.json());

  app.use(
    rateLimiterMiddleware({
      service: rateLimitService,
    }),
  );

  const redisHealthCheck = new RedisHealthCheck(redisClient);

  app.use(createHealthRouter(redisHealthCheck));

  app.get("/api/users", (_req, res) => {
    res.json({
      success: true,
      message: "Users fetched successfully",
    });
  });

  return app;
};
