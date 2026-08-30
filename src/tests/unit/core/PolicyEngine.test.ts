import { PolicyEngine } from "../../../core/PolicyEngine";
import { PolicyResolver } from "../../../core/PolicyResolver";
import { RateLimitKeyGenerator } from "../../../core/RateLimitKeyGenerator";

describe("PolicyEngine", () => {
  const policy = {
    name: "users-read",
    route: "/api/users",
    method: "GET" as const,
    algorithm: "sliding-window" as const,
    limit: 100,
    windowMs: 60_000,
  };

  let resolver: jest.Mocked<PolicyResolver>;
  let keyGenerator: jest.Mocked<RateLimitKeyGenerator>;

  let engine: PolicyEngine;

  beforeEach(() => {
    resolver = {
      resolve: jest.fn(),
    };

    keyGenerator = {
      generate: jest.fn(),
    };

    engine = new PolicyEngine(resolver, keyGenerator);
  });

  it("should resolve policy and generate key", () => {
    resolver.resolve.mockReturnValue(policy);

    keyGenerator.generate.mockReturnValue("rate-limit:users-read:user-123");

    const context = {
      route: "/api/users",
      method: "GET",
      userId: "user-123",
    };

    const result = engine.resolve(context);

    expect(resolver.resolve).toHaveBeenCalledWith(context);

    expect(keyGenerator.generate).toHaveBeenCalledWith(context, policy);

    expect(result).toEqual({
      policy,
      key: "rate-limit:users-read:user-123",
    });
  });

  it("should return null when no policy exists", () => {
    resolver.resolve.mockReturnValue(null);

    const context = {
      route: "/api/unknown",
      method: "GET",
      userId: "user-123",
    };

    const result = engine.resolve(context);

    expect(result).toBeNull();

    expect(keyGenerator.generate).not.toHaveBeenCalled();
  });

  it("should not generate a key when policy does not exist", () => {
    resolver.resolve.mockReturnValue(null);

    engine.resolve({
      route: "/unknown",
      method: "GET",
    });

    expect(keyGenerator.generate).not.toHaveBeenCalled();
  });

  it("should propagate resolver errors", () => {
    resolver.resolve.mockImplementation(() => {
      throw new Error("Policy service unavailable");
    });

    expect(() =>
      engine.resolve({
        route: "/api/users",
        method: "GET",
      }),
    ).toThrow("Policy service unavailable");

    expect(keyGenerator.generate).not.toHaveBeenCalled();
  });

  it("should propagate key generator errors", () => {
    resolver.resolve.mockReturnValue(policy);

    keyGenerator.generate.mockImplementation(() => {
      throw new Error("Unable to generate key");
    });

    expect(() =>
      engine.resolve({
        route: "/api/users",
        method: "GET",
        userId: "user-123",
      }),
    ).toThrow("Unable to generate key");
  });
});
