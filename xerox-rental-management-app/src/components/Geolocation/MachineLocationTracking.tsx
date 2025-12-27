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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  LocationOn,
  Add,
  Edit,
  Delete,
  Map as MapIcon,
  List as ListIcon,
  History,
  MyLocation
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Machine } from '../../types';

interface MachineLocation {
  id: string;
  machine: { id: string; name: string; model: string; serialNumber: string };
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  locationType: string;
  notes?: string;
  recordedAt: string;
  recordedBy?: { id: string; name: string };
}

const MachineLocationTracking: React.FC = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<MachineLocation[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<MachineLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    machineId: '',
    latitude: '',
    longitude: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    notes: ''
  });

  useEffect(() => {
    loadLocations();
    loadMachines();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await apiService.getMachineLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
      setError('Failed to load machine locations');
    } finally {
      setLoading(false);
    }
  };

  const loadMachines = async () => {
    try {
      const data = await apiService.getMachines();
      setMachines(data);
    } catch (error) {
      console.error('Error loading machines:', error);
    }
  };

  const loadMachineLocations = async (machineId: string) => {
    setLoading(true);
    try {
      const data = await apiService.getMachineLocationsByMachineId(machineId);
      setLocations(data);
    } catch (error) {
      console.error('Error loading machine locations:', error);
      setError('Failed to load locations for selected machine');
    } finally {
      setLoading(false);
    }
  };

  const handleMachineChange = (machineId: string) => {
    setSelectedMachine(machineId);
    if (machineId) {
      loadMachineLocations(machineId);
    } else {
      loadLocations();
    }
  };

  const handleOpenDialog = (location?: MachineLocation) => {
    if (location) {
      setSelectedLocation(location);
      setFormData({
        machineId: location.machine.id,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        country: location.country || '',
        postalCode: location.postalCode || '',
        notes: location.notes || ''
      });
    } else {
      setSelectedLocation(null);
      setFormData({
        machineId: selectedMachine || '',
        latitude: '',
        longitude: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLocation(null);
    setError('');
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          setError('Unable to get current location: ' + error.message);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const locationData = {
        machineId: formData.machineId,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        notes: formData.notes,
        recordedBy: user?.id
      };

      if (selectedLocation) {
        await apiService.updateMachineLocation(selectedLocation.id, locationData);
      } else {
        await apiService.recordMachineLocation(formData.machineId, locationData);
      }

      if (selectedMachine) {
        await loadMachineLocations(selectedMachine);
      } else {
        await loadLocations();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving location:', error);
      setError('Failed to save location');
    }
  };

  const handleDelete = async (locationId: string) => {
    if (window.confirm('Are you sure you want to delete this location record?')) {
      try {
        await apiService.deleteMachineLocation(locationId);
        if (selectedMachine) {
          await loadMachineLocations(selectedMachine);
        } else {
          await loadLocations();
        }
      } catch (error) {
        console.error('Error deleting location:', error);
        setError('Failed to delete location');
      }
    }
  };

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case 'CURRENT': return 'success';
      case 'DELIVERY': return 'info';
      case 'PICKUP': return 'warning';
      case 'SERVICE': return 'secondary';
      case 'STORAGE': return 'default';
      case 'HISTORICAL': return 'default';
      default: return 'default';
    }
  };

  const currentLocations = locations.filter(loc => loc.locationType === 'CURRENT');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Machine Geolocation Tracking
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Record Location
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{xs:12,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                    {machines.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Total Machines
                  </Typography>
                </Box>
                <MapIcon sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {currentLocations.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Tracked Locations
                  </Typography>
                </Box>
                <LocationOn sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {locations.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Total Records
                  </Typography>
                </Box>
                <History sx={{ fontSize: 40, color: '#ff9800', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Machine</InputLabel>
                <Select
                  value={selectedMachine}
                  onChange={(e) => handleMachineChange(e.target.value)}
                  label="Filter by Machine"
                >
                  <MenuItem value="">All Machines</MenuItem>
                  {machines.map(machine => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<ListIcon />} label="List View" />
          <Tab icon={<MapIcon />} label="Map View" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Machine</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Coordinates</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Recorded At</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Recorded By</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No location records found. Start tracking machine locations!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((location) => (
                      <TableRow key={location.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {location.machine.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {location.machine.serialNumber}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {location.address && (
                              <Typography variant="body2">{location.address}</Typography>
                            )}
                            {location.city && location.state && (
                              <Typography variant="caption" color="text.secondary">
                                {location.city}, {location.state}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={location.locationType}
                            color={getLocationTypeColor(location.locationType)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(location.recordedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {location.recordedBy?.name || 'System'}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => window.open(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`, '_blank')}
                            color="primary"
                          >
                            <MapIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleOpenDialog(location)} color="primary">
                            <Edit />
                          </IconButton>
                          {user?.role === 'ADMIN' && (
                            <IconButton size="small" onClick={() => handleDelete(location.id)} color="error">
                              <Delete />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 1 && (
            <Box sx={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
              <Box sx={{ textAlign: 'center' }}>
                <MapIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Interactive Map View
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Integrate with Google Maps, Leaflet, or Mapbox for interactive map visualization
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  All current machine locations are displayed above
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedLocation ? 'Edit Location' : 'Record New Location'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12}}>
              <FormControl fullWidth required>
                <InputLabel>Machine</InputLabel>
                <Select
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  disabled={selectedLocation !== null}
                >
                  {machines.map(machine => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.name} - {machine.serialNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12}}>
              <Button
                startIcon={<MyLocation />}
                onClick={handleGetCurrentLocation}
                variant="outlined"
                fullWidth
              >
                Use My Current Location
              </Button>
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                required
                inputProps={{ step: 'any' }}
              />
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                required
                inputProps={{ step: 'any' }}
              />
            </Grid>

            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="State/Province"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </Grid>

            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {selectedLocation ? 'Update' : 'Record'} Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MachineLocationTracking;
