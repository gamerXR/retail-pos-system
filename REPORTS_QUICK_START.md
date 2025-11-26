# 🚀 Quick Start: Deploy Reports Portal

## 5-Minute Setup Guide

### 1. Build (On Your Computer)
```bash
chmod +x build-reports.sh
./build-reports.sh
```
✅ Creates `frontend-reports/dist/` folder

### 2. Upload to Hostinger

**Method 1: cPanel File Manager**
1. Login to Hostinger → cPanel
2. File Manager → `public_html/`
3. Create folder `report/`
4. Upload ALL contents from `frontend-reports/dist/` into `report/`

**Method 2: FTP (FileZilla)**
1. Connect to your Hostinger FTP
2. Navigate to `/public_html/report/`
3. Upload all `dist/` contents

### 3. Create Subdomain

1. cPanel → Domains → Subdomains
2. **Subdomain:** `report`
3. **Domain:** `nexpos.store`
4. **Document Root:** `/public_html/report`
5. Click **Create**

### 4. Configure DNS

1. Hostinger → Domains → DNS Zone
2. **Add Record:**
   - Type: `CNAME`
   - Name: `report`
   - Points to: `nexpos.store`
   - TTL: 3600

Wait 1-24 hours for DNS propagation.

### 5. Enable SSL

1. cPanel → SSL/TLS
2. Select `report.nexpos.store`
3. Enable **Force HTTPS**

### 6. Test!

Visit: `https://report.nexpos.store`

**Login credentials:**
- Phone: Any client phone from your database
- Password: Value from `password_hash` column

---

## File Structure After Upload

```
public_html/
└── report/
    ├── index.html          ← Must be here!
    ├── assets/
    │   ├── index-xxx.js
    │   └── index-xxx.css
    └── vite.svg
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page | Check browser console (F12), verify files uploaded |
| Can't login | Check API URL in `frontend-reports/client.ts` |
| DNS not working | Wait 24h, clear DNS cache |
| 404 errors | Ensure `index.html` in correct location |

## Update Portal Later

```bash
./build-reports.sh
# Re-upload dist/ contents to server
```

---

**Full guide:** See `REPORTS_DEPLOYMENT.md`

**Backend is already deployed and working!** ✅
