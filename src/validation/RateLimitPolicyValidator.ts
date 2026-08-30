import {
  RateLimitPolicy,
  FixedWindowPolicy,
  SlidingWindowPolicy,
  TokenBucketPolicy,
  LeakyBucketPolicy,
} from "../core/RateLimitPolicy";

export class RateLimitPolicyValidator {
  validate(policies: RateLimitPolicy[]): void {
    if (policies.length === 0) {
      throw new Error("At least one rate limit policy is required");
    }

    const names = new Set<string>();

    for (const policy of policies) {
      this.validateName(policy, names);
      this.validateRoute(policy);
      this.validateMethod(policy);
      this.validateAlgorithmConfig(policy);
      this.validatePriority(policy);
    }
  }

  private validateName(policy: RateLimitPolicy, names: Set<string>): void {
    if (!policy.name.trim()) {
      throw new Error("Rate limit policy name cannot be empty");
    }

    if (names.has(policy.name)) {
      throw new Error(`Duplicate rate limit policy: ${policy.name}`);
    }

    names.add(policy.name);
  }

  private validateRoute(policy: RateLimitPolicy): void {
    if (!policy.route.trim()) {
      throw new Error(`Invalid route for policy: ${policy.name}`);
    }
  }

  private validateMethod(policy: RateLimitPolicy): void {
    if (policy.method && !policy.method.trim()) {
      throw new Error(`Invalid method for policy: ${policy.name}`);
    }
  }

  private validatePriority(policy: RateLimitPolicy): void {
    if (policy.priority !== undefined && policy.priority < 0) {
      throw new Error(`Priority cannot be negative: ${policy.name}`);
    }
  }

  private validateAlgorithmConfig(policy: RateLimitPolicy): void {
    switch (policy.algorithm) {
      case "fixed-window":
        this.validateWindowPolicy(policy);
        break;

      case "sliding-window":
        this.validateWindowPolicy(policy);
        break;

      case "token-bucket":
        this.validateTokenBucketPolicy(policy);
        break;

      case "leaky-bucket":
        this.validateLeakyBucketPolicy(policy);
        break;

      default:
        throw new Error(`Unsupported algorithm: ${policy}`);
    }
  }

  private validateWindowPolicy(
    policy: FixedWindowPolicy | SlidingWindowPolicy,
  ): void {
    if (policy.limit <= 0) {
      throw new Error(`Limit must be greater than zero: ${policy.name}`);
    }

    if (policy.windowMs <= 0) {
      throw new Error(`windowMs must be greater than zero: ${policy.name}`);
    }
  }

  private validateTokenBucketPolicy(policy: TokenBucketPolicy): void {
    if (policy.capacity <= 0) {
      throw new Error(`Capacity must be greater than zero: ${policy.name}`);
    }

    if (policy.refillRate <= 0) {
      throw new Error(`refillRate must be greater than zero: ${policy.name}`);
    }
  }

  private validateLeakyBucketPolicy(policy: LeakyBucketPolicy): void {
    if (policy.capacity <= 0) {
      throw new Error(`Capacity must be greater than zero: ${policy.name}`);
    }

    if (policy.leakRate <= 0) {
      throw new Error(`leakRate must be greater than zero: ${policy.name}`);
    }
  }
}
