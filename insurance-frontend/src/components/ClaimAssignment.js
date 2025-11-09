import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Button,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Assignment as AssignIcon } from '@mui/icons-material';

function ClaimAssignment() {
  const [claims, setClaims] = useState([]);
  const [adjusters, setAdjusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedAdjusters, setSelectedAdjusters] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all claims
      const claimsRes = await axios.get('http://localhost:3001/api/claims', { headers });
      
      // Fetch all adjusters
      const adjustersRes = await axios.get('http://localhost:3001/api/adjusters/list', { headers });

      setClaims(claimsRes.data.claims || []);
      setAdjusters(adjustersRes.data || []);
      
      // Initialize selected adjusters with current assignments
      const initialSelections = {};
      (claimsRes.data.claims || []).forEach(claim => {
        if (claim.admin_id) {
          initialSelections[claim.claim_id] = claim.admin_id;
        }
      });
      setSelectedAdjusters(initialSelections);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjusterChange = (claimId, adminId) => {
    setSelectedAdjusters(prev => ({
      ...prev,
      [claimId]: adminId
    }));
  };

  const handleAssign = async (claimId) => {
    try {
      const token = localStorage.getItem('token');
      const adminId = selectedAdjusters[claimId];
      
      if (!adminId) {
        setError('Please select an adjuster');
        return;
      }

      await axios.post(
        `http://localhost:3001/api/claims/${claimId}/assign`,
        { adminId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Claim ${claimId} assigned successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error assigning claim:', err);
      setError(err.response?.data?.error || err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'DECLINED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Claim Assignment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign claims to adjusters for review and processing
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {claims.length === 0 ? (
            <Alert severity="info">No claims available</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Claim ID</TableCell>
                    <TableCell>Customer ID</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim.claim_id}>
                      <TableCell>{claim.claim_id}</TableCell>
                      <TableCell>{claim.customer_id}</TableCell>
                      <TableCell>{claim.description}</TableCell>
                      <TableCell align="right">
                        ₹
                        {parseFloat(claim.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={claim.status || claim.claim_status}
                          color={getStatusColor(claim.status || claim.claim_status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <Select
                            value={selectedAdjusters[claim.claim_id] || ''}
                            onChange={(e) =>
                              handleAdjusterChange(claim.claim_id, e.target.value)
                            }
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Not Assigned</em>
                            </MenuItem>
                            {adjusters.map((adj) => (
                              <MenuItem key={adj.admin_id} value={adj.admin_id}>
                                {adj.name} ({adj.role})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AssignIcon />}
                          onClick={() => handleAssign(claim.claim_id)}
                          disabled={!selectedAdjusters[claim.claim_id]}
                        >
                          Assign
                        </Button>
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

export default ClaimAssignment;
