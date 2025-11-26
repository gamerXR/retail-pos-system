#!/bin/bash

set -e

echo "🚀 Building NexPOS Client Reports Portal..."
echo "=========================================="

cd frontend-reports

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building production bundle..."
npm run build

echo "✅ Build complete!"
echo ""
echo "📁 Build output is in: frontend-reports/dist/"
echo ""
echo "Next steps:"
echo "1. Upload the contents of frontend-reports/dist/ to your web server"
echo "2. Configure your web server (nginx/Apache) to serve the files"
echo "3. Point report.nexpos.store DNS to your server"
echo ""
echo "See REPORTS_DEPLOYMENT.md for detailed instructions"
