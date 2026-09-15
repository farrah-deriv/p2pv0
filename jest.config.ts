import nextJest from "next/jest.js"
import type { Config } from "jest"

// `next/jest` gives us SWC-based TS/JSX transforms and reads the `@/` alias out of
// tsconfig.json, so test files need no separate transform or moduleNameMapper wiring.
const createJestConfig = nextJest({ dir: "./" })

const config: Config = {
  // The suites wired up so far are pure TypeScript with no DOM, so "node" keeps the
  // runner dependency-free. Component tests will need jest-environment-jsdom added.
  testEnvironment: "node",
  // next/jest resolves `@/` for plain imports but not for `jest.mock()` specifiers,
  // so the alias is declared here too rather than forcing relative mock paths.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
}

export default createJestConfig(config)
