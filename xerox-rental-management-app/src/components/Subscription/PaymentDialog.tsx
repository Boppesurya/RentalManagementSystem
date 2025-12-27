import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Alert,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  Receipt,
} from '@mui/icons-material';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  amount: number;
  billingCycle: string;
  onConfirm: (paymentData: PaymentData) => void;
  loading: boolean;
}

export interface PaymentData {
  paymentMethod: 'BANK_TRANSFER' | 'UPI' | 'CASH';
  transactionId: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  referenceNumber?: string;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  planName,
  amount,
  billingCycle,
  onConfirm,
  loading,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'UPI' | 'CASH'>('BANK_TRANSFER');
  const [transactionId, setTransactionId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);

    // Validation
    if (paymentMethod === 'BANK_TRANSFER') {
      if (!transactionId || !bankName || !accountNumber || !ifscCode) {
        setError('Please fill all bank transfer details');
        return;
      }
    } else if (paymentMethod === 'UPI') {
      if (!transactionId || !upiId) {
        setError('Please fill all UPI payment details');
        return;
      }
    } else if (paymentMethod === 'CASH') {
      if (!referenceNumber) {
        setError('Please provide a reference number for cash payment');
        return;
      }
    }

    const paymentData: PaymentData = {
      paymentMethod,
      transactionId: transactionId || referenceNumber || '',
      bankName: paymentMethod === 'BANK_TRANSFER' ? bankName : undefined,
      accountNumber: paymentMethod === 'BANK_TRANSFER' ? accountNumber : undefined,
      ifscCode: paymentMethod === 'BANK_TRANSFER' ? ifscCode : undefined,
      upiId: paymentMethod === 'UPI' ? upiId : undefined,
      referenceNumber: paymentMethod === 'CASH' ? referenceNumber : undefined,
    };

    onConfirm(paymentData);
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setTransactionId('');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setUpiId('');
      setReferenceNumber('');
      onClose();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Receipt color="primary" />
          <Typography variant="h5" fontWeight="bold">
            Complete Payment
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Subscription Summary */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#f8fafc' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Subscription Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{xs:6}}>
              <Typography color="text.secondary">Plan</Typography>
              <Typography fontWeight="bold">{planName}</Typography>
            </Grid>
            <Grid size={{xs:6}}>
              <Typography color="text.secondary">Billing Cycle</Typography>
              <Typography fontWeight="bold">{billingCycle}</Typography>
            </Grid>
            <Grid size={{xs:6}}>
              <Typography color="text.secondary">Amount to Pay</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {formatPrice(amount)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Divider sx={{ my: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Payment Method Selection */}
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Select Payment Method
        </Typography>

        <RadioGroup
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as any)}
        >
          <Paper
            elevation={paymentMethod === 'BANK_TRANSFER' ? 3 : 1}
            sx={{
              p: 2,
              mb: 2,
              border: paymentMethod === 'BANK_TRANSFER' ? '2px solid' : '1px solid',
              borderColor: paymentMethod === 'BANK_TRANSFER' ? 'primary.main' : 'divider',
            }}
          >
            <FormControlLabel
              value="BANK_TRANSFER"
              control={<Radio />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <AccountBalance />
                  <Typography fontWeight="bold">Bank Transfer (NEFT/RTGS/IMPS)</Typography>
                </Box>
              }
            />
          </Paper>

          <Paper
            elevation={paymentMethod === 'UPI' ? 3 : 1}
            sx={{
              p: 2,
              mb: 2,
              border: paymentMethod === 'UPI' ? '2px solid' : '1px solid',
              borderColor: paymentMethod === 'UPI' ? 'primary.main' : 'divider',
            }}
          >
            <FormControlLabel
              value="UPI"
              control={<Radio />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <CreditCard />
                  <Typography fontWeight="bold">UPI Payment</Typography>
                </Box>
              }
            />
          </Paper>

          <Paper
            elevation={paymentMethod === 'CASH' ? 3 : 1}
            sx={{
              p: 2,
              mb: 2,
              border: paymentMethod === 'CASH' ? '2px solid' : '1px solid',
              borderColor: paymentMethod === 'CASH' ? 'primary.main' : 'divider',
            }}
          >
            <FormControlLabel
              value="CASH"
              control={<Radio />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Receipt />
                  <Typography fontWeight="bold">Cash Payment</Typography>
                </Box>
              }
            />
          </Paper>
        </RadioGroup>

        <Divider sx={{ my: 3 }} />

        {/* Payment Details Form */}
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Enter Payment Details
        </Typography>

        {paymentMethod === 'BANK_TRANSFER' && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please transfer the amount to our bank account and provide the transaction details below.
            </Alert>
            <TextField
              fullWidth
              label="Transaction ID / UTR Number"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              margin="normal"
              required
              helperText="Unique transaction reference number from your bank"
            />
            <TextField
              fullWidth
              label="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              margin="normal"
              required
            />
            <Grid container spacing={2}>
              <Grid size={{xs:12,md:6}}>
                <TextField
                  fullWidth
                  label="Account Number (Last 4 digits)"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  margin="normal"
                  required
                  inputProps={{ maxLength: 4 }}
                />
              </Grid>
              <Grid size={{xs:12,md:6}}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {paymentMethod === 'UPI' && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Pay via UPI and provide the transaction details below.
            </Alert>
            <TextField
              fullWidth
              label="UPI Transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              margin="normal"
              required
              helperText="12-digit transaction ID from your UPI app"
            />
            <TextField
              fullWidth
              label="UPI ID"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              margin="normal"
              required
              placeholder="yourname@paytm"
              helperText="Your UPI ID used for payment"
            />
          </Box>
        )}

        {paymentMethod === 'CASH' && (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Cash payments must be made at our office. Please obtain a receipt.
            </Alert>
            <TextField
              fullWidth
              label="Receipt / Reference Number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              margin="normal"
              required
              helperText="Reference number from cash receipt"
            />
          </Box>
        )}

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Your subscription will be activated after admin verification of payment details.
            You will receive a confirmation email with the invoice once activated.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading} size="large">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          size="large"
          sx={{ px: 4 }}
        >
          {loading ? 'Processing...' : 'Confirm Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;
