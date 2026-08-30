import { Router, Request, Response } from "express";

import { RedisHealthCheck } from "../health/RedisHealthCheck";

export function createHealthRouter(redisHealthCheck: RedisHealthCheck): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
    });
  });

  router.get("/ready", async (_req: Request, res: Response) => {
    const redisReady = await redisHealthCheck.check();

    if (!redisReady) {
      return res.status(503).json({
        status: "not_ready",
        dependencies: {
          redis: "unavailable",
        },
      });
    }

    return res.status(200).json({
      status: "ready",
      dependencies: {
        redis: "available",
      },
    });
  });

  return router;
}
