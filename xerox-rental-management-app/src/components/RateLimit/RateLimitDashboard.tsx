import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Divider
} from '@mui/material';
import {
  Shield,
  AlertTriangle,
  Activity,
  Users,
  TrendingUp,
  RefreshCw,
  Settings
} from 'lucide-react';
import { api } from '../../services/api';
import RateLimitStats from './RateLimitStats';
import TopOffenders from './TopOffenders';
import RateLimitSummary from './RateLimitSummary';
import RateLimitConfig from './RateLimitConfig';

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
      id={`rate-limit-tabpanel-${index}`}
      aria-labelledby={`rate-limit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface OverviewData {
  totalClients: number;
  totalRequests: number;
  totalBlocked: number;
  blockedPercentage: number;
}

const RateLimitDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/rate-limits/stats');
      setOverviewData({
        totalClients: response.data.totalClients,
        totalRequests: response.data.totalRequests,
        totalBlocked: response.data.totalBlocked,
        blockedPercentage: response.data.blockedPercentage
      });
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load rate limit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleRefresh = () => {
    fetchOverviewData();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getStatusColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage < 2) return 'success';
    if (percentage < 5) return 'warning';
    return 'error';
  };

  const getStatusText = (percentage: number): string => {
    if (percentage < 2) return 'Healthy';
    if (percentage < 5) return 'Elevated';
    return 'High';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Shield size={32} color="#1976d2" />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Rate Limiting Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor and manage API rate limits across all users and endpoints
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && !overviewData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{xs:12,sm:6,md:3}} >
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Users size={32} color="#fff" />
                    <Chip
                      label="Active"
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                    />
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="#fff" gutterBottom>
                    {overviewData?.totalClients.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Total Clients
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{xs:12,sm:6,md:3}}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Activity size={32} color="#fff" />
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="#fff" gutterBottom>
                    {overviewData?.totalRequests.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Total Requests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{xs:12,sm:6,md:3}}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <AlertTriangle size={32} color="#fff" />
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="#fff" gutterBottom>
                    {overviewData?.totalBlocked.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Blocked Requests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{xs:12,sm:6,md:3}}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <TrendingUp size={32} color="#fff" />
                    <Chip
                      label={getStatusText(overviewData?.blockedPercentage || 0)}
                      size="small"
                      color={getStatusColor(overviewData?.blockedPercentage || 0)}
                    />
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="#fff" gutterBottom>
                    {overviewData?.blockedPercentage.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Block Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ borderRadius: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                aria-label="rate limit tabs"
                variant="fullWidth"
              >
                <Tab
                  label="Overview"
                  icon={<Activity size={20} />}
                  iconPosition="start"
                />
                <Tab
                  label="Statistics"
                  icon={<TrendingUp size={20} />}
                  iconPosition="start"
                />
                <Tab
                  label="Top Offenders"
                  icon={<AlertTriangle size={20} />}
                  iconPosition="start"
                />
                <Tab
                  label="Configuration"
                  icon={<Settings size={20} />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            <TabPanel value={currentTab} index={0}>
              <RateLimitSummary onRefresh={handleRefresh} />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <RateLimitStats onRefresh={handleRefresh} />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <TopOffenders onRefresh={handleRefresh} />
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
              <RateLimitConfig />
            </TabPanel>
          </Paper>

          {overviewData && overviewData.blockedPercentage > 5 && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                High Block Rate Detected
              </Typography>
              <Typography variant="body2">
                Your API is experiencing a high rate of blocked requests ({overviewData.blockedPercentage.toFixed(2)}%).
                This could indicate:
              </Typography>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>Potential abuse or attack</li>
                <li>Rate limits may be too restrictive</li>
                <li>Client applications need optimization</li>
              </ul>
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default RateLimitDashboard;
