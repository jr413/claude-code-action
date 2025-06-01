#!/usr/bin/env node

/**
 * Script to help refresh OAuth tokens
 * Run this locally and then update GitHub secrets
 */

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🔐 Claude OAuth Token Refresh Helper\n');
  
  console.log('Steps to get new tokens:');
  console.log('1. Go to https://claude.ai');
  console.log('2. Open browser DevTools (F12)');
  console.log('3. Go to Application/Storage → Cookies');
  console.log('4. Look for authentication cookies\n');
  
  const accessToken = await question('Enter new Access Token: ');
  const refreshToken = await question('Enter new Refresh Token: ');
  const expiresIn = await question('Expires in (seconds, default 3600): ') || '3600';
  
  const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
  
  console.log('\n📋 Your new tokens:');
  console.log('=================');
  console.log(`CLAUDE_ACCESS_TOKEN=${accessToken}`);
  console.log(`CLAUDE_REFRESH_TOKEN=${refreshToken}`);
  console.log(`CLAUDE_EXPIRES_AT=${expiresAt}`);
  
  const updateGitHub = await question('\nUpdate GitHub secrets automatically? (y/n): ');
  
  if (updateGitHub.toLowerCase() === 'y') {
    const owner = await question('GitHub owner/org: ');
    const repo = await question('GitHub repo name: ');
    
    console.log('\nTriggering GitHub workflow to update secrets...');
    
    try {
      execSync(`gh workflow run oauth-token-updater.yml -R ${owner}/${repo} -f access_token="${accessToken}" -f refresh_token="${refreshToken}" -f expires_at="${expiresAt}"`, {
        stdio: 'inherit'
      });
      
      console.log('✅ Workflow triggered! Check GitHub Actions for status.');
    } catch (error) {
      console.error('❌ Failed to trigger workflow:', error.message);
      console.log('\nPlease update secrets manually in GitHub Settings → Secrets');
    }
  } else {
    console.log('\nPlease update these secrets manually in:');
    console.log('GitHub → Settings → Secrets and variables → Actions');
  }
  
  rl.close();
}

main().catch(console.error);