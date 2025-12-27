import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import PaymentDialog, { type PaymentData } from './PaymentDialog';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  machineLimit: number | null;
  monthlyPrice: number;
  yearlyPrice: number;
  finalMonthlyPrice: number;
  finalYearlyPrice: number;
  trialDays: number;
  active: boolean;
  discountPercentage: number;
}

const SubscriptionPlans: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const plans = await apiService.getActiveSubscriptionPlans();
      setPlans(plans);
    } catch (err) {
      setError('Failed to load subscription plans');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const handlePaymentConfirm = async (paymentData: PaymentData) => {
    if (!user || !selectedPlan) return;

    setSubscribing(true);
    try {
      const price = yearlyBilling ? selectedPlan.finalYearlyPrice : selectedPlan.finalMonthlyPrice;

      await apiService.createSubscription({
        userId: parseInt(user.id),
        planId: selectedPlan.id,
        billingCycle: yearlyBilling ? 'YEARLY' : 'MONTHLY',
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
      });

      setPaymentDialogOpen(false);
      alert(
        'Subscription request submitted successfully!\n\n' +
        'Your payment details have been sent to the admin for verification.\n' +
        'You will receive a confirmation email with your invoice once the payment is verified.\n\n' +
        'Thank you for choosing our service!'
      );

      // Redirect to subscription page
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to create subscription');
      console.error('Error creating subscription:', err);
    } finally {
      setSubscribing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getFeatures = (plan: SubscriptionPlan) => {
    const features = [];

    if (plan.machineLimit === null) {
      features.push('Unlimited machines');
    } else if (plan.machineLimit === 0) {
      features.push('Basic access');
    } else {
      features.push(`Up to ${plan.machineLimit} machines`);
    }

    if (plan.trialDays > 0) {
      features.push(`${plan.trialDays}-day free trial`);
    }

    features.push('24/7 Support');
    features.push('Advanced analytics');
    features.push('Invoice management');
    features.push('Contract management');

    if (plan.machineLimit && plan.machineLimit >= 50) {
      features.push('Priority support');
      features.push('Custom reports');
      features.push('Machine health monitoring');
    }

    if (plan.machineLimit === null || (plan.machineLimit && plan.machineLimit >= 100)) {
      features.push('Dedicated account manager');
      features.push('API access');
      features.push('White-label options');
    }

    return features;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={3}>
          Select the perfect plan for your business needs
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={yearlyBilling}
              onChange={(e) => setYearlyBilling(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography>Monthly</Typography>
              <Typography fontWeight="bold">Yearly</Typography>
              <Chip label="Save 17%" color="success" size="small" />
            </Box>
          }
        />
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => {
          const price = yearlyBilling ? plan.finalYearlyPrice : plan.finalMonthlyPrice;
          const originalPrice = yearlyBilling ? plan.yearlyPrice : plan.monthlyPrice;
          const hasDiscount = plan.discountPercentage > 0;
          const isPopular = plan.machineLimit === 50;

          return (
            <Grid size={{xs:12, sm:6, md:4}} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: isPopular ? '2px solid #1976d2' : 'none',
                  boxShadow: isPopular ? 4 : 2,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                {isPopular && (
                  <Chip
                    label="Most Popular"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      fontWeight: 'bold',
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {plan.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" mb={3}>
                    {plan.description}
                  </Typography>

                  <Box mb={3}>
                    {hasDiscount && (
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{ textDecoration: 'line-through' }}
                      >
                        {formatPrice(originalPrice)}
                      </Typography>
                    )}
                    <Box display="flex" alignItems="baseline" gap={1}>
                      <Typography variant="h3" fontWeight="bold" color="primary">
                        {formatPrice(price)}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        /{yearlyBilling ? 'year' : 'month'}
                      </Typography>
                    </Box>
                    {hasDiscount && (
                      <Chip
                        label={`${plan.discountPercentage}% OFF`}
                        color="error"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>

                  <Button
                    variant={isPopular ? 'contained' : 'outlined'}
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={subscribing}
                    sx={{ mb: 3 }}
                  >
                    {plan.monthlyPrice === 0 ? 'Get Started Free' : 'Subscribe Now'}
                  </Button>

                  <Box>
                    {getFeatures(plan).map((feature, index) => (
                      <Box
                        key={index}
                        display="flex"
                        alignItems="center"
                        gap={1}
                        mb={1.5}
                      >
                        <Check size={20} color="#4caf50" />
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box mt={6} textAlign="center">
        <Alert severity="info" sx={{ maxWidth: 800, mx: 'auto' }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Payment & Activation Process
          </Typography>
          <Typography variant="body2">
            After selecting a plan and providing payment details, your subscription will be activated
            once the admin verifies your payment. You'll receive an invoice via email upon activation.
          </Typography>
        </Alert>
      </Box>

      {selectedPlan && (
        <PaymentDialog
          open={paymentDialogOpen}
          onClose={() => !subscribing && setPaymentDialogOpen(false)}
          planName={selectedPlan.name}
          amount={yearlyBilling ? selectedPlan.finalYearlyPrice : selectedPlan.finalMonthlyPrice}
          billingCycle={yearlyBilling ? 'Yearly' : 'Monthly'}
          onConfirm={handlePaymentConfirm}
          loading={subscribing}
        />
      )}
    </Box>
  );
};

export default SubscriptionPlans;
