import React, { useState, useEffect } from 'react';
import FileClaim from './FileClaim'; // 👈 You already have this

function Dashboard() {
  // State for Claims
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [errorClaims, setErrorClaims] = useState(null);

  // ---  State for Policies ---
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [errorPolicies, setErrorPolicies] = useState(null);
  const [activationStatus, setActivationStatus] = useState({}); // For row-level status

// --- State for Notifications (IWAS-F-041) ---
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [errorNotifications, setErrorNotifications] = useState(null);

  // 1. fetchClaims (your existing function, renamed loading/error)
  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not fetch claims.');
      const data = await response.json();
      setClaims(data.claims || data);
    } catch (err) {
      setErrorClaims(err.message);
    } finally {
      setLoadingClaims(false);
    }
  };

  // --- fetchPolicies ---
  const fetchPolicies = async () => {
    try {
      setLoadingPolicies(true);
      setErrorPolicies(null); // Clear previous errors
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-policies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not fetch policies.');
      const data = await response.json();
      setPolicies(data.policies || data);
    } catch (err) {
      setErrorPolicies(err.message);
    } finally {
      setLoadingPolicies(false);
    }
  };

  // --- fetchNotifications (IWAS-F-041) ---
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      setErrorNotifications(null);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not fetch notifications.');
      const data = await response.json();
      setNotifications(data.notifications || data);
    } catch (err) {
      setErrorNotifications(err.message);
    } finally {
      setLoadingNotifications(false);
    }
  };  // 2. useEffect now calls both
  useEffect(() => {
    fetchClaims();
    fetchPolicies();
    fetchNotifications(); // IWAS-F-041
  }, []); 

  // 3. handleClaimFiled (your existing function)
  const handleClaimFiled = () => {
    fetchClaims(); // This refreshes the claims list
  };

  // --- handleActivatePolicy (Mock Payment) ---
  const handleActivatePolicy = async (policyId) => {
    // Show a simple confirmation for the mock payment
    if (!window.confirm("This is a mock payment.\nDo you want to simulate a successful payment and activate this policy?")) {
      return;
    }

    setActivationStatus(prev => ({ ...prev, [policyId]: 'Activating...' }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/policies/${policyId}/mock-activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not activate policy.');
      }

      // Success! Refresh the policy list to show the new "ACTIVE" status
      console.log('Mock activation successful:', data.message);
      setActivationStatus(prev => ({ ...prev, [policyId]: 'Activated!' }));
      fetchPolicies(); // Refresh the list

    } catch (err) {
      console.error('Mock Activation Error:', err);
      setActivationStatus(prev => ({ ...prev, [policyId]: `Error: ${err.message}` }));
    }
  };


  // --- Render ---
  return (
    <div className="dashboard-container">
      
      {/* --- Notifications Section (IWAS-F-041) --- */}
      <h2>Recent Notifications <span role="img" aria-label="bell">🔔</span></h2>
      {loadingNotifications ? (
         <div>Loading notifications...</div>
       ) : errorNotifications ? (
         <div className="error">{errorNotifications}</div>
       ) : notifications && Array.isArray(notifications) ? (
         notifications.length === 0 ? (
           <p>No recent notifications.</p>
         ) : (
           <ul className="notifications-list"> {/* Use class from App.css */}
             {notifications.map(notif => (
               <li key={notif.notification_id}>
                 <small>{new Date(notif.sent_timestamp).toLocaleString()}</small>
                 <p>{notif.message}</p>
               </li>
             ))}
           </ul>
         )
       ) : (
         <div className="error">Error loading notifications</div>
       )}
      <hr className="section-divider" />
      
      {/* ---  Policies Section --- */}
      <h2>My Policies</h2>
      {loadingPolicies ? (
        <div>Loading policies...</div>
      ) : errorPolicies ? (
        <div className="error">{errorPolicies}</div>
      ) : !policies || !Array.isArray(policies) ? (
        <div className="error">Error loading policies</div>
      ) : policies.length === 0 ? (
        <p>No policies found</p>
      ) : (
        <table className="claims-table" style={{ marginBottom: '40px' }}>
          <thead>
            <tr>
              <th>Policy ID</th>
              <th>Type</th>
              <th>Premium</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {policies.map(policy => {
              const statusMsg = activationStatus[policy.policy_id];
              return (
                <tr key={policy.policy_id}>
                  <td>{policy.policy_id}</td>
                  <td>{policy.policy_type}</td>
                  <td>${parseFloat(policy.premium_amount).toFixed(2)}</td>
                  <td>
                    <span className={`status status-${policy.status.toLowerCase().replace(/_/g, '-')}`}>
                       {policy.status.replace(/_/g, ' ')} {/* Make status more readable */}
                    </span>
                  </td>
                  <td>
                    {/* Show button ONLY if payment is needed */}
                    {policy.status === 'INACTIVE_AWAITING_PAYMENT' && !statusMsg && (
                      <button
                        className="action-button approve-button" // Using approve style
                        onClick={() => handleActivatePolicy(policy.policy_id)}
                      >
                        Activate (Mock Pay)
                      </button>
                    )}
                    {/* Show status message during/after activation attempt */}
                    {statusMsg && (
                      <span className={statusMsg.startsWith('Error') ? 'error-inline' : 'loading-inline'}>
                        {statusMsg}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* --- Existing Claims Section --- */}
      <FileClaim onClaimFiled={handleClaimFiled} />

      <h2 style={{marginTop: '40px'}}>My Claims</h2>
      {loadingClaims ? (
        <div>Loading claims...</div>
      ) : errorClaims ? (
        <div className="error">{errorClaims}</div>
      ) : !claims || !Array.isArray(claims) ? (
        <div className="error">Could not fetch claims.</div>
      ) : claims.length === 0 ? (
        <p>No claims found</p>
      ) : (
        <table className="claims-table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(claim => (
              <tr key={claim.claim_id}>
                <td>{claim.claim_id}</td>
                <td>{claim.description}</td>
                <td>${parseFloat(claim.amount).toFixed(2)}</td>
                <td>
                  <span className={`status status-${claim.status ? claim.status.toLowerCase() : 'pending'}`}>
                    {claim.status || 'PENDING'}
                  </span>
                </td>
                <td>
                  {claim.status === 'PENDING' && (
                    <button className="action-button" disabled>
                      Processing
                    </button>
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

export default Dashboard;