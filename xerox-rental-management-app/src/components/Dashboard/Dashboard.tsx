import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Chip
} from '@mui/material';
import {
  LocalPrintshop,
  Receipt,
  People,
  AttachMoney
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Revenue } from '../../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [revenueData, setRevenueData] = useState<Revenue[]>([]);
  const [stats, setStats] = useState({
    totalMachines: 0,
    totalInvoices: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    activeMachines: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [revenue, machines, invoices, users] = await Promise.all([
        apiService.getRevenue(),
        apiService.getMachines(),
        apiService.getInvoices(),
        apiService.getUsers()
      ]);

      setRevenueData(revenue);
      
      setStats({
        totalMachines: machines.length,
        totalInvoices: invoices.length,
        totalUsers: users.length,
        totalRevenue: revenue.reduce((sum, r) => sum + r.amount, 0),
        pendingInvoices: invoices.filter(i => i.status === 'PENDING').length,
        activeMachines: machines.filter(m => m.status === 'RENTED').length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'Welcome to the Admin Dashboard';
      case 'OWNER':
        return 'Welcome to the Owner Dashboard';
      case 'RENTAL':
        return 'Welcome to the Rental Dashboard';
      default:
        return 'Welcome to the Dashboard';
    }
  };

  const getStatsCards = () => {
    const baseCards = [
      {
        title: 'Total Revenue',
        value: `₹${stats.totalRevenue.toLocaleString()}`,
        icon: <AttachMoney sx={{ fontSize: 40, color: '#4caf50' }} />,
        color: '#e8f5e8'
      },
      {
        title: 'Active Machines',
        value: stats.activeMachines,
        icon: <LocalPrintshop sx={{ fontSize: 40, color: '#2196f3' }} />,
        color: '#e3f2fd'
      },
      {
        title: 'Pending Invoices',
        value: stats.pendingInvoices,
        icon: <Receipt sx={{ fontSize: 40, color: '#ff9800' }} />,
        color: '#fff3e0'
      }
    ];

    if (user?.role === 'ADMIN') {
      baseCards.push({
        title: 'Total Users',
        value: stats.totalUsers,
        icon: <People sx={{ fontSize: 40, color: '#9c27b0' }} />,
        color: '#f3e5f5'
      });
    }

    return baseCards;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        {getWelcomeMessage()}
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
        Here's an overview of your {user?.role} activities
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {getStatsCards().map((card, index) => (
          <Grid size={{ xs: 12, sm: 6,md:4}} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: card.color,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                borderRadius: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                      {card.title}
                    </Typography>
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Revenue Chart */}
      <Grid container spacing={3}>
        <Grid size={{xs:12, md:8}}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Monthly Revenue Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{xs:12, md:4}}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Invoice Count by Month
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="invoiceCount" fill="#764ba2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{xs:12}}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {user?.role === 'ADMIN' && (
                <>
                  <Chip label="Add New User" variant="outlined" />
                  <Chip label="View All Reports" variant="outlined" />
                  <Chip label="Machine Inventory" variant="outlined" />
                </>
              )}
              {user?.role === 'OWNER' && (
                <>
                  <Chip label="Add New Machine" variant="outlined" />
                  <Chip label="Generate Invoice" variant="outlined" />
                  <Chip label="View Contracts" variant="outlined" />
                </>
              )}
              {user?.role === 'RENTAL' && (
                <>
                  <Chip label="Request Machine" variant="outlined" />
                  <Chip label="Pay Invoice" variant="outlined" />
                  <Chip label="Create Ticket" variant="outlined" />
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;