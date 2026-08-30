import { DefaultRateLimitKeyGenerator } from "../../../core/DefaultRateLimitKeyGenerator";

describe("DefaultRateLimitKeyGenerator", () => {
  const generator = new DefaultRateLimitKeyGenerator();

  const policy = {
    name: "users-read",
  };

  it("should use userId when available", () => {
    const key = generator.generate(
      {
        route: "/api/users",
        method: "GET",
        userId: "user-123",
      },
      policy,
    );

    expect(key).toBe("rate-limit:users-read:user-123");
  });

  it("should fallback to apiKey", () => {
    const key = generator.generate(
      {
        route: "/api/users",
        method: "GET",
        apiKey: "api-key-123",
      },
      policy,
    );

    expect(key).toBe("rate-limit:users-read:api-key-123");
  });

  it("should fallback to IP", () => {
    const key = generator.generate(
      {
        route: "/api/users",
        method: "GET",
        ip: "192.168.1.10",
      },
      policy,
    );

    expect(key).toBe("rate-limit:users-read:192.168.1.10");
  });

  it("should use anonymous when no identity exists", () => {
    const key = generator.generate(
      {
        route: "/api/users",
        method: "GET",
      },
      policy,
    );

    expect(key).toBe("rate-limit:users-read:anonymous");
  });

  it("should prefer userId over apiKey", () => {
    const key = generator.generate(
      {
        route: "/api/users",
        method: "GET",
        userId: "user-123",
        apiKey: "api-key-123",
        ip: "192.168.1.10",
      },
      policy,
    );

    expect(key).toBe("rate-limit:users-read:user-123");
  });

  it("should prefer apiKey over IP", () => {
    const key = generator.generate(
      {
        route: "/api/users",
        method: "GET",
        apiKey: "api-key-123",
        ip: "192.168.1.10",
      },
      policy,
    );

    expect(key).toBe("rate-limit:users-read:api-key-123");
  });
});
