import { RateLimitResult } from "./RateLimitResult";

export interface RateLimitAlgorithm {
  consume(key: string): Promise<RateLimitResult>;
}

export type RateLimitAlgorithmType =
  | "fixed-window"
  | "sliding-window"
  | "token-bucket"
  | "leaky-bucket";

export interface BasePolicy {
  name: string;
  algorithm: RateLimitAlgorithmType;
  method?: string;
  route: string;
  priority?: number;
}
