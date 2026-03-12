# 🚀 Vercel Deployment Guide: PolyLance Zenith (Path Aligned)

This guide provides instructions for deploying the **PolyLance Zenith** frontend to Vercel, optimized for the Sovereign Stack.

## 📦 Project Structure
The frontend is located in the `frontend/` directory. For optimal performance and module resolution, we utilize a **Root Directory Shift**.

## ⚙️ Vercel Project Settings (General)
To resolve the ENOENT pathing conflict and ensure Vite is actuated correctly:
1. **Root Directory**: Set this to `frontend`. 
   - *This ensures Vercel starts execution inside the modules atmosphere where `vite` is located.*

## 🔐 Environment Variables (CRITICAL)
Configure these in **Project Settings > Environment Variables**.

### 🛠️ Infrastructure Layer
| Variable | Value |
|----------|-------|
| `NODE_OPTIONS` | `--max-old-space-size=4096` |
| `VERCEL` | `1` |

### 🛰️ Application Layer (Copy from `frontend/.env`)
| Variable | Recommended Value |
|----------|-------------------|
| `VITE_APP_URL` | `https://polylance.codes` |
| `VITE_WALLETCONNECT_PROJECT_ID` | *Your Project ID* |
| `VITE_POLYGON_AMOY_RPC` | `https://rpc-amoy.polygon.technology` |
| `VITE_SUBGRAPH_URL` | *Your Subgraph URL* |
| `VITE_BICONOMY_PAYMASTER_URL` | *Your Paymaster URL* |
| `VITE_BICONOMY_BUNDLER_URL` | *Your Bundler URL* |
| `VITE_PARTICLE_PROJECT_ID` | *Your Particle ID* |
| `VITE_PARTICLE_CLIENT_KEY` | *Your Particle Client Key* |
| `VITE_PARTICLE_APP_ID` | *Your Particle App ID* |

## 🛠️ Step-by-Step Deployment
1. **Import**: Connect your GitHub repository.
2. **Override Path**: In "General Settings", set **Root Directory** to `frontend`.
3. **Add Variables**: Enter all variables listed above.
4. **Deploy**: The system will now execute `vite build` directly within the correct atmosphere.

## 🏁 Resonance Achieved
The build will now minify all 9,652+ modules using the expanded heap. Public fallback RPCs are bundled, and all dashboard components will be 100% functional.

---
*Created by the Sovereign Systems Engineer — Absolute Zero Gravity achieved.*
