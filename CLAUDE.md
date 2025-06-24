# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Development Tools

- Runtime: Bun 1.2.11

## Common Development Tasks

### Available npm/bun scripts from package.json:

```bash
# Test
bun test

# Formatting
bun run format          # Format code with prettier
bun run format:check    # Check code formatting
```

## Architecture Overview

This is a GitHub Action that enables Claude to interact with GitHub PRs and issues. The action:

1. **Trigger Detection**: Uses `check-trigger.ts` to determine if Claude should respond based on comment/issue content
2. **Context Gathering**: Fetches GitHub data (PRs, issues, comments) via `github-data-fetcher.ts` and formats it using `github-data-formatter.ts`
3. **AI Integration**: Supports multiple Claude providers (Anthropic API, AWS Bedrock, Google Vertex AI)
4. **Prompt Creation**: Generates context-rich prompts using `create-prompt.ts`
5. **MCP Server Integration**: Installs and configures GitHub MCP server for extended functionality

### Key Components

- **Trigger System**: Responds to `/claude` comments or issue assignments
- **Authentication**: OIDC-based token exchange for secure GitHub interactions
- **Cloud Integration**: Supports direct Anthropic API, AWS Bedrock, and Google Vertex AI
- **GitHub Operations**: Creates branches, posts comments, and manages PRs/issues

### Project Structure

```
src/
├── check-trigger.ts        # Determines if Claude should respond
├── create-prompt.ts        # Generates contextual prompts
├── github-data-fetcher.ts  # Retrieves GitHub data
├── github-data-formatter.ts # Formats GitHub data for prompts
├── install-mcp-server.ts  # Sets up GitHub MCP server
├── update-comment-with-link.ts # Updates comments with job links
└── types/
    └── github.ts          # TypeScript types for GitHub data
```

## Important Notes

- Actions are triggered by `@claude` comments or issue assignment unless a different trigger_phrase is specified
- The action creates branches for issues and pushes to PR branches directly
- All actions create OIDC tokens for secure authentication
- Progress is tracked through dynamic comment updates with checkboxes

## User Feedback and Quality Control

### 🚨 MANDATORY: Check 詰め集.yml FIRST 🚨

**⚠️ CRITICAL RULE: Before starting ANY work, you MUST read the entire `詰め集.yml` file from top to bottom.**

**❌ VIOLATION = IMMEDIATE STOP**

This is NOT optional. You MUST:

1. ✅ Open and read `詰め集.yml` completely
2. ✅ Review ALL past mistakes and lessons learned  
3. ✅ Check ALL rules and best practices
4. ✅ Confirm you understand each lesson
5. ✅ ONLY THEN proceed with the task

**If you start work without reading 詰め集.yml:**
- ❌ You WILL repeat past mistakes
- ❌ You WILL violate established rules
- ❌ You WILL waste user's time
- ❌ You WILL be reminded to read it

**PROVE you read it by mentioning at least one lesson from 詰め集.yml in your response.**

### Recording User Feedback

All user feedback, corrections, and important reminders must be recorded in `詰め集.yml` file. This includes:

- Issues pointed out by users
- Mistakes to avoid
- Best practices learned from user interactions
- Common pitfalls and their solutions

### Decision Making Guidelines

1. **Simple Changes - Just Do It**

   - Typo fixes
   - Obvious bug fixes
   - Documentation updates
   - Import statement corrections
   - Don't ask permission for these - just make the change

2. **Transparency Rule**

   - ALWAYS verify execution results
   - If something fails, report it immediately
   - Never claim completion without verification
   - Show actual error messages

3. **When to Suggest User Action**
   If any of these apply, suggest the user does it instead:

   - Requires external service credentials
   - Needs repository settings changes
   - Complex multi-step manual process
   - Would take me many attempts vs user doing it once

   Format: "💡 **Suggestion**: You can do this faster by..."

### Strict Development Rules

Before making any changes, always verify:

1. **File Creation Control**

   - NEVER create unnecessary files
   - ALWAYS check if a similar file already exists
   - If you need to create a file, explain the necessity first
   - Delete any temporary or test files immediately after use

2. **Dependency Management**

   - NEVER add JavaScript/TypeScript libraries without explicit user permission
   - ALWAYS ask before adding any new dependency to package.json
   - Use existing libraries and built-in functions whenever possible
   - Document why a new dependency is needed before adding it

3. **Code Modification Guidelines**

   - Prefer modifying existing code over creating new files
   - Keep changes minimal and focused
   - Don't add comments unless specifically requested
   - Maintain existing code style and conventions

4. **Quality Checklist**
   Before completing any task, verify:
   - [ ] No unnecessary files were created
   - [ ] No unauthorized dependencies were added
   - [ ] All temporary files have been cleaned up
   - [ ] Changes are minimal and focused on the task
   - [ ] Existing conventions were followed

### Example 詰め集.yml Entry

```yaml
feedback:
  - date: "2025-06-24"
    issue: "Created unnecessary test files"
    solution: "Always use .gitignore and clean up after testing"

  - date: "2025-06-24"
    issue: "Added library without permission"
    solution: "Always ask user before adding any npm package"

  - date: "2025-06-24"
    issue: "Created duplicate functionality"
    solution: "Search existing code before implementing new features"
```

Remember: When in doubt, ASK before creating or adding anything!

## WORKFLOW REQUIREMENT

### Mandatory Pre-Work Checklist

**EVERY TIME before starting work, you MUST:**

```
1. ✓ Read 詰め集.yml from TOP to BOTTOM
2. ✓ Review ALL feedback entries
3. ✓ Check ALL rules_to_remember
4. ✓ Review ALL common_mistakes
5. ✓ Confirm ALL best_practices
```

**This is NOT optional. Failure to check 詰め集.yml = Repeating past mistakes**
