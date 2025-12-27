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
  Alert,
  CircularProgress,
  Link,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  Security,
  VpnKey,
  ArrowBack
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface TwoFactorVerificationProps {
  open: boolean;
  userId: string;
  onSuccess: (user: any, token: string) => void;
  onBack: () => void;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  open,
  userId,
  onSuccess,
  onBack
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (useBackupCode) {
      if (!backupCode || backupCode.trim().length !== 8) {
        setError('Please enter a valid 8-digit backup code');
        return;
      }
    } else {
      if (!verificationCode || verificationCode.length !== 6) {
        setError('Please enter a valid 6-digit code');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.verifyTwoFactorLogin(
        userId,
        useBackupCode ? undefined : parseInt(verificationCode),
        useBackupCode ? backupCode.trim() : undefined
      );

      if (response.success && response.user && response.token) {
        onSuccess(response.user, response.token);
      } else {
        setError(response.message || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setError('');
    setVerificationCode('');
    setBackupCode('');
  };

  return (
    <Dialog open={open} onClose={onBack} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="primary" />
          <Typography variant="h6">Two-Factor Authentication</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText', mb: 3 }}>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            {useBackupCode
              ? 'Enter one of your backup codes to complete login'
              : 'Enter the 6-digit verification code from your authenticator app'}
          </Typography>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {!useBackupCode ? (
          <Box>
            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              onKeyPress={handleKeyPress}
              placeholder="123456"
              autoFocus
              inputProps={{
                maxLength: 6,
                style: { fontSize: '28px', letterSpacing: '12px', textAlign: 'center' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKey />
                  </InputAdornment>
                ),
              }}
              helperText="Enter the code from your authenticator app"
              sx={{ mb: 2 }}
            />

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Don't have access to your authenticator app?
              </Typography>
              <Link
                component="button"
                variant="body2"
                onClick={toggleBackupCode}
                sx={{ cursor: 'pointer' }}
              >
                Use a backup code instead
              </Link>
            </Box>
          </Box>
        ) : (
          <Box>
            <TextField
              fullWidth
              label="Backup Code"
              value={backupCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                setBackupCode(value);
              }}
              onKeyPress={handleKeyPress}
              placeholder="12345678"
              autoFocus
              inputProps={{
                maxLength: 8,
                style: { fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKey />
                  </InputAdornment>
                ),
              }}
              helperText="Each backup code can only be used once"
              sx={{ mb: 2 }}
            />

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                After using a backup code, make sure to generate new ones in your account settings.
              </Typography>
            </Alert>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                variant="body2"
                onClick={toggleBackupCode}
                sx={{ cursor: 'pointer' }}
              >
                Use authenticator app instead
              </Link>
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Security Tip:</strong> For your security, you'll be locked out for 15 minutes after 5 failed attempts.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onBack} startIcon={<ArrowBack />} disabled={loading}>
          Back to Login
        </Button>
        <Button
          variant="contained"
          onClick={handleVerify}
          disabled={loading || (!useBackupCode && verificationCode.length !== 6) || (useBackupCode && backupCode.length !== 8)}
        >
          {loading ? <CircularProgress size={24} /> : 'Verify & Login'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorVerification;
