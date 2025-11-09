$content = @'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  CheckCircle as CheckIcon,
  LocalHospital as HealthIcon,
  DirectionsCar as CarIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

function BuyPolicy() {
  const navigate = useNavigate();
  
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [coverageAmount, setCoverageAmount] = useState(50000);
  const [policyTerm, setPolicyTerm] = useState(12);
  const [calculatedPremium, setCalculatedPremium] = useState(0);
  
  const policyCatalog = [
    {
      id: 'LIFE_BASIC',
      type: 'LIFE',
      name: 'Life Insurance - Basic',
      icon: <PersonIcon fontSize="large" color="primary" />,
      basePremium: 50,
      description: 'Comprehensive life insurance coverage for you and your family',
      features: [
        'Death benefit coverage',
        'Accidental death benefit',
        'Terminal illness advance',
        '24/7 customer support',
        'Flexible premium payments'
      ],
      coverageRange: [50000, 1000000],
      termRange: [12, 360],
      color: 'primary'
    },
    {
      id: 'LIFE_PREMIUM',
      type: 'LIFE',
      name: 'Life Insurance - Premium',
      icon: <SecurityIcon fontSize="large" color="secondary" />,
      basePremium: 150,
      description: 'Enhanced life insurance with investment benefits',
      features: [
        'All Basic plan features',
        'Investment growth component',
        'Critical illness rider',
        'Waiver of premium benefit',
        'Free annual health checkup'
      ],
      coverageRange: [100000, 5000000],
      termRange: [12, 360],
      color: 'secondary'
    },
    {
      id: 'HEALTH_INDIVIDUAL',
      type: 'HEALTH',
      name: 'Health Insurance - Individual',
      icon: <HealthIcon fontSize="large" color="success" />,
      basePremium: 100,
      description: 'Complete health coverage for medical expenses',
      features: [
        'Hospitalization coverage',
        'Pre and post hospitalization',
        'Ambulance charges',
        'Day care procedures',
        'No claim bonus'
      ],
      coverageRange: [25000, 500000],
      termRange: [12, 36],
      color: 'success'
    },
    {
      id: 'HEALTH_FAMILY',
      type: 'HEALTH',
      name: 'Health Insurance - Family',
      icon: <HealthIcon fontSize="large" color="info" />,
      basePremium: 250,
      description: 'Family floater health insurance plan',
      features: [
        'All Individual plan features',
        'Covers up to 4 family members',
        'Maternity benefits',
        'New born baby coverage',
        'Preventive health checkup'
      ],
      coverageRange: [100000, 2000000],
      termRange: [12, 36],
      color: 'info'
    },
    {
      id: 'AUTO_COMPREHENSIVE',
      type: 'AUTO',
      name: 'Auto Insurance - Comprehensive',
      icon: <CarIcon fontSize="large" color="warning" />,
      basePremium: 80,
      description: 'Complete protection for your vehicle',
      features: [
        'Own damage coverage',
        'Third party liability',
        'Personal accident cover',
        '24x7 roadside assistance',
        'Zero depreciation add-on'
      ],
      coverageRange: [10000, 200000],
      termRange: [12, 24],
      color: 'warning'
    },
    {
      id: 'HOME_STANDARD',
      type: 'HOME',
      name: 'Home Insurance - Standard',
      icon: <HomeIcon fontSize="large" color="error" />,
      basePremium: 120,
      description: 'Protect your home and belongings',
      features: [
        'Building structure coverage',
        'Contents insurance',
        'Natural disaster protection',
        'Theft and burglary coverage',
        'Public liability'
      ],
      coverageRange: [50000, 1000000],
      termRange: [12, 36],
      color: 'error'
    }
  ];

  const steps = ['Select Coverage', 'Review Details', 'Payment'];

  useEffect(() => {
    if (selectedPolicy) {
      calculatePremium();
    }
  }, [selectedPolicy, coverageAmount, policyTerm]);

  const calculatePremium = () => {
    if (!selectedPolicy) return;
    
    const baseAmount = selectedPolicy.basePremium;
    const coverageFactor = coverageAmount / 100000;
    const termFactor = policyTerm / 12;
    const monthlyPremium = (baseAmount * coverageFactor * Math.sqrt(termFactor)) / policyTerm;
    
    setCalculatedPremium(monthlyPremium);
  };

  const handleSelectPolicy = (policy) => {
    setSelectedPolicy(policy);
    setCoverageAmount(policy.coverageRange[0]);
    setPolicyTerm(policy.termRange[0]);
    setOpenDialog(true);
    setActiveStep(0);
    setError(null);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      
      const buyResponse = await fetch('http://localhost:3001/api/policies/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          policy_type: selectedPolicy.type,
          premium_amount: (calculatedPremium * policyTerm).toFixed(2),
          coverage_amount: coverageAmount,
          coverage_details: selectedPolicy.name
        })
      });

      if (!buyResponse.ok) {
        const errorData = await buyResponse.json();
        throw new Error(errorData.error || 'Purchase failed');
      }

      const buyData = await buyResponse.json();
      const policyId = buyData.policy_id;

      const paymentResponse = await fetch(`http://localhost:3001/api/policies/${policyId}/initial-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      setOpenDialog(false);
      navigate('/dashboard');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>Customize Your Coverage</Typography>
            
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography gutterBottom>Coverage Amount: ${coverageAmount.toLocaleString()}</Typography>
              <Slider
                value={coverageAmount}
                onChange={(e, newValue) => setCoverageAmount(newValue)}
                min={selectedPolicy.coverageRange[0]}
                max={selectedPolicy.coverageRange[1]}
                step={10000}
                marks={[
                  { value: selectedPolicy.coverageRange[0], label: `$${(selectedPolicy.coverageRange[0]/1000).toFixed(0)}K` },
                  { value: selectedPolicy.coverageRange[1], label: `$${(selectedPolicy.coverageRange[1]/1000).toFixed(0)}K` }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `$${value.toLocaleString()}`}
              />
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Policy Term</InputLabel>
              <Select
                value={policyTerm}
                onChange={(e) => setPolicyTerm(e.target.value)}
                label="Policy Term"
              >
                {[12, 24, 36, 60, 120, 180, 240, 360].filter(term => 
                  term >= selectedPolicy.termRange[0] && term <= selectedPolicy.termRange[1]
                ).map(term => (
                  <MenuItem key={term} value={term}>
                    {term} months ({(term/12).toFixed(0)} years)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h5" align="center">
                ${calculatedPremium.toFixed(2)}/month
              </Typography>
              <Typography variant="body2" align="center">
                Total: ${(calculatedPremium * policyTerm).toFixed(2)} for {policyTerm} months
              </Typography>
            </Paper>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>Review Your Policy</Typography>
            
            <List>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Policy Type" 
                  secondary={selectedPolicy.name}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Coverage Amount" 
                  secondary={`$${coverageAmount.toLocaleString()}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Policy Term" 
                  secondary={`${policyTerm} months (${(policyTerm/12).toFixed(1)} years)`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Monthly Premium" 
                  secondary={`$${calculatedPremium.toFixed(2)}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Total Premium" 
                  secondary={`$${(calculatedPremium * policyTerm).toFixed(2)}`}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>Included Features:</Typography>
            <List dense>
              {selectedPolicy.features.map((feature, index) => (
                <ListItem key={index}>
                  <ListItemIcon><CheckIcon fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary={feature} />
                </ListItem>
              ))}
            </List>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>Mock Payment</Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              This is a simulated payment process. In production, this would integrate with a real payment gateway.
            </Alert>

            <Typography variant="body1" paragraph>
              Amount to pay: <strong>${(calculatedPremium * policyTerm).toFixed(2)}</strong>
            </Typography>

            <Typography variant="body2" color="text.secondary">
              By clicking "Complete Purchase", your policy will be activated immediately.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Buy Insurance Policy
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Choose the perfect insurance plan for your needs. Compare features and get instant quotes.
      </Typography>

      <Grid container spacing={3}>
        {policyCatalog.map((policy) => (
          <Grid item xs={12} md={6} lg={4} key={policy.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  {policy.icon}
                  <Chip label={policy.type} color={policy.color} size="small" />
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  {policy.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {policy.description}
                </Typography>

                <Typography variant="h5" color="primary" gutterBottom>
                  From ${policy.basePremium}/month
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>Key Features:</Typography>
                <List dense>
                  {policy.features.slice(0, 3).map((feature, index) => (
                    <ListItem key={index} disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature} 
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CartIcon />}
                  onClick={() => handleSelectPolicy(policy)}
                  sx={{ mt: 2 }}
                >
                  Get Quote
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedPolicy?.name}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {renderStepContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          {activeStep > 0 && (
            <Button onClick={handleBack}>Back</Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handlePurchase}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
            >
              {loading ? 'Processing...' : 'Complete Purchase'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BuyPolicy;
'@

$content | Out-File -FilePath "c:\Users\aritr\all_features_combined\insurance-frontend\src\components\BuyPolicy.js" -Encoding UTF8 -NoNewline
