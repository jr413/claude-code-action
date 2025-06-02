import * as core from "@actions/core";
import * as github from "@actions/github";

interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Check if OAuth token is expired or about to expire
 * @param expiresAt - Expiration timestamp as string
 * @param bufferMinutes - Minutes before expiration to consider token as expired (default: 60)
 */
function isTokenExpired(
  expiresAt: string,
  bufferMinutes: number = 60,
): boolean {
  const expirationTime = parseInt(expiresAt);
  const currentTime = Date.now();
  const bufferTime = bufferMinutes * 60 * 1000; // Convert to milliseconds

  const isExpired = currentTime + bufferTime >= expirationTime;

  if (isExpired) {
    const timeUntilExpiry = expirationTime - currentTime;
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / (60 * 1000));

    if (minutesUntilExpiry > 0) {
      core.warning(`OAuth token will expire in ${minutesUntilExpiry} minutes`);
    } else {
      core.error(
        `OAuth token has been expired for ${Math.abs(minutesUntilExpiry)} minutes`,
      );
    }
  }

  return isExpired;
}

/**
 * Refresh OAuth tokens using the refresh token
 * Note: This is a placeholder implementation. The actual Claude OAuth API
 * endpoint and authentication flow would need to be documented by Anthropic.
 */
async function refreshOAuthTokens(_refreshToken: string): Promise<OAuthTokens> {
  // For now, we'll throw an error indicating manual refresh is needed
  // Once Claude's OAuth API is documented, this can be implemented properly

  core.error("\n⚠️  OAuth Token Expired - Manual Refresh Required ⚠️");
  core.error("=========================================");
  core.error("\nAutomatic OAuth token refresh is not yet implemented.");
  core.error("\nPlease follow these steps to manually refresh your tokens:");
  core.error("\n1. Open Claude AI in your browser: https://claude.ai");
  core.error(
    "2. Open Developer Tools (F12) and go to the 'Application' or 'Storage' tab",
  );
  core.error("3. Find the cookies/local storage containing OAuth tokens");
  core.error("4. Copy the following values:");
  core.error("   - Access Token (usually named 'access_token' or similar)");
  core.error("   - Refresh Token (usually named 'refresh_token' or similar)");
  core.error(
    "   - Expiration timestamp (usually named 'expires_at' or similar)",
  );
  core.error("\n5. Update your GitHub repository secrets:");
  core.error("   - Go to: Settings > Secrets and variables > Actions");
  core.error("   - Update CLAUDE_ACCESS_TOKEN with the new access token");
  core.error("   - Update CLAUDE_REFRESH_TOKEN with the new refresh token");
  core.error("   - Update CLAUDE_EXPIRES_AT with the new expiration timestamp");
  core.error("\n6. Re-run this workflow after updating the secrets");
  core.error("\nFor automated token refresh, run:");
  core.error("  npm run refresh-oauth-tokens");
  core.error("\n=========================================");

  throw new Error(
    "OAuth token expired. Please manually refresh tokens and update GitHub secrets (see error logs above for detailed instructions).",
  );

  // Future implementation would look like:
  /*
  const response = await fetch('https://api.claude.ai/oauth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh OAuth token: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: (Date.now() + data.expires_in * 1000).toString(),
  };
  */
}

/**
 * Update GitHub secrets with new OAuth tokens
 */
async function updateGitHubSecrets(
  tokens: OAuthTokens,
  githubToken: string,
  owner: string,
  repo: string,
): Promise<void> {
  const octokit = github.getOctokit(githubToken);

  // Get the repository public key for encrypting secrets
  const { data: _publicKey } = await octokit.rest.actions.getRepoPublicKey({
    owner,
    repo,
  });

  // Note: This requires libsodium for encryption
  // In a real implementation, you'd need to encrypt the secrets before updating
  core.warning(
    "Automatic secret update not implemented. Please update secrets manually:",
  );
  core.warning(
    `CLAUDE_ACCESS_TOKEN: ${tokens.access_token.substring(0, 10)}...`,
  );
  core.warning(
    `CLAUDE_REFRESH_TOKEN: ${tokens.refresh_token.substring(0, 10)}...`,
  );
  core.warning(`CLAUDE_EXPIRES_AT: ${tokens.expires_at}`);
}

/**
 * Get OAuth tokens with automatic refresh if needed
 */
export async function getOAuthTokens(): Promise<OAuthTokens | null> {
  const useOAuth = core.getInput("use_oauth") === "true";

  if (!useOAuth) {
    return null;
  }

  const accessToken = core.getInput("claude_access_token");
  const refreshToken = core.getInput("claude_refresh_token");
  const expiresAt = core.getInput("claude_expires_at");

  // Detailed error checking for missing OAuth credentials
  const missingCredentials: string[] = [];

  if (!accessToken) {
    missingCredentials.push("CLAUDE_ACCESS_TOKEN");
  }
  if (!refreshToken) {
    missingCredentials.push("CLAUDE_REFRESH_TOKEN");
  }
  if (!expiresAt) {
    missingCredentials.push("CLAUDE_EXPIRES_AT");
  }

  if (missingCredentials.length > 0) {
    core.error("Missing OAuth credentials. Please check your GitHub secrets:");
    missingCredentials.forEach((cred) => {
      core.error(`  - ${cred} is not set`);
    });
    core.error("\nTo fix this issue:");
    core.error(
      "1. Go to your repository's Settings > Secrets and variables > Actions",
    );
    core.error("2. Add the missing secrets with values from Claude AI");
    core.error(
      "3. See the README for detailed instructions on obtaining OAuth tokens",
    );

    throw new Error(
      `Missing OAuth credentials: ${missingCredentials.join(", ")}. When use_oauth is true, all OAuth tokens are required.`,
    );
  }

  // Log token expiration status
  const expirationTime = parseInt(expiresAt);
  const currentTime = Date.now();
  const hoursUntilExpiry = Math.floor(
    (expirationTime - currentTime) / (60 * 60 * 1000),
  );

  if (hoursUntilExpiry > 24) {
    core.info(
      `✅ OAuth token is valid for ${Math.floor(hoursUntilExpiry / 24)} days`,
    );
  } else if (hoursUntilExpiry > 0) {
    core.warning(`⚠️  OAuth token will expire in ${hoursUntilExpiry} hours`);
  }

  // Check if token is expired with 1-hour buffer
  if (isTokenExpired(expiresAt, 60)) {
    core.info(
      "OAuth token expired or expiring within 1 hour, attempting to refresh...",
    );

    try {
      const newTokens = await refreshOAuthTokens(refreshToken);

      // Update the tokens for the current run
      core.setSecret(newTokens.access_token);
      core.setSecret(newTokens.refresh_token);

      // Export for use in subsequent steps
      core.exportVariable("CLAUDE_ACCESS_TOKEN", newTokens.access_token);
      core.exportVariable("CLAUDE_REFRESH_TOKEN", newTokens.refresh_token);
      core.exportVariable("CLAUDE_EXPIRES_AT", newTokens.expires_at);

      // Try to update GitHub secrets (this requires additional permissions)
      const githubToken =
        core.getInput("github_token") || process.env.GITHUB_TOKEN;
      if (githubToken) {
        const [owner, repo] = process.env.GITHUB_REPOSITORY?.split("/") || [];
        if (owner && repo) {
          await updateGitHubSecrets(newTokens, githubToken, owner, repo);
        }
      }

      return newTokens;
    } catch (error) {
      core.error(`Failed to refresh OAuth token: ${error}`);
      throw error;
    }
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
  };
}
