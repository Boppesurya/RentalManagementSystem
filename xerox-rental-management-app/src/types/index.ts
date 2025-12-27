export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OWNER' | 'RENTAL'|'TECHNICIAN';
  gstNumber?: string;
  contactNumber: string;
  address: string;
  isPasswordChanged: boolean;
  owner?: { id: string; name?: string };
  ownerId?: string;
  password?: string;
  // Bank details
  bankAccountHolderName?: string;
  bankAccountNumber?: string;  // Plain text for input/edit
  bankAccountNumberMasked?: string;  // Masked version for display
  bankIfscCode?: string;
  bankName?: string;
  bankBranch?: string;
  upiId?: string;
  // Two-Factor Authentication
  twoFactorEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TwoFactorSetupResponse {
  success: boolean;
  secret: string;
  qrCode: string;
  backupCodes: string[];
  otpAuthURL: string;
  message?: string;
}

export interface TwoFactorVerifyResponse {
  success: boolean;
  message: string;
}

export interface TwoFactorStatusResponse {
  success: boolean;
  enabled: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  requiresTwoFactor?: boolean;
  tempUserId?: string;
}

export interface Machine {
  ownerId: string;
  rentalId: string;
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  location: string;
  usage: number;
  owner: { id: string; name?: string };
  rental?: { id: string; name?: string };
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
  monthlyRent: number;
  installationDate: Date;
  lastServiceDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: 'ONLINE' | 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'NEFT' | 'RTGS' | 'IMPS';
  paymentReference?: string;
  paymentDate: Date;
  remarks?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
  processedBy?: { id: string; name: string; email: string };
  createdAt: Date;
}

export interface PaymentSummary {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  paymentCount: number;
  status: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  rental: { id: string; name?: string };
  owner: { id: string; name?: string };
  machine: { id: string; name?: string };
  amount: number;
  gstAmount: number;
  totalAmount: number;
  startingReading?: number;
  closingReading?: number;
  totalCopies?: number;
  copyRatio?: number;
  freeCopies?: number;
  billableCopies?: number;
  classification?: string;
  monthlyRent?: number;
  companyLogoUrl?: string;
  stampImageUrl?: string;
  signatureImageUrl?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: Date;
  paidDate?: Date;
  paymentMode?: 'ONLINE' | 'OFFLINE';
  createdAt: Date;
  updatedAt: Date;
}



export interface RentalRequest {
  id: string;
  rental: { id: string; name?: string };
  owner: { id: string; name?: string };
  
  machine: { id: string; name?: string };
  requestDate: Date;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  owner: { id: string; name?: string };
  rental: { id: string; name?: string };
  machine: { id: string; name?: string };
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  terms: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN-PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdBy: { id: string; name?: string };
  assignedTo?: { id: string; name?: string };
  owner?: { id: string; name?: string };
  ownerId: string;
  machine?: { id: string; name?: string } | string | null;
  imageUrl?: string;
  imageFileName?: string;
  emailSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Revenue {
  month: string;
  amount: number;
  invoiceCount: number;
  userLevel:'ADMIN' | 'OWNER' | 'RENTAL';
}

export interface MachineHealth {
  id: string;
  machineId: string;
  healthScore: number;
  temperature?: number;
  humidity?: number;
  tonerLevel?: number;
  paperLevel?: number;
  errorCount: number;
  pagesPrintedToday: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  alerts?: string;
  recommendations?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceSchedule {
  id: string;
  machineId: string;
  maintenanceType: string;
  scheduledDate: Date;
  completedDate?: Date;
 
  technicianId?: string;
  status: 'SCHEDULED' | 'IN-PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  description?: string;
  notes?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'MAINTENANCE' | 'PAYMENT' | 'SYSTEM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH'|'CRITICAL';
  userId: string;
  isRead: boolean;
  actionUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  actionType: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
  createdAt: Date;
}

// Additional interfaces for advanced features
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: string;
}

export interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  condition: string;
  action: string;
  parameters: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: string;
  steps: WorkflowStep[];
  lastGenerated: Date;
  recipients: string[];
}

export interface ReportData {
  revenue_trend: Array<{
    month: string;
    revenue: number;
    profit: number;
    expenses: number;
    growth: number;
    forecast: number;
    benchmark: number;
  }>;
  machine_utilization: Array<{
    name: string;
    utilization: number;
  }>;
  customer_satisfaction: Array<{
    month: string;
    satisfaction: number;
    nps: number;
  }>;
  financial_breakdown: Array<{
    name: string;
    amount: number;
  }>;
  kpi_metrics: {
    total_revenue: number;
    profit_margin: number;
    customer_satisfaction: number;
    machine_uptime: number;
    cost_efficiency: number;
    growth_rate: number;
  };
}

export interface DeviceData {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  batteryLevel: number;
  signalStrength: number;
  uptime: number;
  firmware: string;
  sensors: string[];
  lastSeen: Date;
  dataPoints: number;
}

export interface NetworkStatus {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  warningDevices: number;
  networkHealth: number;
  dataTransferred: number;
  averageLatency: number;
  packetLoss: number;
}

export interface AlertData {
  type(type: any): import("react").ReactNode;
  id: string;
  message: string;
  severity: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface RealTimeData {
  deviceId: string;
  metric: string;
  value: number;
  timestamp: Date;
}

export interface PredictiveData {
  month: string;
  predicted: number;
  actual: number | null;
  confidence: number;
}

export interface HealthData {
  healthScore: number;
  temperature: number;
  humidity: number;
  tonerLevel: number;
  paperLevel: number;
  errorCount: number;
  pagesPrintedToday: number;
}

export interface MaintenanceData {
  maintenanceType: string;
  scheduledDate: string;
  description: string;
  estimatedDuration: number;
}

export interface ChartData {
  name: string;
  value: number;
}