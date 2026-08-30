import {
  RateLimitAlgorithm,
  RateLimitAlgorithmType,
} from "./RateLimitAlgorithm";

import { RateLimitPolicy } from "./RateLimitPolicy";

export type AlgorithmFactory = (policy: RateLimitPolicy) => RateLimitAlgorithm;

export class AlgorithmRegistry {
  private readonly factories = new Map<
    RateLimitAlgorithmType,
    AlgorithmFactory
  >();

  register(type: RateLimitAlgorithmType, factory: AlgorithmFactory): void {
    if (this.factories.has(type)) {
      throw new Error(`Algorithm already registered: ${type}`);
    }

    this.factories.set(type, factory);
  }

  create(policy: RateLimitPolicy): RateLimitAlgorithm {
    const factory = this.factories.get(policy.algorithm);

    if (!factory) {
      throw new Error(`No algorithm registered for: ${policy.algorithm}`);
    }

    return factory(policy);
  }

  has(type: RateLimitAlgorithmType): boolean {
    return this.factories.has(type);
  }
}
