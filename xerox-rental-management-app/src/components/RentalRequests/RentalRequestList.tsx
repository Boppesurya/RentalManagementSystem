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
  Fade,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Visibility,
  Check,
  Close,
  Search,
  GetApp,
  RequestQuote,
  Person,
  Business
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type RentalRequest, type Machine, type User } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';
import jsPDF from 'jspdf';

const RentalRequestList: React.FC = () => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RentalRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    ownerId: '',
    machineId: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    message: ''
  });




  useEffect(() => {
    loadRequests();
    loadMachines();
    loadUsers();
  }, [user?.id]);
 

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data: RentalRequest[] = await apiService.getRentalRequests();
      console.log('Loaded rental requests:', data);

      let filteredRequests = data;

      if (user?.role === 'ADMIN') {
        filteredRequests = data;
      } else if (user?.role === 'OWNER') {
        filteredRequests = data.filter(r => {
          const ownerId = typeof r.owner === 'object' ? r.owner?.id : r.owner;
          return ownerId === user.id.toString();
        });
      } else if (user?.role === 'RENTAL') {
        filteredRequests = data.filter(r => {
          const rentalId = typeof r.rental === 'object' ? r.rental?.id : r.rental;
          return rentalId === user.id.toString();
        });
      }

      console.log('Filtered rental requests:', filteredRequests);
      setRequests(filteredRequests);
    } catch (error) {
      console.error('Error loading rental requests:', error);
      setRequests([]);
      setError('Failed to load rental requests. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMachines = async () => {
    try {
      const data: Machine[] = await apiService.getMachines();
      setMachines(data);
    } catch (error) {
      console.error('Error loading machines:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const data: User[] = await apiService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleOpenDialog = (request?: RentalRequest) => {
    if (request) {
      setSelectedRequest(request);
      setFormData({
        ownerId: typeof request.owner === 'object' ? request.owner?.id || '' : request.owner || '',
        machineId: typeof request.machine === 'object' ? request.machine?.id || '' : request.machine || '',
        startDate: new Date(request.startDate).toISOString().split('T')[0],
        endDate: new Date(request.endDate).toISOString().split('T')[0],
        monthlyRent: request.monthlyRent.toString(),
        message: request.message
      });
    } else {
      setSelectedRequest(null);
      setFormData({
        ownerId: '',
        machineId: '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
        message: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const requestData = {
        rental: { id: user?.id! },
        owner: { id: formData.ownerId },
        machine: { id: formData.machineId },
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        monthlyRent: parseFloat(formData.monthlyRent),
        message: formData.message,
        requestDate: new Date(),
        status: 'PENDING' as RentalRequest['status']
      };

      await apiService.createRentalRequest(requestData);

      try {
        const machine = machines.find(m => m.id === formData.machineId);
        if (machine) {
          await createNotification({
            title: 'New Rental Request',
            message: `New rental request for ${machine.name}`,
            type: 'info',
            priority: 'MEDIUM'
          });
        }
      } catch (notificationError) {
        console.error('Error creating rental request notification:', notificationError);
      }

      await loadRequests();
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating rental request:', error);
      setError('Failed to create rental request. Please try again.');
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await apiService.approveRentalRequest(requestId);
      await loadRequests();

      try {
        await createNotification({
          title: 'Rental Request Approved',
          message: 'Your rental request has been approved',
          type: 'success',
          priority: 'high'
        });
      } catch (notificationError) {
        console.error('Error creating approval notification:', notificationError);
      }
    } catch (error) {
      console.error('Error approving rental request:', error);
      setError('Failed to approve rental request. Please try again.');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await apiService.rejectRentalRequest(requestId);
      await loadRequests();

      try {
        await createNotification({
          title: 'Rental Request Rejected',
          message: 'Your rental request has been rejected',
          type: 'warning',
          priority: 'MEDIUM'
        });
      } catch (notificationError) {
        console.error('Error creating rejection notification:', notificationError);
      }
    } catch (error) {
      console.error('Error rejecting rental request:', error);
      setError('Failed to reject rental request. Please try again.');
    }
  };

  const generateRequestPDF = async (request: RentalRequest) => {
    const doc = new jsPDF();
  
    // 🧩 Extract IDs safely
    const machineId = typeof request.machine === 'object' ? request.machine.id : request.machine;
    const rentalId = typeof request.rental === 'object' ? request.rental.id : request.rental;
    const ownerId = typeof request.owner === 'object' ? request.owner.id : request.owner;
  
    // 🧠 Try to get full data (either from local cache or API)
    const machine =
      machines.find((m) => m.id === machineId) ||
      (await apiService.getMachineById(machineId).catch(() => null));
  
    const rental =
      users.find((u) => u.id === rentalId) ||
      (await apiService.getUserById(rentalId).catch(() => null));
  
    const owner =
      users.find((u) => u.id === ownerId) ||
      (await apiService.getUserById(ownerId).catch(() => null));
  
    // 🧾 Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RENTAL REQUEST', 105, 20, { align: 'center' });
  
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
  
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Request ID: ${request.id}`, 20, 40);
    doc.text(`Status: ${request.status.toUpperCase()}`, 20, 50);
    doc.text(`Request Date: ${new Date(request.requestDate).toLocaleDateString()}`, 20, 60);
  
    doc.setFont('helvetica', 'bold');
    doc.text('RENTAL CUSTOMER:', 20, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${rental?.name || 'Unknown'}`, 20, 90);
    doc.text(`Email: ${rental?.email || ''}`, 20, 100);
    doc.text(`Contact: ${rental?.contactNumber || ''}`, 20, 110);
    if (rental?.address) {
      const rentalAddress = doc.splitTextToSize(`Address: ${rental.address}`, 80);
      doc.text(rentalAddress, 20, 120);
    }
    doc.text(`GST: ${rental?.gstNumber || 'N/A'}`, 20, 140);
    
    // 🏢 Owner details
    doc.setFont('helvetica', 'bold');
    doc.text('MACHINE OWNER:', 120, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${owner?.name || 'Unknown'}`, 120, 90);
    doc.text(`Email: ${owner?.email || ''}`, 120, 100);
    doc.text(`Contact: ${owner?.contactNumber || ''}`, 120, 110);
    if (owner?.address) {
      const ownerAddress = doc.splitTextToSize(`Address: ${owner.address}`, 80);
      doc.text(ownerAddress, 120, 120);
    }
    doc.text(`GST: ${owner?.gstNumber || 'N/A'}`, 120, 140);
  
    // ⚙️ Machine details
    doc.setFont('helvetica', 'bold');
    doc.text('MACHINE DETAILS:', 20, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${machine?.name || 'Unknown'}`, 20, 160);
    doc.text(`Model: ${machine?.model || 'Unknown'}`, 20, 170);
    doc.text(`Serial Number: ${machine?.serialNumber || 'Unknown'}`, 20, 180);
  
    // 💰 Rental terms
    doc.setFont('helvetica', 'bold');
    doc.text('RENTAL TERMS:', 20, 200);
    doc.setFont('helvetica', 'normal');
    doc.text(`Start Date: ${new Date(request.startDate).toLocaleDateString()}`, 20, 210);
    doc.text(`End Date: ${new Date(request.endDate).toLocaleDateString()}`, 20, 220);
    doc.text(`Monthly Rent: ₹${request.monthlyRent.toLocaleString()}`, 20, 230);
  
    // 💬 Message
    if (request.message) {
      doc.setFont('helvetica', 'bold');
      doc.text('MESSAGE:', 20, 250);
      doc.setFont('helvetica', 'normal');
      const splitMessage = doc.splitTextToSize(request.message, 170);
      doc.text(splitMessage, 20, 260);
    }
  
    // 🪶 Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for using our rental service!', 105, 285, { align: 'center' });
  
    doc.save(`rental-request-${request.id}.pdf`);
  };
  

  const filteredRequests = requests.filter(request =>
    request.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof request.machine === 'object' && request.machine?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (typeof request.rental === 'object' && request.rental?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: RentalRequest['status']) => {
    const lowerStatus = status.toUpperCase();
    switch (lowerStatus) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getUserName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : 'Unknown';
  };

  const getEntityName = (entity: any) => {
    if (!entity) {
      return 'Unknown';
    }

    if (typeof entity === 'string') {
      return getUserName(entity);
    }

    if (entity.name) {
      return entity.name;
    }

    if (entity.id) {
      return getUserName(entity.id);
    }

    return 'Unknown';
  };

  const getMachineName = (machineId: string | { id: string; name?: string }) => {
    if (typeof machineId === 'object' && machineId !== null && 'id' in machineId) {
      const machine = machines.find(m => m.id === machineId.id);
      return machine ? machine.name : machineId.name || 'Unknown';
    }
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : 'Unknown';
  };

  const getRequestStats = () => {
    const totalRequests = requests.length;
    const pendingCount = requests.filter(r => r.status === 'PENDING').length;
    const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
    const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

    return { totalRequests, pendingCount, approvedCount, rejectedCount };
  };

  const stats = getRequestStats();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {user?.role === 'ADMIN' ? 'All Rental Requests' :
           user?.role === 'OWNER' ? 'Rental Requests for My Machines' :
           'My Rental Requests'}
        </Typography>
        {user?.role === 'RENTAL' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Send Request
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{xs:12,sm:6,md:3}}>
          <Slide direction="up" in timeout={1000}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                      {stats.totalRequests}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Total Requests
                    </Typography>
                  </Box>
                  <RequestQuote sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
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
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                      {stats.pendingCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Pending
                    </Typography>
                  </Box>
                  <RequestQuote sx={{ fontSize: 40, color: '#ff9800', opacity: 0.7 }} />
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
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {stats.approvedCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Approved
                    </Typography>
                  </Box>
                  <RequestQuote sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
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
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      {stats.rejectedCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Rejected
                    </Typography>
                  </Box>
                  <RequestQuote sx={{ fontSize: 40, color: '#f44336', opacity: 0.7 }} />
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
            placeholder="Search requests..."
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
                <TableCell sx={{ fontWeight: 'bold' }}>Request ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Rental Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Owner</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Machine</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Monthly Rent</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No requests found matching your search.' :
                       user?.role === 'OWNER' ? 'No rental requests for your machines yet.' :
                       user?.role === 'RENTAL' ? 'No rental requests sent yet. Send your first request!' :
                       'No rental requests found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RequestQuote sx={{ color: 'text.secondary' }} />
                        {request.id}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ color: 'text.secondary' }} />
                        {getEntityName(request.rental)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ color: 'text.secondary' }} />
                        {getEntityName(request.owner)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business sx={{ color: 'text.secondary' }} />
                        {getMachineName(request.machine)}
                      </Box>
                    </TableCell>
                    <TableCell>₹{request.monthlyRent.toLocaleString()}</TableCell>
                    <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.status.toUpperCase()}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(request)} color="primary">
                        <Visibility />
                      </IconButton>
                      {user?.role === 'OWNER' && request.status === 'PENDING' && (
                        <>
                          <IconButton onClick={() => handleApprove(request.id)} color="success">
                            <Check />
                          </IconButton>
                          <IconButton onClick={() => handleReject(request.id)} color="error">
                            <Close />
                          </IconButton>
                        </>
                      )}
                      <IconButton onClick={() => generateRequestPDF(request)} color="info">
                        <GetApp />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRequest ? 'View Rental Request' : 'Send Rental Request'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {!selectedRequest && (
              <>
                <Grid size={{xs:12}}>
                  <FormControl fullWidth required>
                    <InputLabel>Machine Owner</InputLabel>
                    <Select
                      value={formData.ownerId}
                      onChange={(e) => setFormData({ ...formData, ownerId: e.target.value, machineId: '' })}
                    >
                      {users.filter(u => u.role === 'OWNER').map(u => (
                        <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
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
                          monthlyRent: selectedMachine?.monthlyRent.toString() || ''
                          
                        });
                      }}
                      disabled={!formData.ownerId}
                    >
                      {machines
                        .filter(m =>
                          typeof m.owner === 'object' ? m.owner?.id : m.owner === formData.ownerId.toString() &&
                          m.status === 'AVAILABLE'
                        )
                        .map(m => (
                          <MenuItem key={m.id} value={m.id}>
                            {m.name} - {m.model} (₹{m.monthlyRent}/month)
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {selectedRequest && (
              <>
                <Grid size={{xs:12,sm:6}}>
                  <TextField
                    fullWidth
                    label="Machine Owner"
                    value={getEntityName(selectedRequest.owner)}
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12,sm:6}}>
                  <TextField
                    fullWidth
                    label="Machine"
                    value={getMachineName(selectedRequest.machine)}
                    disabled
                  />
                </Grid>
              </>
            )}

            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                disabled={selectedRequest !== null}
              />
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                disabled={selectedRequest !== null}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Proposed Monthly Rent"
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                required
                disabled={selectedRequest !== null}
                helperText="This will be auto-filled when you select a machine"
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Please describe your rental requirements..."
                disabled={selectedRequest !== null}
              />
            </Grid>

            {selectedRequest && (
              <Grid size={{xs:12}}>
                <Alert severity="info">
                  <Typography>
                    <strong>Request Date:</strong> {new Date(selectedRequest.requestDate).toLocaleString()}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {selectedRequest.status}
                  </Typography>
                  {selectedRequest.message && (
                    <Typography sx={{ mt: 1 }}>
                      <strong>Message:</strong> {selectedRequest.message}
                    </Typography>
                  )}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {selectedRequest ? 'Close' : 'Cancel'}
          </Button>
          {!selectedRequest && (
            <Button onClick={handleSubmit} variant="contained" disabled={loading}>
              Send Request
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RentalRequestList;
