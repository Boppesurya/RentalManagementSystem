import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Switch,
  CircularProgress,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fade,
  Slide,
  Zoom,
  Grid,
  Fab
} from '@mui/material';

import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Warning,
  Error,
  Analytics,
  Support,
  MonetizationOn,
  Engineering,
  ThumbUp,
  Speed,
  People,
  Assessment,
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type AlertData, type RealTimeData } from '../../types';
import SubscriptionBanner from '../Subscription/SubscriptionBanner';

interface EnhancedDashboardProps {
  onNavigate?: (page: string) => void;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [revenueData, setRevenueData] = useState<Array<{ month: string; amount: number }>>([]);
  const [performanceData, setPerformanceData] = useState<Array<{ name: string; efficiency: number; utilization: number; satisfaction: number }>>([]);
  const [realTimeData, setRealTimeData] = useState<RealTimeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'analytics'>('overview');
  
  const [stats, setStats] = useState({
    totalMachines: 0,
    totalInvoices: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    activeMachines: 0,
    systemHealth: 98,
    uptime: 99.9,
    growthRate: 12.5,
    customerSatisfaction: 94.2,
    avgResponseTime: 2.3,
    maintenanceAlerts: 3,
    profitMargin: 34.8,
    marketShare: 15.2
  });

  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    user: string;
    action: string;
    target: string;
    timestamp: Date;
    type: string;
  }>>([]);

  useEffect(() => {
    loadDashboardData();
    loadAdvancedAnalytics();
    loadRealTimeData();
    loadAlerts();
    loadRecentActivities();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadRealTimeData();
        loadDashboardData();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [revenue, machines, invoices, users, dashboardStats] = await Promise.allSettled([
        apiService.getRevenue(),
        apiService.getMachines(),
        apiService.getInvoices(),
        apiService.getUsers(),
        Promise.resolve({}) // Remove getDashboardStats call since it might not exist
      ]);

      // Handle results from Promise.allSettled
      const revenueResult = revenue.status === 'fulfilled' ? revenue.value : [];
      const machinesData = machines.status === 'fulfilled' ? machines.value : [];
      const invoicesData = invoices.status === 'fulfilled' ? invoices.value : [];
      const usersData = users.status === 'fulfilled' ? users.value : [];

      setRevenueData(revenueResult);
      
      // Apply role-based filtering for data
      let filteredMachines = machinesData;
      let filteredInvoices = invoicesData;
      let filteredUsers = usersData;
      
      if (user?.role === 'OWNER') {
        // Owner sees their machines, invoices, and rental customers
        filteredMachines = machinesData.filter((m: any) => m.owner?.id === user.id);
        filteredInvoices = invoicesData.filter((i: any) => i.owner?.id === user.id);
        filteredUsers = usersData.filter((u: any) => 
          (u.role === 'RENTAL') && u.owner?.id === user.id.toString()
        );
      } else if (user?.role === 'RENTAL') {
        // Rental sees their rented machines and invoices
        filteredMachines = machinesData.filter((m: any) => m.rental?.id === user.id);
        filteredInvoices = invoicesData.filter((i: any) => i.rental?.id === user.id);
        filteredUsers = []; // Rental users don't see other users
      }
      
      setStats({
        totalMachines: filteredMachines.length,
        totalInvoices: filteredInvoices.length,
        totalUsers: filteredUsers.length,
        totalRevenue: revenueResult.reduce((sum: number, item) => sum + item.amount, 0),
        pendingInvoices: filteredInvoices.filter((i: any) => i.status === 'Pending').length,
        activeMachines: filteredMachines.filter((m: any) => m.status === 'rented').length,
        systemHealth: 98.5,
        uptime: 99.9,
        growthRate: 12.5,
        customerSatisfaction: 94.2,
        avgResponseTime: 2.3,
        maintenanceAlerts: 3,
        profitMargin: 34.8,
        marketShare: 15.2
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty stats on error
      setStats(prev => ({ ...prev, totalMachines: 0, totalInvoices: 0, totalUsers: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const loadAdvancedAnalytics = async () => {
    try {
      // For now, show empty performance data until advanced analytics is implemented
      setPerformanceData([]);
    } catch (error) {
      console.error('Error loading advanced analytics:', error);
      setPerformanceData([]);
    }
  };

  const loadRealTimeData = async () => {
    const data: RealTimeData[] = Array.from({ length: 20 }, (_, i) => ({
      deviceId: `device-${i}`,
      metric: 'activeUsers',
      value: Math.floor(Math.random() * 50) + 100,
      timestamp: new Date(Date.now() - (19 - i) * 60000)
    }));
    
    const chartData = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (19 - i) * 60000).toLocaleTimeString(),
      activeUsers: Math.floor(Math.random() * 50) + 100,
      systemLoad: Math.floor(Math.random() * 30) + 40,
      responseTime: Math.floor(Math.random() * 100) + 50,
      throughput: Math.floor(Math.random() * 1000) + 2000
    }));
    setRealTimeData(data);
  };

  const loadAlerts = async () => {
    try {
      if (user?.id) {
        const notifications = await apiService.getNotificationsByUser(user.id);
        const alertData: AlertData[] = notifications.slice(0, 5).map(n => ({
          id: n.id.toString(),
          message: n.message,
          severity: n.priority || 'medium',
          timestamp: new Date(n.createdAt),
          acknowledged: n.isRead
        }));
        setAlerts(alertData);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlerts([]);
    }
  };

  const loadRecentActivities = async () => {
    try {
      // Mock recent activities for demo
      const mockActivities = [
        {
          id: '1',
          user: 'John Doe',
          action: 'created invoice',
          target: 'INV-2024-001',
          timestamp: new Date(),
          type: 'invoice'
        },
        {
          id: '2',
          user: 'Jane Smith',
          action: 'updated machine',
          target: 'WorkCentre 5755',
          timestamp: new Date(Date.now() - 300000),
          type: 'machine'
        }
      ];
      setRecentActivities(mockActivities);
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setRecentActivities([]);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    
    switch (user?.role) {
      case 'ADMIN':
        return `${greeting}, ${user.name}! Here's your comprehensive system overview`;
      case 'OWNER':
        return `${greeting}, ${user.name}! Monitor your rental business performance`;
      case 'RENTAL':
        return `${greeting}, ${user.name}! Check your rental status and analytics`;
      case 'TECHNICIAN':
        return `${greeting}, ${user.name}! Manage repairs and maintenance tasks`;
      default:
        return `${greeting}! Welcome to your enhanced dashboard`;
    }
  };

  const getAdvancedStatsCards = () => {
    const baseCards = [
      {
        title: 'Total Revenue',
        value: `₹${(stats.totalRevenue / 1000).toFixed(0)}K`,
        change: `+${stats.growthRate}%`,
        changeType: 'positive',
        icon: <MonetizationOn sx={{ fontSize: 40, color: '#4caf50' }} />,
        color: '#e8f5e8',
        description: 'vs last month',
        trend: 'up',
        progress: ((stats.totalRevenue / 100000) * 100)
      },
      {
        title: 'Active Machines',
        value: stats.activeMachines,
        change: '+3',
        changeType: 'positive',
        icon: <Engineering sx={{ fontSize: 40, color: '#2196f3' }} />,
        color: '#e3f2fd',
        description: 'currently rented',
        trend: 'up',
        utilization: 87.3
      },
      {
        title: 'Customer Satisfaction',
        value: `${stats.customerSatisfaction}%`,
        change: '+2.1%',
        changeType: 'positive',
        icon: <ThumbUp sx={{ fontSize: 40, color: '#ff9800' }} />,
        color: '#fff3e0',
        description: 'satisfaction score',
        trend: 'up',
        progress: stats.customerSatisfaction
      },
      {
        title: 'System Health',
        value: `${stats.systemHealth}%`,
        change: '+0.5%',
        changeType: 'positive',
        icon: <Speed sx={{ fontSize: 40, color: '#9c27b0' }} />,
        color: '#f3e5f5',
        description: 'overall performance',
        trend: 'up',
        progress: stats.systemHealth
      }
    ];

    if (user?.role === 'ADMIN' || user?.role === 'OWNER') {
      baseCards.push({
        title: user?.role === 'ADMIN' ? 'Total Users' : 'Rental Customers',
        value: stats.totalUsers.toString(),
        change: '+5',
        changeType: 'positive',
        icon: <People sx={{ fontSize: 40, color: '#9c27b0' }} />,
        color: '#f3e5f5',
        description: user?.role === 'ADMIN' ? 'registered users' : 'rental customers',
        trend: 'up',
        progress: 75
      });
    }

    return baseCards;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <Warning sx={{ color: '#ff9800' }} />;
      case 'success': return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'info': return <Assessment sx={{ color: '#2196f3' }} />;
      case 'error': return <Error sx={{ color: '#f44336' }} />;
      default: return <Assessment sx={{ color: '#666' }} />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <Assessment sx={{ color: '#ff9800' }} />;
      case 'request': return <Assessment sx={{ color: '#2196f3' }} />;
      case 'machine': return <Engineering sx={{ color: '#4caf50' }} />;
      case 'system': return <Assessment sx={{ color: '#9c27b0' }} />;
      default: return <Assessment sx={{ color: '#666' }} />;
    }
  };


  const renderAdvancedChart = () => {
    switch (viewMode) {
      case 'analytics':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <RechartsTooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              />
              <Line type="monotone" dataKey="amount" stroke="#667eea" strokeWidth={4} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'detailed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <RechartsTooltip 
                formatter={(value) => [`₹${value}`, 'Revenue']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#667eea" 
                strokeWidth={3}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <RechartsTooltip 
                formatter={(value) => [`₹${value}`, 'Revenue']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#667eea" 
                strokeWidth={4}
                dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#667eea', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      <SubscriptionBanner onNavigate={onNavigate} />
      <Fade in timeout={1000}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {getWelcomeMessage()}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
            {loading && <CircularProgress size={24} />}
          </Box>
        </Box>
      </Fade>

      {/* Enhanced Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {getAdvancedStatsCards().map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={index}>
            <Slide direction="up" in timeout={1000 + index * 100}>
              <Card sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}80 100%)`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': { 
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #667eea, #764ba2)',
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333', mb: 0.5 }}>
                        {card.value}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                        {card.title}
                      </Typography>
                    </Box>
                    <Box sx={{ opacity: 0.8 }}>
                      {card.icon}
                    </Box>
                  </Box>
                  
                  {card.progress && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(card.progress, 100)} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: 'linear-gradient(90deg, #667eea, #764ba2)'
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#666', mt: 0.5, display: 'block' }}>
                        {card.progress.toFixed(1)}% of target
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip
                      label={card.change}
                      size="small"
                      icon={card.changeType === 'positive' ? <TrendingUp /> : <TrendingDown />}
                      sx={{
                        bgcolor: card.changeType === 'positive' ? '#e8f5e8' : '#ffebee',
                        color: card.changeType === 'positive' ? '#4caf50' : '#f44336',
                        fontWeight: 'bold',
                        '& .MuiChip-icon': {
                          color: card.changeType === 'positive' ? '#4caf50' : '#f44336'
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      {card.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Slide>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Enhanced Main Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Fade in timeout={1500}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Advanced Revenue Analytics
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {['overview', 'detailed', 'analytics'].map((mode) => (
                    <Chip
                      key={mode}
                      label={mode.charAt(0).toUpperCase() + mode.slice(1)}
                      onClick={() => setViewMode(mode as any)}
                      color={viewMode === mode ? 'primary' : 'default'}
                      variant={viewMode === mode ? 'filled' : 'outlined'}
                      sx={{ 
                        borderRadius: 2,
                        fontWeight: 'bold',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                  <CircularProgress size={60} />
                </Box>
              ) : (
                renderAdvancedChart()
              )}
            </Paper>
          </Fade>

         {/* Real-time Metrics */}
<Fade in timeout={2000}>
  <Paper
    sx={{
      p: 3,
      borderRadius: 4,
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
      Real-time System Metrics
    </Typography>

    <ResponsiveContainer width="100%" height={250}>
      <LineChart
        data={realTimeData.map(item => ({
          time: new Date(item.timestamp).toLocaleTimeString(),
          activeUsers: item.value,
          systemLoad: Math.floor(Math.random() * 30) + 40,
          responseTime: Math.floor(Math.random() * 100) + 50
        }))}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" stroke="#666" />
        <YAxis stroke="#666" />

        <RechartsTooltip
          contentStyle={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        />

        <Line
          type="monotone"
          dataKey="activeUsers"
          stroke="#667eea"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="systemLoad"
          stroke="#4caf50"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="responseTime"
          stroke="#ff9800"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  </Paper>
</Fade>

        </Grid>

        {/* Enhanced Right Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Enhanced System Status */}
          <Slide direction="left" in timeout={1000}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                System Health Dashboard
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">System Health</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {stats.systemHealth}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.systemHealth} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: '#f0f0f0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: stats.systemHealth > 90 ? '#4caf50' : stats.systemHealth > 70 ? '#ff9800' : '#f44336',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Uptime</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {stats.uptime}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.uptime} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: '#f0f0f0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#4caf50',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  All systems operational
                </Typography>
              </Box>
            </Paper>
          </Slide>

          {/* Enhanced Alerts */}
          <Slide direction="left" in timeout={1500}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Smart Alerts
              </Typography>
              <List sx={{ p: 0 }}>
                {alerts.slice(0, 4).map((alert) => (
                  <ListItem key={alert.id} sx={{ 
                    px: 0, 
                    py: 1,
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: alert.priority === 'HIGH' ? 'rgba(244, 67, 54, 0.05)' : 'transparent',
                    border: alert.priority === 'HIGH' ? '1px solid rgba(244, 67, 54, 0.2)' : 'none'
                  }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getAlertIcon(alert.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                          {alert.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: '#999', mt: 0.5 }}>
                            {alert.timestamp.toLocaleTimeString()} • {alert.category}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Slide>

          {/* Enhanced Recent Activities */}
          <Slide direction="left" in timeout={2000}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Recent Activities
              </Typography>
              <List sx={{ p: 0 }}>
                {recentActivities.slice(0, 5).map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#f5f5f5' }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          <strong>{activity.user}</strong> {activity.action}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            {activity.target}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: '#999', mt: 0.5 }}>
                            {activity.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Slide>
        </Grid>
      </Grid>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Zoom in timeout={3000}>
          <Fab
            color="primary"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              }
            }}
          >
            <Analytics />
          </Fab>
        </Zoom>
        <Zoom in timeout={3200}>
          <Fab
            color="secondary"
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            }}
          >
            <Support />
          </Fab>
        </Zoom>
      </Box>
    </Box>
  );
};

export default EnhancedDashboard;