# NexPOS Client Reports Portal - Deployment Guide

## Overview
The Client Reports Portal is a separate web application that allows your clients to view their sales data, reports, and analytics through a dedicated login portal at `report.nexpos.store`.

## 📋 Prerequisites
- Hostinger account with web hosting
- Access to cPanel or file manager
- Access to DNS settings in Hostinger

## 🔧 Step 1: Build the Application

### On your local machine or server:

```bash
chmod +x build-reports.sh
./build-reports.sh
```

This will create a `frontend-reports/dist/` folder with all the production files.

## 📤 Step 2: Upload Files to Hostinger

### Option A: Using cPanel File Manager

1. **Login to Hostinger** → Go to cPanel
2. **Navigate to File Manager**
3. **Create subdomain folder:**
   - Go to `public_html/`
   - Create a new folder named `report` (or `reports`)
4. **Upload files:**
   - Open the `report/` folder
   - Upload **all contents** from `frontend-reports/dist/` to this folder
   - Make sure `index.html` is directly in the `report/` folder

### Option B: Using FTP

1. **Get FTP credentials from Hostinger:**
   - Go to Hostinger control panel → Files → FTP Accounts
   - Note: hostname, username, password

2. **Connect using FileZilla or similar:**
   - Host: ftp.yourdomain.com (or IP from Hostinger)
   - Username: your FTP username
   - Password: your FTP password
   - Port: 21

3. **Upload files:**
   - Navigate to `/public_html/report/`
   - Upload all contents from `frontend-reports/dist/`

## 🌐 Step 3: Configure DNS (Subdomain)

### In Hostinger DNS Management:

1. **Go to:** Hostinger control panel → Domains → DNS Zone Editor
2. **Add a new record:**
   - Type: `A Record` or `CNAME`
   - Name: `report` (this creates report.nexpos.store)
   - Points to: Your server IP (for A Record) or `nexpos.store` (for CNAME)
   - TTL: 3600 (or default)

**Note:** DNS changes can take 1-24 hours to propagate globally.

## ⚙️ Step 4: Configure Web Server

### For cPanel/Hostinger:

1. **Create Subdomain:**
   - Go to cPanel → Subdomains
   - Subdomain: `report`
   - Domain: `nexpos.store`
   - Document Root: `/public_html/report`
   - Click "Create"

2. **Test:** Visit `http://report.nexpos.store` (may need to wait for DNS)

### For nginx (if you manage your own server):

Create `/etc/nginx/sites-available/report.nexpos.store`:

```nginx
server {
    listen 80;
    server_name report.nexpos.store;
    root /var/www/report.nexpos.store;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Caching for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Then:
```bash
sudo ln -s /etc/nginx/sites-available/report.nexpos.store /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Step 5: Enable HTTPS (Recommended)

### For cPanel/Hostinger:
1. Go to cPanel → SSL/TLS → Manage SSL Sites
2. Select your subdomain: `report.nexpos.store`
3. Hostinger usually auto-installs Let's Encrypt SSL
4. Enable "Force HTTPS Redirect"

### For nginx with Let's Encrypt:
```bash
sudo certbot --nginx -d report.nexpos.store
```

## 📊 Step 6: Configure API Connection

The reports portal is already configured to connect to your Encore.ts backend API at:
```
https://retail-pos-system-d299vgk82vjrnuv4rmbg.api.lp.dev
```

If you deploy your backend to a different URL, update `/frontend-reports/client.ts`:

```typescript
const API_BASE_URL = "https://your-api-domain.com";
```

Then rebuild and re-upload.

## 🧪 Step 7: Test the Portal

1. **Visit:** `https://report.nexpos.store`
2. **Login with a client account:**
   - Phone Number: (from your database)
   - Password: (from clients table in database)
3. **Test all features:**
   - Dashboard stats
   - Sales report
   - Category sales
   - Top products
   - Cashflow summary

## 👥 Creating Client Accounts

Clients login using credentials from the `clients` table in your database.

**To create a new client account**, use your admin panel at the main POS system, or run this SQL:

```sql
INSERT INTO clients (phone_number, client_name, password_hash, email, company_name, status)
VALUES ('0891234567', 'Client Name', 'password123', 'client@email.com', 'Company Ltd', 'active');
```

**Default test credentials** (if you have sample data):
- Phone: Any phone number from clients table
- Password: The value in `password_hash` column

## 🔄 Updating the Portal

When you make changes to the reports portal:

1. **Rebuild:**
   ```bash
   ./build-reports.sh
   ```

2. **Re-upload:** Upload new `dist/` contents to server

3. **Clear browser cache** or use Ctrl+Shift+R

## 🐛 Troubleshooting

### Portal shows blank page
- Check browser console for errors (F12)
- Verify all files uploaded correctly
- Check `index.html` exists in root folder

### Can't login / API errors
- Verify API URL in `client.ts` is correct
- Check browser network tab for failed requests
- Ensure backend is running and accessible
- Test API directly: `https://your-api.com/auth/client/login`

### DNS not working
- Wait 24 hours for propagation
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Test with: `nslookup report.nexpos.store`

### CORS errors
- Ensure backend allows requests from `report.nexpos.store`
- Check backend CORS configuration in Encore.ts gateway settings

## 📁 File Structure

After deployment, your server should look like:

```
public_html/
├── report/              # Reports portal
│   ├── index.html
│   ├── assets/
│   │   ├── index-abc123.js
│   │   └── index-def456.css
│   └── ...
└── ...                  # Your other sites
```

## 🎨 Customization

### Change branding
Edit `/frontend-reports/components/LoginPage.tsx`:
- Update logo/title
- Change color scheme in `className` props

### Add more reports
1. Create new endpoint in `/backend/pos/client_reports.ts`
2. Add component in `/frontend-reports/components/`
3. Add tab in `/frontend-reports/components/Dashboard.tsx`

## 📞 Support

If you encounter issues:
1. Check browser console (F12)
2. Review server error logs in cPanel
3. Test API endpoints directly
4. Verify client account is `active` in database

## ✅ Post-Deployment Checklist

- [ ] Files uploaded to correct folder
- [ ] DNS pointing to correct server
- [ ] Subdomain configured in cPanel
- [ ] HTTPS enabled and working
- [ ] Can access portal in browser
- [ ] Can login with test account
- [ ] All reports loading correctly
- [ ] Backend API responding
- [ ] Mobile responsive (test on phone)

---

**Backend API Endpoints Used:**
- `POST /auth/client/login` - Client authentication
- `GET /pos/client/dashboard` - Dashboard statistics
- `POST /pos/client/sales-report` - Daily sales data
- `POST /pos/client/category-sales` - Category breakdown
- `POST /pos/client/top-products` - Best sellers
- `POST /pos/client/cashflow` - Cash flow summary

All endpoints require authentication via Bearer token returned from login.
