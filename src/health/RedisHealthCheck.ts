import { RedisClientType } from "redis";

export class RedisHealthCheck {
  constructor(private readonly redisClient: RedisClientType) {}

  async check(): Promise<boolean> {
    try {
      if (!this.redisClient.isReady) {
        return false;
      }

      const result = await this.redisClient.ping();

      return result === "PONG";
    } catch {
      return false;
    }
  }
}
