import request from "supertest";

import app from "../../../src/app";

describe("Rate Limiter HTTP Integration", () => {
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
