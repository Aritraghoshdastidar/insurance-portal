import React, { useEffect, useState } from "react";
import axios from "axios";
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
  Alert,
  CircularProgress,
  Chip
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";

function HighRiskAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:3001/api/alerts/highrisk", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then((res) => {
        setAlerts(res.data.high_risk_claims || []);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching alerts:", err);
        setError("Failed to fetch alerts.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <WarningIcon sx={{ mr: 1, color: "warning.main" }} />
            <Typography variant="h6">High-Risk Claims Alerts</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {alerts.length === 0 ? (
            <Typography color="text.secondary">
              No high-risk claims detected.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Claim ID</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Customer ID</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Amount</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Risk Score</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.claim_id}>
                      <TableCell>{alert.claim_id}</TableCell>
                      <TableCell>{alert.customer_id}</TableCell>
                      <TableCell>₹{parseFloat(alert.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={alert.claim_status}
                          color={
                            alert.claim_status === "APPROVED"
                              ? "success"
                              : alert.claim_status === "DECLINED"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alert.risk_score}
                          color={alert.risk_score > 8 ? "error" : "default"}
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

export default HighRiskAlerts;
