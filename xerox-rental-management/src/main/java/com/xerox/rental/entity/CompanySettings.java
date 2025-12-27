package com.xerox.rental.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "company_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanySettings {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;

	    @OneToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "owner_id", nullable = false, unique = true)
	    private User owner;

	    @Column(name = "company_name")
	    private String companyName;

	    @Column(name = "company_logo_url", length = 500)
	    private String companyLogoUrl;

	    @Column(name = "stamp_image_url", length = 500)
	    private String stampImageUrl;

	    @Column(name = "signature_image_url", length = 500)
	    private String signatureImageUrl;

	    @Column(name = "default_copy_ratio")
	    private Double defaultCopyRatio;

	    @Column(name = "default_free_copies")
	    private Long defaultFreeCopies;

	    @Column(name="address")
	    private String address;

	    @Column(length = 50)
	    private String phone;

	    @Column(length = 255)
	    private String email;

	    @Column(name = "gst_number", length = 50)
	    private String gstNumber;

	    @CreationTimestamp
	    @Column(name = "created_at")
	    private LocalDateTime createdAt;

	    @UpdateTimestamp
	    @Column(name = "updated_at")
	    private LocalDateTime updatedAt;

}
