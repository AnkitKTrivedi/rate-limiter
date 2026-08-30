import { request } from "express";
import { RateLimitPolicy } from "./core/RateLimitPolicy";

const testPolicies: RateLimitPolicy[] = [
  {
    name: "users-read",
    route: "/api/users",
    method: "GET",
    algorithm: "sliding-window",
    limit: 3,
    windowMs: 60_000,
  },
];

it("should return 429 after limit", async () => {
  const apiKey = "429-test-user";

  for (let i = 0; i < 3; i++) {
    const response = await request(app)
      .get("/api/users")
      .set("x-api-key", apiKey);

    expect(response.status).toBe(200);
  }

  const response = await request(app)
    .get("/api/users")
    .set("x-api-key", apiKey);

  expect(response.status).toBe(429);

  expect(response.body).toMatchObject({
    error: "Too Many Requests",
    message: "Rate limit exceeded",
  });

  expect(response.headers["retry-after"]).toBeDefined();
});
