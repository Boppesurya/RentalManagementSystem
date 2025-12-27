import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Security,
  Analytics,
  CloudDone,
  Support,
  Inventory2,
  Receipt,
  Business,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface LandingPageProps {
  onLogin: () => void;
  onNavigate?: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onNavigate }) => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Inventory2 sx={{ fontSize: 40 }} />,
      title: 'Smart Inventory',
      description: 'Manage your xerox machines with real-time tracking and automated alerts.',
      color: '#667eea',
    },
    {
      icon: <Receipt sx={{ fontSize: 40 }} />,
      title: 'Invoice Management',
      description: 'Generate professional invoices with GST compliance and automated billing.',
      color: '#764ba2',
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: 'Business Analytics',
      description: 'Get insights with advanced analytics and comprehensive reporting tools.',
      color: '#f093fb',
    },
    {
      icon: <Business sx={{ fontSize: 40 }} />,
      title: 'Contract Management',
      description: 'Streamline rental agreements and track contract lifecycles effortlessly.',
      color: '#4facfe',
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Real-Time Monitoring',
      description: 'Monitor machine health, performance metrics, and usage statistics live.',
      color: '#43e97b',
    },
    {
      icon: <Support sx={{ fontSize: 40 }} />,
      title: '24/7 Support',
      description: 'Integrated ticket system for maintenance requests and customer support.',
      color: '#fa709a',
    },
  ];

  const benefits = [
    'Reduce operational costs by up to 40%',
    'Automate billing and invoicing processes',
    'Track machine performance in real-time',
    'Generate detailed business reports',
    'Manage multiple locations effortlessly',
    'Secure cloud-based data storage',
  ];

  const stats = [
    { value: '500+', label: 'Active Users' },
    { value: '10K+', label: 'Machines Managed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={8}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                }}
              >
                RM
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                 Rental
              </Typography>
            </Box>

            {!isAuthenticated && (
              <Button
                variant="contained"
                size="large"
                onClick={onLogin}
                sx={{
                  bgcolor: 'white',
                  color: '#667eea',
                  fontWeight: 'bold',
                  px: 4,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  },
                }}
              >
                Sign In
              </Button>
            )}
          </Box>

          {/* Hero Content */}
          <Grid container spacing={6} alignItems="center">
            <Grid size={{xs:12,md:6}}>
              <Chip
                label="Cloud-Based Solution"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 2,
                }}
              />
              <Typography variant="h2" fontWeight="bold" gutterBottom>
                Modern  Rental Management
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.95 }}>
                Streamline your rental business with powerful tools for inventory,
                billing, analytics, and customer management.
              </Typography>

              <Box display="flex" gap={2} flexWrap="wrap">
                {isAuthenticated ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => onNavigate?.('dashboard')}
                    sx={{
                      bgcolor: 'white',
                      color: '#667eea',
                      fontWeight: 'bold',
                      px: 4,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                      },
                    }}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={onLogin}
                      sx={{
                        bgcolor: 'white',
                        color: '#667eea',
                        fontWeight: 'bold',
                        px: 4,
                        py: 1.5,
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.9)',
                        },
                      }}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        fontWeight: 'bold',
                        px: 4,
                        py: 1.5,
                        '&:hover': {
                          borderColor: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)',
                        },
                      }}
                    >
                      Learn More
                    </Button>
                  </>
                )}
              </Box>
            </Grid>

            <Grid size={{xs:12,md:6}}>
              <Box
                sx={{
                  position: 'relative',
                  height: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Paper
                  elevation={10}
                  sx={{
                    p: 4,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    borderRadius: 4,
                    maxWidth: 400,
                  }}
                >
                  <Box textAlign="center">
                    <Inventory2 sx={{ fontSize: 80, color: '#667eea', mb: 2 }} />
                    <Typography variant="h5" fontWeight="bold" color="text.primary" mb={2}>
                      All-in-One Platform
                    </Typography>
                    <Typography color="text.secondary">
                      Manage inventory, track performance, generate invoices, and analyze
                      business metrics from one powerful dashboard.
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Grid>
          </Grid>

          {/* Stats */}
          <Grid container spacing={3} sx={{ mt: 6 }}>
            {stats.map((stat, index) => (
              <Grid size={{xs:12,md:3}} key={index}>
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <Typography variant="h3" fontWeight="bold" color="white">
                    {stat.value}
                  </Typography>
                  <Typography color="rgba(255,255,255,0.9)">{stat.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box textAlign="center" mb={8}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Powerful Features
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Everything you need to run a successful  rental business
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid size={{xs:12,md:4}} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: feature.color,
                      mb: 2,
                      mx: 'auto',
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">{feature.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: '#f8fafc', py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{xs:12,md:6}}>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Why Choose Us?
              </Typography>
              <Typography variant="h6" color="text.secondary" paragraph>
                Built by industry experts, designed for growth
              </Typography>

              <Box sx={{ mt: 4 }}>
                {benefits.map((benefit, index) => (
                  <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                    <CheckCircle sx={{ color: '#43e97b', fontSize: 28 }} />
                    <Typography variant="body1" fontSize={16}>
                      {benefit}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {!isAuthenticated && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={onLogin}
                  sx={{
                    mt: 4,
                    bgcolor: '#667eea',
                    fontWeight: 'bold',
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Start Free Trial
                </Button>
              )}
            </Grid>

            <Grid size={{xs:12,md:6}}>
              <Box
                sx={{
                  position: 'relative',
                  height: 400,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  p: 4,
                }}
              >
                <Box textAlign="center">
                  <CloudDone sx={{ fontSize: 120, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Cloud-Based
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Access your business from anywhere, anytime
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: 10 }}>
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Ready to Transform Your Business?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
            {isAuthenticated
              ? 'Continue managing your rental business with ease'
              : 'Join hundreds of businesses already using our platform'}
          </Typography>

          {isAuthenticated ? (
            <Button
              variant="contained"
              size="large"
              onClick={() => onNavigate?.('dashboard')}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                fontWeight: 'bold',
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                },
              }}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={onLogin}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                fontWeight: 'bold',
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                },
              }}
            >
              Get Started Now
            </Button>
          )}
        </Paper>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a202c', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{xs:12,md:4}}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: '#667eea',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                  }}
                >
                  XR
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Xerox Rental
                </Typography>
              </Box>
              <Typography color="rgba(255,255,255,0.7)">
                Modern solution for  rental management. Streamline operations, increase
                efficiency, and grow your business.
              </Typography>
            </Grid>

            <Grid size={{xs:12,md:4}}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Features
              </Typography>
              <Box sx={{ '& > *': { display: 'block', color: 'rgba(255,255,255,0.7)', mb: 1 } }}>
                <Typography>Inventory Management</Typography>
                <Typography>Invoice Generation</Typography>
                <Typography>Business Analytics</Typography>
                <Typography>Contract Management</Typography>
              </Box>
            </Grid>

            <Grid size={{xs:12,md:4}}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Contact
              </Typography>
              <Box sx={{ '& > *': { color: 'rgba(255,255,255,0.7)', mb: 1 } }}>
                <Typography>Email: support@xeroxrental.com</Typography>
                <Typography>Phone: +91 1234567890</Typography>
                <Typography>Available 24/7</Typography>
              </Box>
            </Grid>
          </Grid>

          <Box mt={6} pt={4} borderTop="1px solid rgba(255,255,255,0.1)" textAlign="center">
            <Typography color="rgba(255,255,255,0.7)">
              © {new Date().getFullYear()}  Rental Management System. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
