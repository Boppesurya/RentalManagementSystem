package com.xerox.rental.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.Notification;
import com.xerox.rental.entity.User;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
	List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    List<Notification> findByType(Notification.NotificationType type);
    List<Notification> findByPriority(Notification.Priority priority);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = :user AND n.isRead = false")
    Long countUnreadByUser(User user);
    
    @Query("SELECT n FROM Notification n WHERE n.expiresAt <= :now")
    List<Notification> findExpiredNotifications(LocalDateTime now);
}
