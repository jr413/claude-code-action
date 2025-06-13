#!/bin/bash

echo "🚀 AI Video Platform Development Setup"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not installed. Please install PostgreSQL first.${NC}"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
if command_exists node; then
    echo -e "${GREEN}✓ Node.js is installed ($(node --version))${NC}"
else
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi

# Check npm
if command_exists npm; then
    echo -e "${GREEN}✓ npm is installed ($(npm --version))${NC}"
else
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

# Copy env file if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created .env file from .env.example - Please update with your values${NC}"
fi

cd ..

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Copy env file if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created .env file from .env.example - Please update with your values${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Update backend/.env with your database credentials and API keys"
echo "2. Update frontend/.env with your Stripe public key"
echo "3. Create the database: createdb ai_video_app"
echo "4. Apply database schema: psql -d ai_video_app -f database/schema.sql"
echo "5. (Optional) Load seed data: psql -d ai_video_app -f database/seed.sql"
echo ""
echo "🚀 To start development servers:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm run dev"
echo ""