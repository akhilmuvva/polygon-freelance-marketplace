# 🚀 PolyLance Deployment Guide

## Quick Deploy (Recommended)

Deploy your PolyLance platform to production in under 5 minutes using Vercel or Netlify.

---

## 🎯 Option 1: Deploy to Vercel (Recommended)

### **Why Vercel?**
- ✅ Automatic builds from GitHub
- ✅ Zero configuration needed
- ✅ Free SSL certificates
- ✅ Global CDN
- ✅ Automatic previews for PRs
- ✅ Perfect for React/Vite apps

### **Step-by-Step Instructions**

#### **1. Connect GitHub Repository**

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** (use your GitHub account)
3. Click **"Add New Project"**
4. Select **"Import Git Repository"**
5. Find `polygon-freelance-marketplace` in your repos
6. Click **"Import"**

#### **2. Configure Build Settings**

Vercel will auto-detect Vite, but verify these settings:

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install --legacy-peer-deps
```

#### **3. Add Environment Variables**

Click **"Environment Variables"** and add:

```env
# Required
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_POLYGON_RPC=https://polygon-rpc.com
VITE_POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology

# Optional (for full features)
VITE_BICONOMY_API_KEY=your_biconomy_key
VITE_HUDDLE_PROJECT_ID=your_huddle_id
VITE_SENTRY_DSN=your_sentry_dsn
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

#### **4. Deploy**

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Your app will be live at `https://your-project.vercel.app`

#### **5. Custom Domain (Optional)**

1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `polylance.io`)
3. Update DNS records as instructed
4. SSL certificate auto-generated

### **Vercel CLI (Alternative)**

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd c:\Users\akhil\.gemini\antigravity\scratch\polygon-freelance-marketplace

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? polygon-freelance-marketplace
# - Directory? frontend
# - Build settings? Auto-detected (Vite)

# Deploy to production
vercel --prod
```

---

## 🌐 Option 2: Deploy to Netlify

### **Why Netlify?**
- ✅ Drag-and-drop deployment
- ✅ Form handling built-in
- ✅ Serverless functions
- ✅ Split testing
- ✅ Free tier generous

### **Step-by-Step Instructions**

#### **1. Connect GitHub Repository**

1. Go to [netlify.com](https://netlify.com)
2. Click **"Sign Up"** (use GitHub)
3. Click **"Add new site"** → **"Import an existing project"**
4. Choose **"GitHub"**
5. Select `polygon-freelance-marketplace`

#### **2. Configure Build Settings**

```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

#### **3. Advanced Build Settings**

Click **"Show advanced"** and add:

```
Environment Variables:
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_POLYGON_RPC=https://polygon-rpc.com
VITE_POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology

Build Settings:
NPM_FLAGS=--legacy-peer-deps
NODE_VERSION=20
```

#### **4. Deploy**

1. Click **"Deploy site"**
2. Wait 3-4 minutes
3. Live at `https://random-name.netlify.app`

#### **5. Custom Domain**

1. Go to **Domain settings**
2. Click **"Add custom domain"**
3. Follow DNS instructions

### **Netlify CLI (Alternative)**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to frontend
cd c:\Users\akhil\.gemini\antigravity\scratch\polygon-freelance-marketplace\frontend

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

---

## 🔧 Option 3: Deploy to GitHub Pages

### **Step-by-Step Instructions**

#### **1. Update vite.config.js**

Add base path to `frontend/vite.config.js`:

```javascript
export default defineConfig({
  base: '/polygon-freelance-marketplace/',
  // ... rest of config
})
```

#### **2. Create GitHub Actions Workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ master ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      working-directory: ./frontend
      run: npm install --legacy-peer-deps
      
    - name: Build
      working-directory: ./frontend
      run: npm run build
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./frontend/dist
```

#### **3. Enable GitHub Pages**

1. Go to repository **Settings**
2. Click **Pages** (left sidebar)
3. Source: **Deploy from a branch**
4. Branch: **gh-pages** / **root**
5. Click **Save**

#### **4. Push to Trigger Deployment**

```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin master
```

Your site will be live at: `https://[username].github.io/polygon-freelance-marketplace/`

---

## 🐳 Option 4: Deploy with Docker

### **Create Dockerfile**

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### **Create nginx.conf**

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Build and Run**

```bash
# Build image
docker build -t polylance-frontend ./frontend

# Run container
docker run -p 8080:80 polylance-frontend

# Access at http://localhost:8080
```

### **Docker Compose (Full Stack)**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_POLYGON_RPC=https://polygon-rpc.com
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/polylance
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=polylance
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

---

## 🌍 Option 5: Deploy to AWS (Advanced)

### **Using AWS Amplify**

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"New app"** → **"Host web app"**
3. Connect GitHub repository
4. Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm install --legacy-peer-deps
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

5. Deploy and get URL: `https://master.d1234567890.amplifyapp.com`

---

## 📊 Deployment Comparison

| Platform | Difficulty | Speed | Cost (Free Tier) | Best For |
|----------|-----------|-------|------------------|----------|
| **Vercel** | ⭐ Easy | ⚡ Fast | 100GB bandwidth | React/Vite apps |
| **Netlify** | ⭐ Easy | ⚡ Fast | 100GB bandwidth | Static sites |
| **GitHub Pages** | ⭐⭐ Medium | 🐢 Slow | Unlimited | Open source |
| **Docker** | ⭐⭐⭐ Hard | ⚡ Fast | Self-hosted | Full control |
| **AWS Amplify** | ⭐⭐⭐ Hard | ⚡ Fast | 15GB storage | Enterprise |

---

## 🎯 Recommended: Vercel

**For PolyLance, I recommend Vercel because:**

1. ✅ **Zero Configuration**: Auto-detects Vite
2. ✅ **Fast Builds**: 2-3 minutes
3. ✅ **Free SSL**: Automatic HTTPS
4. ✅ **Preview Deployments**: Every PR gets a URL
5. ✅ **Analytics**: Built-in performance monitoring
6. ✅ **Edge Network**: Global CDN
7. ✅ **Generous Free Tier**: Perfect for startups

---

## 🚀 Quick Start (Vercel - 2 Minutes)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Navigate to project
cd c:\Users\akhil\.gemini\antigravity\scratch\polygon-freelance-marketplace

# 3. Deploy
vercel

# 4. Follow prompts (all defaults are fine)

# 5. Deploy to production
vercel --prod

# Done! Your app is live 🎉
```

---

## 🔐 Environment Variables Needed

### **Required**
```env
VITE_WALLET_CONNECT_PROJECT_ID=get_from_walletconnect.com
VITE_POLYGON_RPC=https://polygon-rpc.com
VITE_POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
```

### **Optional (for full features)**
```env
# Biconomy (gasless transactions)
VITE_BICONOMY_API_KEY=get_from_biconomy.io

# Huddle01 (video calls)
VITE_HUDDLE_PROJECT_ID=get_from_huddle01.com

# Sentry (error tracking)
VITE_SENTRY_DSN=get_from_sentry.io

# Stripe (payments)
VITE_STRIPE_PUBLISHABLE_KEY=get_from_stripe.com

# The Graph (indexing)
VITE_GRAPH_API_URL=your_subgraph_url

# IPFS (file storage)
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

---

## 📝 Post-Deployment Checklist

After deploying, verify:

- [ ] Homepage loads correctly
- [ ] Wallet connection works
- [ ] Contract interactions work on testnet
- [ ] All routes are accessible
- [ ] Images and assets load
- [ ] No console errors
- [ ] Mobile responsive
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Analytics tracking (if configured)

---

## 🐛 Troubleshooting

### **Build Fails**

```bash
# Clear cache and rebuild
vercel --force

# Or on Netlify
netlify deploy --prod --clear-cache
```

### **Environment Variables Not Working**

- Ensure they start with `VITE_`
- Redeploy after adding variables
- Check for typos

### **404 on Routes**

Add `vercel.json` or `netlify.toml` for SPA routing:

**vercel.json**:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**netlify.toml**:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🎉 You're Ready to Deploy!

Choose your platform and follow the instructions above. **Vercel is recommended** for the fastest and easiest deployment.

**Need help?** Check the platform-specific documentation:
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [GitHub Pages Docs](https://docs.github.com/en/pages)

---

**Last Updated**: February 12, 2026  
**Version**: 1.0  
**Status**: ✅ Ready to Deploy
