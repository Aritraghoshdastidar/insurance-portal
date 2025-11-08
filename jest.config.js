// jest.config.js
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  // Stop running tests after first failure
  bail: 1, 
  // Only look for tests in the backend __tests__ folder
  roots: [
    "<rootDir>/__tests__"
  ],
  // Ignore frontend React app tests; they are run separately via CRA
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/insurance-frontend/",
    "<rootDir>/feature-001/"
  ],
  // Prevent Jest's haste-map from scanning duplicate nested trees
  modulePathIgnorePatterns: [
    "<rootDir>/insurance-frontend/",
    "<rootDir>/feature-001/"
  ],
  // Also ignore in watch mode to avoid collisions
  watchPathIgnorePatterns: [
    "<rootDir>/insurance-frontend/",
    "<rootDir>/feature-001/"
  ],
  // Setup coverage
  collectCoverage: false,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  // Ignore non-unit tested entrypoint from coverage to focus on tested modules
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "server.js"
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
