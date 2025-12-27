package com.xerox.rental.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_2fa_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "attempt_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private AttemptType attemptType;

    @Column(nullable = false)
    private Boolean success;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "error_message")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum AttemptType {
        SETUP,
        LOGIN,
        DISABLE,
        BACKUP_CODE
    }
}
