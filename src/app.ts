import express from "express";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";
import { RateLimitService } from "./core/RateLimitService";

export const createApp = (rateLimitService: RateLimitService) => {
  const app = express();

  app.use(express.json());

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
};
