import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Grid,
  IconButton,
  Divider
} from '@mui/material';
import {
  Security,
  CheckCircle,
  Warning,
  Delete,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Download
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import TwoFactorSetup from './TwoFactorSetup';

interface TwoFactorManagementProps {
  userId: string;
  onStatusChange?: (enabled: boolean) => void;
}

const TwoFactorManagement: React.FC<TwoFactorManagementProps> = ({ userId, onStatusChange }) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [backupCodesCode, setBackupCodesCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, [userId]);

  const checkTwoFactorStatus = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.getTwoFactorStatus(userId);
      if (response && response.success !== undefined) {
        setIs2FAEnabled(response.enabled || false);
      }
    } catch (err: any) {
      console.error('Error checking 2FA status:', err);
      setError('Unable to check 2FA status. Please try again later.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = () => {
    setShowSetup(true);
  };

  const handleSetupSuccess = () => {
    setIs2FAEnabled(true);
    setSuccess('Two-factor authentication has been enabled successfully!');
    if (onStatusChange) onStatusChange(true);
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleDisable = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      const response = await apiService.disableTwoFactor(userId, parseInt(disableCode));
      if (response.success) {
        setIs2FAEnabled(false);
        setShowDisableDialog(false);
        setDisableCode('');
        setSuccess('Two-factor authentication has been disabled');
        if (onStatusChange) onStatusChange(false);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.message || 'Failed to disable 2FA');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGetBackupCodes = async () => {
    if (!backupCodesCode || backupCodesCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      const response = await apiService.getBackupCodes(userId, parseInt(backupCodesCode));
      if (response.success) {
        setBackupCodes(response.backupCodes);
        setShowCodes(true);
        setError('');
      } else {
        setError(response.message || 'Failed to retrieve backup codes');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve backup codes');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const downloadBackupCodes = () => {
    const content = `Xerox Rental Management - Backup Codes\n\nRetrieved: ${new Date().toLocaleString()}\n\n${backupCodes.map((code, idx) => `${idx + 1}. ${code}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-codes-${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Security fontSize="large" color={is2FAEnabled ? 'success' : 'action'} />
            <Box>
              <Typography variant="h6">Two-Factor Authentication</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label={is2FAEnabled ? 'Enabled' : 'Disabled'}
                  color={is2FAEnabled ? 'success' : 'default'}
                  size="small"
                  icon={is2FAEnabled ? <CheckCircle /> : <Warning />}
                />
              </Box>
            </Box>
          </Box>

          {!is2FAEnabled ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleEnable}
              startIcon={<Security />}
            >
              Enable 2FA
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setShowDisableDialog(true)}
              startIcon={<Delete />}
            >
              Disable 2FA
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {is2FAEnabled
            ? 'Two-factor authentication is currently enabled on your account. You will need to enter a verification code from your authenticator app each time you log in.'
            : 'Add an extra layer of security to your account by requiring both your password and a verification code from your authenticator app to log in.'}
        </Typography>

        {is2FAEnabled && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Backup Codes
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                If you lose access to your authenticator app, you can use backup codes to log in. Click the button below to view your backup codes.
              </Typography>
            </Alert>
            <Button
              variant="outlined"
              onClick={() => setShowBackupCodesDialog(true)}
              startIcon={<Visibility />}
            >
              View Backup Codes
            </Button>
          </Box>
        )}

        {!is2FAEnabled && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Recommended:</strong> Enable two-factor authentication to protect your account from unauthorized access.
            </Typography>
          </Alert>
        )}
      </Paper>

      <TwoFactorSetup
        open={showSetup}
        onClose={() => setShowSetup(false)}
        userId={userId}
        onSuccess={handleSetupSuccess}
      />

      <Dialog open={showDisableDialog} onClose={() => setShowDisableDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Disabling two-factor authentication will make your account less secure. Are you sure you want to continue?
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter the 6-digit verification code from your authenticator app to confirm:
          </Typography>

          <TextField
            fullWidth
            label="Verification Code"
            value={disableCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setDisableCode(value);
            }}
            placeholder="123456"
            autoFocus
            inputProps={{
              maxLength: 6,
              style: { fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowDisableDialog(false); setDisableCode(''); setError(''); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDisable}
            disabled={actionLoading || disableCode.length !== 6}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Disable 2FA'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showBackupCodesDialog} onClose={() => {
        setShowBackupCodesDialog(false);
        setBackupCodesCode('');
        setBackupCodes([]);
        setShowCodes(false);
        setError('');
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Backup Codes</DialogTitle>
        <DialogContent>
          {!showCodes ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                For security, please enter your 6-digit verification code to view your backup codes:
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Verification Code"
                value={backupCodesCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setBackupCodesCode(value);
                }}
                placeholder="123456"
                autoFocus
                inputProps={{
                  maxLength: 6,
                  style: { fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }
                }}
              />
            </Box>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Save these codes in a secure location. Each code can only be used once.
                </Typography>
              </Alert>

              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={downloadBackupCodes}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Download
                </Button>
              </Box>

              <Grid container spacing={1}>
                {backupCodes.map((code, index) => (
                  <Grid size={{xs:6}} key={index}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {index + 1}. {code}
                      </Typography>
                      <IconButton size="small" onClick={() => copyToClipboard(code)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowBackupCodesDialog(false);
            setBackupCodesCode('');
            setBackupCodes([]);
            setShowCodes(false);
            setError('');
          }}>
            {showCodes ? 'Close' : 'Cancel'}
          </Button>
          {!showCodes && (
            <Button
              variant="contained"
              onClick={handleGetBackupCodes}
              disabled={actionLoading || backupCodesCode.length !== 6}
            >
              {actionLoading ? <CircularProgress size={24} /> : 'View Codes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TwoFactorManagement;
