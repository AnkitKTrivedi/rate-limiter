import { RateLimitKeyGenerator } from "../core/RateLimitKeyGenerator";
import { RateLimitContext } from "./PolicyResolver";

export class DefaultRateLimitKeyGenerator implements RateLimitKeyGenerator {
  generate(context: RateLimitContext, policy: { name: string }): string {
    const identity =
      context.userId ?? context.apiKey ?? context.ip ?? "anonymous";

    return ["rate-limit", policy.name, identity].join(":");
  }
}
