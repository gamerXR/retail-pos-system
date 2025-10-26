# Quick Deployment Guide

## Fastest Way to Deploy (Recommended)

### 1. Deploy Backend to Encore Cloud (5 minutes)

```bash
# Install Encore CLI
curl -L https://encore.dev/install.sh | bash

# Login
encore auth login

# Create app
encore app create

# Deploy
encore deploy
```

**Note your backend URL**: `https://your-app-name.encr.app`

### 2. Build & Deploy Frontend to Hostinger (10 minutes)

```bash
# Create production config
echo "VITE_API_URL=https://your-app-name.encr.app" > frontend/.env.production

# Build frontend
cd frontend
npm install
npm run build

# Upload the 'dist' folder to Hostinger via cPanel File Manager or FTP
# Location: public_html/
```

### 3. Configure Hostinger

Create `.htaccess` in `public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Done!** Your app is live.

## Alternative: Self-Host on VPS

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed VPS setup instructions.

## Update Deployment

### Update Backend (Encore Cloud):
```bash
encore deploy
```

### Update Frontend:
```bash
cd frontend
npm run build
# Upload dist folder to Hostinger
```

## Cost Summary

**Option 1: Encore Cloud + Hostinger**
- Encore Cloud: Free tier or $99/month
- Hostinger: $3-10/month
- Total: $3-10/month (free tier) or $102-109/month (paid)

**Option 2: VPS (Self-hosted)**
- VPS: $12-20/month
- Hostinger (optional): $3-10/month
- Total: $12-30/month

## Need Help?

- Full documentation: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Encore docs: https://encore.dev/docs
- Issues: Check browser console and backend logs
