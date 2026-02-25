# PolyLance Deployment Guide: polylance.codes (Web3-Sovereign)

We have successfully migrated the build process to be Web3-native. The platform is now ready for deployment on decentralized infrastructure.

## 1. Frontend: Fleek + IPFS
Your frontend is now fully optimized for IPFS with relative paths and fixed polyfills.
1. **Login**: `fleek login`
2. **Setup**: I have created `fleek.config.js` in the root.
3. **Deploy**: Run `fleek deploy`.
4. **Domain**: Link `polylance.codes` in the Fleek dashboard.

## 2. Backend: Spheron / Akash (Decentralized Compute)
The backend is Dockerized for Web3 cloud providers.
1. **Spheron**: 
   - Sign in to [Spheron Network](https://spheron.network).
   - Create a new **Site** or **Cluster**.
   - Select the repository. Spheron will detect the `Dockerfile` in the root.
   - Configure **Environment Variables**:
     - `MONGODB_URI`: (Use your MongoDB Atlas connection string)
     - `GEMINI_API_KEY`: (For AI matchmaking)
     - `FRONTEND_URL`: `https://polylance.codes`
2. **Akash**: Use the generated `Dockerfile` to create an SDL for the Akash marketplace.

## 3. Storage: The Graph
The application is already integrated with The Graph for decentralized indexing.
- Ensure your Subgraph is deployed to the [Graph Studio](https://thegraph.com/studio/).
- Update `VITE_SUBGRAPH_URL` in your deployment environment if you haven't yet.

## 4. Smart Contract Migration (Mainnet)
Currently, the app is running on **Polygon Amoy**. To move to Mainnet:
1. Ensure your `.env` in the `contracts` folder has a `PRIVATE_KEY` with MATIC.
2. Flip `IS_AMOY = false` in `frontend/src/constants.js`.
3. Deploy to Mainnet:
   ```bash
   cd contracts
   npx hardhat run scripts/deploy_mainnet.js --network polygon
   ```
4. Update the contract addresses in `frontend/src/constants.js` with the new Mainnet addresses.

---
**Status:** Code is prepped. Ready for `git push`.
