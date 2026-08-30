import { PolicyEngine } from "./PolicyEngine";

import { AlgorithmRegistry } from "./AlgorithmRegistry";

import { RateLimitContext } from "./PolicyResolver";

import { RateLimitResult } from "./RateLimitResult";

export class RateLimitService {
  constructor(
    private readonly policyEngine: PolicyEngine,
    private readonly algorithmRegistry: AlgorithmRegistry,
  ) {}

  async check(context: RateLimitContext): Promise<RateLimitResult | null> {
    const resolvedPolicies = this.policyEngine.resolve(context);

    if (resolvedPolicies.length === 0) {
      return null;
    }

    const results = await Promise.all(
      resolvedPolicies.map(async ({ policy, key }) => {
        const algorithm = this.algorithmRegistry.create(policy);

        return algorithm.consume(key);
      }),
    );

    return this.combineResults(results);
  }

  private combineResults(results: RateLimitResult[]): RateLimitResult {
    const rejectedResult = results.find((result) => !result.allowed);

    if (rejectedResult) {
      return rejectedResult;
    }

    return results.reduce((mostRestrictive, current) => {
      if (current.remaining < mostRestrictive.remaining) {
        return current;
      }

      return mostRestrictive;
    });
  }
}
