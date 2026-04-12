import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ABI (Application Binary Interface) - Defines the methods available in our Smart Contract for the frontend to call
const CONTRACT_ABI = [
  "function storeCertificate(bytes32 _hash, string memory name, string memory _degree) public",
  "function verifyHash(bytes32 _hash) public view returns (bool)",
  "function certificates(bytes32) public view returns (bytes32 hash, uint256 timestamp, string studentName, string degree)",
  "function ISSUER_ROLE() public view returns (bytes32)",
  "function hasRole(bytes32 role, address account) public view returns (bool)"
];

// The deployed address of our contract on the Hardhat Local Node
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function App() {

  // Application State Management
  const [account, setAccount] = useState("");          // Current user's wallet address
  const [isIssuer, setIsIssuer] = useState(false);      // Boolean to check if user has Admin/Issuer rights
  const [selectedFile, setSelectedFile] = useState(null); // The actual certificate file selected
  const [fileHash, setFileHash] = useState("");         // The SHA-256 (Keccak) hash of the file
  const [form, setForm] = useState({ name: "", degree: "" }); // Form data for metadata
  const [status, setStatus] = useState({ type: "", message: "" }); // Status messages for UI
  const [certDetails, setCertDetails] = useState(null); // Data retrieved from blockchain during verification

  // Checks if the connected wallet address has the "ISSUER_ROLE" assigned in the Smart Contract
  const checkIssuerRole = async (addr) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const role = await contract.ISSUER_ROLE(); // Get the hash identifier for ISSUER_ROLE
      const is_issuer = await contract.hasRole(role, addr); // Query contract for role status
      setIsIssuer(is_issuer);
    } catch (error) {
      console.error("Role check failed", error);
    }
  };
  

  // Automatically check if the user is already logged into MetaMask on page load
  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          checkIssuerRole(accounts[0]);
        }
      } catch (error) {
        console.error("Wallet connection check failed", error);
      }
    }
  };

  // React hook that runs once when the component mounts (page loads)
  useEffect(() => {
    checkWalletConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request a connection to the user's MetaMask wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        checkIssuerRole(accounts[0]);
      } catch {
        setStatus({ type: 'error', message: 'Failed to connect wallet' });
      }
    } else {
      setStatus({ type: 'error', message: 'Please install MetaMask!' });
    }
  };



  // Handles file selection and generates a unique cryptographic hash (digital fingerprint)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    
    // Clear previous verification/upload results when a new file is picked
    setSelectedFile(null);
    setFileHash("");
    setStatus({ type: '', message: '' });
    setCertDetails(null);

    if (!file) return;

    // Security Check: Block unsupported file extensions
    if (!file.type.match(/(pdf|jpeg|png|jpg)$/i)) {
      setStatus({ type: 'error', message: 'Error: Only PDF, JPG, and PNG files are allowed' });
      return;
    }

    // Integrity Check: Block empty (0 byte) files
    if (file.size === 0) {
      setStatus({ type: 'error', message: 'Error: Cannot upload empty (0 byte) file' });
      return;
    }

    // Performance/Cost Check: Limit file size to 5MB
    if (file.size > 5000000) {
      setStatus({ type: 'error', message: 'Error: File must be smaller than 5MB' });
      return;
    }

    
    try {
      // Read file content as raw bytes and compute the Keccak256 hash locally
      const buffer = await file.arrayBuffer();
      const hash = ethers.keccak256(new Uint8Array(buffer));
      setFileHash(hash);
      setStatus({ type: 'success', message: 'File hash computed successfully!' });
    } catch {
      setStatus({ type: 'error', message: 'File processing failed' });
    }
  };

  // Submits the certificate hash and metadata to the blockchain (Restricted to Issuers)
  const handleUpload = async () => {
    // Basic validation for required fields
    if (!fileHash || !form.name.trim() || !form.degree.trim()) {
      setStatus({ type: 'error', message: 'Please fill in all information and upload a valid file' });
      return;
    }

    // Input Sanitization: Only allow standard characters, numbers, and basic punctuation
    const isValidName = /^[a-zA-Z0-9\s.,'-]+$/.test(form.name.trim());
    const isValidDegree = /^[a-zA-Z0-9\s.,'-]+$/.test(form.degree.trim());
    if (!isValidName || !isValidDegree) {
      setStatus({ type: 'error', message: 'Error: Name and Degree cannot contain special characters' });
      return;
    }

    try {
      setStatus({ type: 'loading', message: 'Submitting transaction...' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(); // Requires a "Signer" to execute write operations (gas fees)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // Execute the smart contract function to store data on-chain
      const tx = await contract.storeCertificate(fileHash, form.name, form.degree);
      setStatus({ type: 'loading', message: 'Transaction sent, waiting for confirmation...' });
      await tx.wait(); // Wait for the Ethereum network to mine the block
      setStatus({ type: 'success', message: 'Certificate stored successfully on blockchain!' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Upload failed:' + (error.reason || error.message) });
    }
  };

  // Verifies the authenticity of a file by comparing its hash against blockchain records
  const handleVerify = async () => {
    if (!fileHash) {
      setStatus({ type: 'error', message: 'Please select a file' });
      return;
    }
    
    try {
      setStatus({ type: 'loading', message: 'Verifying...' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // Query the contract to see if this specific hash exists in its storage mapping
      const isValid = await contract.verifyHash(fileHash);
      if (isValid) {
        // If valid, retrieve the actual metadata (Student Name, Degree, Date) stored alongside the hash
        const details = await contract.certificates(fileHash);
        setCertDetails({
          hash: details.hash,
          studentName: details.studentName,
          degree: details.degree,
          timestamp: new Date(Number(details.timestamp) * 1000).toLocaleString() // Format Unix timestamp
        });
        setStatus({ type: 'success', message: 'Certificate verified successfully!' });
      } else {
        setCertDetails(null);
        setStatus({ type: 'error', message: 'No matching certificate record found' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Verification failed' });
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Academic Certificate Verification</h1>
        <p style={styles.subtitle}>Decentralized Authentication Powered by Blockchain</p>
      </header>

      <div style={styles.walletSection}>
        {account ? (
          <p style={styles.accountText}>
            <span style={styles.dotConnected}></span> Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        ) : (
          <button style={styles.connectBtn} onClick={connectWallet}>Connect MetaMask Wallet</button>
        )}
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.leftCol}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>File Operations</h3>
            <div style={styles.fileDropArea}>
              <input type="file" accept=".pdf,.jpeg,.jpg,.png" onChange={handleFileChange} style={styles.fileInput} id="file-upload"/>
              <label htmlFor="file-upload" style={styles.fileLabel}>
                {selectedFile ? `Selected: ${selectedFile.name}` : "Drag & drop or click to upload certificate"}
              </label>
            </div>

            {fileHash && (
              <p style={styles.hashText}>
                <strong>File Hash:</strong> {fileHash.slice(0, 20)}...
              </p>
            )}

            {isIssuer && (
              <div style={styles.formGroup}>
                <h4 style={styles.sectionTitle}>Issue Certificate Details (Issuer Only)</h4>
                <input
                  type="text"
                  placeholder="Student Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Degree Earned (e.g., B.Sc. in Computer Science)"
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  style={styles.input}
                />
                <button style={styles.actionBtnPrimary} onClick={handleUpload}>
                  Store to Blockchain
                </button>
              </div>
            )}

            <div style={{ marginTop: '15px' }}>
              <button style={styles.actionBtnSecondary} onClick={handleVerify}>
                Verify Validity
              </button>
            </div>
          </div>
        </div>

        <div style={styles.rightCol}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Verification Result</h3>
            
            {status.message && (
              <div style={{
                ...styles.statusBox,
                backgroundColor: status.type === 'error' ? '#fee2e2' : status.type === 'success' ? '#dcfce7' : '#e0f2fe',
                color: status.type === 'error' ? '#991b1b' : status.type === 'success' ? '#166534' : '#0369a1'
              }}>
                {status.message}
              </div>
            )}

            {certDetails ? (
              <div style={styles.detailsBox}>
                <h4 style={styles.detailsTitle}>Certificate Record ✅</h4>
                <div style={styles.detailsRow}>
                  <span style={styles.detailsLabel}>Student Name:</span>
                  <span style={styles.detailsValue}>{certDetails.studentName}</span>
                </div>
                <div style={styles.detailsRow}>
                  <span style={styles.detailsLabel}>Degree:</span>
                  <span style={styles.detailsValue}>{certDetails.degree}</span>
                </div>
                <div style={styles.detailsRow}>
                  <span style={styles.detailsLabel}>Issued at:</span>
                  <span style={styles.detailsValue}>{certDetails.timestamp}</span>
                </div>
                <div style={styles.detailsRow}>
                  <span style={styles.detailsLabel}>On-chain Hash:</span>
                  <span style={{ ...styles.detailsValue, fontSize: '11px', wordBreak: 'break-all' }}>{certDetails.hash}</span>
                </div>
              </div>
            ) : (
              <p style={styles.emptyText}>On-chain details will appear here after verification</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '20px', fontFamily: 'system-ui, sans-serif', color: '#333' },
  header: { textAlign: 'center', marginBottom: '30px' },
  title: { fontSize: '28px', color: '#1a56db', marginBottom: '5px' },
  subtitle: { fontSize: '14px', color: '#6b7280' },
  walletSection: { display: 'flex', justifyContent: 'center', marginBottom: '20px' },
  connectBtn: { backgroundColor: '#1a56db', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
  accountText: { fontSize: '14px', fontWeight: 'bold', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' },
  dotConnected: { width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' },
  cardTitle: { fontSize: '18px', marginBottom: '15px', color: '#111827' },
  fileDropArea: { border: '2px dashed #d1d5db', padding: '20px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f9fafb' },
  fileInput: { display: 'none' },
  fileLabel: { color: '#4b5563', fontSize: '14px', cursor: 'pointer' },
  hashText: { fontSize: '12px', color: '#6b7280', marginTop: '10px', wordBreak: 'break-all' },
  formGroup: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  sectionTitle: { fontSize: '14px', color: '#374151', marginBottom: '5px' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' },
  actionBtnPrimary: { backgroundColor: '#10b981', color: '#fff', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
  actionBtnSecondary: { backgroundColor: '#4b5563', color: '#fff', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  statusBox: { padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '15px', textAlign: 'center' },
  detailsBox: { backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  detailsTitle: { fontSize: '16px', color: '#0f172a', marginBottom: '10px' },
  detailsRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' },
  detailsLabel: { fontSize: '13px', color: '#64748b' },
  detailsValue: { fontSize: '13px', color: '#0f172a', fontWeight: '500' },
  emptyText: { color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '40px 0' }
};
