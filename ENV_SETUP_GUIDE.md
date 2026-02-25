# Environment Variables Setup Guide
**Maintained by:** Akhil Muvva & Jhansi Kupireddy

## 🔑 Required Environment Variables

Your app needs these to work properly. Add them in Vercel Dashboard:

### **Step 1: Go to Vercel Dashboard**
1. Visit https://vercel.com/dashboard
2. Click on your project: `polygon-freelance-marketplace`
3. Click "Settings" tab
4. Click "Environment Variables" in left sidebar

### **Step 2: Add These Variables**

#### **REQUIRED (App won't work without these)**

```env
# WalletConnect Project ID (REQUIRED)
# Get from: https://cloud.walletconnect.com
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Polygon RPC URLs (REQUIRED)
VITE_POLYGON_RPC=https://polygon-rpc.com
VITE_POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
```

#### **OPTIONAL (For full features)**

```env
# Biconomy (gasless transactions)
VITE_BICONOMY_API_KEY=

# Huddle01 (video calls)
VITE_HUDDLE_PROJECT_ID=

# Sentry (error tracking)
VITE_SENTRY_DSN=

# The Graph (indexing)
VITE_GRAPH_API_URL=
```

### **Step 3: Redeploy**
1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait 2-3 minutes

---

## 🚨 Quick Fix: Use Default Values

If you want to test immediately without getting API keys:

```env
VITE_WALLET_CONNECT_PROJECT_ID=demo
VITE_POLYGON_RPC=https://polygon-rpc.com
VITE_POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
```

**Note**: Wallet connection won't work with `demo` as Project ID, but the app will load.

---

## 📝 How to Get WalletConnect Project ID

1. Go to https://cloud.walletconnect.com
2. Click "Sign Up" or "Sign In"
3. Click "Create New Project"
4. Enter project name: "PolyLance"
5. Copy the "Project ID"
6. Paste in Vercel environment variables

---

## ✅ Verification

After adding env vars and redeploying:

1. Visit your live URL
2. Open browser console (F12)
3. Should see no errors about missing env vars
4. Wallet connect button should work

---

**Last Updated**: February 12, 2026
