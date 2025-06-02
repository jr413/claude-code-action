#!/usr/bin/env node

/**
 * Script to help refresh OAuth tokens
 * Run this locally and then update GitHub secrets
 */

const readline = require("readline");
const { execSync } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log("🔐 Claude OAuth Token Refresh Helper");
  console.log("=====================================\n");

  console.log("📋 Steps to get OAuth tokens from Claude AI:\n");
  console.log("1. Go to https://claude.ai and ensure you're logged in");
  console.log("2. Open browser Developer Tools:");
  console.log("   - Chrome/Edge: F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)");
  console.log("   - Firefox: F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)");
  console.log(
    '3. Navigate to the "Application" tab (Chrome) or "Storage" tab (Firefox)',
  );
  console.log('4. In the left sidebar, expand "Cookies" → "https://claude.ai"');
  console.log("5. Look for these cookies:");
  console.log(
    '   - Access Token: Look for cookies named like "__Secure-next-auth.session-token"',
  );
  console.log('   - Or check "Local Storage" for "auth" related entries');
  console.log(
    "\n⚠️  Note: Token names may vary. Look for long alphanumeric strings.",
  );
  console.log(
    "\n💡 Tip: You can also check the Network tab for API calls to find OAuth headers\n",
  );

  const accessToken = await question("Enter new Access Token: ");
  if (!accessToken.trim()) {
    console.error("\n❌ Error: Access token cannot be empty");
    process.exit(1);
  }

  const refreshToken =
    (await question(
      "Enter new Refresh Token (press Enter if same as access token): ",
    )) || accessToken;

  console.log("\n📅 Token Expiration Options:");
  console.log("1. Enter seconds until expiration (e.g., 3600 for 1 hour)");
  console.log('2. Enter hours with "h" suffix (e.g., 24h for 24 hours)');
  console.log('3. Enter days with "d" suffix (e.g., 7d for 7 days)');
  console.log("4. Press Enter for default (24 hours)\n");

  const expiresInput =
    (await question("Token expires in (default: 24h): ")) || "24h";

  let expiresInSeconds;
  if (expiresInput.endsWith("h")) {
    expiresInSeconds = parseInt(expiresInput) * 3600;
  } else if (expiresInput.endsWith("d")) {
    expiresInSeconds = parseInt(expiresInput) * 86400;
  } else {
    expiresInSeconds = parseInt(expiresInput) || 86400; // Default to 24 hours
  }

  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const expirationDate = new Date(expiresAt);

  console.log("\n📋 Your new tokens:");
  console.log("=================");
  console.log(
    `CLAUDE_ACCESS_TOKEN=${accessToken.substring(0, 20)}...${accessToken.substring(accessToken.length - 10)}`,
  );
  console.log(
    `CLAUDE_REFRESH_TOKEN=${refreshToken.substring(0, 20)}...${refreshToken.substring(refreshToken.length - 10)}`,
  );
  console.log(`CLAUDE_EXPIRES_AT=${expiresAt}`);
  console.log(
    `Token expires at: ${expirationDate.toLocaleString()} (${Math.floor(expiresInSeconds / 3600)} hours from now)`,
  );

  const updateGitHub = await question(
    "\n🚀 Update GitHub secrets automatically? (y/n): ",
  );

  if (updateGitHub.toLowerCase() === "y") {
    const owner = await question("GitHub owner/org: ");
    const repo = await question("GitHub repo name: ");

    console.log("\nTriggering GitHub workflow to update secrets...");

    console.log("\n🔄 Updating GitHub secrets...");

    try {
      // Check if gh CLI is installed
      try {
        execSync("gh --version", { stdio: "ignore" });
      } catch {
        console.error("❌ GitHub CLI (gh) is not installed.");
        console.log("\nInstall it from: https://cli.github.com/");
        console.log(
          "Or update secrets manually in GitHub Settings → Secrets\n",
        );
        displayManualInstructions();
        return;
      }

      // Update secrets using gh CLI
      console.log("Updating CLAUDE_ACCESS_TOKEN...");
      execSync(
        `gh secret set CLAUDE_ACCESS_TOKEN --body="${accessToken}" -R ${owner}/${repo}`,
        {
          stdio: "pipe",
        },
      );

      console.log("Updating CLAUDE_REFRESH_TOKEN...");
      execSync(
        `gh secret set CLAUDE_REFRESH_TOKEN --body="${refreshToken}" -R ${owner}/${repo}`,
        {
          stdio: "pipe",
        },
      );

      console.log("Updating CLAUDE_EXPIRES_AT...");
      execSync(
        `gh secret set CLAUDE_EXPIRES_AT --body="${expiresAt}" -R ${owner}/${repo}`,
        {
          stdio: "pipe",
        },
      );

      console.log("\n✅ All secrets updated successfully!");
      console.log(
        "\n🎉 Your Claude Code Action is now ready to use with the new OAuth tokens!",
      );
    } catch (error) {
      console.error("\n❌ Failed to update secrets:", error.message);
      console.log("\nCommon issues:");
      console.log(
        "- Make sure you're authenticated with gh CLI: gh auth login",
      );
      console.log(
        "- Check that you have permission to update secrets in the repository",
      );
      console.log("- Verify the repository name is correct\n");
      displayManualInstructions();
    }
  } else {
    displayManualInstructions();
  }

  function displayManualInstructions() {
    console.log("\n📝 Manual Update Instructions:");
    console.log("================================");
    console.log("1. Go to your GitHub repository");
    console.log('2. Click "Settings" tab');
    console.log('3. Navigate to "Secrets and variables" → "Actions"');
    console.log("4. Update or create these secrets:");
    console.log("   - CLAUDE_ACCESS_TOKEN");
    console.log("   - CLAUDE_REFRESH_TOKEN");
    console.log("   - CLAUDE_EXPIRES_AT");
    console.log(
      "\n⚠️  Copy the exact values shown above (including the full tokens)",
    );
    console.log(
      "\n💡 Pro tip: You can also use this command to set secrets manually:",
    );
    console.log(
      '   gh secret set SECRET_NAME --body="SECRET_VALUE" -R owner/repo\n',
    );
  }

  rl.close();
}

main().catch(console.error);
