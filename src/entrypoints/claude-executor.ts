#!/usr/bin/env bun

/**
 * Direct Claude execution with enhanced OAuth support and API key management
 */

import * as core from "@actions/core";
import * as fs from "fs";
import { randomUUID } from "crypto";
import fetch from "node-fetch";
import { OAuthApiService } from "../oauth/oauth-api-service";
import { ApiKeyManager } from "../oauth/api-key-manager";

interface ClaudeRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  tools?: any[];
}

interface ClaudeResponse {
  content: Array<{
    type: string;
    text?: string;
  }>;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

async function executeClaudeWithOAuth(
  accessToken: string,
  request: ClaudeRequest,
  oauthService?: OAuthApiService,
): Promise<ClaudeResponse> {
  // Enhanced OAuth implementation with token validation and refresh
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "anthropic-version": "2023-06-01",
        "User-Agent": "claude-code-action/1.0.0",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Handle token expiration
      if (response.status === 401 && oauthService) {
        console.warn("OAuth token expired, attempting refresh...");
        // Token refresh logic would be handled by the calling function
        throw new Error(`OAuth token expired: ${response.status} ${errorText}`);
      }

      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    return (await response.json()) as ClaudeResponse;
  } catch (error) {
    console.error("OAuth execution failed:", error);
    throw error;
  }
}

async function executeClaudeWithAPIKey(
  apiKey: string,
  request: ClaudeRequest,
): Promise<ClaudeResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${errorText}`);
  }

  return (await response.json()) as ClaudeResponse;
}

async function run() {
  try {
    // Get inputs from environment variables
    const promptFile =
      process.env.PROMPT_FILE || "/tmp/claude-prompts/claude-prompt.txt";
    const useOAuth = process.env.USE_OAUTH === "true";
    const model = process.env.MODEL || "claude-3-5-sonnet-20241022";
    const maxTokens = parseInt(process.env.MAX_TOKENS || "4096");

    // Initialize OAuth service and API key manager
    const apiKeyManager = new ApiKeyManager();
    const oauthService = new OAuthApiService(apiKeyManager);

    // Read prompt from file
    if (!fs.existsSync(promptFile)) {
      throw new Error(`Prompt file not found: ${promptFile}`);
    }
    const prompt = fs.readFileSync(promptFile, "utf-8");

    // Prepare request
    const request: ClaudeRequest = {
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
    };

    let response: ClaudeResponse;

    if (useOAuth) {
      // Enhanced OAuth flow with API key management
      const userId = process.env.GITHUB_ACTOR || "github-action-user";
      const apiKeyId = process.env.CLAUDE_API_KEY_ID;
      let accessToken = process.env.CLAUDE_ACCESS_TOKEN || "";

      if (apiKeyId) {
        // Use managed API key
        console.log("Using managed OAuth API key...");
        const managedToken = await oauthService.getValidApiKey(
          "claude",
          userId,
          apiKeyId,
        );
        if (managedToken) {
          accessToken = managedToken;
        } else {
          throw new Error("Managed API key not found or expired");
        }
      } else if (!accessToken) {
        throw new Error(
          "claude_access_token or claude_api_key_id is required when use_oauth is true",
        );
      }

      try {
        response = await executeClaudeWithOAuth(
          accessToken,
          request,
          oauthService,
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("OAuth token expired") &&
          apiKeyId
        ) {
          // Attempt token refresh
          console.log("Attempting to refresh OAuth token...");
          try {
            const refreshedApiKeyId = await oauthService.refreshAccessToken(
              "claude",
              userId,
              `claude_refresh_${userId}`,
            );
            const refreshedToken = await oauthService.getValidApiKey(
              "claude",
              userId,
              refreshedApiKeyId,
            );
            if (refreshedToken) {
              response = await executeClaudeWithOAuth(
                refreshedToken,
                request,
                oauthService,
              );
            } else {
              throw new Error("Failed to obtain refreshed token");
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      // API key flow
      const apiKey = process.env.ANTHROPIC_API_KEY || "";
      if (!apiKey) {
        throw new Error(
          "anthropic_api_key is required when use_oauth is false",
        );
      }
      response = await executeClaudeWithAPIKey(apiKey, request);
    }

    // Process response
    const responseText = response.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    // Create execution report
    const executionReport = {
      type: "result",
      subtype: "success",
      cost_usd:
        (response.usage.input_tokens * 0.003 +
          response.usage.output_tokens * 0.015) /
        1000,
      is_error: false,
      duration_ms: Date.now() - startTime,
      num_turns: 1,
      result: responseText,
      total_cost:
        (response.usage.input_tokens * 0.003 +
          response.usage.output_tokens * 0.015) /
        1000,
      session_id: randomUUID(),
    };

    // Save execution report
    const outputFile = `/tmp/claude-execution-${Date.now()}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(executionReport, null, 2));

    core.setOutput("execution_file", outputFile);
    core.setOutput("conclusion", "success");
    core.setOutput("response", responseText);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Claude execution failed: ${errorMessage}`);

    // Create error report
    const errorReport = {
      type: "result",
      subtype: "error",
      cost_usd: 0,
      is_error: true,
      duration_ms: Date.now() - startTime,
      num_turns: 0,
      result: `Error: ${errorMessage}`,
      total_cost: 0,
      session_id: randomUUID(),
    };

    const outputFile = `/tmp/claude-execution-error-${Date.now()}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(errorReport, null, 2));

    core.setOutput("execution_file", outputFile);
    core.setOutput("conclusion", "failure");
    process.exit(1);
  }
}

const startTime = Date.now();

if (import.meta.main) {
  run();
}
