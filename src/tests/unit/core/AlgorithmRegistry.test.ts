import { RateLimitService } from "../../../core/RateLimitService";

describe("RateLimitService", () => {
  const createService = () => {
    const policyEngine = {
      resolve: jest.fn(),
    };

    const algorithmRegistry = {
      create: jest.fn(),
    };

    const failureStrategy = {
      create: jest.fn(),
    };

    const metrics = {
      recordAllowed: jest.fn(),
      recordRejected: jest.fn(),
      recordError: jest.fn(),
    };
    const service = new RateLimitService(
      policyEngine as any,
      algorithmRegistry as any,
      failureStrategy as any,
      metrics as any,
    );

    return {
      service,
      policyEngine,
      algorithmRegistry,
    };
  };

  it("should return null when no policy applies", async () => {
    const { service, policyEngine } = createService();

    policyEngine.resolve.mockReturnValue([]);

    const result = await service.check({
      route: "/api/users",
      method: "GET",
    });

    expect(result).toBeNull();
  });

  it("should allow when all policies allow", async () => {
    const { service, policyEngine, algorithmRegistry } = createService();

    policyEngine.resolve.mockReturnValue([
      {
        policy: {
          name: "users-read",
        },
        key: "key-users",
      },
      {
        policy: {
          name: "global-ip",
        },
        key: "key-global",
      },
    ]);

    algorithmRegistry.create
      .mockReturnValueOnce({
        consume: jest.fn().mockResolvedValue({
          allowed: true,
          limit: 100,
          remaining: 90,
          resetAt: 1000,
          retryAfter: 0,
        }),
      })
      .mockReturnValueOnce({
        consume: jest.fn().mockResolvedValue({
          allowed: true,
          limit: 1000,
          remaining: 900,
          resetAt: 1000,
          retryAfter: 0,
        }),
      });

    const result = await service.check({
      route: "/api/users",
      method: "GET",
    });

    expect(result?.allowed).toBe(true);

    expect(result?.remaining).toBe(90);
  });

  it("should reject when any policy rejects", async () => {
    const { service, policyEngine, algorithmRegistry } = createService();

    policyEngine.resolve.mockReturnValue([
      {
        policy: {
          name: "users-read",
        },
        key: "key-users",
      },
      {
        policy: {
          name: "global-ip",
        },
        key: "key-global",
      },
    ]);

    algorithmRegistry.create
      .mockReturnValueOnce({
        consume: jest.fn().mockResolvedValue({
          allowed: true,
          limit: 100,
          remaining: 90,
          resetAt: 1000,
          retryAfter: 0,
        }),
      })
      .mockReturnValueOnce({
        consume: jest.fn().mockResolvedValue({
          allowed: false,
          limit: 1000,
          remaining: 0,
          resetAt: 2000,
          retryAfter: 20,
        }),
      });

    const result = await service.check({
      route: "/api/users",
      method: "GET",
    });

    expect(result?.allowed).toBe(false);

    expect(result?.retryAfter).toBe(20);
  });

  it("should use the longest retryAfter when multiple policies reject", async () => {
    const { service, policyEngine, algorithmRegistry } = createService();

    policyEngine.resolve.mockReturnValue([
      {
        policy: {
          name: "policy-a",
        },
        key: "key-a",
      },
      {
        policy: {
          name: "policy-b",
        },
        key: "key-b",
      },
    ]);

    algorithmRegistry.create
      .mockReturnValueOnce({
        consume: jest.fn().mockResolvedValue({
          allowed: false,
          limit: 10,
          remaining: 0,
          resetAt: 1000,
          retryAfter: 5,
        }),
      })
      .mockReturnValueOnce({
        consume: jest.fn().mockResolvedValue({
          allowed: false,
          limit: 20,
          remaining: 0,
          resetAt: 2000,
          retryAfter: 30,
        }),
      });

    const result = await service.check({
      route: "/api/users",
      method: "GET",
    });

    expect(result?.allowed).toBe(false);

    expect(result?.retryAfter).toBe(30);
  });

  it("should return the lowest remaining value when all policies allow", async () => {
    const { service, policyEngine, algorithmRegistry } = createService();

    policyEngine.resolve.mockReturnValue([
      {
        policy: {
          name: "policy-a",
        },
        key: "key-a",
      },
      {
        policy: {
          name: "policy-b",
        },
        key: "key-b",
      },
    ]);

    algorithmRegistry.create
      .mockReturnValueOnce({
        consume: jest.fn().mockResolvedValue({
          allowed: true,
          limit: 100,
          remaining: 50,
          resetAt: 1000,
          retryAfter: 0,
        }),
      })
      .mockReturnValueOnce({
        consume: jest.fn().mockResolvedValue({
          allowed: true,
          limit: 20,
          remaining: 3,
          resetAt: 2000,
          retryAfter: 0,
        }),
      });

    const result = await service.check({
      route: "/api/users",
      method: "GET",
    });

    expect(result?.allowed).toBe(true);

    expect(result?.remaining).toBe(3);
  });
});
