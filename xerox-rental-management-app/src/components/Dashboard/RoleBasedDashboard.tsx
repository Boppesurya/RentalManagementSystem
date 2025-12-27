import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  LocalPrintshop,
  Receipt,
  People,
  AttachMoney,
  Assignment,
  Warning,
  CheckCircle,
  Schedule,
  Build,
  Refresh,
  ArrowForward,
  Download,
  CalendarToday,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Invoice, type Machine, type Ticket, type User } from '../../types';
import { format, addMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import Papa from 'papaparse';

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];

interface DashboardStats {
  totalMachines: number;
  totalInvoices: number;
  totalUsers: number;
  totalRevenue: number;
  pendingInvoices: number;
  activeMachines: number;
  openTickets: number;
  resolvedTickets: number;
}

interface RevenueData {
  month: string;
  amount: number;
  invoiceCount: number;
}
interface ForecastData {
  month: string;
  forecast: number;
}

const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMachines: 0,
    totalInvoices: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    activeMachines: 0,
    openTickets: 0,
    resolvedTickets: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [machineStatusData, setMachineStatusData] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* --------------------------------------------------------------- */
  /*  Download Anchor (for CSV)                                      */
  /* --------------------------------------------------------------- */
  const [downloadAnchor, setDownloadAnchor] = useState<HTMLAnchorElement | null>(null);

  const createDownloadLink = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    setDownloadAnchor(link);
    return link;
  };

  const triggerDownload = (link: HTMLAnchorElement) => {
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    setDownloadAnchor(null);
  };

  /* --------------------------------------------------------------- */
  /*  Load & Process Data                                            */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [machines, invoices, tickets, users] = await Promise.all([
        loadMachines(),
        loadInvoices(),
        loadTickets(),
        user.role === 'ADMIN' ? apiService.getUsers() : Promise.resolve([]),
      ]);

      calculateStats(machines, invoices, tickets, users);
      prepareRevenueData(invoices);
      prepareForecastData(machines, invoices);
      prepareMachineStatusData(machines);

      setRecentInvoices(invoices.slice(0, 5));
      setRecentTickets(tickets.slice(0, 5));
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------- Data loaders per role ------------------- */
  const loadMachines = async (): Promise<Machine[]> => {
    if (!user) return [];
    switch (user.role) {
      case 'ADMIN':
        return await apiService.getMachines();
      case 'OWNER':
        return await apiService.getMachinesByOwner(user.id);
      case 'RENTAL':
        return await apiService.getMachinesByRental(user.id);
      default:
        return [];
    }
  };
  const loadInvoices = async (): Promise<Invoice[]> => {
    if (!user) return [];
    switch (user.role) {
      case 'ADMIN':
        return await apiService.getInvoices();
      case 'OWNER':
        return await apiService.getInvoicesByOwner(user.id);
      case 'RENTAL':
        return await apiService.getInvoicesByRental(user.id);
      default:
        return [];
    }
  };
  const loadTickets = async (): Promise<Ticket[]> => {
    if (!user) return [];
    return await apiService.getTickets(user.id, user.role);
  };

  /* ------------------- Stats calculation ----------------------- */
  const calculateStats = (
    machines: Machine[],
    invoices: Invoice[],
    tickets: Ticket[],
    users: User[]
  ) => {
    const totalRevenue = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const pendingInvoices = invoices.filter(i => i.status === 'PENDING').length;
    const activeMachines = machines.filter(m => m.status === 'RENTED').length;
    const openTickets = tickets.filter(t => t.status === 'IN-PROGRESS').length;
    const resolvedTickets = tickets.filter(t => t.status === 'CLOSED').length;

    setStats({
      totalMachines: machines.length,
      totalInvoices: invoices.length,
      totalUsers: users.length,
      totalRevenue,
      pendingInvoices,
      activeMachines,
      openTickets,
      resolvedTickets,
    });
  };

  /* ------------------- Revenue (past) -------------------------- */
  const prepareRevenueData = (invoices: Invoice[]) => {
    const monthly: { [k: string]: { amount: number; count: number } } = {};
    invoices.forEach(inv => {
      const d = new Date(inv.createdAt);
      const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
      if (!monthly[key]) monthly[key] = { amount: 0, count: 0 };
      monthly[key].amount += inv.totalAmount || 0;
      monthly[key].count += 1;
    });
    const data = Object.entries(monthly)
      .map(([month, v]) => ({ month, amount: v.amount, invoiceCount: v.count }))
      .slice(-6);
    setRevenueData(data);
  };

  /* ------------------- Forecast (future) ----------------------- */
  const prepareForecastData = (machines: Machine[], invoices: Invoice[]) => {
    // Build a map: machineId → monthly rental rate
    const rateMap = new Map<string, number>();
    machines.forEach(m => {
      if (m.status === 'RENTED' && m.monthlyRent) {
        rateMap.set(m.id, m.monthlyRent);
      }
    });

    // Gather all active rentals (machines with endDate in future)
    const now = new Date();
    const forecast: { [key: string]: number } = {};

    machines.forEach(m => {
      if (m.status !== 'RENTED' || !m.lastServiceDate) return;
      const rate = rateMap.get(m.id) ?? 0;
      if (rate === 0) return;

      const end = new Date(m.lastServiceDate);
      if (end < now) return; // already finished

      // Generate months from next month up to 6 months ahead
      for (let i = 1; i <= 6; i++) {
        const target = addMonths(startOfMonth(now), i);
        const monthKey = format(target, 'MMM yyyy');

        // Check if the rental covers the whole target month
        const monthStart = target;
        const monthEnd = endOfMonth(target);
        if (
          isWithinInterval(monthStart, { start: now, end }) &&
          isWithinInterval(monthEnd, { start: now, end })
        ) {
          forecast[monthKey] = (forecast[monthKey] || 0) + rate;
        }
      }
    });

    const data: ForecastData[] = Object.entries(forecast)
      .map(([month, forecast]) => ({ month, forecast }))
      .slice(0, 6);
    setForecastData(data);
  };

  /* ------------------- Machine status pie ---------------------- */
  const prepareMachineStatusData = (machines: Machine[]) => {
    const counts: { [k: string]: number } = {};
    machines.forEach(m => {
      const s = m.status ?? 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    const data = Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      value,
    }));
    setMachineStatusData(data);
  };

  /* ------------------- Helpers --------------------------------- */
  const getWelcomeMessage = () => {
    const h = new Date().getHours();
    const greeting = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
    return `${greeting}, ${user?.name || 'User'}`;
  };
  const getRoleDashboardTitle = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'Admin Dashboard - System Overview';
      case 'OWNER':
        return 'Owner Dashboard - Business Management';
      case 'RENTAL':
        return 'My Dashboard - Rental Overview';
      case 'TECHNICIAN':
        return 'Technician Dashboard - Service Management';
      default:
        return 'Dashboard';
    }
  };

  /* ------------------- Download My Data ------------------------ */
  const downloadMyData = async () => {
    if (!user) return;
    try {
      const [machines, invoices, tickets] = await Promise.all([
        loadMachines(),
        loadInvoices(),
        loadTickets(),
      ]);

      const csvMachines = Papa.unparse(machines.map(m => ({
        id: m.id,
        name: m.name,
        model: m.model,
        status: m.status,
        rentalRate: m.monthlyRent,
        startDate: m.installationDate,
        endDate: m.lastServiceDate,
      })));

      const csvInvoices = Papa.unparse(invoices.map(i => ({
        invoiceNumber: i.invoiceNumber,
        totalAmount: i.totalAmount,
        status: i.status,
        createdAt: i.createdAt,
        dueDate: i.dueDate,
      })));

      const csvTickets = Papa.unparse(tickets.map(t => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        createdAt: t.createdAt,
      })));

      const zip = await import('jszip').then(mod => new mod.default());
      zip.file('machines.csv', csvMachines);
      zip.file('invoices.csv', csvInvoices);
      zip.file('tickets.csv', csvTickets);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my_data_${user.id}_${format(new Date(), 'yyyyMMdd')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to generate download. Check console.');
    }
  };

  /* ------------------- Stat Card Component -------------------- */
  const StatCard = ({ title, value, icon, trend, color }: any) => (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        transition: 'all 0.3s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color, mt: 1 }}>
              {value}
            </Typography>
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                  {Math.abs(trend)}% from last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  /* --------------------------------------------------------------- */
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadDashboardData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {getWelcomeMessage()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getRoleDashboardTitle()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={loadDashboardData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download My Data">
            <IconButton onClick={downloadMyData} color="secondary">
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {user?.role === 'ADMIN' && (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Total Users" value={stats.totalUsers} icon={<People />} trend={8.5} color="#2563eb" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Total Machines" value={stats.totalMachines} icon={<LocalPrintshop />} trend={12.3} color="#7c3aed" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<AttachMoney />} trend={15.2} color="#16a34a" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Open Tickets" value={stats.openTickets} icon={<Assignment />} trend={-5.4} color="#ea580c" />
            </Grid>
          </>
        )}
        {user?.role === 'OWNER' && (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="My Machines" value={stats.totalMachines} icon={<LocalPrintshop />} trend={10.5} color="#2563eb" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Active Rentals" value={stats.activeMachines} icon={<CheckCircle />} trend={8.2} color="#16a34a" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<AttachMoney />} trend={18.7} color="#7c3aed" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Pending Invoices" value={stats.pendingInvoices} icon={<Receipt />} trend={-3.2} color="#ea580c" />
            </Grid>
          </>
        )}
        {user?.role === 'RENTAL' && (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Rented Machines" value={stats.activeMachines} icon={<LocalPrintshop />} color="#2563eb" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Total Invoices" value={stats.totalInvoices} icon={<Receipt />} color="#7c3aed" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Pending Payments" value={stats.pendingInvoices} icon={<Warning />} color="#ea580c" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Support Tickets" value={stats.openTickets} icon={<Assignment />} color="#16a34a" />
            </Grid>
          </>
        )}
        {user?.role === 'TECHNICIAN' && (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Assigned Tickets" value={stats.openTickets} icon={<Assignment />} color="#2563eb" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Resolved Tickets" value={stats.resolvedTickets} icon={<CheckCircle />} color="#16a34a" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Machines Serviced" value={stats.totalMachines} icon={<Build />} color="#7c3aed" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Pending Tasks" value={stats.openTickets} icon={<Schedule />} color="#ea580c" />
            </Grid>
          </>
        )}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Past Revenue */}
        {(user?.role === 'ADMIN' || user?.role === 'OWNER' || user?.role === 'RENTAL') && revenueData.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Revenue Trend (Past 6 Months)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Future Forecast – visible for OWNER & ADMIN */}
        {(user?.role === 'ADMIN' || user?.role === 'OWNER') && forecastData.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Forecasted Monthly Income (Next 6 Months)
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={270}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5 }}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Machine Status Pie */}
        {(user?.role === 'ADMIN' || user?.role === 'OWNER') && machineStatusData.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Machine Status
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={machineStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {machineStatusData.map((_entry, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        {recentInvoices.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Invoices
                </Typography>
                <Button size="small" endIcon={<ArrowForward />}>
                  View All
                </Button>
              </Box>
              <List>
                {recentInvoices.map((inv, idx) => (
                  <React.Fragment key={inv.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Receipt color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Invoice #${inv.invoiceNumber}`}
                        secondary={`${inv.rental?.name || 'N/A'} - ₹${inv.totalAmount?.toLocaleString()}`}
                      />
                      <Chip
                        label={inv.status}
                        size="small"
                        color={inv.status === 'PAID' ? 'success' : 'warning'}
                      />
                    </ListItem>
                    {idx < recentInvoices.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {recentTickets.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Tickets
                </Typography>
                <Button size="small" endIcon={<ArrowForward />}>
                  View All
                </Button>
              </Box>
              <List>
                {recentTickets.map((t, idx) => (
                  <React.Fragment key={t.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Assignment
                          color={
                            t.priority === 'HIGH' ? 'error' : t.priority === 'MEDIUM' ? 'warning' : 'success'
                          }
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={t.title}
                        secondary={`${t.createdBy?.name || 'Unknown'} - ${t.priority} priority`}
                      />
                      <Chip
                        label={t.status}
                        size="small"
                        color={
                          t.status === 'RESOLVED' || t.status === 'CLOSED'
                            ? 'success'
                            : t.status === 'IN-PROGRESS'
                              ? 'info'
                              : 'default'
                        }
                      />
                    </ListItem>
                    {idx < recentTickets.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default RoleBasedDashboard;