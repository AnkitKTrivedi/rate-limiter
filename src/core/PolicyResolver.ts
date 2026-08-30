import { RateLimitPolicy } from "./RateLimitPolicy";

export interface RateLimitContext {
  route: string;
  method: string;
  ip?: string;
  userId?: string;
  apiKey?: string;
}

export interface PolicyResolver {
  resolve(context: RateLimitContext): RateLimitPolicy[];
}
