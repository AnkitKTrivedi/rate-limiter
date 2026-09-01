import { RateLimitPolicyValidator } from "../../../validation/RateLimitPolicyValidator";

describe("RateLimitPolicyValidator", () => {
  const validator = new RateLimitPolicyValidator();

  const validPolicy = {
    name: "users-read",
    route: "/api/users",
    method: "GET",
    algorithm: "sliding-window" as const,
    limit: 100,
    windowMs: 60_000,
  };

  it("should accept a valid policy", () => {
    expect(() => validator.validate([validPolicy])).not.toThrow();
  });

  it("should reject empty policy list", () => {
    expect(() => validator.validate([])).toThrow(
      "At least one rate limit policy is required",
    );
  });

  it("should reject duplicate policy names", () => {
    expect(() => validator.validate([validPolicy, validPolicy])).toThrow(
      "Duplicate rate limit policy",
    );
  });

  it("should reject empty policy name", () => {
    expect(() =>
      validator.validate([
        {
          ...validPolicy,
          name: "",
        },
      ]),
    ).toThrow("policy name cannot be empty");
  });

  it("should reject empty route", () => {
    expect(() =>
      validator.validate([
        {
          ...validPolicy,
          route: "",
        },
      ]),
    ).toThrow("Invalid route");
  });

  // it("should reject empty method", () => {
  //   expect(() =>
  //     validator.validate([
  //       {
  //         ...validPolicy,
  //         method: "",
  //       },
  //     ]),
  //   ).toThrow("Invalid method");
  // });

  it("should reject negative priority", () => {
    expect(() =>
      validator.validate([
        {
          ...validPolicy,
          priority: -1,
        },
      ]),
    ).toThrow("Priority cannot be negative");
  });

  it("should reject invalid limit", () => {
    expect(() =>
      validator.validate([
        {
          ...validPolicy,
          limit: 0,
        },
      ]),
    ).toThrow("Limit must be greater than zero");
  });

  it("should reject invalid window", () => {
    expect(() =>
      validator.validate([
        {
          ...validPolicy,
          windowMs: 0,
        },
      ]),
    ).toThrow("windowMs must be greater than zero");
  });

  it("should reject invalid token bucket capacity", () => {
    expect(() =>
      validator.validate([
        {
          name: "login",
          route: "/api/login",
          method: "POST",
          algorithm: "token-bucket" as const,
          capacity: 0,
          refillRate: 0.1,
        },
      ]),
    ).toThrow("Capacity must be greater than zero");
  });

  it("should reject invalid token bucket refill rate", () => {
    expect(() =>
      validator.validate([
        {
          name: "login",
          route: "/api/login",
          method: "POST",
          algorithm: "token-bucket" as const,
          capacity: 5,
          refillRate: 0,
        },
      ]),
    ).toThrow("refillRate must be greater than zero");
  });

  it("should reject invalid leaky bucket capacity", () => {
    expect(() =>
      validator.validate([
        {
          name: "api",
          route: "/api",
          method: "*",
          algorithm: "leaky-bucket" as const,
          capacity: 0,
          leakRate: 1,
        },
      ]),
    ).toThrow("Capacity must be greater than zero");
  });

  it("should reject invalid leaky bucket leak rate", () => {
    expect(() =>
      validator.validate([
        {
          name: "api",
          route: "/api",
          method: "*",
          algorithm: "leaky-bucket" as const,
          capacity: 10,
          leakRate: 0,
        },
      ]),
    ).toThrow("leakRate must be greater than zero");
  });
});
