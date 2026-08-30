import { PolicyEngine } from "../../../core/PolicyEngine";
import { PolicyResolver } from "../../../core/PolicyResolver";
import { RateLimitKeyGenerator } from "../../../core/RateLimitKeyGenerator";

describe("PolicyEngine", () => {
  let resolver: jest.Mocked<PolicyResolver>;
  let keyGenerator: jest.Mocked<RateLimitKeyGenerator>;

  beforeEach(() => {
    resolver = {
      resolve: jest.fn(),
    };

    keyGenerator = {
      generate: jest.fn(),
    };
  });

  it("should return empty array when no policy matches", () => {
    resolver.resolve.mockReturnValue([]);

    const engine = new PolicyEngine(resolver, keyGenerator);

    const result = engine.resolve({
      route: "/api/users",
      method: "GET",
    });

    expect(result).toEqual([]);

    expect(keyGenerator.generate).not.toHaveBeenCalled();
  });

  it("should resolve one policy and generate its key", () => {
    const policy = {
      name: "users-read",
      route: "/api/users",
      method: "GET",
      algorithm: "sliding-window" as const,
      limit: 100,
      windowMs: 60_000,
    };

    resolver.resolve.mockReturnValue([policy]);

    keyGenerator.generate.mockReturnValue("rate-limit:users-read:127.0.0.1");

    const engine = new PolicyEngine(resolver, keyGenerator);

    const context = {
      route: "/api/users",
      method: "GET",
      ip: "127.0.0.1",
    };

    const result = engine.resolve(context);

    expect(result).toEqual([
      {
        policy,
        key: "rate-limit:users-read:127.0.0.1",
      },
    ]);

    expect(keyGenerator.generate).toHaveBeenCalledWith(context, policy);
  });

  it("should resolve multiple policies", () => {
    const globalPolicy = {
      name: "global-ip",
      route: "*",
      method: "*",
      algorithm: "sliding-window" as const,
      limit: 1000,
      windowMs: 60_000,
      priority: 1,
    };

    const usersPolicy = {
      name: "users-read",
      route: "/api/users",
      method: "GET",
      algorithm: "sliding-window" as const,
      limit: 100,
      windowMs: 60_000,
      priority: 10,
    };

    resolver.resolve.mockReturnValue([usersPolicy, globalPolicy]);

    keyGenerator.generate
      .mockReturnValueOnce("rate-limit:users-read:127.0.0.1")
      .mockReturnValueOnce("rate-limit:global-ip:127.0.0.1");

    const engine = new PolicyEngine(resolver, keyGenerator);

    const context = {
      route: "/api/users",
      method: "GET",
      ip: "127.0.0.1",
    };

    const result = engine.resolve(context);

    expect(result).toHaveLength(2);

    expect(result).toEqual([
      {
        policy: usersPolicy,
        key: "rate-limit:users-read:127.0.0.1",
      },
      {
        policy: globalPolicy,
        key: "rate-limit:global-ip:127.0.0.1",
      },
    ]);

    expect(keyGenerator.generate).toHaveBeenCalledTimes(2);
  });

  it("should generate a unique key for every policy", () => {
    const policies = [
      {
        name: "users-read",
        route: "/api/users",
        method: "GET",
        algorithm: "sliding-window" as const,
        limit: 100,
        windowMs: 60_000,
      },
      {
        name: "global-ip",
        route: "*",
        method: "*",
        algorithm: "sliding-window" as const,
        limit: 1000,
        windowMs: 60_000,
      },
    ];

    resolver.resolve.mockReturnValue(policies);

    keyGenerator.generate
      .mockReturnValueOnce("rate-limit:users-read:127.0.0.1")
      .mockReturnValueOnce("rate-limit:global-ip:127.0.0.1");

    const engine = new PolicyEngine(resolver, keyGenerator);

    const result = engine.resolve({
      route: "/api/users",
      method: "GET",
      ip: "127.0.0.1",
    });

    const keys = result.map((item) => item.key);

    expect(new Set(keys).size).toBe(keys.length);
  });
});
