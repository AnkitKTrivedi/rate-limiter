import { PolicyResolver, RateLimitContext } from "./PolicyResolver";

import { RateLimitPolicy } from "./RateLimitPolicy";

import { RateLimitKeyGenerator } from "./RateLimitKeyGenerator";

export interface ResolvedRateLimitPolicy {
  policy: RateLimitPolicy;
  key: string;
}

export class PolicyEngine {
  constructor(
    private readonly resolver: PolicyResolver,
    private readonly keyGenerator: RateLimitKeyGenerator,
  ) {}

  resolve(context: RateLimitContext): ResolvedRateLimitPolicy | null {
    const policy = this.resolver.resolve(context);

    if (!policy) {
      return null;
    }

    const key = this.keyGenerator.generate(context, policy);

    return {
      policy,
      key,
    };
  }
}
