package com.xerox.rental.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "user_id")
	    private User user;
	    
	    @Column(nullable = false)
	    private String action;
	    
	    @Column(name = "entity_type", nullable = false)
	    private String entityType;
	    
	    @Column(name = "entity_id")
	    private String entityId;
	    
	    @Column
	    private String details;
	    
	    @Column(name = "ip_address")
	    private String ipAddress;
	    
	    @Column(name = "user_agent")
	    private String userAgent;
	    
	    @Enumerated(EnumType.STRING)
	    @Column(nullable = false)
	    private ActionType actionType;
	    
	    @CreationTimestamp
	    @Column(name = "created_at")
	    private LocalDateTime createdAt;
	    
	    public enum ActionType {
	        CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, IMPORT, ACCESS_SENSITIVE_DATA,IMPERSONATION
	    }
}
