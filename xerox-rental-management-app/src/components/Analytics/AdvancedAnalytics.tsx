import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Fade,
  Zoom
} from '@mui/material';
import {
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
  ErrorBar
} from 'recharts';

interface AnalyticsData {
  revenue: Array<{
    month: string;
    revenue: number;
    profit: number;
    expenses: number;
    growth: number;
    forecast: number;
    benchmark: number;
  }>;
  machines: Array<{
    category: string;
    count: number;
    utilization: number;
    revenue: number;
    efficiency: number;
    satisfaction: number;
  }>;
  performance: Array<{
    metric: string;
    value: number;
    target: number;
    status: string;
    trend: string;
    benchmark: number;
  }>;
  predictions: Array<{
    month: string;
    predicted: number;
    confidence: number;
    lower: number;
    upper: number;
  }>;
  correlations: Array<{
    x: string;
    y: string;
    correlation: number;
    strength: string;
  }>;
  anomalies: Array<{
    date: string;
    metric: string;
    value: number;
    expected: number;
    deviation: number;
    severity: string;
  }>;
}

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  confidence: number;
  action: string;
}

interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
  effort: string;
  timeline: string;
}



const AdvancedAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const [chartType, setChartType] = useState('line');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [autoRefresh] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);
  const [showBenchmarks, setShowBenchmarks] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    revenue: [],
    machines: [],
    performance: [],
    predictions: [],
    correlations: [],
    anomalies: []
  });

  const [advancedKpis] = useState({
    totalRevenue: 450000,
    revenueGrowth: 12.5,
    avgMachineUtilization: 87.3,
    customerSatisfaction: 94.2,
    maintenanceCost: 25000,
    profitMargin: 34.8
  });

  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    loadAnalyticsData();
    loadAdvancedInsights();
    loadRecommendations();
  }, [timeRange, selectedMetric, selectedRegion, selectedCategory]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadAnalyticsData();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);

    };
  }, [autoRefresh]);

  const loadAnalyticsData = () => {
    setLoading(true);
    const mockData: AnalyticsData = {
      revenue: [
        { month: 'Jan', revenue: 65000, profit: 22100, expenses: 42900, growth: 8.2, forecast: 68000, benchmark: 62000 },
        { month: 'Feb', revenue: 72000, profit: 25200, expenses: 46800, growth: 10.8, forecast: 75000, benchmark: 68000 },
        { month: 'Mar', revenue: 78000, profit: 27300, expenses: 50700, growth: 8.3, forecast: 82000, benchmark: 74000 },
        { month: 'Apr', revenue: 85000, profit: 29750, expenses: 55250, growth: 9.0, forecast: 89000, benchmark: 80000 },
        { month: 'May', revenue: 92000, profit: 32200, expenses: 59800, growth: 8.2, forecast: 96000, benchmark: 87000 },
        { month: 'Jun', revenue: 98000, profit: 34300, expenses: 63700, growth: 6.5, forecast: 102000, benchmark: 93000 }
      ],
      machines: [
        { category: 'WorkCentre Series', count: 45, utilization: 89, revenue: 180000, efficiency: 94, satisfaction: 96 },
        { category: 'VersaLink Series', count: 32, utilization: 85, revenue: 128000, efficiency: 91, satisfaction: 93 },
        { category: 'AltaLink Series', count: 28, utilization: 92, revenue: 140000, efficiency: 96, satisfaction: 98 },
        { category: 'PrimeLink Series', count: 15, utilization: 78, revenue: 75000, efficiency: 88, satisfaction: 91 }
      ],
      performance: [
        { metric: 'Uptime', value: 99.2, target: 99.0, status: 'excellent', trend: 'up', benchmark: 97.5 },
        { metric: 'Efficiency', value: 94.5, target: 90.0, status: 'excellent', trend: 'up', benchmark: 88.2 },
        { metric: 'Customer Satisfaction', value: 94.2, target: 95.0, status: 'good', trend: 'up', benchmark: 89.7 },
        { metric: 'Response Time', value: 2.3, target: 3.0, status: 'excellent', trend: 'down', benchmark: 4.1 }
      ],
      predictions: [
        { month: 'Jul', predicted: 105000, confidence: 92, lower: 98000, upper: 112000 },
        { month: 'Aug', predicted: 112000, confidence: 89, lower: 104000, upper: 120000 },
        { month: 'Sep', predicted: 118000, confidence: 85, lower: 108000, upper: 128000 }
      ],
      correlations: [
        { x: 'Customer Satisfaction', y: 'Revenue Growth', correlation: 0.87, strength: 'strong' },
        { x: 'Machine Utilization', y: 'Profit Margin', correlation: 0.74, strength: 'strong' },
        { x: 'Response Time', y: 'Customer Retention', correlation: -0.68, strength: 'moderate' }
      ],
      anomalies: [
        { date: '2024-06-15', metric: 'Revenue', value: 45000, expected: 52000, deviation: -13.5, severity: 'medium' },
        { date: '2024-06-20', metric: 'Utilization', value: 95, expected: 87, deviation: 9.2, severity: 'low' }
      ]
    };

    setAnalyticsData(mockData);
    setLoading(false);
  };

  const loadAdvancedInsights = () => {
    const mockInsights: Insight[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'Revenue Optimization Opportunity',
        description: 'WorkCentre Series machines show 15% higher profit margins.',
        impact: 'high',
        confidence: 89,
        action: 'Increase WorkCentre inventory by 20%'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Customer Satisfaction Trend',
        description: 'Slight decline in satisfaction for VersaLink series.',
        impact: 'medium',
        confidence: 76,
        action: 'Review VersaLink service protocols'
      }
    ];
    setInsights(mockInsights);
  };

  const loadRecommendations = () => {
    const mockRecommendations: Recommendation[] = [
      {
        id: '1',
        category: 'Revenue',
        title: 'Implement Dynamic Pricing',
        description: 'Use AI-driven pricing based on demand patterns.',
        expectedImpact: '+12% revenue',
        effort: 'medium',
        timeline: '3 months'
      },
      {
        id: '2',
        category: 'Operations',
        title: 'Predictive Maintenance',
        description: 'Deploy IoT sensors for predictive maintenance.',
        expectedImpact: '+8% uptime',
        effort: 'high',
        timeline: '6 months'
      }
    ];
    setRecommendations(mockRecommendations);
  };

  const renderAdvancedChart = () => {
    const data = analyticsData.revenue;
    
    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <RechartsTooltip />
              <Area type="monotone" dataKey="revenue" stroke="#667eea" fill="#667eea" fillOpacity={0.3} />
              {showPredictions && (
                <Area type="monotone" dataKey="forecast" stroke="#4caf50" fill="#4caf50" fillOpacity={0.2} strokeDasharray="5 5" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <RechartsTooltip />
              <Bar dataKey="revenue" fill="#667eea" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#4caf50" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <RechartsTooltip />
              <Bar dataKey="revenue" fill="#667eea" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="growth" stroke="#ff9800" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <RechartsTooltip />
              <Line type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={4} />
              <Line type="monotone" dataKey="profit" stroke="#4caf50" strokeWidth={3} />
              {showPredictions && (
                <Line type="monotone" dataKey="forecast" stroke="#ff9800" strokeWidth={2} strokeDasharray="5 5" />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp sx={{ color: '#4caf50' }} />;
      case 'warning': return <Warning sx={{ color: '#ff9800' }} />;
      case 'success': return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'error': return <Error sx={{ color: '#f44336' }} />;
      default: return <Info sx={{ color: '#2196f3' }} />;
    }
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      <Fade in timeout={1000}>
        <Typography variant="h3" sx={{ 
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3
        }}>
          Advanced Analytics Intelligence
        </Typography>
      </Fade>

      {/* Enhanced Controls */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{xs:12, sm:2}} >
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="1month">Last Month</MenuItem>
                <MenuItem value="3months">Last 3 Months</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="1year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, sm:2}}>
            <FormControl fullWidth>
              <InputLabel>Metric</InputLabel>
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                <MenuItem value="revenue">Revenue</MenuItem>
                <MenuItem value="profit">Profit</MenuItem>
                <MenuItem value="utilization">Utilization</MenuItem>
                <MenuItem value="satisfaction">Satisfaction</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, sm:2}}>
            <FormControl fullWidth>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="composed">Composed Chart</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, sm:2}}>
            <FormControl fullWidth>
              <InputLabel>Region</InputLabel>
              <Select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <MenuItem value="all">All Regions</MenuItem>
                <MenuItem value="north">North</MenuItem>
                <MenuItem value="south">South</MenuItem>
                <MenuItem value="east">East</MenuItem>
                <MenuItem value="west">West</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, sm:2}}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="workcentre">WorkCentre</MenuItem>
                <MenuItem value="versalink">VersaLink</MenuItem>
                <MenuItem value="altalink">AltaLink</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, sm:2}}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showPredictions}
                    onChange={(e) => setShowPredictions(e.target.checked)}
                    color="primary"
                  />
                }
                label="Predictions"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showBenchmarks}
                    onChange={(e) => setShowBenchmarks(e.target.checked)}
                    color="secondary"
                  />
                }
                label="Benchmarks"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Enhanced KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(advancedKpis).slice(0, 6).map(([key, value], index) => (
          <Grid size={{xs:12, sm:6 ,md:2}} key={key}>
            <Zoom in timeout={1000 + index * 100}>
              <Card sx={{ 
                borderRadius: 3, 
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                }
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS[index % COLORS.length], mb: 0.5 }}>
                    {typeof value === 'number' ? (
                      key.includes('Rate') || key.includes('Margin') || key.includes('Growth') || key.includes('Satisfaction') || key.includes('Utilization') ? 
                      `${value}%` : 
                      key.includes('Revenue') || key.includes('Cost') ? 
                      `₹${(value / 1000).toFixed(0)}K` : 
                      value.toLocaleString()
                    ) : String(value)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Main Analytics Chart */}
        <Grid size={{xs:12, lg:8}}>
          <Fade in timeout={1500}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Advanced Revenue Analytics
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 450 }}>
                  <CircularProgress size={60} />
                </Box>
              ) : (
                renderAdvancedChart()
              )}
            </Paper>
          </Fade>

          {/* Predictive Analytics */}
          <Fade in timeout={2000}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Predictive Forecasting
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analyticsData.predictions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <RechartsTooltip />
                  <Bar dataKey="predicted" fill="#667eea" radius={[4, 4, 0, 0]}>
                    <ErrorBar dataKey="lower" width={4} stroke="#4caf50" />
                    <ErrorBar dataKey="upper" width={4} stroke="#f44336" />
                  </Bar>
                  <Line type="monotone" dataKey="confidence" stroke="#4caf50" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>
          </Fade>
        </Grid>

        {/* Right Sidebar */}
        <Grid size={{xs:12, lg:4}}>
          {/* AI Insights */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              AI-Powered Insights
            </Typography>
            {insights.map((insight) => (
              <Box key={insight.id} sx={{ mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {getInsightIcon(insight.type)}
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {insight.title}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {insight.description}
                </Typography>
              </Box>
            ))}
          </Paper>

          {/* Smart Recommendations */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Smart Recommendations
            </Typography>
            {recommendations.map((rec) => (
              <Card key={rec.id} sx={{ mb: 2, borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {rec.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>
                    {rec.description}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    {rec.expectedImpact}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdvancedAnalytics;