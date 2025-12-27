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
  Search,
  Assignment,
  Engineering,
  Build,
  CheckCircle,
  PlayArrow,
  Person,
  Business,
  Image,
  Delete,
  Close
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Ticket, type Machine, type User } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';

const TicketList: React.FC = () => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Ticket['priority'],
    machineId: '',
    additionalNotes: ''
  });
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  useEffect(() => {
    loadTickets();
    loadMachines();
    loadUsers();
  }, [user?.id]);

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      // Pass user ID and role for backend filtering
      const data: Ticket[] = await apiService.getTickets(user?.id, user?.role);

      // Tickets are now filtered by backend based on role
      let filteredTickets = data;
      
      if (user?.role === 'ADMIN') {
        // Admin can see all tickets
        filteredTickets = data;
      } else if (user?.role === 'OWNER') {
        // Owner can see tickets related to their machines or created by their rental customers/technicians
        filteredTickets = data.filter(t => 
          t.createdBy?.id === user.id || // Tickets created by owner
          (t.machine && typeof t.machine === 'object' && 'id' in t.machine) // Tickets for owner's machines
        );
      } else if (user?.role === 'TECHNICIAN') {
        // Technician can see tickets assigned to them or for machines under their owner
        filteredTickets = data.filter(t => 
          t.assignedTo?.id === user.id || // Tickets assigned to technician
          t.createdBy?.id === user.id || // Tickets created by technician
          (t.machine && typeof t.machine === 'object' && 'id' in t.machine) // Tickets for machines under their owner
        );
      } else if (user?.role === 'RENTAL') {
        // Rental can only see their own tickets
        filteredTickets = data.filter(t => t.createdBy?.id === user.id);
      }
      
      setTickets(filteredTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTickets([]);
      setError('Failed to load tickets. Please check your connection and try again.');
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

  const handleOpenDialog = (ticket?: Ticket) => {
    if (ticket) {
      setSelectedTicket(ticket);
      setFormData({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        machineId: typeof ticket.machine === 'object' ? ticket.machine?.id || '' : ticket.machine || '',
        additionalNotes: ''
      });
    } else {
      setSelectedTicket(null);
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        machineId: '',
        additionalNotes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTicket(null);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const ticketData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'open' as Ticket['status'],
        createdBy: { id: user?.id! },
        machine: formData.machineId ? { id: formData.machineId } : undefined
      };

      if (selectedTicket) {
        await apiService.updateTicket(selectedTicket.id, ticketData);
      } else {
        await apiService.createTicket(ticketData);
        
        // Send notification to owner and technicians
        try {
          const machine = machines.find(m => m.id === formData.machineId);
          if (machine) {
            await createNotification({
              title: 'New Repair Ticket Created',
              message: `${formData.priority.toUpperCase()} priority ticket: ${formData.title} for ${machine.name}`,
              type: formData.priority === 'HIGH' ? 'error' : 'warning',
              priority: formData.priority === 'HIGH' ? 'high' : 'medium'
            });
          }
        } catch (notificationError) {
          console.error('Error creating ticket notification:', notificationError);
        }
      }

      await loadTickets();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving ticket:', error);
      setError('Failed to save ticket. Please try again.');
    }
  };

  const handleAssignToTechnician = async (ticketId: string, technicianId: string) => {
    if (!technicianId) {
      setError('Please select a technician');
      return;
    }

    try {
      await apiService.assignTicket(ticketId, technicianId);

      // Send notification to the assigned technician
      const assignedTech = users.find(u => u.id === technicianId);
      if (assignedTech) {
        try {
          await createNotification({
            title: 'New Ticket Assigned',
            message: `You have been assigned a new repair ticket`,
            type: 'info',
            priority: 'medium'
          });
        } catch (notificationError) {
          console.error('Error creating assignment notification:', notificationError);
        }
      }

      await loadTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      setError('Failed to assign ticket. Please try again.');
    }
  };

  const handleStatusChange = async (ticketId: string, status: Ticket['status']) => {
    try {
      if (status === 'RESOLVED') {
        await apiService.resolveTicket(ticketId);
      } else if (status === 'CLOSED') {
        await apiService.closeTicket(ticketId);
      }
      await loadTickets();
    } catch (error) {
      console.error('Error changing ticket status:', error);
      setError('Failed to change ticket status. Please try again.');
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketStatus: string) => {
    if (ticketStatus !== 'closed') {
      setError('Only closed tickets can be deleted');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteTicket(ticketId, user!.id, user!.role);
      await loadTickets();
      createNotification({
        type: 'success',
        title: 'Ticket Deleted',
        message: 'Ticket has been successfully deleted',
        priority: ''
      });
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      setError(error.message || 'Failed to delete ticket. Please try again.');
    }
  };

  const handleImagePreview = (imageUrl: string) => {
    if (!imageUrl) return;
    const fullUrl = `${import.meta.env.VITE_API_URL}${imageUrl}`;
    setPreviewImageUrl(fullUrl);
    setImagePreviewOpen(true);
  };

  const handleCloseImagePreview = () => {
    setImagePreviewOpen(false);
    setPreviewImageUrl('');
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'OPEN': return 'error';
      case 'IN-PROGRESS': return 'warning';
      case 'RESOLVED': return 'info';
      case 'CLOSED': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
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
    return machine ? machine.name : 'N/A';
  };

  const getAvailableMachines = () => {
    if (user?.role === 'ADMIN') {
      return machines;
    } else if (user?.role === 'OWNER') {
      return machines.filter(m => m.owner?.id === user.id || m.ownerId === user.id);
    } else if (user?.role === 'TECHNICIAN') {
      // Technician can see machines from their assigned owner
      return machines.filter(m => m.owner?.id === user.owner?.id);
    } else if (user?.role === 'RENTAL') {
      return machines.filter(m => m.rental?.id === user.id || m.rentalId === user.id);
    }
    return [];
  };

  const getAvailableTechnicians = () => {
    if (user?.role === 'ADMIN') {
      return users.filter(u => u.role === 'TECHNICIAN' );
    } else if (user?.role === 'OWNER') {
      return users.filter(u => (u.role === 'TECHNICIAN') && (u.owner?.id === user.id || u.ownerId === user.id));
    }
    return [];
  };

  const getTicketStats = () => {
    const totalTickets = tickets.length;
    const openCount = tickets.filter(t => t.status === 'OPEN').length;
    const inProgressCount = tickets.filter(t => t.status === 'IN-PROGRESS').length;
    const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;
    const closedCount = tickets.filter(t => t.status === 'CLOSED').length;

    return { totalTickets, openCount, inProgressCount, resolvedCount, closedCount };
  };

  const stats = getTicketStats();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {user?.role === 'TECHNICIAN' ? 'Repair & Support Tickets' : 'Support Tickets'}
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
          {user?.role === 'TECHNICIAN' ? 'Report Issue' : 'Create Ticket'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Slide direction="up" in timeout={1000}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                      {stats.totalTickets}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Total Tickets
                    </Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Slide direction="up" in timeout={1200}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      {stats.openCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Open
                    </Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 40, color: '#f44336', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
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
                  <Build sx={{ fontSize: 40, color: '#ff9800', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Slide direction="up" in timeout={1600}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      {stats.resolvedCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Resolved
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, color: '#2196f3', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Slide direction="up" in timeout={1800}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {stats.closedCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Closed
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
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
            placeholder="Search tickets..."
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
                <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Machine</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No tickets found matching your search.' : 
                       user?.role === 'TECHNICIAN' ? 'No repair tickets assigned yet.' :
                       user?.role === 'OWNER' ? 'No support tickets for your machines yet.' :
                       user?.role === 'RENTAL' ? 'No support tickets created yet.' :
                       'No tickets found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assignment sx={{ color: 'text.secondary' }} />
                        {ticket.title}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.priority.toUpperCase()}
                        color={getPriorityColor(ticket.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status.replace('-', ' ').toUpperCase()}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ color: 'text.secondary' }} />
                        {getEntityName(ticket.createdBy)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {ticket.assignedTo ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Engineering sx={{ color: 'text.secondary' }} />
                          {getEntityName(ticket.assignedTo)}
                        </Box>
                      ) : (
                        <Chip label="Unassigned" variant="outlined" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {ticket.machine ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business sx={{ color: 'text.secondary' }} />
                          {getMachineName(ticket.machine)}
                        </Box>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton onClick={() => handleOpenDialog(ticket)} color="primary" title="View Details">
                          <Visibility />
                        </IconButton>

                        {/* Image preview button */}
                        {ticket.imageUrl && (
                          <IconButton
                            onClick={() => handleImagePreview(ticket.imageUrl!)}
                            color="secondary"
                            title="View Image"
                          >
                            <Image />
                          </IconButton>
                        )}

                        {/* Owner and Admin can assign tickets to technicians */}
                        {(user?.role === 'OWNER' || user?.role === 'ADMIN') && ticket.status === 'open' && !ticket.assignedTo && (
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value=""
                              displayEmpty
                              onChange={(e) => handleAssignToTechnician(ticket.id, e.target.value)}
                              renderValue={() => 'Assign'}
                            >
                              <MenuItem value="" disabled>Select Technician</MenuItem>
                              {getAvailableTechnicians().map(tech => (
                                <MenuItem key={tech.id} value={tech.id}>{tech.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}

                        {/* Technician can update status */}
                        {user?.role === 'TECHNICIAN' && ticket.assignedTo?.id === user.id && (
                          <>
                            {ticket.status === 'open' && (
                              <IconButton onClick={() => handleStatusChange(ticket.id, 'in-progress')} color="warning" title="Start Work">
                                <PlayArrow />
                              </IconButton>
                            )}
                            {ticket.status === 'in-progress' && (
                              <IconButton onClick={() => handleStatusChange(ticket.id, 'resolved')} color="success" title="Mark Resolved">
                                <CheckCircle />
                              </IconButton>
                            )}
                          </>
                        )}

                        {/* Owner and Admin can delete closed tickets */}
                        {(user?.role === 'OWNER' || user?.role === 'ADMIN') && ticket.status === 'closed' && (
                          <IconButton
                            onClick={() => handleDeleteTicket(ticket.id, ticket.status)}
                            color="error"
                            title="Delete Ticket"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Ticket Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTicket ? 'View/Edit Ticket' : user?.role === 'TECHNICIAN' ? 'Report Machine Issue' : 'Create New Ticket'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={selectedTicket && user?.role !== 'ADMIN' && user?.role !== 'TECHNICIAN'}
                placeholder={user?.role === 'TECHNICIAN' ? 'e.g., Machine not printing properly' : 'Brief description of the issue'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={selectedTicket && user?.role !== 'ADMIN' && user?.role !== 'TECHNICIAN'}
                placeholder={user?.role === 'TECHNICIAN' ? 
                  'Describe the technical issue, error messages, and steps taken...' : 
                  'Please describe the issue in detail...'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Ticket['priority'] })}
                  disabled={selectedTicket && user?.role !== 'ADMIN' && user?.role !== 'TECHNICIAN'}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Machine (Optional)</InputLabel>
                <Select
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  disabled={selectedTicket && user?.role !== 'ADMIN' && user?.role !== 'TECHNICIAN'}
                >
                  <MenuItem value="">None</MenuItem>
                  {getAvailableMachines().map(m => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name} - {m.model} ({m.location})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {user?.role === 'TECHNICIAN' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Technical Notes"
                  multiline
                  rows={3}
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  placeholder="Technical diagnosis, parts needed, estimated repair time..."
                />
              </Grid>
            )}
            
            {selectedTicket && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography>
                    <strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {selectedTicket.status.replace('-', ' ').toUpperCase()}
                  </Typography>
                  {selectedTicket.assignedTo && (
                    <Typography>
                      <strong>Assigned To:</strong> {getEntityName(selectedTicket.assignedTo)}
                    </Typography>
                  )}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {selectedTicket ? 'Close' : 'Cancel'}
          </Button>
          {(!selectedTicket || user?.role === 'ADMIN' || user?.role === 'TECHNICIAN') && (
            <Button onClick={handleSubmit} variant="contained" disabled={loading}>
              {selectedTicket ? 'Update' : user?.role === 'TECHNICIAN' ? 'Submit Report' : 'Create'} Ticket
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog
        open={imagePreviewOpen}
        onClose={handleCloseImagePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Ticket Image</Typography>
          <IconButton onClick={handleCloseImagePreview}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              bgcolor: '#f5f5f5',
              borderRadius: 2,
              p: 2
            }}
          >
            {previewImageUrl && (
              <img
                src={previewImageUrl}
                alt="Ticket"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImagePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TicketList;