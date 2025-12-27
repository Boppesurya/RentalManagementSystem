import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  ExitToApp,
  AccountCircle,
  Settings,
  Person,
  Circle,
  CheckCircle,
  Search,
  Clear,
  MarkEmailRead
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../hooks/useNotifications';

interface HeaderProps {
  onMenuToggle: () => void;
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, onProfileClick }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, error } = useNotifications();
  
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [notificationSearch, setNotificationSearch] = useState('');

    // Check if in impersonation mode
    const isImpersonating = localStorage.getItem('isImpersonating') === 'true';
  

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
    setNotificationSearch('');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'warning': return <Circle sx={{ color: '#ff9800' }} />;
      case 'error': return <Circle sx={{ color: '#f44336' }} />;
      case 'maintenance': return <Circle sx={{ color: '#9c27b0' }} />;
      case 'payment': return <Circle sx={{ color: '#2196f3' }} />;
      case 'system': return <Circle sx={{ color: '#607d8b' }} />;
      default: return <Circle sx={{ color: '#2196f3' }} />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(notificationSearch.toLowerCase()) ||
    notification.message.toLowerCase().includes(notificationSearch.toLowerCase())
  );

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuToggle}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Rental Management System
        </Typography>


        {/* Impersonation Indicator */}
        {isImpersonating && (
          <Chip
            label="Impersonating User - Click Logout to Return to Admin"
            color="warning"
            sx={{
              mr: 2,
              fontWeight: 'bold',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 }
              }
            }}
          />
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <IconButton color="inherit" onClick={handleNotificationOpen}>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <Popover
            open={Boolean(notificationAnchor)}
            anchorEl={notificationAnchor}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: { width: 420, maxHeight: 600 }
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Button 
                    size="small" 
                    onClick={markAllAsRead}
                    startIcon={<MarkEmailRead />}
                  >
                    Mark all as read
                  </Button>
                )}
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="Search notifications..."
                value={notificationSearch}
                onChange={(e) => setNotificationSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: notificationSearch && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setNotificationSearch('')}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {error && (
                <ListItem>
                  <ListItemText
                    primary="Connection Error"
                    secondary="Unable to load notifications from server"
                    sx={{ textAlign: 'center' }}
                  />
                </ListItem>
              )}
              {filteredNotifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'rgba(102, 126, 234, 0.05)',
                    borderLeft: notification.read ? 'none' : '4px solid #667eea',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  onClick={() => markAsRead(notification.id)}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {notification.message}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              {filteredNotifications.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={notificationSearch ? "No matching notifications" : error ? "Connection Error" : "No notifications"}
                    secondary={notificationSearch ? "Try adjusting your search" : error ? "Check backend connection" : "You're all caught up!"}
                    sx={{ textAlign: 'center' }}
                  />
                </ListItem>
              )}
            </List>
            {notifications.length > 0 && (
              <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
                <Button size="small" color="primary">
                  View All Notifications
                </Button>
              </Box>
            )}
          </Popover>
          
          {/* Profile Menu */}
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: 'rgba(255,255,255,0.2)',
              cursor: 'pointer'
            }}
            onClick={handleProfileMenuOpen}
          >
            <AccountCircle />
          </Avatar>
          
          <Typography variant="body2" sx={{ mx: 1 }}>
            {user?.name}
          </Typography>

          <Menu
            anchorEl={profileMenuAnchor}
            open={Boolean(profileMenuAnchor)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: { minWidth: 220 }
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Chip 
                label={user?.role?.toUpperCase()} 
                size="small" 
                sx={{ mt: 1 }}
                color="primary"
              />
            </Box>
            <MenuItem onClick={() => { onProfileClick(); handleProfileMenuClose(); }}>
              <Person sx={{ mr: 1 }} />
              Profile & Settings
            </MenuItem>
            <MenuItem onClick={() => { handleProfileMenuClose(); }}>
              <Settings sx={{ mr: 1 }} />
              Preferences
            </MenuItem>
            <Divider />
            <MenuItem onClick={logout}>
              <ExitToApp sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;