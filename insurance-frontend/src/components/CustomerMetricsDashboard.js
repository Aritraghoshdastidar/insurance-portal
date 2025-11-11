import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';

// Simple customer metrics built from existing endpoints
// - /api/my-policies
// - /api/my-claims
export default function CustomerMetricsDashboard() {
  const [policies, setPolicies] = useState(null);
  const [claims, setClaims] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [pRes, cRes] = await Promise.all([
          fetch('http://localhost:3001/api/my-policies', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:3001/api/my-claims', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const [pData, cData] = await Promise.all([pRes.json(), cRes.json()]);
        setPolicies(Array.isArray(pData) ? pData : (pData.policies || []));
        setClaims(Array.isArray(cData) ? cData : (cData.claims || []));
      } catch (err) {
        console.error('Failed to load customer metrics:', err);
        setError('Could not load your metrics.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const metrics = useMemo(() => {
    const p = policies || [];
    const c = claims || [];

    const totalPolicies = p.length;
    const activePolicies = p.filter(x => x.status === 'ACTIVE').length;
    const pendingPolicies = p.filter(x => (x.status || '').includes('PENDING')).length;
    const inactivePolicies = p.filter(x => (x.status || '').includes('INACTIVE')).length;

    const totalClaims = c.length;
    const pendingClaims = c.filter(x => (x.claim_status || x.status) === 'PENDING').length;
    const approvedClaims = c.filter(x => (x.claim_status || x.status) === 'APPROVED').length;
    const declinedClaims = c.filter(x => (x.claim_status || x.status) === 'DECLINED').length;

    const totalClaimAmount = c.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
    const avgClaimAmount = totalClaims ? (totalClaimAmount / totalClaims) : 0;

    return {
      totalPolicies,
      activePolicies,
      pendingPolicies,
      inactivePolicies,
      totalClaims,
      pendingClaims,
      approvedClaims,
      declinedClaims,
      totalClaimAmount,
      avgClaimAmount
    };
  }, [policies, claims]);

  if (loading) return <Box sx={{ p: 3 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>My Metrics</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Policies</Typography>
              <Divider sx={{ my: 1 }} />
              <MetricRow label="Total Policies" value={metrics.totalPolicies} />
              <MetricRow label="Active" value={metrics.activePolicies} color="success" />
              <MetricRow label="Pending" value={metrics.pendingPolicies} color="warning" />
              <MetricRow label="Inactive" value={metrics.inactivePolicies} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Claims</Typography>
              <Divider sx={{ my: 1 }} />
              <MetricRow label="Total Claims" value={metrics.totalClaims} />
              <MetricRow label="Pending" value={metrics.pendingClaims} color="warning" />
              <MetricRow label="Approved" value={metrics.approvedClaims} color="success" />
              <MetricRow label="Declined" value={metrics.declinedClaims} color="error" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Claim Amounts</Typography>
              <Divider sx={{ my: 1 }} />
              <MetricRow label="Total Amount" value={`₹${metrics.totalClaimAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />
              <MetricRow label="Average Amount" value={`₹${metrics.avgClaimAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function MetricRow({ label, value, color }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
      <Typography color="text.secondary">{label}</Typography>
      <Chip label={value} color={color || 'default'} size="small" />
    </Box>
  );
}
