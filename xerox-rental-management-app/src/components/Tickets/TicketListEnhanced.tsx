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
  Fade,
  CircularProgress,
  Avatar,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Add,
  Visibility,
  Search,
  Delete,
  Close,
  Image as ImageIcon,
  CloudUpload,
  Assignment,
  Engineering,
  Person,
  CalendarToday,
  Flag,
  CheckCircle,
  PlayArrow,
  Business,
  TaskAlt
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Ticket, type Machine, type User } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';

const TicketListEnhanced: React.FC = () => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Ticket['priority'],
    machineId: '',
    ownerId: '',
    technicianId: ''
  });

  useEffect(() => {
    loadTickets();
    loadMachines();
    loadUsers();
  }, [user?.id]);

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const data: Ticket[] = await apiService.getTickets(user?.id, user?.role);
      setTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError('Failed to load tickets. Please try again.');
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

      // Filter owners based on user role
      if (user?.role === 'RENTAL' && user?.ownerId) {
        // Rental users only see their owner
        const ownersList = data.filter(u => u.role === 'OWNER' && u.id === user.ownerId);
        setOwners(ownersList);
      } else {
        // Admin and others see all owners
        const ownersList = data.filter(u => u.role === 'OWNER');
        setOwners(ownersList);
      }

      // Filter technicians based on user role
      if (user?.role === 'OWNER') {
        // Owners only see their own technicians
        const techList = data.filter(u =>
          u.role === 'TECHNICIAN' && u.ownerId === user.id
        );
        setTechnicians(techList);
      } else if (user?.role === 'ADMIN') {
        // Admin sees all technicians
        const techList = data.filter(u => u.role === 'TECHNICIAN');
        setTechnicians(techList);
      } else if (user?.role === 'RENTAL' && user?.ownerId) {
        // Rental users see technicians of their owner
        const techList = data.filter(u =>
          u.role === 'TECHNICIAN' && u.ownerId === user.ownerId?.toString()
           
        );
        console.log("Technicians for Rental’s Owner:", techList);
        setTechnicians(techList);
      }
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
        machineId: ticket.machine?.id || '',
        ownerId: '',
        technicianId: ticket.assignedTo?.id || ''
      });
      if (ticket.imageUrl) {
        const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8080/api';
        let fullUrl = ticket.imageUrl;
      
        if (ticket.imageUrl.startsWith('http')) {
          fullUrl = ticket.imageUrl;
        } else if (ticket.imageUrl.startsWith('/api/')) {
          fullUrl = `${baseUrl}${ticket.imageUrl.replace(/^\/api/, '')}`;
        } else if (ticket.imageUrl.startsWith('/')) {
          fullUrl = `${baseUrl}${ticket.imageUrl}`;
        } else {
          fullUrl = `${baseUrl}/tickets/image/${ticket.imageUrl}`;
        }
      
        
        setPreviewImageUrl(fullUrl);
      }
      
    } else {
      setSelectedTicket(null);
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        machineId: '',
        ownerId: user?.role === 'RENTAL' && user?.ownerId ? user.ownerId : '',
        technicianId: ''
      });
      setImageFile(null);
      setImagePreview('');
      setPreviewImageUrl('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTicket(null);
    setImageFile(null);
    setImagePreview('');
    setPreviewImageUrl('');
    setError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (!formData.title || !formData.description) {
        setError('Title and description are required');
        setLoading(false);
        return;
      }

      if (selectedTicket) {
        await apiService.updateTicket(selectedTicket.id, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          machineId: formData.machineId,
          assignedToId: formData.technicianId
        });
      } else {
        // Determine ownerId
        let ownerId = '';
        if (user?.role === 'RENTAL' && user?.ownerId) {
          ownerId = user.ownerId;
        } else if (user?.role === 'RENTAL' && formData.ownerId) {
          ownerId = formData.ownerId;
        } else if (user?.role === 'OWNER') {
          ownerId = user.id;
        } else if (formData.ownerId) {
          ownerId = formData.ownerId;
        }

        if (!ownerId) {
          setError('Owner ID is required');
          setLoading(false);
          return;
        }

        // Create ticket with image using API service
        await apiService.createTicketWithImage({
          title: formData.title,
          description: formData.description,
          priority: formData.priority.toUpperCase(),
          createdById: user!.id,
          ownerId: ownerId,
          machineId: formData.machineId,
          image: imageFile || undefined
        });
      }

      await loadTickets();
      handleCloseDialog();

      createNotification({
        type: 'success',
        title: selectedTicket ? 'Ticket Updated' : 'Ticket Created',
        message: selectedTicket ? 'Ticket has been updated successfully' : 'Ticket has been created successfully',
        priority: 'MEDIUM'
      });
    } catch (error: any) {
      console.error('Error saving ticket:', error);
      setError(error.response?.data?.message || error.message || 'Failed to save ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToTechnician = async (ticketId: string, technicianId: string) => {
    if (!technicianId || !user?.id) return;

    try {
      await apiService.assignTicketToTechnician(ticketId, technicianId, user.id);
      await loadTickets();
      createNotification({
        type: 'success',
        title: 'Ticket Assigned',
        message: 'Technician has been assigned successfully',
        priority: 'LOW'
      });
    } catch (error: any) {
      console.error('Assignment failed:', error);
      setError(error.response?.data?.message || 'Failed to assign technician');
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
      createNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Ticket marked as ${status}`,
        priority: ''
      });
    } catch (error) {
      console.error('Error changing ticket status:', error);
      setError('Failed to change ticket status. Please try again.');
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketStatus: string) => {
    // Only owners can delete closed tickets, admins can delete any
    if (user?.role === 'OWNER' && ticketStatus !== 'CLOSED') {
      setError('Only closed tickets can be deleted');
      return;
    }

    // Rental and Technician cannot delete tickets
    if (user?.role === 'RENTAL' || user?.role === 'TECHNICIAN') {
      setError('You do not have permission to delete tickets');
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

  // Log the raw URL coming from backend
  console.log("Raw imageUrl from ticket:", imageUrl);

  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8080/api';

  // Normalize URL to always be absolute
  let fullUrl = imageUrl;

  if (imageUrl.startsWith('http')) {
    // already a full URL
    fullUrl = imageUrl;
  } else if (imageUrl.startsWith('/api/')) {
    // backend serves /api prefix
    fullUrl = `${baseUrl}${imageUrl.replace(/^\/api/, '')}`;
  } else if (imageUrl.startsWith('/')) {
    // general relative path
    fullUrl = `${baseUrl}${imageUrl}`;
  } else {
    // filename only
    fullUrl = `${baseUrl}/tickets/image/${imageUrl}`;
  }



  setPreviewImageUrl(fullUrl);
  setImagePreviewOpen(true);
};


  const handleCloseImagePreview = () => {
    setImagePreviewOpen(false);
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

  const getEntityName = (entity: any) => {
    if (!entity) return 'N/A';
    return typeof entity === 'string' ? entity : entity.name || entity.email || `ID: ${entity.id}`;
  };

  const canCreateTicket = () => {
    return user?.role === 'RENTAL' || user?.role === 'OWNER' || user?.role === 'ADMIN';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Fade in={true}>
        <Card elevation={3} sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Support Tickets
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {user?.role === 'RENTAL' && 'Create and track your support requests'}
                  {user?.role === 'OWNER' && 'Manage tickets from your customers'}
                  {user?.role === 'TECHNICIAN' && 'View and update assigned tickets'}
                  {user?.role === 'ADMIN' && 'Manage all support tickets'}
                </Typography>
              </Box>
              {canCreateTicket() && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                  sx={{
                    bgcolor: 'white',
                    color: '#667eea',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  Create Ticket
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Fade>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search tickets by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ticket</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  {(user?.role === 'OWNER' || user?.role === 'TECHNICIAN') && (
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Image</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 'bold' }}>Created By</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Machine</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={(user?.role === 'OWNER' || user?.role === 'TECHNICIAN') ? 9 : 8}
                      sx={{ textAlign: 'center', py: 8 }}
                    >
                      <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No tickets found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Try adjusting your search' : 'Create your first ticket to get started'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {ticket.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {ticket.description.length > 50
                              ? ticket.description.substring(0, 50) + '...'
                              : ticket.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<Flag />}
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
                      {(user?.role === 'OWNER' || user?.role === 'TECHNICIAN') && (
                        <TableCell align="center">
                          {ticket.imageUrl ? (
                            <Tooltip title="Click to view full image">
                              <IconButton
                                onClick={() => handleImagePreview(ticket.imageUrl!)}
                                color="primary"
                                sx={{
                                  bgcolor: 'primary.light',
                                  '&:hover': { bgcolor: 'primary.main', color: 'white' }
                                }}
                              >
                                <ImageIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No Image
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea' }}>
                            {getEntityName(ticket.createdBy).charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{getEntityName(ticket.createdBy)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {ticket.assignedTo ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#764ba2' }}>
                              {getEntityName(ticket.assignedTo).charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{getEntityName(ticket.assignedTo)}</Typography>
                          </Box>
                        ) : (
                          <Chip label="Unassigned" variant="outlined" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {ticket.machine ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Business sx={{ fontSize: 20, color: 'text.secondary' }} />
                            <Typography variant="body2">{getEntityName(ticket.machine)}</Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="View Details">
                            <IconButton onClick={() => handleOpenDialog(ticket)} size="small" color="primary">
                              <Visibility />
                            </IconButton>
                          </Tooltip>

                          {ticket.imageUrl && (
                            <Tooltip title="View Image">
                              <IconButton
                                onClick={() => handleImagePreview(ticket.imageUrl!)}
                                size="small"
                                color="secondary"
                              >
                                <ImageIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          

{(user?.role === 'OWNER' || user?.role === 'ADMIN') &&
  ticket.status === 'OPEN' && 
  !ticket.assignedTo && (
  <FormControl size="small" sx={{ minWidth: 140 }}>
    <Select
      displayEmpty
      value=""
      onChange={(e) => {
        const techId = e.target.value as string;
        if (techId && user?.id) {
          handleAssignToTechnician(ticket.id, techId);
        }
      }}
      renderValue={() => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Engineering fontSize="small" />
          <span style={{ fontSize: '0.85rem' }}>Assign technician...</span>
        </Box>
      )}
    >
      <MenuItem value="" disabled>
        Choose technician
      </MenuItem>

      {/* Critical Fix: Filter technicians by the TICKET'S ownerId */}
      {users
        .filter(u => 
          u.role === 'TECHNICIAN' && 
          u.ownerId === ticket.ownerId // This is the key!
        )
        .map(tech => (
          <MenuItem key={tech.id} value={tech.id}>
            {tech.name || tech.email}
          </MenuItem>
        ))}

      {/* Optional: Show message if no technicians */}
      {users.filter(u => u.role === 'TECHNICIAN' && u.ownerId === ticket.ownerId).length === 0 && (
        <MenuItem disabled>No technicians available</MenuItem>
      )}
    </Select>
  </FormControl>
)}

                          {/* Technician Actions – FIXED & WORKING */}
{user?.role === 'TECHNICIAN' && 
  ticket.assignedTo && 
  String(ticket.assignedTo.id || ticket.assignedTo).trim() === String(user.id).trim() && (
  <>
    {/* Start Work */}
    {ticket.status === 'OPEN' && (
      <Tooltip title="Start Work">
        <IconButton
          onClick={() => handleStatusChange(ticket.id, 'IN-PROGRESS')}
          size="small"
          color="warning"
          sx={{ bgcolor: 'warning.light', color: 'white' }}
        >
          <PlayArrow />
        </IconButton>
      </Tooltip>
    )}

    {/* Mark Resolved */}
    {ticket.status === 'IN-PROGRESS' && (
      <Tooltip title="Mark Resolved">
        <IconButton
          onClick={() => handleStatusChange(ticket.id, 'RESOLVED')}
          size="small"
          color="success"
          sx={{ bgcolor: 'success.light', color: 'white' }}
        >
          <CheckCircle />
        </IconButton>
      </Tooltip>
    )}
  </>
)}
{/* Owner/Admin: CLOSE when RESOLVED ← THIS WAS MISSING! */}
{(user?.role === 'OWNER' || user?.role === 'ADMIN') && 
     ticket.status === 'RESOLVED' && (
      <Tooltip title="Close Ticket">
        <IconButton 
          size="small" 
          color="primary"
          sx={{ bgcolor: 'primary.light', color: 'white' }}
          onClick={() => handleStatusChange(ticket.id, 'CLOSED')}
        >
          <TaskAlt />
        </IconButton>
      </Tooltip>
    )}

                          {(user?.role === 'OWNER' || user?.role === 'ADMIN') && ticket.status === 'CLOSED' && (
                            <Tooltip title="Delete Ticket">
                              <IconButton
                                onClick={() => handleDeleteTicket(ticket.id, ticket.status)}
                                size="small"
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#667eea', color: 'white' }}>
          {selectedTicket ? 'Ticket Details' : 'Create Support Ticket'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={!!selectedTicket}
                required
              />
            </Grid>

            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!!selectedTicket}
                multiline
                rows={4}
                required
              />
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <FormControl fullWidth disabled={!!selectedTicket}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Ticket['priority'] })}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <FormControl fullWidth disabled={!!selectedTicket}>
                <InputLabel>Machine</InputLabel>
                <Select
                  value={formData.machineId}
                  label="Machine"
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {machines.map(machine => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.name} ({machine.serialNumber})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {user?.role === 'RENTAL' && !selectedTicket && (
              <Grid size={{xs:12}}>
                <FormControl fullWidth required>
                  <InputLabel>Assign to Owner</InputLabel>
                  <Select
                    value={formData.ownerId}
                    label="Assign to Owner"
                    onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  >
                    {user.ownerId ? (
                      <MenuItem value={user.ownerId}>
                        {owners.find(o => o.id === user.ownerId)?.name || 'My Owner'}
                      </MenuItem>
                    ) : (
                      owners.map(owner => (
                        <MenuItem key={owner.id} value={owner.id}>{owner.name}</MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {(user?.role === 'OWNER' || user?.role === 'ADMIN') && !selectedTicket && (
              <Grid size={{xs:12}}>
                <FormControl fullWidth>
                  <InputLabel>Assign to Technician (Optional)</InputLabel>
                  <Select
                    value={formData.technicianId}
                    label="Assign to Technician (Optional)"
                    onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {technicians.map(tech => (
                      <MenuItem key={tech.id} value={tech.id}>{tech.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {!selectedTicket && (
              <Grid size={{xs:12}}>
              <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <input
                  accept="image/*;capture=camera"
                  style={{ display: 'none' }}
                  id="ticket-image-upload"
                  type="file"
                  capture="environment"   // 👈 CAMERA CAPTURE
                  onChange={handleImageChange}
                />
                <label htmlFor="ticket-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                  >
                    Capture / Upload Image
                  </Button>
                </label>
            
                {imagePreview && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Grid>
            
            )}

            {selectedTicket && previewImageUrl && (
              <Grid size={{xs:12}}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Attached Image</Typography>
                  <img
                    src={previewImageUrl}
                    alt="Ticket"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      objectFit: 'contain',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleImagePreview(selectedTicket.imageUrl!)}
                  />
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {!selectedTicket && (
            <Button onClick={handleSubmit} variant="contained" disabled={loading}>
              Create Ticket
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

export default TicketListEnhanced;
