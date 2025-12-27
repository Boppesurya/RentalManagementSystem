import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import {
  Business,
  CloudUpload,
  Image as ImageIcon,
  Delete
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const CompanySettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    companyName: '',
    defaultCopyRatio: 1.0,
    defaultFreeCopies: 0,
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    companyLogoUrl: '',
    stampImageUrl: '',
    signatureImageUrl: ''
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const data = await apiService.getCompanySettings(user?.id || '');
      if (data) {
        setSettings({
          companyName: data.companyName || '',
          defaultCopyRatio: data.defaultCopyRatio || 1.0,
          defaultFreeCopies: data.defaultFreeCopies || 0,
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          gstNumber: data.gstNumber || '',
          companyLogoUrl: data.companyLogoUrl || '',
          stampImageUrl: data.stampImageUrl || '',
          signatureImageUrl: data.signatureImageUrl || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.updateCompanySettings(user?.id || '', {
        companyName: settings.companyName,
        defaultCopyRatio: settings.defaultCopyRatio,
        defaultFreeCopies: settings.defaultFreeCopies,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        gstNumber: settings.gstNumber
      });

      setSuccess('Settings saved successfully!');
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'stamp' | 'signature') => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      if (type === 'logo') {
        response = await apiService.uploadCompanyLogo(user?.id || '', file);
        setLogoPreview(URL.createObjectURL(file));
      } else if (type === 'stamp') {
        response = await apiService.uploadStampImage(user?.id || '', file);
        setStampPreview(URL.createObjectURL(file));
      } else {
        response = await apiService.uploadSignatureImage(user?.id || '', file);
        setSignaturePreview(URL.createObjectURL(file));
      }

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
      await loadSettings();
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      setError(`Failed to upload ${type}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Business sx={{ fontSize: 40, mr: 2, color: '#667eea' }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Company Settings
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{xs:12,md:8}}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Company Information
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{xs:12}}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                />
              </Grid>

              <Grid size={{xs:12}}>
                <TextField
                  fullWidth
                  label="Address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid size={{xs:12, sm:6}}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </Grid>

              <Grid size={{xs:12,sm:6}}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </Grid>

              <Grid size={{xs:12,sm:6}}>
                <TextField
                  fullWidth
                  label="GST Number"
                  value={settings.gstNumber}
                  onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                />
              </Grid>

              <Grid size={{xs:12,sm:6}}>
                <TextField
                  fullWidth
                  label="Default Copy Ratio"
                  type="number"
                  value={settings.defaultCopyRatio}
                  onChange={(e) => setSettings({ ...settings, defaultCopyRatio: parseFloat(e.target.value) })}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>

              <Grid size={{xs:12,sm:6}}>
                <TextField
                  fullWidth
                  label="Default Free Copies"
                  type="number"
                  value={settings.defaultFreeCopies}
                  onChange={(e) => setSettings({ ...settings, defaultFreeCopies: parseInt(e.target.value) })}
                  inputProps={{ min: '0' }}
                />
              </Grid>

              <Grid size={{xs:12}}>
                <Button
                  variant="contained"
                  onClick={handleSaveSettings}
                  disabled={loading}
                  sx={{
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  Save Settings
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{xs:12,md:4}}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Company Logo
            </Typography>

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              {logoPreview || settings.companyLogoUrl ? (
                <Avatar
                  src={logoPreview || settings.companyLogoUrl}
                  sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
                  variant="rounded"
                />
              ) : (
                <Avatar
                  sx={{ width: 150, height: 150, mx: 'auto', mb: 2, bgcolor: '#e0e0e0' }}
                  variant="rounded"
                >
                  <ImageIcon sx={{ fontSize: 60 }} />
                </Avatar>
              )}
            </Box>

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{ mb: 1 }}
            >
              Upload Logo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(e.target.files[0], 'logo');
                  }
                }}
              />
            </Button>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Stamp Image
            </Typography>

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              {stampPreview || settings.stampImageUrl ? (
                <Avatar
                  src={stampPreview || settings.stampImageUrl}
                  sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
                  variant="rounded"
                />
              ) : (
                <Avatar
                  sx={{ width: 150, height: 150, mx: 'auto', mb: 2, bgcolor: '#e0e0e0' }}
                  variant="rounded"
                >
                  <ImageIcon sx={{ fontSize: 60 }} />
                </Avatar>
              )}
            </Box>

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
            >
              Upload Stamp
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(e.target.files[0], 'stamp');
                  }
                }}
              />
            </Button>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Signature
            </Typography>

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              {signaturePreview || settings.signatureImageUrl ? (
                <Avatar
                  src={signaturePreview || settings.signatureImageUrl}
                  sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
                  variant="rounded"
                />
              ) : (
                <Avatar
                  sx={{ width: 150, height: 150, mx: 'auto', mb: 2, bgcolor: '#e0e0e0' }}
                  variant="rounded"
                >
                  <ImageIcon sx={{ fontSize: 60 }} />
                </Avatar>
              )}
            </Box>

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
            >
              Upload Signature
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(e.target.files[0], 'signature');
                  }
                }}
              />
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompanySettings;
