import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Policy as PolicyIcon,
  Assignment as ClaimIcon,
  MarkEmailRead as MarkReadIcon,
  DeleteSweep as ClearIcon,
} from '@mui/icons-material';
import notificationService from '../services/notificationService';

function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load saved notifications
    notificationService.loadNotifications();
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());

    // Request permission for push notifications
    notificationService.requestPermission();

    // Connect to socket
    notificationService.connect();

    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications([...notificationService.getNotifications()]);
      setUnreadCount(notificationService.getUnreadCount());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (index) => {
    notificationService.markAsRead(index);
    setNotifications([...notificationService.getNotifications()]);
    setUnreadCount(notificationService.getUnreadCount());
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications([...notificationService.getNotifications()]);
    setUnreadCount(0);
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    setNotifications([]);
    setUnreadCount(0);
    handleClose();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'policy':
        return <PolicyIcon color="primary" />;
      case 'claim':
        return <ClaimIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            overflow: 'auto',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} new`} color="primary" size="small" />
          )}
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No notifications yet</Typography>
          </Box>
        ) : (
          <>
            {notifications.slice(0, 10).map((notification, index) => (
              <MenuItem
                key={index}
                onClick={() => handleMarkAsRead(index)}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  py: 2,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ display: 'flex', width: '100%', gap: 1, mb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getIcon(notification.type)}
                  </ListItemIcon>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {getTimeAgo(notification.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}

            <Divider />

            <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                size="small"
                startIcon={<MarkReadIcon />}
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark All Read
              </Button>
              <Button
                fullWidth
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearAll}
                color="error"
              >
                Clear All
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}

export default NotificationBell;
