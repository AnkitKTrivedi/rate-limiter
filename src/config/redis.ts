import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",

  socket: {
    reconnectStrategy(retries) {
      if (retries > 10) {
        return new Error("Redis reconnect limit exceeded");
      }

      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("error", (error) => {
  console.error({
    event: "redis_error",
    error,
  });
});

redisClient.on("connect", () => {
  console.log({
    event: "redis_connecting",
  });
});

redisClient.on("ready", () => {
  console.log({
    event: "redis_ready",
  });
});

redisClient.on("reconnecting", () => {
  console.log({
    event: "redis_reconnecting",
  });
});

redisClient.on("end", () => {
  console.log({
    event: "redis_connection_closed",
  });
});

export async function connectRedis(): Promise<void> {
  if (redisClient.isOpen) {
    return;
  }

  await redisClient.connect();
}
