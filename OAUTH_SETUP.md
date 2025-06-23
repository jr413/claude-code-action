# OAuth Setup Guide for Claude Code Action

## ⚠️ Important Note

This OAuth implementation is experimental. Claude.ai OAuth tokens may not be directly compatible with the Anthropic API. The implementation uses static OAuth tokens without automatic refresh.

## Required Secret

You need to add the following secret to your GitHub repository:

1. **CLAUDE_ACCESS_TOKEN** - Your Claude OAuth access token from credentials.json

## How to Add Secrets

1. Go to your repository on GitHub
2. Click on "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add each secret with the exact name as listed above

## Token Management

This implementation uses static OAuth tokens. When your token expires, you'll need to manually update the CLAUDE_ACCESS_TOKEN secret in your repository with a new token.

## Troubleshooting

### Error: "claude_access_token is required when use_oauth is true"

This error occurs when:
- CLAUDE_ACCESS_TOKEN secret is not set in your repository
- The secret name is misspelled

**Solution**: Add the CLAUDE_ACCESS_TOKEN secret to your repository with your access token value.

## Example Workflow

```yaml
name: Claude Code with OAuth
on:
  issue_comment:
    types: [created]

jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Claude Code
        uses: jr413/claude-code-action@main
        with:
          use_oauth: "true"
          claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
```

## Alternative: Use Anthropic API Key

If OAuth authentication doesn't work, you can use a standard Anthropic API key instead:

```yaml
- name: Run Claude Code
  uses: jr413/claude-code-action@main
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```