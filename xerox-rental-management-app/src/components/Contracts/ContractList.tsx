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
  Alert
} from '@mui/material';
import {
  Add,
  Visibility,
  GetApp,
  Search,
  PictureAsPdf
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Contract, type Machine, type User } from '../../types';
import jsPDF from 'jspdf';

const ContractList: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    rentalId: '',
    machineId: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    terms: ''
  });

  useEffect(() => {
    loadContracts();
    loadMachines();
    loadUsers();
  }, [user?.id]);

  const loadContracts = async () => {
    setError('');
    try {
      const data = await apiService.getContracts();
      
      // Role-based filtering for contracts
      let filteredContracts = data;
      
      if (user?.role === 'ADMIN') {
        // Admin can see all contracts
        filteredContracts = data;
      } else if (user?.role === 'OWNER') {
        // Owner can only see contracts for their machines
        filteredContracts = data.filter(c => c.owner?.id === user.id);
      } else if (user?.role === 'RENTAL') {
        // Rental can only see their own contracts
        filteredContracts = data.filter(c => c.rental?.id === user.id);
      }
      
      setContracts(filteredContracts);
    } catch (error) {
      console.error('Error loading contracts:', error);
      setContracts([]);
      setError('Failed to load contracts. Please check your connection and try again.');
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

  const handleOpenDialog = (contract?: Contract) => {
    if (contract) {
      setSelectedContract(contract);
      setFormData({
        rentalId: typeof contract.rental === 'object' ? contract.rental?.id || '' : contract.rental || '',
        machineId: typeof contract.machine === 'object' ? contract.machine?.id || '' : contract.machine || '',
        startDate: new Date(contract.startDate).toISOString().split('T')[0],
        endDate: new Date(contract.endDate).toISOString().split('T')[0],
        monthlyRent: contract.monthlyRent.toString(),
        terms: contract.terms || ''
      });
    } else {
      setSelectedContract(null);
      setFormData({
        rentalId: '',
        machineId: '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
        terms: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedContract(null);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const contractData = {
        rental: { id: formData.rentalId ,name: formData.rentalId},
        owner: { id: user?.id! },
        machine: { id: formData.machineId ,name: formData.machineId},
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        monthlyRent: parseFloat(formData.monthlyRent),
        terms: formData.terms,
        status: 'ACTIVE' as Contract['status']
      };

      if (selectedContract) {
        await apiService.updateContract(selectedContract.id, contractData);
      } else {
        await apiService.createContract(contractData);
      }

      await loadContracts();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving contract:', error);
      setError('Failed to save contract. Please try again.');
    }
  };

  const generateContractPDF = (contract: Contract) => {
    const doc = new jsPDF();
  
    // 🔹 Helper function to safely resolve entities
    const getEntity = (entity: any, list: any[]) => {
      if (!entity) return null;
      if (typeof entity === "object") return entity;
      return list.find((e) => String(e.id) === String(entity)) || null;
    };
  
    const machine = getEntity(contract.machine, machines);
    const rental = getEntity(contract.rental, users);
    const owner = getEntity(contract.owner, users);
  
    // 🔹 Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("RENTAL CONTRACT", 105, 20, { align: "center" });
  
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
  
    // 🔹 Contract details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Contract ID: ${contract.id}`, 20, 40);
    doc.text(`Start Date: ${new Date(contract.startDate).toLocaleDateString()}`, 20, 50);
    doc.text(`End Date: ${new Date(contract.endDate).toLocaleDateString()}`, 20, 60);
    doc.text(`Status: ${contract.status.toUpperCase()}`, 20, 70);
  
    // 🔹 OWNER DETAILS
    doc.setFont("helvetica", "bold");
    doc.text("OWNER DETAILS:", 20, 90);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${owner?.name || contract.owner?.name || "Unknown"}`, 20, 100);
    doc.text(`Email: ${owner?.email || "N/A"}`, 20, 110);
    doc.text(`Contact: ${owner?.contactNumber || "N/A"}`, 20, 120);
    const ownerAddress = doc.splitTextToSize(`Address: ${owner?.address || "N/A"}`, 80);
    doc.text(ownerAddress, 20, 130);
    doc.text(`GST: ${owner?.gstNumber || "N/A"}`, 20, 140);
  
    // 🔹 RENTAL DETAILS
    doc.setFont("helvetica", "bold");
    doc.text("RENTAL DETAILS:", 120, 90);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${rental?.name || contract.rental?.name || "Unknown"}`, 120, 100);
    doc.text(`Email: ${rental?.email || "N/A"}`, 120, 110);
    doc.text(`Contact: ${rental?.contactNumber || "N/A"}`, 120, 120);
    const rentalAddress = doc.splitTextToSize(`Address: ${rental?.address || "N/A"}`, 80);
    doc.text(rentalAddress, 120, 130);
    doc.text(`GST: ${rental?.gstNumber || "N/A"}`, 120, 140);
  
    // 🔹 MACHINE DETAILS
    doc.setFont("helvetica", "bold");
    doc.text("MACHINE DETAILS:", 20, 160);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${machine?.name || contract.machine?.name || "Unknown"}`, 20, 170);
    doc.text(`Model: ${machine?.model || "Unknown"}`, 20, 180);
    doc.text(`Serial Number: ${machine?.serialNumber || "Unknown"}`, 20, 190);
    doc.text(`Location: ${machine?.location || "Unknown"}`, 20, 200);
  
    // 🔹 FINANCIAL DETAILS
    doc.setFont("helvetica", "bold");
    doc.text("FINANCIAL TERMS:", 20, 220);
    doc.setFont("helvetica", "normal");
    doc.text(`Monthly Rent: ₹${contract.monthlyRent}`, 20, 230);
    doc.text(`GST (18%): ₹${(contract.monthlyRent * 0.18).toFixed(2)}`, 20, 240);
    doc.text(`Total Monthly: ₹${(contract.monthlyRent * 1.18).toFixed(2)}`, 20, 250);
  
    // 🔹 TERMS & CONDITIONS
    if (contract.terms) {
      doc.setFont("helvetica", "bold");
      doc.text("TERMS & CONDITIONS:", 20, 270);
      doc.setFont("helvetica", "normal");
      const termsText = doc.splitTextToSize(contract.terms, 170);
      doc.text(termsText, 20, 280);
    }
  
    // 🔹 Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("This is a system-generated contract document.", 105, 290, { align: "center" });
  
    doc.save(`contract-${contract.id}.pdf`);
  };
  

  const generateAllContractsPDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ALL CONTRACTS REPORT', 105, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated by: ${user?.name.toString()} (${user?.role?.toUpperCase()})`, 20, yPosition);
    yPosition += 8;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;

    // Summary
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY:', 20, yPosition);
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Contracts: ${contracts.length}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Active Contracts: ${contracts.filter(c => c.status === 'ACTIVE').length}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Total Monthly Revenue: ₹${contracts.reduce((sum, c) => sum + c.monthlyRent, 0).toLocaleString()}`, 20, yPosition);
    yPosition += 15;

    // Contracts list
    contracts.forEach((contract, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. Contract ${contract.id}`, 20, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Monthly Rent: ₹${contract.monthlyRent} | Status: ${contract.status}`, 25, yPosition);
      yPosition += 6;
      doc.text(`Period: ${new Date(contract.startDate).toLocaleDateString()} - ${new Date(contract.endDate).toLocaleDateString()}`, 25, yPosition);
      yPosition += 10;
    });

    const fileName = `${user?.role}-all-contracts-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const filteredContracts = contracts.filter(contract =>
    contract.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'EXPIRED': return 'warning';
      case 'TERMINATED': return 'error';
      default: return 'default';
    }
  };

  const getUserName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : 'Unknown';
  };

  const getEntityName = (entity: any) => {
    if (typeof entity === 'string') {
      return getUserName(entity);
    }
    return entity?.name || getUserName(entity?.id) || 'Unknown';
  };

  const getMachineName = (machineId: string) => {
    if (typeof machineId === 'object' && machineId !== null && 'id' in machineId) {
      const machine = machines.find(m => m.id === machineId.id);
      return machine ? machine.name : machineId.name || 'Unknown';
    }
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : 'Unknown';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Contract Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={generateAllContractsPDF}
            sx={{ borderRadius: 2 }}
          >
            Download All PDF
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
              Create Contract
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Search contracts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Contract ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Rental</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Machine</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Monthly Rent</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm ? 'No contracts found matching your search.' : 'No contracts found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => (
                <TableRow key={contract.id} hover>
                  <TableCell>{contract.id}</TableCell>
                  <TableCell>{getEntityName(contract.rental)}</TableCell>
                  <TableCell>{getMachineName(contract.machine.id)}</TableCell>
                  <TableCell>₹{contract.monthlyRent}</TableCell>
                  <TableCell>
                    <Chip
                      label={contract.status}
                      color={getStatusColor(contract.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(contract.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(contract.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(contract)} color="primary">
                      <Visibility />
                    </IconButton>
                    <IconButton onClick={() => generateContractPDF(contract)} color="success">
                      <GetApp />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Contract Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedContract ? 'View/Edit Contract' : 'Create New Contract'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12, sm:6}}>
              <FormControl fullWidth>
                <InputLabel>Rental Customer</InputLabel>
                <Select
                  value={formData.rentalId}
                  onChange={(e) => setFormData({ ...formData, rentalId: e.target.value })}
                  disabled={selectedContract !== null}
                >
                  {users.filter(u => u.role === 'RENTAL' && (user?.role === 'ADMIN' || String(u.owner?.id === user?.id))).map(u => (
                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{xs:12, sm:6}}>
              <FormControl fullWidth>
                <InputLabel>Machine</InputLabel>
                <Select
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  disabled={selectedContract !== null}
                >
                  {machines.filter(m => user?.role === 'ADMIN' || m.owner?.id === user?.id).map(m => (
                    <MenuItem key={m.id} value={m.id.toString()}>{m.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{xs:12, sm:6}}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={selectedContract !== null}
              />
            </Grid>
            <Grid size={{xs:12, sm:6}}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Monthly Rent"
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Terms and Conditions"
                multiline
                rows={4}
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Enter contract terms and conditions..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {selectedContract ? 'Close' : 'Cancel'}
          </Button>
          {(!selectedContract || user?.role === 'ADMIN' || user?.role === 'OWNER') && (
            <Button onClick={handleSubmit} variant="contained">
              {selectedContract ? 'Update' : 'Create'} Contract
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractList;