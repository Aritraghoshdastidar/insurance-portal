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
    <Box>
      {/* Header with Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Customer Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh all data">
            <IconButton onClick={handleRefreshAll} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="large"
            startIcon={<BuyIcon />}
            onClick={() => navigate('/buy-policy')}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Buy New Policy
          </Button>
        </Box>
      </Box>

      {/* Notifications Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <NotificationIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Recent Notifications</Typography>
          </Box>
          {loadingNotifications ? (
            <CircularProgress size={24} />
          ) : errorNotifications ? (
            <Alert severity="error">{errorNotifications}</Alert>
          ) : notifications && Array.isArray(notifications) && notifications.length === 0 ? (
            <Typography color="text.secondary">No recent notifications.</Typography>
          ) : (
            <Box>
              {notifications.slice(0, 5).map(notif => (
                <Box key={notif.notification_id} sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notif.sent_timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">{notif.message}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Policies Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PolicyIcon sx={{ mr: 1 }} />
            <Typography variant="h6">My Policies</Typography>
          </Box>
          {loadingPolicies ? (
            <CircularProgress size={24} />
          ) : errorPolicies ? (
            <Alert severity="error">{errorPolicies}</Alert>
          ) : !policies || !Array.isArray(policies) || policies.length === 0 ? (
            <Typography color="text.secondary">No policies found</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Policy ID</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Premium</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {policies.map(policy => {
                    const statusMsg = activationStatus[policy.policy_id];
                    return (
                      <TableRow key={policy.policy_id}>
                        <TableCell>{policy.policy_id}</TableCell>
                        <TableCell>{policy.policy_type}</TableCell>
                        <TableCell>${parseFloat(policy.premium_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={policy.status.replace(/_/g, ' ')}
                            color={getStatusColor(policy.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {policy.status === 'INACTIVE_AWAITING_PAYMENT' && !statusMsg && (
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleActivatePolicy(policy.policy_id)}
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
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FileClaim onClaimFiled={handleClaimFiled} />
        </CardContent>
      </Card>

      {/* Claims Section */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ClaimIcon sx={{ mr: 1 }} />
            <Typography variant="h6">My Claims</Typography>
          </Box>
          {loadingClaims ? (
            <CircularProgress size={24} />
          ) : errorClaims ? (
            <Alert severity="error">{errorClaims}</Alert>
          ) : !claims || !Array.isArray(claims) || claims.length === 0 ? (
            <Typography color="text.secondary">No claims found</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Claim ID</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {claims.map(claim => (
                    <TableRow key={claim.claim_id}>
                      <TableCell>{claim.claim_id}</TableCell>
                      <TableCell>{claim.description}</TableCell>
                      <TableCell>${parseFloat(claim.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={claim.status || 'PENDING'}
                          color={getStatusColor(claim.status)}
                          size="small"
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
  );
}

export default Dashboard;
