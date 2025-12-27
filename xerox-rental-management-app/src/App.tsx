import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/Home/LandingPage';
import SubscriptionGuard from './components/Subscription/SubscriptionGuard';
import { Dashboard } from '@mui/icons-material';
import EnhancedDashboard from './components/Dashboard/EnhancedDashboard';
import UserList from './components/Users/UserList';
import SmartInventory from './components/Inventory/SmartInventory';
import InvoiceList from './components/Invoices/InvoiceList';
import ContractList from './components/Contracts/ContractList';
import RentalRequestList from './components/RentalRequests/RentalRequestList';
import ComprehensiveReports from './components/Reports/ComprehensiveReports';
import TicketList from './components/Tickets/TicketList';
import ProfileManagement from './components/Profile/ProfileManagement';
import IoTDashboard from './components/IoT/IoTDashboard';
import WorkflowBuilder from './components/Automation/WorkflowBuilder';
import PredictiveAnalytics from './components/Predictive/PredictiveAnalytics';
import AdvancedReporting from './components/Advanced/AdvancedReporting';
import MachineHealthList from './components/MachineHealth/MachineHealthList';
import MaintenanceScheduleList from './components/Maintenance/MaintenanceScheduleList';
import AuditLogList from './components/Audit/AuditLogList';
import MachineLocationTracking from './components/Geolocation/MachineLocationTracking';
import DocumentManagement from './components/Document/DocumentManagement';
import CompanySettings from './components/Setting/CompanySettings';
import SubscriptionDashboard from './components/Subscription/SubscriptionDashboard';
import AdminPlanManagement from './components/Subscription/AdminPlanManagement';
import SubscriptionPlans from './components/Subscription/SubscriptionPlans';
import Header from './components/Auth/Layout/Header';

import Login from './components/Auth/Login';
import Sidebar from './components/Layout/Sidebar';
import AdminSubscriptionVerification from './components/Subscription/AdminSubscriptionVerification';
import RateLimitDashboard from './components/RateLimit/RateLimitDashboard';
import TicketListEnhanced from './components/Tickets/TicketListEnhanced';
import RoleBasedDashboard from './components/Dashboard/RoleBasedDashboard';


const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState('home');
  const [showLogin, setShowLogin] = useState(false);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuItemSelect = (item: string) => {
    setSelectedMenuItem(item);
    setSidebarOpen(false);
  };

  const handleProfileClick = () => {
    setSelectedMenuItem('profile');
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (selectedMenuItem) {
      case 'home':
        return <LandingPage onLogin={() => setShowLogin(true)} onNavigate={handleMenuItemSelect} />;
      case 'dashboard':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            {user?.role === 'TECHNICIAN' ? <Dashboard /> : <EnhancedDashboard onNavigate={handleMenuItemSelect} />}
          </SubscriptionGuard>
        );
      case 'users':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <UserList />
          </SubscriptionGuard>
        );
        case 'dashboard1':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <RoleBasedDashboard />
          </SubscriptionGuard>
        );
      case 'machines':
      case 'inventory':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <SmartInventory />
          </SubscriptionGuard>
        );
      case 'invoices':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <InvoiceList />
          </SubscriptionGuard>
        );
      case 'contracts':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <ContractList />
          </SubscriptionGuard>
        );
      case 'requests':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <RentalRequestList />
          </SubscriptionGuard>
        );
      case 'reports':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <ComprehensiveReports />
          </SubscriptionGuard>
        );
      case 'analytics':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <Dashboard />
          </SubscriptionGuard>
        );
      case 'tickets':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <TicketListEnhanced />
          </SubscriptionGuard>
        );
      case 'profile':
        return <ProfileManagement />;
      case 'iot':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <IoTDashboard />
          </SubscriptionGuard>
        );
      case 'automation':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <WorkflowBuilder />
          </SubscriptionGuard>
        );
      case 'predictive':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <PredictiveAnalytics />
          </SubscriptionGuard>
        );
      case 'advanced-reports':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <AdvancedReporting />
          </SubscriptionGuard>
        );
      case 'machine-health':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <MachineHealthList />
          </SubscriptionGuard>
        );
      case 'maintenance':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <MaintenanceScheduleList />
          </SubscriptionGuard>
        );
      case 'audit-logs':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <AuditLogList />
          </SubscriptionGuard>
        );
      case 'security':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <AuditLogList />
          </SubscriptionGuard>
        );
      case 'geolocation':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <MachineLocationTracking />
          </SubscriptionGuard>
        );
      case 'documents':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <DocumentManagement />
          </SubscriptionGuard>
        );
        case 'rate-limiting':
          return (
            <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
              <RateLimitDashboard />
            </SubscriptionGuard>
          );
      case 'company-settings':
        return (
          <SubscriptionGuard onNavigateToPlans={() => handleMenuItemSelect('subscription-plans')}>
            <CompanySettings />
          </SubscriptionGuard>
        );
      case 'subscription':
        return <SubscriptionDashboard onNavigate={handleMenuItemSelect} />;
      case 'subscription-plans':
        return user?.role === 'ADMIN' ? <AdminPlanManagement /> : <SubscriptionPlans />;
        case 'subscription-verification':
        return user?.role === 'ADMIN' ? <AdminSubscriptionVerification /> : <LandingPage onLogin={() => setShowLogin(true)} onNavigate={handleMenuItemSelect} />;
      default:
        return <LandingPage onLogin={() => setShowLogin(true)} onNavigate={handleMenuItemSelect} />;
    }
  };

  if (!isAuthenticated && showLogin) {
    return <Login />;
  }

  if (!isAuthenticated) {
    return <LandingPage onLogin={() => setShowLogin(true)} onNavigate={handleMenuItemSelect} />;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuToggle={handleMenuToggle} onProfileClick={handleProfileClick} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedItem={selectedMenuItem}
        onItemSelect={handleMenuItemSelect}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8,
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;