import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Lock, CreditCard } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  onNavigateToPlans?: () => void;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children, onNavigateToPlans }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    // Only check for owners
    if (user?.role !== 'OWNER') {
      setHasActiveSubscription(true);
      setLoading(false);
      return;
    }

    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const data = await apiService.getUserActiveSubscription(user.id.toString());

      // Check if subscription is active
      if (data && (data.status === 'ACTIVE' || data.status === 'TRIAL' || data.isTrial)) {
        setHasActiveSubscription(true);
        setSubscription(data);
      } else {
        setHasActiveSubscription(false);
      }
    } catch (err: any) {
      // No active subscription found
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Allow access for non-owners or owners with active subscriptions
  if (user?.role !== 'OWNER' || hasActiveSubscription) {
    return <>{children}</>;
  }

  // Block access for owners without active subscription
  return (
    <Box
      sx={{
        p: 4,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 600,
          p: 6,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Lock sx={{ fontSize: 80, color: '#667eea', mb: 2 }} />

        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Subscription Required
        </Typography>

        <Typography variant="h6" color="text.secondary" paragraph>
          Access to this feature requires an active subscription
        </Typography>

        <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="body2" gutterBottom>
            <strong>Why do I need a subscription?</strong>
          </Typography>
          <Typography variant="body2">
            Our subscription plans provide you with full access to:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0 }}>
            <li>Inventory Management</li>
            <li>Invoice Generation</li>
            <li>Customer Management</li>
            <li>Analytics & Reports</li>
            <li>24/7 Support</li>
          </Box>
        </Alert>

        <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant="contained"
            size="large"
            startIcon={<CreditCard />}
            onClick={onNavigateToPlans}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            View Subscription Plans
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          All plans come with a free trial period. No credit card required to start.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SubscriptionGuard;
