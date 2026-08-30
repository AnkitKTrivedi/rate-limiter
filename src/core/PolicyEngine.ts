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

  resolve(context: RateLimitContext): ResolvedRateLimitPolicy[] {
    const policies = this.resolver.resolve(context);

    if (policies.length === 0) {
      return [];
    }

    return policies.map((policy) => ({
      policy,
      key: this.keyGenerator.generate(context, policy),
    }));
  }
}
