# Create NexPOS Project on Windows

## 🚀 Complete Automated Setup

This guide will help you create the entire NexPOS project on your Windows machine.

### Prerequisites

1. **Git** - Download from: https://git-scm.com/download/win
2. **PowerShell** - Should be pre-installed on Windows

### Step 1: Clone Your GitHub Repository

Open PowerShell and run:

```powershell
# Navigate to your development folder
cd C:\Development

# Clone the repository (you created this already)
git clone https://github.com/gamerXR/retail-pos-system.git

# Enter the directory
cd retail-pos-system

# Configure git
git config user.name "gamerXR"
git config user.email "your-email@example.com"
```

### Step 2: Download the Setup Scripts

I've created modular setup scripts that will create all project files for you.

**Download these files from the Leap project:**

1. `setup-part1-config.ps1` - Creates root config files
2. `setup-part2-backend.ps1` - Creates backend files
3. `setup-part3-frontend.ps1` - Creates frontend files
4. `setup-part4-docs.ps1` - Creates documentation

Or use the **MASTER SCRIPT** below that contains everything.

### Step 3: Run the Master Setup Script

Copy the master script content (provided below) and save it as `setup-nexpos.ps1` in your `C:\Development\retail-pos-system\` folder.

Then run:

```powershell
# Allow script execution (one-time setup)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Run the setup script
.\setup-nexpos.ps1
```

This will:
- ✅ Create all directories
- ✅ Create all configuration files
- ✅ Create backend structure
- ✅ Create frontend structure  
- ✅ Create Docker files
- ✅ Create documentation

### Step 4: Push to GitHub

After the script completes:

```powershell
# Add all files
git add .

# Commit
git commit -m "Initial commit - NexPOS from Leap"

# Push to GitHub
git push origin main
```

When prompted for credentials:
- **Username**: gamerXR
- **Password**: Use your GitHub Personal Access Token (not your password)

### Step 5: Build Docker Image

```powershell
# Login to Docker Hub
docker login -u posxmhk

# Build the image
docker build -t posxmhk/nexpos:latest .

# Push to Docker Hub
docker push posxmhk/nexpos:latest
```

### Step 6: Deploy to VPS

SSH into your VPS:

```powershell
ssh nexpos25@103.103.22.68
```

On the VPS:

```bash
# Pull the image
docker pull posxmhk/nexpos:latest

# Stop existing container
docker stop nexpos 2>/dev/null || true
docker rm nexpos 2>/dev/null || true

# Run new container
docker run -d -p 4000:4000 --name nexpos --restart always posxmhk/nexpos:latest

# Verify
docker ps
curl http://localhost:4000
```

### Step 7: Test Your Domain

After DNS propagates (15-60 minutes):
- Visit: http://nexpos.store
- Visit: http://www.nexpos.store

---

## 📝 Next: Get the Master Script

The master PowerShell script is too large to include here directly. Instead, I'll create it as separate downloadable files that you can copy from Leap.

**Continue to the next file to get the setup scripts.**
