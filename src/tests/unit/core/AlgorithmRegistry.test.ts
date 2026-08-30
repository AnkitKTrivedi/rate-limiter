import { AlgorithmRegistry } from "../../../core/AlgorithmRegistry";
import { PolicyEngine } from "../../../core/PolicyEngine";
import { RateLimitService } from "../../../core/RateLimitService";

describe("RateLimitService", () => {
  let policyEngine: jest.Mocked<PolicyEngine>;
  let registry: jest.Mocked<AlgorithmRegistry>;

  const algorithm = {
    consume: jest.fn(),
  };

  beforeEach(() => {
    policyEngine = {
      resolve: jest.fn(),
    } as unknown as jest.Mocked<PolicyEngine>;

    registry = {
      create: jest.fn(),
    } as unknown as jest.Mocked<AlgorithmRegistry>;
  });

  it("should return null when no policy exists", async () => {
    policyEngine.resolve.mockReturnValue(null);

    const service = new RateLimitService(policyEngine, registry);

    const result = await service.check({
      route: "/api/users",
      method: "GET",
    });

    expect(result).toBeNull();

    expect(registry.create).not.toHaveBeenCalled();
  });

  it("should resolve policy and execute algorithm", async () => {
    const policy = {
      name: "users",
      route: "/api/users",
      method: "GET" as const,
      algorithm: "sliding-window" as const,
      limit: 100,
      windowMs: 60_000,
    };

    const resolved = {
      policy,
      key: "rate-limit:users:user-1",
    };

    const rateLimitResult = {
      allowed: true,
      limit: 100,
      remaining: 99,
      retryAfter: 0,
      resetAt: Date.now(),
    };

    policyEngine.resolve.mockReturnValue(resolved);

    registry.create.mockReturnValue(algorithm);

    algorithm.consume.mockResolvedValue(rateLimitResult);

    const service = new RateLimitService(policyEngine, registry);

    const result = await service.check({
      route: "/api/users",
      method: "GET",
      userId: "user-1",
    });

    expect(policyEngine.resolve).toHaveBeenCalled();

    expect(registry.create).toHaveBeenCalledWith(policy);

    expect(algorithm.consume).toHaveBeenCalledWith(resolved.key);

    expect(result).toEqual(rateLimitResult);
  });

  it("should propagate algorithm errors", async () => {
    policyEngine.resolve.mockReturnValue({
      policy: {
        name: "users",
        route: "/api/users",
        method: "GET",
        algorithm: "sliding-window",
        limit: 100,
        windowMs: 60_000,
      },
      key: "rate-limit:users:user-1",
    });

    registry.create.mockReturnValue(algorithm);

    algorithm.consume.mockRejectedValue(new Error("Redis unavailable"));

    const service = new RateLimitService(policyEngine, registry);

    await expect(
      service.check({
        route: "/api/users",
        method: "GET",
      }),
    ).rejects.toThrow("Redis unavailable");
  });
});
