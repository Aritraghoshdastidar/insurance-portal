// src/components/DocumentProcessor.js 13
import React, { useState } from "react";
import axios from "axios";

function DocumentProcessor() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    if (!file) return setError("Please choose a file first.");
    setError(null);
    const formData = new FormData();
    formData.append("document", file);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/documents/process",
        formData
      );
      setResult(res.data.extracted);
    } catch {
      setError("Document processing failed.");
    }
  };

  return (
    <div className="card-container">
      <h2>Intelligent Document Processor</h2>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept=".txt,.pdf"
      />
      <button onClick={handleUpload}>Upload & Process</button>
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="results">
          <h3>Extracted Data</h3>
          <p>Claim ID: {result.claim_id}</p>
          <p>Amount: ₹{result.amount}</p>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
}

export default DocumentProcessor;
