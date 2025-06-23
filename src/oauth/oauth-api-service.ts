#!/usr/bin/env bun

/**
 * OAuth API Service - Handles OAuth authentication flow and API key issuance
 */

import { ApiKeyManager } from "./api-key-manager";
import * as crypto from "crypto";
import fetch from "node-fetch";

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  scope: string[];
}

interface UserInfo {
  id: string;
  email?: string;
  name?: string;
  provider: string;
}

export class OAuthApiService {
  private apiKeyManager: ApiKeyManager;
  private oauthConfigs: Record<string, OAuthConfig>;

  constructor(apiKeyManager?: ApiKeyManager) {
    this.apiKeyManager = apiKeyManager || new ApiKeyManager();
    this.oauthConfigs = {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        redirectUri: process.env.GITHUB_REDIRECT_URI || "",
        authorizationUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        scope: ["read:user", "user:email"]
      },
      claude: {
        clientId: process.env.CLAUDE_CLIENT_ID || "",
        clientSecret: process.env.CLAUDE_CLIENT_SECRET || "",
        redirectUri: process.env.CLAUDE_REDIRECT_URI || "",
        authorizationUrl: "https://claude.ai/oauth/authorize",
        tokenUrl: "https://claude.ai/oauth/token",
        scope: ["api:read", "api:write"]
      }
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(provider: string, state?: string): string {
    const config = this.oauthConfigs[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope.join(" "),
      response_type: "code",
      state: state || crypto.randomBytes(16).toString("hex")
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    provider: string,
    code: string,
    _state: string
  ): Promise<OAuthTokenResponse> {
    const config = this.oauthConfigs[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code"
    });

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth token exchange failed: ${response.status} ${errorText}`);
    }

    return await response.json() as OAuthTokenResponse;
  }

  /**
   * Get user information from OAuth provider
   */
  async getUserInfo(provider: string, accessToken: string): Promise<UserInfo> {
    switch (provider) {
      case "github":
        return await this.getGitHubUserInfo(accessToken);
      case "claude":
        return await this.getClaudeUserInfo(accessToken);
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  private async getGitHubUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get GitHub user info: ${response.status}`);
    }

    const userData = await response.json() as any;
    return {
      id: userData.id.toString(),
      email: userData.email,
      name: userData.name || userData.login,
      provider: "github"
    };
  }

  private async getClaudeUserInfo(accessToken: string): Promise<UserInfo> {
    // Note: This is experimental - actual Claude.ai user endpoint may differ
    const response = await fetch("https://claude.ai/api/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get Claude user info: ${response.status}`);
    }

    const userData = await response.json() as any;
    return {
      id: userData?.id || userData?.user_id || "unknown",
      email: userData?.email,
      name: userData?.name,
      provider: "claude"
    };
  }

  /**
   * Complete OAuth flow and issue API key
   */
  async completeOAuthFlow(
    provider: string,
    code: string,
    state: string
  ): Promise<{
    apiKeyId: string;
    userInfo: UserInfo;
    expiresAt: number;
  }> {
    // Exchange code for token
    const tokenResponse = await this.exchangeCodeForToken(provider, code, state);
    
    // Get user information
    const userInfo = await this.getUserInfo(provider, tokenResponse.access_token);
    
    // Store the access token as an API key
    const expiresInHours = Math.floor(tokenResponse.expires_in / 3600) || 24;
    const apiKeyId = await this.apiKeyManager.storeApiKey(
      userInfo.id,
      provider,
      tokenResponse.access_token,
      this.oauthConfigs[provider]?.scope || [],
      expiresInHours
    );

    // If refresh token is available, store it separately
    if (tokenResponse.refresh_token) {
      await this.apiKeyManager.storeApiKey(
        userInfo.id,
        `${provider}_refresh`,
        tokenResponse.refresh_token,
        ["refresh"],
        24 * 30 // 30 days for refresh token
      );
    }

    return {
      apiKeyId,
      userInfo,
      expiresAt: Date.now() + (expiresInHours * 60 * 60 * 1000)
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    provider: string,
    userId: string,
    refreshTokenId: string
  ): Promise<string> {
    const config = this.oauthConfigs[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const refreshToken = await this.apiKeyManager.getApiKey(refreshTokenId, userId);
    if (!refreshToken) {
      throw new Error("Refresh token not found or expired");
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    });

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenResponse = await response.json() as OAuthTokenResponse;
    
    // Store new access token
    const expiresInHours = Math.floor(tokenResponse.expires_in / 3600) || 24;
    const newApiKeyId = await this.apiKeyManager.storeApiKey(
      userId,
      provider,
      tokenResponse.access_token,
      config.scope,
      expiresInHours
    );

    return newApiKeyId;
  }

  /**
   * Validate and retrieve API key for use
   */
  async getValidApiKey(
    provider: string,
    userId: string,
    apiKeyId: string
  ): Promise<string | null> {
    try {
      return await this.apiKeyManager.getApiKey(apiKeyId, userId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("expired")) {
        // Try to refresh the token if possible
        const refreshTokenId = `${provider}_refresh_${userId}`;
        try {
          const newApiKeyId = await this.refreshAccessToken(provider, userId, refreshTokenId);
          return await this.apiKeyManager.getApiKey(newApiKeyId, userId);
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * Revoke API key and associated tokens
   */
  async revokeApiKey(
    provider: string,
    userId: string,
    apiKeyId: string
  ): Promise<boolean> {
    // Delete the API key from storage
    const deleted = await this.apiKeyManager.deleteApiKey(apiKeyId, userId);
    
    // Also try to delete associated refresh token
    const refreshTokenId = `${provider}_refresh_${userId}`;
    await this.apiKeyManager.deleteApiKey(refreshTokenId, userId);
    
    return deleted;
  }

  /**
   * Get API key statistics for a user
   */
  async getUserApiKeys(userId: string) {
    return await this.apiKeyManager.listApiKeys(userId);
  }

  /**
   * Cleanup expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    return await this.apiKeyManager.cleanupExpiredKeys();
  }
}