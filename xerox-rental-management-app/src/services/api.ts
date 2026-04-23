import axios, { type AxiosInstance, type AxiosResponse, AxiosError } from 'axios';
import { type User, type Machine, type Invoice, type RentalRequest, type Contract, type Ticket, type Revenue, type Payment, type PaymentSummary } from '../types';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens (if needed in future)
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('Backend server is not running. Please start the backend server.');
      throw new Error('Backend server is not available. Please check if the server is running on http://localhost:8080');
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

// Helper function to handle API errors
const handleError = (error: AxiosError): never => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data || error.message;
    throw new Error(`API Error: ${message}`);
  } else if (error.request) {
    // Request was made but no response received
    throw new Error('No response from server. Please check your connection.');
  } else {
    // Something else happened
    throw new Error(`Request failed: ${error.message}`);
  }
};

export const apiService = {
  // Health check
  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  },

  async validateSession(): Promise<{ valid: boolean }> {
    try {
      const response = await api.get('/auth/validate');
      return handleResponse(response);
    } catch {
      return { valid: false };
    }
  },

  // Authentication
  async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: User; token?: string }> {
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = handleResponse(response);
      if (data.success && data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/auth/change-password', {
        userId: userId,
        currentPassword,
        newPassword
      });
      return handleResponse(response);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || error.response.data || 'Failed to change password';
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  async impersonateUser(userId: string, adminId: string, adminRole: string): Promise<{ success: boolean; message: string; user?: User; token?: string }> {
    try {
      const response = await api.post(`/auth/impersonate/${userId}`, null, {
        params: {
          adminId,
          adminRole
        }
      });
      const data = handleResponse(response);
      if (data.success && data.token) {
        localStorage.setItem('authToken', data.token);
      }
      return data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },



  // Users
  async getUsers(): Promise<User[]> {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
     
      const response = await api.get('/users', {
        params: {
          currentUserId: currentUser.id,
          currentUserRole: currentUser.role
        }
      });
      const users = handleResponse(response);
     
      return users;
    } catch (error) {
      console.error('API: Error getting users:', error);
      return handleError(error as AxiosError);
    }
  },

  async getUserById(id: string): Promise<User> {
    try {
      const response = await api.get(`/users/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createUser(userData: Partial<User>): Promise<User> {
    try {
      
      // Convert frontend data to backend format
      const requestData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role?.toUpperCase(),
        gstNumber: userData.gstNumber,
        contactNumber: userData.contactNumber,
        address: userData.address,
        isPasswordChanged: userData.isPasswordChanged,
        ownerId: userData.ownerId ? (typeof userData.ownerId === 'string' ? parseInt(userData.ownerId) : userData.ownerId) : null
      };
      
      
      const response = await api.post('/users', requestData);
      const createdUser = handleResponse(response);
     
      return createdUser;
    } catch (error) {
      console.error('API: Error creating user:', error);
      return handleError(error as AxiosError);
    }
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      // Convert frontend data to backend format
      const requestData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role?.toUpperCase(),
        gstNumber: userData.gstNumber,
        contactNumber: userData.contactNumber,
        address: userData.address,
        isPasswordChanged: userData.isPasswordChanged,
        ownerId: userData.ownerId ? parseInt(userData.ownerId) : null
      };
      
      const response = await api.put(`/users/${id}`, requestData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await api.get('/users');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getTechniciansByOwner(ownerId: string): Promise<User[]> {
    try {
      const response = await api.get(`/users/owner/${ownerId}/technicians`);
      const users = handleResponse(response);
      return users.filter((u: User) => u.role === 'TECHNICIAN' && u.ownerId === ownerId);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // Machines
  async getMachines(): Promise<Machine[]> {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const response = await api.get('/machines', {
        params: {
          currentUserId: currentUser.id,
          currentUserRole: currentUser.role
        }
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getMachineById(id: string): Promise<Machine> {
    try {
      const response = await api.get(`/machines/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createMachine(machineData: Partial<Machine>): Promise<Machine> {
    try {
      const response = await api.post('/machines', machineData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateMachine(id: string, machineData: Partial<Machine>): Promise<Machine> {
    try {
      const response = await api.put(`/machines/${id}`, machineData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deleteMachine(id: string): Promise<void> {
    try {
      await api.delete(`/machines/${id}`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getAllMachines(): Promise<Machine[]> {
    try {
      const response = await api.get('/machines');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getMachinesByOwner(ownerId: string): Promise<Machine[]> {
    try {
      const response = await api.get('/machines');
      const machines = handleResponse(response);
      return machines.filter((m: Machine) => m.owner?.id === ownerId);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getMachinesByRental(rentalId: string): Promise<Machine[]> {
    try {
      const response = await api.get('/machines');
      const machines = handleResponse(response);
      return machines.filter((m: Machine) => m.rental?.id === rentalId);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

    // Invoices
  async getInvoices(): Promise<Invoice[]> {
    try {
      const response = await api.get('/invoices');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    try {
      const response = await api.get(`/invoices/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await api.post('/invoices', invoiceData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateInvoice(id: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await api.put(`/invoices/${id}`, invoiceData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deleteInvoice(id: string): Promise<void> {
    try {
      await api.delete(`/invoices/${id}`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getInvoicesByOwner(ownerId: string): Promise<Invoice[]> {
    try {
      const response = await api.get(`/invoices/owner/${ownerId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getInvoicesByRental(rentalId: string): Promise<Invoice[]> {
    try {
      const response = await api.get(`/invoices/rental/${rentalId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getInvoicesByOwnerAndFinancialYear(ownerId: string, fy: string): Promise<Invoice[]> {
    try {
      const response = await api.get(`/invoices/owner/${ownerId}/financial-year/${fy}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getCurrentFinancialYear(): Promise<{ financialYear: string }> {
    try {
      const response = await api.get('/invoices/financial-year/current');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },


  async getLastClosingReading(machineId: string, ownerId: string): Promise<number> {
    try {
      const response = await api.get(`/invoices/machine/${machineId}/owner/${ownerId}/last-reading`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // -- PDF downloads --------------------------------------------------------

  /** Download ORIGINAL copy (for rental customer) */
  async downloadInvoicePdf(id: string): Promise<Blob> {
    try {
      const response = await api.get(`/invoices/${id}/pdf/original`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  /** Download ORIGINAL copy explicitly */
  async downloadOriginalPdf(id: string): Promise<Blob> {
    try {
      const response = await api.get(`/invoices/${id}/pdf/original`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  /** Download OFFICE COPY (retained by owner) */
  async downloadOfficeCopyPdf(id: string): Promise<Blob> {
    try {
      const response = await api.get(`/invoices/${id}/pdf/copy`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  /** Download both copies in a single PDF (page 1 = ORIGINAL, page 2 = OFFICE COPY) */
  async downloadCombinedPdf(id: string): Promise<Blob> {
    try {
      const response = await api.get(`/invoices/${id}/pdf/combined`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // -- Email ----------------------------------------------------------------

  /**
   * Sends ORIGINAL PDF to rental customer's email
   * and OFFICE COPY PDF to owner's email.
   * Returns { message, rentalEmail, ownerEmail }
   */
  async sendInvoiceByEmail(id: string): Promise<{
    message: string;
    rentalEmail: string;
    ownerEmail: string;
  }> {
    try {
      const response = await api.post(`/invoices/${id}/send-email`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
  // Rental Requests
  async getRentalRequests(): Promise<RentalRequest[]> {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const response = await api.get('/rental-requests', {
        params: {
          currentUserId: currentUser.id,
          currentUserRole: currentUser.role
        }
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getRentalRequestById(id: string): Promise<RentalRequest> {
    try {
      const response = await api.get(`/rental-requests/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createRentalRequest(requestData: Partial<RentalRequest>): Promise<RentalRequest> {
    try {
      const response = await api.post('/rental-requests', requestData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateRentalRequest(id: string, requestData: Partial<RentalRequest>): Promise<RentalRequest> {
    try {
      const response = await api.put(`/rental-requests/${id}`, requestData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deleteRentalRequest(id: string): Promise<void> {
    try {
      await api.delete(`/rental-requests/${id}`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async approveRentalRequest(id: string): Promise<RentalRequest> {
    try {
      const response = await api.put(`/rental-requests/${id}/approve`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async rejectRentalRequest(id: string): Promise<RentalRequest> {
    try {
      const response = await api.put(`/rental-requests/${id}/reject`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // Contracts
  async getContracts(): Promise<Contract[]> {
    try {
      const response = await api.get('/contracts');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getContractById(id: string): Promise<Contract> {
    try {
      const response = await api.get(`/contracts/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createContract(contractData: Partial<Contract>): Promise<Contract> {
    try {
      const response = await api.post('/contracts', contractData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateContract(id: string, contractData: Partial<Contract>): Promise<Contract> {
    try {
      const response = await api.put(`/contracts/${id}`, contractData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deleteContract(id: string): Promise<void> {
    try {
      await api.delete(`/contracts/${id}`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // Tickets
  async getTickets(userId?: string, userRole?: string): Promise<Ticket[]> {
    try {
      const params = userId && userRole ? { userId, userRole } : {};
      const response = await api.get('/tickets', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getTicketById(id: string): Promise<Ticket> {
    try {
      const response = await api.get(`/tickets/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    try {
      const response = await api.post('/tickets', ticketData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateTicket(id: string, ticketData: Partial<Ticket>): Promise<Ticket> {
    try {
      const response = await api.put(`/tickets/${id}`, ticketData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deleteTicket(id: string, userId: string, userRole: string): Promise<void> {
    try {
      await api.delete(`/tickets/${id}`, {
        params: { userId, userRole }
      });
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async assignTicket(ticketId: string, userId: string): Promise<Ticket> {
    try {
      const response = await api.put(`/tickets/${ticketId}/assign/${userId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async resolveTicket(id: string): Promise<Ticket> {
    try {
      const response = await api.put(`/tickets/${id}/resolve`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async closeTicket(id: string): Promise<Ticket> {
    try {
      const response = await api.put(`/tickets/${id}/close`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createTicketWithImage(ticketData: {
    title: string;
    description: string;
    priority: string;
    createdById: string;
    ownerId: string;
    machineId?: string;
    image?: File;
  }): Promise<Ticket> {
    try {
      const formData = new FormData();
      formData.append('title', ticketData.title);
      formData.append('description', ticketData.description);
      formData.append('priority', ticketData.priority);
      formData.append('createdById', ticketData.createdById);
      formData.append('ownerId', ticketData.ownerId);

      if (ticketData.machineId) {
        formData.append('machineId', ticketData.machineId);
      }

      if (ticketData.image) {
        formData.append('image', ticketData.image);
      }

      const response = await api.post('/tickets/with-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async assignTicketToTechnician(ticketId: string, technicianId: string, ownerId: string): Promise<Ticket> {
    try {
      const response = await api.put(`/tickets/${ticketId}/assign-technician/${technicianId}/by-owner/${ownerId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getTicketsByOwner(ownerId: string): Promise<Ticket[]> {
    try {
      const response = await api.get(`/tickets/by-owner/${ownerId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getTicketImage(ticketId: string): Promise<Blob> {
    try {
      const response = await api.get(`/tickets/${ticketId}/image`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
  async resolveTicketWithDetails(data: {
  ticketId: string;
  resolutionNotes: string;
  resolvedByUserId: string;
  resolutionImage?: File;
}): Promise<Ticket> {
  try {
    const formData = new FormData();
    formData.append('resolutionNotes', data.resolutionNotes);
    formData.append('resolvedByUserId', data.resolvedByUserId);

    if (data.resolutionImage) {
      formData.append('resolutionImage', data.resolutionImage);
    }

    const response = await api.post(
      `/tickets/${data.ticketId}/resolve-with-details`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return handleResponse(response);
  } catch (error) {
    return handleError(error as AxiosError);
  }
},
async getResolutionImage(filename: string): Promise<Blob> {
  try {
    const response = await api.get(`/tickets/resolution-image/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    return handleError(error as AxiosError);
  }
},
  // Reports and Analytics
  async getRevenue(): Promise<Revenue[]> {
    try {
      const response = await api.get('/reports/revenue');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getDashboardStats(): Promise<{
    totalMachines: number;
    totalInvoices: number;
    totalUsers: number;
    totalRevenue: number;
    pendingInvoices: number;
    activeMachines: number;
  }> {
    try {
      const response = await api.get('/reports/dashboard/stats');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getMachineStatusReport(): Promise<Array<{ status: string; count: number }>> {
    try {
      const response = await api.get('/reports/machines/status');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getUserRoleReport(): Promise<Array<{ role: string; count: number }>> {
    try {
      const response = await api.get('/reports/users/role');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getInvoiceStatusReport(): Promise<Array<{ status: string; count: number }>> {
    try {
      const response = await api.get('/reports/invoices/status');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getOwnerRevenueReport(ownerId: string): Promise<Array<{ month: string; amount: number }>> {
    try {
      const response = await api.get(`/reports/owner/${ownerId}/revenue`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getRentalExpenseReport(rentalId: string): Promise<Array<{ month: string; amount: number }>> {
    try {
      const response = await api.get(`/reports/rental/${rentalId}/expenses`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // Notifications
  async getNotificationsByUser(userId: string): Promise<Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
    createdAt: string;
    isRead: boolean;
    userId: number;
    actionUrl?: string;
  }>> {
    try {
      const response = await api.get(`/notifications/user/${userId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getUnreadNotificationsByUser(userId: string): Promise<Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
    createdAt: string;
    isRead: boolean;
    userId: number;
    actionUrl?: string;
  }>> {
    try {
      const response = await api.get(`/notifications/user/${userId}/unread`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getUnreadNotificationCount(userId: string): Promise<{ count: number }> {
    try {
      const response = await api.get(`/notifications/user/${userId}/unread-count`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await api.put(`/notifications/user/${userId}/read-all`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createNotification(notificationData: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority: string;
  }): Promise<void> {
    try {
      await api.post('/notifications', {
        userId: parseInt(notificationData.userId),
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type.toUpperCase(),
        priority: notificationData.priority.toUpperCase()
      });
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // Machine Health
  async getMachineHealth(): Promise<Array<{
    id: string;
    machineId: string;
    healthScore: number;
    temperature?: number;
    humidity?: number;
    tonerLevel?: number;
    paperLevel?: number;
    errorCount: number;
    pagesPrintedToday: number;
    status: string;
    alerts?: string;
    recommendations?: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    try {
      const response = await api.get('/machine-health');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getMachineHealthByMachine(machineId: string): Promise<{
    id: string;
    machineId: string;
    healthScore: number;
    temperature?: number;
    humidity?: number;
    tonerLevel?: number;
    paperLevel?: number;
    errorCount: number;
    pagesPrintedToday: number;
    status: string;
    alerts?: string;
    recommendations?: string;
    createdAt: string;
    updatedAt: string;
  }> {
    try {
      const response = await api.get(`/machine-health/machine/${machineId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateMachineHealth(machineId: string, healthData: {
    healthScore: number;
    temperature?: number;
    humidity?: number;
    tonerLevel?: number;
    paperLevel?: number;
    errorCount: number;
    pagesPrintedToday: number;
    alerts?: string;
    recommendations?: string;
  }): Promise<void> {
    try {
      await api.post(`/machine-health/machine/${machineId}`, healthData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // Maintenance Schedules
  async getMaintenanceSchedules(): Promise<Array<{
    id: string;
    machineId: string;
    maintenanceType: string;
    scheduledDate: string;
    completedDate?: string;
    technicianId?: string;
    status: string;
    description?: string;
    notes?: string;
    estimatedDuration?: number;
    actualDuration?: number;
    cost?: number;
    createdAt: string;
    updatedAt: string;
  }>> {
    try {
      const response = await api.get('/maintenance-schedules');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createMaintenanceSchedule(scheduleData: {
    machineId: string;
    maintenanceType: string;
    scheduledDate: string;
    description?: string;
    estimatedDuration?: number;
    technicianId?: string;
  }): Promise<void> {
    try {
      const requestData = {
        machine: { id: parseInt(scheduleData.machineId) },
        maintenanceType: scheduleData.maintenanceType,
        scheduledDate: scheduleData.scheduledDate,
        description: scheduleData.description,
        estimatedDuration: scheduleData.estimatedDuration
      };
      
      if (scheduleData.technicianId) {
        requestData.technician = { id: parseInt(scheduleData.technicianId) };
      }
      
      await api.post('/maintenance-schedules', requestData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateMaintenanceSchedule(scheduleId: string, scheduleData: {
    machineId?: string;
    maintenanceType?: string;
    scheduledDate?: string;
    description?: string;
    estimatedDuration?: number;
    status?: string;
    notes?: string;
    cost?: number;
    technicianId?: string;
  }): Promise<void> {
    try {
      const requestData = { ...scheduleData };
      
      if (scheduleData.technicianId) {
        requestData.technician = { id: parseInt(scheduleData.technicianId) };
        delete requestData.technicianId;
      }
      
      await api.put(`/maintenance-schedules/${scheduleId}`, requestData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deleteMaintenanceSchedule(scheduleId: string): Promise<void> {
    try {
      await api.delete(`/maintenance-schedules/${scheduleId}`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
  
  // Audit Logs
  async getAuditLogs(): Promise<Array<{
    id: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    actionType: string;
    createdAt: string;
  }>> {
    try {
      const response = await api.get('/audit-logs');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // Email Services
  async sendEmail(emailData: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void> {
    try {
      await api.post('/email/send', emailData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async sendWelcomeEmail(emailData: {
    to: string;
    name: string;
    tempPassword: string;
  }): Promise<void> {
    try {
      await api.post('/email/welcome', emailData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async sendInvoiceNotification(emailData: {
    to: string;
    invoiceNumber: string;
    amount: number;
  }): Promise<void> {
    try {
      await api.post('/email/invoice-notification', emailData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async sendRentalRequestNotification(emailData: {
    to: string;
    machineName: string;
    requesterName: string;
  }): Promise<void> {
    try {
      await api.post('/email/rental-request-notification', emailData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async sendContractNotification(emailData: {
    to: string;
    machineName: string;
    contractId: string;
  }): Promise<void> {
    try {
      await api.post('/email/contract-notification', emailData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getMachineLocations(): Promise<Array<{
    id: string;
    machine: { id: string; name: string; model: string; serialNumber: string };
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    locationType: string;
    notes?: string;
    recordedAt: string;
    recordedBy?: { id: string; name: string };
    createdAt: string;
    updatedAt: string;
  }>> {
    try {
      const response = await api.get('/machine-locations');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getMachineLocationsByMachineId(machineId: string): Promise<Array<{
    id: string;
    machine: { id: string; name: string; model: string; serialNumber: string };
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    locationType: string;
    notes?: string;
    recordedAt: string;
    recordedBy?: { id: string; name: string };
    createdAt: string;
    updatedAt: string;
  }>> {
    try {
      const response = await api.get(`/machine-locations/machine/${machineId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getCurrentMachineLocation(machineId: string): Promise<{
    id: string;
    machine: { id: string; name: string; model: string; serialNumber: string };
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    locationType: string;
    notes?: string;
    recordedAt: string;
    recordedBy?: { id: string; name: string };
    createdAt: string;
    updatedAt: string;
  }> {
    try {
      const response = await api.get(`/machine-locations/machine/${machineId}/current`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async recordMachineLocation(machineId: string, locationData: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    notes?: string;
    recordedBy?: string;
  }): Promise<void> {
    try {
      await api.post(`/machine-locations/machine/${machineId}/record-current`, locationData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createMachineLocation(locationData: {
    machineId: string;
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    locationType?: string;
    notes?: string;
    recordedAt?: string;
    recordedBy?: string;
  }): Promise<void> {
    try {
      await api.post('/machine-locations', locationData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateMachineLocation(locationId: string, locationData: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    locationType?: string;
    notes?: string;
  }): Promise<void> {
    try {
      await api.put(`/machine-locations/${locationId}`, locationData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deleteMachineLocation(locationId: string): Promise<void> {
    try {
      await api.delete(`/machine-locations/${locationId}`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getDocuments(): Promise<Array<{
    id: string;
    title: string;
    description?: string;
    documentType: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    machine?: { id: string; name: string; serialNumber: string };
    user?: { id: string; name: string; email: string };
    contract?: { id: string; contractNumber: string };
    uploadedBy: { id: string; name: string; email: string };
    version: number;
    status: string;
    expiryDate?: string;
    tags?: string;
    isPublic: boolean;
    downloadCount: number;
    createdAt: string;
    updatedAt: string;
  }>> {
    try {
      const response = await api.get('/documents');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async uploadDocument(file: File, metadata: {
    title: string;
    documentType: string;
    uploadedBy: string;
    description?: string;
    machineId?: string;
    userId?: string;
    contractId?: string;
    expiryDate?: string;
    tags?: string;
    isPublic?: boolean;
  }): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', metadata.title);
      formData.append('documentType', metadata.documentType);
      formData.append('uploadedBy', metadata.uploadedBy);

      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.machineId) formData.append('machineId', metadata.machineId);
      if (metadata.userId) formData.append('userId', metadata.userId);
      if (metadata.contractId) formData.append('contractId', metadata.contractId);
      if (metadata.expiryDate) formData.append('expiryDate', metadata.expiryDate);
      if (metadata.tags) formData.append('tags', metadata.tags);
      if (metadata.isPublic !== undefined) formData.append('isPublic', metadata.isPublic.toString());

      await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateDocument(documentId: string, data: {
    title?: string;
    description?: string;
    documentType?: string;
    status?: string;
    expiryDate?: string;
    tags?: string;
    isPublic?: boolean;
  }): Promise<void> {
    try {
      await api.put(`/documents/${documentId}`, data);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await api.delete(`/documents/${documentId}`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async searchDocuments(query: string): Promise<Array<{
    id: string;
    title: string;
    description?: string;
    documentType: string;
    fileName: string;
    fileSize: number;
    uploadedBy: { id: string; name: string };
    createdAt: string;
  }>> {
    try {
      const response = await api.get(`/documents/search?query=${encodeURIComponent(query)}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getCompanySettings(ownerId: string): Promise<any> {
    try {
      const response = await api.get(`/company-settings/owner/${ownerId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateCompanySettings(ownerId: string, settings: {
    companyName?: string;
    defaultCopyRatio?: number;
    defaultFreeCopies?: number;
    address?: string;
    phone?: string;
    email?: string;
    gstNumber?: string;
  }): Promise<any> {
    try {
      const response = await api.post(`/company-settings/owner/${ownerId}`, settings);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async uploadCompanyLogo(ownerId: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/company-settings/owner/${ownerId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async uploadStampImage(ownerId: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/company-settings/owner/${ownerId}/stamp`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async uploadSignatureImage(ownerId: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/company-settings/owner/${ownerId}/signature`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getLastClosingReading(machineId: string, ownerId: string): Promise<number> {
    try {
      const response = await api.get(`/invoices/machine/${machineId}/owner/${ownerId}/last-reading`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // Subscription Plans
  async getSubscriptionPlans(): Promise<Array<{
    id: number;
    name: string;
    description: string;
    machineLimit: number | null;
    monthlyPrice: number;
    yearlyPrice: number;
    finalMonthlyPrice: number;
    finalYearlyPrice: number;
    trialDays: number;
    active: boolean;
    discountPercentage: number;
    createdAt: string;
    updatedAt: string;
  }>> {
    try {
      const response = await api.get('/subscription-plans');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getActiveSubscriptionPlans(): Promise<Array<{
    id: number;
    name: string;
    description: string;
    machineLimit: number | null;
    monthlyPrice: number;
    yearlyPrice: number;
    finalMonthlyPrice: number;
    finalYearlyPrice: number;
    trialDays: number;
    active: boolean;
    discountPercentage: number;
  }>> {
    try {
      const response = await api.get('/subscription-plans/active');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getSubscriptionPlanById(id: string): Promise<{
    id: number;
    name: string;
    description: string;
    machineLimit: number | null;
    monthlyPrice: number;
    yearlyPrice: number;
    finalMonthlyPrice: number;
    finalYearlyPrice: number;
    trialDays: number;
    active: boolean;
    discountPercentage: number;
  }> {
    try {
      const response = await api.get(`/subscription-plans/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createSubscriptionPlan(planData: {
    name: string;
    description: string;
    machineLimit: number | null;
    monthlyPrice: number;
    yearlyPrice: number;
    trialDays: number;
    active: boolean;
    discountPercentage: number;
  }): Promise<void> {
    try {
      await api.post('/subscription-plans', planData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateSubscriptionPlan(id: string, planData: {
    name?: string;
    description?: string;
    machineLimit?: number | null;
    monthlyPrice?: number;
    yearlyPrice?: number;
    trialDays?: number;
    active?: boolean;
    discountPercentage?: number;
  }): Promise<void> {
    try {
      await api.put(`/subscription-plans/${id}`, planData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deleteSubscriptionPlan(id: string): Promise<void> {
    try {
      await api.delete(`/subscription-plans/${id}`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updateSubscriptionPlanDiscount(id: string, discountPercentage: number): Promise<void> {
    try {
      await api.put(`/subscription-plans/${id}/discount`, null, {
        params: { discountPercentage }
      });
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async activateSubscriptionPlan(id: string): Promise<void> {
    try {
      await api.put(`/subscription-plans/${id}/activate`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deactivateSubscriptionPlan(id: string): Promise<void> {
    try {
      await api.put(`/subscription-plans/${id}/deactivate`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // Subscriptions
  async getAllSubscriptions(): Promise<Array<{
    id: number;
    userId: number;
    userName: string;
    planId: number;
    planName: string;
    status: string;
    billingCycle: string;
    startDate: string;
    endDate: string;
    trialEndDate: string | null;
    autoRenew: boolean;
    amountPaid: number;
    isTrial: boolean;
    machineLimit: number | null;
    currentMachineCount: number;
    daysRemaining: number;
  }>> {
    try {
      const response = await api.get('/subscriptions');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getSubscriptionById(id: string): Promise<{
    id: number;
    userId: number;
    userName: string;
    planId: number;
    planName: string;
    status: string;
    billingCycle: string;
    startDate: string;
    endDate: string;
    trialEndDate: string | null;
    autoRenew: boolean;
    amountPaid: number;
    isTrial: boolean;
    machineLimit: number | null;
    currentMachineCount: number;
    daysRemaining: number;
  }> {
    try {
      const response = await api.get(`/subscriptions/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getUserActiveSubscription(userId: string): Promise<{
    id: number;
    userId: number;
    userName: string;
    planId: number;
    planName: string;
    status: string;
    billingCycle: string;
    startDate: string;
    endDate: string;
    trialEndDate: string | null;
    autoRenew: boolean;
    amountPaid: number;
    isTrial: boolean;
    machineLimit: number | null;
    currentMachineCount: number;
    daysRemaining: number;
  }> {
    try {
      const response = await api.get(`/subscriptions/user/${userId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getUserSubscriptions(userId: string): Promise<Array<{
    id: number;
    planName: string;
    status: string;
    billingCycle: string;
    startDate: string;
    endDate: string;
    amountPaid: number;
  }>> {
    try {
      const response = await api.get(`/subscriptions/user/${userId}/all`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createSubscription(subscriptionData: {
    userId: number;
    planId: number;
    billingCycle: string;
    paymentMethod: string;
    transactionId: string;
  }): Promise<void> {
    try {
      await api.post('/subscriptions', subscriptionData);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async upgradeSubscription(subscriptionId: string, newPlanId: string): Promise<void> {
    try {
      await api.post(`/subscriptions/${subscriptionId}/upgrade`, null, {
        params: { newPlanId }
      });
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async renewSubscription(subscriptionId: string, paymentMethod: string, transactionId: string): Promise<void> {
    try {
      await api.post(`/subscriptions/${subscriptionId}/renew`, null, {
        params: { paymentMethod, transactionId }
      });
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async cancelSubscription(subscriptionId: string): Promise<{
    amountPaid: number;
    totalDays: number;
    daysUsed: number;
    remainingDays: number;
    dailyRate: number;
    refundBeforeFee: number;
    adminFee: number;
    finalRefund: number;
    cancellationDate: string;
  }> {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/cancel`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getRefundEstimate(subscriptionId: string): Promise<{
    amountPaid: number;
    totalDays: number;
    daysUsed: number;
    remainingDays: number;
    dailyRate: number;
    refundBeforeFee: number;
    adminFee: number;
    finalRefund: number;
    cancellationDate: string;
  }> {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}/refund-estimate`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async toggleSubscriptionAutoRenew(subscriptionId: string, enabled: boolean): Promise<void> {
    try {
      await api.put(`/subscriptions/${subscriptionId}/auto-renew`, null, {
        params: { enabled }
      });
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async verifySubscriptionPayment(
    subscriptionId: string,
    adminId: number,
    approved: boolean,
    adminNotes?: string
  ): Promise<{
    id: number;
    status: string;
    paymentVerified: boolean;
  }> {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/verify-payment`, null, {
        params: {
          adminId,
          approved,
          adminNotes: adminNotes || ''
        }
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
  

  async getSubscriptionsByStatus(status: string): Promise<Array<{
    id: number;
    userId: number;
    userName: string;
    planName: string;
    status: string;
    endDate: string;
    daysRemaining: number;
  }>> {
    try {
      const response = await api.get(`/subscriptions/status/${status}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getExpiringSubscriptions(days: number): Promise<Array<{
    id: number;
    userId: number;
    userName: string;
    planName: string;
    endDate: string;
    daysRemaining: number;
  }>> {
    try {
      const response = await api.get('/subscriptions/expiring', {
        params: { days }
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
  async downloadSubscriptionInvoice(subscriptionId: number): Promise<void> {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}/invoice/pdf`, {
        responseType: 'blob', // Important: ensures we get a PDF blob
      });
  
      // Create a blob and trigger a download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `subscription_invoice_${subscriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      window.URL.revokeObjectURL(url);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
  

  // Payment APIs
  async getAllPayments(): Promise<Payment[]> {
    try {
      const response = await api.get('/payments');
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getPaymentById(id: string): Promise<Payment> {
    try {
      const response = await api.get(`/payments/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    try {
      const response = await api.get(`/payments/invoice/${invoiceId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getPaymentsByRental(rentalId: string): Promise<Payment[]> {
    try {
      const response = await api.get(`/payments/rental/${rentalId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getPaymentsByOwner(ownerId: string): Promise<Payment[]> {
    try {
      const response = await api.get(`/payments/owner/${ownerId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async getPaymentSummary(invoiceId: string): Promise<PaymentSummary> {
    try {
      const response = await api.get(`/payments/invoice/${invoiceId}/summary`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async createPayment(paymentData: any): Promise<Payment> {
    try {
      const response = await api.post('/payments', paymentData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async updatePayment(id: string, paymentData: any): Promise<Payment> {
    try {
      const response = await api.put(`/payments/${id}`, paymentData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  async deletePayment(id: string): Promise<void> {
    try {
      const response = await api.delete(`/payments/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
    // Two-Factor Authentication
    async setupTwoFactor(userId: string, appName?: string): Promise<any> {
      try {
        const response = await api.post('/2fa/setup', { userId, appName: appName || 'XeroxRental' });
        return handleResponse(response);
      } catch (error) {
        return handleError(error as AxiosError);
      }
    },
  
    async verifyTwoFactorSetup(userId: string, code: number): Promise<any> {
      try {
        const response = await api.post('/2fa/verify-setup', { userId, code });
        return handleResponse(response);
      } catch (error) {
        return handleError(error as AxiosError);
      }
    },
  
    async verifyTwoFactorCode(userId: string, code: number): Promise<any> {
      try {
        const response = await api.post('/2fa/verify', { userId, code });
        return handleResponse(response);
      } catch (error) {
        return handleError(error as AxiosError);
      }
    },
  
    async verifyBackupCode(userId: string, backupCode: string): Promise<any> {
      try {
        const response = await api.post('/2fa/verify-backup', { userId, backupCode });
        return handleResponse(response);
      } catch (error) {
        return handleError(error as AxiosError);
      }
    },
  
    async verifyTwoFactorLogin(userId: string, code?: number, backupCode?: string): Promise<any> {
      try {
        const response = await api.post('/auth/verify-2fa-login', { userId, code, backupCode });
        const data = handleResponse(response);
        if (data.success && data.token) {
          localStorage.setItem('authToken', data.token);
        }
        return data;
      } catch (error) {
        return handleError(error as AxiosError);
      }
    },
  
    async disableTwoFactor(userId: string, code: number): Promise<any> {
      try {
        const response = await api.post('/2fa/disable', { userId, code });
        return handleResponse(response);
      } catch (error) {
        return handleError(error as AxiosError);
      }
    },
  
    async getBackupCodes(userId: string, code: number): Promise<any> {
      try {
        const response = await api.post('/2fa/backup-codes', { userId, code });
        return handleResponse(response);
      } catch (error) {
        return handleError(error as AxiosError);
      }
    },
  
    async getTwoFactorStatus(userId: string): Promise<any> {
      try {
        const response = await api.get(`/2fa/status/${userId}`);
        return handleResponse(response);
      } catch (error) {
        return handleError(error as AxiosError);
      }
    }
};

export default apiService;

// Export default api instance for direct use in components
export { api };
