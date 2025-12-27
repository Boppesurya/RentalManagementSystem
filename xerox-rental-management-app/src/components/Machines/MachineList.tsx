import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
  Business,
  AttachMoney,
  Search
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Machine, type User } from '../../types';

const MachineList: React.FC = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    usage: '',
    serialNumber: '',
    location: '',
    monthlyRent: '',
    rentalId: '',
    status: 'AVAILABLE' as Machine['status']
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMachines();
    loadUsers();
  }, []);

  const loadMachines = async () => {
    setLoading(true);
    try {
      const data = await apiService.getMachines();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid machine data format');
      }
      if (user?.role === 'OWNER') {
        setMachines(data.filter(m => m.owner?.id === user.id));
      } else if (user?.role === 'RENTAL') {
        setMachines(data.filter(m => m.rental?.id === user.id));
      } else {
        setMachines(data);
      }
    } catch (error) {
      console.error('Error loading machines:', error);
      setError('Failed to load machines. Please try again.');
      setMachines([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid user data format');
      }
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users.');
    }
  };

  const handleOpenDialog = (machine?: Machine) => {
    
    setError(null);
    if (machine) {
      setSelectedMachine(machine);
      setFormData({
        name: machine.name || '',
        model: machine.model || '',
        usage: machine.usage?.toString() || '0',
        serialNumber: machine.serialNumber || '',
        location: machine.location || '',
        monthlyRent: machine.monthlyRent?.toString() || '',
        rentalId: machine.rental?.id || '',
        status: machine.status || 'AVAILABLE'
      });
    } else {
      setSelectedMachine(null);
      setFormData({
        name: '',
        model: '',
        usage: '',
        serialNumber: '',
        location: '',
        monthlyRent: '',
        rentalId: '',
        status: 'AVAILABLE'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMachine(null);
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Machine name is required';
    if (!formData.model.trim()) return 'Model is required';
    if (!formData.serialNumber.trim()) return 'Serial number is required';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.monthlyRent || isNaN(Number(formData.monthlyRent)) || Number(formData.monthlyRent) <= 0) {
      return 'Valid monthly rent is required';
    }
    if (!formData.usage || isNaN(Number(formData.usage)) || Number(formData.usage) < 0) {
      return 'Valid usage is required';
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const machineData = {
        ...formData,
        monthlyRent: parseFloat(formData.monthlyRent),
        usage: parseInt(formData.usage),
        ownerId: user.id,
        installationDate: new Date(),
        lastServiceDate: new Date()
      };
      

      if (selectedMachine) {
        await apiService.updateMachine(selectedMachine.id, machineData);
      } else {
        await apiService.createMachine(machineData);
      }

      await loadMachines();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving machine:', error);
      setError('Failed to save machine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      setLoading(true);
      try {
        await apiService.deleteMachine(id);
        await loadMachines();
      } catch (error) {
        console.error('Error deleting machine:', error);
        setError('Failed to delete machine.');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredMachines = useMemo(() => {
    return machines.filter(machine =>
      [machine.name, machine.model, machine.serialNumber, machine.location]
        .some(val => val?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [machines, searchTerm]);

  const getStatusColor = (status: Machine['status']) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'RENTED': return 'primary';
      case 'MAINTENANCE': return 'warning';
      default: return 'default';
    }
  };

  const getUserName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : 'Unknown';
  };

  const getOwnerName = (owner: any) => {
    return owner ? (typeof owner === 'string' ? getUserName(owner) : owner.name || getUserName(owner.id) || 'Unknown') : 'Unknown';
  };

  const getRentalName = (rental: any) => {
    return rental ? (typeof rental === 'string' ? getUserName(rental) : rental.name || getUserName(rental.id) || 'N/A') : 'N/A';
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Machine Management
        </Typography>
        {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
            sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Add Machine
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Search machines..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          disabled={loading}
        />
      </Paper>

      <Grid container spacing={3}>
        {filteredMachines.length === 0 && !loading && (
          <Grid size={{ xs: 12 }}>
            <Typography color="text.secondary">No machines found.</Typography>
          </Grid>
        )}
        {filteredMachines.map((machine) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={machine.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {machine.name || 'Unnamed'}
                  </Typography>
                  <Chip label={machine.status || 'Unknown'} color={getStatusColor(machine.status)} size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Model: {machine.model || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Serial: {machine.serialNumber || 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {machine.location || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {machine.monthlyRent ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(machine.monthlyRent) : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Owner: {getOwnerName(machine.owner)}
                  </Typography>
                </Box>
                {machine.rental && (
                  <Typography variant="body2" color="text.secondary">
                    Rental: {getRentalName(machine.rental)}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Usage: {machine.usage ? Number(machine.usage).toLocaleString() : '0'} pages
                </Typography>
              </CardContent>
              {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
                <CardActions>
                  <IconButton onClick={() => handleOpenDialog(machine)} color="primary" disabled={loading}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(machine.id)} color="error" disabled={loading}>
                    <Delete />
                  </IconButton>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedMachine ? 'Edit Machine' : 'Add New Machine'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Machine Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!formData.name.trim()}
                helperText={!formData.name.trim() ? 'Required' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                error={!formData.model.trim()}
                helperText={!formData.model.trim() ? 'Required' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Serial Number"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                error={!formData.serialNumber.trim()}
                helperText={!formData.serialNumber.trim() ? 'Required' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Rental</InputLabel>
                <Select
                  value={formData.rentalId}
                  onChange={(e) => setFormData({ ...formData, rentalId: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {users.filter(u => u.role === 'RENTAL').map(u => (
                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                error={!formData.location.trim()}
                helperText={!formData.location.trim() ? 'Required' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Monthly Rent"
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                error={!formData.monthlyRent || isNaN(Number(formData.monthlyRent)) || Number(formData.monthlyRent) <= 0}
                helperText={!formData.monthlyRent || isNaN(Number(formData.monthlyRent)) || Number(formData.monthlyRent) <= 0 ? 'Valid number required' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Usage"
                type="number"
                value={formData.usage}
                onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                error={!formData.usage || isNaN(Number(formData.usage)) || Number(formData.usage) < 0}
                helperText={!formData.usage || isNaN(Number(formData.usage)) || Number(formData.usage) < 0 ? 'Valid number required' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Machine['status'] })}
                >
                  <MenuItem value="AVAILABLE">Available</MenuItem>
                  <MenuItem value="RENTED">Rented</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !!validateForm()}
          >
            {loading ? <CircularProgress size={24} /> : selectedMachine ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MachineList;