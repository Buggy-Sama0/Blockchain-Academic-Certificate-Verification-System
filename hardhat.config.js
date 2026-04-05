import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "dotenv/config";

const sepoliaPrivateKey = process.env.SEPOLIA_PRIVATE_KEY ?? "";
const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL ?? "";
// Only activate Sepolia if the private key looks like a real 64-char hex key (so it ignores the dummy text)
const hasSepoliaConfig = sepoliaRpcUrl.length > 0 && sepoliaPrivateKey.length >= 64;

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