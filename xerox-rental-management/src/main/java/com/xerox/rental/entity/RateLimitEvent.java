package com.xerox.rental.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "rate_limit_events", indexes = {
    @Index(name = "idx_client_id", columnList = "client_id"),
    @Index(name = "idx_created_at", columnList = "created_at"),
    @Index(name = "idx_blocked", columnList = "blocked")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RateLimitEvent {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;

	    @Column(name = "client_id", nullable = false, length = 200)
	    private String clientId;

	    @Column(name = "user_id")
	    private Long userId;

	    @Column(name = "endpoint", nullable = false, length = 500)
	    private String endpoint;

	    @Column(name = "limit_type", nullable = false, length = 50)
	    private String limitType;

	    @Column(name = "blocked", nullable = false)
	    private Boolean blocked;

	    @Column(name = "request_method", length = 10)
	    private String requestMethod;

	    @Column(name = "ip_address", length = 50)
	    private String ipAddress;

	    @Column(name = "user_agent", length = 500)
	    private String userAgent;

	    @Column(name = "created_at", nullable = false)
	    private LocalDateTime createdAt;

	    @PrePersist
	    protected void onCreate() {
	        if (createdAt == null) {
	            createdAt = LocalDateTime.now();
	        }
	    }

}
