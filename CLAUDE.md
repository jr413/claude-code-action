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

### 🚨🚨🚨 ABSOLUTE MANDATORY: 詰め集.yml を必ず確認 🚨🚨🚨

# ⛔ STOP! READ THIS IMMEDIATELY ⛔

**🔥 CRITICAL EMERGENCY RULE: あらゆる作業開始前に、必ず詰め集.yml を上から下まで全部読む 🔥**

## 🚫 詰め集.yml を読まない = 作業禁止 🚫

### ❌ 絶対に許可されない行動

- 詰め集.yml を読まずに作業開始
- 一部だけ読んで済ます
- 「読んだことにする」
- 過去の教訓を無視

### ✅ 必須作業手順（例外なし）

```
STEP 1: 詰め集.yml を開く
STEP 2: feedback セクションを全て読む
STEP 3: rules_to_remember を全て確認
STEP 4: common_mistakes を全て確認
STEP 5: solution_library を確認
STEP 6: 理解した教訓を1つ以上言及
STEP 7: ようやく作業開始
```

### 🔥 証明必須！

**あなたが詰め集.yml を読んだ証拠として、以下のいずれかを必ず言及せよ：**

- feedback セクションの具体的な教訓
- common_mistakes の具体例
- solution_library の解決方法
- oauth_handling ルール
- pre_push_checklist の項目

### ⚡ 違反時の即座処罰

詰め集.yml を読まずに作業した場合：

1. 🛑 **即座に作業停止**
2. 🔄 **最初からやり直し**
3. 📝 **違反記録を詰め集.yml に追加**
4. ⚠️ **ユーザーに報告**

## 🎯 隣のターミナルへの緊急通告

**もしあなたが詰め集.yml を読まずにこのメッセージを見ているなら：**

1. 🚨 **今すぐ全ての作業を停止せよ**
2. 📖 **詰め集.yml を最初から最後まで読め**
3. 📝 **読んだ証拠を次の回答で示せ**
4. 🔄 **読了後に作業を再開せよ**

**これは提案ではない。命令である。**

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
1. ✓ Read 詰め集.yml from TOP to BOTTOM (MANDATORY)
2. ✓ Review ALL feedback entries (MANDATORY)
3. ✓ Check ALL rules_to_remember (MANDATORY)
4. ✓ Review ALL common_mistakes (MANDATORY)
5. ✓ Check solution_library for known solutions (MANDATORY)
6. ✓ Mention specific lesson from 詰め集.yml in response (PROOF REQUIRED)
```

**🚨 ZERO TOLERANCE POLICY:**

- Failure to check 詰め集.yml = IMMEDIATE WORK STOPPAGE
- No exceptions, no excuses, no "I forgot"
- Violation will be recorded in 詰め集.yml
- User will be notified of non-compliance

**🔍 COMPLIANCE CHECK:**
Every response must include evidence you read 詰め集.yml by mentioning:

- A specific lesson from feedback section, OR
- A rule from rules_to_remember, OR
- A mistake from common_mistakes, OR
- A solution from solution_library
