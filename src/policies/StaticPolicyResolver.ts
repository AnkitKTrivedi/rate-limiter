import { PolicyResolver, RateLimitContext } from "../core/PolicyResolver";

import { RateLimitPolicy } from "../core/RateLimitPolicy";

export class StaticPolicyResolver implements PolicyResolver {
  constructor(private readonly policies: RateLimitPolicy[]) {}

  resolve(context: RateLimitContext): RateLimitPolicy | null {
    return (
      this.policies.find((policy) => policy.name === context.route) ?? null
    );
  }
}
