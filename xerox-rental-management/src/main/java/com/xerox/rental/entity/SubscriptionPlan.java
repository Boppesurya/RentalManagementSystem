package com.xerox.rental.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "subscription_plans")
@Data
public class SubscriptionPlan {
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(name = "machine_limit")
    private Integer machineLimit;

    @Column(name = "monthly_price", nullable = false)
    private Double monthlyPrice;

    @Column(name = "yearly_price", nullable = false)
    private Double yearlyPrice;

    @Column(name = "trial_days", nullable = false)
    private Integer trialDays = 7;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "discount_percentage", nullable = false)
    private Double discountPercentage = 0.0;

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

    public Double getFinalMonthlyPrice() {
        if (discountPercentage == null || discountPercentage == 0) {
            return monthlyPrice;
        }
        return monthlyPrice * (1 - discountPercentage / 100.0);
    }

    public Double getFinalYearlyPrice() {
        if (discountPercentage == null || discountPercentage == 0) {
            return yearlyPrice;
        }
        return yearlyPrice * (1 - discountPercentage / 100.0);
    }

}
