import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, Alert, Fade, CircularProgress,
  Avatar, Tooltip, Stack
} from '@mui/material';
import {
  Add, Visibility, Search, Delete, Close,
  Image as ImageIcon, CloudUpload, Assignment,
  Engineering, CalendarToday, Flag,
  CheckCircle, PlayArrow, Business, TaskAlt
} from '@mui/icons-material';
import imageCompression from 'browser-image-compression';

import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Ticket, type Machine, type User } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';
import TicketResolutionDialog from './TicketResolutionDialog';

// ─── URL helpers ──────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api')
  .replace(/\/$/, '');

/**
 * Builds the full URL for the problem image (uploaded when ticket was created).
 */
const getProblemImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.startsWith('/api/')) return `${BASE_URL}${imageUrl.replace(/^\/api/, '')}`;
  if (imageUrl.startsWith('/'))    return `${BASE_URL}${imageUrl}`;
  // filename only — use the /tickets/image/{filename} endpoint
  return `${BASE_URL}/tickets/image/${imageUrl}`;
};

/**
 * ✅ FIX: Builds the full URL for the resolution image.
 *   The filename is stored on ticket.resolutionImageFileName.
 *   The backend endpoint is GET /api/tickets/resolution-image/{filename}
 */
const getResolutionImageUrl = (filename: string): string => {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${BASE_URL}/tickets/resolution-image/${filename}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const TicketListEnhanced: React.FC = () => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();

  const [tickets,     setTickets]     = useState<Ticket[]>([]);
  const [machines,    setMachines]    = useState<Machine[]>([]);
  const [users,       setUsers]       = useState<User[]>([]);
  const [owners,      setOwners]      = useState<User[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);

  const [searchTerm,        setSearchTerm]        = useState('');
  const [openDialog,        setOpenDialog]        = useState(false);
  const [selectedTicket,    setSelectedTicket]    = useState<Ticket | null>(null);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState('');
  const [openResolveDialog, setOpenResolveDialog] = useState(false);
  const [actionTicket,      setActionTicket]      = useState<Ticket | null>(null);

  const [imageFile,         setImageFile]         = useState<File | null>(null);
  const [imagePreview,      setImagePreview]      = useState('');
  const [imagePreviewOpen,  setImagePreviewOpen]  = useState(false);
  const [previewImageUrl,   setPreviewImageUrl]   = useState('');

  const [formData, setFormData] = useState({
    title:       '',
    description: '',
    priority:    'MEDIUM' as Ticket['priority'],
    machineId:   '',
    ownerId:     '',
    technicianId: ''
  });

  // ── Data loading ─────────────────────────────────────────────────────────

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
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMachines = async () => {
    try {
      setMachines(await apiService.getMachines());
    } catch (err) {
      console.error('Error loading machines:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const data: User[] = await apiService.getUsers();
      setUsers(data);

      // Owners
      if (user?.role === 'RENTAL' && user?.ownerId) {
        setOwners(data.filter(u => u.role === 'OWNER' && u.id === user.ownerId));
      } else {
        setOwners(data.filter(u => u.role === 'OWNER'));
      }

      // Technicians
      if (user?.role === 'OWNER') {
        setTechnicians(data.filter(u => u.role === 'TECHNICIAN' && u.ownerId === user.id));
      } else if (user?.role === 'ADMIN') {
        setTechnicians(data.filter(u => u.role === 'TECHNICIAN'));
      } else if (user?.role === 'RENTAL' && user?.ownerId) {
        setTechnicians(data.filter(u =>
          u.role === 'TECHNICIAN' && u.ownerId === user.ownerId?.toString()
        ));
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  // ── Dialog open/close ─────────────────────────────────────────────────────

  const handleOpenDialog = (ticket?: Ticket) => {
    if (ticket) {
      setSelectedTicket(ticket);
      setFormData({
        title:        ticket.title,
        description:  ticket.description,
        priority:     ticket.priority,
        machineId:    ticket.machine?.id?.toString() || '',
        ownerId:      '',
        technicianId: ticket.assignedTo?.id?.toString() || ''
      });
      // Show existing problem image in dialog
      if (ticket.imageUrl) {
        setPreviewImageUrl(getProblemImageUrl(ticket.imageUrl));
      } else {
        setPreviewImageUrl('');
      }
    } else {
      setSelectedTicket(null);
      setFormData({
        title: '', description: '', priority: 'MEDIUM', machineId: '',
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

  // ── Image pick / compress ─────────────────────────────────────────────────

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setError('No file selected'); return; }
    if (file.size === 0) { setError('Captured image is empty'); return; }
    if (file.type === 'image/heic' || file.name.endsWith('.heic')) {
      setError('HEIC not supported. Use JPG/PNG'); return;
    }
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true
      });
      setImageFile(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(compressed);
    } catch {
      setError('Image compression failed');
    }
  };

  // ── Form submit (create / update) ─────────────────────────────────────────

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
          title:       formData.title,
          description: formData.description,
          priority:    formData.priority,
          machineId:   formData.machineId,
          assignedToId: formData.technicianId
        });
      } else {
        let ownerId = '';
        if      (user?.role === 'RENTAL' && user?.ownerId) ownerId = user.ownerId;
        else if (user?.role === 'OWNER')                   ownerId = user.id;
        else if (formData.ownerId)                         ownerId = formData.ownerId;

        if (!ownerId) { setError('Owner ID is required'); setLoading(false); return; }

        await apiService.createTicketWithImage({
          title:       formData.title,
          description: formData.description,
          priority:    formData.priority.toUpperCase(),
          createdById: user!.id,
          ownerId,
          machineId:   formData.machineId,
          image:       imageFile || undefined
        });
      }

      await loadTickets();
      handleCloseDialog();
      createNotification({
        type: 'success',
        title:   selectedTicket ? 'Ticket Updated' : 'Ticket Created',
        message: selectedTicket ? 'Ticket updated successfully' : 'Ticket created successfully',
        priority: 'MEDIUM'
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save ticket');
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleAssignToTechnician = async (ticketId: string, technicianId: string) => {
    if (!technicianId || !user?.id) return;
    try {
      await apiService.assignTicketToTechnician(ticketId, technicianId, user.id);
      await loadTickets();
      createNotification({ type: 'success', title: 'Assigned', message: 'Technician assigned', priority: 'LOW' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign');
    }
  };

  const handleStatusChange = async (ticketId: string, status: Ticket['status']) => {
    try {
      if (status === 'RESOLVED') await apiService.resolveTicket(ticketId);
      else if (status === 'CLOSED') await apiService.closeTicket(ticketId);
      await loadTickets();
      createNotification({ type: 'success', title: 'Status Updated', message: `Ticket ${status}`, priority: '' });
    } catch {
      setError('Failed to change status');
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketStatus: string) => {
    if (user?.role === 'RENTAL' || user?.role === 'TECHNICIAN') {
      setError('You do not have permission to delete tickets'); return;
    }
    if (user?.role === 'OWNER' && ticketStatus !== 'CLOSED') {
      setError('Only closed tickets can be deleted'); return;
    }
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    try {
      await apiService.deleteTicket(ticketId, user!.id, user!.role);
      await loadTickets();
      createNotification({ type: 'success', title: 'Deleted', message: 'Ticket deleted', priority: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  // ── Image preview modal ───────────────────────────────────────────────────

  const handleImagePreview = (url: string) => {
    if (!url) return;
    setPreviewImageUrl(url);
    setImagePreviewOpen(true);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const filteredTickets = tickets.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'OPEN':        return 'error';
     
      case 'IN-PROGRESS': return 'warning';
      case 'RESOLVED':    return 'info';
      case 'CLOSED':      return 'success';
      default:            return 'default';
    }
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'HIGH':   return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW':    return 'success';
      default:       return 'default';
    }
  };

  const getEntityName = (entity: any) => {
    if (!entity) return 'N/A';
    return typeof entity === 'string' ? entity : entity.name || entity.email || `ID: ${entity.id}`;
  };

  const canCreateTicket = () =>
    ['RENTAL', 'OWNER', 'ADMIN'].includes(user?.role || '');

  const isMyTicket = (ticket: Ticket) =>
    String(ticket.assignedTo?.id ?? ticket.assignedTo).trim() === String(user?.id).trim();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3 }}>

      {/* Header */}
      <Fade in>
        <Card elevation={3} sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Support Tickets
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {user?.role === 'RENTAL'     && 'Create and track your support requests'}
                  {user?.role === 'OWNER'      && 'Manage tickets from your customers'}
                  {user?.role === 'TECHNICIAN' && 'View and update assigned tickets'}
                  {user?.role === 'ADMIN'      && 'Manage all support tickets'}
                </Typography>
              </Box>
              {canCreateTicket() && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                  sx={{
                    bgcolor: 'white', color: '#667eea',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)', transform: 'translateY(-2px)' },
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

      {/* Table */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search tickets by title or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Resolution</TableCell>
                  {(user?.role === 'OWNER' || user?.role === 'TECHNICIAN') && (
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Problem Image</TableCell>
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
                      colSpan={(user?.role === 'OWNER' || user?.role === 'TECHNICIAN') ? 10 : 9}
                      sx={{ textAlign: 'center', py: 8 }}
                    >
                      <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">No tickets found</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Try adjusting your search' : 'Create your first ticket'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map(ticket => (
                    <TableRow key={ticket.id} hover>

                      {/* Title + description */}
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {ticket.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ticket.description.length > 50
                            ? ticket.description.substring(0, 50) + '...'
                            : ticket.description}
                        </Typography>
                      </TableCell>

                      {/* Priority */}
                      <TableCell>
                        <Chip icon={<Flag />} label={ticket.priority} color={getPriorityColor(ticket.priority)} size="small" />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={ticket.status.replace('_', ' ')}
                          color={getStatusColor(ticket.status)}
                          size="small"
                        />
                      </TableCell>

                      {/* ✅ FIX: Resolution column — shows notes + resolution image thumbnail */}
                      <TableCell sx={{ minWidth: 160 }}>
                        {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
                          <Box>
                            {/* Resolution notes */}
                            <Typography variant="caption" color="text.secondary" display="block">
                              {ticket.resolutionNotes || 'No notes'}
                            </Typography>

                            {/* ✅ FIX: Resolution image thumbnail
                                ticket.resolutionImageFileName comes from TicketResponse DTO
                                getResolutionImageUrl() builds the correct backend URL */}
                            {ticket.resolutionImageFileName ? (
                              <Box sx={{ mt: 0.5 }}>
                                <img
                                  src={getResolutionImageUrl(ticket.resolutionImageFileName)}
                                  alt="Resolution"
                                  style={{
                                    width: 56, height: 56,
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    border: '2px solid #e0e0e0'
                                  }}
                                  onClick={() =>
                                    handleImagePreview(
                                      getResolutionImageUrl(ticket.resolutionImageFileName!)
                                    )
                                  }
                                  onError={e => {
                                    // Hide broken image instead of showing broken icon
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    console.error('Could not load resolution image:',
                                      getResolutionImageUrl(ticket.resolutionImageFileName!));
                                  }}
                                />
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                No image
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>

                      {/* Problem image (OWNER / TECHNICIAN only) */}
                      {(user?.role === 'OWNER' || user?.role === 'TECHNICIAN') && (
                        <TableCell align="center">
                          {ticket.imageUrl ? (
                            <Tooltip title="View problem image">
                              <IconButton
                                onClick={() => handleImagePreview(getProblemImageUrl(ticket.imageUrl!))}
                                color="primary"
                                sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                              >
                                <ImageIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">No Image</Typography>
                          )}
                        </TableCell>
                      )}

                      {/* Created by */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea' }}>
                            {getEntityName(ticket.createdBy).charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{getEntityName(ticket.createdBy)}</Typography>
                        </Box>
                      </TableCell>

                      {/* Assigned to */}
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

                      {/* Machine */}
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

                      {/* Date */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">

                          {/* View details */}
                          <Tooltip title="View Details">
                            <IconButton onClick={() => handleOpenDialog(ticket)} size="small" color="primary">
                              <Visibility />
                            </IconButton>
                          </Tooltip>

                          {/* View problem image */}
                          {ticket.imageUrl && (
                            <Tooltip title="View Problem Image">
                              <IconButton
                                onClick={() => handleImagePreview(getProblemImageUrl(ticket.imageUrl!))}
                                size="small" color="secondary"
                              >
                                <ImageIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Assign technician (OWNER / ADMIN, OPEN, unassigned) */}
                          {(user?.role === 'OWNER' || user?.role === 'ADMIN') &&
                           ticket.status === 'OPEN' &&
                           !ticket.assignedTo && (
                            <FormControl size="small" sx={{ minWidth: 155 }}>
                              <Select
                                displayEmpty
                                value=""
                                onChange={e => {
                                  const techId = e.target.value as string;
                                  if (techId) handleAssignToTechnician(ticket.id, techId);
                                }}
                                renderValue={() => (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Engineering fontSize="small" />
                                    <span style={{ fontSize: '0.82rem' }}>Assign technician…</span>
                                  </Box>
                                )}
                              >
                                <MenuItem value="" disabled>Choose technician</MenuItem>
                                {users
                                  .filter(u => u.role === 'TECHNICIAN' && u.ownerId === ticket.ownerId)
                                  .map(tech => (
                                    <MenuItem key={tech.id} value={tech.id}>
                                      {tech.name || tech.email}
                                    </MenuItem>
                                  ))}
                                {users.filter(u => u.role === 'TECHNICIAN' && u.ownerId === ticket.ownerId).length === 0 && (
                                  <MenuItem disabled>No technicians available</MenuItem>
                                )}
                              </Select>
                            </FormControl>
                          )}

                          {/* Technician: Start Work */}
                          {user?.role === 'TECHNICIAN' && isMyTicket(ticket) && ticket.status === 'OPEN' && (
                            <Tooltip title="Start Work">
                              <IconButton
                                onClick={() => handleStatusChange(ticket.id, 'IN-PROGRESS')}
                                size="small" color="warning"
                                sx={{ bgcolor: 'warning.light', color: 'white' }}
                              >
                                <PlayArrow />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Technician: Mark Resolved (opens resolution dialog) */}
                          {user?.role === 'TECHNICIAN' && isMyTicket(ticket) &&
                           (ticket.status === 'IN-PROGRESS' || ticket.status === 'IN_PROGRESS') && (
                            <Tooltip title="Mark Resolved">
                              <IconButton
                                onClick={() => { setActionTicket(ticket); setOpenResolveDialog(true); }}
                                size="small" color="success"
                                sx={{ bgcolor: 'success.light', color: 'white' }}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Owner / Admin: Close when RESOLVED */}
                          {(user?.role === 'OWNER' || user?.role === 'ADMIN') &&
                           ticket.status === 'RESOLVED' && (
                            <Tooltip title="Close Ticket">
                              <IconButton
                                onClick={() => handleStatusChange(ticket.id, 'CLOSED')}
                                size="small" color="primary"
                                sx={{ bgcolor: 'primary.light', color: 'white' }}
                              >
                                <TaskAlt />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Owner / Admin: Delete CLOSED ticket */}
                          {(user?.role === 'OWNER' || user?.role === 'ADMIN') &&
                           ticket.status === 'CLOSED' && (
                            <Tooltip title="Delete Ticket">
                              <IconButton
                                onClick={() => handleDeleteTicket(ticket.id, ticket.status)}
                                size="small" color="error"
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

      {/* ── Create / View dialog ─────────────────────────────────────────── */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#667eea', color: 'white' }}>
          {selectedTicket ? 'Ticket Details' : 'Create Support Ticket'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth label="Title" value={formData.title} required
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                disabled={!!selectedTicket}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth label="Description" multiline rows={4}
                value={formData.description} required
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                disabled={!!selectedTicket}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth disabled={!!selectedTicket}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority} label="Priority"
                  onChange={e => setFormData({ ...formData, priority: e.target.value as Ticket['priority'] })}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth disabled={!!selectedTicket}>
                <InputLabel>Machine</InputLabel>
                <Select
                  value={formData.machineId} label="Machine"
                  onChange={e => setFormData({ ...formData, machineId: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {machines.map(m => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name} ({m.serialNumber})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {user?.role === 'RENTAL' && !selectedTicket && (
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required>
                  <InputLabel>Assign to Owner</InputLabel>
                  <Select
                    value={formData.ownerId} label="Assign to Owner"
                    onChange={e => setFormData({ ...formData, ownerId: e.target.value })}
                  >
                    {user.ownerId ? (
                      <MenuItem value={user.ownerId}>
                        {owners.find(o => o.id === user.ownerId)?.name || 'My Owner'}
                      </MenuItem>
                    ) : (
                      owners.map(o => (
                        <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {(user?.role === 'OWNER' || user?.role === 'ADMIN') && !selectedTicket && (
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Assign to Technician (Optional)</InputLabel>
                  <Select
                    value={formData.technicianId}
                    label="Assign to Technician (Optional)"
                    onChange={e => setFormData({ ...formData, technicianId: e.target.value })}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {technicians.map(t => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Camera / file upload (new ticket only) */}
            {!selectedTicket && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                  <input
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    id="ticket-image-upload"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="ticket-image-upload">
                    <Button variant="outlined" component="span" startIcon={<CloudUpload />}>
                      Capture / Upload Image
                    </Button>
                  </label>
                  {imagePreview && (
                    <Box sx={{ mt: 2 }}>
                      <img src={imagePreview} alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain' }}
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
            )}

            {/* Existing problem image (view mode) */}
            {selectedTicket && previewImageUrl && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Problem Image</Typography>
                  <img
                    src={previewImageUrl} alt="Ticket"
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain', cursor: 'pointer' }}
                    onClick={() => handleImagePreview(previewImageUrl)}
                  />
                </Paper>
              </Grid>
            )}

            {/* ✅ FIX: Show resolution image + notes in view/edit dialog */}
            {selectedTicket && (selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'success.dark' }}>
                    Resolution Details
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {selectedTicket.resolutionNotes || 'No notes provided'}
                  </Typography>
                  {selectedTicket.resolutionImageFileName && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Resolution image:
                      </Typography>
                      <img
                        src={getResolutionImageUrl(selectedTicket.resolutionImageFileName)}
                        alt="Resolution"
                        style={{
                          maxWidth: '100%', maxHeight: 200,
                          borderRadius: 8, objectFit: 'contain', cursor: 'pointer'
                        }}
                        onClick={() =>
                          handleImagePreview(
                            getResolutionImageUrl(selectedTicket.resolutionImageFileName!)
                          )
                        }
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}

          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {!selectedTicket && (
            <Button onClick={handleSubmit} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Create Ticket'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Image preview modal ──────────────────────────────────────────── */}
      <Dialog open={imagePreviewOpen} onClose={() => setImagePreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Image Preview</Typography>
          <IconButton onClick={() => setImagePreviewOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            minHeight: 400, bgcolor: '#f5f5f5', borderRadius: 2, p: 2
          }}>
            {previewImageUrl && (
              <img
                src={previewImageUrl} alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImagePreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Resolve dialog ───────────────────────────────────────────────── */}
      <TicketResolutionDialog
        open={openResolveDialog}
        onClose={() => setOpenResolveDialog(false)}
        ticket={actionTicket}
        onSuccess={() => { setOpenResolveDialog(false); loadTickets(); }}
      />

    </Box>
  );
};

export default TicketListEnhanced;
