import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  TrendingUp,
  Package,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface Subscription {
  id: number;
  planName: string;
  status: string;
  billingCycle: string;
  startDate: string;
  endDate: string;
  trialEndDate: string | null;
  autoRenew: boolean;
  amountPaid: number;
  isTrial: boolean;
  machineLimit: number | null;
  currentMachineCount: number;
  daysRemaining: number;
}

interface RefundCalculation {
  amountPaid: number;
  totalDays: number;
  daysUsed: number;
  remainingDays: number;
  dailyRate: number;
  refundBeforeFee: number;
  adminFee: number;
  finalRefund: number;
  cancellationDate: string;
}

interface SubscriptionDashboardProps {
  onNavigate?: (page: string) => void;
}

const SubscriptionDashboard: React.FC<SubscriptionDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [refundEstimate, setRefundEstimate] = useState<RefundCalculation | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const subscription = await apiService.getUserActiveSubscription(user!.id);
      setSubscription(subscription);
    } catch (err: any) {
      if (err.message && !err.message.includes('404')) {
        setError('Failed to load subscription details');
      }
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefundEstimate = async () => {
    if (!subscription) return;

    try {
      const estimate = await apiService.getRefundEstimate(subscription.id.toString());
      setRefundEstimate(estimate);
    } catch (err) {
      console.error('Error fetching refund estimate:', err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      const result = await apiService.cancelSubscription(subscription.id.toString());

      alert(
        `Subscription cancelled successfully. Refund amount: ₹${result.finalRefund.toFixed(2)}`
      );
      setOpenCancelDialog(false);
      fetchSubscription();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel subscription');
      console.error('Error cancelling subscription:', err);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!subscription) return;

    try {
      await apiService.toggleSubscriptionAutoRenew(subscription.id.toString(), !subscription.autoRenew);
      fetchSubscription();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update auto-renew');
      console.error('Error updating auto-renew:', err);
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'TRIAL':
        return 'info';
      case 'EXPIRED':
        return 'error';
      case 'CANCELLED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getMachineUsagePercentage = () => {
    if (!subscription || subscription.machineLimit === null) return 0;
    return (subscription.currentMachineCount / subscription.machineLimit) * 100;
  };

  if (loading) {
    return (
      <Box p={4}>
        <LinearProgress />
      </Box>
    );
  }

  if (!subscription) {
    return (
      <Box p={4}>
        <Alert severity="info">
          You don't have an active subscription. Please choose a plan to get started.
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => onNavigate ? onNavigate('subscription-plans') : null}
        >
          View Plans
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        My Subscription
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {subscription.isTrial && (
        <Alert severity="info" icon={<AlertCircle size={20} />} sx={{ mb: 3 }}>
          You are currently on a free trial. Your trial ends on{' '}
          {formatDate(subscription.trialEndDate || subscription.endDate)}.
        </Alert>
      )}

      {subscription.daysRemaining <= 7 && subscription.daysRemaining > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your subscription expires in {subscription.daysRemaining} days. Please renew to
          continue using the service.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{xs:12,md:8}}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {subscription.planName} Plan
                  </Typography>
                  <Chip
                    label={subscription.status}
                    color={getStatusColor(subscription.status) as any}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {formatPrice(subscription.amountPaid)}
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid size={{xs:6}}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Calendar size={20} color="#666" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Billing Cycle
                      </Typography>
                      <Typography fontWeight="bold">
                        {subscription.billingCycle}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{xs:6}}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Package size={20} color="#666" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Machine Limit
                      </Typography>
                      <Typography fontWeight="bold">
                        {subscription.machineLimit === null
                          ? 'Unlimited'
                          : subscription.machineLimit}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{xs:6}}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CreditCard size={20} color="#666" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Start Date
                      </Typography>
                      <Typography fontWeight="bold">
                        {formatDate(subscription.startDate)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{xs:6}}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AlertCircle size={20} color="#666" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        End Date
                      </Typography>
                      <Typography fontWeight="bold">
                        {formatDate(subscription.endDate)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Box mt={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Days Remaining
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {subscription.daysRemaining} days
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(
                    100,
                    ((subscription.daysRemaining / 30) * 100)
                  )}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>

          {subscription.machineLimit !== null && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Machine Usage
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    {subscription.currentMachineCount} of {subscription.machineLimit}{' '}
                    machines used
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {getMachineUsagePercentage().toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getMachineUsagePercentage()}
                  sx={{ height: 8, borderRadius: 4 }}
                  color={
                    getMachineUsagePercentage() > 90 ? 'error' : 'primary'
                  }
                />
                {getMachineUsagePercentage() > 90 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    You are approaching your machine limit. Consider upgrading your plan.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{xs:6,md:4}}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Actions
              </Typography>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                sx={{ mb: 2 }}
                onClick={handleToggleAutoRenew}
              >
                {subscription.autoRenew ? 'Disable' : 'Enable'} Auto-Renew
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<TrendingUp size={18} />}
                sx={{ mb: 2 }}
                onClick={() => onNavigate ? onNavigate('subscription-plan') : null}
              >
                Upgrade Plan
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => {
                  setOpenCancelDialog(true);
                  fetchRefundEstimate();
                }}
              >
                Cancel Subscription
              </Button>

              <Box mt={3}>
                <Typography variant="body2" color="text.secondary">
                  Auto-Renew: {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to cancel your subscription? This action cannot be
            undone.
          </Alert>

          {refundEstimate && (
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Refund Calculation
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Amount Paid"
                    secondary={formatPrice(refundEstimate.amountPaid)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Total Days"
                    secondary={refundEstimate.totalDays}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Days Used"
                    secondary={refundEstimate.daysUsed}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Remaining Days"
                    secondary={refundEstimate.remainingDays}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Refund (before admin fee)"
                    secondary={formatPrice(refundEstimate.refundBeforeFee)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Admin Fee (5%)"
                    secondary={formatPrice(refundEstimate.adminFee)}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="h6" fontWeight="bold">
                        Final Refund Amount
                      </Typography>
                    }
                    secondary={
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        {formatPrice(refundEstimate.finalRefund)}
                      </Typography>
                    }
                  />
                </ListItem>
              </List>

              <Typography variant="body2" color="text.secondary" mt={2}>
                The refund will be processed within 5-7 business days.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>Keep Subscription</Button>
          <Button onClick={handleCancelSubscription} color="error" variant="contained">
            Confirm Cancellation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionDashboard;
