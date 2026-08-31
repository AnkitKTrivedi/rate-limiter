import request from "supertest";

import { createApp } from "../../createApp";
import { RateLimitService } from "../../core/RateLimitService";

describe("Rate Limiter HTTP Integration", () => {
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
  const rateLimitService = new RateLimitService(
    policyEngine as any,
    algorithmRegistry as any,
    failureStrategy as any,
    metrics as any,
  );
  const app = createApp(rateLimitService);

  it("should return rate limit headers", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("x-api-key", "supertest-user");

    expect(response.status).toBe(200);

    expect(response.headers["ratelimit-limit"]).toBeDefined();

    expect(response.headers["ratelimit-remaining"]).toBeDefined();

    expect(response.headers["ratelimit-reset"]).toBeDefined();
  });

  it("should return users successfully", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("x-api-key", "another-user");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Users fetched successfully",
    });
  });
});
