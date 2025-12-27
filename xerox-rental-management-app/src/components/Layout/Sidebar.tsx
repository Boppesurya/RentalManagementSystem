import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Chip,
  Avatar
} from '@mui/material';
import {
  Dashboard,
  People,
  Inventory,
  Receipt,
  Assessment,
  Settings,
  SupportAgent,
  Business,
  RequestQuote,
  Person,
  Analytics,
  TrendingUp,
  Security,
  Notifications,
  Report,
  HealthAndSafety,
  Schedule,
  LocationOn,
  Description,
  Assistant,
  Subscriptions,
  Home,
  Shield,
  SpaceDashboard,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { CreditCard } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  selectedItem: string;
  onItemSelect: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, selectedItem, onItemSelect }) => {
  const { user } = useAuth();
  const { unreadCount, error: notificationError } = useNotifications();
  

  const getMenuItems = () => {
    const commonItems = [
      { id: 'home', text: 'Home', icon: <Home />, badge: null },
      { id: 'dashboard', text: 'Dashboard', icon: <Dashboard />, badge: null },
      { id: 'profile', text: 'Profile & Settings', icon: <Person />, badge: !notificationError && unreadCount > 0 ? unreadCount : null },
    ];

    if (user?.role === 'ADMIN') {
      return [
        ...commonItems,
        //{ id: 'home', text: 'Home', icon: <Home />, badge: null },
        { id: 'dashboard1', text: 'Dashboard', icon: <SpaceDashboard />, badge: null },
        { id: 'users', text: 'User Management', icon: <People />, badge: null },
        { id: 'subscription-plans', text: 'Subscription Plans', icon: <Subscriptions />, badge: null },
        { id: 'subscription-verification', text: 'Subscription Verification', icon: <CreditCard />, badge: null },
        { id: 'rate-limiting', text: 'Rate Limiting', icon: <Shield />, badge: null },
        { id: 'inventory', text: 'Smart Inventory', icon: <Inventory />, badge: null },
        { id: 'invoices', text: 'Invoice Management', icon: <Receipt />, badge: null },
        { id: 'contracts', text: 'Contract Management', icon: <Business />, badge: null },
        { id: 'requests', text: 'Rental Requests', icon: <RequestQuote />, badge: null },
        { id: 'documents', text: 'Documents', icon: <Description />, badge: null },
        { id: 'analytics', text: 'Advanced Analytics', icon: <Analytics />, badge: null },
        { id: 'tickets', text: 'Support Center', icon: <SupportAgent />, badge: null },
        { id: 'security', text: 'Security Center', icon: <Security />, badge: null },
        { id: 'reports' ,text: 'Reports',icon:<Report/>,badge: null},
        { id: 'machine-health', text: 'Machine Health', icon: <HealthAndSafety />, badge: null },
        { id: 'maintenance', text: 'Maintenance', icon: <Schedule />, badge: null },
        { id: 'audit-logs', text: 'Audit Logs', icon: <Security />, badge: null },
        { id: 'geolocation', text: 'Geolocation Tracking', icon: <LocationOn />, badge: null },
        { id: 'automation', text:'WorkflowBuilder', icon:<Assistant/>,badge:null},

      ];
    }

    if (user?.role === 'OWNER') {
      return [
        ...commonItems,
        { id: 'dashboard1', text: 'Dashboard', icon: <SpaceDashboard />, badge: null },
        { id: 'subscription', text: 'My Subscription', icon: <CreditCard />, badge: null },
        { id: 'subscription-plan', text: 'Browse Plans', icon: <Subscriptions />, badge: null },
        { id: 'users', text: 'Customer Management', icon: <People />, badge: null },
        { id: 'inventory', text: 'My Inventory', icon: <Inventory />, badge: null },
        { id: 'invoices', text: 'Invoice Generation', icon: <Receipt />, badge: null },
        { id: 'contracts', text: 'Contract Management', icon: <Business />, badge: null },
        { id: 'requests', text: 'Rental Requests', icon: <RequestQuote />, badge: null },
        { id: 'documents', text: 'Documents', icon: <Description />, badge: null },
        { id: 'company-settings', text: 'Company Settings', icon: <Settings />, badge: null },
        { id: 'tickets', text: 'Support Center', icon: <SupportAgent />, badge: null },
        { id: 'analytics', text: 'Business Analytics', icon: <TrendingUp />, badge: null },
        { id: 'reports' ,text: 'Reports',icon:<Report/>,badge: null},
        { id: 'machine-health', text: 'Machine Health', icon: <HealthAndSafety />, badge: null },
        { id: 'maintenance', text: 'Maintenance', icon: <Schedule />, badge: null },
        { id: 'geolocation', text: 'Geolocation Tracking', icon: <LocationOn />, badge: null },
      
      ];
    }

    if (user?.role === 'RENTAL') {
      return [
        ...commonItems,
        { id: 'dashboard1', text: 'Dashboard', icon: <SpaceDashboard />, badge: null },
        // { id: 'home', text: 'Home', icon: <Home />, badge: null },
        { id: 'inventory', text: 'My Machines', icon: <Inventory />, badge: null },
        { id: 'invoices', text: 'My Invoices', icon: <Receipt />, badge: null },
        { id: 'requests', text: 'Rental Requests', icon: <RequestQuote />, badge: null },
        { id: 'contracts', text: 'My Contracts', icon: <Business />, badge: null },
        { id: 'tickets', text: 'Support Tickets', icon: <SupportAgent />, badge: null },
        { id: 'reports' ,text: 'Reports',icon:<Report/>,badge: null},
        
        { id: 'machine-health', text: 'Machine Health', icon: <HealthAndSafety />, badge: null },
        { id: 'maintenance', text: 'Maintenance', icon: <Schedule />, badge: null },
      ];
    }
    if ( user?.role === 'TECHNICIAN') {
      return [
        ...commonItems,
        { id: 'dashboard1', text: 'Dashboard', icon: <SpaceDashboard />, badge: null },
        { id: 'inventory', text: 'Assigned Machines', icon: <Inventory />, badge: null },
        { id: 'users', text: 'Rental Customers', icon: <People />, badge: null },
        { id: 'machine-health', text: 'Machine Health', icon: <HealthAndSafety />, badge: null },
        { id: 'maintenance', text: 'Maintenance Tasks', icon: <Schedule />, badge: null },
        { id: 'tickets', text: 'Repair Tickets', icon: <SupportAgent />, badge: null },
        { id: 'reports', text: 'Service Reports', icon: <Assessment />, badge: null },
      ];
    }

    return commonItems;
  };

  const drawerWidth = 280;

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '0 20px 20px 0',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 50,
              height: 50,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
              Rental
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Management System
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {user?.name}
          </Typography>
          <Chip
            label={user?.role?.toUpperCase()}
            size="small"
            sx={{
              mt: 1,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>
      </Box>
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
      
      <List sx={{ px: 2, py: 1 }}>
        {getMenuItems().map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={selectedItem === item.id}
              onClick={() => onItemSelect(item.id)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: '40px' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: selectedItem === item.id ? 'bold' : 'normal'
                      }}
                    >
                      {item.text}
                    </Typography>
                    {item.badge && (
                      <Chip
                        size="small"
                        label={item.badge}
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          height: 20,
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Box sx={{ 
          p: 2, 
          bgcolor: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: 2,
          textAlign: 'center'
        }}>
          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
            System Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: '#4caf50',
              animation: 'pulse 2s infinite'
            }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              All Systems Online
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;