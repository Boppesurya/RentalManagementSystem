package com.xerox.rental.dto;

import java.time.LocalDateTime;

import com.xerox.rental.entity.Notification;

import lombok.Data;

@Data
public class NotificationResponse {
	 private Long id;
	    private String title;
	    private String message;
	    private String type;
	    private String priority;
	    private Long userId;
	    private Boolean isRead;
	    private String actionUrl;
	    private LocalDateTime expiresAt;
	    private LocalDateTime createdAt;
	    private LocalDateTime updatedAt;
	    
	    public static NotificationResponse fromEntity(Notification notification) {
	        NotificationResponse response = new NotificationResponse();
	        response.setId(notification.getId());
	        response.setTitle(notification.getTitle());
	        response.setMessage(notification.getMessage());
	        response.setType(notification.getType().toString());
	        response.setPriority(notification.getPriority().toString());
	        response.setUserId(notification.getUser().getId());
	        response.setIsRead(notification.getIsRead());
	        response.setActionUrl(notification.getActionUrl());
	        response.setExpiresAt(notification.getExpiresAt());
	        response.setCreatedAt(notification.getCreatedAt());
	        response.setUpdatedAt(notification.getUpdatedAt());
	        return response;
	    }
}
