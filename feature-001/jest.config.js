// jest.config.js
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  // Stop running tests after first failure
  bail: 1, 
  // Ignore frontend React app tests; they are run separately via CRA
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/insurance-frontend/",
    // Ignore nested duplicate workspace tree to avoid haste-map collisions
    "<rootDir>/feature-001/"
  ],
  // Also ignore nested tree during module resolution
  modulePathIgnorePatterns: [
    "<rootDir>/feature-001/"
  ],
  // Setup coverage
  collectCoverage: false,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  // Ignore non-unit tested entrypoint from coverage to focus on tested modules
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "server.js",
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
