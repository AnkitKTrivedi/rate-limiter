import { RateLimitPolicy } from "../../../core/RateLimitPolicy";
import { StaticPolicyResolver } from "../../../policies/StaticPolicyResolver";

describe("StaticPolicyResolver", () => {
  const policies: RateLimitPolicy[] = [
    {
      name: "users-read",
      route: "/api/users",
      method: "GET",
      algorithm: "sliding-window",
      limit: 100,
      windowMs: 60_000,
    },

    {
      name: "login",
      route: "/api/login",
      method: "POST",
      algorithm: "token-bucket",
      capacity: 5,
      refillRate: 0.1,
    },

    {
      name: "users-all",
      route: "/api/public",
      algorithm: "fixed-window",
      limit: 20,
      windowMs: 60_000,
    },
  ];

  const resolver = new StaticPolicyResolver(policies);

  it("should resolve policy by route and method", () => {
    const result = resolver.resolve({
      route: "/api/users",
      method: "GET",
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe("users-read");
  });

  it("should resolve POST policy", () => {
    const result = resolver.resolve({
      route: "/api/login",
      method: "POST",
    });

    expect(result?.name).toBe("login");
    expect(result?.algorithm).toBe("token-bucket");
  });

  it("should not resolve wrong HTTP method", () => {
    const result = resolver.resolve({
      route: "/api/login",
      method: "GET",
    });

    expect(result).toBeNull();
  });

  it("should return null for unknown route", () => {
    const result = resolver.resolve({
      route: "/api/unknown",
      method: "GET",
    });

    expect(result).toBeNull();
  });

  it("should match policy without method restriction", () => {
    const result = resolver.resolve({
      route: "/api/public",
      method: "GET",
    });

    expect(result?.name).toBe("users-all");
  });

  it("should match method-independent policy for POST", () => {
    const result = resolver.resolve({
      route: "/api/public",
      method: "POST",
    });

    expect(result?.name).toBe("users-all");
  });
});
