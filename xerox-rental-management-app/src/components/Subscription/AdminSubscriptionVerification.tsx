import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
} from '@mui/material';
import { CheckCircle, XCircle, Eye, Clock, Ban } from 'lucide-react';
import { apiService } from '../../services/api';
import { format } from 'date-fns';

interface Subscription {
  id: number;
  userId: number;
  planId: number;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL';
  billingCycle: 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  isTrial: boolean;
  autoRenew: boolean;
  amountPaid: number;
  paymentMethod: string;
  transactionId: string;
  paymentVerified: boolean;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: number;
  invoiceNumber?: string;
  adminNotes?: string;
  machineLimit: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  plan: {
    id: number;
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`subscription-tabpanel-${index}`}
      aria-labelledby={`subscription-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminSubscriptionVerification: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const [openVerifyDialog, setOpenVerifyDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isApproving, setIsApproving] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllSubscriptions();

      // Transform flat API response to nested structure expected by component
      const transformedData = data.map((item: any) => ({
        id: item.id,
        userId: item.userId,
        planId: item.planId,
        status: item.status,
        billingCycle: item.billingCycle,
        startDate: item.startDate,
        endDate: item.endDate,
        trialEndDate: item.trialEndDate,
        isTrial: item.isTrial,
        autoRenew: item.autoRenew,
        amountPaid: item.amountPaid,
        paymentMethod: item.paymentMethod || '',
        transactionId: item.transactionId || '',
        paymentVerified: item.paymentVerified || false,
        paymentVerifiedAt: item.paymentVerifiedAt,
        paymentVerifiedBy: item.paymentVerifiedBy,
        invoiceNumber: item.invoiceNumber,
        adminNotes: item.adminNotes,
        machineLimit: item.machineLimit || 0,
        user: {
          id: item.userId,
          name: item.userName || '',
          email: item.userEmail || '',
          phone: item.userPhone || '',
        },
        plan: {
          id: item.planId,
          name: item.planName || '',
          description: item.planDescription || '',
          monthlyPrice: item.planMonthlyPrice || 0,
          yearlyPrice: item.planYearlyPrice || 0,
        },
      }));

      setSubscriptions(transformedData);
      setError(null);
    } catch (err: any) {
      setError('Failed to load subscriptions');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerifyDialog = (subscription: Subscription, approve: boolean) => {
    setSelectedSubscription(subscription);
    setIsApproving(approve);
    setAdminNotes('');
    setOpenVerifyDialog(true);
  };

  const handleOpenDetailsDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setOpenDetailsDialog(true);
  };

  const handleVerifyPayment = async () => {
    if (!selectedSubscription) return;

    try {
      await apiService.verifySubscriptionPayment(
        selectedSubscription.id.toString(),
        currentUser.id,
        isApproving,
        adminNotes
      );

      setSuccess(
        `Subscription ${isApproving ? 'approved' : 'rejected'} successfully`
      );
      setOpenVerifyDialog(false);
      setSelectedSubscription(null);
      setAdminNotes('');
      fetchSubscriptions();
    } catch (err: any) {
      setError(err.message || 'Failed to verify payment');
      console.error('Error verifying payment:', err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACTIVE':
        return 'success';
      case 'TRIAL':
        return 'info';
      case 'EXPIRED':
        return 'error';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  const pendingSubscriptions = subscriptions.filter(
    (s) => s.status === 'PENDING' && !s.paymentVerified
  );
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE');
  const trialSubscriptions = subscriptions.filter((s) => s.status === 'TRIAL');
  const cancelledSubscriptions = subscriptions.filter(
    (s) => s.status === 'CANCELLED' || s.status === 'EXPIRED'
  );

  const renderSubscriptionTable = (data: Subscription[]) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Owner Details</TableCell>
            <TableCell>Plan</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Payment Method</TableCell>
            <TableCell>Transaction ID</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                <Typography color="text.secondary" sx={{ py: 3 }}>
                  No subscriptions found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            data.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>#{subscription.id}</TableCell>
                <TableCell>
                  <Box>
                    <Typography fontWeight="bold">
                      {subscription.user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {subscription.user.email}
                    </Typography>
                    {subscription.user.phone && (
                      <Typography variant="body2" color="text.secondary">
                        {subscription.user.phone}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography fontWeight="bold">
                      {subscription.plan.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {subscription.billingCycle}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">
                    {formatPrice(subscription.amountPaid)}
                  </Typography>
                </TableCell>
                <TableCell>{subscription.paymentMethod}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                    }}
                  >
                    {subscription.transactionId}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={subscription.status}
                    color={getStatusColor(subscription.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(subscription.startDate)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDetailsDialog(subscription)}
                      >
                        <Eye size={18} />
                      </IconButton>
                    </Tooltip>
                    {subscription.status === 'PENDING' && !subscription.paymentVerified && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleOpenVerifyDialog(subscription, true)}
                          >
                            <CheckCircle size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenVerifyDialog(subscription, false)}
                          >
                            <XCircle size={18} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Subscription Verification
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Review and verify subscription payments
          </Typography>
        </Box>
        <Button variant="outlined" onClick={fetchSubscriptions}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={3}>
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: 'warning.50',
                border: '1px solid',
                borderColor: 'warning.200',
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Clock size={32} color="#ed6c02" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {pendingSubscriptions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Verification
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: 'success.50',
                border: '1px solid',
                borderColor: 'success.200',
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle size={32} color="#2e7d32" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {activeSubscriptions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Subscriptions
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: 'info.50',
                border: '1px solid',
                borderColor: 'info.200',
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Clock size={32} color="#0288d1" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {trialSubscriptions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trial Subscriptions
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: 'grey.100',
                border: '1px solid',
                borderColor: 'grey.300',
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Ban size={32} color="#757575" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {cancelledSubscriptions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cancelled/Expired
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Pending
                {pendingSubscriptions.length > 0 && (
                  <Chip
                    label={pendingSubscriptions.length}
                    size="small"
                    color="warning"
                  />
                )}
              </Box>
            }
          />
          <Tab label="Active" />
          <Tab label="Trial" />
          <Tab label="Cancelled/Expired" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderSubscriptionTable(pendingSubscriptions)}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderSubscriptionTable(activeSubscriptions)}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderSubscriptionTable(trialSubscriptions)}
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        {renderSubscriptionTable(cancelledSubscriptions)}
      </TabPanel>

      {/* Verify Payment Dialog */}
      <Dialog
        open={openVerifyDialog}
        onClose={() => setOpenVerifyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isApproving ? 'Approve Subscription' : 'Reject Subscription'}
        </DialogTitle>
        <DialogContent>
          {selectedSubscription && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={isApproving ? 'success' : 'error'} sx={{ mb: 3 }}>
                {isApproving
                  ? 'You are about to approve this subscription. The user will be notified and gain access to the features.'
                  : 'You are about to reject this subscription. The user will be notified with the reason provided below.'}
              </Alert>

              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Owner
                </Typography>
                <Typography fontWeight="bold">
                  {selectedSubscription.user.name}
                </Typography>
                <Typography variant="body2">{selectedSubscription.user.email}</Typography>
              </Box>

              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Plan & Amount
                </Typography>
                <Typography fontWeight="bold">
                  {selectedSubscription.plan.name} - {selectedSubscription.billingCycle}
                </Typography>
                <Typography>{formatPrice(selectedSubscription.amountPaid)}</Typography>
              </Box>

              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Payment Details
                </Typography>
                <Typography>
                  <strong>Method:</strong> {selectedSubscription.paymentMethod}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  <strong>Transaction ID:</strong> {selectedSubscription.transactionId}
                </Typography>
              </Box>

              <TextField
                fullWidth
                label={isApproving ? 'Admin Notes (Optional)' : 'Rejection Reason (Required)'}
                multiline
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  isApproving
                    ? 'Add any notes about this verification...'
                    : 'Explain why this payment is being rejected...'
                }
                required={!isApproving}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVerifyDialog(false)}>Cancel</Button>
          <Button
            onClick={handleVerifyPayment}
            variant="contained"
            color={isApproving ? 'success' : 'error'}
            disabled={!isApproving && !adminNotes.trim()}
          >
            {isApproving ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Subscription Details</DialogTitle>
        <DialogContent>
          {selectedSubscription && (
            <Box sx={{ mt: 2 }}>
              <Box display="flex" gap={2} mb={3}>
                <Chip
                  label={selectedSubscription.status}
                  color={getStatusColor(selectedSubscription.status) as any}
                />
                {selectedSubscription.paymentVerified && (
                  <Chip label="Payment Verified" color="success" variant="outlined" />
                )}
                {selectedSubscription.autoRenew && (
                  <Chip label="Auto-Renew Enabled" color="info" variant="outlined" />
                )}
              </Box>

              <Typography variant="h6" gutterBottom>
                Owner Information
              </Typography>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography>
                  <strong>Name:</strong> {selectedSubscription.user.name}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {selectedSubscription.user.email}
                </Typography>
                {selectedSubscription.user.phone && (
                  <Typography>
                    <strong>Phone:</strong> {selectedSubscription.user.phone}
                  </Typography>
                )}
              </Box>

              <Typography variant="h6" gutterBottom>
                Subscription Details
              </Typography>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography>
                  <strong>Plan:</strong> {selectedSubscription.plan.name}
                </Typography>
                <Typography>
                  <strong>Description:</strong> {selectedSubscription.plan.description}
                </Typography>
                <Typography>
                  <strong>Billing Cycle:</strong> {selectedSubscription.billingCycle}
                </Typography>
                <Typography>
                  <strong>Machine Limit:</strong>{' '}
                  {selectedSubscription.machineLimit === -1
                    ? 'Unlimited'
                    : selectedSubscription.machineLimit}
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom>
                Payment Information
              </Typography>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography>
                  <strong>Amount Paid:</strong>{' '}
                  {formatPrice(selectedSubscription.amountPaid)}
                </Typography>
                <Typography>
                  <strong>Payment Method:</strong> {selectedSubscription.paymentMethod}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  <strong>Transaction ID:</strong> {selectedSubscription.transactionId}
                </Typography>
                {selectedSubscription.invoiceNumber && (
                  <Typography>
                    <strong>Invoice Number:</strong> {selectedSubscription.invoiceNumber}
                  </Typography>
                )}
              </Box>

              <Typography variant="h6" gutterBottom>
                Dates
              </Typography>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography>
                  <strong>Start Date:</strong> {formatDate(selectedSubscription.startDate)}
                </Typography>
                <Typography>
                  <strong>End Date:</strong> {formatDate(selectedSubscription.endDate)}
                </Typography>
                {selectedSubscription.trialEndDate && (
                  <Typography>
                    <strong>Trial End Date:</strong>{' '}
                    {formatDate(selectedSubscription.trialEndDate)}
                  </Typography>
                )}
                {selectedSubscription.paymentVerifiedAt && (
                  <Typography>
                    <strong>Payment Verified At:</strong>{' '}
                    {formatDate(selectedSubscription.paymentVerifiedAt)}
                  </Typography>
                )}
              </Box>

              {selectedSubscription.adminNotes && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Admin Notes
                  </Typography>
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography>{selectedSubscription.adminNotes}</Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
          {selectedSubscription?.status === 'PENDING' &&
            !selectedSubscription.paymentVerified && (
              <>
                <Button
                  onClick={() => {
                    setOpenDetailsDialog(false);
                    handleOpenVerifyDialog(selectedSubscription, true);
                  }}
                  variant="contained"
                  color="success"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    setOpenDetailsDialog(false);
                    handleOpenVerifyDialog(selectedSubscription, false);
                  }}
                  variant="contained"
                  color="error"
                >
                  Reject
                </Button>
              </>
            )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSubscriptionVerification;
 