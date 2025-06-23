// Example unit test following RDD pattern
// Requirement ID: REQ-001

describe("REQ-001: Basic functionality test", () => {
  it("should demonstrate unit test structure", () => {
    // Given
    const input = "test";

    // When
    const result = input.toUpperCase();

    // Then
    expect(result).toBe("TEST");
  });

  it("should follow acceptance criteria", () => {
    // This test corresponds to acceptance criteria from requirements
    expect(true).toBe(true);
  });
});
