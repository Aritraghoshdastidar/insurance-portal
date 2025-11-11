import React, { useState, useEffect, useRef } from 'react';
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
  Grid,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Policy as PolicyIcon,
  Assignment as ClaimIcon,
  Notifications as NotificationIcon,
  ShoppingCart as BuyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FileClaim from './FileClaim';

function Dashboard() {
  const navigate = useNavigate();
  
  // State for Claims
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [errorClaims, setErrorClaims] = useState(null);

  // State for Policies
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [errorPolicies, setErrorPolicies] = useState(null);
  const [activationStatus, setActivationStatus] = useState({});
  const activatingRef = useRef(new Set());

  // State for Notifications
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [errorNotifications, setErrorNotifications] = useState(null);

  // Fetch Claims
  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      setErrorClaims(null);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not fetch claims.');
      const data = await response.json();
      // Handle both array and object with claims property
      setClaims(Array.isArray(data) ? data : (data.claims || []));
    } catch (err) {
      setErrorClaims(err.message);
    } finally {
      setLoadingClaims(false);
    }
  };

  // Fetch Policies
  const fetchPolicies = async () => {
    try {
      setLoadingPolicies(true);
      setErrorPolicies(null);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-policies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not fetch policies.');
      const data = await response.json();
      // Handle both array and object with policies property
      setPolicies(Array.isArray(data) ? data : (data.policies || []));
    } catch (err) {
      setErrorPolicies(err.message);
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Fetch Notifications
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
      // Handle both array and object with notifications property
      setNotifications(Array.isArray(data) ? data : (data.notifications || []));
    } catch (err) {
      setErrorNotifications(err.message);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchClaims();
    fetchPolicies();
    fetchNotifications();
  }, []);

  const handleClaimFiled = () => {
    fetchClaims();
  };

  // Refresh all data
  const handleRefreshAll = () => {
    fetchClaims();
    fetchPolicies();
    fetchNotifications();
  };

  // Handle Policy Activation
  const handleActivatePolicy = async (policyId) => {
    if (!window.confirm("This is a mock payment.\nDo you want to simulate a successful payment and enter the approval workflow?")) {
      return;
    }

    const inFlightRef = activatingRef.current;
    if (inFlightRef.has(policyId)) return;
    inFlightRef.add(policyId);

    setActivationStatus(prev => ({ ...prev, [policyId]: 'Processing...' }));
    
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

      // Show appropriate message based on final status
      const successMsg = data.status === 'PENDING_INITIAL_APPROVAL' 
        ? 'Payment successful! Policy awaiting approval.' 
        : data.status === 'DENIED_UNDERWRITER'
        ? 'Payment received but policy was denied.'
        : data.status === 'ACTIVE'
        ? 'Activated!'
        : 'Payment successful! Under review.';
        
      setActivationStatus(prev => ({ ...prev, [policyId]: successMsg }));
      fetchPolicies();

    } catch (err) {
      console.error('Mock Activation Error:', err);
      setActivationStatus(prev => ({ ...prev, [policyId]: `Error: ${err.message}` }));
    } finally {
      inFlightRef.delete(policyId);
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('active') && !statusLower.includes('inactive')) return 'success';
    if (statusLower.includes('pending') || statusLower.includes('awaiting') || statusLower.includes('review')) return 'warning';
    if (statusLower.includes('declined') || statusLower.includes('rejected') || statusLower.includes('denied')) return 'error';
    if (statusLower.includes('inactive')) return 'default';
    return 'info';
  };

  return (
    <Box sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh', py: 4 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3 }}>
        {/* Header with Action Button */}
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" component="h1" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                Customer Dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Manage your policies and claims
              </Typography>
            </Box>
            <Tooltip title="Refresh all data">
              <IconButton onClick={handleRefreshAll} size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Notifications Section */}
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                mr: 2
              }}>
                <NotificationIcon sx={{ color: 'white' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Notifications</Typography>
            </Box>
            {loadingNotifications ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : errorNotifications ? (
              <Alert severity="error">{errorNotifications}</Alert>
            ) : notifications && Array.isArray(notifications) && notifications.length === 0 ? (
              <Typography color="text.secondary">No recent notifications.</Typography>
            ) : (
              <Box>
                {notifications.slice(0, 5).map(notif => (
                  <Box key={notif.notification_id} sx={{ mb: 1, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, borderLeft: '4px solid #667eea' }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notif.sent_timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{notif.message}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Policies Section */}
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
              <Typography variant="h6" sx={{ fontWeight: 600 }}>My Policies</Typography>
            </Box>
            {loadingPolicies ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : errorPolicies ? (
              <Alert severity="error">{errorPolicies}</Alert>
            ) : !policies || !Array.isArray(policies) || policies.length === 0 ? (
              <Typography color="text.secondary">No policies found</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Policy ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Premium</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {policies.map(policy => {
                      const statusMsg = activationStatus[policy.policy_id];
                      return (
                        <TableRow key={policy.policy_id} hover>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{policy.policy_id}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{policy.policy_type}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#667eea' }}>₹{parseFloat(policy.premium_amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                          <TableCell>
                            <Chip 
                              label={policy.status.replace(/_/g, ' ')}
                              color={getStatusColor(policy.status)}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            {policy.status === 'INACTIVE_AWAITING_PAYMENT' && !statusMsg && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleActivatePolicy(policy.policy_id)}
                                sx={{ boxShadow: 2 }}
                              >
                                Activate (Mock Pay)
                              </Button>
                            )}
                            {statusMsg && (
                              <Typography variant="caption" color={statusMsg.startsWith('Error') ? 'error' : 'info'}>
                                {statusMsg}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* File Claim Section */}
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <FileClaim onClaimFiled={handleClaimFiled} />
          </CardContent>
        </Card>

        {/* Claims Section */}
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
              <Typography variant="h6" sx={{ fontWeight: 600 }}>My Claims</Typography>
            </Box>
            {loadingClaims ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : errorClaims ? (
              <Alert severity="error">{errorClaims}</Alert>
            ) : !claims || !Array.isArray(claims) || claims.length === 0 ? (
              <Typography color="text.secondary">No claims found</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Claim ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {claims.map(claim => (
                      <TableRow key={claim.claim_id} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{claim.claim_id}</TableCell>
                        <TableCell>{claim.description}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#4facfe' }}>₹{parseFloat(claim.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                        <TableCell>
                          <Chip 
                            label={claim.status || 'PENDING'}
                            color={getStatusColor(claim.status)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
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

export default Dashboard;
