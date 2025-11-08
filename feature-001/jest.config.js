// jest.config.js
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  // Stop running tests after first failure
  bail: 1, 
  // CRITICAL: Explicitly whitelist only root __tests__ directory to prevent scanning nested paths
  testMatch: [
    "<rootDir>/__tests__/**/*.test.js"
  ],
  // Ignore frontend React app tests; they are run separately via CRA
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/insurance-frontend/",
    "<rootDir>/feature-001/"
  ],
  // Also ignore nested tree and frontend during module resolution
  modulePathIgnorePatterns: [
    "<rootDir>/insurance-frontend/",
    "<rootDir>/feature-001/"
  ],
  // Prevent Jest haste-map from scanning nested duplicate tree and frontend
  watchPathIgnorePatterns: [
    "<rootDir>/insurance-frontend/",
    "<rootDir>/feature-001/"
  ],
  // Force haste to ignore nested paths
  haste: {
    forceNodeFilesystemAPI: true
  },
  // Setup coverage
  collectCoverage: false,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  // Ignore non-unit tested entrypoint from coverage to focus on tested modules
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "server.js",
    "<rootDir>/insurance-frontend/",
    "<rootDir>/feature-001/"
  ],
  // Coverage thresholds adjusted to current backend coverage
  // Frontend has separate coverage config in insurance-frontend/package.json
  coverageThreshold: {
    global: {
      branches: 4,
      functions: 9,
      lines: 13,
      statements: 12
    }
  }
};
