import { PolicyResolver, RateLimitContext } from "../core/PolicyResolver";
import { RateLimitPolicy } from "../core/RateLimitPolicy";
export class StaticPolicyResolver implements PolicyResolver {
  constructor(private readonly policies: RateLimitPolicy[]) {}
  resolve(context: RateLimitContext): RateLimitPolicy[] {
    return this.policies
      .filter((policy) => this.matches(policy, context))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }
  private matches(policy: RateLimitPolicy, context: RateLimitContext): boolean {
    const routeMatches = policy.route === "*" || policy.route === context.route;
    const methodMatches =
      policy.method === "*" || policy.method === context.method;
    return routeMatches && methodMatches;
  }
}
