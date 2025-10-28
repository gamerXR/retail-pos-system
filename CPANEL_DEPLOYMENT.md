# Deploy to cPanel/Hostinger - Complete Guide

This guide shows you how to deploy your Retail POS System frontend to cPanel/Hostinger hosting.

## Prerequisites

- cPanel/Hostinger hosting account with `public_html` access
- Your backend API already deployed and accessible (see backend deployment options below)
- FTP access or cPanel File Manager access

## Step 1: Deploy Your Backend API

Your frontend needs a backend API to work. Choose one of these options:

### Option A: Use Encore Cloud (Recommended - Easiest)

1. Install Encore CLI on your local machine:
   ```bash
   curl -L https://encore.dev/install.sh | bash
   ```

2. Login and deploy:
   ```bash
   encore auth login
   encore app create
   encore deploy
   ```

3. Note your backend URL (e.g., `https://your-app-name.encr.app`)

### Option B: Deploy to VPS

See the main [DEPLOYMENT.md](./DEPLOYMENT.md) file for detailed VPS deployment instructions.

### Option C: Deploy to Any Cloud Provider

You can deploy the backend to any cloud provider that supports Docker or Node.js applications.

## Step 2: Build Your Frontend

On your **local machine**, navigate to your project directory:

### Method 1: Using the Build Script (Recommended)

```bash
# Make the script executable (Linux/Mac)
chmod +x build-frontend.sh

# Set your backend API URL
export BACKEND_API_URL=https://your-backend-url.com

# Run the build script
./build-frontend.sh
```

### Method 2: Manual Build

```bash
cd frontend

# Install dependencies
npm install

# Build with your backend URL
VITE_API_URL=https://your-backend-url.com npm run build
```

**Important:** Replace `https://your-backend-url.com` with your actual backend URL from Step 1.

### Using Relative URLs (Alternative)

If your backend will be on the same domain (e.g., using reverse proxy), you can build without setting VITE_API_URL:

```bash
cd frontend
npm install
npm run build
```

The frontend will use `/api` as the backend URL, which you can proxy to your actual backend.

## Step 3: Upload Files to cPanel/Hostinger

### Method A: Using cPanel File Manager (Easier)

1. **Login to cPanel**
   - Go to your hosting control panel
   - Navigate to **File Manager**

2. **Prepare public_html directory**
   - Navigate to `public_html` (or your domain's directory)
   - **Delete** or backup any existing files (index.html, etc.)

3. **Upload frontend files**
   - Click the **Upload** button
   - Select ALL files from `frontend/dist/` folder on your computer
   - Wait for upload to complete
   - The structure should look like:
     ```
     public_html/
     ├── index.html
     ├── assets/
     │   ├── index-[hash].js
     │   ├── index-[hash].css
     │   └── ...
     └── nexpos-logo.png
     ```

4. **Upload .htaccess file**
   - Upload the `.htaccess` file from your project root to `public_html/`
   - If a `.htaccess` already exists, you can replace it or merge the contents

### Method B: Using FTP (Faster for large files)

1. **Get FTP credentials**
   - In cPanel, go to **FTP Accounts**
   - Note your FTP hostname, username, and password

2. **Connect using FTP client**
   - Download and install FileZilla (https://filezilla-project.org/)
   - Open FileZilla and enter your credentials:
     - Host: `ftp.yourdomain.com` (or provided by hosting)
     - Username: Your FTP username
     - Password: Your FTP password
     - Port: 21

3. **Upload files**
   - On the left panel (local), navigate to `frontend/dist/`
   - On the right panel (remote), navigate to `public_html/`
   - Select all files in `frontend/dist/` and drag to `public_html/`
   - Also upload the `.htaccess` file from project root

## Step 4: Configure .htaccess (If Not Already Done)

The `.htaccess` file is crucial for React Router to work properly. If you haven't uploaded it:

1. In cPanel File Manager, navigate to `public_html/`
2. Click **New File** and name it `.htaccess`
3. Right-click the file and select **Edit**
4. Paste the following content:

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

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

5. Click **Save**

## Step 5: Test Your Deployment

1. **Visit your website**
   - Open your browser and go to `https://yourdomain.com`
   - You should see the login page

2. **Check for errors**
   - Open browser Developer Tools (F12)
   - Check the Console tab for any errors
   - Check the Network tab to see if API calls are working

3. **Test login**
   - Try logging in with your credentials
   - If you get CORS errors, see troubleshooting below

## Troubleshooting

### Issue: Blank Page

**Solution:**
- Check browser console for errors
- Verify all files from `frontend/dist/` were uploaded
- Make sure `.htaccess` is present and configured correctly
- Check file permissions (should be 644 for files, 755 for directories)

### Issue: 404 Errors on Page Refresh

**Solution:**
- Verify `.htaccess` file is present in `public_html/`
- Ensure `mod_rewrite` is enabled (ask your hosting provider)
- Check that `.htaccess` has the correct rewrite rules

### Issue: CORS Errors

**Solution:**
- Your backend must allow requests from your frontend domain
- If using Encore, update `backend/encore.app` to include your domain:
  ```typescript
  {
    "id": "retail-pos",
    "cors": {
      "allow_origins_with_credentials": ["https://yourdomain.com"]
    }
  }
  ```
- Redeploy your backend after making changes

### Issue: Assets Not Loading (CSS/JS)

**Solution:**
- Check that the `assets/` folder was uploaded
- Verify file paths in browser Network tab
- Ensure `RewriteBase /` is correct in `.htaccess`
- If your site is in a subdirectory, update `.htaccess`:
  ```apache
  RewriteBase /subdirectory/
  ```

### Issue: API Calls Failing

**Solution:**
- Verify `VITE_API_URL` was set correctly during build
- Check browser Network tab to see what URL is being called
- Test your backend API directly in browser:
  ```
  https://your-backend-url.com/health
  ```
- Ensure backend is running and accessible
- Check CORS settings on backend

## Updating Your Deployment

When you make changes to your app:

### Update Frontend Only:

```bash
# Set backend URL if changed
export BACKEND_API_URL=https://your-backend-url.com

# Rebuild
./build-frontend.sh

# Upload contents of frontend/dist/ to public_html/
```

### Update Backend:

```bash
# If using Encore Cloud
encore deploy

# If using VPS, see DEPLOYMENT.md
```

## File Structure in public_html

After successful deployment, your `public_html/` should look like:

```
public_html/
├── .htaccess                    # URL rewrite rules
├── index.html                   # Main HTML file
├── assets/
│   ├── index-[hash].css        # Styles
│   ├── index-[hash].js         # Application code
│   └── [other-assets]          # Fonts, icons, etc.
├── nexpos-logo.png             # Logo image
└── [other-static-files]        # Any other public files
```

## Performance Optimization

### Enable GZIP Compression

The provided `.htaccess` already includes GZIP compression. Verify it's working:
- Use tools like GTmetrix or Google PageSpeed Insights
- Check response headers for `Content-Encoding: gzip`

### Enable Caching

The `.htaccess` file sets cache headers for static assets. This improves load times for returning visitors.

### Use CDN (Optional)

For faster global access, consider using Cloudflare (free plan available):
1. Sign up at cloudflare.com
2. Add your domain
3. Update nameservers as instructed
4. Enable CDN and caching features

## Security Considerations

1. **Always use HTTPS**
   - Most hosting providers offer free SSL certificates via Let's Encrypt
   - Enable SSL in cPanel under "SSL/TLS"

2. **Keep backend URL secure**
   - Don't expose sensitive backend URLs in public repositories
   - Use environment variables during build

3. **Regular backups**
   - Backup your `public_html/` directory regularly
   - Backup your backend database

## Cost Estimate

- **Hostinger Shared Hosting**: $2-10/month
- **Domain Name**: $10-15/year
- **SSL Certificate**: Free (Let's Encrypt)
- **Backend (Encore Cloud)**: Free tier available
- **Backend (VPS)**: $12-20/month

**Total**: $2-30/month depending on hosting choices

## Support and Help

- **Hosting Issues**: Contact your hosting provider's support
- **Backend Issues**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Build Issues**: Check Node.js and npm versions
- **Application Issues**: Check browser console for error messages

## Next Steps

After successful deployment:

1. Set up automated backups
2. Configure error monitoring (e.g., Sentry)
3. Set up uptime monitoring (e.g., UptimeRobot)
4. Document your deployment process
5. Create a staging environment for testing updates

---

**Congratulations! Your Retail POS System is now live! 🎉**
