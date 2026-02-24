# PolyLance Sovereign Roadmap: The Path to Decentralization

To achieve a "bare metal," censorship-resistant marketplace, we must migrate away from the centralized Node.js/MongoDB hub. This roadmap outlines the architectural shift toward a **purely decentralized stack** using IPFS, The Graph, and Polygon.

## 1. Metadata Sovereignty (IPFS)
*   **Current State:** Job metadata and user profiles are stored in MongoDB.
*   **Target State:** All metadata is serialized to JSON and pinned to IPFS. Only the IPFS Content Identifier (CID) is stored on-chain or emitted in events.
*   **Actionable:**
    *   Update `FreelanceEscrow.sol` to accept IPFS hashes for all metadata types.
    *   Integrate Pinata or a local IPFS node into the React frontend.
*   **Benefit:** Zero centralized database dependency. Even if the website goes down, the data remains accessible via any IPFS gateway.

## 2. Event-Driven Indexing (The Graph)
*   **Current State:** The backend scans the blockchain and updates MongoDB.
*   **Target State:** Replace the backend logic with a **Subgraph**. The frontend queries the Subgraph directly via GraphQL.
*   **Actionable:**
    *   Expand `subgraph.yaml` to index `JobCreated`, `WorkSubmitted`, `MilestoneReleased`, and `DisputeRaised` events.
    *   Remove Express/MongoDB dependency for data fetching.
*   **Benefit:** Trustless, verifiable data indexing that anyone can run.

## 3. Sovereign Communication (XMTP)
*   **Current State:** Chat might rely on socket.io (as seen in `useSocket.js`).
*   **Target State:** Full migration to **XMTP V3**.
*   **Actionable:**
    *   Phase out the Socket.js backend.
    *   Implement end-to-end encrypted, wallet-to-wallet messaging for all negotiations.

## 4. Cross-Chain Portability (Chainlink CCIP)
*   **Goal:** Allow "Work Anywhere, Get Paid Anywhere."
*   **Shift:** 
    *   Use CCIP to allow reputation scores (SBTs) to be bridged across chains.
    *   Enable cross-chain escrow funding (e.g., pay via Arbitrum, execute on Polygon).

## 5. Hosting & Deployment (Fleek/IPFS)
*   **Target:** Move frontend hosting from Vercel/Render to **Fleek**.
*   **Constraint:** Ensure `base: './'` in `vite.config.js` for IPFS-compatible relative paths.

---
**Lead Architect:** Akhil Muvva  
**Architecture Support:** Jhansi Kupireddy  
**Status:** Implementation Initialized
