#!/bin/bash

# This script will help you deploy to your VPS
# Run this on your VPS at 103.103.22.68

echo "=== NexPOS Deployment Script ==="

# Stop and remove any existing containers
echo "Stopping existing containers..."
docker stop nexpos 2>/dev/null || true
docker rm nexpos 2>/dev/null || true

# Pull the latest image
echo "Pulling Docker image..."
docker pull posxmhk/nexpos:latest

# Run the container
echo "Starting NexPOS..."
docker run -d \
  -p 4000:4000 \
  --name nexpos \
  --restart always \
  posxmhk/nexpos:latest

# Check if container is running
echo ""
echo "Container status:"
docker ps | grep nexpos

echo ""
echo "=== Deployment complete! ==="
echo "Your app should be running on http://103.103.22.68:4000"
