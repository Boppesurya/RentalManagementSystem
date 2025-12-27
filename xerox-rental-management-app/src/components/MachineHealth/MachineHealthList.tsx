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
  Card,
  CardContent,
  Alert,
  CircularProgress,
  LinearProgress,
  Slide,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add,
  Edit,
  Refresh,
  Search,
  Warning,
  CheckCircle,
  Error,
  Engineering,
  
  Speed
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Machine, type MachineHealth } from '../../types';

const MachineHealthList: React.FC = () => {
  const { user } = useAuth();
  const [machineHealthData, setMachineHealthData] = useState<MachineHealth[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedHealth, setSelectedHealth] = useState<MachineHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    machineId: '',
    healthScore: '',
    temperature: '',
    humidity: '',
    tonerLevel: '',
    paperLevel: '',
    errorCount: '',
    pagesPrintedToday: '',
    alerts: '',
    recommendations: ''
  });

  useEffect(() => {
    loadMachineHealth();
    loadMachines();
  }, [user?.id]);

  const loadMachineHealth = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getMachineHealth();
      setMachineHealthData(data);
    } catch (error) {
      console.error('Error loading machine health:', error);
      setError('Failed to load machine health data. Please check your connection.');
      setMachineHealthData([]);
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

  const handleOpenDialog = (health?: MachineHealth) => {
    if (health) {
      setSelectedHealth(health);
      setFormData({
        machineId: health.machineId.toString(),
        healthScore: health.healthScore.toString(),
        temperature: health.temperature?.toString() || '',
        humidity: health.humidity?.toString() || '',
        tonerLevel: health.tonerLevel?.toString() || '',
        paperLevel: health.paperLevel?.toString() || '',
        errorCount: health.errorCount.toString(),
        pagesPrintedToday: health.pagesPrintedToday.toString(),
        alerts: health.alerts || '',
        recommendations: health.recommendations || ''
      });
    } else {
      setSelectedHealth(null);
      setFormData({
        machineId: '',
        healthScore: '',
        temperature: '',
        humidity: '',
        tonerLevel: '',
        paperLevel: '',
        errorCount: '0',
        pagesPrintedToday: '0',
        alerts: '',
        recommendations: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedHealth(null);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const healthData = {
        healthScore: parseFloat(formData.healthScore),
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        humidity: formData.humidity ? parseFloat(formData.humidity) : undefined,
        tonerLevel: formData.tonerLevel ? parseInt(formData.tonerLevel) : undefined,
        paperLevel: formData.paperLevel ? parseInt(formData.paperLevel) : undefined,
        errorCount: parseInt(formData.errorCount),
        pagesPrintedToday: parseInt(formData.pagesPrintedToday)
      };

      await apiService.updateMachineHealth(formData.machineId, healthData);
      await loadMachineHealth();
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating machine health:', error);
      setError('Failed to update machine health. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'EXCELLENT': return 'success';
      case 'GOOD': return 'info';
      case 'WARNING': return 'warning';
      case 'CRITICAL': return 'error';
      case 'OFFLINE': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'EXCELLENT': return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'GOOD': return <CheckCircle sx={{ color: '#2196f3' }} />;
      case 'WARNING': return <Warning sx={{ color: '#ff9800' }} />;
      case 'CRITICAL': return <Error sx={{ color: '#f44336' }} />;
      case 'OFFLINE': return <Error sx={{ color: '#666' }} />;
      default: return <Engineering sx={{ color: '#666' }} />;
    }
  };

  const getMachineName = (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : 'Unknown Machine';
  };

  const getHealthStats = () => {
    const totalMachines = machineHealthData.length;
    const excellentCount = machineHealthData.filter(h => h.status === 'EXCELLENT').length;
    const warningCount = machineHealthData.filter(h => h.status === 'WARNING').length;
    const criticalCount = machineHealthData.filter(h => h.status === 'CRITICAL').length;
    const avgHealthScore = machineHealthData.length > 0 
      ? machineHealthData.reduce((sum, h) => sum + h.healthScore, 0) / machineHealthData.length 
      : 0;

    return { totalMachines, excellentCount, warningCount, criticalCount, avgHealthScore };
  };

  const stats = getHealthStats();

  const filteredHealthData = machineHealthData.filter(health =>
    getMachineName(health.machineId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    health.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Machine Health Monitoring
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadMachineHealth}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
          {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Update Health
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Health Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <Slide direction="up" in timeout={1000}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                      {stats.totalMachines}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Total Machines
                    </Typography>
                  </Box>
                  <Engineering sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
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
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {stats.excellentCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Excellent
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
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
                      {stats.warningCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Warning
                    </Typography>
                  </Box>
                  <Warning sx={{ fontSize: 40, color: '#ff9800', opacity: 0.7 }} />
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
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      {stats.criticalCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Critical
                    </Typography>
                  </Box>
                  <Error sx={{ fontSize: 40, color: '#f44336', opacity: 0.7 }} />
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
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                      {stats.avgHealthScore.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Avg Health Score
                    </Typography>
                  </Box>
                  <Speed sx={{ fontSize: 40, color: '#9c27b0', opacity: 0.7 }} />
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
            placeholder="Search machine health..."
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
                <TableCell sx={{ fontWeight: 'bold' }}>Health Score</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Temperature</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Toner Level</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Paper Level</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Error Count</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pages Today</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHealthData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No machine health data found matching your search.' : 'No machine health data available.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredHealthData.map((health) => (
                  <TableRow key={health.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Engineering sx={{ color: 'text.secondary' }} />
                        {getMachineName(health.machineId)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {health.healthScore}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={health.healthScore}
                          sx={{
                            width: 60,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: health.healthScore >= 80 ? '#4caf50' : health.healthScore >= 60 ? '#ff9800' : '#f44336'
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(health.status)}
                        <Chip
                          label={health.status.toUpperCase()}
                          color={getStatusColor(health.status)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{health.temperature ? `${health.temperature}°C` : 'N/A'}</TableCell>
                    <TableCell>
                      {health.tonerLevel ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{health.tonerLevel}%</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={health.tonerLevel}
                            sx={{
                              width: 40,
                              height: 4,
                              borderRadius: 2,
                              bgcolor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: health.tonerLevel >= 50 ? '#4caf50' : health.tonerLevel >= 20 ? '#ff9800' : '#f44336'
                              }
                            }}
                          />
                        </Box>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {health.paperLevel ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{health.paperLevel}%</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={health.paperLevel}
                            sx={{
                              width: 40,
                              height: 4,
                              borderRadius: 2,
                              bgcolor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: health.paperLevel >= 50 ? '#4caf50' : health.paperLevel >= 20 ? '#ff9800' : '#f44336'
                              }
                            }}
                          />
                        </Box>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={health.errorCount}
                        color={health.errorCount === 0 ? 'success' : health.errorCount <= 3 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{health.pagesPrintedToday.toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(health)} color="primary">
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Update Health Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedHealth ? 'Update Machine Health' : 'Add Machine Health Data'}
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
                  disabled={selectedHealth !== null}
                >
                  {machines.map(machine => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.name} - {machine.model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{xs:12, sm:6}}>
              <TextField
                fullWidth
                label="Health Score (%)"
                type="number"
                value={formData.healthScore}
                onChange={(e) => setFormData({ ...formData, healthScore: e.target.value })}
                required
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid size={{xs:12, sm:6}}>
              <TextField
                fullWidth
                label="Temperature (°C)"
                type="number"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              />
            </Grid>
            <Grid size={{xs:12, sm:6}}>
              <TextField
                fullWidth
                label="Humidity (%)"
                type="number"
                value={formData.humidity}
                onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid size={{xs:12, sm:6}}>
              <TextField
                fullWidth
                label="Toner Level (%)"
                type="number"
                value={formData.tonerLevel}
                onChange={(e) => setFormData({ ...formData, tonerLevel: e.target.value })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid size={{xs:12, sm:6}}>
              <TextField
                fullWidth
                label="Paper Level (%)"
                type="number"
                value={formData.paperLevel}
                onChange={(e) => setFormData({ ...formData, paperLevel: e.target.value })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid size={{xs:12, sm:6}}>
              <TextField
                fullWidth
                label="Error Count"
                type="number"
                value={formData.errorCount}
                onChange={(e) => setFormData({ ...formData, errorCount: e.target.value })}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Pages Printed Today"
                type="number"
                value={formData.pagesPrintedToday}
                onChange={(e) => setFormData({ ...formData, pagesPrintedToday: e.target.value })}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Alerts"
                multiline
                rows={2}
                value={formData.alerts}
                onChange={(e) => setFormData({ ...formData, alerts: e.target.value })}
                placeholder="Any alerts or warnings..."
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Recommendations"
                multiline
                rows={2}
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                placeholder="Maintenance recommendations..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {selectedHealth ? 'Update' : 'Add'} Health Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MachineHealthList;