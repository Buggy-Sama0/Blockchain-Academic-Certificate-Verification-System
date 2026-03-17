import { useState } from 'react'
import { ethers } from "ethers";
import certificateArtifact from '../../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json';
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const contractAddress = "0x51e0fc8417e89B208995422A173a45B0c2A28DD0"

  async function hashFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  async function onFileChange(e) {
    if (e.target.files[0].size > 5000000) {
      alert("File size exceeds 5MB");
      return;
    }
    setSelectedFile(e.target.files[0])
    const hash= await hashFile(e.target.files[0])
    console.log('Hash:', hash);
  }

  async function onFileUpload() {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }
    console.log("Uploading:", selectedFile);

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, certificateArtifact.abi, signer)
  }

  return (
    <>
      <div>
        <h1>Blockchain Academic Certificate</h1>
        <h3>File Upload</h3>
        <div>
          <input type="file" onChange={onFileChange} />
          <button onClick={onFileUpload}>Upload!</button>
        </div>
        {selectedFile && (
        <div>
          <p>Name: {selectedFile.name}</p>
          <p>Type: {selectedFile.type || "Unknown"}</p>
          <p>Size: {selectedFile.size} bytes</p>
        </div>
      )}
      </div>
    </>
  )
}

export default App
