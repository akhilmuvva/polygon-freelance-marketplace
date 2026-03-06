# 🌐 PolyLance Zenith: Sovereign Deployment Guide (The Edge Layer)

This guide outlines the final "Antigravity" step: Migrating from centralized Vercel/AWS to an immutable, censorship-resistant, and persistent edge layer.

## 🛠️ 1. Environment Requirements
The PolyLance Zenith ecosystem uses modern ECMAScript features and high-performance libraries.
*   **Node.js**: `v20.19.0` or higher (LTS).
*   **Package Manager**: `npm` (v10+) or `yarn` (v1.22+).
*   **Operating System**: Linux/macOS preferred for CI; Windows ARM64 requires the Hardhat Fallback Parser (pre-injected).

## 🏗️ 2. Decentralized Hosting (IPFS/4EVERLAND)
By hosting the frontend on IPFS via Fleek or 4EVERLAND, we ensure that:
1.  **Content-Addressability:** Each version of the app has a unique hash (CID).
2.  **Decentralized Storage:** No single server can "take it down."

### ☁️ 4EVERLAND Integration
4EVERLAND provides a "Weightless" cloud experience with global acceleration and support for multiple protocols.
1.  **Login**: Access [4everland.org](https://www.4everland.org/) and connect your GitHub/GitLab.
2.  **Import**: Select the `polygon-freelance-marketplace` repository.
3.  **Build Configuration**:
    *   **Framework**: `Vite`
    *   **Root Directory**: `frontend`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
4.  **Protocol**: Select `IPFS` (or `Arweave` for permanent storage).
5.  **Deployment**: 4EVERLAND will automatically generate a decentralized gateway link (e.g., `*.4everland.app`).

### 🔧 Configuration: `fleek.json`
The `fleek.json` file in the root directory is configured to:
*   Automatically build the Vite project.
*   Pin the `dist` folder to IPFS.
*   Update the **IPNS (InterPlanetary Name System)** record to point to the newest CID.

## 🔗 3. Persistent Identity (IPNS)
A raw IPFS CID changes with every code update. **IPNS** provides a permanent link that always points to the latest stable release.

### 🛰️ Accessing the App
Users can access the PolyLance frontend through any decentralized gateway:
*   `https://cloudflare-ipfs.com/ipns/polylance-zenith-prod`
*   `https://polylance-zenith-prod.4everland.app` (4EVERLAND Dedicated Gateway)
*   `https://dweb.link/ipns/polylance-zenith-prod`

## 🛡️ 3. Execution Commands
To deploy the sovereign final version:

1.  **Install Fleek CLI:**
    ```bash
    npm install -g @fleek-platform/cli
    ```
2.  **Authenticate:**
    ```bash
    fleek login
    ```
3.  **Sovereign Deploy:**
    ```bash
    fleek site deploy --site-id polylance-zenith-antigravity
    ```

## 🏁 5. Governance Integration
Once the IPFS hash is stable, the **Antigravity Governance DAO** should vote to update the `IPFS_ROOT_HASH` within the `ZodiacGovernanceModule` to ensure the "Official" version is always verifiable on-chain.
