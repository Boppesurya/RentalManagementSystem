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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Slide,
  Fade
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Schedule,
  Engineering,
  Assignment,
  PlayArrow,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Machine, type User, type MaintenanceSchedule } from '../../types';

const MaintenanceScheduleList: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    machineId: '',
    maintenanceType: '',
    scheduledDate: '',
    description: '',
    estimatedDuration: '',
    technicianId: '',
    status: 'SCHEDULED' as MaintenanceSchedule['status']
  });

  useEffect(() => {
   loadSchedules();
    loadMachines();
    loadUsers();
  }, [user?.id]);

  const loadSchedules = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getMaintenanceSchedules();
      
      // Role-based filtering for maintenance schedules
      let filteredSchedules = data;
      
      if (user?.role === 'OWNER') {
        // Owner can only see schedules for their machines
        const ownerMachines = machines.filter(m => m.owner?.id === user.id );
        const ownerMachineIds = (ownerMachines.map(m => m.id));
        filteredSchedules = data.filter(s => ownerMachineIds.includes(s.machineId));
      } else if (user?.role === 'RENTAL') {
        // Rental can only see schedules for machines they are renting
        const rentalMachines = machines.filter(m => m.rental?.id === user.id.toString());
        const rentalMachineIds = rentalMachines.map(m => m.id);
        filteredSchedules = data.filter(s => rentalMachineIds.includes(s.machineId));
      }
      
      setSchedules(filteredSchedules);
    } catch (error) {
      console.error('Error loading maintenance schedules:', error);
      setError('Failed to load maintenance schedules. Please check your connection.');
      setSchedules([]);
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

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleOpenDialog = (schedule?: MaintenanceSchedule) => {
    if (schedule) {
      setSelectedSchedule(schedule);
      setFormData({
        machineId: schedule.machineId,
        maintenanceType: schedule.maintenanceType,
        scheduledDate: new Date(schedule.scheduledDate).toISOString().slice(0, 16),
        description: schedule.description || '',
        estimatedDuration: schedule.estimatedDuration?.toString() || '',
        technicianId: schedule.technicianId || '',
        status: schedule.status
      });
    } else {
      setSelectedSchedule(null);
      setFormData({
        machineId: '',
        maintenanceType: '',
        scheduledDate: '',
        description: '',
        estimatedDuration: '',
        technicianId: '',
        status: 'SCHEDULED'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSchedule(null);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const scheduleData = {
        machineId: formData.machineId,
        maintenanceType: formData.maintenanceType,
        scheduledDate: formData.scheduledDate,
        description: formData.description,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
        technicianId: formData.technicianId || undefined
      };

      if (selectedSchedule) {
        // Update existing schedule
        await apiService.updateMaintenanceSchedule(selectedSchedule.id, {
          ...scheduleData,
          status: formData.status
        });
      } else {
        // Create new schedule
        await apiService.createMaintenanceSchedule(scheduleData);
      }

      await loadSchedules();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving maintenance schedule:', error);
      setError('Failed to save maintenance schedule. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this maintenance schedule?')) {
      try {
        await apiService.deleteMaintenanceSchedule(id);
        await loadSchedules();
      } catch (error) {
        console.error('Error deleting maintenance schedule:', error);
        setError('Failed to delete maintenance schedule. Please try again.');
      }
    }
  };

  const handleStatusChange = async (scheduleId: string, newStatus: MaintenanceSchedule['status']) => {
    try {
      await apiService.updateMaintenanceSchedule(scheduleId, { status: newStatus });
      await loadSchedules();
    } catch (error) {
      console.error('Error updating schedule status:', error);
      setError('Failed to update schedule status. Please try again.');
    }
  };

  const getStatusColor = (status: MaintenanceSchedule['status']) => {
    switch (status) {
      case 'SCHEDULED': return 'info';
      case 'IN-PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'default';
      case 'OVERDUE': return 'error';
      default: return 'default';
    }
  };

  const getMachineName = (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : 'Unknown Machine';
  };

  const getTechnicianName = (technicianId?: string) => {
    if (!technicianId) return 'Unassigned';
    const technician = users.find(u => u.id === technicianId);
    return technician ? technician.name : 'Unknown';
  };

  const getAvailableMachines = () => {
    if (user?.role === 'ADMIN') {
      return machines;
    } else if (user?.role === 'OWNER') {
      return machines.filter(m => m.owner?.id === user.id );
    } else if (user?.role === 'RENTAL') {
      return machines.filter(m => m.rental?.id === user.id);
    }
    return [];
  };

  const getAvailableTechnicians = () => {
    if (user?.role === 'ADMIN') {
      return users.filter(u => u.role === 'TECHNICIAN');
    } else if (user?.role === 'OWNER' ) {
      // Owner can assign their technicians
      return users.filter(u => u.role === 'TECHNICIAN' && u.owner?.id === user.id.toString());

    }
    return [];
  };
  const getScheduleStats = () => {
    const totalSchedules = schedules.length;
    const scheduledCount = schedules.filter(s => s.status === 'SCHEDULED').length;
    const inProgressCount = schedules.filter(s => s.status === 'IN-PROGRESS').length;
    const completedCount = schedules.filter(s => s.status === 'COMPLETED').length;
    const overdueCount = schedules.filter(s => s.status === 'OVERDUE').length;

    return { totalSchedules, scheduledCount, inProgressCount, completedCount, overdueCount };
  };

  const stats = getScheduleStats();

  const filteredSchedules = schedules.filter(schedule =>
    getMachineName(schedule.machineId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.maintenanceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {user?.role === 'ADMIN' ? 'All Maintenance Schedules' : 
           user?.role === 'OWNER' ? 'My Machines Maintenance' : 
           'Rented Machines Maintenance'}
        </Typography>
        {(user?.role === 'ADMIN' || user?.role === 'OWNER' ) && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Schedule Maintenance
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
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <Slide direction="up" in timeout={1000}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                      {stats.totalSchedules}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Total Schedules
                    </Typography>
                  </Box>
                  <Schedule sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <Slide direction="up" in timeout={1200}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      {stats.scheduledCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Scheduled
                    </Typography>
                  </Box>
                  <Schedule sx={{ fontSize: 40, color: '#2196f3', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <Slide direction="up" in timeout={1400}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                      {stats.inProgressCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      In Progress
                    </Typography>
                  </Box>
                  <Engineering sx={{ fontSize: 40, color: '#ff9800', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <Slide direction="up" in timeout={1600}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {stats.completedCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Completed
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <Slide direction="up" in timeout={1800}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      {stats.overdueCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Overdue
                    </Typography>
                  </Box>
                  <Schedule sx={{ fontSize: 40, color: '#f44336', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
      </Grid>

      <Fade in timeout={2000}>
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <TextField
            fullWidth
            placeholder="Search maintenance schedules..."
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
                <TableCell sx={{ fontWeight: 'bold' }}>Machine</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Maintenance Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Scheduled Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Technician</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No maintenance schedules found matching your search.' : 'No maintenance schedules found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((schedule) => (
                  <TableRow key={schedule.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Engineering sx={{ color: 'text.secondary' }} />
                        {getMachineName(schedule.machineId)}
                      </Box>
                    </TableCell>
                    <TableCell>{schedule.maintenanceType}</TableCell>
                    <TableCell>{new Date(schedule.scheduledDate).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={schedule.status.replace('-', ' ').toUpperCase()}
                        color={getStatusColor(schedule.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{getTechnicianName(schedule.technicianId)}</TableCell>
                    <TableCell>
                      {schedule.estimatedDuration ? `${schedule.estimatedDuration} min` : 'N/A'}
                      {schedule.actualDuration && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Actual: {schedule.actualDuration} min
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {schedule.cost ? `₹${schedule.cost.toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(schedule)} color="primary">
                        <Edit />
                      </IconButton>
                      {user?.role === 'ADMIN' && schedule.status === 'SCHEDULED' && (
                        <IconButton onClick={() => handleStatusChange(schedule.id, 'IN-PROGRESS')} color="warning">
                          <PlayArrow />
                        </IconButton>
                      )}
                      {user?.role === 'ADMIN' && schedule.status === 'IN-PROGRESS' && (
                        <IconButton onClick={() => handleStatusChange(schedule.id, 'COMPLETED')} color="success">
                          <CheckCircle />
                        </IconButton>
                      )}
                      {user?.role === 'ADMIN' && (
                        <IconButton onClick={() => handleDelete(schedule.id)} color="error">
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

      {/* Add/Edit Schedule Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSchedule ? 'Edit Maintenance Schedule' : 'Schedule New Maintenance'}
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
                  disabled={selectedSchedule !== null}
                >
                  {getAvailableMachines().map(machine => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.name} - {machine.model} ({machine.location})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Maintenance Type"
                value={formData.maintenanceType}
                onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                required
                placeholder="e.g., Routine Service, Repair, Cleaning"
              />
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Scheduled Date & Time"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            {selectedSchedule && (
              <Grid size={{xs:12,sm:6}}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceSchedule['status'] })}
                  >
                    <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                    <MenuItem value="IN-ROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    <MenuItem value="OVERDUE">Overdue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Estimated Duration (minutes)"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            
            {(user?.role === 'ADMIN' ) && (
              <Grid size={{xs:12,sm:6}}>
                <FormControl fullWidth>
                  <InputLabel>Assign Technician</InputLabel>
                  <Select
                    value={formData.technicianId}
                    onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {getAvailableTechnicians().map(u => (
                      <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the maintenance work to be performed..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {selectedSchedule ? 'Update' : 'Schedule'} Maintenance
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenanceScheduleList;