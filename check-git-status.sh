#!/bin/bash

echo "🔍 Checking Git Status..."
echo "================================"
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Not a git repository!"
    echo ""
    echo "Initialize git with:"
    echo "  git init"
    echo "  git remote add origin YOUR_GITHUB_URL"
    echo ""
    exit 1
fi

echo "📊 Current Git Status:"
git status --short

echo ""
echo "📝 Files to be committed:"
echo ""
echo "Frontend (Client Reports Portal):"
echo "  - frontend-reports/        (entire folder)"
echo ""
echo "Backend (New Endpoints):"
echo "  - backend/auth/client_login.ts"
echo "  - backend/pos/client_reports.ts"
echo "  - backend/auth/auth.ts (modified)"
echo ""
echo "Documentation:"
echo "  - REPORTS_DEPLOYMENT.md"
echo "  - REPORTS_QUICK_START.md"
echo "  - GIT_PUSH_GUIDE.md"
echo "  - build-reports.sh"
echo ""
echo "================================"
echo ""
echo "Ready to commit? Run these commands:"
echo ""
echo "  git add ."
echo "  git commit -m \"Add client reports portal\""
echo "  git push origin main"
echo ""
