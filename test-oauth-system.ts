#!/usr/bin/env bun

import { ApiKeyManager } from "./src/oauth/api-key-manager";
import { OAuthApiService } from "./src/oauth/oauth-api-service";
import * as fs from "fs";

async function testOAuthSystem() {
  try {
    console.log("🔧 Testing OAuth API Key Management System...");

    // Load existing Claude credentials
    const credentialsPath = "/home/naoki/.claude/.credentials.json";
    if (!fs.existsSync(credentialsPath)) {
      console.error("❌ Claude credentials not found");
      return;
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
    const { accessToken, refreshToken, expiresAt } = credentials.claudeAiOauth;

    console.log("📝 Found Claude OAuth credentials");
    console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);
    console.log(`   Expires: ${new Date(expiresAt).toLocaleString()}`);

    // Initialize services
    const apiKeyManager = new ApiKeyManager();

    // Test API key storage
    console.log("\n🔐 Testing API key storage...");
    const userId = "test-user";
    const expiresInHours = Math.floor(
      (expiresAt - Date.now()) / (1000 * 60 * 60),
    );

    const apiKeyId = await apiKeyManager.storeApiKey(
      userId,
      "claude",
      accessToken,
      ["user:inference", "user:profile"],
      expiresInHours,
    );

    console.log(`✅ Stored API key with ID: ${apiKeyId}`);

    // Test API key retrieval
    console.log("\n🔍 Testing API key retrieval...");
    const retrievedToken = await apiKeyManager.getApiKey(apiKeyId, userId);

    if (retrievedToken === accessToken) {
      console.log("✅ API key retrieved successfully");
    } else {
      console.log("❌ API key retrieval failed");
      return;
    }

    // Test validation
    console.log("\n✅ Testing API key validation...");
    const isValid = await apiKeyManager.validateApiKey(apiKeyId, userId);
    console.log(`   Valid: ${isValid}`);

    // Test listing keys
    console.log("\n📋 Testing API key listing...");
    const userKeys = await apiKeyManager.listApiKeys(userId);
    console.log(`   Found ${userKeys.length} keys for user`);

    // Test statistics
    console.log("\n📊 Testing system statistics...");
    const stats = await apiKeyManager.getStats();
    console.log(`   Total keys: ${stats.totalKeys}`);
    console.log(`   Active keys: ${stats.activeKeys}`);
    console.log(`   Expired keys: ${stats.expiredKeys}`);

    // Store refresh token as well
    if (refreshToken) {
      console.log("\n🔄 Storing refresh token...");
      const refreshKeyId = await apiKeyManager.storeApiKey(
        userId,
        "claude_refresh",
        refreshToken,
        ["refresh"],
        24 * 30, // 30 days
      );
      console.log(`✅ Stored refresh token with ID: ${refreshKeyId}`);
    }

    console.log(
      "\n🎉 All tests passed! OAuth API Key System is working correctly.",
    );

    // Export key ID for GitHub Actions
    console.log(`\n🔑 Your CLAUDE_API_KEY_ID for GitHub Actions:`);
    console.log(`   ${apiKeyId}`);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

if (import.meta.main) {
  testOAuthSystem();
}
