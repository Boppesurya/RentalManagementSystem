import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, CircularProgress, Alert,
  Grid, Typography, Chip
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, CheckCircle } from '@mui/icons-material';
import imageCompression from 'browser-image-compression';
import type { Ticket } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface TicketResolutionDialogProps {
  open: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ✅ Only these MIME types are allowed — PDF and other files are blocked
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS  = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const TicketResolutionDialog: React.FC<TicketResolutionDialogProps> = ({
  open, ticket, onClose, onSuccess
}) => {
  const { user } = useAuth();

  const [resolutionNotes,        setResolutionNotes]        = useState('');
  const [resolutionImage,        setResolutionImage]        = useState<File | null>(null);
  const [resolutionImagePreview, setResolutionImagePreview] = useState('');
  const [loading,                setLoading]                = useState(false);
  const [error,                  setError]                  = useState('');

  // ── Image validation + compress ───────────────────────────────────────────

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Block empty files (Android camera bug)
    if (file.size === 0) {
      setError('Captured image is empty. Please try again.');
      e.target.value = ''; // reset input
      return;
    }

    // ✅ Block PDFs and non-image files by MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(
        `"${file.name}" is not a valid image. ` +
        `Only JPG, PNG, GIF and WEBP are allowed. PDFs cannot be uploaded here.`
      );
      e.target.value = '';
      return;
    }

    // ✅ Block by extension as a second check (catches edge cases)
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`File extension "${ext}" is not allowed. Use JPG or PNG.`);
      e.target.value = '';
      return;
    }

    // ✅ Block HEIC — not supported by most backends without conversion
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      setError('HEIC format is not supported. Please use JPG or PNG.');
      e.target.value = '';
      return;
    }

    // ✅ Block files over 10MB before compression
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large (max 10 MB before compression).');
      e.target.value = '';
      return;
    }

    setError('');

    try {
      // Compress to max 1MB / 1024px — same as problem image upload
      const compressed = await imageCompression(file, {
        maxSizeMB:        1,
        maxWidthOrHeight: 1024,
        useWebWorker:     true,
      });

      console.log(
        `✅ Compressed: ${(file.size / 1024 / 1024).toFixed(2)} MB` +
        ` → ${(compressed.size / 1024 / 1024).toFixed(2)} MB`
      );

      setResolutionImage(compressed);

      const reader = new FileReader();
      reader.onloadend = () => setResolutionImagePreview(reader.result as string);
      reader.readAsDataURL(compressed);

    } catch (err) {
      console.error('Compression error:', err);
      setError('Image compression failed. Please try a different image.');
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleResolveTicket = async () => {
    if (!ticket || !user?.id) {
      setError('Missing ticket or user information.');
      return;
    }
    if (!resolutionNotes.trim()) {
      setError('Resolution notes are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Safely extract ticket ID whether it's a plain value or nested object
      const ticketId =
        typeof ticket.id === 'object' && ticket.id !== null
          ? (ticket.id as any).id
          : ticket.id;

      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api')
        .replace(/\/$/, '');

      const formData = new FormData();
      formData.append('resolutionNotes',  resolutionNotes.trim());
      formData.append('resolvedByUserId', String(user.id));

      if (resolutionImage) {
        formData.append('resolutionImage', resolutionImage);
        console.log('📎 Attaching image:', resolutionImage.name, resolutionImage.type);
      }

      console.log(`🔄 Resolving ticket ${ticketId} by user ${user.id}`);

      const response = await fetch(
        `${baseUrl}/tickets/${ticketId}/resolve-with-details`,
        {
          method: 'POST',
          body:   formData,
          // ✅ Do NOT set Content-Type manually — browser sets multipart boundary automatically
        }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Server error ${response.status}: ${errText}`);
      }

      console.log('✅ Ticket resolved successfully');
      handleClose();
      onSuccess(); // tells parent to refresh ticket list

    } catch (err: any) {
      console.error('❌ Resolve error:', err);
      setError(err.message || 'Failed to resolve ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset + close ─────────────────────────────────────────────────────────

  const handleClose = () => {
    if (loading) return; // block close while submitting
    setResolutionNotes('');
    setResolutionImage(null);
    setResolutionImagePreview('');
    setError('');
    onClose();
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':   return 'error'   as const;
      case 'MEDIUM': return 'warning' as const;
      case 'LOW':    return 'success' as const;
      default:       return 'default' as const;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>

      <DialogTitle sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 'bold' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle />
          Resolve Ticket
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={2}>

          {/* Ticket summary */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                {ticket?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {ticket?.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip
                  label={ticket?.priority?.toUpperCase()}
                  size="small"
                  color={getPriorityColor(ticket?.priority)}
                />
                <Typography variant="caption" color="text.secondary">
                  Created by:{' '}
                  {typeof ticket?.createdBy === 'object'
                    ? ticket?.createdBy?.name || ticket?.createdBy?.email || 'Unknown'
                    : ticket?.createdByName || 'Unknown'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Error */}
          {error && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </Grid>
          )}

          {/* Resolution notes */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Resolution Notes *"
              placeholder="Describe what was done to resolve this issue..."
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              multiline
              rows={5}
              disabled={loading}
              helperText="Required — describe the fix applied"
            />
          </Grid>

          {/* Image upload — images only, no PDFs */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              bgcolor: resolutionImagePreview ? '#f0fdf4' : 'transparent',
              transition: 'background 0.2s'
            }}>
              <input
                // ✅ accept only image types — this prevents the file picker
                //    from showing PDFs and other non-image files
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                capture="environment"       // opens back camera on mobile
                style={{ display: 'none' }}
                id="resolution-image-upload"
                type="file"
                onChange={handleImageChange}
                disabled={loading}
              />
              <label htmlFor="resolution-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={loading}
                  color={resolutionImagePreview ? 'success' : 'primary'}
                >
                  {resolutionImagePreview ? 'Change Image' : 'Capture / Upload Image (Optional)'}
                </Button>
              </label>

              {/* ✅ Clearly state what is allowed */}
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Images only: JPG, PNG, GIF, WEBP · Max 10 MB · PDFs not accepted
              </Typography>

              {resolutionImagePreview && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={resolutionImagePreview}
                    alt="Resolution preview"
                    style={{
                      maxWidth: '100%', maxHeight: 200,
                      borderRadius: 8, objectFit: 'contain',
                      border: '2px solid #bbf7d0'
                    }}
                  />
                  <Typography variant="caption" display="block" color="success.main" sx={{ mt: 0.5 }}>
                    ✓ {resolutionImage?.name} ({(resolutionImage!.size / 1024).toFixed(0)} KB)
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleResolveTicket}
          variant="contained"
          color="success"
          disabled={loading || !resolutionNotes.trim()}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
        >
          {loading ? 'Resolving…' : 'Resolve Ticket'}
        </Button>
      </DialogActions>

    </Dialog>
  );
};

export default TicketResolutionDialog;