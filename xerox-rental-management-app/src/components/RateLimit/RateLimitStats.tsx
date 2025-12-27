import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  TablePagination,
  LinearProgress
} from '@mui/material';
import { Search, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';

interface StatEntry {
  key: string;
  clientId: string;
  limitType: string;
  totalRequests: number;
  blockedRequests: number;
  blockedPercentage: number;
  lastRequestAt: string;
  lastBlockedAt: string | null;
}

interface RateLimitStatsProps {
  onRefresh?: () => void;
}

const RateLimitStats: React.FC<RateLimitStatsProps> = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/rate-limits/stats');

      const statsArray: StatEntry[] = Object.entries(response.data.stats || {}).map(
        ([key, value]: [string, any]) => {
          const [clientId, limitType] = key.split(':').slice(0, 2);
          return {
            key,
            clientId: clientId || key,
            limitType: limitType || 'UNKNOWN',
            totalRequests: value.totalRequests || 0,
            blockedRequests: value.blockedRequests || 0,
            blockedPercentage: value.blockedPercentage || 0,
            lastRequestAt: value.lastRequestAt || '',
            lastBlockedAt: value.lastBlockedAt || null
          };
        }
      );

      statsArray.sort((a, b) => b.totalRequests - a.totalRequests);
      setStats(statsArray);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredStats = stats.filter(
    (stat) =>
      stat.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stat.limitType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedStats = filteredStats.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getClientTypeIcon = (clientId: string) => {
    if (clientId.startsWith('user:')) {
      return <Chip label="User" size="small" color="primary" />;
    } else if (clientId.startsWith('ip:')) {
      return <Chip label="IP" size="small" color="default" />;
    }
    return <Chip label="Unknown" size="small" />;
  };

  const getLimitTypeColor = (limitType: string): 'error' | 'warning' | 'info' | 'success' => {
    switch (limitType) {
      case 'AUTHENTICATION':
        return 'error';
      case 'PAYMENT':
        return 'warning';
      case 'REPORT_GENERATION':
        return 'info';
      default:
        return 'success';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && stats.length === 0) {
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
            Detailed Statistics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View rate limit statistics for all clients and endpoint types
          </Typography>
        </Box>
      </Box>

      <TextField
        fullWidth
        placeholder="Search by client ID or limit type..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={20} />
            </InputAdornment>
          )
        }}
      />

      {stats.length === 0 ? (
        <Alert severity="info">
          No rate limit statistics available yet. Statistics will appear as requests are made to the API.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Client</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Total Requests</TableCell>
                  <TableCell align="right">Blocked</TableCell>
                  <TableCell align="right">Block Rate</TableCell>
                  <TableCell>Last Request</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStats.map((stat) => (
                  <TableRow key={stat.key} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getClientTypeIcon(stat.clientId)}
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {stat.clientId.replace(/^(user:|ip:)/, '')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stat.limitType}
                        size="small"
                        color={getLimitTypeColor(stat.limitType)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {stat.totalRequests.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={stat.blockedRequests > 0 ? 'error' : 'text.secondary'}
                        fontWeight={stat.blockedRequests > 0 ? 'bold' : 'normal'}
                      >
                        {stat.blockedRequests.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 60 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(stat.blockedPercentage, 100)}
                            color={
                              stat.blockedPercentage < 5
                                ? 'success'
                                : stat.blockedPercentage < 20
                                ? 'warning'
                                : 'error'
                            }
                          />
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                          {stat.blockedPercentage.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(stat.lastRequestAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {stat.blockedRequests > 0 ? (
                        <Chip
                          icon={<XCircle size={16} />}
                          label="Has Blocks"
                          size="small"
                          color="warning"
                        />
                      ) : (
                        <Chip
                          icon={<CheckCircle size={16} />}
                          label="Healthy"
                          size="small"
                          color="success"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredStats.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Box>
  );
};

export default RateLimitStats;
