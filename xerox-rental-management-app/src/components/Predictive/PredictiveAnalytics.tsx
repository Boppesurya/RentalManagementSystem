import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  Refresh,
  Add
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

const PredictiveAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedModel, setSelectedModel] = useState('revenue');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [predictiveData, setPredictiveData] = useState<any[]>([]);
  const [modelAccuracy] = useState(92.5);

  useEffect(() => {
    loadPredictiveData();
  }, [timeRange, selectedModel]);

  const loadPredictiveData = () => {
    setLoading(true);
    // Mock predictive data
    const mockData = [
      { month: 'Jul', predicted: 105000, actual: 102000, confidence: 92 },
      { month: 'Aug', predicted: 112000, actual: 115000, confidence: 89 },
      { month: 'Sep', predicted: 118000, actual: null, confidence: 85 },
      { month: 'Oct', predicted: 125000, actual: null, confidence: 82 }
    ];
    setPredictiveData(mockData);
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Predictive Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto Refresh"
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadPredictiveData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Create Model
          </Button>
        </Box>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{xs:12, sm:4}}>
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="3months">Last 3 Months</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="1year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, sm:4}}>
            <FormControl fullWidth>
              <InputLabel>Prediction Model</InputLabel>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <MenuItem value="revenue">Revenue Prediction</MenuItem>
                <MenuItem value="demand">Demand Forecasting</MenuItem>
                <MenuItem value="maintenance">Maintenance Prediction</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, sm:4}}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
               value={modelAccuracy}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Model Accuracy
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Prediction Chart */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
          Revenue Prediction Model
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={predictiveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <RechartsTooltip />
              <Line type="monotone" dataKey="predicted" stroke="#667eea" strokeWidth={3} />
              <Line type="monotone" dataKey="actual" stroke="#4caf50" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Insights */}
      <Grid container spacing={3}>
        <Grid size={{xs:12, md:6}}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              AI Insights
            </Typography>
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Revenue Growth Prediction
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Based on current trends, revenue is expected to grow by 15% next quarter.
              </Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Demand Forecast
              </Typography>
              <Typography variant="caption" color="text.secondary">
                High demand expected for WorkCentre series in Q4.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid  size={{xs:12, md:6}}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Model Performance
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{xs:6}}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                    {modelAccuracy}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accuracy
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{xs:6}}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    94.2%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Precision
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PredictiveAnalytics;