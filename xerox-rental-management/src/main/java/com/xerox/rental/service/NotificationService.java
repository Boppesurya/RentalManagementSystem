package com.xerox.rental.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.MachineHealth;
import com.xerox.rental.entity.Notification;
import com.xerox.rental.entity.Subscription;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.NotificationRepository;
import com.xerox.rental.repository.UserRepository;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }
    
    public List<Notification> getNotificationsByUser(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent()) {
            System.out.println("Getting notifications for user: " + userId);
            List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user.get());
            System.out.println("Found " + notifications.size() + " notifications for user " + userId);
            return notifications;
        }
        System.out.println("User not found: " + userId);
        return List.of();
    }
    
    public List<Notification> getUnreadNotificationsByUser(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent()) {
            System.out.println("Getting unread notifications for user: " + userId);
            List<Notification> notifications = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user.get());
            System.out.println("Found " + notifications.size() + " unread notifications for user " + userId);
            return notifications;
        }
        return List.of();
    }
    
    public Long getUnreadCountByUser(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent()) {
            Long count = notificationRepository.countUnreadByUser(user.get());
            System.out.println("Unread count for user " + userId + ": " + count);
            return count;
        }
        return 0L;
    }
    
    public Notification createNotification(Long userId, String title, String message, 
                                         Notification.NotificationType type, 
                                         Notification.Priority priority) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            System.err.println("Cannot create notification: User not found with ID " + userId);
            throw new RuntimeException("User not found");
        }
        
        System.out.println("Creating notification for user " + userId + ": " + title);
        
        Notification notification = new Notification();
        notification.setUser(user.get());
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setPriority(priority);
        
        Notification saved = notificationRepository.save(notification);
        System.out.println("Notification created with ID: " + saved.getId());
        return saved;
    }
    
    public Notification updateNotification(Notification notification) {
        return notificationRepository.save(notification);
    }
    
    public Notification markAsRead(Long notificationId) {
        Optional<Notification> notification = notificationRepository.findById(notificationId);
        if (notification.isPresent()) {
            System.out.println("Marking notification " + notificationId + " as read");
            notification.get().setIsRead(true);
            Notification saved = notificationRepository.save(notification.get());
            System.out.println("Notification " + notificationId + " marked as read");
            return saved;
        }
        System.err.println("Notification not found: " + notificationId);
        throw new RuntimeException("Notification not found");
    }
    
    public void markAllAsRead(Long userId) {
        System.out.println("Marking all notifications as read for user: " + userId);
        List<Notification> unreadNotifications = getUnreadNotificationsByUser(userId);
        System.out.println("Found " + unreadNotifications.size() + " unread notifications to mark as read");
        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
        }
        notificationRepository.saveAll(unreadNotifications);
        System.out.println("All notifications marked as read for user: " + userId);
    }
    
    public void sendMachineHealthAlert(Machine machine, MachineHealth health) {
        // Send to machine owner
        String title = "Machine Health Alert: " + machine.getName();
        String message = String.format("Machine %s requires attention. Health Score: %.1f%%. %s", 
                                      machine.getName(), health.getHealthScore(), health.getAlerts());
        
        System.out.println("Sending machine health alert to owner: " + machine.getOwner().getId());
        createNotification(machine.getOwner().getId(), title, message, 
                         Notification.NotificationType.WARNING, 
                         Notification.Priority.HIGH);
        
        // Send to rental user if machine is rented
        if (machine.getRental() != null) {
            System.out.println("Sending machine health alert to rental user: " + machine.getRental().getId());
            createNotification(machine.getRental().getId(), title, message, 
                             Notification.NotificationType.WARNING, 
                             Notification.Priority.MEDIUM);
        }
    }
    
    public void sendMaintenanceReminder(Machine machine, LocalDateTime scheduledDate) {
        String title = "Maintenance Reminder: " + machine.getName();
        String message = String.format("Scheduled maintenance for %s is due on %s", 
                                      machine.getName(), scheduledDate.toLocalDate());
        
        System.out.println("Sending maintenance reminder to owner: " + machine.getOwner().getId());
        createNotification(machine.getOwner().getId(), title, message, 
                         Notification.NotificationType.MAINTENANCE, 
                         Notification.Priority.MEDIUM);
    }
    
    public void sendPaymentReminder(User user, String invoiceNumber, Double amount) {
        String title = "Payment Reminder";
        String message = String.format("Invoice %s for ₹%.2f is due for payment", invoiceNumber, amount);
        
        System.out.println("Sending payment reminder to user: " + user.getId());
        createNotification(user.getId(), title, message, 
                         Notification.NotificationType.PAYMENT, 
                         Notification.Priority.HIGH);
    }
    
    public void sendWelcomeNotification(User user) {
        String title = "Welcome to Rental System";
        String message = "Your account has been created successfully. Please change your password for security.";
        
        System.out.println("Sending welcome notification to user: " + user.getId());
        createNotification(user.getId(), title, message, 
                         Notification.NotificationType.INFO, 
                         Notification.Priority.MEDIUM);
    }
    
    public void sendInvoiceGeneratedNotification(User rentalUser, String invoiceNumber, Double amount) {
        String title = "New Invoice Generated";
        String message = String.format("Invoice %s for ₹%.2f has been generated", invoiceNumber, amount);
        
        System.out.println("Sending invoice notification to rental user: " + rentalUser.getId());
        createNotification(rentalUser.getId(), title, message, 
                         Notification.NotificationType.INFO, 
                         Notification.Priority.MEDIUM);
    }
    
    public void sendRentalRequestNotification(User owner, String requesterName, String machineName) {
        String title = "New Rental Request";
        String message = String.format("%s has requested %s", requesterName, machineName);
        
        System.out.println("Sending rental request notification to owner: " + owner.getId());
        createNotification(owner.getId(), title, message, 
                         Notification.NotificationType.INFO, 
                         Notification.Priority.MEDIUM);
    }
    
    public void sendRepairRequestNotification(User technician, String machineName, String issueDescription) {
        String title = "Repair Request Assigned";
        String message = String.format("You have been assigned to repair %s. Issue: %s", machineName, issueDescription);
        
        System.out.println("Sending repair request notification to technician: " + technician.getId());
        createNotification(technician.getId(), title, message, 
                         Notification.NotificationType.WARNING, 
                         Notification.Priority.HIGH);
    }
    
    public void sendMaintenanceCompleteNotification(User owner, String machineName, String technicianName) {
        String title = "Maintenance Completed";
        String message = String.format("Maintenance for %s has been completed by %s", machineName, technicianName);
        
        System.out.println("Sending maintenance complete notification to owner: " + owner.getId());
        createNotification(owner.getId(), title, message, 
                         Notification.NotificationType.SUCCESS, 
                         Notification.Priority.MEDIUM);
    }
    
    public void sendMachineAlertToTechnician(User technician, String machineName, String alertMessage) {
        String title = "Machine Alert - Action Required";
        String message = String.format("Machine %s requires attention: %s", machineName, alertMessage);
        
        System.out.println("Sending machine alert to technician: " + technician.getId());
        createNotification(technician.getId(), title, message, 
                         Notification.NotificationType.ERROR, 
                         Notification.Priority.HIGH);
    }
    
    public void cleanupExpiredNotifications() {
        List<Notification> expiredNotifications = notificationRepository.findExpiredNotifications(LocalDateTime.now());
        System.out.println("Cleaning up " + expiredNotifications.size() + " expired notifications");
        notificationRepository.deleteAll(expiredNotifications);
    }

    public void sendSubscriptionExpiringNotification(Long userId, String planName, int daysRemaining) {
        String title = "Subscription Expiring Soon";
        String message = String.format("Your %s subscription will expire in %d day%s. Please renew to continue using the service.",
                                      planName, daysRemaining, daysRemaining > 1 ? "s" : "");

        System.out.println("Sending subscription expiring notification to user: " + userId);
        createNotification(userId, title, message,
                         Notification.NotificationType.WARNING,
                         Notification.Priority.HIGH);
    }

    public void sendSubscriptionExpiredNotification(Long userId, String planName) {
        String title = "Subscription Expired";
        String message = String.format("Your %s subscription has expired. Your account has been suspended. Please renew to regain access.",
                                      planName);

        System.out.println("Sending subscription expired notification to user: " + userId);
        createNotification(userId, title, message,
                         Notification.NotificationType.ERROR,
                         Notification.Priority.HIGH);
    }

    public void sendTrialEndingNotification(Long userId, String planName, int daysRemaining) {
        String title = "Trial Period Ending";
        String message = String.format("Your %s trial period will end in %d day%s. Upgrade now to continue enjoying all features.",
                                      planName, daysRemaining, daysRemaining > 1 ? "s" : "");

        System.out.println("Sending trial ending notification to user: " + userId);
        createNotification(userId, title, message,
                         Notification.NotificationType.INFO,
                         Notification.Priority.MEDIUM);
    }

    public void sendSubscriptionUpgradedNotification(Long userId, String oldPlan, String newPlan) {
        String title = "Subscription Upgraded";
        String message = String.format("Your subscription has been successfully upgraded from %s to %s.",
                                      oldPlan, newPlan);

        System.out.println("Sending subscription upgraded notification to user: " + userId);
        createNotification(userId, title, message,
                         Notification.NotificationType.SUCCESS,
                         Notification.Priority.MEDIUM);
    }

    public void sendSubscriptionRenewedNotification(Long userId, String planName, String billingCycle) {
        String title = "Subscription Renewed";
        String message = String.format("Your %s subscription has been successfully renewed for another %s.",
                                      planName, billingCycle.toLowerCase());

        System.out.println("Sending subscription renewed notification to user: " + userId);
        createNotification(userId, title, message,
                         Notification.NotificationType.SUCCESS,
                         Notification.Priority.MEDIUM);
    }

    public void sendSubscriptionCancelledNotification(Long userId, String planName, Double refundAmount) {
        String title = "Subscription Cancelled";
        String message = String.format("Your %s subscription has been cancelled. Refund amount: ₹%.2f will be processed within 5-7 business days.",
                                      planName, refundAmount);

        System.out.println("Sending subscription cancelled notification to user: " + userId);
        createNotification(userId, title, message,
                         Notification.NotificationType.INFO,
                         Notification.Priority.MEDIUM);
    }

    public void sendPendingSubscriptionToAdmins(String ownerName, String planName, Double amount, String paymentMethod) {
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        String title = "New Subscription Payment Pending";
        String message = String.format("%s has purchased %s plan for ₹%.2f via %s. Payment verification required.",
                                      ownerName, planName, amount, paymentMethod);

        System.out.println("Sending pending subscription notification to " + admins.size() + " admin(s)");

        for (User admin : admins) {
            createNotification(admin.getId(), title, message,
                             Notification.NotificationType.INFO,
                             Notification.Priority.HIGH);
        }
    }

    public void sendSubscriptionActivatedNotification(Long userId, String planName, LocalDateTime endDate) {
        String title = "Subscription Activated";
        String message = String.format("Your %s subscription has been activated! You now have full access to all features until %s.",
                                      planName, endDate.toLocalDate().toString());

        System.out.println("Sending subscription activated notification to user: " + userId);
        createNotification(userId, title, message,
                         Notification.NotificationType.SUCCESS,
                         Notification.Priority.HIGH);
    }

    public void sendSubscriptionRejectedNotification(Long userId, String planName, String reason) {
        String title = "Subscription Payment Rejected";
        String message = String.format("Your payment for %s subscription has been rejected. Reason: %s. Please contact support or try purchasing again.",
                                      planName, reason != null ? reason : "Payment verification failed");

        System.out.println("Sending subscription rejected notification to user: " + userId);
        createNotification(userId, title, message,
                         Notification.NotificationType.ERROR,
                         Notification.Priority.HIGH);
    }
    
  

    public void sendSubscriptionCreatedConfirmation(Long userId, String planName, String paymentMethod) {
        String title = "Subscription Request Received";
        String message = String.format("Your subscription request for %s plan has been received. Payment via %s is being verified by our admin team. You will be notified once activated.",
                                      planName, paymentMethod);

        System.out.println("Sending subscription created confirmation to user: " + userId);
        createNotification(userId, title, message,
                         Notification.NotificationType.INFO,
                         Notification.Priority.MEDIUM);
        
    }
    
}
