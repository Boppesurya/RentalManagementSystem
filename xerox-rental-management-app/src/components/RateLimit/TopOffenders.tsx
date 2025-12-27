import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
  Tooltip,
  IconButton
} from '@mui/material';
import { AlertTriangle, Ban, Shield, Info, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

interface Offender {
  key: string;
  totalRequests: number;
  blockedRequests: number;
  blockedPercentage: number;
  lastBlockedAt: string;
}

interface TopOffendersProps {
  onRefresh?: () => void;
}

const TopOffenders: React.FC<TopOffendersProps> = ({ onRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offenders, setOffenders] = useState<Offender[]>([]);
  const [limit, setLimit] = useState(10);

  const fetchOffenders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/rate-limits/top-offenders?limit=${limit}`);
      setOffenders(response.data.offenders || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load top offenders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffenders();
  }, [limit]);

  const handleRefresh = () => {
    fetchOffenders();
    if (onRefresh) onRefresh();
  };

  const getSeverityColor = (percentage: number): 'error' | 'warning' | 'info' => {
    if (percentage >= 50) return 'error';
    if (percentage >= 20) return 'warning';
    return 'info';
  };

  const getThreatLevel = (percentage: number): string => {
    if (percentage >= 80) return 'Critical';
    if (percentage >= 50) return 'High';
    if (percentage >= 20) return 'Medium';
    return 'Low';
  };

  const parseClientInfo = (key: string) => {
    const parts = key.split(':');
    return {
      type: parts[0] || 'unknown',
      identifier: parts[1] || key,
      limitType: parts[2] || 'UNKNOWN'
    };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  if (loading && offenders.length === 0) {
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

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Top Offenders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Clients with the highest rate limit violations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Show Top</InputLabel>
            <Select
              value={limit}
              label="Show Top"
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <MenuItem value={5}>Top 5</MenuItem>
              <MenuItem value={10}>Top 10</MenuItem>
              <MenuItem value={25}>Top 25</MenuItem>
              <MenuItem value={50}>Top 50</MenuItem>
            </Select>
          </FormControl>
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

      {offenders.length === 0 ? (
        <Alert severity="success" icon={<Shield size={20} />}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            No Rate Limit Violations
          </Typography>
          <Typography variant="body2">
            All clients are operating within their rate limits. Your API is healthy!
          </Typography>
        </Alert>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{xs:12,md:4}}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AlertTriangle size={20} color="#f44336" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Critical Offenders
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {offenders.filter((o) => o.blockedPercentage >= 80).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Block rate ≥ 80%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs:12,md:4}}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AlertTriangle size={20} color="#ff9800" />
                    <Typography variant="subtitle2" color="text.secondary">
                      High Risk
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {offenders.filter((o) => o.blockedPercentage >= 50 && o.blockedPercentage < 80).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Block rate 50-79%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs:12,md:4}}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Info size={20} color="#2196f3" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Medium Risk
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {offenders.filter((o) => o.blockedPercentage < 50).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Block rate &lt; 50%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell width="60">Rank</TableCell>
                  <TableCell>Client Information</TableCell>
                  <TableCell align="right">Total Requests</TableCell>
                  <TableCell align="right">Blocked</TableCell>
                  <TableCell align="right">Block Rate</TableCell>
                  <TableCell>Threat Level</TableCell>
                  <TableCell>Last Blocked</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offenders.map((offender, index) => {
                  const clientInfo = parseClientInfo(offender.key);
                  return (
                    <TableRow
                      key={offender.key}
                      hover
                      sx={{
                        bgcolor:
                          offender.blockedPercentage >= 80
                            ? 'error.lighter'
                            : offender.blockedPercentage >= 50
                            ? 'warning.lighter'
                            : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={`#${index + 1}`}
                          size="small"
                          color={index < 3 ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip
                              label={clientInfo.type.toUpperCase()}
                              size="small"
                              color={clientInfo.type === 'user' ? 'primary' : 'default'}
                            />
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {clientInfo.identifier}
                            </Typography>
                          </Box>
                          <Chip label={clientInfo.limitType} size="small" variant="outlined" />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {offender.totalRequests.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="error">
                          {offender.blockedRequests.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color={getSeverityColor(offender.blockedPercentage)}
                        >
                          {offender.blockedPercentage.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getThreatLevel(offender.blockedPercentage)}
                          color={getSeverityColor(offender.blockedPercentage)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(offender.lastBlockedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Block this client (Feature coming soon)">
                          <IconButton size="small" color="error" disabled>
                            <Ban size={18} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Recommended Actions
            </Typography>
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li>
                <strong>Critical/High threats:</strong> Consider temporary IP blocking or investigating for malicious
                activity
              </li>
              <li>
                <strong>Repeated offenders:</strong> Contact users to optimize their API usage or upgrade their plan
              </li>
              <li>
                <strong>Legitimate high usage:</strong> Consider whitelisting trusted clients or increasing their limits
              </li>
            </ul>
          </Alert>
        </>
      )}
    </Box>
  );
};

export default TopOffenders;
