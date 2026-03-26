import { useState, useEffect } from 'react'
import { ethers } from "ethers";
import certificateArtifact from '../../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json';
import './App.css'

function Spinner() {
  return (
    <div className="spinner" style={{margin: '16px 0'}}>
      <div style={{
        width: 32,
        height: 32,
        border: '4px solid #ccc',
        borderTop: '4px solid #333',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: 'auto'
      }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileHash, setFileHash] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null)
  const [txStatus, setTxStatus] = useState("")
  const [certificateDetails, setCertificateDetails] = useState(null)
  const [userMessage, setUserMessage] = useState("");
  const [allCertificates, seAllCertificates] = useState(null);
  const [isIssuer, setIsIssuer] = useState(false);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

  const [form, setForm] = useState({
    name: "",
    degree: ""
  })
  
  async function hashFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  async function onFileChange(e) {
    if (!e.target.files?.[0]) return;

    if (e.target.files[0].size > 5000000) {
      setUserMessage("File size exceeds 5MB")
      return;
    }
    setVerifyResult(null);
    setTxStatus("");
    setSelectedFile(e.target.files[0])
    const hash= await hashFile(e.target.files[0])
    console.log('Hash:', hash);
  }

  async function getContract(withSigner=false) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    if (withSigner) {
      const signer = await provider.getSigner()
      return new ethers.Contract(contractAddress, certificateArtifact.abi, signer);
    }
    return new ethers.Contract(contractAddress, certificateArtifact.abi, provider);
  }

  // Check if connected user has ISSUER_ROLE
  async function checkIssuerRole() {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contract = await getContract(false);
      const ISSUER_ROLE = await contract.ISSUER_ROLE();
      const hasRole = await contract.hasRole(ISSUER_ROLE, address);
      setIsIssuer(hasRole);
    } catch (e) {
      console.error(e);
      setIsIssuer(false);
    }
  }

  // Only call checkIssuerRole after user interaction or after confirming account is available
  useEffect(() => {
    if (!window.ethereum) return;
    let ignore = false;
    async function handleAccountsChanged() {
      if (ignore) return;
      await checkIssuerRole();
    }
    window.ethereum.on && window.ethereum.on('accountsChanged', handleAccountsChanged);
    // Optionally, check role after first user interaction (e.g., after connect)
    window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
      if (accounts && accounts.length > 0) {
        checkIssuerRole();
      }
    });
    return () => {
      ignore = true;
      window.ethereum.removeListener && window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  async function onFileUpload() {
    if (!selectedFile) {
      setUserMessage("Please select a file first.")
      return;
    }
    if (!window.ethereum) {
      setUserMessage("MetaMask is not detected.")
      return;
    }

    if(form.name === "" || form.degree === "") {
      setUserMessage("Please enter both Name and Degree before uploading.")
      return;
    }

    try {
      setTxStatus("Requesting wallet...");
      console.log("Uploading:", selectedFile);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      
      const contract = await getContract(true)

      const hash = `0x${await hashFile(selectedFile)}`;
      setFileHash(hash)
      setTxStatus("Sending transaction...");
      const transaction = await contract.storeCertificate(hash, form.name, form.degree)
      console.log("Transaction sent: ", transaction.hash);
      setTxStatus("Waiting for confirmation...");
      const receipt = await transaction.wait()
      console.log("Transaction confirmed:", {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
      });

      const isStored = await contract.verifyHash(hash)
      setVerifyResult(isStored)
      setTxStatus(isStored ? "Hash stored and verified." : "Stored tx mined, but verify failed.");
    } catch(error) {
      setTxStatus("Upload failed.");
      console.error('Error:', error);

      const raw =
      error?.shortMessage ||
      error?.reason ||
      error?.info?.error?.message ||
      error?.message ||
      "";

      let userMessage = "Transaction failed. Please try again.";

      if (raw.includes("Certificate already stored")) {
        userMessage = "This certificate hash is already registered.";
      } else if (raw.includes("user rejected") || raw.includes("User denied")) {
        userMessage = "Transaction was cancelled in MetaMask.";
      } else if (raw.includes("insufficient funds")) {
        userMessage = "Insufficient ETH for gas fee.";
      } else if (raw.includes("network")) {
        userMessage = "Wrong network. Please switch MetaMask to Sepolia.";
      }

      setUserMessage(userMessage);
    } 
  }

  async function onVerify() {
    if (!selectedFile) {
      setUserMessage("Please select a file first.")
      return;
    }
    try {
      setTxStatus("Checking verification...");
      const contract = await getContract(false)
      const hash = `0x${await hashFile(selectedFile)}`;
      const isStored = await contract.verifyHash(hash)
      setVerifyResult(isStored);
      setTxStatus("Verification checked.");

    } catch(error) {
      setTxStatus("Upload failed.");
      console.error('Error:', error);

      const raw =
      error?.shortMessage ||
      error?.reason ||
      error?.info?.error?.message ||
      error?.message ||
      "";

      let userMessage = "Transaction failed. Please try again.";

      if (raw.includes("Certificate already stored")) {
        userMessage = "This certificate hash is already registered.";
      } else if (raw.includes("user rejected") || raw.includes("User denied")) {
        userMessage = "Transaction was cancelled in MetaMask.";
      } else if (raw.includes("insufficient funds")) {
        userMessage = "Insufficient ETH for gas fee.";
      } else if (raw.includes("network")) {
        userMessage = "Wrong network. Please switch MetaMask to Sepolia.";
      }

      setUserMessage(userMessage);
    }
    
  }

  // Fetch certificate details for the selected file's hash
  async function onViewDetails() {
    try {
      setTxStatus("Fetching certificate details...");
      const hash = `0x${await hashFile(selectedFile)}`;
      const contract = await getContract(false)
      const certificate = await contract.certificates(hash)
      // If not found, cert.hash will be 0x...0
      if (certificate.hash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        setCertificateDetails(null);
        setTxStatus("No certificate found for this file.");
      } else {
        setCertificateDetails({
          hash: certificate.hash,
          timestamp: certificate.timestamp,
          studentName: certificate.studentName,
          degree: certificate.degree
        });
        setTxStatus("Certificate details loaded.");
      }
    } catch (error) {
      setCertificateDetails(null);
      setTxStatus("Failed to fetch details.");
      setUserMessage("Error fetching certificate details.");
      console.error(error);

    }
  }

  async function getAllCertificates() {
    try {
      setTxStatus("Fetching all certificates...");
      setUserMessage("");
      const contract = await getContract(false);
      let certificatehashes = [];
      const count = await contract.getCertificateHashesLength(); 
      if (count <= 0) {
        setUserMessage("No certificates registered");
        seAllCertificates([]);
        return;
      }
      for (let i = 0; i < count; i++) {
        const hash = await contract.certificateHashes(i);
        certificatehashes.push(hash);
      }
      seAllCertificates(certificatehashes);
      setTxStatus("Fetched all certificates.");
    } catch (error) {
      setUserMessage("Could not fetch");
      setTxStatus("Fetched all certificates.");
      console.log(error);
    }
  }


  return (
    <>
      <div>
        <h1>Blockchain Academic Certificate</h1>
        <h3>File Upload</h3>
        {userMessage && <div className="user-message">{userMessage}</div>}
        {isIssuer ? (
          <>
            <div>
              <input type="file" onChange={onFileChange} />
              <button onClick={onFileUpload}>Upload!</button>
              <button onClick={onVerify} disabled={!selectedFile}>Verify</button>
              <button onClick={onViewDetails} disabled={!selectedFile}>View Details</button>
            </div>
            {selectedFile && (
              <div>
                <p>Name: {selectedFile.name}</p>
                <p>Type: {selectedFile.type || "Unknown"}</p>
                <p>Size: {selectedFile.size} bytes</p>
                <label>
                  Name:
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                  />
                </label>
                <label>
                  Degree:
                  <input
                    type="text"
                    value={form.degree}
                    onChange={e => setForm({...form, degree: e.target.value})}
                    required
                  />
                </label>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <input type="file" onChange={onFileChange} />
              <button onClick={onVerify} disabled={!selectedFile}>Verify</button>
              <button onClick={onViewDetails} disabled={!selectedFile}>View Details</button>
            </div>
            {selectedFile && (
              <div>
                <p>Name: {selectedFile.name}</p>
                <p>Type: {selectedFile.type || "Unknown"}</p>
                <p>Size: {selectedFile.size} bytes</p>
              </div>
            )}
            <div style={{color: 'gray', marginTop: 8}}>
              Only authorized issuers can upload certificates.
            </div>
          </>
        )}
        {fileHash && <p>Computed Hash: {fileHash}</p>}
        {txStatus && <p>Status: {txStatus}</p>}
        {txStatus === "Waiting for confirmation..." && <Spinner />}
        {verifyResult !== null &&  (
          <p>Verification: {verifyResult ? "Valid (stored)" : "Not found"}</p>
        )}
        {certificateDetails && (
          <div style={{border: '1px solid #ccc', padding: '10px', marginTop: '10px'}}>
            <h4>Certificate Details</h4>
            <p><b>Hash:</b> {certificateDetails.hash}</p>
            <p><b>Name:</b> {certificateDetails.studentName}</p>
            <p><b>Degree:</b> {certificateDetails.degree}</p>
            <p><b>Timestamp:</b> {new Date(Number(certificateDetails.timestamp) * 1000).toLocaleString()}</p>
          </div>
        )}
        <button onClick={getAllCertificates}>Show All Certificates</button>
        {allCertificates && allCertificates.length > 0 && (
          <div>
            <h4>All Certificate Hashes</h4>
            <ul>
              {allCertificates.map((hash, idx) => (
                <li key={idx}>{hash}</li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </>
  )
}

export default App
