import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "dotenv/config";

const sepoliaPrivateKey = process.env.SEPOLIA_PRIVATE_KEY ?? "";
const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL ?? "";
const hasSepoliaConfig = sepoliaRpcUrl.length > 0 && sepoliaPrivateKey.length > 0;

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.28",
  },
  networks: hasSepoliaConfig
    ? {
        sepolia: {
          type: "http",
          url: sepoliaRpcUrl,
          accounts: [
            sepoliaPrivateKey.startsWith("0x")
              ? sepoliaPrivateKey
              : `0x${sepoliaPrivateKey}`,
          ],
        },
      }
    : {},
});