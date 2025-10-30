# NexPOS - Retail Point of Sale System

A modern, full-featured Point of Sale system built with Encore.ts backend and React frontend.

## 🚀 Features

- **Sales Management**: Complete POS interface with barcode scanning, quick item search
- **Inventory Management**: Track stock levels, movements, and low stock alerts
- **Multi-tenant Support**: Client-based system for managing multiple businesses
- **Payment Options**: Cash, QR codes, and other payment methods
- **Receipt Printing**: Customizable receipt templates with label printing
- **Sales Reports**: Comprehensive reporting with shift reports and sales summaries
- **Employee Management**: Salesperson tracking and permissions
- **Opening Balance**: Daily cash drawer management

## 📋 Tech Stack

**Backend:**
- Encore.ts - TypeScript backend framework
- PostgreSQL - Database
- RESTful APIs

**Frontend:**
- React + TypeScript
- Vite - Build tool
- Tailwind CSS v4 - Styling
- shadcn/ui - UI components
- Lucide React - Icons

## 🏗️ Project Structure

```
.
├── backend/
│   ├── auth/          # Authentication and user management
│   ├── pos/           # POS core functionality
│   └── encore.app     # Encore app configuration
├── frontend/
│   ├── components/    # React components
│   ├── lib/          # Utilities and helpers
│   └── App.tsx       # Main app component
├── Dockerfile
└── docker-compose.yml
```

## 🚀 Deployment Options

### Option 1: Deploy with Docker (Recommended)

See [WINDOWS_DEPLOYMENT_GUIDE.md](WINDOWS_DEPLOYMENT_GUIDE.md) for detailed instructions.

**Quick start:**

```bash
# Build the image
docker build -t posxmhk/nexpos:latest .

# Run the container
docker run -d -p 4000:4000 --name nexpos --restart always posxmhk/nexpos:latest
```

### Option 2: Deploy to VPS

See [DEPLOY_TO_VPS.md](DEPLOY_TO_VPS.md) for VPS deployment instructions.

### Option 3: Deploy to cPanel

See [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md) for cPanel hosting instructions.

## 💻 Local Development

**Prerequisites:**
- Node.js 20.x or higher
- npm or yarn
- Docker (optional, for containerized deployment)

**Setup:**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd frontend
npm install

# Start Encore backend (in backend directory)
npm run dev

# Start frontend dev server (in frontend directory)
npm run dev
```

## 🔐 Environment Configuration

The app uses Encore.ts's built-in secrets management. Configure secrets through the Encore settings or environment variables.

Frontend configuration is in `frontend/config.ts`.

## 📦 Building for Production

**Backend:**
```bash
cd backend
npm run build
```

**Frontend:**
```bash
cd frontend
npm run build
```

**Docker:**
```bash
docker build -t posxmhk/nexpos:latest .
```

## 🌐 Live Deployment

**Production URL:** https://nexpos.store (when DNS is configured)

**Preview URL:** https://retail-pos-system-d299vgk82vjrnuv4rmbg.lp.dev

## 📖 Documentation

- [Windows Deployment Guide](WINDOWS_DEPLOYMENT_GUIDE.md)
- [VPS Deployment Guide](DEPLOY_TO_VPS.md)
- [cPanel Deployment Guide](CPANEL_DEPLOYMENT.md)
- [Quick Deploy Guide](QUICK_DEPLOY.md)

## 🔧 Key Configuration

**VPS Details:**
- IP: 103.103.22.68
- User: nexpos25
- Domain: nexpos.store

**Docker Hub:**
- Repository: posxmhk/nexpos
- Tag: latest

## 📝 License

Proprietary - All rights reserved

## 👤 Author

**gamerXR**
- GitHub: [@gamerXR](https://github.com/gamerXR)
- Docker Hub: [posxmhk](https://hub.docker.com/u/posxmhk)

## 🤝 Support

For issues and questions, please contact the development team.

---

Built with ❤️ using Encore.ts and React
