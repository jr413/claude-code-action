// Jest setup file for RDD project
// Import testing libraries
import "@testing-library/jest-dom";

// Set up global test configuration
global.console = {
  ...console,
  // Uncomment to ignore console errors in tests
  // error: jest.fn(),
  // warn: jest.fn(),
};

// Add custom matchers if needed
expect.extend({
  // Example custom matcher
  toHaveRequirementId(received, expected) {
    const pass = received.requirementId === expected;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to have requirement ID ${expected}`
          : `expected ${received} to have requirement ID ${expected}`,
    };
  },
});

// Set up test environment variables
process.env.NODE_ENV = "test";

// Mock any external services if needed
jest.mock("node-fetch", () => require("fetch-mock-jest").sandbox());

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
