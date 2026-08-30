export interface RateLimitMetrics {
  recordAllowed(policy: string, algorithm: string, durationMs: number): void;

  recordRejected(policy: string, algorithm: string, durationMs: number): void;

  recordError(policy: string, algorithm: string, durationMs: number): void;
}
