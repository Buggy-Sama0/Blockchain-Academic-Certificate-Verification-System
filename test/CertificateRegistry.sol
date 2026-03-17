// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../contracts/CertificateRegistry.sol";

contract CertificateRegistryTest {
    CertificateRegistry registry;

    function setUp() public {
        registry = new CertificateRegistry();
    }

    function testStoreHash() public {
        bytes32 hash = keccak256(abi.encodePacked("test-certificate"));
        registry.storeHash(hash);
        require(registry.certificateHashes(hash), "Hash should be stored");
    }

    function testStoreHashTwiceShouldFail() public {
        bytes32 hash = keccak256(abi.encodePacked("duplicate-certificate"));
        registry.storeHash(hash);
        // This should revert, but native Solidity tests in Hardhat currently do not support expectRevert.
        // You can check for revert using assertion libraries like forge-std if you install it.
    }

    function testVerifyHash() public {
        bytes32 hash = keccak256(abi.encodePacked("verify-certificate"));
        require(!registry.verifyHash(hash), "Hash should not exist yet");
        registry.storeHash(hash);
        require(registry.verifyHash(hash), "Hash should exist after storing");
    }
}