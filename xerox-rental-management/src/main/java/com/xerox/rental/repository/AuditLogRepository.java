package com.xerox.rental.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.AuditLog;
import com.xerox.rental.entity.User;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
List<AuditLog> findByUser(User user);
    
    @Query("SELECT al FROM AuditLog al WHERE al.user.id = :userId ORDER BY al.createdAt DESC")
    List<AuditLog> findByUserId(Long userId);
    
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, String entityId);
    List<AuditLog> findByActionType(AuditLog.ActionType actionType);
    
    @Query("SELECT al FROM AuditLog al WHERE al.createdAt BETWEEN :start AND :end")
    List<AuditLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT al FROM AuditLog al WHERE al.user = :user AND al.createdAt BETWEEN :start AND :end")
    List<AuditLog> findByUserAndDateRange(User user, LocalDateTime start, LocalDateTime end);
}
