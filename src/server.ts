import { createApp } from "./app";
import { connectRedis, redisClient } from "./config/redis";
import { createRateLimitService } from "./config/createRateLimiter";
import { rateLimitPolicies } from "./config/rateLimitPolicies";

const PORT = 6000;

const startServer = async (): Promise<void> => {
  try {
    await connectRedis();

    const rateLimitService = createRateLimitService(
      rateLimitPolicies,
      redisClient,
    );

    const app = createApp(rateLimitService);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
};

startServer();
