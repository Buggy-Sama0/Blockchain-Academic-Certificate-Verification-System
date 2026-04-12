import { expect } from "chai";
import hre from "hardhat";


// Connect to the Hardhat network helpers to allow for blockchain state manipulation during testing
const { ethers, networkHelpers } = await hre.network.connect();

describe("CertificateRegistry", function () {
  let CertificateRegistry, registry, owner, issuer, other;

  // Before each test, deploy a fresh instance of the contract to ensure a clean state
  beforeEach(async function () {
    // Get distinct signers to represent different participants: Admin, Issuer, and Public/Employer
    [owner, issuer, other] = await ethers.getSigners();
    
    // Deploy the CertificateRegistry smart contract
    CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    registry = await CertificateRegistry.deploy();
    await registry.waitForDeployment();
  });

  // Test to verify that the contract deployer (owner) is automatically granted the issuer role
  it("owner has ISSUER_ROLE by default", async function () {
    const role = await registry.ISSUER_ROLE();
    expect(await registry.hasRole(role, owner.address)).to.be.true;
  });

  // Test the Role-Based Access Control (RBAC) specifically for certificate storage
  it("only ISSUER_ROLE can upload certificates", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("cert1"));
    
    // Successful case: Owner has the role and can submit
    await expect(
      registry.connect(owner).storeCertificate(hash, "Alice", "BSc")
    ).to.emit(registry, "CertificateStored");

    // Failure case: 'other' account lacks the role and should be rejected by the contract
    await expect(
      registry.connect(other).storeCertificate(hash, "Bob", "MSc")
    ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
  });

  // Test the ability to dynamically manage roles via the Admin account
  it("admin can grant and revoke ISSUER_ROLE", async function () {
    const role = await registry.ISSUER_ROLE();
    
    // Grant role to a new address
    await registry.grantRole(role, issuer.address);
    expect(await registry.hasRole(role, issuer.address)).to.be.true;

    // Revoke the role and verify the change
    await registry.revokeRole(role, issuer.address);
    expect(await registry.hasRole(role, issuer.address)).to.be.false;
  });

  // Test the data integrity check preventing the same file hash from being re-registered
  it("prevents duplicate certificate uploads", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("cert2"));
    
    // First submission succeeds
    await registry.storeCertificate(hash, "Alice", "BSc");
    
    // Second submission of the same file hash must be reverted by the contract logic
    await expect(
      registry.storeCertificate(hash, "Alice", "BSc")
    ).to.be.revertedWith("Certificate already stored");
  });

  // Test that verification functions are public and accessible to anyone (like Employers)
  it("anyone can verify a certificate", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("cert3"));
    await registry.storeCertificate(hash, "Alice", "BSc");
    
    // 'other' account (the employer) can query the contract without a special role
    expect(await registry.connect(other).verifyHash(hash)).to.be.true;
    expect(await registry.connect(other).verifyHash(ethers.ZeroHash)).to.be.false;
  });

  // Test that metadata (name, degree) matches the original input after being stored on-chain
  it("certificate metadata is stored and retrievable", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("cert4"));
    await registry.storeCertificate(hash, "Alice", "BSc");
    
    const cert = await registry.certificates(hash);
    expect(cert.hash).to.equal(hash);
    expect(cert.studentName).to.equal("Alice");
    expect(cert.degree).to.equal("BSc");
  });

  // Test the enumeration capability to list all registered certificate hashes
  it("certificateHashes array is updated", async function () {
    const hash1 = ethers.keccak256(ethers.toUtf8Bytes("cert5"));
    const hash2 = ethers.keccak256(ethers.toUtf8Bytes("cert6"));
    
    await registry.storeCertificate(hash1, "Alice", "BSc");
    await registry.storeCertificate(hash2, "Bob", "MSc");
    
    // Verify sequence and total count in the public hash array
    expect(await registry.certificateHashes(0)).to.equal(hash1);
    expect(await registry.certificateHashes(1)).to.equal(hash2);
    
    const count = await registry.getCertificateHashesLength();
    expect(count).to.equal(2);
  });
});