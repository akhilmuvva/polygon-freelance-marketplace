# FreelanceEscrow Subgraph
**Developed by:** Akhil Muvva & Balram Taddi

This subgraph indexes events from the `FreelanceEscrow` smart contract on Polygon (Mumbai/Amoy).

## Prerequisites

1.  **Node.js**: Installed on your system.
2.  **Graph CLI**: Install globally using `npm install -g @graphprotocol/graph-cli`.

## Setup Instructions

1.  **Initialize Dependencies**:
    Navigate to this directory and run:
    ```bash
    npm install
    ```

2.  **Update Contract Address**:
    Open `subgraph.yaml` and update the `source.address` with your deployed `FreelanceEscrow` contract address. Also, update `startBlock` to the block number where the contract was deployed for faster syncing.

3.  **Generate Types**:
    Run the following command to generate AssemblyScript types from the GraphQL schema and ABI:
    ```bash
    npm run codegen
    ```

4.  **Build**:
    Compile the mappings to WebAssembly:
    ```bash
    npm run build
    ```

5.  **Deploy**:
    - For **The Graph Studio**: Create a subgraph in the [Studio](https://thegraph.com/studio/), get your deployment key, and run:
      ```bash
      graph auth --studio <DEPLOY_KEY>
      npm run deploy
      ```

## Entities

- **Job**: Stores details about each freelance job, status, and related metadata.
- **User**: Stores historical data about clients and freelancers.
