# Deploy NexPOS to Your VPS (103.103.22.68)

## Step 1: Install Required Software on VPS

SSH into your VPS:
```bash
ssh nexpos25@103.103.22.68
```

Install Node.js, npm, and Docker:
```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js (v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Docker should already be installed. If not:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# You may need to logout and login again for Docker permissions
```

## Step 2: Transfer Project Files to VPS

On your VPS, create a directory for the project:
```bash
mkdir -p ~/nexpos
cd ~/nexpos
```

**You'll transfer the files here in the next step.**

## Step 3: Transfer Files

You have several options:

### Option A: Using SCP from Windows (PowerShell)
After I create the deployment archive, download it and run:
```powershell
scp C:\path\to\nexpos-deploy.tar.gz nexpos25@103.103.22.68:~/nexpos/
```

### Option B: Using FileZilla or WinSCP
1. Download FileZilla: https://filezilla-project.org/
2. Connect to: 103.103.22.68
3. Username: nexpos25
4. Upload the project files to: /home/nexpos25/nexpos/

### Option C: Direct Git Clone (if you have a repository)
```bash
cd ~/nexpos
git clone <your-repo-url> .
```

## Step 4: Run Deployment Script

After files are transferred:
```bash
cd ~/nexpos
chmod +x deploy.sh
./deploy.sh
```

## Step 5: Verify Deployment

Check if the app is running:
```bash
docker ps
curl http://localhost:4000
```

Test from outside:
```bash
curl http://103.103.22.68:4000
```

## Step 6: Configure Nginx (Already Done)

Your nginx should already be configured. Verify:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Wait for DNS and Test

After DNS propagates (15-60 minutes):
- Visit: http://nexpos.store → redirects to www
- Visit: http://www.nexpos.store → shows your POS app

## Troubleshooting

### If Docker container fails to start:
```bash
docker logs nexpos
```

### If port 4000 is in use:
```bash
sudo lsof -i :4000
sudo kill <PID>
```

### If Nginx isn't working:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check if app is accessible:
```bash
# From VPS
curl -I http://localhost:4000

# From outside
curl -I http://103.103.22.68:4000
```
