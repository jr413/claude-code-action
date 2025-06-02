# Claude Code Action OAuth Setup Guide

This guide helps you set up OAuth authentication for Claude Code Action to avoid common authentication errors.

## 📋 Table of Contents

- [Why OAuth?](#why-oauth)
- [Getting OAuth Tokens](#getting-oauth-tokens)
- [Setting Up GitHub Secrets](#setting-up-github-secrets)
- [Token Refresh Process](#token-refresh-process)
- [Troubleshooting](#troubleshooting)
- [Automation Tools](#automation-tools)

## Why OAuth?

OAuth authentication provides:

- ✅ Higher rate limits
- ✅ More stable connection
- ✅ Better error handling
- ✅ Longer session duration

## Getting OAuth Tokens

### Method 1: Browser Developer Tools (Recommended)

1. **Login to Claude AI**

   - Go to https://claude.ai
   - Sign in with your account

2. **Open Developer Tools**

   - Chrome/Edge: Press `F12` or `Ctrl+Shift+I` (Mac: `Cmd+Option+I`)
   - Firefox: Press `F12` or `Ctrl+Shift+I` (Mac: `Cmd+Option+I`)

3. **Find the Tokens**

   **Option A: Check Cookies**

   - Go to `Application` tab (Chrome) or `Storage` tab (Firefox)
   - Expand `Cookies` → `https://claude.ai`
   - Look for cookies like:
     - `__Secure-next-auth.session-token`
     - Any cookie with a long alphanumeric value

   **Option B: Check Local Storage**

   - Go to `Application` → `Local Storage` → `https://claude.ai`
   - Look for keys containing `auth`, `token`, or `session`

   **Option C: Check Network Tab**

   - Go to `Network` tab
   - Refresh the page or interact with Claude
   - Look for API calls to `api.claude.ai`
   - Check request headers for `Authorization` or `Cookie` headers

4. **Extract Token Information**
   - Access Token: The main authentication token
   - Refresh Token: Used to renew the access token (might be the same as access token)
   - Expiration: Usually found as `expires_at` or calculated from `expires_in`

### Method 2: Using the Refresh Script

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the refresh script**

   ```bash
   npm run refresh-oauth-tokens
   ```

4. **Follow the prompts**
   - Enter the tokens you found
   - Choose to update GitHub secrets automatically or manually

## Setting Up GitHub Secrets

### Manual Setup

1. Go to your repository on GitHub
2. Navigate to `Settings` → `Secrets and variables` → `Actions`
3. Add or update these secrets:

   | Secret Name            | Description                    | Example                       |
   | ---------------------- | ------------------------------ | ----------------------------- |
   | `CLAUDE_ACCESS_TOKEN`  | The main authentication token  | `ey1234...`                   |
   | `CLAUDE_REFRESH_TOKEN` | Token for refreshing access    | `ey5678...` or same as access |
   | `CLAUDE_EXPIRES_AT`    | Unix timestamp in milliseconds | `1735689600000`               |

### Using GitHub CLI

```bash
# Set access token
gh secret set CLAUDE_ACCESS_TOKEN --body="your-access-token" -R owner/repo

# Set refresh token
gh secret set CLAUDE_REFRESH_TOKEN --body="your-refresh-token" -R owner/repo

# Set expiration timestamp
gh secret set CLAUDE_EXPIRES_AT --body="1735689600000" -R owner/repo
```

## Token Refresh Process

### Automatic Monitoring

The repository includes an OAuth token monitor workflow that:

- Runs every 6 hours
- Checks token expiration status
- Creates GitHub issues when tokens need attention

To enable:

1. Ensure `USE_OAUTH` variable is set to `true` in your repository
2. The monitoring workflow will run automatically

### Manual Refresh

When tokens expire:

1. **Run the refresh script**

   ```bash
   npm run refresh-oauth-tokens
   ```

2. **Get new tokens from Claude AI** (follow steps in [Getting OAuth Tokens](#getting-oauth-tokens))

3. **Update GitHub secrets** with the new values

## Troubleshooting

### Common Issues

#### "OAuth tokens are required when use_oauth is true"

- **Cause**: Missing one or more OAuth secrets
- **Solution**: Check all three secrets are set (ACCESS_TOKEN, REFRESH_TOKEN, EXPIRES_AT)

#### "OAuth token expired"

- **Cause**: Token has passed its expiration time
- **Solution**: Refresh tokens using the guide above

#### "Failed to update secrets"

- **Cause**: GitHub CLI not authenticated or missing permissions
- **Solution**:

  ```bash
  # Authenticate GitHub CLI
  gh auth login

  # Verify authentication
  gh auth status
  ```

### Debug Checklist

- [ ] All three OAuth secrets are set in GitHub
- [ ] Tokens are not expired (check CLAUDE_EXPIRES_AT)
- [ ] USE_OAUTH is set to 'true' in your workflow
- [ ] GitHub CLI is authenticated (for automatic updates)
- [ ] Repository permissions allow secret updates

## Automation Tools

### Token Refresh Script

Located at `scripts/refresh-oauth-tokens.js`:

- Interactive prompts for token input
- Automatic GitHub secrets update
- Token expiration calculation
- Validation and error handling

### OAuth Monitor Workflow

Located at `.github/workflows/oauth-token-monitor.yml`:

- Scheduled token status checks
- Automatic issue creation for expiring tokens
- Status notifications with action items

### Helper Functions

The improved OAuth implementation includes:

- Better error messages with specific missing credentials
- Extended buffer time (1 hour) before token expiration warnings
- Detailed logging of token status
- Step-by-step error recovery instructions

## Best Practices

1. **Set Calendar Reminders**

   - Set reminders before token expiration
   - Typical token lifetime: 24-72 hours

2. **Use the Monitoring Workflow**

   - Enable automatic monitoring
   - Respond to GitHub issues promptly

3. **Keep Tokens Secure**

   - Never commit tokens to the repository
   - Use GitHub secrets for all sensitive data
   - Rotate tokens regularly

4. **Document Your Process**
   - Keep notes on which cookies/storage keys work
   - Document any custom token extraction methods
   - Share findings with the team

## Need Help?

If you continue to experience OAuth issues:

1. Check the [GitHub Issues](https://github.com/anthropics/claude-code/issues) for similar problems
2. Enable debug logging in your workflow
3. Review the error messages - they now include detailed instructions
4. Create a new issue with:
   - The exact error message
   - Steps you've tried
   - Your workflow configuration (without secrets)

---

_Last updated: January 2025_
