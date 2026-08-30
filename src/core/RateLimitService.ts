import { PolicyEngine } from "./PolicyEngine";

import { AlgorithmRegistry } from "./AlgorithmRegistry";

import { RateLimitContext } from "./PolicyResolver";

import { RateLimitResult } from "./RateLimitResult";
import { RateLimitFailureStrategy } from "./RateLimitFailureStrategy";

export class RateLimitService {
  constructor(
    private readonly policyEngine: PolicyEngine,
    private readonly algorithmRegistry: AlgorithmRegistry,
    private readonly failureStrategy: RateLimitFailureStrategy,
  ) {}

  async check(context: RateLimitContext): Promise<RateLimitResult | null> {
    try {
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
    } catch (error) {
      return this.failureStrategy.handle(error, context);
    }
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
