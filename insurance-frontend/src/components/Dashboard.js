import React, { useState, useEffect } from 'react';
import FileClaim from './FileClaim'; // 👈 IMPORTED

function Dashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Moved fetchClaims out so we can call it again
  const fetchClaims = async () => {
    try {
      setLoading(true); // Show loading while we refetch
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-claims', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Could not fetch claims.');
      }

      const data = await response.json();
      setClaims(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. useEffect now just calls fetchClaims once on load
  useEffect(() => {
    fetchClaims();
  }, []); // The empty array [] means "run this only once"

  // 3. This function will be passed to the form
  const handleClaimFiled = () => {
    fetchClaims(); // This refreshes the claims list
  };

  // Render the component
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      {/* 4. ADDED THE FILE CLAIM FORM HERE */}
      <FileClaim onClaimFiled={handleClaimFiled} />

      <h2 style={{marginTop: '40px'}}>My Claims</h2>
      {loading ? (
        <div>Loading claims...</div>
      ) : claims.length === 0 ? (
        <p>You have not filed any claims yet.</p>
      ) : (
        <table className="claims-table">
          {/* ... (table code is unchanged) ... */}
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Description</th>
              <th>Date Filed</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(claim => (
              <tr key={claim.claim_id}>
                <td>{claim.claim_id}</td>
                <td>{claim.description}</td>
                <td>{new Date(claim.claim_date).toLocaleDateString()}</td>
                <td>${parseFloat(claim.amount).toFixed(2)}</td>
                <td>
                  <span className={`status status-${claim.claim_status.toLowerCase()}`}>
                    {claim.claim_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;