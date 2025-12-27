import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, LinearProgress, Alert } from '@mui/material';
import { CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface Subscription {
  id: number;
  planName: string;
  status: string;
  daysRemaining: number;
  isTrial: boolean;
  machineLimit: number | null;
  currentMachineCount: number;
}

interface SubscriptionBannerProps {
  onNavigate?: (page: string) => void;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'OWNER') {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      if (!user?.id) return;
      const data = await apiService.getUserActiveSubscription(user.id.toString());
      setSubscription(data);
    } catch (err: any) {
      if (err.message && !err.message.includes('404')) {
        console.error('Error fetching subscription:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  if (loading || user?.role !== 'OWNER') {
    return null;
  }

  if (!subscription) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => handleNavigation('subscription-plans')}
            >
              View Plans
            </Button>
          }
        >
          You don't have an active subscription. Choose a plan to unlock all features!
        </Alert>
      </Box>
    );
  }

  if (subscription.status === 'EXPIRED' || subscription.status === 'SUSPENDED') {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => handleNavigation('subscription')}
            >
              Renew Now
            </Button>
          }
        >
          Your subscription has expired. Please renew to continue using the service.
        </Alert>
      </Box>
    );
  }

  if (subscription.daysRemaining <= 7 && subscription.daysRemaining > 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => handleNavigation('subscription')}
            >
              Manage
            </Button>
          }
        >
          Your {subscription.planName} subscription expires in {subscription.daysRemaining} day
          {subscription.daysRemaining > 1 ? 's' : ''}.
        </Alert>
      </Box>
    );
  }

  if (subscription.isTrial) {
    return (
      <Box sx={{ mb: 3 }}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Free Trial Active
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {subscription.daysRemaining} days remaining in your trial period
                </Typography>
              </Box>
              <Button
                variant="contained"
                sx={{
                  bgcolor: 'white',
                  color: '#667eea',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                }}
                onClick={() => handleNavigation('subscription-plans')}
              >
                Upgrade Now
              </Button>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (subscription.daysRemaining / 7) * 100)}
              sx={{
                mt: 2,
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': { bgcolor: 'white' },
              }}
            />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (
    subscription.machineLimit !== null &&
    subscription.currentMachineCount >= subscription.machineLimit * 0.9
  ) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => handleNavigation('subscription-plans')}
            >
              Upgrade
            </Button>
          }
        >
          You're using {subscription.currentMachineCount} of {subscription.machineLimit}{' '}
          machines. Consider upgrading your plan.
        </Alert>
      </Box>
    );
  }

  return null;
};

export default SubscriptionBanner;
