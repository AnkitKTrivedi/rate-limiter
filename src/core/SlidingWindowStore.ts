export interface SlidingWindowStore {
  consume(
    key: string,
    now: number,
    windowMs: number,
    limit: number,
  ): Promise<{
    allowed: boolean;
    count: number;
    oldestTimestamp: number | null;
  }>;
}
