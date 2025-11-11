import React, { useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as PolicyIcon,
  Assignment as ClaimIcon,
  AssignmentInd as AssignmentIcon,
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  ShoppingCart as BuyIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as MetricsIcon,
  Warning as AlertIcon,
  WorkOutline as WorkflowIcon,
  Description as DocumentIcon,
  Build as AdjusterIcon,
  ReportProblem as OverdueIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import NotificationBell from './NotificationBell';
import notificationService from '../services/notificationService';

const Layout = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);

  // Initialize notification service
  useEffect(() => {
    notificationService.connect();
    notificationService.requestPermission();
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
  }, []);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  // Menu items for different user types
  const customerMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Buy Policy', icon: <BuyIcon />, path: '/buy-policy' },
    { text: 'File Claim', icon: <ClaimIcon />, path: '/file-claim' },
    { text: 'My Policies', icon: <PolicyIcon />, path: '/dashboard' },
    { text: 'Document Upload', icon: <DocumentIcon />, path: '/document-processor' },
    { text: 'My Metrics', icon: <MetricsIcon />, path: '/my-metrics' },
  ];

  const adminMenuItems = [
    { text: 'Admin Dashboard', icon: <AdminIcon />, path: '/admin-dashboard' },
    { text: 'Pending Claims', icon: <ClaimIcon />, path: '/admin-dashboard' },
    { text: 'Workflows', icon: <WorkflowIcon />, path: '/admin/workflows' },
    { text: 'High Risk Alerts', icon: <AlertIcon />, path: '/high-risk-alerts' },
    { text: 'Overdue Tasks', icon: <OverdueIcon />, path: '/overdue-tasks' },
    { text: 'Claim Assignment', icon: <AssignmentIcon />, path: '/claim-assignment' },
    { text: 'Adjuster Dashboard', icon: <AdjusterIcon />, path: '/adjuster-dashboard' },
  ];

  const menuItems = user?.isAdmin ? adminMenuItems : customerMenuItems;

  const drawerContent = (
    <Box sx={{ width: 250, height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">
          {user?.isAdmin ? 'Admin Panel' : 'Insurance Portal'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {user?.email || 'User'}
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          boxShadow: 3,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <ShieldIcon sx={{ mr: 2, fontSize: 28 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {user?.isAdmin ? 'Admin Portal' : 'InsuranceFlow'}
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
            <NotificationBell />
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                px: 2,
                py: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <AccountIcon />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user?.email || 'User'}
              </Typography>
            </Box>
            <Button 
              color="inherit" 
              onClick={handleLogout} 
              startIcon={<LogoutIcon />}
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        variant={isMobile ? 'temporary' : 'persistent'}
        sx={{
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
            mt: 8, // Below the AppBar
            height: 'calc(100vh - 64px)', // Full height minus AppBar
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: drawerOpen && !isMobile ? '250px' : 0,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          width: drawerOpen && !isMobile ? 'calc(100% - 250px)' : '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
