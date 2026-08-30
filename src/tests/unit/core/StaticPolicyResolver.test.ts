import { StaticPolicyResolver } from "../../../policies/StaticPolicyResolver";

describe("StaticPolicyResolver", () => {
  it("should return matching route policy", () => {
    const resolver = new StaticPolicyResolver([
      {
        name: "users-read",
        route: "/api/users",
        method: "GET",
        algorithm: "sliding-window",
        limit: 100,
        windowMs: 60_000,
      },
    ]);

    const result = resolver.resolve({
      route: "/api/users",
      method: "GET",
    });

    expect(result).toHaveLength(1);

    expect(result[0].name).toBe("users-read");
  });

  it("should return multiple applicable policies", () => {
    const resolver = new StaticPolicyResolver([
      {
        name: "global-ip",
        route: "*",
        method: "*",
        algorithm: "sliding-window",
        limit: 1000,
        windowMs: 60_000,
        priority: 1,
      },

      {
        name: "users-read",
        route: "/api/users",
        method: "GET",
        algorithm: "sliding-window",
        limit: 100,
        windowMs: 60_000,
        priority: 10,
      },
    ]);

    const result = resolver.resolve({
      route: "/api/users",
      method: "GET",
    });

    expect(result).toHaveLength(2);

    expect(result.map((policy) => policy.name)).toEqual([
      "users-read",
      "global-ip",
    ]);
  });

  it("should sort policies by priority descending", () => {
    const resolver = new StaticPolicyResolver([
      {
        name: "low",
        route: "*",
        method: "*",
        algorithm: "sliding-window",
        limit: 1000,
        windowMs: 60_000,
        priority: 1,
      },

      {
        name: "high",
        route: "*",
        method: "*",
        algorithm: "sliding-window",
        limit: 10,
        windowMs: 60_000,
        priority: 100,
      },

      {
        name: "medium",
        route: "*",
        method: "*",
        algorithm: "sliding-window",
        limit: 100,
        windowMs: 60_000,
        priority: 10,
      },
    ]);

    const result = resolver.resolve({
      route: "/api/users",
      method: "GET",
    });

    expect(result.map((policy) => policy.name)).toEqual([
      "high",
      "medium",
      "low",
    ]);
  });

  it("should support wildcard route", () => {
    const resolver = new StaticPolicyResolver([
      {
        name: "global",
        route: "*",
        method: "*",
        algorithm: "sliding-window",
        limit: 1000,
        windowMs: 60_000,
      },
    ]);

    const result = resolver.resolve({
      route: "/api/orders",
      method: "POST",
    });

    expect(result).toHaveLength(1);
  });

  it("should support wildcard method", () => {
    const resolver = new StaticPolicyResolver([
      {
        name: "users-all-methods",
        route: "/api/users",
        method: "*",
        algorithm: "sliding-window",
        limit: 100,
        windowMs: 60_000,
      },
    ]);

    const result = resolver.resolve({
      route: "/api/users",
      method: "POST",
    });

    expect(result).toHaveLength(1);
  });

  it("should ignore unrelated policies", () => {
    const resolver = new StaticPolicyResolver([
      {
        name: "login",
        route: "/api/login",
        method: "POST",
        algorithm: "token-bucket",
        capacity: 5,
        refillRate: 0.1,
      },
    ]);

    const result = resolver.resolve({
      route: "/api/users",
      method: "GET",
    });

    expect(result).toEqual([]);
  });

  it("should treat missing priority as zero", () => {
    const resolver = new StaticPolicyResolver([
      {
        name: "default",
        route: "*",
        method: "*",
        algorithm: "sliding-window",
        limit: 100,
        windowMs: 60_000,
      },

      {
        name: "high",
        route: "*",
        method: "*",
        algorithm: "sliding-window",
        limit: 10,
        windowMs: 60_000,
        priority: 10,
      },
    ]);

    const result = resolver.resolve({
      route: "/api/users",
      method: "GET",
    });

    expect(result.map((policy) => policy.name)).toEqual(["high", "default"]);
  });
});
