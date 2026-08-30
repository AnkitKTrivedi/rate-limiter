export interface LeakyBucketStore {
  consume(
    key: string,
    now: number,
    capacity: number,
    leakRate: number,
  ): Promise<{
    allowed: boolean;
    queueSize: number;
    retryAfter: number;
  }>;
}
