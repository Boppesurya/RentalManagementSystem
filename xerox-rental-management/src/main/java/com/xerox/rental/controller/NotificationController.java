package com.xerox.rental.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.xerox.rental.dto.NotificationRequest;
import com.xerox.rental.dto.NotificationResponse;
import com.xerox.rental.entity.Notification;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.UserRepository;
import com.xerox.rental.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    // ✅ Get all notifications (Admin)
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAllNotifications() {
        List<Notification> notifications = notificationService.getAllNotifications();
        List<NotificationResponse> response = notifications.stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // ✅ Get all notifications for a specific user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByUser(@PathVariable Long userId) {
        try {
            System.out.println("Fetching notifications for user ID: " + userId);
            List<Notification> notifications = notificationService.getNotificationsByUser(userId);

            List<NotificationResponse> response = notifications.stream()
                    .map(NotificationResponse::fromEntity)
                    .collect(Collectors.toList());

            System.out.println("Returning " + response.size() + " notifications for user " + userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error fetching notifications for user " + userId + ": " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ Get unread notifications for a specific user
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotificationsByUser(@PathVariable Long userId) {
        try {
            List<Notification> notifications = notificationService.getUnreadNotificationsByUser(userId);
            List<NotificationResponse> response = notifications.stream()
                    .map(NotificationResponse::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error fetching unread notifications for user " + userId + ": " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ Get unread notification count
    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCountByUser(@PathVariable Long userId) {
        try {
            Long count = notificationService.getUnreadCountByUser(userId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            System.err.println("Error fetching unread count for user " + userId + ": " + e.getMessage());
            return ResponseEntity.ok(Map.of("count", 0L));
        }
    }

    // ✅ Filter by type (new endpoint — optional but very helpful)
    @GetMapping("/user/{userId}/type/{type}")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByType(
            @PathVariable Long userId,
            @PathVariable String type) {

        try {
            System.out.println("Fetching " + type + " notifications for user " + userId);
            List<Notification> notifications = notificationService.getNotificationsByUser(userId).stream()
                    .filter(n -> n.getType().name().equalsIgnoreCase(type))
                    .collect(Collectors.toList());

            List<NotificationResponse> response = notifications.stream()
                    .map(NotificationResponse::fromEntity)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error filtering notifications by type: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ✅ Create a notification manually or from frontend/admin trigger
    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody NotificationRequest request) {
        try {
            if (request.getUserId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID is required"));
            }

            Optional<User> user = userRepository.findById(request.getUserId());
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            System.out.println("Creating notification for user: " + request.getUserId());
            Notification.NotificationType type;
            Notification.Priority priority;

            try {
                type = Notification.NotificationType.valueOf(request.getType().toUpperCase());
            } catch (IllegalArgumentException e) {
                System.err.println("Invalid notification type, defaulting to INFO");
                type = Notification.NotificationType.INFO;
            }

            try {
                priority = Notification.Priority.valueOf(request.getPriority().toUpperCase());
            } catch (IllegalArgumentException e) {
                System.err.println("Invalid priority, defaulting to MEDIUM");
                priority = Notification.Priority.MEDIUM;
            }

            Notification notification = notificationService.createNotification(
                    request.getUserId(),
                    request.getTitle(),
                    request.getMessage(),
                    type,
                    priority
            );

            if (request.getActionUrl() != null) {
                notification.setActionUrl(request.getActionUrl());
                notification = notificationService.updateNotification(notification);
            }

            return ResponseEntity.ok(NotificationResponse.fromEntity(notification));

        } catch (Exception e) {
            System.err.println("Error creating notification: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create notification"));
        }
    }

    // ✅ Mark one notification as read
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            Notification notification = notificationService.markAsRead(id);
            return ResponseEntity.ok(NotificationResponse.fromEntity(notification));
        } catch (RuntimeException e) {
            System.err.println("Notification not found for ID: " + id);
            return ResponseEntity.status(404).body(Map.of("error", "Notification not found"));
        }
    }

    // ✅ Mark all notifications as read
    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(@PathVariable Long userId) {
        try {
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            System.err.println("Error marking all as read: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to mark notifications as read"));
        }
    }

    // ✅ Cleanup expired notifications
    @DeleteMapping("/cleanup-expired")
    public ResponseEntity<Map<String, String>> cleanupExpiredNotifications() {
        try {
            notificationService.cleanupExpiredNotifications();
            return ResponseEntity.ok(Map.of("message", "Expired notifications cleaned up"));
        } catch (Exception e) {
            System.err.println("Error cleaning up expired notifications: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Cleanup failed"));
        }
    }
}
