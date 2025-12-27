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
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

public class User {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;
	    
	    @Column(nullable = false)
	    private String name;
	    
	    @Column(nullable = false, unique = true)
	    private String email;
	    
	    @Column(nullable = false)
	    private String password;
	    
	    @Enumerated(EnumType.STRING)
	    @Column(nullable = false)
	    private Role role;
	    
	    @Column(name = "gst_number")
	    private String gstNumber;
	    
	    @Column(name = "contact_number", nullable = false)
	    private String contactNumber;
	    
	    @Column(nullable = false)
	    private String address;
	    
	    @Column(name = "is_password_changed", nullable = false)
	    private Boolean isPasswordChanged = false;
	    
	    @ManyToOne(fetch = FetchType.EAGER)
	    @JoinColumn(name = "owner_id")
	    @JsonIgnoreProperties({"rentals", "technicians", "password", "bankAccountNumber"})
	    private User owner;
	    
	    @Column(name = "bank_account_holder_name")
	    private String bankAccountHolderName;

	    @Column(name = "bank_account_number", length = 500)
	    private String bankAccountNumber;  // Encrypted

	    @Column(name = "bank_ifsc_code", length = 20)
	    private String bankIfscCode;

	    @Column(name = "bank_name")
	    private String bankName;

	    @Column(name = "bank_branch")
	    private String bankBranch;

	    @Column(name = "upi_id", length = 100)
	    private String upiId;
	    
	    @Column(name = "two_factor_enabled", nullable = false)
	    private Boolean twoFactorEnabled = false;

	    @Column(name = "two_factor_secret", length = 500)
	    private String twoFactorSecret;

	    @Column(name = "two_factor_backup_codes")
	    private String twoFactorBackupCodes;
	    
	    @CreationTimestamp
	    @Column(name = "created_at")
	    private LocalDateTime createdAt;
	    
	    @UpdateTimestamp
	    @Column(name = "updated_at")
	    private LocalDateTime updatedAt;
	    
	    public enum Role {
	        ADMIN, OWNER, RENTAL,TECHNICIAN
	    }
}
