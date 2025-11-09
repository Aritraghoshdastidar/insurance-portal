import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  TextField,
  Grid
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  CheckCircle as CheckIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function DocumentProcessor() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filing, setFiling] = useState(false);
  
  // Editable fields for auto-claim
  const [policyId, setPolicyId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
    setSuccess(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    const formData = new FormData();
    formData.append("document", file);
    
    try {
      const response = await fetch("http://localhost:3001/api/documents/process", {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Document processing failed');
      }
      
      const data = await response.json();
      setResult(data.extracted);
      
      // Pre-fill the form fields with extracted data
      if (data.extracted.policy_id) {
        setPolicyId(data.extracted.policy_id);
      }
      if (data.extracted.description) {
        setDescription(data.extracted.description);
      } else if (data.extracted.claim_id) {
        setDescription(`Claim ref: ${data.extracted.claim_id} from ${file.name}`);
      } else {
        setDescription(`Claim from document: ${file.name}`);
      }
      if (data.extracted.amount) {
        setAmount(data.extracted.amount.toString());
      }
      
      setSuccess('Document processed successfully! Review the extracted data below.');
    } catch (err) {
      setError(err.message || "Document processing failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFileClaim = async () => {
    if (!policyId || !description || !amount) {
      setError("Please fill in Policy ID, Description, and Amount to file a claim.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Claim amount must be a positive number.");
      return;
    }

    try {
      setFiling(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          policy_id: policyId,
          description: description,
          amount: parsedAmount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to file claim');
      }

      const data = await response.json();
      setSuccess(`Claim filed successfully! Claim ID: ${data.claim_id}`);
      
      // Reset form after successful filing
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to auto-file claim.');
    } finally {
      setFiling(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DocumentIcon color="primary" />
        Intelligent Document Processor
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload insurance documents to automatically extract claim information and file claims instantly.
      </Typography>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Document
              </Typography>
              
              <Box sx={{ my: 3 }}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                  sx={{ py: 2 }}
                >
                  {file ? file.name : 'Choose File (TXT, PDF)'}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".txt,.pdf"
                  />
                </Button>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleUpload}
                disabled={!file || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
              >
                {loading ? 'Processing...' : 'Upload & Process'}
              </Button>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {success}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={6}>
          {result && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon color="success" />
                  Extracted Data
                </Typography>
                
                <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Policy ID
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {result.policy_id || 'Not found'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Reference Claim ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {result.claim_id || 'N/A'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Extracted Amount
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    ₹{result.amount || '0'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Confidence Score
                  </Typography>
                  <Chip 
                    label={`${(result.confidence * 100).toFixed(1)}%`}
                    color={result.confidence > 0.8 ? 'success' : result.confidence > 0.5 ? 'warning' : 'error'}
                    size="small"
                  />
                </Paper>

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                  Auto-File Claim
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Review and edit the extracted information, then file the claim automatically.
                </Typography>

                <TextField
                  fullWidth
                  label="Policy ID"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  placeholder="e.g., POL1001"
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Claim description"
                  margin="normal"
                  multiline
                  rows={2}
                  required
                />

                <TextField
                  fullWidth
                  label="Claim Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 5000"
                  margin="normal"
                  type="number"
                  required
                />

                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={handleAutoFileClaim}
                  disabled={filing || !policyId || !description || !amount}
                  startIcon={filing ? <CircularProgress size={20} /> : <SendIcon />}
                  sx={{ mt: 2 }}
                >
                  {filing ? 'Filing Claim...' : 'Auto-File Claim'}
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default DocumentProcessor;
