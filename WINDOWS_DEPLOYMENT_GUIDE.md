# Deploy NexPOS - Option A (Windows Build & Push)

## 🎯 Overview
Build Docker image on your Windows machine, push to Docker Hub, then pull and run on your VPS.

---

## 📋 STEP 1: Install Prerequisites on Windows

### 1.1 Install Node.js

1. **Download Node.js**: https://nodejs.org/
2. **Choose**: LTS version (v20.x.x recommended)
3. **Run installer**: Follow default options
4. **Verify installation**:

Open **PowerShell** or **Command Prompt** and run:
```powershell
node --version
npm --version
```

Expected output: `v20.x.x` and `10.x.x`

### 1.2 Install Docker Desktop

1. **Download Docker Desktop**: https://www.docker.com/products/docker-desktop/
2. **Run installer**: Follow installation wizard
3. **Restart** your computer if prompted
4. **Start Docker Desktop**: Launch from Start menu
5. **Wait** for Docker to fully start (whale icon in system tray should be steady)
6. **Verify installation**:

```powershell
docker --version
docker ps
```

Expected output: Docker version info and empty container list

### 1.3 Create Docker Hub Account (if you don't have one)

1. Go to: https://hub.docker.com/signup
2. Sign up (you already have username: `posxmhk`)
3. Verify your email

---

## 📥 STEP 2: Download Project from Leap

Since you're working in Leap's cloud environment, you need to download all files.

### Method 1: Manual Download (if Leap has export feature)
- Look for "Download Project" or "Export" button in Leap interface

### Method 2: Copy Files Manually

I'll provide you with a way to download all necessary files. But first:

**Do you see a way to download/export the entire project from Leap?**

Or would you like me to:
- Create a downloadable zip archive?
- Guide you through copying files manually?

---

## 🏗️ STEP 3: Build Docker Image on Windows

Once you have all project files on your Windows machine:

### 3.1 Navigate to project folder

Open **PowerShell** and navigate to where you downloaded the project:

```powershell
cd C:\path\to\your\nexpos-project
```

### 3.2 Verify all files are present

```powershell
# Check if Dockerfile exists
dir Dockerfile

# List all files
dir
```

You should see:
- `backend/` folder
- `frontend/` folder
- `Dockerfile`
- `package.json`
- Other config files

### 3.3 Install dependencies

```powershell
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

**This may take 5-10 minutes.**

### 3.4 Build Docker image

```powershell
docker build -t posxmhk/nexpos:latest .
```

**This may take 10-15 minutes.**

Watch for any errors. The final output should say:
```
Successfully built <image-id>
Successfully tagged posxmhk/nexpos:latest
```

### 3.5 Verify image was created

```powershell
docker images | findstr nexpos
```

You should see: `posxmhk/nexpos   latest   <image-id>   <time>   <size>`

---

## 📤 STEP 4: Push to Docker Hub

### 4.1 Login to Docker Hub

```powershell
docker login -u posxmhk
```

Enter your Docker Hub password when prompted.

### 4.2 Push the image

```powershell
docker push posxmhk/nexpos:latest
```

**This may take 10-20 minutes** depending on your upload speed.

You'll see progress bars for each layer being pushed.

### 4.3 Verify on Docker Hub

1. Go to: https://hub.docker.com/r/posxmhk/nexpos
2. You should see your image listed
3. Tag should show `latest`

---

## 🚀 STEP 5: Deploy to Your VPS

Now that the image is in Docker Hub, deploy it to your VPS.

### 5.1 SSH into your VPS

```powershell
ssh nexpos25@103.103.22.68
```

### 5.2 Pull the image

```bash
docker pull posxmhk/nexpos:latest
```

This should work now since the image exists in Docker Hub!

### 5.3 Stop any existing containers

```bash
docker stop nexpos 2>/dev/null || true
docker rm nexpos 2>/dev/null || true
```

### 5.4 Run the container

```bash
docker run -d \
  -p 4000:4000 \
  --name nexpos \
  --restart always \
  posxmhk/nexpos:latest
```

### 5.5 Verify it's running

```bash
# Check container status
docker ps

# Check logs
docker logs nexpos

# Test locally
curl http://localhost:4000
```

### 5.6 Test from outside VPS

From your Windows browser, visit:
```
http://103.103.22.68:4000
```

You should see your NexPOS login page!

---

## 🌐 STEP 6: Configure Domain (Final Step)

Your Nginx should already be configured. Just verify:

```bash
# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Verify DNS in Hostinger

Make sure you have these A records in Hostinger DNS:

1. **A Record**: `@` → `103.103.22.68`
2. **A Record**: `www` → `103.103.22.68`

### Wait for DNS propagation (15-60 minutes)

Then test:
- http://nexpos.store
- http://www.nexpos.store

Both should show your POS app!

---

## 🎉 Success Checklist

- [ ] Node.js installed on Windows
- [ ] Docker Desktop installed and running
- [ ] Project files downloaded from Leap
- [ ] Dependencies installed (`npm install` in both backend and frontend)
- [ ] Docker image built successfully
- [ ] Docker image pushed to Docker Hub
- [ ] Image pulled on VPS
- [ ] Container running on VPS
- [ ] App accessible at http://103.103.22.68:4000
- [ ] Nginx configured and running
- [ ] DNS A records added
- [ ] Domain working (after DNS propagation)

---

## ❓ Where Are You Now?

Please tell me which step you're currently on or stuck at:

1. ⬜ Installing Node.js on Windows
2. ⬜ Installing Docker Desktop on Windows
3. ⬜ Downloading project from Leap
4. ⬜ Building Docker image
5. ⬜ Pushing to Docker Hub
6. ⬜ Running on VPS

Let me know and I'll help you through it!
