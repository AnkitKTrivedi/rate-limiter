import { RateLimitPolicy } from "../core/RateLimitPolicy";

export const rateLimitPolicies: RateLimitPolicy[] = [
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

  {
    name: "login",
    route: "/api/login",
    method: "POST",
    algorithm: "token-bucket",
    capacity: 5,
    refillRate: 0.1,
    priority: 100,
  },
];
