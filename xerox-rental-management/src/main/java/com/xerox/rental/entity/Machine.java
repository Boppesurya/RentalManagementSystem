package com.xerox.rental.entity;

import java.math.BigDecimal;
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
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "machines")
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

public class Machine {
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
	 @Column(nullable = false)
	    private String name;
	    
	    @Column(nullable = false)
	    private String model;
	    
	    
	    @Column(name = "serial_number", nullable = false, unique = true)
	    private String serialNumber;
	    
	    @Column(nullable = false)
	    private String location;
	    
	    @Column(name = "machine_usage", nullable = false)
	    private Long usage;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
	    @JoinColumn(name = "owner_id", nullable = false)
	    private User owner;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
	    @JoinColumn(name = "rental_id")
	    private User rental;
	    
	    @Enumerated(EnumType.STRING)
	    @Column(nullable = false)
	    private Status status = Status.AVAILABLE;
	    
	    @Column(name = "current_latitude", precision = 10, scale = 8)
	    private BigDecimal currentLatitude;

	    @Column(name = "current_longitude", precision = 11, scale = 8)
	    private BigDecimal currentLongitude;
	    
	    @Column(name = "current_address")
	    private String currentAddress;

	    @Column(name = "last_location_update")
	    private LocalDateTime lastLocationUpdate;
	    
	    @Column(name = "monthly_rent", nullable = false)
	    private Double monthlyRent;
	    
	    @Column(name = "installation_date")
	    private LocalDateTime installationDate;
	    
	    @Column(name = "last_service_date")
	    private LocalDateTime lastServiceDate;
	    
	    @CreationTimestamp
	    @Column(name = "created_at")
	    private LocalDateTime createdAt;
	    
	    @UpdateTimestamp
	    @Column(name = "updated_at")
	    private LocalDateTime updatedAt;
	    
	    public enum Status {
	        AVAILABLE, RENTED, MAINTENANCE
	    }
}
