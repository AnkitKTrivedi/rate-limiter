import { RateLimitMetrics } from "./RateLimitMetrics";

export class ConsoleRateLimitMetrics implements RateLimitMetrics {
  recordAllowed(policy: string, algorithm: string, durationMs: number): void {
    console.log({
      event: "rate_limit_allowed",
      policy,
      algorithm,
      durationMs,
    });
  }

  recordRejected(policy: string, algorithm: string, durationMs: number): void {
    console.log({
      event: "rate_limit_rejected",
      policy,
      algorithm,
      durationMs,
    });
  }

  recordError(policy: string, algorithm: string, durationMs: number): void {
    console.error({
      event: "rate_limit_error",
      policy,
      algorithm,
      durationMs,
    });
  }
}
