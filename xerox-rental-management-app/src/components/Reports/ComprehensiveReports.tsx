import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  TextField,
  Autocomplete
} from '@mui/material';
import {
  GetApp,
  Assessment,
  Business,
  Receipt,
  RequestQuote,
  PictureAsPdf,
  FilterList
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Machine, type Invoice, type Contract, type RentalRequest, type User } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const ComprehensiveReports: React.FC = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<'machines' | 'invoices' | 'contracts' | 'requests'>('machines');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
 
  const [machines, setMachines] = useState<Machine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  // Filter states
  const [machineFilters, setMachineFilters] = useState({
    search: '',
    status: '',
    location: '',
    ownerId: '',
    rentalId: ''
  });
  const [invoiceFilters, setInvoiceFilters] = useState({
    search: '',
    status: '',
    ownerId: '',
    rentalId: ''
  });
  const [contractFilters, setContractFilters] = useState({
    search: '',
    status: '',
    ownerId: '',
    rentalId: ''
  });
  const [requestFilters, setRequestFilters] = useState({
    search: '',
    status: '',
    ownerId: '',
    rentalId: ''
  });
  // Unique options for filters
  const machineStatuses = [...new Set(machines.map(m => m.status).filter(Boolean))];
  const machineLocations = [...new Set(machines.map(m => m.location).filter(Boolean))];
  const invoiceStatuses = [...new Set(invoices.map(i => i.status).filter(Boolean))];
  const contractStatuses = [...new Set(contracts.map(c => c.status).filter(Boolean))];
  const requestStatuses = [...new Set(rentalRequests.map(r => r.status).filter(Boolean))];
  const owners = users.filter(u => u.role === 'OWNER');
  const rentals = users.filter(u => u.role === 'RENTAL');
  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id]);
  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [machinesData, invoicesData, contractsData, requestsData, usersData] = await Promise.allSettled([
        apiService.getMachines(),
        apiService.getInvoices(),
        apiService.getContracts(),
        apiService.getRentalRequests(),
        apiService.getUsers()
      ]);
      // Handle individual promise results with type checking
      setMachines(machinesData.status === 'fulfilled' && Array.isArray(machinesData.value) ? machinesData.value : []);
      setInvoices(invoicesData.status === 'fulfilled' && Array.isArray(invoicesData.value) ? invoicesData.value : []);
      setContracts(contractsData.status === 'fulfilled' && Array.isArray(contractsData.value) ? contractsData.value : []);
      setRentalRequests(requestsData.status === 'fulfilled' && Array.isArray(requestsData.value) ? requestsData.value : []);
      setUsers(usersData.status === 'fulfilled' && Array.isArray(usersData.value) ? usersData.value : []);
      // Check for rejected promises
      const errors = [machinesData, invoicesData, contractsData, requestsData, usersData]
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);
      if (errors.length > 0) {
        setError('Some data could not be loaded. Please try again.');
        console.error('Failed API calls:', errors);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load report data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };
  const getFilteredData = () => {
    let data = {
      machines: [...machines],
      invoices: [...invoices],
      contracts: [...contracts],
      rentalRequests: [...rentalRequests],
      users: [...users]
    };
    if (!user) {
      return { machines: [], invoices: [], contracts: [], rentalRequests: [], users: [] };
    }
    if (user.role === 'ADMIN') {
      // No further role-based filtering needed
    } else if (user.role === 'OWNER') {
      data = {
        machines: data.machines.filter(m => m.owner?.id === user.id),
        invoices: data.invoices.filter(i => i.owner?.id === user.id),
        contracts: data.contracts.filter(c => c.owner?.id === user.id),
        rentalRequests: data.rentalRequests.filter(r => r.owner?.id === user.id.toString()),
        users: data.users.filter(u => u.role === 'RENTAL' && u.owner?.id === user.id)
      };
    } else if (user.role === 'RENTAL') {
      data = {
        machines: data.machines.filter(m => m.rental?.id === user.id),
        invoices: data.invoices.filter(i => i.rental?.id === user.id),
        contracts: data.contracts.filter(c => c.rental?.id === user.id),
        rentalRequests: data.rentalRequests.filter(r => r.rental?.id === user.id.toString()),
        users: []
      };
    } else {
      data = { machines: [], invoices: [], contracts: [], rentalRequests: [], users: [] };
    }
    // Apply report-specific filters
    if (reportType === 'machines') {
      data.machines = data.machines.filter(m => {
        const matchesSearch = !machineFilters.search ||
          (m.name?.toLowerCase().includes(machineFilters.search.toLowerCase()) ||
           m.model?.toLowerCase().includes(machineFilters.search.toLowerCase()) ||
           m.serialNumber?.toLowerCase().includes(machineFilters.search.toLowerCase()));
        const matchesStatus = !machineFilters.status || m.status === machineFilters.status;
        const matchesLocation = !machineFilters.location || m.location === machineFilters.location;
        const matchesOwner = !machineFilters.ownerId || m.owner?.id.toString() === machineFilters.ownerId;
        const matchesRental = !machineFilters.rentalId || m.rental?.id.toString() === machineFilters.rentalId;
        return matchesSearch && matchesStatus && matchesLocation && matchesOwner && matchesRental;
      });
    } else if (reportType === 'invoices') {
      data.invoices = data.invoices.filter(i => {
        const matchesSearch = !invoiceFilters.search ||
          i.invoiceNumber?.toLowerCase().includes(invoiceFilters.search.toLowerCase());
        const matchesStatus = !invoiceFilters.status || i.status === invoiceFilters.status;
        const matchesOwner = !invoiceFilters.ownerId || i.owner?.id.toString() === invoiceFilters.ownerId;
        const matchesRental = !invoiceFilters.rentalId || i.rental?.id.toString() === invoiceFilters.rentalId;
        return matchesSearch && matchesStatus && matchesOwner && matchesRental;
      });
    } else if (reportType === 'contracts') {
      data.contracts = data.contracts.filter(c => {
        const matchesSearch = !contractFilters.search ||
          c.id.toString().includes(contractFilters.search);
        const matchesStatus = !contractFilters.status || c.status === contractFilters.status;
        const matchesOwner = !contractFilters.ownerId || c.owner?.id.toString() === contractFilters.ownerId;
        const matchesRental = !contractFilters.rentalId || c.rental?.id.toString() === contractFilters.rentalId;
        return matchesSearch && matchesStatus && matchesOwner && matchesRental;
      });
    } else if (reportType === 'requests') {
      data.rentalRequests = data.rentalRequests.filter(r => {
        const matchesSearch = !requestFilters.search ||
          r.id.toString().includes(requestFilters.search);
        const matchesStatus = !requestFilters.status || r.status === requestFilters.status;
        const matchesOwner = !requestFilters.ownerId || r.owner?.id.toString() === requestFilters.ownerId;
        const matchesRental = !requestFilters.rentalId || r.rental?.id.toString() === requestFilters.rentalId;
        return matchesSearch && matchesStatus && matchesOwner && matchesRental;
      });
    }
    return data;
  };
  const resetFilters = () => {
    if (reportType === 'machines') {
      setMachineFilters({ search: '', status: '', location: '', ownerId: '', rentalId: '' });
    } else if (reportType === 'invoices') {
      setInvoiceFilters({ search: '', status: '', ownerId: '', rentalId: '' });
    } else if (reportType === 'contracts') {
      setContractFilters({ search: '', status: '', ownerId: '', rentalId: '' });
    } else if (reportType === 'requests') {
      setRequestFilters({ search: '', status: '', ownerId: '', rentalId: '' });
    }
  };
  const generateComprehensivePDF = () => {
    try {
      setLoading(true);
      setError('');
      const doc = new jsPDF();
      const filteredData = getFilteredData();
      let yPosition = 20;
  
      // Detect Owner or Rental filter
      let filterLabel = '';
      const allFilters = [machineFilters, invoiceFilters, contractFilters, requestFilters];
      const activeOwnerId = allFilters.find(f => f.ownerId)?.ownerId;
      const activeRentalId = allFilters.find(f => f.rentalId)?.rentalId;
  
      if (activeOwnerId) {
        const owner = users.find(u => u.id.toString() === activeOwnerId && u.role === 'OWNER');
        if (owner) filterLabel = `Owner: ${owner.name}`;
      } else if (activeRentalId) {
        const rental = users.find(u => u.id.toString() === activeRentalId && u.role === 'RENTAL');
        if (rental) filterLabel = `Rental User: ${rental.name}`;
      }
  
      // Helper: Format amount as "Rs 45,000"
      const rs = (amount: number | undefined | null) => `Rs ${(amount || 0).toLocaleString('en-IN')}`;
  
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Rental Management System', 105, yPosition, { align: 'center' });
      yPosition += 10;
  
      doc.setFontSize(16);
      doc.text('Comprehensive Report', 105, yPosition, { align: 'center' });
      yPosition += 12;
  
      if (filterLabel) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(filterLabel, 105, yPosition, { align: 'center' });
        yPosition += 10;
      }
  
      doc.setFontSize(12);
      doc.text(`Generated by: ${user?.name || 'Unknown'} (${user?.role?.toUpperCase() || 'N/A'})`, 20, yPosition);
      yPosition += 8;
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, yPosition);
      yPosition += 15;
  
      doc.setDrawColor(102, 126, 234);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
  
      // Machines Table
      if (filteredData.machines.length > 0) {
        doc.setFontSize(14);
        doc.text('Machines Report', 14, yPosition);
        yPosition += 5;
        autoTable(doc, {
          startY: yPosition,
          head: [['Name', 'Model', 'Serial', 'Location', 'Status', 'Monthly Rent', 'Usage']],
          body: filteredData.machines.map(m => [
            m.name || 'N/A',
            m.model || 'N/A',
            m.serialNumber || 'N/A',
            m.location || 'N/A',
            m.status || 'N/A',
            rs(m.monthlyRent),
            `${m.usage || 0} pages`
          ]),
          styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.2 },
          headStyles: { fillColor: [102, 126, 234], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 14, right: 14 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
  
      // Invoices Table
      if (filteredData.invoices.length > 0) {
        doc.setFontSize(14);
        doc.text('Invoices Report', 14, yPosition);
        yPosition += 5;
        autoTable(doc, {
          startY: yPosition,
          head: [['Invoice #', 'Amount', 'GST', 'Total', 'Status', 'Due Date', 'Paid Date']],
          body: filteredData.invoices.map(i => [
            i.invoiceNumber || 'N/A',
            rs(i.amount),
            rs(i.gstAmount),
            rs(i.totalAmount),
            i.status || 'N/A',
            i.dueDate ? new Date(i.dueDate).toLocaleDateString('en-IN') : 'N/A',
            i.paidDate ? new Date(i.paidDate).toLocaleDateString('en-IN') : '-'
          ]),
          styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.2 },
          headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 255, 240] },
          margin: { left: 14, right: 14 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
  
      // Contracts Table
      if (filteredData.contracts.length > 0) {
        doc.setFontSize(14);
        doc.text('Contracts Report', 14, yPosition);
        yPosition += 5;
        autoTable(doc, {
          startY: yPosition,
          head: [['Contract ID', 'Monthly Rent', 'Status', 'Start Date', 'End Date']],
          body: filteredData.contracts.map(c => [
            c.id || 'N/A',
            rs(c.monthlyRent),
            c.status || 'N/A',
            c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN') : 'N/A',
            c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN') : 'N/A'
          ]),
          styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.2 },
          headStyles: { fillColor: [255, 152, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [255, 245, 240] },
          margin: { left: 14, right: 14 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
  
      // Rental Requests Table
      if (filteredData.rentalRequests.length > 0) {
        doc.setFontSize(14);
        doc.text('Rental Requests Report', 14, yPosition);
        yPosition += 5;
        autoTable(doc, {
          startY: yPosition,
          head: [['Request ID', 'Monthly Rent', 'Status', 'Request Date', 'Start Date', 'End Date']],
          body: filteredData.rentalRequests.map(r => [
            r.id || 'N/A',
            rs(r.monthlyRent),
            r.status || 'N/A',
            r.requestDate ? new Date(r.requestDate).toLocaleDateString('en-IN') : 'N/A',
            r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN') : 'N/A',
            r.endDate ? new Date(r.endDate).toLocaleDateString('en-IN') : 'N/A'
          ]),
          styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.2 },
          headStyles: { fillColor: [244, 67, 54], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [255, 240, 245] },
          margin: { left: 14, right: 14 }
        });
      }
  
      // Footer
      doc.setFontSize(8);
      doc.text('Generated by Rental Management System', 105, 285, { align: 'center' });
  
      // Filename with Owner/Rental
      const safeLabel = filterLabel ? filterLabel.replace(/[^a-zA-Z0-9]/g, '_') + '_' : '';
      const fileName = `${safeLabel}Comprehensive_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating comprehensive PDF:', error);
      setError('Failed to generate comprehensive PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const generateSpecificPDF = (type: string) => {
    try {
      setLoading(true);
      setError('');
      const doc = new jsPDF();
      const filteredData = getFilteredData();
      let yPosition = 20;
  
      const currentFilters =
        type === 'machines' ? machineFilters :
        type === 'invoices' ? invoiceFilters :
        type === 'contracts' ? contractFilters : requestFilters;
  
      let filterLabel = '';
      if (currentFilters.ownerId) {
        const owner = users.find(u => u.id.toString() === currentFilters.ownerId && u.role === 'OWNER');
        if (owner) filterLabel = `Owner: ${owner.name}`;
      } else if (currentFilters.rentalId) {
        const rental = users.find(u => u.id.toString() === currentFilters.rentalId && u.role === 'RENTAL');
        if (rental) filterLabel = `Rental User: ${rental.name}`;
      }
  
      // Format as "Rs 45,000"
      const rs = (amount: number | undefined | null) => `Rs ${(amount || 0).toLocaleString('en-IN')}`;
  
      // Header
      doc.setFontSize(18);
      doc.text(`${type.toUpperCase()} REPORT`, 105, yPosition, { align: 'center' });
      yPosition += 15;
  
      if (filterLabel) {
        doc.setFontSize(14);
        doc.text(filterLabel, 105, yPosition, { align: 'center' });
        yPosition += 10;
      }
  
      doc.setFontSize(12);
      doc.text(`Generated by: ${user?.name || 'Unknown'} (${user?.role?.toUpperCase() || 'N/A'})`, 20, yPosition);
      yPosition += 8;
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, yPosition);
      yPosition += 15;
  
      doc.setDrawColor(102, 126, 234);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
  
      let headers: string[][] = [];
      let body: any[][] = [];
      let headColor = [102, 126, 234];
  
      switch (type) {
        case 'machines':
          headers = [['Name', 'Model', 'Serial', 'Location', 'Status', 'Rent', 'Usage']];
          body = filteredData.machines.map(m => [
            m.name || 'N/A', m.model || 'N/A', m.serialNumber || 'N/A',
            m.location || 'N/A', m.status || 'N/A', rs(m.monthlyRent), `${m.usage || 0} pages`
          ]);
          headColor = [102, 126, 234];
          break;
  
        case 'invoices':
          headers = [['Inv #', 'Amount', 'GST', 'Total', 'Status', 'Due', 'Paid']];
          body = filteredData.invoices.map(i => [
            i.invoiceNumber || 'N/A',
            rs(i.amount),
            rs(i.gstAmount),
            rs(i.totalAmount),
            i.status || 'N/A',
            i.dueDate ? new Date(i.dueDate).toLocaleDateString('en-IN') : 'N/A',
            i.paidDate ? new Date(i.paidDate).toLocaleDateString('en-IN') : '-'
          ]);
          headColor = [76, 175, 80];
          break;
  
        case 'contracts':
          headers = [['Contract ID', 'Monthly Rent', 'Status', 'Start', 'End']];
          body = filteredData.contracts.map(c => [
            c.id || 'N/A', rs(c.monthlyRent), c.status || 'N/A',
            c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN') : 'N/A',
            c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN') : 'N/A'
          ]);
          headColor = [255, 152, 0];
          break;
  
        case 'requests':
          headers = [['Req ID', 'Rent', 'Status', 'Req Date', 'Start', 'End']];
          body = filteredData.rentalRequests.map(r => [
            r.id || 'N/A', rs(r.monthlyRent), r.status || 'N/A',
            r.requestDate ? new Date(r.requestDate).toLocaleDateString('en-IN') : 'N/A',
            r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN') : 'N/A',
            r.endDate ? new Date(r.endDate).toLocaleDateString('en-IN') : 'N/A'
          ]);
          headColor = [244, 67, 54];
          break;
      }
  
      if (body.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: headers,
          body: body,
          styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.2 },
          headStyles: { fillColor: headColor, textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 14, right: 14 }
        });
      } else {
        doc.text('No data available for the selected filters.', 14, yPosition);
      }
  
      doc.setFontSize(8);
      doc.text('Rental Management System - Confidential Report', 105, 285, { align: 'center' });
  
      const safeLabel = filterLabel ? filterLabel.replace(/[^a-zA-Z0-9]/g, '_') + '_' : '';
      const fileName = `${safeLabel}${type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
  
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(`Error generating ${type} PDF:`, error);
      setError(`Failed to generate ${type} PDF.`);
    } finally {
      setLoading(false);
    }
  };
  const getReportOptions = () => {
    const baseOptions = [
      { value: 'machines', label: 'Machines Report', icon: <Business /> },
      { value: 'invoices', label: 'Invoices Report', icon: <Receipt /> },
      { value: 'contracts', label: 'Contracts Report', icon: <Assessment /> },
      { value: 'requests', label: 'Rental Requests Report', icon: <RequestQuote /> }
    ];
    if (!user) return baseOptions;
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      return baseOptions;
    } else if (user.role === 'RENTAL') {
      return baseOptions.filter(option => option.value !== 'requests' || getFilteredData().rentalRequests.length > 0);
    }
    return baseOptions;
  };
  const getReportStats = () => {
    const filteredData = getFilteredData();
    return {
      machines: filteredData.machines.length,
      invoices: filteredData.invoices.length,
      contracts: filteredData.contracts.length,
      requests: filteredData.rentalRequests.length,
      totalRevenue: filteredData.invoices
        .filter(i => i.status === 'PAID')
        .reduce((sum, i) => sum + (i.totalAmount || 0), 0)
    };
  };
  const stats = getReportStats();
  const filteredData = getFilteredData();
  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Please log in to view reports.</Alert>
      </Box>
    );
  }
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        {user.role === 'ADMIN' ? 'Admin Reports Dashboard' :
         user.role === 'OWNER' ? 'Owner Reports Dashboard' :
         'My Reports Dashboard'}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{xs:12,sm:6,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                    {stats.machines}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {user.role === 'ADMIN' ? 'Total Machines' :
                     user.role === 'OWNER' ? 'My Machines' : 'Rented Machines'}
                  </Typography>
                </Box>
                <Business sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {stats.invoices}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {user.role === 'ADMIN' ? 'Total Invoices' :
                     user.role === 'OWNER' ? 'Generated Invoices' : 'My Invoices'}
                  </Typography>
                </Box>
                <Receipt sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {stats.contracts}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {user.role === 'ADMIN' ? 'Total Contracts' : 'My Contracts'}
                  </Typography>
                </Box>
                <Assessment sx={{ fontSize: 40, color: '#ff9800', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                    ₹{(stats.totalRevenue / 1000).toFixed(0)}K
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Total Revenue
                  </Typography>
                </Box>
                <Receipt sx={{ fontSize: 40, color: '#f44336', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Report Generation */}
      <Grid container spacing={3}>
        <Grid size={{xs:12,md:8}}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Generate Reports
            </Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{xs:12,sm:6}}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => {
                      setReportType(e.target.value as 'machines' | 'invoices' | 'contracts' | 'requests');
                      resetFilters();
                    }}
                  >
                    {getReportOptions().map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {option.icon}
                          {option.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{xs:12,sm:6}}>
                <Box sx={{ display: 'flex', gap: 2, height: '100%', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<PictureAsPdf />}
                    onClick={() => generateSpecificPDF(reportType)}
                    disabled={loading}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      flex: 1
                    }}
                  >
                    Generate PDF
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<GetApp />}
                    onClick={generateComprehensivePDF}
                    disabled={loading}
                    sx={{ borderRadius: 2, flex: 1 }}
                  >
                    Full Report
                  </Button>
                </Box>
              </Grid>
            </Grid>
            {/* Filters Section */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#f9f9f9', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <FilterList sx={{ color: 'text.secondary' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Filters:
              </Typography>
              {reportType === 'machines' && (
                <>
                  <TextField
                    label="Search (Name/Model/Serial)"
                    variant="outlined"
                    size="small"
                    value={machineFilters.search}
                    onChange={(e) => setMachineFilters({ ...machineFilters, search: e.target.value })}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <Autocomplete
                    options={machineStatuses}
                    value={machineFilters.status}
                    onChange={(_, newValue) => setMachineFilters({ ...machineFilters, status: newValue || '' })}
                    renderInput={(params) => <TextField {...params} label="Status" variant="outlined" size="small" />}
                    sx={{ width: 150 }}
                    disableClearable={false}
                  />
                  <Autocomplete
                    options={machineLocations}
                    value={machineFilters.location}
                    onChange={(_, newValue) => setMachineFilters({ ...machineFilters, location: newValue || '' })}
                    renderInput={(params) => <TextField {...params} label="Location" variant="outlined" size="small" />}
                    sx={{ width: 150 }}
                    disableClearable={false}
                  />
                </>
              )}
              {reportType === 'invoices' && (
                <>
                  <TextField
                    label="Search (Invoice #)"
                    variant="outlined"
                    size="small"
                    value={invoiceFilters.search}
                    onChange={(e) => setInvoiceFilters({ ...invoiceFilters, search: e.target.value })}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <Autocomplete
                    options={invoiceStatuses}
                    value={invoiceFilters.status}
                    onChange={(_, newValue) => setInvoiceFilters({ ...invoiceFilters, status: newValue || '' })}
                    renderInput={(params) => <TextField {...params} label="Status" variant="outlined" size="small" />}
                    sx={{ width: 150 }}
                    disableClearable={false}
                  />
                </>
              )}
              {reportType === 'contracts' && (
                <>
                  <TextField
                    label="Search (Contract ID)"
                    variant="outlined"
                    size="small"
                    value={contractFilters.search}
                    onChange={(e) => setContractFilters({ ...contractFilters, search: e.target.value })}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <Autocomplete
                    options={contractStatuses}
                    value={contractFilters.status}
                    onChange={(_, newValue) => setContractFilters({ ...contractFilters, status: newValue || '' })}
                    renderInput={(params) => <TextField {...params} label="Status" variant="outlined" size="small" />}
                    sx={{ width: 150 }}
                    disableClearable={false}
                  />
                </>
              )}
              {reportType === 'requests' && (
                <>
                  <TextField
                    label="Search (Request ID)"
                    variant="outlined"
                    size="small"
                    value={requestFilters.search}
                    onChange={(e) => setRequestFilters({ ...requestFilters, search: e.target.value })}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <Autocomplete
                    options={requestStatuses}
                    value={requestFilters.status}
                    onChange={(_, newValue) => setRequestFilters({ ...requestFilters, status: newValue || '' })}
                    renderInput={(params) => <TextField {...params} label="Status" variant="outlined" size="small" />}
                    sx={{ width: 150 }}
                    disableClearable={false}
                  />
                </>
              )}
              {user.role === 'ADMIN' && (
                <>
                  <Autocomplete
                    options={owners.map(o => ({ label: o.name || 'Unknown', value: o.id.toString() }))}
                    value={reportType === 'machines' ? (machineFilters.ownerId ? { label: owners.find(o => o.id.toString() === machineFilters.ownerId)?.name || '', value: machineFilters.ownerId } : null) :
                           reportType === 'invoices' ? (invoiceFilters.ownerId ? { label: owners.find(o => o.id.toString() === invoiceFilters.ownerId)?.name || '', value: invoiceFilters.ownerId } : null) :
                           reportType === 'contracts' ? (contractFilters.ownerId ? { label: owners.find(o => o.id.toString() === contractFilters.ownerId)?.name || '', value: contractFilters.ownerId } : null) :
                           (requestFilters.ownerId ? { label: owners.find(o => o.id.toString() === requestFilters.ownerId)?.name || '', value: requestFilters.ownerId } : null)}
                    onChange={(_, newValue) => {
                      if (reportType === 'machines') {
                        setMachineFilters({ ...machineFilters, ownerId: newValue?.value || '' });
                      } else if (reportType === 'invoices') {
                        setInvoiceFilters({ ...invoiceFilters, ownerId: newValue?.value || '' });
                      } else if (reportType === 'contracts') {
                        setContractFilters({ ...contractFilters, ownerId: newValue?.value || '' });
                      } else {
                        setRequestFilters({ ...requestFilters, ownerId: newValue?.value || '' });
                      }
                    }}
                    renderInput={(params) => <TextField {...params} label="Owner" variant="outlined" size="small" />}
                    sx={{ width: 150 }}
                    disableClearable={false}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                  />
                  <Autocomplete
                    options={rentals.map(r => ({ label: r.name || 'Unknown', value: r.id.toString() }))}
                    value={reportType === 'machines' ? (machineFilters.rentalId ? { label: rentals.find(r => r.id.toString() === machineFilters.rentalId)?.name || '', value: machineFilters.rentalId } : null) :
                           reportType === 'invoices' ? (invoiceFilters.rentalId ? { label: rentals.find(r => r.id.toString() === invoiceFilters.rentalId)?.name || '', value: invoiceFilters.rentalId } : null) :
                           reportType === 'contracts' ? (contractFilters.rentalId ? { label: rentals.find(r => r.id.toString() === contractFilters.rentalId)?.name || '', value: contractFilters.rentalId } : null) :
                           (requestFilters.rentalId ? { label: rentals.find(r => r.id.toString() === requestFilters.rentalId)?.name || '', value: requestFilters.rentalId } : null)}
                    onChange={(_, newValue) => {
                      if (reportType === 'machines') {
                        setMachineFilters({ ...machineFilters, rentalId: newValue?.value || '' });
                      } else if (reportType === 'invoices') {
                        setInvoiceFilters({ ...invoiceFilters, rentalId: newValue?.value || '' });
                      } else if (reportType === 'contracts') {
                        setContractFilters({ ...contractFilters, rentalId: newValue?.value || '' });
                      } else {
                        setRequestFilters({ ...requestFilters, rentalId: newValue?.value || '' });
                      }
                    }}
                    renderInput={(params) => <TextField {...params} label="Rental" variant="outlined" size="small" />}
                    sx={{ width: 150 }}
                    disableClearable={false}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                  />
                </>
              )}
              <Button variant="text" onClick={resetFilters} size="small">
                Reset
              </Button>
            </Box>
            {/* Preview Table */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Preview ({filteredData[reportType === 'requests' ? 'rentalRequests' : reportType].length} items)
            </Typography>
           
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {reportType === 'machines' && (
                        <>
                          <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Model</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Monthly Rent</TableCell>
                        </>
                      )}
                      {reportType === 'invoices' && (
                        <>
                          <TableCell sx={{ fontWeight: 'bold' }}>Invoice Number</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                        </>
                      )}
                      {reportType === 'contracts' && (
                        <>
                          <TableCell sx={{ fontWeight: 'bold' }}>Contract ID</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Monthly Rent</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Period</TableCell>
                        </>
                      )}
                      {reportType === 'requests' && (
                        <>
                          <TableCell sx={{ fontWeight: 'bold' }}>Request ID</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Monthly Rent</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Request Date</TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportType === 'machines' && filteredData.machines.map((machine) => (
                      <TableRow key={machine.id}>
                        <TableCell>{machine.name || 'N/A'}</TableCell>
                        <TableCell>{machine.model || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={machine.status || 'N/A'}
                            color={
                              machine.status === 'AVAILABLE' ? 'success' :
                              machine.status === 'RENTED' ? 'primary' :
                              machine.status ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>₹{machine.monthlyRent?.toLocaleString('en-IN') || 0}</TableCell>
                      </TableRow>
                    ))}
                   
                    {reportType === 'invoices' && filteredData.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber || 'N/A'}</TableCell>
                        <TableCell>₹{invoice.totalAmount?.toLocaleString('en-IN') || 0}</TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status || 'N/A'}
                            color={
                              invoice.status === 'PAID' ? 'success' :
                              invoice.status === 'PENDING' ? 'warning' :
                              invoice.status ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                   
                    {reportType === 'contracts' && filteredData.contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>{contract.id || 'N/A'}</TableCell>
                        <TableCell>₹{contract.monthlyRent?.toLocaleString('en-IN') || 0}</TableCell>
                        <TableCell>
                          <Chip
                            label={contract.status || 'N/A'}
                            color={
                              contract.status === 'ACTIVE' ? 'success' :
                              contract.status === 'EXPIRED' ? 'warning' :
                              contract.status ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {(contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-IN') : 'N/A')} -
                          {(contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-IN') : 'N/A')}
                        </TableCell>
                      </TableRow>
                    ))}
                   
                    {reportType === 'requests' && filteredData.rentalRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.id || 'N/A'}</TableCell>
                        <TableCell>₹{request.monthlyRent?.toLocaleString('en-IN') || 0}</TableCell>
                        <TableCell>
                          <Chip
                            label={request.status || 'N/A'}
                            color={
                              request.status === 'APPROVED' ? 'success' :
                              request.status === 'PENDING' ? 'warning' :
                              request.status ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{request.requestDate ? new Date(request.requestDate).toLocaleDateString('en-IN') : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        <Grid size={{xs:12,md:4}}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {getReportOptions().map((option) => (
                <Grid size={{xs:12}} key={option.value}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={option.icon}
                    onClick={() => {
                      setReportType(option.value as 'machines' | 'invoices' | 'contracts' | 'requests');
                      generateSpecificPDF(option.value);
                    }}
                    sx={{
                      borderRadius: 2,
                      justifyContent: 'flex-start',
                      py: 1.5
                    }}
                  >
                    Download {option.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Report Summary (Filtered)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Machines:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.machines}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Invoices:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.invoices}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Contracts:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.contracts}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Requests:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.requests}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Total Revenue:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
export default ComprehensiveReports;