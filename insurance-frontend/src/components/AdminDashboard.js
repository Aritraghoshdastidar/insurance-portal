import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Make sure Link is imported

function AdminDashboard() {
  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({}); // To show loading/error per row

  // Function to fetch claims (now reusable)
  const fetchPendingClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/pending-claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Could not fetch pending claims.');
      }
      const data = await response.json();
      setPendingClaims(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch claims on initial load
  useEffect(() => {
    fetchPendingClaims();
  }, []);

  // --- Function to handle Approve/Decline ---
  const handleUpdateStatus = async (claimId, newStatus) => {
    setUpdateStatus(prev => ({ ...prev, [claimId]: 'Updating...' }));
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to update claim ${claimId}`);
      }

      // Success! Remove the claim from the list visually
      setPendingClaims(prevClaims => prevClaims.filter(claim => claim.claim_id !== claimId));
      setUpdateStatus(prev => ({ ...prev, [claimId]: null }));

    } catch (err) {
      console.error(`Error updating claim ${claimId}:`, err);
      setUpdateStatus(prev => ({ ...prev, [claimId]: `Error: ${err.message}` }));
    }
  };

  // --- Render Logic ---
  if (loading) return <div>Loading pending claims...</div>;
  if (error && pendingClaims.length === 0) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      {/* --- ADDED THIS SECTION BACK --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Admin Dashboard - Pending Claims</h2>
        <Link to="/admin/workflows">
          <button className="button-secondary" style={{ width: 'auto' }}>
            Manage Workflows
          </button>
        </Link>
      </div>
      {/* --- END OF ADDED SECTION --- */}

      {error && <div className="error">{error}</div>} {/* Show general error above table */}

      {pendingClaims.length === 0 ? (
        <p>There are no pending claims requiring review.</p>
      ) : (
        <table className="claims-table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Customer ID</th>
              <th>Description</th>
              <th>Date Filed</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingClaims.map(claim => (
              <tr key={claim.claim_id}>
                <td>{claim.claim_id}</td>
                <td>{claim.customer_id}</td>
                <td>{claim.description}</td>
                <td>{new Date(claim.claim_date).toLocaleDateString()}</td>
                <td>${parseFloat(claim.amount).toFixed(2)}</td>
                <td>
                  {updateStatus[claim.claim_id] ? (
                     <span className={updateStatus[claim.claim_id]?.startsWith('Error') ? 'error-inline' : 'loading-inline'}>
                       {updateStatus[claim.claim_id]}
                     </span>
                  ) : (
                    <>
                      <button
                        className="action-button approve-button"
                        onClick={() => handleUpdateStatus(claim.claim_id, 'APPROVED')}
                      >
                        Approve
                      </button>
                      <button
                        className="action-button decline-button"
                        onClick={() => handleUpdateStatus(claim.claim_id, 'DECLINED')}
                      >
                        Decline
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminDashboard;