package com.xerox.rental.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;
@Data
@Entity
@Table(name = "invoices")
public class Invoice {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;
	    
	    @Column(name = "invoice_number", nullable = false, unique = true)
	    private String invoiceNumber;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "rental_id", nullable = false)
	    private User rental;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "owner_id", nullable = false)
	    private User owner;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "machine_id", nullable = false)
	    private Machine machine;
	    
	    @Column(nullable = false)
	    private Double amount;
	    
	    @Column(name = "monthly_rent")
	    private Double monthlyRent;
	    
	    @Column(name = "gst_amount", nullable = false)
	    private Double gstAmount;
	    
	    @Column(name = "total_amount", nullable = false)
	    private Double totalAmount;

	    @Column(name = "starting_reading")
	    private Long startingReading;

	    @Column(name = "closing_reading")
	    private Long closingReading;

	    @Column(name = "total_copies")
	    private Long totalCopies;

	    @Column(name = "copy_ratio")
	    private Double copyRatio;

	    @Column(name = "free_copies")
	    private Long freeCopies;

	    @Column(name = "billable_copies")
	    private Long billableCopies;

	    @Column(name = "company_logo_url")
	    private String companyLogoUrl;

	    @Column(name = "stamp_image_url")
	    private String stampImageUrl;

	    @Column(name = "signature_image_url")
	    private String signatureImageUrl;

	    @Enumerated(EnumType.STRING)
	    @Column(nullable = false)
	    private Status status = Status.PENDING;

	    @Column(name = "due_date", nullable = false)
	    private LocalDateTime dueDate;

	    @Column(name = "paid_date")
	    private LocalDateTime paidDate;

	    @Enumerated(EnumType.STRING)
	    @Column(name = "payment_mode")
	    private PaymentMode paymentMode;

	    @CreationTimestamp
	    @Column(name = "created_at")
	    private LocalDateTime createdAt;
	    
	    @Column(name = "classification")
	    private String classification;

	    @UpdateTimestamp
	    @Column(name = "updated_at")
	    private LocalDateTime updatedAt;
	    
	    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
	    private List<InvoiceItem> invoiceItems = new ArrayList<>();
	    
	    public enum Status {
	        PENDING, PAID, OVERDUE
	    }
	    
	    public enum PaymentMode {
	        ONLINE, OFFLINE
	    }

	
	 
}
