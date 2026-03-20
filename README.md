# Blockchain-Academic-Certificate-Verification-System

## Installation Steps

Follow these steps to set up dependencies for both the contract and frontend portions of the project:

Before you start, ensure you have **Node.js 22+** and a package manager like **npm** or **pnpm** installed.

### 1. Contract Dependencies

1. Ensure you are in the root project directory.
2. Install the following npm packages:
    ```bash
    npm install @nomicfoundation/hardhat-toolbox-mocha-ethers@^3.0.3 dotenv@^17.3.1 hardhat@^3.1.12
    ```

### 2. Frontend Dependencies

1. Change into the frontend directory:
    ```bash
    cd frontend
    ```
2. Install the ethers.js library:
    ```bash
    npm install ethers
    ```

---
Proceed with the rest of the setup or development as required.

---
### Running your test
To run all the tests in a Hardhat project, you can run:
    ```bash
    npm hardhat test
    ```

### Deploying to Sepolia Testnet

1. **Get Sepolia RPC credentials:**
    - [Alchemy](https://www.alchemy.com/) or similar services can provide a Sepolia RPC URL and you can use their faucet to get Sepolia ETH.

2. **Update your Hardhat config (`hardhat.config.js`):**
    ```Javascript
    import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
    import { defineConfig } from "hardhat/config";

    export default defineConfig({
      plugins: [hardhatToolboxViemPlugin],
      solidity: {
        version: "0.8.28",
      },
      networks: {
        sepolia: {
          type: "http",
          url: "<SEPOLIA_RPC_URL>",
          accounts: ["<SEPOLIA_PRIVATE_KEY>"],
        },
      },
    });
    ```
    **Replace** `<SEPOLIA_RPC_URL>` and `<SEPOLIA_PRIVATE_KEY>` with your own values.  
    _Note: Keeping private keys in config files is a security risk—this is for learning/demo only!_

3. **Deploy the contract:**
    ```sh
    npx hardhat ignition deploy ignition/modules/Counter.ts --network sepolia
    ```

    - If deployment succeeds, you’ll see the deployed contract address in the output.
    - You can then view it on [Sepolia Etherscan](https://sepolia.etherscan.io/).

---

