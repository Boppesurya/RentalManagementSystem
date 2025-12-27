import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Slide,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Email,
  Person,
  Business,
  Warning,
  Login
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type User } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';

const UserList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { createNotification } = useNotifications();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'RENTAL' as User['role'],
    contactNumber: '',
    address: '',
    gstNumber: '',
    password: '',
    ownerId: '',
  });

  useEffect(() => {
    loadUsers();
  }, [currentUser?.id]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // Pass current user context to backend for proper filtering
      const data = await apiService.getUsers();
      
      // Additional frontend filtering for security
      if (currentUser?.role === 'OWNER') {

        
        const filteredUsers = data.filter(
          u => {
            const isRentalOrTechnician = u.role === 'RENTAL'|| u.role === 'TECHNICIAN';
            const belongsToOwner = String(u.owner?.id === currentUser.id )
           
            return isRentalOrTechnician && belongsToOwner;
          }
        );
        
       
        setUsers(filteredUsers);
      } else  if (currentUser?.role === 'TECHNICIAN') {
       
      
        const technicianOwnerId = currentUser.owner?.id || currentUser.ownerId;
      
      
        const ownerUsers = data.filter(u =>
          u.role === 'RENTAL' &&
          (u.owner?.id === technicianOwnerId?.toString())
        );
      
        console.log("Filtered Rentals for Technician:", ownerUsers);
      
        setUsers(ownerUsers);
      
        // Create welcome notification
        try {
          await createNotification({
            title: 'Welcome to  Rental System',
            message: `Your account has been created successfully. Please change your password.`,
            type: 'info',
            priority: 'medium'
          });
        } catch (notificationError) {
          console.error('Error creating welcome notification:', notificationError);
        }
        
      } else if (currentUser?.role === 'ADMIN' ) {
        // Admin sees everyone
        setUsers(data);
      } else if (currentUser?.role === 'RENTAL' ) {
        // Rental sees only themselves
        setUsers(data.filter(u => u.id === currentUser.id));
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users. Please check your connection and try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
        address: user.address,
        gstNumber: user.gstNumber || '',
        password: '',
        ownerId: user.owner?.id || '',
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        role: (currentUser?.role === 'OWNER' ) ? 'RENTAL' : 'OWNER',
        contactNumber: '',
        address: '',
        gstNumber: '',
        password: '',
        ownerId: currentUser?.role === 'OWNER' ? currentUser.id : '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    try {
      // Prepare user data with proper owner relationship
      const userData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        contactNumber: formData.contactNumber,
        address: formData.address,
        gstNumber: formData.gstNumber,
        isPasswordChanged: false,
        password: formData.password || 'temp123',
      };

      // Set owner relationship based on role and current user
      if (formData.role === 'RENTAL' || formData.role === 'TECHNICIAN' ) {
        if (currentUser?.role === 'OWNER' ) {
          // Owner creating rental user or technician - set themselves as owner
          userData.ownerId = currentUser.id;
     
        } else if (currentUser?.role === 'ADMIN' && formData.ownerId) {
          // Admin creating rental user or technician - use selected owner
          userData.ownerId = formData.ownerId;
          
        } else if (currentUser?.role === 'ADMIN' && formData.role === 'TECHNICIAN' && !formData.ownerId) {
          // Technician requires an owner
          setError('Technician role requires an owner to be selected.');
          return;
        }
      } else {
        console.log('User role is not RENTAL or TECHNICIAN:');
      }

      if (selectedUser) {
        await apiService.updateUser(selectedUser.id, userData);
      } else {
        await apiService.createUser(userData);
        
        // Send welcome email
        try {
          await apiService.sendWelcomeEmail({
            to: formData.email,
            name: formData.name,
            tempPassword: formData.password || 'temp123'
          });
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
          // Don't fail user creation if email fails
        }
      }

      await loadUsers();
      handleCloseDialog();
      console.log('User saved successfully, reloading users...');
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiService.deleteUser(id);
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Failed to delete user. Please try again.');
      }
    }
  };

  const handleImpersonate = async (targetUser: User) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      setError('Only administrators can impersonate users');
      return;
    }

    if (window.confirm(`Impersonate ${targetUser.name}? You will be logged in as this user. Click "Logout" to return to your admin account.`)) {
      try {
        const result = await apiService.impersonateUser(
          targetUser.id,
          currentUser.id,
          currentUser.role
        );

        if (result.success && result.user) {
          // Store the admin session before impersonation
          const adminToken = localStorage.getItem('authToken');
          const adminUser = localStorage.getItem('currentUser');

          if (adminToken && adminUser) {
            localStorage.setItem('adminSession', JSON.stringify({
              token: adminToken,
              user: adminUser,
              timestamp: new Date().toISOString()
            }));
          }

          // Store impersonation flag
          localStorage.setItem('isImpersonating', 'true');

          // Store the impersonated user data
          localStorage.setItem('currentUser', JSON.stringify(result.user));

          // Show success message
          alert(result.message || `Now logged in as ${targetUser.name}. Click "Logout" to return to your admin account.`);

          // Reload the page to update the entire app context
          window.location.href = '/';
        } else {
          setError(result.message || 'Failed to impersonate user');
        }
      } catch (error) {
        console.error('Error impersonating user:', error);
        setError('Failed to impersonate user. Please try again.');
      }
    }
  };

  const sendEmailNotification = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user) {
        await apiService.sendEmail({
          to: user.email,
          subject: 'Account Update Notification',
          body: 'Your account has been updated. Please check your dashboard for any changes.'
        });
        alert('Email sent successfully!');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'ADMIN': 
        return 'error';
      case 'OWNER': 
        return 'primary';
      case 'RENTAL': 
        return 'success';
      case 'TECHNICIAN':
        return 'warning';
      default: return 'default';
    }
  };

  const canAddUser = () => {
    return currentUser?.role === 'ADMIN' || 
           currentUser?.role === 'OWNER' ;
  };

  const getAvailableRoles = (): User['role'][] => {
    if (!currentUser) return [];
  
    switch (currentUser.role) {
      case 'ADMIN':
     
        return ['ADMIN', 'OWNER', 'RENTAL', 'TECHNICIAN'];
      case 'OWNER':
    
        return ['RENTAL', 'TECHNICIAN']; // Owner can create rental users and technicians
      default:
        return [];
    }
  };

  const getAvailableOwners = (): User[] => {
    // Only show for admin when creating rental users
    if ((currentUser?.role === 'ADMIN' ) && formData.role === 'RENTAL') {
      return users.filter(u => u.role === 'OWNER');
    }
    return [];
  };
  
  const getUserStats = () => {
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const ownerCount = users.filter(u => u.role === 'OWNER').length;
    const rentalCount = users.filter(u => u.role === 'RENTAL').length;
    const technicianCount = users.filter(u => u.role === 'TECHNICIAN').length;

    return { totalUsers, adminCount, ownerCount, rentalCount, technicianCount };
  };

  const stats = getUserStats();

  // Show access restricted message for rental users
  if (currentUser?.role === 'RENTAL') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
          User Management
        </Typography>
        <Alert severity="info" icon={<Warning />}>
          Access Restricted: Rental users cannot view other users.
        </Alert>
      </Box>
    );
  }

// Show Technician Dashboard
// Show Technician Dashboard
if (currentUser?.role === 'TECHNICIAN') {
  console.log("🧩 Technician Dashboard Rendered");

  const totalRentals = users.length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Technician Dashboard
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size= {{xs:12 ,md:3 ,sm:6}}>
              <Slide direction="up" in timeout={800}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                          {totalRentals}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Rental Users
                        </Typography>
                      </Box>
                      <Person sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>

            <Grid size= {{xs:12 ,md:3 ,sm:6}}>
              <Slide direction="up" in timeout={1000}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                          0
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Assigned Tickets
                        </Typography>
                      </Box>
                      <Warning sx={{ fontSize: 40, color: '#ff9800', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
          </Grid>

          {/* Rentals List */}
          <Fade in timeout={1200}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Rentals under your assigned Owner
              </Typography>

              {users.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>GST Number</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((rental) => (
                        <TableRow key={rental.id} hover>
                          <TableCell>{rental.name}</TableCell>
                          <TableCell>{rental.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={rental.role.toUpperCase()}
                              color={
                                rental.role === 'ADMIN'
                                  ? 'error'
                                  : rental.role === 'OWNER'
                                  ? 'primary'
                                  : rental.role === 'TECHNICIAN'
                                  ? 'warning'
                                  : 'success'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{rental.contactNumber}</TableCell>
                          <TableCell>{rental.address}</TableCell>
                          <TableCell>{rental.gstNumber || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" icon={<Warning />} sx={{ mt: 2 }}>
                  No rental users found under your assigned owner.
                </Alert>
              )}
            </Paper>
          </Fade>
        </>
      )}
    </Box>
  );
}




  

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          User Management
        </Typography>
        {canAddUser() && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Add User
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size= {{xs:12 ,md:3 ,sm:6}}>
          <Slide direction="up" in timeout={1000}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                      {stats.totalUsers}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Total Users
                    </Typography>
                  </Box>
                  <Person sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        {currentUser?.role === 'ADMIN' && (
          <>
            <Grid size= {{xs:12 ,md:3 ,sm:6}}>
              <Slide direction="up" in timeout={1200}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                          {stats.adminCount}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Admins
                        </Typography>
                      </Box>
                      <Person sx={{ fontSize: 40, color: '#f44336', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
            <Grid size= {{xs:12 ,md:3 ,sm:6}}>
              <Slide direction="up" in timeout={1400}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                          {stats.ownerCount}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Owners
                        </Typography>
                      </Box>
                      <Business sx={{ fontSize: 40, color: '#2196f3', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
          </>
        )}
        
        <Grid size= {{xs:12 ,md:3 ,sm:6}}>
          <Slide direction="up" in timeout={1600}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {stats.rentalCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {currentUser?.role === 'OWNER' ? 'My Customers' : 'Rental Users'}
                    </Typography>
                  </Box>
                  <Person sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
      </Grid>

      <Fade in timeout={1800}>
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Paper>
      </Fade>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>GST Number</TableCell>
                {currentUser?.role === 'ADMIN' && (
                  <TableCell sx={{ fontWeight: 'bold' }}>Owner</TableCell>
                )}
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={currentUser?.role === 'ADMIN' ? 7 : 6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No users found matching your search.' : 
                       currentUser?.role === 'OWNER' ?  'No rental customers yet. Create your first rental customer!' :
                       'No users found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ color: 'text.secondary' }} />
                        {user.name}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.toUpperCase()}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.contactNumber}</TableCell>
                    <TableCell>{user.gstNumber || 'N/A'}</TableCell>
                    {currentUser?.role === 'ADMIN' && (
                      <TableCell>
                        {user.owner ? (
                          <Chip
                            label={user.owner.name || `Owner ${user.owner.id}`}
                            variant="outlined"
                            size="small"
                            color="primary"
                          />
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                    )}
                    
                    <TableCell>
                      {(currentUser?.role === 'ADMIN') && (
                        <>
                          <IconButton onClick={() => handleOpenDialog(user)} color="primary" title="Edit User">
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => sendEmailNotification(user.id)} color="info" title="Send Email">
                            <Email />
                          </IconButton>
                          {user.id !== currentUser?.id && (
                            <>
                              <IconButton
                                onClick={() => handleImpersonate(user)}
                                color="warning"
                                title="Login as this user"
                                sx={{
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 152, 0, 0.08)',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s'
                                }}
                              >
                                <Login />
                              </IconButton>
                              {canAddUser() && (
                                <IconButton onClick={() => handleDelete(user.id)} color="error" title="Delete User">
                                  <Delete />
                                </IconButton>
                              )}
                            </>
                          )}
                        </>
                      )}
                      {(currentUser?.role === 'OWNER') && (
                        <>
                          <IconButton onClick={() => handleOpenDialog(user)} color="primary" title="Edit User">
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => sendEmailNotification(user.id)} color="info" title="Send Email">
                            <Email />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size= {{xs:12}}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size= {{xs:12}}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid size= {{xs:12}}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                >
                  {getAvailableRoles().map(role => (
                    <MenuItem key={role} value={role}>
                      {role.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Show owner selection only for admin creating rental users */}
            {(currentUser?.role === 'ADMIN') && formData.role === 'RENTAL' && (
              <Grid size= {{xs:12}}>
                <FormControl fullWidth>
                  <InputLabel>Owner (Optional)</InputLabel>
                  <Select
                    value={formData.ownerId}
                    onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  >
                    <MenuItem value="">No Owner</MenuItem>
                    {getAvailableOwners().map(owner => (
                      <MenuItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {/* Show owner info for existing rental users */}
            {selectedUser && selectedUser.owner && (
              <Grid size= {{xs:12}}>
                <Alert severity="info">
                  <Typography>
                    <strong>Owner:</strong> {selectedUser.owner.name || `Owner ${selectedUser.owner.id}`}
                  </Typography>
                </Alert>
              </Grid>
            )}
            
            <Grid size= {{xs:12}}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid size= {{xs:12}}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </Grid>
            <Grid size= {{xs:12}}>
              <TextField
                fullWidth
                label="GST Number (Optional)"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              />
            </Grid>
            
            {/* Show password field only for new users */}
            {!selectedUser && (
              <Grid size={{xs:12}}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty for default: temp123"
                  helperText="User will be required to change this password on first login"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {selectedUser ? 'Update' : 'Create'} User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserList; 