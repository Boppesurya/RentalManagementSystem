package com.xerox.rental.entity;

import java.time.LocalDateTime;

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
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "subscription_history")
@Data
public class SubscriptionHistory {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;

	    @ManyToOne(fetch = FetchType.EAGER)
	    @JoinColumn(name = "subscription_id", nullable = false)
	    private Subscription subscription;

	    @ManyToOne(fetch = FetchType.EAGER)
	    @JoinColumn(name = "user_id", nullable = false)
	    private User user;

	    @Enumerated(EnumType.STRING)
	    @Column(nullable = false)
	    private Action action;

	    @Enumerated(EnumType.STRING)
	    @Column(name = "old_status")
	    private Subscription.Status oldStatus;

	    @Enumerated(EnumType.STRING)
	    @Column(name = "new_status")
	    private Subscription.Status newStatus;

	    @Column(name = "old_plan_id")
	    private Long oldPlanId;

	    @Column(name = "new_plan_id")
	    private Long newPlanId;

	    @Column(name = "amount_paid")
	    private Double amountPaid;

	    @Column(name = "refund_amount")
	    private Double refundAmount;

	    @Column(length = 1000)
	    private String notes;

	    @Column(name = "payment_method")
	    private String paymentMethod;

	    @Column(name = "transaction_id")
	    private String transactionId;

	    @Column(name = "created_at", nullable = false, updatable = false)
	    private LocalDateTime createdAt;

	    @PrePersist
	    protected void onCreate() {
	        createdAt = LocalDateTime.now();
	    }

	    public enum Action {
	        CREATED,
	        ACTIVATED,
	        RENEWED,
	        UPGRADED,
	        DOWNGRADED,
	        CANCELLED,
	        EXPIRED,
	        SUSPENDED,
	        REACTIVATED,
	        TRIAL_STARTED,
	        TRIAL_CONVERTED,
	        REFUNDED
	    }
}
