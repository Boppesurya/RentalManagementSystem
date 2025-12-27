import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  Activity,
  Shield,
  Lock,
  Upload,
  FileText,
  Mail,
  Globe,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';

interface TypeSummary {
  totalRequests: number;
  blockedRequests: number;
  uniqueClients: number;
  blockedPercentage?: number;
}

interface SummaryData {
  [key: string]: TypeSummary;
}

interface RateLimitSummaryProps {
  onRefresh?: () => void;
}

const RateLimitSummary: React.FC<RateLimitSummaryProps> = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData>({});

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/rate-limits/stats/summary');
      setSummaryData(response.data.summaryByType || {});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  const getLimitTypeConfig = (type: string) => {
    const configs: { [key: string]: { icon: any; color: string; label: string } } = {
      AUTHENTICATION: { icon: Lock, color: '#f44336', label: 'Authentication' },
      PAYMENT: { icon: DollarSign, color: '#ff9800', label: 'Payment' },
      REPORT_GENERATION: { icon: FileText, color: '#2196f3', label: 'Reports' },
      FILE_UPLOAD: { icon: Upload, color: '#9c27b0', label: 'File Upload' },
      EMAIL: { icon: Mail, color: '#4caf50', label: 'Email' },
      PUBLIC: { icon: Globe, color: '#00bcd4', label: 'Public' },
      SUBSCRIPTION: { icon: Shield, color: '#ff5722', label: 'Subscription' },
      GENERAL_API: { icon: Activity, color: '#607d8b', label: 'General API' }
    };
    return configs[type] || { icon: Activity, color: '#9e9e9e', label: type };
  };

  const getHealthStatus = (blockedPercentage: number): { label: string; color: 'success' | 'warning' | 'error' } => {
    if (blockedPercentage < 2) return { label: 'Healthy', color: 'success' };
    if (blockedPercentage < 5) return { label: 'Warning', color: 'warning' };
    return { label: 'Critical', color: 'error' };
  };

  if (loading && Object.keys(summaryData).length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const summaryEntries = Object.entries(summaryData);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Summary by Endpoint Type
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Breakdown of rate limit usage across different API categories
        </Typography>
      </Box>

      {summaryEntries.length === 0 ? (
        <Alert severity="info">
          No data available yet. Summary will appear as requests are made to different API endpoints.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {summaryEntries.map(([type, data]) => {
            const config = getLimitTypeConfig(type);
            const Icon = config.icon;
            const blockedPercentage =
              data.totalRequests > 0 ? (data.blockedRequests / data.totalRequests) * 100 : 0;
            const health = getHealthStatus(blockedPercentage);

            return (
              <Grid size={{xs:12,sm:6,md:4}} key={type}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: `${config.color}20`
                        }}
                      >
                        <Icon size={24} color={config.color} />
                      </Box>
                      <Chip label={health.label} color={health.color} size="small" />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {config.label}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid size={{xs:6}}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Total Requests
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {data.totalRequests.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid size={{xs:6}}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Blocked
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error">
                          {data.blockedRequests.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid size={{xs:6}}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Block Rate
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color={
                            blockedPercentage < 2 ? 'success.main' : blockedPercentage < 5 ? 'warning.main' : 'error.main'
                          }
                        >
                          {blockedPercentage.toFixed(2)}%
                        </Typography>
                      </Grid>
                      <Grid size={{xs:6}}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Unique Clients
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {data.uniqueClients}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Understanding Endpoint Types
        </Typography>
        <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
          <li>
            <strong>Authentication:</strong> Login and registration endpoints (strictest limits)
          </li>
          <li>
            <strong>Payment:</strong> Payment processing and verification
          </li>
          <li>
            <strong>Reports:</strong> PDF generation and data export operations
          </li>
          <li>
            <strong>File Upload:</strong> Document and image upload endpoints
          </li>
          <li>
            <strong>General API:</strong> All other authenticated API endpoints
          </li>
        </ul>
      </Alert>
    </Box>
  );
};

export default RateLimitSummary;
