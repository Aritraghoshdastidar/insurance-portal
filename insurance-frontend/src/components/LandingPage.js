import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';

function LandingPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 50 }} />,
      title: 'Secure & Compliant',
      description: 'Bank-level encryption and compliance with industry standards',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 50 }} />,
      title: 'Lightning Fast',
      description: 'Process claims and policies in minutes, not days',
    },
    {
      icon: <AssessmentIcon sx={{ fontSize: 50 }} />,
      title: 'Smart Analytics',
      description: 'AI-powered insights and risk assessment',
    },
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 50 }} />,
      title: 'Automated Workflows',
      description: 'Streamlined approval processes with intelligent routing',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <ShieldIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: 'text.primary' }}>
            InsuranceFlow
          </Typography>
          <Button
            color="primary"
            onClick={() => navigate('/login')}
            sx={{ mr: 2 }}
          >
            Customer Login
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/admin/login')}
          >
            Admin Portal
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          pt: 12,
          pb: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Insurance Workflow Automation
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                Transform your insurance operations with AI-powered automation. 
                Streamline claims, policies, and approvals with intelligent workflows.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PersonIcon />}
                  onClick={() => navigate('/login')}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    boxShadow: 3,
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<AdminIcon />}
                  onClick={() => navigate('/admin/login')}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                  }}
                >
                  Admin Portal
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  height: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.2)})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 3s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.05)' },
                    },
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 150, color: 'primary.main', opacity: 0.8 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography
          variant="h3"
          align="center"
          sx={{ mb: 2, fontWeight: 700 }}
        >
          Why Choose InsuranceFlow?
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          Powerful features designed for modern insurance operations
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box
                    sx={{
                      color: 'primary.main',
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box sx={{ bgcolor: 'primary.main', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                  99.9%
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Uptime Guarantee
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                  50%
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Faster Processing
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                  24/7
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Support Available
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ mb: 3, fontWeight: 700 }}>
          Ready to Transform Your Workflow?
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Join thousands of insurance professionals who trust InsuranceFlow
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/register')}
          sx={{
            py: 2,
            px: 6,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1.2rem',
            boxShadow: 4,
          }}
        >
          Create Free Account
        </Button>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShieldIcon sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  InsuranceFlow
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'grey.400' }}>
                Modern insurance workflow automation platform
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Links
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.400', mb: 1, cursor: 'pointer' }}>
                About Us
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.400', mb: 1, cursor: 'pointer' }}>
                Contact
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.400', mb: 1, cursor: 'pointer' }}>
                Privacy Policy
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Contact
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.400', mb: 1 }}>
                Email: support@insuranceflow.com
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.400', mb: 1 }}>
                Phone: +1 (555) 123-4567
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', mt: 4, pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              © 2025 InsuranceFlow. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage;
