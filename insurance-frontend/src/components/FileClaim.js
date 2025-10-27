import React, { useState } from 'react';

// This component takes a function `onClaimFiled` to refresh the dashboard
function FileClaim({ onClaimFiled }) {
  const [policyId, setPolicyId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ policy_id: policyId, description, amount: parseFloat(amount) })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not file claim.');
      }

      setSuccess('Claim filed successfully! ID: ' + data.claim_id);
      // Clear the form
      setPolicyId('');
      setDescription('');
      setAmount('');
      // Tell the dashboard to refresh
      onClaimFiled(); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="file-claim-form">
      <h3>File a New Claim</h3>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="form-group">
        <label>Policy ID</label>
        <input
          type="text"
          value={policyId}
          onChange={(e) => setPolicyId(e.target.value)}
          placeholder="e.g., POL1001"
          required
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Annual check-up"
          required
        />
      </div>
      <div className="form-group">
        <label>Claim Amount ($)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 250.00"
          required
        />
      </div>
      <button type="submit">Submit Claim</button>
    </form>
  );
}

export default FileClaim;