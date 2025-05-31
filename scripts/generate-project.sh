#!/bin/bash
set -e

# Read environment variables
PROJECT_TYPE="${PROJECT_TYPE:-todo-app}"
TECH_STACK="${TECH_STACK:-react-node}"

mkdir -p output

# Read input files
REQUIREMENTS=""
TECH_SPEC=""
MOCKUP=""

if [ -f "temp/requirements.md" ]; then
  REQUIREMENTS=$(cat temp/requirements.md)
  echo "📋 Requirements loaded"
fi

if [ -f "temp/tech-spec.yaml" ]; then
  TECH_SPEC=$(cat temp/tech-spec.yaml)
  echo "⚙️ Tech spec loaded"
fi

if [ -f "temp/mockup.md" ]; then
  MOCKUP=$(cat temp/mockup.md)
  echo "🎨 Mockup loaded"
fi

# Function to get fresh OAuth token
get_oauth_token() {
  echo "🔐 Getting fresh OAuth token..."
  
  # Try client_credentials grant
  TOKEN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "https://api.anthropic.com/v1/oauth/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=client_credentials&client_id=$CLAUDE_CLIENT_ID&client_secret=$CLAUDE_CLIENT_SECRET")
  
  # Extract HTTP status and response body
  HTTP_STATUS=$(echo "$TOKEN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
  RESPONSE_BODY=$(echo "$TOKEN_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')
  
  echo "OAuth HTTP Status: $HTTP_STATUS"
  echo "OAuth Response: $RESPONSE_BODY"
  
  if [ "$HTTP_STATUS" = "200" ]; then
    ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.access_token // empty')
    
    if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
      echo "✅ OAuth token obtained successfully"
      return 0
    fi
  fi
  
  echo "❌ Failed to get OAuth token"
  return 1
}

# Function to call Claude API with retry logic
call_claude_api() {
  local attempt=1
  local max_attempts=3
  
  while [ $attempt -le $max_attempts ]; do
    echo "🤖 Calling Claude API (attempt $attempt/$max_attempts)..."
    
    if get_oauth_token; then
      # Create prompt for Claude
      cat > prompt.txt << 'PROMPT_EOF'
Based on these requirements, generate a complete PROJECT_TYPE_PLACEHOLDER project with TECH_STACK_PLACEHOLDER tech stack.

Please provide a complete project structure with all necessary files. Format your response with clear file separators like:

=== filename.ext ===
[file content]
=== END ===

Requirements:
PROMPT_EOF
      
      # Replace placeholders with actual values
      sed -i "s/PROJECT_TYPE_PLACEHOLDER/${PROJECT_TYPE}/g" prompt.txt
      sed -i "s/TECH_STACK_PLACEHOLDER/${TECH_STACK}/g" prompt.txt
      
      echo "$REQUIREMENTS" >> prompt.txt
      echo -e "\n\nTech Spec:" >> prompt.txt
      echo "$TECH_SPEC" >> prompt.txt
      echo -e "\n\nMockup:" >> prompt.txt
      echo "$MOCKUP" >> prompt.txt
      echo -e "\n\nGenerate complete project structure with all necessary files including package.json, Dockerfile, source code, and documentation." >> prompt.txt
      
      # Call Claude API with OAuth token
      # First, escape the prompt content for JSON
      PROMPT_CONTENT=$(cat prompt.txt | jq -Rs .)
      
      # Create the JSON payload
      cat > api_payload.json << EOF
{
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 8000,
  "messages": [{
    "role": "user",
    "content": ${PROMPT_CONTENT}
  }]
}
EOF
      
      HTTP_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "https://api.anthropic.com/v1/messages" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "anthropic-version: 2023-06-01" \
        -d @api_payload.json)
      
      # Extract HTTP status and response body
      HTTP_STATUS=$(echo "$HTTP_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
      RESPONSE_BODY=$(echo "$HTTP_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')
      
      echo "Claude API HTTP Status: $HTTP_STATUS"
      
      if [ "$HTTP_STATUS" = "200" ]; then
        # Extract Claude's response
        CLAUDE_RESPONSE=$(echo "$RESPONSE_BODY" | jq -r '.content[0].text // empty')
        
        if [ -n "$CLAUDE_RESPONSE" ]; then
          echo "✅ Claude response received"
          echo "$CLAUDE_RESPONSE" > output/claude_response.txt
          
          # Parse and create files from response
          echo "📁 Creating project files..."
          
          current_file=""
          in_file=false
          
          while IFS= read -r line; do
            if echo "$line" | grep -q "^=== .* ===$"; then
              # Start of a new file
              if [ "$in_file" = true ] && [ -n "$current_file" ]; then
                echo "✅ Created: $current_file"
              fi
              
              filename=$(echo "$line" | sed 's/^=== \(.*\) ===$/\1/' | xargs)
              current_file="output/$filename"
              mkdir -p "$(dirname "$current_file")"
              > "$current_file"
              in_file=true
            elif echo "$line" | grep -q "^=== END ===$"; then
              # End of current file
              if [ "$in_file" = true ] && [ -n "$current_file" ]; then
                echo "✅ Created: $current_file"
              fi
              in_file=false
              current_file=""
            elif [ "$in_file" = true ] && [ -n "$current_file" ]; then
              # Content of current file
              echo "$line" >> "$current_file"
            fi
          done < output/claude_response.txt
          
          # Create final file if still in progress
          if [ "$in_file" = true ] && [ -n "$current_file" ]; then
            echo "✅ Created: $current_file"
          fi
          
          echo "✅ Project generation complete!"
          return 0
        else
          echo "❌ Empty response from Claude"
        fi
      else
        echo "❌ Claude API call failed"
        echo "Response: $RESPONSE_BODY"
      fi
    else
      echo "❌ Could not obtain OAuth token"
    fi
    
    # Increment attempt counter
    attempt=$((attempt + 1))
    
    if [ $attempt -le $max_attempts ]; then
      echo "⏳ Waiting 5 seconds before retry..."
      sleep 5
    fi
  done
  
  echo "❌ All attempts failed"
  return 1
}

# Try API call or use fallback
if ! call_claude_api; then
  echo "🔄 Using fallback method without OAuth..."
  
  # Create fallback structure based on project type
  case "${PROJECT_TYPE}" in
    "todo-app")
      mkdir -p output/src/components output/src/api
      
      # Create basic package.json
      cat > output/package.json << 'FALLBACK_EOF'
{
  "name": "todo-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "react": "^18.2.0",
    "next": "^13.5.0"
  }
}
FALLBACK_EOF
      
      # Create README
      cat > output/README.md << 'FALLBACK_EOF'
# Todo App

This is a todo application generated by Claude Code Action.

## Setup
1. Run `npm install`
2. Run `npm run dev`
3. Open http://localhost:3000
FALLBACK_EOF
      
      echo "✅ Created fallback todo-app structure"
      ;;
      
    "ecommerce")
      mkdir -p output/src/products output/src/cart output/src/checkout
      
      cat > output/package.json << 'FALLBACK_EOF'
{
  "name": "ecommerce-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "react": "^18.2.0",
    "next": "^13.5.0"
  }
}
FALLBACK_EOF
      
      echo "✅ Created fallback ecommerce structure"
      ;;
      
    *)
      mkdir -p output/src
      echo "# ${PROJECT_TYPE}" > output/README.md
      echo "✅ Created basic fallback structure"
      ;;
  esac
fi

# List generated files
echo -e "\n📂 Generated files:"
find output -type f | sort