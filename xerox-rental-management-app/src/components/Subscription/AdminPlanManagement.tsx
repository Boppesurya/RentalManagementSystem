import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Edit, Trash2, Plus, Percent } from 'lucide-react';
import apiService from '../../services/api';

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

const AdminPlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDiscountDialog, setOpenDiscountDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [discountPlanId, setDiscountPlanId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    machineLimit: '',
    monthlyPrice: '',
    yearlyPrice: '',
    trialDays: '7',
    active: true,
    discountPercentage: '0',
  });

  const [discountValue, setDiscountValue] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const plans = await apiService.getSubscriptionPlans();
      setPlans(plans);
    } catch (err) {
      setError('Failed to load subscription plans');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description,
        machineLimit: plan.machineLimit?.toString() || '',
        monthlyPrice: plan.monthlyPrice.toString(),
        yearlyPrice: plan.yearlyPrice.toString(),
        trialDays: plan.trialDays.toString(),
        active: plan.active,
        discountPercentage: plan.discountPercentage.toString(),
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        machineLimit: '',
        monthlyPrice: '',
        yearlyPrice: '',
        trialDays: '7',
        active: true,
        discountPercentage: '0',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPlan(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        machineLimit: formData.machineLimit ? parseInt(formData.machineLimit) : null,
        monthlyPrice: parseFloat(formData.monthlyPrice),
        yearlyPrice: parseFloat(formData.yearlyPrice),
        trialDays: parseInt(formData.trialDays),
        active: formData.active,
        discountPercentage: parseFloat(formData.discountPercentage),
      };

      if (editingPlan) {
        await apiService.updateSubscriptionPlan(editingPlan.id.toString(), payload);
        setSuccess('Plan updated successfully');
      } else {
        await apiService.createSubscriptionPlan(payload);
        setSuccess('Plan created successfully');
      }

      handleCloseDialog();
      fetchPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to save plan');
      console.error('Error saving plan:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await apiService.deleteSubscriptionPlan(id.toString());
      setSuccess('Plan deleted successfully');
      fetchPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to delete plan');
      console.error('Error deleting plan:', err);
    }
  };

  const handleToggleActive = async (id: number, active: boolean) => {
    try {
      if (active) {
        await apiService.activateSubscriptionPlan(id.toString());
      } else {
        await apiService.deactivateSubscriptionPlan(id.toString());
      }
      setSuccess(`Plan ${active ? 'activated' : 'deactivated'} successfully`);
      fetchPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to update plan status');
      console.error('Error updating plan status:', err);
    }
  };

  const handleOpenDiscountDialog = (planId: number, currentDiscount: number) => {
    setDiscountPlanId(planId);
    setDiscountValue(currentDiscount.toString());
    setOpenDiscountDialog(true);
  };

  const handleApplyDiscount = async () => {
    if (!discountPlanId) return;

    try {
      await apiService.updateSubscriptionPlanDiscount(
        discountPlanId.toString(),
        parseFloat(discountValue)
      );
      setSuccess('Discount applied successfully');
      setOpenDiscountDialog(false);
      fetchPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to apply discount');
      console.error('Error applying discount:', err);
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
    <Box sx={{ p: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Subscription Plan Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenDialog()}
        >
          Create New Plan
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Plan Name</TableCell>
              <TableCell>Machine Limit</TableCell>
              <TableCell>Monthly Price</TableCell>
              <TableCell>Yearly Price</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Trial Days</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <Typography fontWeight="bold">{plan.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {plan.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  {plan.machineLimit === null ? 'Unlimited' : plan.machineLimit}
                </TableCell>
                <TableCell>
                  <Box>
                    {plan.discountPercentage > 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textDecoration: 'line-through' }}
                      >
                        {formatPrice(plan.monthlyPrice)}
                      </Typography>
                    )}
                    <Typography fontWeight="bold">
                      {formatPrice(plan.finalMonthlyPrice)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    {plan.discountPercentage > 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textDecoration: 'line-through' }}
                      >
                        {formatPrice(plan.yearlyPrice)}
                      </Typography>
                    )}
                    <Typography fontWeight="bold">
                      {formatPrice(plan.finalYearlyPrice)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {plan.discountPercentage > 0 ? (
                      <Chip
                        label={`${plan.discountPercentage}%`}
                        color="error"
                        size="small"
                      />
                    ) : (
                      <Chip label="No discount" size="small" variant="outlined" />
                    )}
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleOpenDiscountDialog(plan.id, plan.discountPercentage)
                      }
                    >
                      <Percent size={16} />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>{plan.trialDays} days</TableCell>
                <TableCell>
                  <Switch
                    checked={plan.active}
                    onChange={(e) => handleToggleActive(plan.id, e.target.checked)}
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(plan)}
                    >
                      <Edit size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Plan Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Machine Limit (leave empty for unlimited)"
                type="number"
                value={formData.machineLimit}
                onChange={(e) =>
                  setFormData({ ...formData, machineLimit: e.target.value })
                }
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Trial Days"
                type="number"
                value={formData.trialDays}
                onChange={(e) =>
                  setFormData({ ...formData, trialDays: e.target.value })
                }
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Monthly Price (INR)"
                type="number"
                value={formData.monthlyPrice}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyPrice: e.target.value })
                }
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Yearly Price (INR)"
                type="number"
                value={formData.yearlyPrice}
                onChange={(e) =>
                  setFormData({ ...formData, yearlyPrice: e.target.value })
                }
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Discount Percentage"
                type="number"
                value={formData.discountPercentage}
                onChange={(e) =>
                  setFormData({ ...formData, discountPercentage: e.target.value })
                }
              />
            </Grid>
            <Grid size={{xs:12}}>
              <Box display="flex" alignItems="center" height="100%">
                <Switch
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                />
                <Typography>Active</Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPlan ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDiscountDialog}
        onClose={() => setOpenDiscountDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Apply Discount</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Discount Percentage"
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            sx={{ mt: 2 }}
            inputProps={{ min: 0, max: 100 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDiscountDialog(false)}>Cancel</Button>
          <Button onClick={handleApplyDiscount} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPlanManagement;
