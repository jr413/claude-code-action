#!/usr/bin/env bun

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

async function refreshTokens() {
  const clientId = process.env.CLAUDE_CLIENT_ID;
  const clientSecret = process.env.CLAUDE_CLIENT_SECRET;
  const refreshToken = process.env.CLAUDE_REFRESH_TOKEN;
  const expiresAt = process.env.CLAUDE_EXPIRES_AT;

  if (!clientId || !clientSecret || !refreshToken) {
    console.log("OAuth credentials not provided, skipping token refresh");
    return;
  }

  // Check if token is still valid (expires in next 5 minutes)
  if (expiresAt) {
    const expirationTime = parseInt(expiresAt) * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (expirationTime > now + fiveMinutes) {
      console.log("Token is still valid, no refresh needed");
      return;
    }
  }

  try {
    console.log("Refreshing OAuth tokens...");
    
    const response = await fetch("https://api.anthropic.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }

    const data: RefreshTokenResponse = await response.json();
    
    // Set environment variables for the next step
    console.log(`::set-env name=CLAUDE_ACCESS_TOKEN::${data.access_token}`);
    console.log(`::set-env name=CLAUDE_REFRESH_TOKEN::${data.refresh_token}`);
    console.log(`::set-env name=CLAUDE_EXPIRES_AT::${Math.floor(Date.now() / 1000) + data.expires_in}`);
    
    console.log("OAuth tokens refreshed successfully");
  } catch (error) {
    console.error("Failed to refresh OAuth tokens:", error);
    // Don't fail the workflow, just use existing tokens
  }
}

refreshTokens().catch(console.error);