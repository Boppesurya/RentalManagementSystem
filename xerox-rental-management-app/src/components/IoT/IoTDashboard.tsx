import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import {
  Sensors,
  DeviceHub,
  Wifi,
  Battery1Bar,
  Battery3Bar,
  BatteryFull,
  Warning,
  CheckCircle,
  Error,
  Settings,
  Refresh,
  Notifications,
  LocationOn,
  Schedule,
  Analytics,
  NetworkCheck,
  SignalWifi4Bar,
  SignalWifiOff,
  Router} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

const IoTDashboard: React.FC = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [networkStatus, setNetworkStatus] = useState<any>({});
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [openDeviceDialog, setOpenDeviceDialog] = useState(false);
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadIoTData();
    loadNetworkStatus();
    loadRealTimeData();
    loadAlerts();
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadRealTimeData();
        loadSensorData();
      }, 5000); // Update every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadIoTData = async () => {
    setLoading(true);
    try {
      // For now, show empty state until IoT devices are implemented
      setDevices([]);
      loadSensorData();
    } catch (error) {
      console.error('Error loading IoT data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSensorData = async () => {
    try {
      // For now, show empty data until sensor integration is implemented
      setSensorData([]);
    } catch (error) {
      console.error('Error loading sensor data:', error);
      setSensorData([]);
    }
  };

  const loadNetworkStatus = async () => {
    try {
      const networkStatus = {
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        warningDevices: 0,
        networkHealth: 0,
        dataTransferred: 0,
        averageLatency: 0,
        packetLoss: 0
      };
      setNetworkStatus(networkStatus);
    } catch (error) {
      console.error('Error loading network status:', error);
      setNetworkStatus({});
    }
  };

  const loadRealTimeData = async () => {
    try {
      // For now, show empty data until real-time integration is implemented
      setRealTimeData([]);
    } catch (error) {
      console.error('Error loading real-time data:', error);
      setRealTimeData([]);
    }
  };

  const loadAlerts = async () => {
    try {
      // For now, show empty alerts until IoT integration is implemented
      setAlerts([]);
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlerts([]);
    }
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return '#4caf50';
      case 'WARNING': return '#ff9800';
      case 'OFFLINE': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getDeviceStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE': return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'WARNING': return <Warning sx={{ color: '#ff9800' }} />;
      case 'OFFLINE': return <Error sx={{ color: '#f44336' }} />;
      default: return <DeviceHub />;
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level > 66) return <BatteryFull sx={{ color: '#4caf50' }} />;
    if (level > 33) return <Battery3Bar sx={{ color: '#ff9800' }} />;
    return <Battery1Bar sx={{ color: '#f44336' }} />;
  };

  const getSignalIcon = (strength: number) => {
    if (strength > -50) return <SignalWifi4Bar sx={{ color: '#4caf50' }} />;
    if (strength > -70) return <NetworkCheck sx={{ color: '#ff9800' }} />;
    return <SignalWifiOff sx={{ color: '#f44336' }} />;
  };

  const handleDeviceClick = (device: any) => {
    setSelectedDevice(device);
    setOpenDeviceDialog(true);
  };

  const handleConfigureDevice = (device: any) => {
    setSelectedDevice(device);
    setOpenConfigDialog(true);
  };

  

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          IoT Device Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto Refresh"
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadIoTData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Sensors />}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Add Device
          </Button>
        </Box>
      </Box>

      {/* Network Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
     <Grid  size={{xs:12 ,sm:6 ,md:3}}  >
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                    {networkStatus.totalDevices}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Total Devices
                  </Typography>
                </Box>
                <DeviceHub sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12 ,sm:6 ,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {networkStatus.onlineDevices}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Online
                  </Typography>
                </Box>
                <Wifi sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12 ,sm:6 ,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {networkStatus.warningDevices}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Warnings
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: '#ff9800', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12 ,sm:6 ,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                    {networkStatus.networkHealth}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Network Health
                  </Typography>
                </Box>
                <Router sx={{ fontSize: 40, color: '#2196f3', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Device List */}
        <Grid size={{xs:12 ,lg:8}}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Connected Devices
            </Typography>
            <Grid container spacing={3}>
              {devices.map((device) => (
                <Grid size={{xs:12,md:6}} key={device.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => handleDeviceClick(device)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {device.name}
                        </Typography>
                        <Chip
                          icon={getDeviceStatusIcon(device.status)}
                          label={device.status}
                          sx={{ bgcolor: getDeviceStatusColor(device.status), color: 'white' }}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Type: {device.type} | Firmware: {device.firmware}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {device.location}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getBatteryIcon(device.batteryLevel)}
                          <Typography variant="caption">{device.batteryLevel}%</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getSignalIcon(device.signalStrength)}
                          <Typography variant="caption">{device.signalStrength} dBm</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule sx={{ fontSize: 14 }} />
                          <Typography variant="caption">{device.uptime}% uptime</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="Configure Device">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfigureDevice(device);
                            }}
                            sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }}
                          >
                            <Settings sx={{ color: '#667eea' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Analytics">
                          <IconButton
                            size="small"
                            sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}
                          >
                            <Analytics sx={{ color: '#4caf50' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Sensor Data Charts */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Sensor Data Trends
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{xs:12,md:6}}>
                <Typography variant="subtitle2" gutterBottom>Temperature & Humidity</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#666" />
                    <YAxis stroke="#666" />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="temperature" stroke="#ff9800" strokeWidth={2} />
                    <Line type="monotone" dataKey="humidity" stroke="#2196f3" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={{xs:12,md:6}}>
                <Typography variant="subtitle2" gutterBottom>Supply Levels</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#666" />
                    <YAxis stroke="#666" />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="tonerLevel" stackId="1" stroke="#9c27b0" fill="#9c27b0" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="paperLevel" stackId="2" stroke="#4caf50" fill="#4caf50" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Alerts and Real-time Data */}
         <Grid size={{xs:12,lg:4}}>
          {/* Active Alerts */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Active Alerts
              </Typography>
              <Badge badgeContent={alerts.filter(a => !a.acknowledged).length} color="error">
                <Notifications />
              </Badge>
            </Box>
            <List sx={{ p: 0 }}>
              {alerts.slice(0, 5).map((alert) => (
                <ListItem
                  key={alert.id}
                  sx={{
                    px: 0,
                    py: 1,
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: alert.acknowledged ? 'transparent' : 'rgba(244, 67, 54, 0.05)',
                    border: alert.acknowledged ? 'none' : '1px solid rgba(244, 67, 54, 0.2)'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {alert.severity === 'HIGH' && <Error sx={{ color: '#f44336' }} />}
                    {alert.severity === 'MEDIUM' && <Warning sx={{ color: '#ff9800' }} />}
                    {alert.severity === 'LOW' && <Notifications sx={{ color: '#2196f3' }} />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: alert.acknowledged ? 'normal' : 'bold' }}>
                        {alert.message}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {alert.timestamp.toLocaleTimeString()}
                        </Typography>
                        <Chip
                          label={alert.severity}
                          size="small"
                          color={alert.severity === 'HIGH' ? 'error' : alert.severity === 'MEDIUM' ? 'warning' : 'default'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Real-time Data Stream */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Real-time Data Stream
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {realTimeData.slice(0, 10).map((data, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: 'rgba(102, 126, 234, 0.05)'
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Device {data.deviceId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {data.metric}: {data.value.toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {data.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Network Statistics */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Network Statistics
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Data Transferred</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {networkStatus.dataTransferred} GB
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={75}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#667eea',
                    borderRadius: 3
                  }
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Average Latency: {networkStatus.averageLatency} ms
              </Typography>
              <Typography variant="body2" gutterBottom>
                Packet Loss: {networkStatus.packetLoss}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Device Details Dialog */}
      <Dialog open={openDeviceDialog} onClose={() => setOpenDeviceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Device Details - {selectedDevice?.name}
        </DialogTitle>
        <DialogContent>
          {selectedDevice && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{xs:12,md:6}}>
                <Typography variant="h6" gutterBottom>Device Information</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Device ID</TableCell>
                        <TableCell>{selectedDevice.id}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>{selectedDevice.type}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>
                          <Chip
                            label={selectedDevice.status}
                            color={selectedDevice.status === 'ONLINE' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Firmware</TableCell>
                        <TableCell>{selectedDevice.firmware}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Last Seen</TableCell>
                        <TableCell>{selectedDevice.lastSeen?.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Data Points</TableCell>
                        <TableCell>{selectedDevice.dataPoints}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid size={{xs:12,md:6}}>
                <Typography variant="h6" gutterBottom>Sensor Status</Typography>
                <List>
                  {selectedDevice.sensors?.map((sensor: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Sensors />
                      </ListItemIcon>
                      <ListItemText
                        primary={sensor.charAt(0).toUpperCase() + sensor.slice(1)}
                        secondary="Active"
                      />
                      <ListItemSecondaryAction>
                        <Chip label="OK" color="success" size="small" />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeviceDialog(false)}>Close</Button>
          <Button variant="contained" onClick={() => handleConfigureDevice(selectedDevice)}>
            Configure
          </Button>
        </DialogActions>
      </Dialog>

      {/* Device Configuration Dialog */}
      <Dialog open={openConfigDialog} onClose={() => setOpenConfigDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Configure Device - {selectedDevice?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Device Name"
                 defaultValue={selectedDevice?.name}
              />
            </Grid>
              <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Sampling Rate (seconds)"
                type="number"
                defaultValue={30}
              />
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <FormControl fullWidth>
                <InputLabel>Power Mode</InputLabel>
                <Select defaultValue="normal">
                  <MenuItem value="low">Low Power</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High Performance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{xs:12}}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enable Real-time Monitoring"
              />
            </Grid>
            <Grid size={{xs:12}}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Send Alerts"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfigDialog(false)}>Cancel</Button>
          <Button variant="contained">Save Configuration</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IoTDashboard;