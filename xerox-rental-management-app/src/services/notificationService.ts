export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  timestamp: Date;
  read: boolean;
  userId?: string;
  actionUrl?: string;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  constructor() {
    // Initialize with empty notifications - data will come from backend
    this.notifications = [];
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return this.notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get unread notifications count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Set notifications from backend
  setNotifications(notifications: Notification[]): void {
    this.notifications = notifications;
    this.notifyListeners();
  }

  // Add a new notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    this.notifications.unshift(newNotification);
    this.notifyListeners();
  }

  // Mark notification as read
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  // Remove notification
  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Subscribe to notification changes
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getNotifications()));
  }

  // Predefined notification templates
  createInvoiceNotification(invoiceNumber: string, amount: number): void {
    this.addNotification({
      title: 'New Invoice Generated',
      message: `Invoice ${invoiceNumber} has been generated for ₹${amount.toLocaleString()}`,
      type: 'INFO',
      read: false,
      actionUrl: '/invoices'
    });
  }

  createPaymentNotification(invoiceNumber: string, amount: number): void {
    this.addNotification({
      title: 'Payment Received',
      message: `Payment of ₹${amount.toLocaleString()} received for Invoice ${invoiceNumber}`,
      type: 'SUCCESS',
      read: false,
      actionUrl: '/invoices'
    });
  }

  createMaintenanceNotification(machineName: string): void {
    this.addNotification({
      title: 'Machine Maintenance Due',
      message: `${machineName} requires maintenance`,
      type: 'WARNING',
      read: false,
      actionUrl: '/machines'
    });
  }

  createRentalRequestNotification(machineName: string, requesterName: string): void {
    this.addNotification({
      title: 'New Rental Request',
      message: `${requesterName} has requested ${machineName}`,
      type: 'INFO',
      read: false,
      actionUrl: '/requests'
    });
  }

  createContractNotification(contractId: string, machineName: string): void {
    this.addNotification({
      title: 'New Contract Created',
      message: `Contract ${contractId} created for ${machineName}`,
      type: 'SUCCESS',
      read: false,
      actionUrl: '/contracts'
    });
  }

  createTicketNotification(ticketTitle: string, priority: string): void {
    this.addNotification({
      title: 'New Support Ticket',
      message: `${priority.toUpperCase()} priority ticket: ${ticketTitle}`,
      type: priority === 'HIGH' ? 'ERROR' : priority === 'MEDIUM' ? 'WARNING' : 'INFO',
      read: false,
      actionUrl: '/tickets'
    });
  }
}

export const notificationService = new NotificationService();