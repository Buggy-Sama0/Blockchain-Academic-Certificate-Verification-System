// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateRegistry {
    mapping(bytes32 => bool) public certificateHashes;

    event CertificateStored(bytes32 indexed hash, address indexed submitter);

    // Store certificate hash on the blockchain
    function storeHash(bytes32 hash) public {
        require(!certificateHashes[hash], "Certificate already stored");
        certificateHashes[hash] = true;
        emit CertificateStored(hash, msg.sender);
    }

    // Verify if a given certificate hash exists
    function verifyHash(bytes32 hash) public view returns (bool) {
        return certificateHashes[hash];
    }
}