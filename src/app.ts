import express from "express";
import { RateLimiter } from "./middleware/rateLimiter";

const app = express();

app.use(express.json());

const rateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000,
});

app.use("/api", rateLimiter.middleware);

app.get("/api/users", (req, res) => {
  res.json({
    success: true,
    message: "Users fetched successfully",
  });
});

app.get("/api/products", (req, res) => {
  res.json({
    success: true,
    message: "Products fetched successfully",
  });
});

export default app;
