# Requirements-Driven Development (RDD) Setup

## Overview

This directory contains the RDD implementation for the claude-code-action project.

## Structure

```
requirements/         # Requirement documents
tests/
  ├── unit/          # Unit tests (linked to requirements)
  ├── integration/   # Integration tests
  ├── e2e/           # End-to-end tests
  └── setup.js       # Jest setup file
```

## Usage

### 1. Define Requirements

Create requirement documents in the `requirements/` directory using the format:

- `REQ-XXX-description.md`

### 2. Write Tests First

For each requirement, write corresponding tests:

- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- E2E tests in `tests/e2e/`

### 3. Run Tests

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Check coverage
npm run test:coverage
```

### 4. Implement Features

Only after tests are written and failing, implement the actual features.

## Configuration

- `jest.config.js`: Jest testing configuration
- `cypress.config.js`: Cypress E2E configuration
- `rdd-config.yml`: RDD workflow configuration
- `.eslintrc.js`: Code quality rules

## CI/CD Integration

The `.github/workflows/rdd-tests.yml` workflow automatically:

- Runs all test types
- Checks coverage thresholds (85%)
- Validates code quality
- Uploads test artifacts
