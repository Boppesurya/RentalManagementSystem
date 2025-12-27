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
  Alert,
  Card,
  CardContent,
  Slide,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Visibility,
  GetApp,
  Payment,
  Search,
  Receipt,
  Person,
  Business,
  AttachMoney,
  PictureAsPdf,
  Delete,
  AddCircle
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Invoice, type Machine, type User } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';

const InvoiceList: React.FC = () => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    rentalId: '',
    machineId: '',
    amount: '',
    dueDate: '',
    startingReading: '',
    closingReading: '',
    totalCopies: '',
    copyRatio: '',
    freeCopies: '0',
    billableCopies: '',
    classification: '',
    monthlyRent: ''
  });

  // Multi-machine invoice state
  const [isMultiMachine, setIsMultiMachine] = useState(false);
  const [machineItems, setMachineItems] = useState<Array<{
    machineId: string;
    startingReading: string;
    closingReading: string;
    totalCopies: string;
    freeCopies: string;
    billableCopies: string;
    copyRatio: string;
    monthlyRent: string;
    amount: string;
  }>>([]);

  useEffect(() => {
    loadInvoices();
    loadMachines();
    loadUsers();
  }, [user?.id]);

  const loadInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getInvoices();
      
      // Role-based filtering for invoices
      let filteredInvoices = data;
      
      if (user?.role === 'ADMIN') {
        // Admin can see all invoices
        filteredInvoices = data;
      } else if (user?.role === 'OWNER') {
        // Owner can only see invoices for their machines
        filteredInvoices = data.filter(i => 
          (i.owner?.id === user.id) || 
          (typeof i.owner === 'string' && i.owner === user.id) 
        );
        console.log('Owner filtered invoices:', filteredInvoices);
        console.log('Current owner ID:', user.id);
        console.log('All invoices from API:', data);
      } else if (user?.role === 'RENTAL') {
        // Rental can only see their own invoices
        filteredInvoices = data.filter(i => 
          (i.rental?.id === user.id) || 
          (typeof i.rental === 'string' && i.rental === user.id) 
        );
      }
      
      setInvoices(filteredInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
      setError('Failed to load invoices. Please check your connection and try again.');
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

  const handleOpenDialog = (invoice?: Invoice) => {
    if (invoice) {
      setSelectedInvoice(invoice);
      setFormData({
        rentalId: typeof invoice.rental === 'object' ? invoice.rental?.id || '' : invoice.rental || '',
        machineId: typeof invoice.machine === 'object' ? invoice.machine?.id || '' : invoice.machine || '',
        amount: invoice.amount.toString(),
        dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
        startingReading: invoice.startingReading?.toString() || '',
        closingReading: invoice.closingReading?.toString() || '',
        totalCopies: invoice.totalCopies?.toString() || '',
        copyRatio: invoice.copyRatio?.toString() || '',
        freeCopies: invoice.freeCopies?.toString() || '0',
        billableCopies: invoice.billableCopies?.toString() || '',
        classification: invoice.classification || '',
        monthlyRent: invoice.monthlyRent?.toString() || ''
      });
    } else {
      setSelectedInvoice(null);
      setFormData({
        rentalId: '',
        machineId: '',
        amount: '',
        dueDate: '',
        startingReading: '',
        closingReading: '',
        totalCopies: '',
        copyRatio: '',
        freeCopies: '0',
        billableCopies: '',
        classification: '',
        monthlyRent: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
    setError('');
    setIsMultiMachine(false);
    setMachineItems([]);
  };

  // Multi-machine functions
  const addMachineItem = () => {
    setMachineItems([...machineItems, {
      machineId: '',
      startingReading: '',
      closingReading: '',
      totalCopies: '',
      freeCopies: '0',
      billableCopies: '',
      copyRatio: '',
      monthlyRent: '',
      amount: ''
    }]);
  };

  const removeMachineItem = (index: number) => {
    setMachineItems(machineItems.filter((_, i) => i !== index));
  };

  const updateMachineItem = (index: number, field: string, value: string) => {
    const updatedItems = [...machineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Auto-calculate for this machine item
    if (field === 'closingReading' || field === 'startingReading') {
      const start = parseInt(updatedItems[index].startingReading) || 0;
      const closing = parseInt(updatedItems[index].closingReading) || 0;
      const totalCopies = closing > start ? closing - start : 0;
      updatedItems[index].totalCopies = totalCopies.toString();

      const freeCopies = parseInt(updatedItems[index].freeCopies) || 0;
      const billableCopies = Math.max(totalCopies - freeCopies, 0);
      updatedItems[index].billableCopies = billableCopies.toString();

      calculateMachineItemAmount(updatedItems[index]);
    } else if (field === 'freeCopies') {
      const totalCopies = parseInt(updatedItems[index].totalCopies) || 0;
      const freeCopies = parseInt(value) || 0;
      const billableCopies = Math.max(totalCopies - freeCopies, 0);
      updatedItems[index].billableCopies = billableCopies.toString();

      calculateMachineItemAmount(updatedItems[index]);
    } else if (field === 'copyRatio' || field === 'monthlyRent') {
      calculateMachineItemAmount(updatedItems[index]);
    } else if (field === 'machineId') {
      // Auto-populate machine details
      const selectedMachine = machines.find(m => m.id === value);
      if (selectedMachine) {
        updatedItems[index].monthlyRent = selectedMachine.monthlyRent?.toString() || '0';
        updatedItems[index].copyRatio = '0.50'; // Default copy ratio
        calculateMachineItemAmount(updatedItems[index]);
      }
    }

    setMachineItems(updatedItems);
  };

  const calculateMachineItemAmount = (item: any) => {
    const totalCopies = parseInt(item.totalCopies) || 0;
    const freeCopies = parseInt(item.freeCopies) || 0;
    const monthlyRent = parseFloat(item.monthlyRent) || 0;
    const copyRatio = parseFloat(item.copyRatio) || 0;
    const billableCopies = parseInt(item.billableCopies) || 0;

    // Apply free copies logic
    if (totalCopies <= freeCopies) {
      item.amount = monthlyRent.toString();
    } else {
      const copyCharges = billableCopies * copyRatio;
      item.amount = (monthlyRent + copyCharges).toString();
    }
  };

  const calculateMultiMachineTotal = () => {
    const subtotal = machineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const handleSubmit = async () => {
    setError('');
    try {
      let invoiceData: any = {
        rental: { id: formData.rentalId },
        owner: { id: user?.id! },
        status: 'pending' as Invoice['status'],
        dueDate: new Date(formData.dueDate)
      };

      // Multi-machine invoice
      if (isMultiMachine && machineItems.length > 0) {
        if (machineItems.some(item => !item.machineId)) {
          setError('Please select a machine for all items');
          return;
        }

        const items = machineItems.map(item => ({
          machineId: item.machineId,
          startingReading: item.startingReading ? parseInt(item.startingReading) : undefined,
          closingReading: item.closingReading ? parseInt(item.closingReading) : undefined,
          totalCopies: item.totalCopies ? parseInt(item.totalCopies) : undefined,
          freeCopies: item.freeCopies ? parseInt(item.freeCopies) : 0,
          billableCopies: item.billableCopies ? parseInt(item.billableCopies) : undefined,
          copyRatio: item.copyRatio ? parseFloat(item.copyRatio) : undefined,
          monthlyRent: item.monthlyRent ? parseFloat(item.monthlyRent) : undefined,
          amount: item.amount ? parseFloat(item.amount) : 0
        }));

        invoiceData.items = items;
        const totals = calculateMultiMachineTotal();
        invoiceData.amount = totals.subtotal;
      } else {
        // Single-machine invoice (legacy)
        invoiceData.machine = { id: formData.machineId };
        invoiceData.amount = parseFloat(formData.amount);
        invoiceData.startingReading = formData.startingReading ? parseInt(formData.startingReading) : undefined;
        invoiceData.closingReading = formData.closingReading ? parseInt(formData.closingReading) : undefined;
        invoiceData.totalCopies = formData.totalCopies ? parseInt(formData.totalCopies) : undefined;
        invoiceData.copyRatio = formData.copyRatio ? parseFloat(formData.copyRatio) : undefined;
        invoiceData.freeCopies = formData.freeCopies ? parseInt(formData.freeCopies) : 0;
        invoiceData.billableCopies = formData.billableCopies ? parseInt(formData.billableCopies) : undefined;
        invoiceData.classification = formData.classification || undefined;
        invoiceData.monthlyRent = formData.monthlyRent ? parseFloat(formData.monthlyRent) : undefined;
      }

      if (selectedInvoice) {
        await apiService.updateInvoice(selectedInvoice.id, invoiceData);
      } else {
        await apiService.createInvoice(invoiceData);
        
        // Create invoice notification for rental customer
        try {
          await createNotification({
            title: 'New Invoice Generated',
            message: `Invoice for ₹${(parseFloat(formData.amount) * 1.18).toLocaleString()} has been generated`,
            type: 'info',
            priority: 'medium'
          });
        } catch (notificationError) {
          console.error('Error creating invoice notification:', notificationError);
        }
        
        // Send notification email to rental customer
        try {
          const rental = users.find(u => u.id === formData.rentalId);
          if (rental) {
            await apiService.sendInvoiceNotification({
              to: rental.email,
              invoiceNumber: `INV-${Date.now()}`,
              amount: parseFloat(formData.amount)
            });
          }
        } catch (emailError) {
          console.error('Error sending invoice notification:', emailError);
        }
      }

      await loadInvoices();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving invoice:', error);
      setError('Failed to save invoice. Please try again.');
    }
  };

  const generatePDF = async (invoice: Invoice) => {
    try {
      const blob = await apiService.downloadInvoicePdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download PDF. Please try again.');
    }
  };

  const generateAllInvoicesPDF = async () => {
    setError('');
    try {
      // Download all invoices individually
      for (const invoice of filteredInvoices) {
        await generatePDF(invoice);
        // Add a small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error generating PDFs:', error);
      setError('Failed to generate all PDFs. Some files may not have been downloaded.');
    }
  };

  const markAsPaid = async (invoiceId: string, paymentMode: 'ONLINE' | 'OFFLINE' = 'ONLINE') => {
    try {
      await apiService.markInvoiceAsPaid(invoiceId, paymentMode);
      await loadInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
      setError('Failed to mark invoice as paid. Please try again.');
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof invoice.rental === 'object' && invoice.rental?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (typeof invoice.machine === 'object' && invoice.machine?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'OVERDUE': return 'error';
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

  const getMachineName = (machineId: string | { id: string; name?: string }) => {
    if (typeof machineId === 'object' && machineId !== null && 'id' in machineId) {
      const machine = machines.find(m => m.id === machineId.id);
      return machine ? machine.name : machineId.name || 'Unknown';
    }
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : 'Unknown';
  };

  const getInvoiceStats = () => {
    const totalInvoices = invoices.length;
    const paidCount = invoices.filter(i => i.status === 'PAID').length;
    const pendingCount = invoices.filter(i => i.status === 'PENDING').length;
    const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;
    const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0);

    return { totalInvoices, paidCount, pendingCount, overdueCount, totalRevenue };
  };

  const stats = getInvoiceStats();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {user?.role === 'ADMIN' ? 'All Invoices' : 
           user?.role === 'OWNER' ? 'My Generated Invoices' : 
           'My Invoices'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={generateAllInvoicesPDF}
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
              Generate Invoice
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
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <Slide direction="up" in timeout={1000}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                      {stats.totalInvoices}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Total Invoices
                    </Typography>
                  </Box>
                  <Receipt sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
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
                      {stats.paidCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Paid
                    </Typography>
                  </Box>
                  <Receipt sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
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
                      {stats.pendingCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Pending
                    </Typography>
                  </Box>
                  <Receipt sx={{ fontSize: 40, color: '#ff9800', opacity: 0.7 }} />
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
                      {stats.overdueCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Overdue
                    </Typography>
                  </Box>
                  <Receipt sx={{ fontSize: 40, color: '#f44336', opacity: 0.7 }} />
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
                      ₹{(stats.totalRevenue / 1000).toFixed(0)}K
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Total Revenue
                    </Typography>
                  </Box>
                  <AttachMoney sx={{ fontSize: 40, color: '#9c27b0', opacity: 0.7 }} />
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
            placeholder="Search invoices..."
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
                <TableCell sx={{ fontWeight: 'bold' }}>Invoice Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Rental Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Machine</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No invoices found matching your search.' : 
                       user?.role === 'OWNER' ? 'No invoices generated yet. Create your first invoice!' :
                       user?.role === 'RENTAL' ? 'No invoices received yet.' :
                       'No invoices found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Receipt sx={{ color: 'text.secondary' }} />
                        {invoice.invoiceNumber}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ color: 'text.secondary' }} />
                        {getEntityName(invoice.rental)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business sx={{ color: 'text.secondary' }} />
                        {getMachineName(invoice.machine)}
                      </Box>
                    </TableCell>
                    <TableCell>₹{invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                        ₹{invoice.totalAmount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status.toUpperCase()}
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(invoice)} color="primary" title="View Details">
                        <Visibility />
                      </IconButton>
                      <IconButton onClick={() => generatePDF(invoice)} color="info" title="Download PDF">
                        <GetApp />
                      </IconButton>
                      {user?.role === 'RENTAL' && invoice.status === 'PENDING' && (
                        <IconButton onClick={() => markAsPaid(invoice.id)} color="success">
                          <Payment />
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

      {/* Generate/View Invoice Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedInvoice ? 'View Invoice Details' : 'Generate New Invoice'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {!selectedInvoice && (
              <>
                <Grid size={{xs:12}}>
                  <FormControl fullWidth required>
                    <InputLabel>Rental Customer</InputLabel>
                    <Select
                      value={formData.rentalId}
                      onChange={(e) => setFormData({ ...formData, rentalId: e.target.value })}
                    >
                      {users
                        .filter(u => 
                          u.role === 'RENTAL' && 
                          (user?.role === 'ADMIN' || 
                           String(u.owner?.id === user?.id))
                        )
                        .map(u => (
                          <MenuItem key={u.id} value={u.id}>{u.name} - {u.email}</MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Multi-Machine Toggle */}
                <Grid size={{xs:12}}>
                  <Card variant="outlined" sx={{ backgroundColor: '#f9f9f9' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Invoice Type:
                        </Typography>
                        <Button
                          variant={!isMultiMachine ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => {
                            setIsMultiMachine(false);
                            setMachineItems([]);
                          }}
                        >
                          Single Machine
                        </Button>
                        <Button
                          variant={isMultiMachine ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => {
                            setIsMultiMachine(true);
                            if (machineItems.length === 0) {
                              addMachineItem();
                            }
                          }}
                        >
                          Multiple Machines
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Single Machine Form */}
                {!isMultiMachine && (
                  <Grid size={{xs:12}}>
                    <FormControl fullWidth required>
                      <InputLabel>Machine</InputLabel>
                      <Select
                        value={formData.machineId}
                        onChange={(e) => {
                          const selectedMachine = machines.find(m => m.id === e.target.value);
                          setFormData({
                            ...formData,
                            machineId: e.target.value,
                            amount: selectedMachine?.monthlyRent.toString() || '',
                            monthlyRent: selectedMachine?.monthlyRent.toString() || ''
                          });
                        }}
                      >
                        {machines
                          .filter(m =>
                            user?.role === 'ADMIN' ||
                           String( m.owner?.id === user?.id )
                          )
                          .map(m => (
                            <MenuItem key={m.id} value={m.id}>
                              {m.name} - {m.model} (₹{m.monthlyRent}/month)
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Multi-Machine Form */}
                {isMultiMachine && (
                  <Grid size={{xs:12}}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                      Machines
                    </Typography>
                    {machineItems.map((item, index) => (
                      <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid size={{xs:12}} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              Machine {index + 1}
                            </Typography>
                            {machineItems.length > 1 && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeMachineItem(index)}
                              >
                                <Delete />
                              </IconButton>
                            )}
                          </Grid>

                          <Grid size={{xs:12}}>
                            <FormControl fullWidth required>
                              <InputLabel>Select Machine</InputLabel>
                              <Select
                                value={item.machineId}
                                onChange={(e) => updateMachineItem(index, 'machineId', e.target.value)}
                              >
                                {machines
                                  .filter(m =>
                                    (user?.role === 'ADMIN' || m.owner?.id === user?.id.toString()) &&
                                    (!formData.rentalId || m.rental?.id === formData.rentalId) &&
                                    !machineItems.some((mi, i) => i !== index && mi.machineId === m.id)
                                  )
                                  .map(m => (
                                    <MenuItem key={m.id} value={m.id}>
                                      {m.name} - {m.model} (₹{m.monthlyRent}/month)
                                    </MenuItem>
                                  ))}
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid size={{xs:6, sm:4}}>
                            <TextField
                              fullWidth
                              label="Starting Reading"
                              type="number"
                              value={item.startingReading}
                              onChange={(e) => updateMachineItem(index, 'startingReading', e.target.value)}
                            />
                          </Grid>
                          <Grid size={{xs:6, sm:4}}>
                            <TextField
                              fullWidth
                              label="Closing Reading"
                              type="number"
                              value={item.closingReading}
                              onChange={(e) => updateMachineItem(index, 'closingReading', e.target.value)}
                            />
                          </Grid>
                          <Grid size={{xs:6, sm:4}}>
                            <TextField
                              fullWidth
                              label="Total Copies"
                              type="number"
                              value={item.totalCopies}
                              disabled
                              InputProps={{ readOnly: true }}
                            />
                          </Grid>

                          <Grid size={{xs:6, sm:4}}>
                            <TextField
                              fullWidth
                              label="Free Copies"
                              type="number"
                              value={item.freeCopies}
                              onChange={(e) => updateMachineItem(index, 'freeCopies', e.target.value)}
                            />
                          </Grid>
                          <Grid size={{xs:6, sm:4}}>
                            <TextField
                              fullWidth
                              label="Billable Copies"
                              type="number"
                              value={item.billableCopies}
                              disabled
                              InputProps={{ readOnly: true }}
                            />
                          </Grid>
                          <Grid size={{xs:6, sm:4}}>
                            <TextField
                              fullWidth
                              label="Copy Ratio (₹/copy)"
                              type="number"
                              value={item.copyRatio}
                              onChange={(e) => updateMachineItem(index, 'copyRatio', e.target.value)}
                              inputProps={{ step: '0.01' }}
                            />
                          </Grid>

                          <Grid size={{xs:6}}>
                            <TextField
                              fullWidth
                              label="Monthly Rent"
                              type="number"
                              value={item.monthlyRent}
                              onChange={(e) => updateMachineItem(index, 'monthlyRent', e.target.value)}
                            />
                          </Grid>
                          <Grid size={{xs:6}}>
                            <TextField
                              fullWidth
                              label="Amount"
                              type="number"
                              value={item.amount}
                              disabled
                              InputProps={{
                                readOnly: true,
                                startAdornment: <Typography>₹</Typography>
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  fontWeight: 'bold',
                                  color: '#4caf50'
                                }
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Card>
                    ))}

                    <Button
                      startIcon={<AddCircle />}
                      onClick={addMachineItem}
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Add Another Machine
                    </Button>

                    {/* Multi-Machine Total */}
                    {machineItems.length > 0 && (
                      <Card variant="outlined" sx={{ mt: 3, p: 2, backgroundColor: '#e8f5e9' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Invoice Summary
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Subtotal:</Typography>
                          <Typography>₹{calculateMultiMachineTotal().subtotal.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>GST (18%):</Typography>
                          <Typography>₹{calculateMultiMachineTotal().gst.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #4caf50', pt: 1 }}>
                          <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Total:</Typography>
                          <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#4caf50' }}>
                            ₹{calculateMultiMachineTotal().total.toLocaleString()}
                          </Typography>
                        </Box>
                      </Card>
                    )}
                  </Grid>
                )}

                {/* Due Date - Always shown */}
                <Grid size={{xs:12}} sm={isMultiMachine ? 12 : 6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>

                {/* Single-Machine Specific Fields */}
                {!isMultiMachine && (
                  <>
                    <Grid size={{xs:12, sm:6}}>
                      <TextField
                        fullWidth
                        label="Base Amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        helperText="GST (18%) will be calculated automatically"
                      />
                    </Grid>
                    <Grid size={{xs:12, sm:6}}>
                      <TextField
                        fullWidth
                        label="Classification"
                        value={formData.classification}
                        onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                        placeholder="e.g., Rental, Maintenance"
                      />
                    </Grid>
                    <Grid size={{xs:12, sm:6}}>
                      <TextField
                        fullWidth
                        label="Monthly Rent"
                        type="number"
                        value={formData.monthlyRent}
                        onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                        helperText="Base monthly rental amount"
                      />
                    </Grid>
                    <Grid size={{xs:12}}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                        Meter Readings (Optional - Add manually)
                      </Typography>
                    </Grid>
                    <Grid size={{xs:12, sm:6}}>
                      <TextField
                        fullWidth
                        label="Starting Reading"
                        type="number"
                        value={formData.startingReading}
                        onChange={(e) => {
                          const start = parseInt(e.target.value) || 0;
                          const closing = parseInt(formData.closingReading) || 0;
                          const total = closing > start ? closing - start : 0;
                          setFormData({
                            ...formData,
                            startingReading: e.target.value,
                            totalCopies: total > 0 ? total.toString() : ''
                          });
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12, sm:6}}>
                      <TextField
                        fullWidth
                        label="Closing Reading"
                        type="number"
                        value={formData.closingReading}
                        onChange={(e) => {
                          const closing = parseInt(e.target.value) || 0;
                          const start = parseInt(formData.startingReading) || 0;
                          const total = closing > start ? closing - start : 0;
                          setFormData({
                            ...formData,
                            closingReading: e.target.value,
                            totalCopies: total > 0 ? total.toString() : ''
                          });
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12, sm:6}}>
                      <TextField
                        fullWidth
                        label="Total Copies"
                        type="number"
                        value={formData.totalCopies}
                        onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value })}
                        disabled
                        helperText="Auto-calculated"
                      />
                    </Grid>
                    <Grid size={{xs:12, sm:6}}>
                      <TextField
                        fullWidth
                        label="Free Copies"
                        type="number"
                        value={formData.freeCopies}
                        onChange={(e) => {
                          const free = parseInt(e.target.value) || 0;
                          const total = parseInt(formData.totalCopies) || 0;
                          const billable = Math.max(total - free, 0);
                          setFormData({
                            ...formData,
                            freeCopies: e.target.value,
                            billableCopies: billable.toString()
                          });
                        }}
                      />
                    </Grid>
                    <Grid size={{xs:12, sm:4}}>
                      <TextField
                        fullWidth
                        label="Copy Ratio (₹/copy)"
                        type="number"
                        value={formData.copyRatio}
                        onChange={(e) => setFormData({ ...formData, copyRatio: e.target.value })}
                        inputProps={{ step: '0.01' }}
                      />
                    </Grid>
                  </>
                )}
              </>
            )}
            
            {selectedInvoice && (
              <>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    value={selectedInvoice.invoiceNumber}
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Status"
                    value={selectedInvoice.status.toUpperCase()}
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Rental Customer"
                    value={getEntityName(selectedInvoice.rental)}
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Machine"
                    value={getMachineName(selectedInvoice.machine)}
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12, sm:4}}>
                  <TextField
                    fullWidth
                    label="Base Amount"
                    value={`₹${selectedInvoice.amount.toLocaleString()}`}
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12, sm:4}}>
                  <TextField
                    fullWidth
                    label="GST Amount (18%)"
                    value={`₹${selectedInvoice.gstAmount.toLocaleString()}`}
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12, sm:4}}>
                  <TextField
                    fullWidth
                    label="Total Amount"
                    value={`₹${selectedInvoice.totalAmount.toLocaleString()}`}
                    disabled
                    sx={{
                      '& .MuiInputBase-input': {
                        fontWeight: 'bold',
                        color: '#4caf50'
                      }
                    }}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    value={new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    disabled
                  />
                </Grid>
                {selectedInvoice.paidDate && (
                  <Grid size={{xs:12, sm:6}}>
                    <TextField
                      fullWidth
                      label="Paid Date"
                      value={new Date(selectedInvoice.paidDate).toLocaleDateString()}
                      disabled
                    />
                  </Grid>
                )}
                {selectedInvoice.classification && (
                  <Grid size={{xs:12, sm:6}}>
                    <TextField
                      fullWidth
                      label="Classification"
                      value={selectedInvoice.classification}
                      disabled
                    />
                  </Grid>
                )}
                {selectedInvoice.monthlyRent && (
                  <Grid size={{xs:12, sm:6}}>
                    <TextField
                      fullWidth
                      label="Monthly Rent"
                      value={`₹${selectedInvoice.monthlyRent.toLocaleString()}`}
                      disabled
                    />
                  </Grid>
                )}
                {(selectedInvoice.startingReading || selectedInvoice.totalCopies) && (
                  <>
                    <Grid size={{xs:12}}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Meter Readings
                      </Typography>
                    </Grid>
                    {selectedInvoice.startingReading !== undefined && (
                      <Grid size={{xs:12, sm:3}}>
                        <TextField
                          fullWidth
                          label="Starting Reading"
                          value={selectedInvoice.startingReading.toLocaleString()}
                          disabled
                        />
                      </Grid>
                    )}
                    {selectedInvoice.closingReading !== undefined && (
                      <Grid size={{xs:12, sm:3}}>
                        <TextField
                          fullWidth
                          label="Closing Reading"
                          value={selectedInvoice.closingReading.toLocaleString()}
                          disabled
                        />
                      </Grid>
                    )}
                    {selectedInvoice.totalCopies !== undefined && (
                      <Grid size={{xs:12, sm:3}}>
                        <TextField
                          fullWidth
                          label="Total Copies"
                          value={selectedInvoice.totalCopies.toLocaleString()}
                          disabled
                        />
                      </Grid>
                    )}
                    {selectedInvoice.billableCopies !== undefined && (
                      <Grid size={{xs:12, sm:3}}>
                        <TextField
                          fullWidth
                          label="Billable Copies"
                          value={selectedInvoice.billableCopies.toLocaleString()}
                          disabled
                        />
                      </Grid>
                    )}
                  </>
                )}
              </>
            )}
            
            {!selectedInvoice && formData.amount && (
              <Grid size={{xs:12}}>
                <Alert severity="info">
                  <Typography>
                    <strong>Amount Breakdown:</strong>
                  </Typography>
                  <Typography>Base Amount: ₹{parseFloat(formData.amount || '0').toLocaleString()}</Typography>
                  <Typography>GST (18%): ₹{(parseFloat(formData.amount || '0') * 0.18).toLocaleString()}</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    Total Amount: ₹{(parseFloat(formData.amount || '0') * 1.18).toLocaleString()}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {selectedInvoice ? 'Close' : 'Cancel'}
          </Button>
          {!selectedInvoice && (
            <Button onClick={handleSubmit} variant="contained" disabled={loading}>
              Generate Invoice
            </Button>
          )}
          {selectedInvoice && (
            <Button onClick={() => generatePDF(selectedInvoice)} variant="outlined" startIcon={<GetApp />}>
              Download PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceList;