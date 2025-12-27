package com.xerox.rental.dto;

import java.time.LocalDateTime;

import com.xerox.rental.entity.AuditLog;

import lombok.Data;

@Data
public class AuditLogResponse {
	 private String id;
	    private String userId;
	    private String userName;
	    private String action;
	    private String entityType;
	    private String entityId;
	    private String details;
	    private String ipAddress;
	    private String userAgent;
	    private String actionType;
	    private LocalDateTime createdAt;
	    
	    public static AuditLogResponse fromEntity(AuditLog auditLog) {
	        AuditLogResponse response = new AuditLogResponse();
	        response.setId(auditLog.getId().toString());
	        response.setUserId(auditLog.getUser() != null ? auditLog.getUser().getId().toString() : null);
	        response.setUserName(auditLog.getUser() != null ? auditLog.getUser().getName() : "System");
	        response.setAction(auditLog.getAction());
	        response.setEntityType(auditLog.getEntityType());
	        response.setEntityId(auditLog.getEntityId());
	        response.setDetails(auditLog.getDetails());
	        response.setIpAddress(auditLog.getIpAddress());
	        response.setUserAgent(auditLog.getUserAgent());
	        response.setActionType(auditLog.getActionType().toString());
	        response.setCreatedAt(auditLog.getCreatedAt());
	        return response;
	    }
}
