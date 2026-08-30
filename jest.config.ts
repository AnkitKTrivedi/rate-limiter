import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",

  transform: {
    "^.+\\.tsx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2022",
        },
        module: {
          type: "commonjs",
        },
      },
    ],
  },

  testMatch: ["**/?(*.)+(test).ts"],

  clearMocks: true,

  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts"],
};

export default config;
