#!/bin/bash

set -e

echo "======================================"
echo "Building Retail POS Frontend"
echo "======================================"

if [ -z "$BACKEND_API_URL" ]; then
  echo ""
  echo "⚠️  WARNING: BACKEND_API_URL environment variable is not set!"
  echo "    The frontend will use relative URL '/api' by default."
  echo "    To set a custom backend URL, run:"
  echo "    export BACKEND_API_URL=https://your-backend-url.com"
  echo ""
  read -p "Continue with default '/api'? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Build cancelled."
    exit 1
  fi
fi

cd frontend

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Building frontend for production..."
if [ -n "$BACKEND_API_URL" ]; then
  echo "Using backend URL: $BACKEND_API_URL"
  VITE_API_URL=$BACKEND_API_URL npm run build
else
  echo "Using default backend URL: /api (relative)"
  npm run build
fi

echo ""
echo "======================================"
echo "✅ Build complete!"
echo "======================================"
echo ""
echo "Built files are in: frontend/dist/"
echo ""
echo "To deploy to cPanel/Hostinger:"
echo "1. Upload all files from frontend/dist/ to public_html/"
echo "2. Upload the .htaccess file to public_html/"
echo "3. Ensure your backend API is accessible"
echo ""
