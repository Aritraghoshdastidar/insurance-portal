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
    <Box sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh', py: 4 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3 }}>
        {/* Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" component="h1" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                Admin Dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {currentUser ? `Welcome, ${currentUser.role || 'Admin'}` : 'Manage policies and claims'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<WorkflowIcon />}
              onClick={() => navigate('/admin/workflows')}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Manage Workflows
            </Button>
          </Box>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        {/* Pending Policy Approvals */}
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                mr: 2
              }}>
                <PolicyIcon sx={{ color: 'white' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Pending Policy Approvals</Typography>
            </Box>
            {loadingPolicies ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : pendingPolicies.length === 0 ? (
              <Typography color="text.secondary">No policies awaiting approval.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Policy ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Premium</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Initial Approver</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingPolicies.map(policy => (
                      <TableRow key={policy.policy_id} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{policy.policy_id}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{policy.policy_type}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#667eea' }}>₹{parseFloat(policy.premium_amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                        <TableCell>
                          <Chip 
                            label={policy.status.replace(/_/g, ' ')}
                            color={policy.status.includes('FINAL') ? 'warning' : 'info'}
                            size="small"
                            sx={{ fontWeight: 600 }}
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

        {/* Pending Claims */}
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                mr: 2
              }}>
                <ClaimIcon sx={{ color: 'white' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Pending Claims</Typography>
            </Box>
            {loadingClaims ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : pendingClaims.length === 0 ? (
              <Typography color="text.secondary">No pending claims requiring review.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Claim ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date Filed</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingClaims.map(claim => (
                      <TableRow key={claim.claim_id} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{claim.claim_id}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{claim.customer_name}</TableCell>
                        <TableCell>{claim.description}</TableCell>
                        <TableCell>{new Date(claim.claim_date).toLocaleDateString()}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#4facfe' }}>₹{parseFloat(claim.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
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
                                sx={{ boxShadow: 2 }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                startIcon={<DeclineIcon />}
                                onClick={() => handleClaimUpdate(claim.claim_id, 'DECLINED')}
                                sx={{ boxShadow: 2 }}
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
    </Box>
  );
}

export default AdminDashboard;