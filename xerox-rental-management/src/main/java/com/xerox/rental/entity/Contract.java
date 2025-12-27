package com.xerox.rental.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

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
import lombok.Data;
@Data
@Entity
@Table(name = "contracts")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Contract {
	    @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;

	 @ManyToOne(fetch = FetchType.LAZY)
	 @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
	    @JoinColumn(name = "owner_id", nullable = false)
	    private User owner;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
	    @JoinColumn(name = "rental_id", nullable = false)
	    private User rental;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
	    @JoinColumn(name = "machine_id", nullable = false)
	    private Machine machine;
	    
	    @Column(name = "start_date", nullable = false)
	    private LocalDateTime startDate;
	    
	    @Column(name = "end_date", nullable = false)
	    private LocalDateTime endDate;
	    
	    @Column(name = "monthly_rent", nullable = false)
	    private Double monthlyRent;
	    
	    @Column
	    private String terms;
	    
	    @Enumerated(EnumType.STRING)
	    @Column(nullable = false)
	    private Status status = Status.ACTIVE;
	    
	    @CreationTimestamp
	    @Column(name = "created_at")
	    private LocalDateTime createdAt;
	    
	    @UpdateTimestamp
	    @Column(name = "updated_at")
	    private LocalDateTime updatedAt;
	    
	    public enum Status {
	        ACTIVE, EXPIRED, TERMINATED
	    }
}
