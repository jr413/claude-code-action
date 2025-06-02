#!/usr/bin/env bun

/**
 * Entry point for OAuth token refresh
 */

import { getOAuthTokens } from "../auth/oauth-refresh";
import * as core from "@actions/core";

async function run() {
  try {
    const tokens = await getOAuthTokens();

    if (tokens) {
      core.info("OAuth tokens validated/refreshed successfully");

      // Set outputs for use in subsequent steps
      core.setOutput("access_token", tokens.access_token);
      core.setOutput("refresh_token", tokens.refresh_token);
      core.setOutput("expires_at", tokens.expires_at);
    }
  } catch (error) {
    core.setFailed(`OAuth refresh failed: ${error}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  run();
}
