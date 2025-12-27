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
  Slide,
  Fade
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Business,
  Engineering,
  TrendingUp,
 
  PictureAsPdf
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Machine, type User } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SmartInventory: React.FC = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serialNumber: '',
    location: '',
    monthlyRent: '',
    ownerId: '',
    rentalId: '',
    status: 'AVAILABLE' as Machine['status'],
    installationDate: '',
    lastServiceDate: '',
    usage: ''
  });

  useEffect(() => {
    loadMachines();
    loadUsers();
  }, [user?.id]);
       
  const loadMachines = async () => {
    setError('');
    try {
      const data = await apiService.getMachines();
      
      // Role-based filtering for machines
      let filteredMachines = data;
      
      if (user?.role === 'ADMIN') {
        // Admin can see all machines
        filteredMachines = data;
      } else if (user?.role === 'OWNER') {
        // Owner can only see their own machines
        filteredMachines = data.filter(m => m.owner?.id === user.id);
      } else if (user?.role === 'RENTAL') {
        // Rental can only see machines they are renting
        filteredMachines = data.filter(m => m.rental?.id === user.id);
      }
      
      setMachines(filteredMachines);
    } catch (error) {
      console.error('Error loading machines:', error);
      setMachines([]);
      setError('Failed to load machines. Please check your connection and try again.');
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

  const handleOpenDialog = (machine?: Machine) => {
    if (machine) {
      setSelectedMachine(machine);
      setFormData({
        
        name: machine.name,
        model: machine.model,
        serialNumber: machine.serialNumber,
        location: machine.location,
        monthlyRent: machine.monthlyRent.toString(),
        ownerId: machine.owner?.id || '',
        rentalId: machine.rental?.id || '',
        status: machine.status,
        usage: machine.usage?.toString() || '0',
        installationDate: machine.installationDate ? new Date(machine.installationDate).toISOString().split('T')[0] : '',
        lastServiceDate: machine.lastServiceDate ? new Date(machine.lastServiceDate).toISOString().split('T')[0] : ''
      });
    } else {
      setSelectedMachine(null);
      setFormData({
        name: '',
        model: '',
        serialNumber: '',
        location: '',
        monthlyRent: '',
        ownerId: user?.role === 'OWNER' ? user.id : '',
        rentalId: '',
        status: 'AVAILABLE',
        installationDate: '',
        lastServiceDate: '',
        usage: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMachine(null);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const machineData = {
        name: formData.name,
        model: formData.model,
        serialNumber: formData.serialNumber,
        location: formData.location,
        monthlyRent: parseFloat(formData.monthlyRent),
        owner: { id: formData.ownerId },
        rental: formData.rentalId ? { id: formData.rentalId } : undefined,
        status: formData.status,
        installationDate: formData.installationDate ? new Date(formData.installationDate) : undefined,
        lastServiceDate: formData.lastServiceDate ? new Date(formData.lastServiceDate) :undefined,
        usage: parseInt(formData.usage),
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
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      try {
        await apiService.deleteMachine(id);
        await loadMachines();
      } catch (error) {
        console.error('Error deleting machine:', error);
        setError('Failed to delete machine. Please try again.');
      }
    }
  };


  const generateMachinesPDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;

    // Validate user object
    const userName = user?.name || 'Unknown User';
    const userRole = user?.role ? user.role.toUpperCase() : 'UNKNOWN';

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MACHINES INVENTORY REPORT', 105, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated by: ${userName} (${userRole})`, 20, yPosition);
    yPosition += 8;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;

    // Validate machines array
    const validMachines = Array.isArray(machines) ? machines : [];
    if (validMachines.length === 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('No machines data available.', 20, yPosition);
        console.warn('No machines data provided. Generating PDF with empty table.');
    } else {
        // Summary
        doc.setFont('helvetica', 'bold');
        doc.text('INVENTORY SUMMARY:', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Machines: ${validMachines.length}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Available: ${validMachines.filter(m => m.status === 'AVAILABLE').length}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Rented: ${validMachines.filter(m => m.status === 'RENTED').length}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Under Maintenance: ${validMachines.filter(m => m.status === 'MAINTENANCE').length}`, 20, yPosition);
        yPosition += 15;

        // Table configuration
        const tableData = validMachines.map((machine, index) => {
            // Validate machine properties
            const safeMachine = machine || {};
            return [
                index + 1,
                safeMachine.name || 'N/A',
                safeMachine.model || 'N/A',
                safeMachine.serialNumber || 'N/A',
                safeMachine.location || 'N/A',
                safeMachine.status || 'N/A',
                safeMachine.monthlyRent != null ? `₹${safeMachine.monthlyRent}` : 'N/A',
                safeMachine.usage != null ? `${safeMachine.usage} pages` : 'N/A',
                safeMachine.installationDate
                    ? new Date(safeMachine.installationDate).toLocaleDateString()
                    : '-',
                safeMachine.lastServiceDate
                    ? new Date(safeMachine.lastServiceDate).toLocaleDateString()
                    : '-'
            ];
        });

        const tableHeaders = [
            '#',
            'Name',
            'Model',
            'Serial',
            'Location',
            'Status',
            'Monthly Rent',
            'Usage',
           
        ];

        // Log table data for debugging
        console.log('Table Data:', tableData);

        // Generate table using jsPDF-AutoTable
        autoTable(doc, {
            startY: yPosition,
            head: [tableHeaders],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [41, 128, 185], // Blue header background
                textColor: 255, // White text
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 10,
                cellPadding: 3,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 10 }, // # column
                1: { cellWidth: 30 }, // Name column
                2: { cellWidth: 25 }, // Model column
                3: { cellWidth: 25 }, // Serial column
                4: { cellWidth: 25 }, // Location column
                5: { cellWidth: 25 }, // Status column
                6: { cellWidth: 20 }, // Monthly Rent column
                7: { cellWidth: 20 }, // Usage column

            },
            margin: { top: 10, left: 20, right: 20 }
        });
    }

    const fileName = `${userRole.toLowerCase()}-machines-inventory-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
  
  

  const filteredMachines = machines.filter(machine =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Machine['status']) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'RENTED': return 'primary';
      case 'MAINTENANCE': return 'warning';
      default: return 'default';
    }
  };

  const getMachineStats = () => {
    const totalMachines = machines.length;
    const availableCount = machines.filter(m => m.status === 'AVAILABLE').length;
    const rentedCount = machines.filter(m => m.status === 'RENTED').length;
    const maintenanceCount = machines.filter(m => m.status === 'MAINTENANCE').length;
    const totalRevenue = machines.reduce((sum, m) => sum + m.monthlyRent, 0);

    return { totalMachines, availableCount, rentedCount, maintenanceCount, totalRevenue };
  };

  const stats = getMachineStats();

  const canAddMachine = () => {
    return user?.role === 'ADMIN' || user?.role === 'OWNER';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {user?.role === 'ADMIN' ? 'Smart Inventory Management' : 
           user?.role === 'OWNER' ? 'My Machine Inventory' : 
           'My Rented Machines'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={generateMachinesPDF}
            sx={{ borderRadius: 2 }}
          >
            Download PDF
          </Button>
          {canAddMachine() && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Add Machine
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{xs:12,sm:6,md:3}}>
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
                  <Business sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        <Grid size={{xs:12,sm:6,md:3}}>
          <Slide direction="up" in timeout={1200}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {stats.availableCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Available
                    </Typography>
                  </Box>
                  <Engineering sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        <Grid size={{xs:12,sm:6,md:3}}>
          <Slide direction="up" in timeout={1400}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      {stats.rentedCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Rented
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, color: '#2196f3', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        <Grid size={{xs:12,sm:6,md:3}}>
          <Slide direction="up" in timeout={1600}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                      ₹{(stats.totalRevenue / 1000).toFixed(0)}K
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Total Value
                    </Typography>
                  </Box>
                  <Business sx={{ fontSize: 40, color: '#ff9800', opacity: 0.7 }} />
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
            placeholder="Search machines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Paper>
      </Fade>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Model</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Serial Number</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Monthly Rent</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Usage</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMachines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm ? 'No machines found matching your search.' : 
                     user?.role === 'OWNER' ? 'No machines in your inventory yet. Add your first machine!' :
                     user?.role === 'RENTAL' ? 'No machines rented yet.' :
                     'No machines found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredMachines.map((machine) => (
                <TableRow key={machine.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Business sx={{ color: 'text.secondary' }} />
                      {machine.name}
                    </Box>
                  </TableCell>
                  <TableCell>{machine.model}</TableCell>
                  <TableCell>{machine.serialNumber}</TableCell>
                  <TableCell>{machine.location}</TableCell>
                  <TableCell>
                    <Chip
                      label={machine.status}
                      color={getStatusColor(machine.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>₹{machine.monthlyRent}</TableCell>
                  <TableCell>{machine.usage} pages</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(machine)} color="primary">
                      <Edit />
                    </IconButton>
                    {canAddMachine() && (
                      <IconButton onClick={() => handleDelete(machine.id)} color="error">
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

      {/* Add/Edit Machine Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMachine ? 'Edit Machine' : 'Add New Machine'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Machine Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Serial Number"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Monthly Rent"
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Usage"
                type="number"
                value={formData.usage}
                onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{xs:12,sm:6}}>
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
            
            {user?.role === 'ADMIN' && (
              <Grid size={{xs:12,sm:6}}>
                <FormControl fullWidth>
                  <InputLabel>Owner</InputLabel>
                  <Select
                    value={formData.ownerId.toString()}
                    onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  >
                    {users.filter(u => u.role === 'OWNER').map(u => (
                      <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {formData.status === 'RENTED' && (
              <Grid size={{xs:12,sm:6}}>
                <FormControl fullWidth>
                  <InputLabel>Rental Customer</InputLabel>
                  <Select
                    value={formData.rentalId}
                    onChange={(e) => setFormData({ ...formData, rentalId: e.target.value })}
                  >
                    {users.filter(u => u.role === 'RENTAL' && (user?.role === 'ADMIN' || u.owner?.id === String(user?.id))).map(u => (
                      <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                    ))}
                  
                  </Select>
                </FormControl>
              </Grid>
            )}
          
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Installation Date"
                type="date"
                value={formData.installationDate}
                onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Last Service Date"
                type="date"
                value={formData.lastServiceDate}
                onChange={(e) => setFormData({ ...formData, lastServiceDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedMachine ? 'Update' : 'Create'} Machine
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartInventory;