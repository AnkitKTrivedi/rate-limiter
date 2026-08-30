import { Request } from "express";

export type KeyGenerator = (req: Request) => string;

export const ipKeyGenerator: KeyGenerator = (req) => {
  return `ip:${req.ip ?? "unknown"}`;
};
