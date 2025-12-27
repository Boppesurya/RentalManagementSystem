import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'MAINTENANCE' | 'PAYMENT' | 'SYSTEM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  read: boolean;
  timestamp: Date;
  actionUrl?: string;
  category?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const backendNotifications = await apiService.getNotificationsByUser(user.id);
      
      const formattedNotifications: NotificationData[] = backendNotifications.map(notification => ({
        id: notification.id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type.toLowerCase() as NotificationData['type'],
        priority: notification.priority.toLowerCase() as NotificationData['priority'],
        read: notification.isRead,
        timestamp: new Date(notification.createdAt),
        actionUrl: notification.actionUrl,
        category: notification.type.toLowerCase()
      }));

      setNotifications(formattedNotifications);
      console.log('Notifications loaded successfully:', formattedNotifications.length);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(() => {
      if (user?.id) {
        loadNotifications();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      console.log('Notification marked as read:', notificationId);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await apiService.markAllNotificationsAsRead(user.id);
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      console.log('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user?.id]);

  const createNotification = useCallback(async (notificationData: {
    title: string;
    message: string;
    type: string;
    priority: string;
  }) => {
    if (!user?.id) return;
    
    try {
      await apiService.createNotification({
        userId: user.id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority
      });
      
      // Reload notifications to show the new one
      await loadNotifications();
      console.log('Notification created successfully');
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  }, [user?.id, loadNotifications]);
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    createNotification,
    refreshNotifications: loadNotifications
  };
};