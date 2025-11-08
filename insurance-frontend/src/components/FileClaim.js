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

    // Client-side validation
    if (!policyId || !description || !amount) {
      setError('All fields are required.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Claim amount must be a positive number.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ policy_id: policyId, description, amount: parsedAmount })
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
        <label htmlFor="policy-id">Policy ID</label>
        <input
          id="policy-id"
          type="text"
          value={policyId}
          onChange={(e) => setPolicyId(e.target.value)}
          placeholder="e.g., POL1001"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Annual check-up"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="amount">Claim Amount ($)</label>
        <input
          id="amount"
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