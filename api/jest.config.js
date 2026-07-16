import { defineConfig } from "jest";

export default defineConfig({
  verbose: true,
  clearMocks: true,
  injectGlobals: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/modules/**/use-cases/**/*.use-case.ts",
  ],
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  extensionsToTreatAsEsm: [".ts"],
});
