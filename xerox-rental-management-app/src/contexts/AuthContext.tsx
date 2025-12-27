import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User } from '../types';
import { apiService } from '../services/api';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  loading: boolean;
  validateSession: () => Promise<boolean>;
  checkBackendConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Convert string dates back to Date objects
        if (parsedUser.createdAt) {
          parsedUser.createdAt = new Date(parsedUser.createdAt);
        }
        if (parsedUser.updatedAt) {
          parsedUser.updatedAt = new Date(parsedUser.updatedAt);
        }
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await apiService.login(email, password);

      if (response.success && response.user && response.token) {
        const user = {
          ...response.user,
          createdAt: new Date(response.user.createdAt),
          updatedAt: new Date(response.user.updatedAt)
        };

        setUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('authToken', response.token);

        console.log('Authentication successful for user:', user.email);
        return true;
      } else {
        console.warn('Login failed:', response.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Check if we're in impersonation mode
      const isImpersonating = localStorage.getItem('isImpersonating');
      const adminSession = localStorage.getItem('adminSession');

      if (isImpersonating === 'true' && adminSession) {
        try {
          // Parse the admin session
          const session = JSON.parse(adminSession);
          const adminUser = JSON.parse(session.user);

          // Convert dates
          if (adminUser.createdAt) {
            adminUser.createdAt = new Date(adminUser.createdAt);
          }
          if (adminUser.updatedAt) {
            adminUser.updatedAt = new Date(adminUser.updatedAt);
          }

          // Restore admin session
          localStorage.setItem('authToken', session.token);
          localStorage.setItem('currentUser', session.user);

          // Clean up impersonation flags
          localStorage.removeItem('isImpersonating');
          localStorage.removeItem('adminSession');

          // Update state with admin user
          setUser(adminUser);
          setIsAuthenticated(true);

          console.log('Returned to admin session');

          // Redirect to users page (where admin was before)
          window.location.href = '/users';
          return; // Don't proceed with normal logout
        } catch (error) {
          console.error('Error restoring admin session:', error);
          // If restoration fails, proceed with normal logout
        }
      }

      // Normal logout (not impersonating)
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('isImpersonating');
      localStorage.removeItem('adminSession');
      console.log('User logged out successfully');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    console.log('User profile updated');
  };

  const validateSession = async (): Promise<boolean> => {
    try {
      const response = await apiService.validateSession();
      if (!response.valid) {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  // Add method to check backend connectivity
  const checkBackendConnection = async (): Promise<boolean> => {
    try {
      return await apiService.isBackendAvailable();
    } catch (error) {
      console.error('Backend connection check failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateUser, 
      isAuthenticated, 
      loading,
      validateSession,
      checkBackendConnection
    }}>
      {children}
    </AuthContext.Provider>
  );
};