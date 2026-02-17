# PolyLance Deployment Guide (Vercel)

## 1. Deploy the Backend (Serverless Function)

Since this is a full-stack application, deploy the backend first so you have the API URL for the frontend.

1.  **Add New Project** in Vercel.
2.  **Import** the `polygon-freelance-marketplace` repository.
3.  **Project Name**: `polylance-backend` (or similar).
4.  **Framework Preset**: Other.
5.  **Root Directory**: Click `Edit` and select `backend`. **CRITICAL STEP**.
6.  **Environment Variables**:
    *   `MONGODB_URI`: Your MongoDB Atlas connection string (e.g., `mongodb+srv://...`).
    *   `STRIPE_SECRET_KEY`: Your Stripe Secret Key (`sk_test_...`).
    *   `FRONTEND_URL`: `https://your-frontend-domain.vercel.app` (You can update this later after deploying frontend).

    **Note**: Vercel will automatically use the `vercel.json` in the `backend` folder to configure the serverless function.

7.  **Click Deploy**.
    *   Once deployed, copy the domain (e.g., `https://polylance-backend.vercel.app`). This is your `VITE_API_BASE_URL`.

## 2. Deploy the Frontend

1.  **Go to Dashboard** and **Add New Project**.
2.  **Import** the same `polygon-freelance-marketplace` repository again.
3.  **Project Name**: `polylance-frontend`.
4.  **Root Directory**: Vercel should auto-detect `frontend`. If not, select it.
5.  **Build Command**: `npm run build` (default).
6.  **Output Directory**: `dist` (default).
7.  **Environment Variables**:
    *   `VITE_API_BASE_URL`: **PASTE YOUR BACKEND URL HERE** (e.g., `https://polylance-backend.vercel.app/api`).
    *   `VITE_WALLET_CONNECT_PROJECT_ID`: Your WalletConnect Project ID.
    *   `VITE_ALCHEMY_ID`: Your Alchemy API Key.
    *   `VITE_INFURA_ID`: Your Infura Project ID (optional if using Alchemy).
    *   `VITE_PARTICLE_PROJECT_ID`, `VITE_PARTICLE_CLIENT_KEY`, `VITE_PARTICLE_APP_ID`: Particle Network keys (for social login).
    *   `VITE_BICONOMY_BUNDLER_URL`, `VITE_BICONOMY_PAYMASTER_URL`: Biconomy keys (for gasless transactions).

8.  **Click Deploy**.

## 3. Post-Deployment Configuration

1.  **Update Backend CORS**:
    *   Go back to your `polylance-backend` project settings in Vercel.
    *   Add `FRONTEND_URL` = `https://polylance-frontend.vercel.app` (your actual frontend domain).
    *   Redeploy the backend (go to Deployments -> Redeploy) to apply the change.

2.  **Verify**:
    *   Open your frontend URL.
    *   Open Developer Tools (F12) -> Network.
    *   Check that API calls to `/api/jobs` or `/api/auth/nonce` are hitting `https://polylance-backend.vercel.app/api/...` and returning 200 OK.
