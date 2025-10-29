// src/components/HighRiskAlerts.js 14
import React, { useEffect, useState } from "react";
import axios from "axios";

function HighRiskAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/alerts/highrisk")
      .then((res) => setAlerts(res.data.high_risk_claims || []))
      .catch(() => setError("Failed to fetch alerts."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading alerts...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card-container">
      <h2>High-Risk Claims Alerts</h2>
      {alerts.length === 0 ? (
        <p>No high-risk claims detected.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Customer ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.claim_id}>
                <td>{a.claim_id}</td>
                <td>{a.customer_id}</td>
                <td>₹{a.amount}</td>
                <td>{a.claim_status}</td>
                <td>{a.risk_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default HighRiskAlerts;
