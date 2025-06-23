// Example E2E test following RDD pattern
// Requirement ID: REQ-003

describe("REQ-003: End-to-end user flow", () => {
  beforeEach(() => {
    // Visit the application
    cy.visit("http://localhost:3000");
  });

  it("should complete user workflow from requirements", () => {
    // Given: User is on the main page
    cy.contains("Welcome").should("be.visible");

    // When: User performs actions
    cy.get('[data-testid="start-button"]').click();
    cy.get('[data-testid="input-field"]').type("test input");
    cy.get('[data-testid="submit-button"]').click();

    // Then: Expected outcome from requirements
    cy.contains("Success").should("be.visible");
    cy.url().should("include", "/success");
  });

  it("should handle error scenarios", () => {
    // Test error handling as specified in requirements
    cy.get('[data-testid="start-button"]').click();
    cy.get('[data-testid="submit-button"]').click(); // Submit without input

    cy.contains("Error").should("be.visible");
  });
});
