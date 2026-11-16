#!/bin/bash

# Life Beyond Earth - One-Command Local Startup
# This script starts both the backend API and web-app in development mode

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Life Beyond Earth - Local Development Startup${NC}\n"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js 18+ from https://nodejs.org${NC}"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Python 3 not found. Please install Python 3.10+ from https://www.python.org${NC}"
    exit 1
fi

# Setup backend
echo -e "${BLUE}📦 Setting up backend...${NC}"
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo -e "${GREEN}✓ Creating Python virtual environment${NC}"
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate 2>/dev/null || . .venv/Scripts/activate 2>/dev/null

# Install dependencies
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✓ Installing Python dependencies${NC}"
    pip install -q -r requirements.txt
fi

# Start backend in background
echo -e "${GREEN}✓ Starting FastAPI backend on http://localhost:8000${NC}"
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Setup frontend
echo -e "${BLUE}📦 Setting up web-app...${NC}"
cd ../web-app

# Install dependencies
if [ -f "package.json" ]; then
    npm ci -q 2>/dev/null || npm install -q
fi

# Start web-app in background
echo -e "${GREEN}✓ Starting React dev server on http://localhost:5173${NC}"
npm run dev &
FRONTEND_PID=$!

# Print instructions
echo -e "\n${GREEN}✅ Life Beyond Earth is running!${NC}"
echo -e "\nAccess the application at:"
echo -e "  ${BLUE}Web App:  http://localhost:5173${NC}"
echo -e "  ${BLUE}API Docs: http://localhost:8000/docs${NC}\n"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Handle cleanup
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

trap cleanup EXIT INT TERM

# Wait for both processes
wait
