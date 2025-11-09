import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Policy as PolicyIcon,
  Assignment as ClaimIcon,
  CheckCircle as ApproveIcon,
  Cancel as DeclineIcon,
  Workspaces as WorkflowIcon
} from '@mui/icons-material';

function AdminDashboard() {
  const navigate = useNavigate();
  
  // State
  const [pendingClaims, setPendingClaims] = useState([]);
  const [pendingPolicies, setPendingPolicies] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  
  const [error, setError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({});

  // --- Data Fetching ---

  // Get current user details from JWT
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decodedToken = jwtDecode(token); // <-- THIS LINE IS CHANGED
        setCurrentUser(decodedToken); // e.g., { admin_id: 'ADM002', role: 'Junior Adjuster', ... }
      }
    } catch (err) {
      console.error("Failed to decode JWT:", err);
      setError("Session error. Please log in again.");
    }
  }, []);

  // Fetch pending claims
  const fetchPendingClaims = async () => {
    setLoadingClaims(true);
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
      // Backend returns array directly, not wrapped in object
      setPendingClaims(Array.isArray(data) ? data : (data.pending_claims || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingClaims(false);
    }
  };

  // Fetch pending policies
  const fetchPendingPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/pending-policies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Could not fetch pending policies.');
      }
      const data = await response.json();
      // Backend returns array directly, not wrapped in object
      setPendingPolicies(Array.isArray(data) ? data : (data.pending_policies || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Fetch all data on initial load
  useEffect(() => {
    fetchPendingClaims();
    fetchPendingPolicies();
  }, []);

  // --- Handlers ---

  // Handle claim Approve/Decline
  const handleClaimUpdate = async (claimId, newStatus) => {
    setUpdateStatus(prev => ({ ...prev, [claimId]: 'Updating...' }));
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
      // Success! Remove from list
      setPendingClaims(prevClaims => prevClaims.filter(claim => claim.claim_id !== claimId));
      setUpdateStatus(prev => ({ ...prev, [claimId]: null }));
    } catch (err) {
      console.error(`Error updating claim ${claimId}:`, err);
      setUpdateStatus(prev => ({ ...prev, [claimId]: `Error: ${err.message}` }));
    }
  };

  // Handle policy approval (multi-step)
  const handlePolicyApprove = async (policyId) => {
    const statusKey = `policy-${policyId}`; // Use a prefix to avoid ID clashes with claims
    setUpdateStatus(prev => ({ ...prev, [statusKey]: 'Approving...' }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/policies/${policyId}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to approve policy ${policyId}`);
      }
      // Success! Refetch the list to show the new status or remove it
      fetchPendingPolicies(); 
      setUpdateStatus(prev => ({ ...prev, [statusKey]: null }));
    } catch (err) {
      console.error(`Error approving policy ${policyId}:`, err);
      setUpdateStatus(prev => ({ ...prev, [statusKey]: `Error: ${err.message}` }));
    }
  };

  // Render Policy Action Button
  const renderPolicyAction = (policy) => {
    const statusKey = `policy-${policy.policy_id}`;
    
    if (updateStatus[statusKey]) {
      return (
        <Typography variant="caption" color={updateStatus[statusKey]?.startsWith('Error') ? 'error' : 'info'}>
          {updateStatus[statusKey]}
        </Typography>
      );
    }

    if (!currentUser) {
      return <CircularProgress size={20} />;
    }

    if (policy.status === 'PENDING_INITIAL_APPROVAL') {
      return (
        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<ApproveIcon />}
          onClick={() => handlePolicyApprove(policy.policy_id)}
        >
          Initial Approve
        </Button>
      );
    }

    if (policy.status === 'PENDING_FINAL_APPROVAL') {
      if (currentUser.role !== 'Security Officer' && currentUser.role !== 'Requires Security Officer') {
        return <Chip label="Requires Security Officer" color="warning" size="small" />;
      }
      if (currentUser.admin_id === policy.initial_approver_id) {
        return <Chip label="Cannot be same approver" color="error" size="small" />;
      }
      return (
        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<ApproveIcon />}
          onClick={() => handlePolicyApprove(policy.policy_id)}
        >
          Final Approve
        </Button>
      );
    }
    
    return <Chip label={policy.status} size="small" />;
  };


  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Admin Dashboard</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<WorkflowIcon />}
          onClick={() => navigate('/admin/workflows')}
        >
          Manage Workflows
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PolicyIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Pending Policy Approvals</Typography>
          </Box>
          {loadingPolicies ? (
            <CircularProgress size={24} />
          ) : pendingPolicies.length === 0 ? (
            <Typography color="text.secondary">No policies awaiting approval.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Policy ID</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Premium</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Initial Approver</strong></TableCell>
                    <TableCell><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingPolicies.map(policy => (
                    <TableRow key={policy.policy_id}>
                      <TableCell>{policy.policy_id}</TableCell>
                      <TableCell>{policy.policy_type}</TableCell>
                      <TableCell>${parseFloat(policy.premium_amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={policy.status}
                          color={policy.status.includes('FINAL') ? 'warning' : 'info'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{policy.initial_approver_name || 'N/A'}</TableCell>
                      <TableCell>{renderPolicyAction(policy)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ClaimIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Pending Claims</Typography>
          </Box>
          {loadingClaims ? (
            <CircularProgress size={24} />
          ) : pendingClaims.length === 0 ? (
            <Typography color="text.secondary">No pending claims requiring review.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Claim ID</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Date Filed</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingClaims.map(claim => (
                    <TableRow key={claim.claim_id}>
                      <TableCell>{claim.claim_id}</TableCell>
                      <TableCell>{claim.customer_name}</TableCell>
                      <TableCell>{claim.description}</TableCell>
                      <TableCell>{new Date(claim.claim_date).toLocaleDateString()}</TableCell>
                      <TableCell>${parseFloat(claim.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {updateStatus[claim.claim_id] ? (
                          <Typography variant="caption" color={updateStatus[claim.claim_id]?.startsWith('Error') ? 'error' : 'info'}>
                            {updateStatus[claim.claim_id]}
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<ApproveIcon />}
                              onClick={() => handleClaimUpdate(claim.claim_id, 'APPROVED')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              startIcon={<DeclineIcon />}
                              onClick={() => handleClaimUpdate(claim.claim_id, 'DECLINED')}
                            >
                              Decline
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminDashboard;