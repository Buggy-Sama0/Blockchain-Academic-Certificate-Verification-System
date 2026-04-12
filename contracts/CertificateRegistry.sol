// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract CertificateRegistry is AccessControl {
    // Unique identifier for the ISSUER_ROLE using Keccak256 hashing
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    // Data structure to store certificate details on-chain
    struct Certificate {
        bytes32 hash;           // Unique digital fingerprint (SHA-256/Keccak256) of the file
        uint256 timestamp;      // The block time when the certificate was registered
        string studentName;     // Name of the certificate holder
        string degree;          // Title of the degree or qualification earned
    }

    // Dynamic array to store all registered certificate hashes for enumeration
    bytes32[] public certificateHashes;
    
    // Mapping for O(1) efficient lookup of certificate data using its hash as the key
    mapping(bytes32 => Certificate) public certificates;

    // Event emitted upon successful storage to allow for off-chain monitoring/indexing
    event CertificateStored(bytes32 indexed hash, address indexed submitter);

    constructor() {
        // Grant the deployer both Admin and Issuer roles upon contract creation
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    /**
     * @dev Stores a new certificate hash and metadata on the blockchain.
     * @param _hash The cryptographic hash of the certificate file.
     * @param name The name of the student.
     * @param _degree The degree earned.
     * Can only be called by accounts with the ISSUER_ROLE.
     */
    function storeCertificate(bytes32 _hash, string memory name, string memory _degree) public onlyRole(ISSUER_ROLE) {
        // Ensure the certificate hasn't been registered previously to maintain integrity
        require(certificates[_hash].hash == 0, "Certificate already stored");
        
        Certificate memory certificate = Certificate({
            hash: _hash,
            timestamp: block.timestamp,
            studentName: name,
            degree: _degree
        });

        // Save certificate details in the mapping and add the hash to the global list
        certificates[_hash] = certificate;
        certificateHashes.push(_hash);
        
        emit CertificateStored(_hash, msg.sender);
    }

    /**
     * @dev Public function to verify if a certificate hash exists on the blockchain.
     * @param _hash The hash to check.
     * @return bool True if the certificate is valid and exists in our records.
     */
    function verifyHash(bytes32 _hash) public view returns (bool) {
        return certificates[_hash].hash != 0;
    }

    /**
     * @dev Utility function to retrieve the total number of registered certificates.
     */
    function getCertificateHashesLength() public view returns (uint256) {
        return certificateHashes.length;
    }
}