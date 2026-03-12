# 🚀 Vercel Deployment Guide: PolyLance Zenith

This guide provides instructions for deploying the **PolyLance Zenith** frontend to Vercel. 

## 📦 Project Structure
The repository is a monorepo where the frontend is located in the `frontend/` directory. The root `package.json` handles the orchestration.

## ⚙️ Automated Configuration
We have added a `vercel.json` at the root of the project. This file automatically configures:
- **Build Engine**: Node.js 22.
- **Install Command**: Installs root dependencies and then frontend dependencies.
- **Build Command**: Runs the Vite build for the frontend.
- **Output Directory**: Points Vercel to `frontend/dist`.
- **SPA Routing**: Handles client-side routing for React.
- **Memory Optimization**: Allocates 4GB of RAM for the build process.

## 🔐 Environment Variables (CRITICAL)
You **MUST** configure the following environment variables in your Vercel Dashboard (**Project Settings > Environment Variables**). You can copy these from `frontend/.env`:

| Variable | Recommended Value |
|----------|-------------------|
| `VITE_APP_URL` | `https://your-vercel-domain.vercel.app` |
| `VITE_WALLETCONNECT_PROJECT_ID` | *Your Project ID* |
| `VITE_POLYGON_AMOY_RPC` | `https://rpc-amoy.polygon.technology` |
| `VITE_SUBGRAPH_URL` | *Your Subgraph URL* |
| `VITE_BICONOMY_PAYMASTER_URL` | *Your Paymaster URL* |
| `VITE_BICONOMY_BUNDLER_URL` | *Your Bundler URL* |
| `VITE_PARTICLE_PROJECT_ID` | *Your Particle ID* |
| `VITE_PARTICLE_CLIENT_KEY` | *Your Particle Client Key* |
| `VITE_PARTICLE_APP_ID` | *Your Particle App ID* |

> [!NOTE]
> Make sure to prefix all variables with `VITE_` as required by Vite.

## 🛠️ Step-by-Step Deployment
1.  **Import to Vercel**: Connect your GitHub repository to Vercel.
2.  **Root Directory**: Leave as `.` (the project root), as `vercel.json` handles the subdirectory routing.
3.  **Framework Preset**: Select `Other` (or Vite if it auto-detects, but `vercel.json` will override it).
4.  **Environment Variables**: Add the variables listed above.
5.  **Deploy**: Hit Deploy.

## 🛡️ Sovereign Logic
The codebase detects if it is running on Vercel via the `VERCEL` environment variable. 
- **On Vercel**: Uses absolute pathing (`/`) for assets to ensure routing stability.
- **On Fleek/IPFS**: Continues to use relative pathing (`./`) for decentralized compatibility.

---
*Created by Antigravity — Absolute Zero Gravity Deployment Protocol active.*
