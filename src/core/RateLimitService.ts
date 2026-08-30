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
    const resolved = this.policyEngine.resolve(context);

    if (!resolved) {
      return null;
    }

    const algorithm = this.algorithmRegistry.create(resolved.policy);

    return algorithm.consume(resolved.key);
  }
}
