#!/bin/bash

set -e  # Exit on any error

echo "================================================"
echo "   NexPOS Deployment Script"
echo "   Deploying to VPS: 103.103.22.68"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please do not run as root. Run as: ./deploy.sh${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/8] Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed!${NC}"
    echo "Please install Node.js first:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt install -y nodejs"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed!${NC}"
    echo "Please install Docker first:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites found${NC}"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Docker: $(docker --version)"
echo ""

echo -e "${YELLOW}[2/8] Installing backend dependencies...${NC}"
cd backend
npm install
cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

echo -e "${YELLOW}[3/8] Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

echo -e "${YELLOW}[4/8] Building frontend...${NC}"
cd frontend
npm run build
cd ..
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

echo -e "${YELLOW}[5/8] Stopping existing containers...${NC}"
docker stop nexpos 2>/dev/null || true
docker rm nexpos 2>/dev/null || true
echo -e "${GREEN}✓ Cleaned up existing containers${NC}"
echo ""

echo -e "${YELLOW}[6/8] Building Docker image...${NC}"
docker build -t nexpos:latest .
echo -e "${GREEN}✓ Docker image built${NC}"
echo ""

echo -e "${YELLOW}[7/8] Starting NexPOS container...${NC}"
docker run -d \
  -p 4000:4000 \
  --name nexpos \
  --restart always \
  nexpos:latest

echo -e "${GREEN}✓ Container started${NC}"
echo ""

echo -e "${YELLOW}[8/8] Verifying deployment...${NC}"
sleep 5

if docker ps | grep -q nexpos; then
    echo -e "${GREEN}✓ Container is running${NC}"
    echo ""
    echo "Container details:"
    docker ps | grep nexpos
else
    echo -e "${RED}✗ Container failed to start${NC}"
    echo "Checking logs:"
    docker logs nexpos
    exit 1
fi

echo ""
echo "================================================"
echo -e "${GREEN}   Deployment Complete!${NC}"
echo "================================================"
echo ""
echo "Your app is running at:"
echo "  - Local: http://localhost:4000"
echo "  - VPS IP: http://103.103.22.68:4000"
echo "  - Domain (after DNS): http://www.nexpos.store"
echo ""
echo "To view logs:"
echo "  docker logs -f nexpos"
echo ""
echo "To restart:"
echo "  docker restart nexpos"
echo ""
echo "To stop:"
echo "  docker stop nexpos"
echo ""
