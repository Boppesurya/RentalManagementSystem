package com.xerox.rental.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
@Table(name = "machine_health")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MachineHealth {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "machine_id", nullable = false)
	    private Machine machine;
	    
	    @Column(name = "health_score", nullable = false)
	    private Double healthScore; // 0-100
	    
	    @Column(name = "temperature")
	    private Double temperature;
	    
	    @Column(name = "humidity")
	    private Double humidity;
	    
	    @Column(name = "toner_level")
	    private Integer tonerLevel; // 0-100
	    
	    @Column(name = "paper_level")
	    private Integer paperLevel; // 0-100
	    
	    @Column(name = "error_count")
	    private Integer errorCount = 0;
	    
	    @Column(name = "pages_printed_today")
	    private Long pagesPrintedToday = 0L;
	    
	    @Column(name = "last_maintenance")
	    private LocalDateTime lastMaintenance;
	    
	    @Column(name = "next_maintenance")
	    private LocalDateTime nextMaintenance;
	    
	    @Enumerated(EnumType.STRING)
	    @Column(nullable = false)
	    private HealthStatus status = HealthStatus.GOOD;
	    
	    @Column
	    private String alerts;
	    
	    @Column
	    private String recommendations;
	    
	    @CreationTimestamp
	    @Column(name = "created_at")
	    private LocalDateTime createdAt;
	    
	    @UpdateTimestamp
	    @Column(name = "updated_at")
	    private LocalDateTime updatedAt;
	    
	    public enum HealthStatus {
	        EXCELLENT, GOOD, WARNING, CRITICAL, OFFLINE
	    }
}
