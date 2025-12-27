package com.xerox.rental.entity;

import java.math.BigDecimal;
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
@Table(name = "machine_locations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MachineLocation {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;

	    @ManyToOne(fetch = FetchType.EAGER)
	    @JoinColumn(name = "machine_id", nullable = false)
	    private Machine machine;

	    @Column(nullable = false, precision = 10, scale = 8)
	    private BigDecimal latitude;

	    @Column(nullable = false, precision = 11, scale = 8)
	    private BigDecimal longitude;

	    @Column(name = "address")
	    private String address;

	    @Column(length = 100)
	    private String city;

	    @Column(length = 100)
	    private String state;

	    @Column(length = 100)
	    private String country;

	    @Column(name = "postal_code", length = 20)
	    private String postalCode;

	    @Enumerated(EnumType.STRING)
	    @Column(name = "location_type", nullable = false)
	    private LocationType locationType = LocationType.CURRENT;

	    @Column(name = "notes")
	    private String notes;

	    @Column(name = "recorded_at", nullable = false)
	    private LocalDateTime recordedAt;

	    @ManyToOne(fetch = FetchType.EAGER)
	    @JoinColumn(name = "recorded_by")
	    private User recordedBy;

	    @CreationTimestamp
	    @Column(name = "created_at")
	    private LocalDateTime createdAt;

	    @UpdateTimestamp
	    @Column(name = "updated_at")
	    private LocalDateTime updatedAt;

	    public enum LocationType {
	        CURRENT,
	        DELIVERY,
	        PICKUP,
	        SERVICE,
	        STORAGE,
	        HISTORICAL
	    }
}
