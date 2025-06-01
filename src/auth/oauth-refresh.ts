import * as core from "@actions/core";
import * as github from "@actions/github";

interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Check if OAuth token is expired or about to expire (within 5 minutes)
 */
function isTokenExpired(expiresAt: string): boolean {
  const expirationTime = parseInt(expiresAt);
  const currentTime = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  
  return currentTime + bufferTime >= expirationTime;
}

/**
 * Refresh OAuth tokens using the refresh token
 * Note: This is a placeholder implementation. The actual Claude OAuth API
 * endpoint and authentication flow would need to be documented by Anthropic.
 */
async function refreshOAuthTokens(refreshToken: string): Promise<OAuthTokens> {
  // For now, we'll throw an error indicating manual refresh is needed
  // Once Claude's OAuth API is documented, this can be implemented properly
  
  core.error("Automatic OAuth token refresh is not yet implemented.");
  core.error("Please manually refresh your tokens and update the GitHub secrets:");
  core.error("1. Go to Claude AI and get new OAuth tokens");
  core.error("2. Update CLAUDE_ACCESS_TOKEN secret");
  core.error("3. Update CLAUDE_REFRESH_TOKEN secret");
  core.error("4. Update CLAUDE_EXPIRES_AT secret");
  
  throw new Error(
    "OAuth token expired. Please manually refresh tokens and update GitHub secrets."
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
  repo: string
): Promise<void> {
  const octokit = github.getOctokit(githubToken);
  
  // Get the repository public key for encrypting secrets
  const { data: publicKey } = await octokit.rest.actions.getRepoPublicKey({
    owner,
    repo,
  });

  // Note: This requires libsodium for encryption
  // In a real implementation, you'd need to encrypt the secrets before updating
  core.warning("Automatic secret update not implemented. Please update secrets manually:");
  core.warning(`CLAUDE_ACCESS_TOKEN: ${tokens.access_token.substring(0, 10)}...`);
  core.warning(`CLAUDE_REFRESH_TOKEN: ${tokens.refresh_token.substring(0, 10)}...`);
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

  if (!accessToken || !refreshToken || !expiresAt) {
    throw new Error("OAuth tokens are required when use_oauth is true");
  }

  // Check if token is expired
  if (isTokenExpired(expiresAt)) {
    core.info("OAuth token expired or expiring soon, refreshing...");
    
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
      const githubToken = core.getInput("github_token") || process.env.GITHUB_TOKEN;
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