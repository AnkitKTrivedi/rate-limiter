import express from "express";

import { rateLimiter } from "./config/rateLimiter";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";

const app = express();

app.use(express.json());

app.use(
  "/api",
  rateLimiterMiddleware(rateLimiter, (req) => `rate-limit:ip:${req.ip}`),
);

app.get("/api/users", (req, res) => {
  res.json({
    success: true,
    message: "Users fetched successfully",
  });
});

export default app;
