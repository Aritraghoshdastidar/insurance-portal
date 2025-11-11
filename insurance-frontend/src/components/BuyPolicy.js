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
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [templatePolicies, setTemplatePolicies] = useState([]);
  
  const [coverageAmount, setCoverageAmount] = useState(50000);
  const [policyTerm, setPolicyTerm] = useState(12);
  const [calculatedPremium, setCalculatedPremium] = useState(0);
  
  const policyCatalog = [
    {
      id: 'HEALTH_INDIVIDUAL_BASIC',
      type: 'HEALTH',
      name: 'Individual Health - Basic',
      icon: <HealthIcon fontSize="large" color="success" />,
      basePremium: 800,
      description: 'Complete mediclaim coverage for hospitalization and medical expenses',
      features: [
        'Hospitalization coverage up to policy limit',
        'Pre-hospitalization (60 days) & Post-hospitalization (90 days)',
        'Ambulance charges up to ₹2,000 per hospitalization',
        'Day care procedures covered',
        'No claim bonus - 10% increase in sum insured every claim-free year',
        'Cashless hospitalization at 10,000+ network hospitals'
      ],
      coverageRange: [200000, 500000],
      termRange: [12, 24],
      color: 'success'
    },
    {
      id: 'HEALTH_INDIVIDUAL_PREMIUM',
      type: 'HEALTH',
      name: 'Individual Health - Premium',
      icon: <HealthIcon fontSize="large" color="info" />,
      basePremium: 1500,
      description: 'Enhanced health insurance with critical illness cover',
      features: [
        'All Basic plan benefits',
        'Critical illness cover - ₹2,00,000 for 15 illnesses',
        'OPD expenses covered up to ₹10,000 per year',
        'Annual health check-up included',
        'Maternity benefits - ₹50,000 (after 2 years)',
        'Worldwide emergency cover up to ₹5,00,000'
      ],
      coverageRange: [500000, 1000000],
      termRange: [12, 36],
      color: 'info'
    },
    {
      id: 'HEALTH_FAMILY_FLOATER',
      type: 'HEALTH',
      name: 'Family Floater',
      icon: <SecurityIcon fontSize="large" color="secondary" />,
      basePremium: 2000,
      description: 'Comprehensive family health insurance covering 4-6 members',
      features: [
        'Covers self, spouse, 2 children & 2 parents',
        'Shared sum insured across all family members',
        'Maternity & newborn coverage - ₹75,000',
        'Vaccination expenses for children',
        'Dental & optical expenses up to ₹15,000/year',
        'Mental health support & counseling',
        'Automatic restoration of sum insured once per year'
      ],
      coverageRange: [500000, 2500000],
      termRange: [12, 24],
      color: 'secondary'
    },
    {
      id: 'LIFE_TERM_BASIC',
      type: 'LIFE',
      name: 'Term Life - Basic',
      icon: <PersonIcon fontSize="large" color="primary" />,
      basePremium: 500,
      description: 'Pure term insurance with affordable premiums',
      features: [
        'Death benefit payout to nominee',
        'Accidental death benefit - additional ₹10,00,000',
        'Terminal illness advance - 50% of sum assured',
        'Waiver of premium on critical illness',
        'Flexible premium payment - monthly/quarterly/annual',
        'Tax benefits under Section 80C & 10(10D)'
      ],
      coverageRange: [1000000, 5000000],
      termRange: [120, 360],
      color: 'primary'
    },
    {
      id: 'LIFE_TERM_PREMIUM',
      type: 'LIFE',
      name: 'Term Life - Premium',
      icon: <SecurityIcon fontSize="large" color="error" />,
      basePremium: 1200,
      description: 'Comprehensive term insurance with critical illness rider',
      features: [
        'All Basic term life benefits',
        'Critical illness cover - ₹25,00,000 for 36 illnesses',
        'Accidental total permanent disability benefit',
        'Income benefit option - monthly payout for 10 years',
        'Return of premium option available',
        'Free annual health check-up for insured'
      ],
      coverageRange: [5000000, 20000000],
      termRange: [120, 480],
      color: 'error'
    },
    {
      id: 'MOTOR_TWO_WHEELER',
      type: 'CAR',
      name: 'Two Wheeler Insurance',
      icon: <CarIcon fontSize="large" color="warning" />,
      basePremium: 350,
      description: 'Comprehensive insurance for bikes and scooters',
      features: [
        'Own damage cover for bike/scooter',
        'Third party liability - unlimited',
        'Personal accident cover - ₹15,00,000',
        '24x7 roadside assistance',
        'Zero depreciation add-on available',
        'Engine protection cover',
        'Consumables cover (engine oil, nuts, bolts, etc.)'
      ],
      coverageRange: [40000, 150000],
      termRange: [12, 12],
      color: 'warning'
    },
    {
      id: 'MOTOR_FOUR_WHEELER',
      type: 'CAR',
      name: 'Car Insurance - Comprehensive',
      icon: <CarIcon fontSize="large" color="error" />,
      basePremium: 1200,
      description: 'Complete protection for your car with zero depreciation',
      features: [
        'Own damage cover for vehicle',
        'Third party liability cover - unlimited',
        'Personal accident cover for driver & passengers',
        'Zero depreciation cover - no depreciation on claims',
        'Engine & gearbox protection',
        'Return to invoice cover - get car value if total loss',
        'Roadside assistance & towing - 24x7',
        'Key & lock replacement cover'
      ],
      coverageRange: [300000, 1500000],
      termRange: [12, 36],
      color: 'error'
    },
    {
      id: 'HOME_STANDARD',
      type: 'HOME',
      name: 'Home Insurance - Standard',
      icon: <HomeIcon fontSize="large" color="success" />,
      basePremium: 500,
      description: 'Comprehensive home protection against natural calamities and theft',
      features: [
        'Building structure damage cover',
        'Household contents & electronics',
        'Natural calamities - fire, flood, earthquake',
        'Burglary & theft protection',
        'Public liability cover - ₹5,00,000',
        'Temporary accommodation expenses if uninhabitable'
      ],
      coverageRange: [500000, 5000000],
      termRange: [12, 36],
      color: 'success'
    },
    {
      id: 'HOME_PREMIUM',
      type: 'HOME',
      name: 'Home Insurance - Premium',
      icon: <HomeIcon fontSize="large" color="primary" />,
      basePremium: 1500,
      description: 'Enhanced home coverage with valuables and appliance protection',
      features: [
        'All Standard plan benefits',
        'Jewelry & valuables cover - ₹2,00,000',
        'Home appliance warranty extension',
        'Domestic help liability cover',
        'Pet insurance included',
        'Emergency home repairs - 24x7 helpline',
        'Key replacement & lock repair cover'
      ],
      coverageRange: [5000000, 20000000],
      termRange: [12, 60],
      color: 'primary'
    }
  ];

  const steps = ['Select Coverage', 'Review Details', 'Payment'];

  useEffect(() => {
    fetchTemplatePolicies();
  }, []);

  useEffect(() => {
    if (selectedPolicy) {
      calculatePremium();
    }
  }, [selectedPolicy, coverageAmount, policyTerm]);

  const fetchTemplatePolicies = async () => {
    try {
      setCatalogLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/policies/catalog', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplatePolicies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load template policies:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  const calculatePremium = () => {
    if (!selectedPolicy) return;
    
    const baseAmount = selectedPolicy.basePremium;
    const coverageFactor = coverageAmount / selectedPolicy.coverageRange[0]; // Ratio vs minimum coverage
    const termFactor = Math.sqrt(policyTerm / 12); // Discount for longer terms
    
    // Monthly premium calculation
    const monthlyPremium = baseAmount * coverageFactor * termFactor;
    
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
      
      // Find a matching template policy from the catalog
      // Match by policy_type (LIFE, HEALTH, AUTO, HOME)
      const matchingTemplate = templatePolicies.find(
        tp => tp.policy_type === selectedPolicy.type
      );
      
      if (!matchingTemplate) {
        throw new Error(`No template policy found for type: ${selectedPolicy.type}`);
      }
      
      const buyResponse = await fetch('http://localhost:3001/api/policies/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          template_policy_id: matchingTemplate.policy_id,
          premium_amount: calculatedPremium,
          coverage_amount: coverageAmount,
          policy_term: policyTerm,
          coverage_details: JSON.stringify({
            coverage: coverageAmount,
            term_months: policyTerm,
            monthly_premium: calculatedPremium,
            total_premium: calculatedPremium * policyTerm
          })
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
    if (!selectedPolicy) return null;
    
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>Customize Your Coverage</Typography>
            
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography gutterBottom>Coverage Amount: ₹{coverageAmount.toLocaleString('en-IN')}</Typography>
              <Slider
                value={coverageAmount}
                onChange={(e, newValue) => setCoverageAmount(newValue)}
                min={selectedPolicy.coverageRange[0]}
                max={selectedPolicy.coverageRange[1]}
                step={1}
                marks={[
                  { value: selectedPolicy.coverageRange[0], label: `₹${(selectedPolicy.coverageRange[0]/100000).toFixed(1)}L` },
                  { value: selectedPolicy.coverageRange[1], label: `₹${(selectedPolicy.coverageRange[1]/100000).toFixed(0)}L` }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `₹${(value/100000).toFixed(2)}L`}
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
                ₹{calculatedPremium.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/month
              </Typography>
              <Typography variant="body2" align="center">
                Total: ₹{(calculatedPremium * policyTerm).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} for {policyTerm} months
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
                  secondary={`₹${coverageAmount.toLocaleString('en-IN')}`}
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
                  secondary={`₹${calculatedPremium.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Total Premium" 
                  secondary={`₹${(calculatedPremium * policyTerm).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
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
              Amount to pay: <strong>₹{(calculatedPremium * policyTerm).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
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
                  From ₹{policy.basePremium.toLocaleString('en-IN')}/month
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