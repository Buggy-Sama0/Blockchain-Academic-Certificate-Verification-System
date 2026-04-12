# Blockchain Academic Certificate Verification System

## Introduction
The **Blockchain Academic Certificate Verification System** is a decentralized application (dApp) designed to combat credential fraud and streamline the verification process for academic achievements. By leveraging blockchain technology, the system provides:

*   **Tamper-proof Records**: Once a certificate's digital fingerprint (hash) is stored on the blockchain, it cannot be altered or deleted.
*   **Role-Based Access**: Specialized `ISSUER_ROLE` ensures only authorized institutions (like Universities) can register new certificates.
*   **Instant Verification**: Employers can verify any certificate in seconds by simply uploading the file; the system compares the file's hash against the blockchain's immutable ledger.
*   **Privacy-First Design**: Only the file hash and basic metadata (Name, Degree) are stored on-chain, keeping the actual sensitive documents off the public ledger.

---

## Installation Steps (Manual Setup)

Follow these steps to set up dependencies for both the contract and frontend portions of the project:

Before you start, ensure you have **Node.js 22+** and a package manager like **npm** installed.

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
npx hardhat test
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
    npx hardhat ignition deploy ignition/modules/CertificateRegistry.js --network sepolia
    ```

    - If deployment succeeds, you’ll see the deployed contract address in the output.
    - You can then view it on [Sepolia Etherscan](https://sepolia.etherscan.io/).

---
# How To Test

## MetaMask Accounts
There are total of 20 accounts in Account.txt, only Account#0 is Issuer role, others are all Employer.
You will need to import atleast two account to your MetaMask wallet inorder to test it.

Add this custom network to your MetaMask.

<img width="392" height="949" alt="image" src="https://github.com/user-attachments/assets/22a3d53d-66af-411c-b5ed-a6ea88a6e8e0" />

### 1.Import Account
1. Copy the private key in Account.txt, Account#0 is a must. Feel free to try Account#1-19.
2. Go to your MetaMask wallet, Add waller -> paste the private key

### 2.Run and deploy
Run the ***Start_project.bat***, it will automaticlly deploy contact and host website, the website should open with your browser.

### 3.Connect accounts
Inside the website there is a "Connect MetaMask Wallet" button, if you are testing with a new account you will need to use it to connect with your imported accounts.

### 4.Test with different roles
**Issuer:**
1. Open your MetaMask extension and switch to Account #0 (import its private key from the Hardhat terminal if you haven't).
Look at the React website. Because you are connected as the issuer, you should see the Name and Degree input fields.
2. Create a dummy text file on your computer (you can use diploma.txt or create one).
3. **On the website:**
 - Select diploma.txt using the file input.
 - Enter a Name (e.g., "John Doe").
 - Enter a Degree (e.g., "B.S. Computer Science").
 - Click Upload!.
5. MetaMask will pop up asking you to confirm the transaction. Click Confirm.
   
**Expected Result:** The UI status should change to "Waiting for confirmation..." then update to "Hash stored and verified."
Click the View Details button.
Expected Result: A box should appear displaying "John Doe", "B.S. Computer Science", and the current timestamp.

**Employer:**
1. Open MetaMask and switch to a different account (e.g., create a fresh Account #2 in MetaMask).
Refresh the website just to be safe.
2. **Expected Result:** The UI should automatically adapt. You should no longer see the Name/Degree inputs, and instead see a simplified view that says "Only authorized issuers can upload certificates."
3. Select the exact same diploma.txt file you used for Issuer.
4. Click *Verify*. (Notice this does not trigger a MetaMask gas fee because reading data is free).

 **Expected Result:** The screen should say "Verification: Valid (stored)".

5. Click *View Details*.
 
 **Expected Result:** The employer should be able to see "John Doe" and "B.S. Computer Science".
