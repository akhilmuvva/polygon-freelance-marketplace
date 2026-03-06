# 🌐 PolyLance Zenith: Sovereign Deployment Guide (The Edge Layer)

This guide outlines the final "Antigravity" step: Migrating from centralized Vercel/AWS to an immutable, censorship-resistant, and persistent edge layer.

## 🏗️ 1. Immutable Hosting (IPFS)
By hosting the frontend on IPFS, we ensure that:
1.  **Content-Addressability:** Each version of the app has a unique hash (CID).
2.  **Decentralized Storage:** No single server can "take it down."

### 🔧 Configuration: `fleek.json`
The `fleek.json` file in the root directory is configured to:
*   Automatically build the Vite project.
*   Pin the `dist` folder to IPFS.
*   Update the **IPNS (InterPlanetary Name System)** record to point to the newest CID.

## 🔗 2. Persistent Identity (IPNS)
A raw IPFS CID changes with every code update (e.g., `ipfs://Qm...`). **IPNS** provides a permanent link (`ipfs://polylance-zenith-prod`) that always points to the latest stable release.

### 🛰️ Accessing the App
Users can access the Antigravity frontend through any IPFS gateway:
*   `https://cloudflare-ipfs.com/ipns/polylance-zenith-prod`
*   `https://ipfs.io/ipns/polylance-zenith-prod`
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

## 🏁 4. Governance Integration
Once the IPFS hash is stable, the **Antigravity Governance DAO** should vote to update the `IPFS_ROOT_HASH` within the `ZodiacGovernanceModule` to ensure the "Official" version is always verifiable on-chain.
