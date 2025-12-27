import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Paper,
  Grid,
  Chip,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  QrCode2,
  ContentCopy,
  CheckCircle,
  Warning,
  Download,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface TwoFactorSetupProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ open, onClose, userId, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const steps = ['Generate QR Code', 'Scan & Verify', 'Save Backup Codes'];

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.setupTwoFactor(userId, 'Rental');
      if (response.success) {
        setQrCode(response.qrCode);
        setSecret(response.secret);
        setBackupCodes(response.backupCodes);
        setActiveStep(1);
      } else {
        setError(response.message || 'Failed to setup 2FA');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await apiService.verifyTwoFactorSetup(userId, parseInt(verificationCode));
      if (response.success) {
        setSuccess('Two-factor authentication enabled successfully!');
        setActiveStep(2);
        setShowBackupCodes(true);
      } else {
        setError(response.message || 'Invalid verification code');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
    resetState();
  };

  const resetState = () => {
    setActiveStep(0);
    setQrCode('');
    setSecret('');
    setBackupCodes([]);
    setVerificationCode('');
    setError('');
    setSuccess('');
    setShowBackupCodes(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const downloadBackupCodes = () => {
    const content = `Rental Management - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\nIMPORTANT: Save these codes in a secure location. Each code can only be used once.\n\n${backupCodes.map((code, idx) => `${idx + 1}. ${code}`).join('\n')}\n\nIf you lose access to your authenticator app, you can use these codes to log in.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xerox-2fa-backup-codes-${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccess('Backup codes downloaded!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCode2 color="primary" />
          <Typography variant="h6">Enable Two-Factor Authentication</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

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

        {activeStep === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your authenticator app when you log in.
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Before you begin, make sure you have an authenticator app installed on your mobile device:
            </Typography>
            <Box sx={{ pl: 2, mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>• Google Authenticator (iOS, Android)</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>• Microsoft Authenticator (iOS, Android)</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>• Authy (iOS, Android, Desktop)</Typography>
              <Typography variant="body2">• Any TOTP-compatible app</Typography>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Grid container spacing={3}>
              <Grid size={{xs:12,md:6}}>
                <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Step 1: Scan QR Code
                  </Typography>
                  {qrCode ? (
                    <Box>
                      <img
                        src={`data:image/png;base64,${qrCode}`}
                        alt="QR Code"
                        style={{ width: '250px', height: '250px' }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
                        Scan this QR code with your authenticator app
                      </Typography>
                    </Box>
                  ) : (
                    <CircularProgress />
                  )}
                </Paper>
              </Grid>

              <Grid size={{xs:12,md:6}}>
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Or enter manually:
                  </Typography>
                  <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                      Secret Key:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {secret}
                      </Typography>
                      <IconButton size="small" onClick={() => copyToClipboard(secret)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Step 2: Enter Verification Code
                  </Typography>
                  <TextField
                    fullWidth
                    label="6-Digit Code"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                    }}
                    placeholder="123456"
                    inputProps={{
                      maxLength: 6,
                      style: { fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }
                    }}
                    helperText="Enter the 6-digit code from your authenticator app"
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Two-factor authentication is now enabled!
              </Typography>
              <Typography variant="body2">
                You'll need to enter a verification code from your authenticator app each time you log in.
              </Typography>
            </Alert>

            <Paper elevation={2} sx={{ p: 3, bgcolor: 'warning.light' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Warning color="warning" />
                <Typography variant="h6">Important: Save Your Backup Codes</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                These backup codes can be used to log in if you lose access to your authenticator app. Each code can only be used once. Store them in a secure location.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={downloadBackupCodes}
                  size="small"
                >
                  Download Codes
                </Button>
                <Button
                  variant="outlined"
                  startIcon={showBackupCodes ? <VisibilityOff /> : <Visibility />}
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  size="small"
                >
                  {showBackupCodes ? 'Hide' : 'Show'} Codes
                </Button>
              </Box>

              {showBackupCodes && (
                <Grid container spacing={1}>
                  {backupCodes.map((code, index) => (
                    <Grid size={{xs:6}} key={index}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          bgcolor: 'background.paper',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '16px' }}>
                          {index + 1}. {code}
                        </Typography>
                        <IconButton size="small" onClick={() => copyToClipboard(code)}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {activeStep === 0 && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSetup} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Get Started'}
            </Button>
          </>
        )}
        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)} disabled={loading}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify & Enable'}
            </Button>
          </>
        )}
        {activeStep === 2 && (
          <Button variant="contained" onClick={handleComplete} startIcon={<CheckCircle />}>
            Complete Setup
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorSetup;
