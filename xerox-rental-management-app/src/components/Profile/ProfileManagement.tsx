import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  IconButton,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Business,
  LocationOn,
  Security,
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Schedule,
  Receipt,
  Settings,
  CameraAlt,
  Verified,
  Star,
  TrendingUp,
  Assessment
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import AccountSettings from './AccountSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const ProfileManagement: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
    address: user?.address || '',
    gstNumber: user?.gstNumber || '',
    bankAccountHolderName: user?.bankAccountHolderName || '',
    bankAccountNumber: user?.bankAccountNumber || '',
    bankIfscCode: user?.bankIfscCode || '',
    bankName: user?.bankName || '',
    bankBranch: user?.bankBranch || '',
    upiId: user?.upiId || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      contactNumber: user?.contactNumber || '',
      address: user?.address || '',
      gstNumber: user?.gstNumber || '',
      bankAccountHolderName: user?.bankAccountHolderName || '',
      bankAccountNumber: user?.bankAccountNumber || '',
      bankIfscCode: user?.bankIfscCode || '',
      bankName: user?.bankName || '',
      bankBranch: user?.bankBranch || '',
      upiId: user?.upiId || ''
    });
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSave = async () => {
    try {
      if (user) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          contactNumber: formData.contactNumber,
          address: formData.address,
          gstNumber: formData.gstNumber,
          bankAccountHolderName: formData.bankAccountHolderName,
          bankAccountNumber: formData.bankAccountNumber,
          bankIfscCode: formData.bankIfscCode,
          bankName: formData.bankName,
          bankBranch: formData.bankBranch,
          upiId: formData.upiId
        };

        const updatedUserFromApi = await apiService.updateUser(user.id, updateData);

        updateUser(updatedUserFromApi);

        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to update profile. Please try again.');
      }
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      if (!user?.id) {
        setErrorMessage('User not found');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const response = await apiService.changePassword(
        user.id,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (response.success) {
        setShowPasswordDialog(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setSuccessMessage('Password changed successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Update user's password changed status
        if (user) {
          const updatedUser = { ...user, isPasswordChanged: true };
          updateUser(updatedUser);
        }
      } else {
        setErrorMessage(response.message || 'Failed to change password');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Password change error:', error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to change password. Please check your current password and try again.');
      }
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const getActivityData = () => {
    // Mock activity data based on user role
    const baseActivities = [
      { icon: <CheckCircle />, text: 'Profile created', date: user?.createdAt?.toLocaleDateString() || 'N/A' },
      { icon: <Schedule />, text: 'Last login', date: new Date().toLocaleDateString() }
    ];

    if (user?.role === 'OWNER') {
      return [
        ...baseActivities,
        { icon: <Business />, text: 'Machines managed', date: '5 active machines' },
        { icon: <Receipt />, text: 'Invoices generated', date: '12 this month' }
      ];
    } else if (user?.role === 'RENTAL') {
      return [
        ...baseActivities,
        { icon: <Business />, text: 'Machines rented', date: '3 active rentals' },
        { icon: <Receipt />, text: 'Invoices paid', date: '8 this month' }
      ];
    }

    return baseActivities;
  };

  const getProfileCompleteness = () => {
    const fields = [
      user?.name,
      user?.email,
      user?.contactNumber,
      user?.address,
      user?.gstNumber
    ];
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getStatsData = () => {
    if (user?.role === 'OWNER') {
      return [
        { label: 'Total Machines', value: '12', icon: <Business />, color: '#667eea' },
        { label: 'Active Rentals', value: '8', icon: <CheckCircle />, color: '#4caf50' },
        { label: 'Monthly Revenue', value: '₹45,000', icon: <TrendingUp />, color: '#ff9800' },
        { label: 'Pending Invoices', value: '3', icon: <Receipt />, color: '#f44336' }
      ];
    } else if (user?.role === 'RENTAL') {
      return [
        { label: 'Rented Machines', value: '5', icon: <Business />, color: '#667eea' },
        { label: 'Active Contracts', value: '3', icon: <CheckCircle />, color: '#4caf50' },
        { label: 'Monthly Expense', value: '₹18,000', icon: <TrendingUp />, color: '#ff9800' },
        { label: 'Pending Payments', value: '2', icon: <Receipt />, color: '#f44336' }
      ];
    }
    return [
      { label: 'Total Users', value: '156', icon: <Person />, color: '#667eea' },
      { label: 'Active Systems', value: '89', icon: <CheckCircle />, color: '#4caf50' },
      { label: 'Monthly Reports', value: '24', icon: <Assessment />, color: '#ff9800' },
      { label: 'System Health', value: '98%', icon: <Star />, color: '#4caf50' }
    ];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Profile Management
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Profile" icon={<Person />} />
          <Tab label="Account Settings" icon={<Settings />} />
          <Tab label="Analytics" icon={<Assessment />} />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Profile Header */}
              <Grid size={{xs:12}}>
                <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid size={{}}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            <IconButton
                              sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                width: 32,
                                height: 32,
                                '&:hover': { bgcolor: 'grey.100' }
                              }}
                            >
                              <CameraAlt sx={{ fontSize: 16 }} />
                            </IconButton>
                          }
                        >
                          <Avatar
                            sx={{
                              width: 120,
                              height: 120,
                              bgcolor: 'rgba(255,255,255,0.2)',
                              fontSize: '3rem',
                              border: '4px solid rgba(255,255,255,0.3)'
                            }}
                          >
                            {user?.name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>
                      </Grid>
                      <Grid size={{ }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {user?.name}
                          </Typography>
                          <Verified sx={{ color: 'rgba(255,255,255,0.8)' }} />
                        </Box>
                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                          {user?.email}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip 
                            label={user?.role?.toUpperCase()} 
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.2)', 
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                          <Chip 
                            label="Verified Account" 
                            sx={{ 
                              bgcolor: 'rgba(76, 175, 80, 0.8)', 
                              color: 'white'
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                            Profile Completeness: {getProfileCompleteness()}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={getProfileCompleteness()} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              bgcolor: 'rgba(255,255,255,0.2)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: 'rgba(255,255,255,0.8)'
                              }
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Profile Information */}
              <Grid size={{xs:12,md:8}}>
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Personal Information
                    </Typography>
                    {!isEditing ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                        sx={{ borderRadius: 2 }}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancel}
                          sx={{ borderRadius: 2 }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSave}
                          sx={{ 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }}
                        >
                          Save
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        fullWidth
                        label="Contact Number"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        fullWidth
                        label="GST Number"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12}}>
                      <TextField
                        fullWidth
                        label="Address"
                        multiline
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
                        }}
                      />
                    </Grid>

                    {/* Bank Details Section */}
                    <Grid size={{xs:12}}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Bank Details
                      </Typography>
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        fullWidth
                        label="Account Holder Name"
                        value={formData.bankAccountHolderName}
                        onChange={(e) => setFormData({ ...formData, bankAccountHolderName: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        fullWidth
                        label="Bank Account Number"
                        value={isEditing ? formData.bankAccountNumber : (user?.bankAccountNumberMasked || '')}
                        onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                        disabled={!isEditing}
                        type={isEditing ? "password" : "text"}
                        helperText={!isEditing && user?.bankAccountNumberMasked ? "Masked for security" : ""}
                        InputProps={{
                          startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        fullWidth
                        label="IFSC Code"
                        value={formData.bankIfscCode}
                        onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        fullWidth
                        label="Bank Name"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        fullWidth
                        label="Bank Branch"
                        value={formData.bankBranch}
                        onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        fullWidth
                        label="UPI ID"
                        value={formData.upiId}
                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Profile Summary */}
              <Grid size={{xs:12,md:4}}>
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Account Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Member since: {user?.createdAt?.toLocaleDateString() || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last updated: {user?.updatedAt?.toLocaleDateString() || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Password changed: {user?.isPasswordChanged ? 'Yes' : 'No'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Security />}
                    onClick={() => setShowPasswordDialog(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    Change Password
                  </Button>
                </Paper>

                {/* Recent Activity */}
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Recent Activity
                  </Typography>
                  <List>
                    {getActivityData().map((activity, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          {activity.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.text}
                          secondary={activity.date}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Account Settings Tab */}
        <TabPanel value={activeTab} index={1}>
          <AccountSettings />
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Your Analytics Dashboard
            </Typography>
            
            <Grid container spacing={3}>
              {getStatsData().map((stat, index) => (
                <Grid size={{xs:12,sm:6,md:4}} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      background: `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`,
                      border: `1px solid ${stat.color}30`,
                      borderRadius: 2,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-5px)' }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                            {stat.label}
                          </Typography>
                        </Box>
                        <Box sx={{ color: stat.color }}>
                          {stat.icon}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid size={{xs:12,md:6}}>
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Performance Metrics
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Account Activity Score"
                        secondary="Based on your recent interactions"
                      />
                      <Chip label="Excellent" color="success" />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Profile Completion"
                        secondary="Complete your profile for better experience"
                      />
                      <Chip label={`${getProfileCompleteness()}%`} color="primary" />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Security Score"
                        secondary="Your account security rating"
                      />
                      <Chip label="High" color="success" />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              <Grid size={{xs:12,md:6}}>
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{xs:12}}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Receipt />}
                        sx={{ borderRadius: 2, justifyContent: 'flex-start' }}
                      >
                        View Recent Invoices
                      </Button>
                    </Grid>
                    <Grid size={{xs:12}}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Business />}
                        sx={{ borderRadius: 2, justifyContent: 'flex-start' }}
                      >
                        Manage Machines
                      </Button>
                    </Grid>
                    <Grid size={{xs:12}}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Assessment />}
                        sx={{ borderRadius: 2, justifyContent: 'flex-start' }}
                      >
                        Generate Report
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <Button
                startIcon={showPassword ? <VisibilityOff /> : <Visibility />}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'} Passwords
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfileManagement;