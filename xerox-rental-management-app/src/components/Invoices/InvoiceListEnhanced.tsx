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
  Alert
} from '@mui/material';
import {
  Add,
  Download,
  Visibility,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Invoice, type Machine, type User } from '../../types';
import jsPDF from 'jspdf';

const InvoiceListEnhanced: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    rentalId: '',
    machineId: '',
    startingReading: 0,
    closingReading: 0,
    copyRatio: 1.0,
    freeCopies: 0,
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadInvoices();
    loadMachines();
    loadUsers();
    if ( user?.role === 'OWNER') {
      loadCompanySettings();
    }
  }, [user]);

  const loadInvoices = async () => {
    try {
      const data = await apiService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
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

  const loadCompanySettings = async () => {
    try {
      const settings = await apiService.getCompanySettings(user?.id || '');
      setCompanySettings(settings);
      if (settings) {
        setFormData(prev => ({
          ...prev,
          copyRatio: settings.defaultCopyRatio || 1.0,
          freeCopies: settings.defaultFreeCopies || 0
        }));
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  };

  const handleOpenDialog = async () => {
    setFormData({
      rentalId: '',
      machineId: '',
      startingReading: 0,
      closingReading: 0,
      copyRatio: companySettings?.defaultCopyRatio || 1.0,
      freeCopies: companySettings?.defaultFreeCopies || 0,
      dueDate: new Date().toISOString().split('T')[0]
    });
    setOpenDialog(true);
  };

  const handleMachineChange = async (machineId: string) => {
    setFormData({ ...formData, machineId });

    if (machineId && user?.id) {
      try {
        const lastReading = await apiService.getLastClosingReading(machineId, user.id);
        setFormData(prev => ({ ...prev, startingReading: lastReading }));
      } catch (error) {
        console.error('Error fetching last reading:', error);
      }
    }
  };

  const calculateAmount = () => {
    const totalCopies = formData.closingReading - formData.startingReading;
    const billableCopies = Math.max(totalCopies - formData.freeCopies, 0);
    return billableCopies * formData.copyRatio;
  };

  const handleSubmit = async () => {
    if (!formData.rentalId || !formData.machineId) {
      setError('Please select rental and machine');
      return;
    }

    if (formData.closingReading <= formData.startingReading) {
      setError('Closing reading must be greater than starting reading');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const amount = calculateAmount();

      await apiService.createInvoice({
        rentalId: formData.rentalId,
        ownerId: user?.id,
        machineId: formData.machineId,
        amount,
        startingReading: formData.startingReading,
        closingReading: formData.closingReading,
        copyRatio: formData.copyRatio,
        freeCopies: formData.freeCopies,
        dueDate: new Date(formData.dueDate)
      });

      await loadInvoices();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    if (invoice.companyLogoUrl && companySettings?.companyLogoUrl) {
      doc.addImage(companySettings.companyLogoUrl, 'PNG', 15, 10, 30, 30);
    }

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(companySettings?.companyName || 'Company Name', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (companySettings?.address) {
      doc.text(companySettings.address, pageWidth / 2, 32, { align: 'center' });
    }
    if (companySettings?.phone) {
      doc.text(`Phone: ${companySettings.phone}`, pageWidth / 2, 37, { align: 'center' });
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, 55, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 15, 70);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 15, 77);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 15, 84);

    doc.text('Bill To:', 15, 100);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.rental?.name || 'Customer', 15, 107);
    doc.setFont('helvetica', 'normal');

    const startY = 125;
    doc.setFillColor(240, 240, 240);
    doc.rect(15, startY, pageWidth - 30, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, startY + 7);
    doc.text('Amount', pageWidth - 50, startY + 7);

    doc.setFont('helvetica', 'normal');
    let currentY = startY + 17;

    doc.text(`Machine: ${invoice.machine?.name || 'N/A'}`, 20, currentY);
    currentY += 7;

    if (invoice.startingReading !== undefined && invoice.closingReading !== undefined) {
      doc.text(`Starting Reading: ${invoice.startingReading}`, 20, currentY);
      currentY += 7;
      doc.text(`Closing Reading: ${invoice.closingReading}`, 20, currentY);
      currentY += 7;
      doc.text(`Total Copies: ${invoice.totalCopies || 0}`, 20, currentY);
      currentY += 7;
      doc.text(`Free Copies: ${invoice.freeCopies || 0}`, 20, currentY);
      currentY += 7;
      doc.text(`Billable Copies: ${invoice.billableCopies || 0}`, 20, currentY);
      currentY += 7;
      doc.text(`Copy Ratio: ₹${invoice.copyRatio || 0}`, 20, currentY);
      currentY += 10;
    }

    currentY += 5;
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 10;

    doc.text('Subtotal:', 120, currentY);
    doc.text(`₹${invoice.amount.toFixed(2)}`, pageWidth - 50, currentY, { align: 'right' });
    currentY += 7;

    doc.text('GST (18%):', 120, currentY);
    doc.text(`₹${invoice.gstAmount.toFixed(2)}`, pageWidth - 50, currentY, { align: 'right' });
    currentY += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 120, currentY);
    doc.text(`₹${invoice.totalAmount.toFixed(2)}`, pageWidth - 50, currentY, { align: 'right' });

    if (invoice.signatureImageUrl && companySettings?.signatureImageUrl) {
      doc.addImage(companySettings.signatureImageUrl, 'PNG', 15, 240, 40, 20);
      doc.text('Authorized Signatory', 15, 265);
    }

    if (invoice.stampImageUrl && companySettings?.stampImageUrl) {
      doc.addImage(companySettings.stampImageUrl, 'PNG', pageWidth - 55, 240, 40, 20);
    }

    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'OVERDUE': return 'error';
      default: return 'default';
    }
  };

  const totalCopies = formData.closingReading - formData.startingReading;
  const billableCopies = Math.max(totalCopies - formData.freeCopies, 0);
  const estimatedAmount = billableCopies * formData.copyRatio;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Invoices
        </Typography>
        {(user?.role === 'owner' || user?.role === 'OWNER') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Generate Invoice
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                {invoices.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                {invoices.filter(i => i.status === 'PENDING').length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                {invoices.filter(i => i.status === 'PAID').length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                ₹{invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Machine</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Copies</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No invoices generated yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.rental?.name}</TableCell>
                  <TableCell>{invoice.machine?.name}</TableCell>
                  <TableCell>
                    {invoice.billableCopies !== undefined
                      ? `${invoice.billableCopies} (${invoice.totalCopies} total)`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>₹{invoice.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => generatePDF(invoice)}
                      color="primary"
                    >
                      <Download />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Invoice</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Customer</InputLabel>
                <Select
                  value={formData.rentalId}
                  onChange={(e) => setFormData({ ...formData, rentalId: e.target.value })}
                  label="Select Customer"
                >
                  {users.filter(u => u.role === 'RENTAL').map((rental) => (
                    <MenuItem key={rental.id} value={rental.id}>
                      {rental.name} - {rental.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Machine</InputLabel>
                <Select
                  value={formData.machineId}
                  onChange={(e) => handleMachineChange(e.target.value)}
                  label="Select Machine"
                >
                  {machines.map((machine) => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.name} - {machine.serialNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Starting Reading"
                type="number"
                value={formData.startingReading}
                onChange={(e) => setFormData({ ...formData, startingReading: parseInt(e.target.value) })}
                InputProps={{ readOnly: true }}
                helperText="Auto-filled from last invoice"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Closing Reading"
                type="number"
                value={formData.closingReading}
                onChange={(e) => setFormData({ ...formData, closingReading: parseInt(e.target.value) })}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Copy Ratio (₹ per copy)"
                type="number"
                value={formData.copyRatio}
                onChange={(e) => setFormData({ ...formData, copyRatio: parseFloat(e.target.value) })}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Free Copies"
                type="number"
                value={formData.freeCopies}
                onChange={(e) => setFormData({ ...formData, freeCopies: parseInt(e.target.value) })}
                inputProps={{ min: '0' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2" gutterBottom>
                  <strong>Calculation Summary:</strong>
                </Typography>
                <Typography variant="body2">
                  Total Copies: <strong>{totalCopies}</strong>
                </Typography>
                <Typography variant="body2">
                  Free Copies: <strong>{formData.freeCopies}</strong>
                </Typography>
                <Typography variant="body2">
                  Billable Copies: <strong>{billableCopies}</strong>
                </Typography>
                <Typography variant="body2">
                  Copy Ratio: <strong>₹{formData.copyRatio}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Estimated Amount (before GST): <strong>₹{estimatedAmount.toFixed(2)}</strong>
                </Typography>
                <Typography variant="body2">
                  GST (18%): <strong>₹{(estimatedAmount * 0.18).toFixed(2)}</strong>
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  Total Amount: <strong>₹{(estimatedAmount * 1.18).toFixed(2)}</strong>
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            Generate Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceListEnhanced;
