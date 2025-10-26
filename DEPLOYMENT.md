# Deployment Guide for Retail POS System

This guide will walk you through deploying your Encore.ts Retail POS System to your own domain on Hostinger and a VPS.

## Architecture Overview

Your application consists of two parts:
- **Frontend** (React + Vite): Can be deployed to Hostinger shared hosting
- **Backend** (Encore.ts + PostgreSQL): Requires a VPS (DigitalOcean, AWS, Linode, etc.)

## Part 1: Backend Deployment (VPS Required)

### Option A: Deploy to Encore Cloud (Recommended - Easiest)

1. **Install Encore CLI** (if not already installed):
   ```bash
   curl -L https://encore.dev/install.sh | bash
   ```

2. **Login to Encore**:
   ```bash
   encore auth login
   ```

3. **Create Encore app** (from your project root):
   ```bash
   encore app create
   ```

4. **Deploy to Encore Cloud**:
   ```bash
   encore deploy
   ```

5. **Get your backend URL** (will be something like):
   ```
   https://your-app-name.encr.app
   ```

6. **Update frontend config** with your production backend URL (see Part 2).

### Option B: Self-Host on VPS (Advanced)

If you prefer to self-host the backend:

#### Prerequisites
- A VPS (Ubuntu 22.04 recommended) with at least 2GB RAM
- Domain or subdomain pointing to your VPS (e.g., `api.yourdomain.com`)
- SSH access to your VPS

#### Step 1: Prepare VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Install PostgreSQL (or use Docker)
sudo apt install postgresql postgresql-contrib -y
```

#### Step 2: Setup PostgreSQL

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE retail_pos;
CREATE USER posuser WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE retail_pos TO posuser;
\q
```

#### Step 3: Build Backend Docker Image

On your **local machine**, in the project directory:

```bash
# Install Encore CLI if not already
curl -L https://encore.dev/install.sh | bash

# Build Docker image
encore build docker retail-pos-backend:latest
```

This creates a Docker image. Now push it to Docker Hub or copy to your VPS:

```bash
# Tag for Docker Hub
docker tag retail-pos-backend:latest your-dockerhub-username/retail-pos-backend:latest

# Push to Docker Hub
docker push your-dockerhub-username/retail-pos-backend:latest
```

#### Step 4: Deploy on VPS

Create `docker-compose.yml` on your VPS:

```yaml
version: '3.8'
services:
  backend:
    image: your-dockerhub-username/retail-pos-backend:latest
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://posuser:your-secure-password@db:5432/retail_pos
      - ENCORE_RUNTIME_ENVIRONMENT=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=retail_pos
      - POSTGRES_USER=posuser
      - POSTGRES_PASSWORD=your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Run the backend:

```bash
docker-compose up -d
```

#### Step 5: Setup Nginx Reverse Proxy (for HTTPS)

```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/retail-pos-api
```

Add this configuration:

```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/retail-pos-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com
```

Your backend will now be available at `https://api.yourdomain.com`

## Part 2: Frontend Deployment (Hostinger)

### Step 1: Build Frontend for Production

On your **local machine**:

```bash
# Navigate to frontend directory
cd /path/to/your/project

# Create production environment file
echo "VITE_API_URL=https://your-backend-url" > frontend/.env.production

# If using Encore Cloud:
# VITE_API_URL=https://your-app-name.encr.app

# If using VPS:
# VITE_API_URL=https://api.yourdomain.com

# Install dependencies (if not done)
npm install

# Build frontend
cd frontend
npm run build
```

This creates a `dist` folder with your production files.

### Step 2: Upload to Hostinger

#### Via cPanel File Manager:

1. Login to your Hostinger cPanel
2. Go to **File Manager**
3. Navigate to `public_html` (or your domain's directory)
4. Delete default files (index.html, etc.)
5. Click **Upload** and select all files from the `frontend/dist` folder
6. Upload all files and folders

#### Via FTP (recommended for faster upload):

1. Get FTP credentials from Hostinger dashboard
2. Use FileZilla or similar FTP client
3. Connect to your server
4. Navigate to `public_html`
5. Upload all files from `frontend/dist`

### Step 3: Configure .htaccess for React Router

Create/edit `.htaccess` in your `public_html` folder:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## Part 3: DNS Configuration

### If Backend on VPS:

Point your subdomain to the VPS:
- Type: `A Record`
- Host: `api` (or your chosen subdomain)
- Value: Your VPS IP address
- TTL: 3600

### If Frontend on Hostinger:

Point your main domain to Hostinger:
- Type: `A Record`
- Host: `@` (or `www`)
- Value: Your Hostinger server IP (from cPanel)
- TTL: 3600

## Part 4: Environment Variables & Secrets

### Backend Secrets:

If using Encore Cloud, set secrets via CLI:
```bash
encore secret set --type prod SecretName
```

If self-hosting, add to `docker-compose.yml` environment section.

### Frontend Environment:

Update `frontend/.env.production` before each build:
```env
VITE_API_URL=https://api.yourdomain.com
```

## Part 5: Testing Your Deployment

1. **Test Backend**:
   ```bash
   curl https://api.yourdomain.com/health
   ```

2. **Test Frontend**:
   - Visit your domain in browser
   - Check browser console for errors
   - Try logging in

3. **Check CORS**:
   - Ensure backend allows your frontend domain
   - The backend's `encore.app` file already includes CORS config

## Part 6: Continuous Deployment (Optional)

### Frontend Updates:

```bash
# 1. Build locally
cd frontend
npm run build

# 2. Upload dist folder to Hostinger
# (Use FTP or File Manager)
```

### Backend Updates (Encore Cloud):

```bash
encore deploy
```

### Backend Updates (Self-hosted):

```bash
# 1. Build new Docker image
encore build docker retail-pos-backend:latest

# 2. Tag and push
docker tag retail-pos-backend:latest your-dockerhub-username/retail-pos-backend:latest
docker push your-dockerhub-username/retail-pos-backend:latest

# 3. On VPS, pull and restart
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### Frontend shows blank page:
- Check browser console for errors
- Verify `VITE_API_URL` is correct in build
- Check `.htaccess` is properly configured

### CORS errors:
- Verify backend `encore.app` includes your domain in `allow_origins_with_credentials`
- Check Network tab in browser DevTools

### Backend not connecting to database:
- Verify DATABASE_URL environment variable
- Check PostgreSQL is running
- Verify firewall allows connections on port 5432

### SSL/HTTPS issues:
- Ensure Certbot successfully created certificates
- Check Nginx configuration
- Verify DNS records are correct

## Cost Estimate

- **Hostinger Shared Hosting**: ~$3-10/month (for frontend)
- **VPS (DigitalOcean/Linode)**: ~$12-20/month (for backend + database)
- **Encore Cloud**: Free tier available, paid plans start at $99/month
- **Domain**: ~$10-15/year

## Alternative: All-in-One VPS Deployment

You can host both frontend and backend on a single VPS:

1. Build frontend: `npm run build`
2. Copy `dist` folder to VPS
3. Configure Nginx to serve frontend at root and proxy `/api` to backend
4. One SSL certificate for entire domain

This saves costs but requires more technical setup.

## Support

For issues:
- Encore.ts docs: https://encore.dev/docs
- Hostinger support: Via their dashboard
- Check application logs for errors

## Next Steps

1. Setup monitoring (e.g., UptimeRobot)
2. Configure automated backups for database
3. Setup error tracking (e.g., Sentry)
4. Implement CI/CD pipeline (GitHub Actions)
