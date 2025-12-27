package com.xerox.rental.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.xerox.rental.entity.AuditLog;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.AuditLogRepository;

@Service
public class AuditLogService {
	 @Autowired
	    private AuditLogRepository auditLogRepository;
	    
	    public List<AuditLog> getAllAuditLogs() {
	        return auditLogRepository.findAll();
	    }
	    
	    public List<AuditLog> getAuditLogsByUser(User user) {
	        return auditLogRepository.findByUser(user);
	    }
	    
	    public List<AuditLog> getAuditLogsByUserId(Long userId) {
	        return auditLogRepository.findByUserId(userId);
	    }
	    
	    public List<AuditLog> getAuditLogsByEntity(String entityType, String entityId) {
	        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId);
	    }
	    
	    public List<AuditLog> getAuditLogsByDateRange(LocalDateTime start, LocalDateTime end) {
	        return auditLogRepository.findByCreatedAtBetween(start, end);
	    }
	    
	    public AuditLog logAction(User user, String action, String entityType, String entityId, 
	                             String details, AuditLog.ActionType actionType, 
	                             String ipAddress, String userAgent) {
	        AuditLog auditLog = new AuditLog();
	        auditLog.setUser(user);
	        auditLog.setAction(action);
	        auditLog.setEntityType(entityType);
	        auditLog.setEntityId(entityId);
	        auditLog.setDetails(details);
	        auditLog.setActionType(actionType);
	        auditLog.setIpAddress(ipAddress);
	        auditLog.setUserAgent(userAgent);
	        
	        return auditLogRepository.save(auditLog);
	    }
	    
	    public void logUserLogin(User user, String ipAddress, String userAgent) {
	        logAction(user, "User Login", "User", user.getId().toString(), 
	                 "User successfully logged in", AuditLog.ActionType.LOGIN, ipAddress, userAgent);
	    }
	    
	    public void logSensitiveDataAccess(User user, String entityType, String entityId, String details) {
	        System.out.println("AuditLogService: Logging sensitive data access - Type: " + entityType + ", ID: " + entityId);
	        logAction(user, "Access Sensitive Data", entityType, entityId, details,
	                 AuditLog.ActionType.ACCESS_SENSITIVE_DATA, null, null);
	    }
	    
	    public void logUserLogout(User user, String ipAddress, String userAgent) {
	        logAction(user, "User Logout", "User", user.getId().toString(), 
	                 "User logged out", AuditLog.ActionType.LOGOUT, ipAddress, userAgent);
	    }
	    
	    public void logEntityCreation(User user, String entityType, String entityId, String details) {
	        logAction(user, "Create " + entityType, entityType, entityId, details, 
	                 AuditLog.ActionType.CREATE, null, null);
	    }
	    
	    public void logEntityUpdate(User user, String entityType, String entityId, String details) {
	        logAction(user, "Update " + entityType, entityType, entityId, details, 
	                 AuditLog.ActionType.UPDATE, null, null);
	    }
	    
	    public void logEntityDeletion(User user, String entityType, String entityId, String details) {
	        logAction(user, "Delete " + entityType, entityType, entityId, details, 
	                 AuditLog.ActionType.DELETE, null, null);
	    }
	    
	 // ✅ Log impersonation event (admin logging in as another user)
	    public void logImpersonation(User admin, User targetUser) {
	        try {
	            String details = "IMPERSONATION: Admin " + admin.getName() + " (" + admin.getEmail() + 
	                             ") logged in as " + targetUser.getName() + " (" + targetUser.getEmail() + 
	                             ") with role " + targetUser.getRole();
	            
	            System.out.println("AuditLogService: Logging impersonation event for admin " + admin.getEmail());
	            
	            logSensitiveDataAccess(
	                admin,
	                "User",
	                targetUser.getId().toString(),
	                details
	            );
	        } catch (Exception e) {
	            System.err.println("AuditLogService: Error logging impersonation - " + e.getMessage());
	        }
	    }

		
}
