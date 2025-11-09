// src/components/AdjusterDashboard.js 12
import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
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
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";

function AdjusterDashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    // Get current user's admin_id from JWT token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentAdminId(decoded.admin_id);
        setAdminName(decoded.name || "");
      } catch (err) {
        console.error("Error decoding token:", err);
        setError("Failed to load user information");
      }
    }
  }, []);

  useEffect(() => {
    const fetchClaims = async () => {
      if (!currentAdminId) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:3001/api/adjuster/dashboard/${currentAdminId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setClaims(res.data.assigned_claims || []);
        setError(null);
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchClaims();
  }, [currentAdminId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "DECLINED":
        return "error";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Claims Adjuster Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {adminName && `${adminName} - `}Admin ID: {currentAdminId || "Loading..."}
          </Typography>

          {claims.length === 0 ? (
            <Alert severity="info">No claims assigned to you yet.</Alert>
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
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {claims.map((c) => (
                    <TableRow key={c.claim_id}>
                      <TableCell>{c.claim_id}</TableCell>
                      <TableCell>{c.customer_id}</TableCell>
                      <TableCell>{c.description}</TableCell>
                      <TableCell align="right">
                        ₹
                        {parseFloat(c.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={c.claim_status}
                          color={getStatusColor(c.claim_status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(c.claim_date).toLocaleDateString()}
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

export default AdjusterDashboard;

