package com.xerox.rental.entity;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "subscriptions")
@Data
public class Subscription {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;

	    @ManyToOne(fetch = FetchType.EAGER)
	    @JoinColumn(name = "user_id", nullable = false)
	    private User user;

	    @ManyToOne(fetch = FetchType.EAGER)
	    @JoinColumn(name = "plan_id", nullable = false)
	    private SubscriptionPlan plan;

	    @Enumerated(EnumType.STRING)
	    @Column(nullable = false)
	    private Status status = Status.TRIAL;

	    @Enumerated(EnumType.STRING)
	    @Column(name = "billing_cycle", nullable = false)
	    private BillingCycle billingCycle;

	    @Column(name = "start_date", nullable = false)
	    private LocalDateTime startDate;

	    @Column(name = "end_date", nullable = false)
	    private LocalDateTime endDate;

	    @Column(name = "trial_end_date")
	    private LocalDateTime trialEndDate;

	    @Column(name = "auto_renew", nullable = false)
	    private Boolean autoRenew = true;

	    @Column(name = "amount_paid", nullable = false)
	    private Double amountPaid;

	    @Column(name = "payment_method")
	    private String paymentMethod;

	    @Column(name = "transaction_id")
	    private String transactionId;

	    @Column(name = "payment_verified")
	    private Boolean paymentVerified = false;

	    @Column(name = "payment_verified_at")
	    private LocalDateTime paymentVerifiedAt;

	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "payment_verified_by")
	    private User paymentVerifiedBy;

	    @Column(name = "invoice_pdf_path", length = 500)
	    private String invoicePdfPath;

	    @Column(name = "invoice_number", length = 100)
	    private String invoiceNumber;

	    @Column(name = "invoice_sent")
	    private Boolean invoiceSent = false;

	    @Column(name = "invoice_sent_at")
	    private LocalDateTime invoiceSentAt;

	    @Column(name = "admin_notes")
	    private String adminNotes;

	    @Column(name = "payment_details")
	    private String paymentDetails;

	    @Column(name = "is_trial", nullable = false)
	    private Boolean isTrial = true;

	    @Column(name = "machine_limit")
	    private Integer machineLimit;

	    @Column(name = "last_notification_sent")
	    private LocalDateTime lastNotificationSent;

	    @Column(name = "created_at", nullable = false, updatable = false)
	    private LocalDateTime createdAt;

	    @Column(name = "updated_at")
	    private LocalDateTime updatedAt;

	    @PrePersist
	    protected void onCreate() {
	        createdAt = LocalDateTime.now();
	        updatedAt = LocalDateTime.now();
	    }

	    @PreUpdate
	    protected void onUpdate() {
	        updatedAt = LocalDateTime.now();
	    }

	    public enum Status {
	        PENDING,
	        TRIAL,
	        ACTIVE,
	        EXPIRED,
	        CANCELLED,
	        SUSPENDED
	    }

	    public enum BillingCycle {
	        MONTHLY,
	        YEARLY
	    }

	    public Long getTotalDays() {
	        if (startDate == null || endDate == null) {
	            return 0L;
	        }
	        return ChronoUnit.DAYS.between(startDate, endDate);
	    }

	    public Long getDaysUsed() {
	        if (startDate == null) {
	            return 0L;
	        }
	        LocalDateTime now = LocalDateTime.now();
	        if (now.isAfter(endDate)) {
	            return getTotalDays();
	        }
	        return ChronoUnit.DAYS.between(startDate, now);
	    }

	    public Long getRemainingDays() {
	        if (endDate == null) {
	            return 0L;
	        }
	        LocalDateTime now = LocalDateTime.now();
	        if (now.isAfter(endDate)) {
	            return 0L;
	        }
	        return ChronoUnit.DAYS.between(now, endDate);
	    }

	    public boolean isExpiringSoon(int days) {
	        Long remaining = getRemainingDays();
	        return remaining > 0 && remaining <= days;
	    }

	    public boolean isExpired() {
	        return endDate != null && LocalDateTime.now().isAfter(endDate);
	    }

	    public boolean isTrialExpired() {
	        return trialEndDate != null && LocalDateTime.now().isAfter(trialEndDate);
	    }

}
