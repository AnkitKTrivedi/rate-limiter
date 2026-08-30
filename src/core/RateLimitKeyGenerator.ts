import { RateLimitContext } from "./PolicyResolver";

export interface RateLimitKeyGenerator {
  generate(
    context: RateLimitContext,
    policy: {
      name: string;
    },
  ): string;
}
