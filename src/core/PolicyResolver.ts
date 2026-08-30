import { RateLimitPolicy } from "./RateLimitPolicy";

export interface RateLimitContext {
  ip?: string;
  userId?: string;
  apiKey?: string;
  tenantId?: string;
  route: string;
  method: string;
}

export interface PolicyResolver {
  resolve(context: RateLimitContext): RateLimitPolicy | null;
}
