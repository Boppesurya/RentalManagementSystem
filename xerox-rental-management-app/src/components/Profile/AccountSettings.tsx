import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Chip
} from '@mui/material';
import {
  Notifications,
  Security,
  Language,
  Palette,
  Storage,
  Shield,
  Email,
  Sms,
  Computer,
  
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import TwoFactorManagement from '../Auth/TwoFactorManagement';
import { apiService } from '../../services/api';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    maintenanceAlerts: true,
    invoiceReminders: true,
    darkMode: false,
    language: 'en',
    timezone: 'Asia/Kolkata',
    autoLogout: true,
    twoFactorAuth: false,
    dataBackup: true,
    analyticsTracking: true
  });

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user?.id) {
      checkTwoFactorStatus();
    }
  }, [user?.id]);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await apiService.getTwoFactorStatus(user!.id);
      if (response.success) {
        setSettings(prev => ({ ...prev, twoFactorAuth: response.enabled }));
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    setSuccessMessage('Settings updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handle2FAStatusChange = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, twoFactorAuth: enabled }));
  };

  const getSecurityScore = () => {
    let score = 0;
    if (user?.isPasswordChanged) score += 25;
    if (settings.twoFactorAuth) score += 25;
    if (settings.securityAlerts) score += 25;
    if (settings.autoLogout) score += 25;
    return score;
  };

  const securityScore = getSecurityScore();

  return (
    <Box sx={{ p: 3 }}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Notification Settings */}
        <Grid size={{xs:12,md:6}}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Notifications />
              Notification Preferences
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive notifications via email"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Sms />
                </ListItemIcon>
                <ListItemText
                  primary="SMS Notifications"
                  secondary="Receive critical alerts via SMS"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsNotifications}
                      onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Computer />
                </ListItemIcon>
                <ListItemText
                  primary="Push Notifications"
                  secondary="Browser push notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Security />
                </ListItemIcon>
                <ListItemText
                  primary="Security Alerts"
                  secondary="Important security notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.securityAlerts}
                      onChange={(e) => handleSettingChange('securityAlerts', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Security Settings */}
        <Grid size={{xs:12,md:6}}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield />
              Security Settings
            </Typography>
            
            <Card sx={{ mb: 3, bgcolor: securityScore >= 75 ? '#e8f5e8' : securityScore >= 50 ? '#fff3e0' : '#ffebee' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {securityScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Security Score
                    </Typography>
                  </Box>
                  {securityScore >= 75 ? (
                    <CheckCircle sx={{ color: '#4caf50', fontSize: 40 }} />
                  ) : (
                    <Warning sx={{ color: '#ff9800', fontSize: 40 }} />
                  )}
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ mb: 3 }}>
              {user && user.id && <TwoFactorManagement userId={user.id} onStatusChange={handle2FAStatusChange} />}
            </Box>

            <List>
              <ListItem>
                <ListItemText
                  primary="Auto Logout"
                  secondary="Automatically logout after inactivity"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoLogout}
                      onChange={(e) => handleSettingChange('autoLogout', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Password Changed"
                  secondary="Default password has been changed"
                />
                <Chip
                  label={user?.isPasswordChanged ? 'Yes' : 'No'}
                  color={user?.isPasswordChanged ? 'success' : 'warning'}
                  size="small"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Privacy Settings */}
        <Grid size={{xs:12,md:6}}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Storage />
              Privacy & Data
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Data Backup"
                  secondary="Automatically backup your data"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.dataBackup}
                      onChange={(e) => handleSettingChange('dataBackup', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Analytics Tracking"
                  secondary="Help improve the system with usage analytics"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.analyticsTracking}
                      onChange={(e) => handleSettingChange('analyticsTracking', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Marketing Communications"
                  secondary="Receive product updates and offers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.marketingEmails}
                      onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Application Settings */}
        <Grid size={{xs:12,md:6}}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Palette />
              Application Preferences
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Dark Mode"
                  secondary="Use dark theme for the interface"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Invoice Reminders"
                  secondary="Get reminded about pending invoices"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.invoiceReminders}
                      onChange={(e) => handleSettingChange('invoiceReminders', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Maintenance Alerts"
                  secondary="Receive machine maintenance notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceAlerts}
                      onChange={(e) => handleSettingChange('maintenanceAlerts', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Save Settings */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          sx={{
            borderRadius: 3,
            px: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          Save All Settings
        </Button>
      </Box>
    </Box>
  );
};

export default AccountSettings;