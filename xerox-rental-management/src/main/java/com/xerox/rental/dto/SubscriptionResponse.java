package com.xerox.rental.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
	 private Long id;
	    private Long userId;
	    private String userName;
	    private String userEmail;
	    private String userPhone;
	    private Long planId;
	    private String planName;
	    private String planDescription;
	    private Double planMonthlyPrice;
	    private Double planYearlyPrice;
	    private String status;
	    private String billingCycle;
	    private LocalDateTime startDate;
	    private LocalDateTime endDate;
	    private LocalDateTime trialEndDate;
	    private Boolean autoRenew;
	    private Double amountPaid;
	    private String paymentMethod;
	    private String transactionId;
	    private Boolean paymentVerified;
	    private LocalDateTime paymentVerifiedAt;
	    private String paymentVerifiedBy;
	    private String invoiceNumber;
	    private String adminNotes;
	    private Boolean isTrial;
	    private Integer machineLimit;
	    private Integer currentMachineCount;
	    private Long daysRemaining;
	    private LocalDateTime createdAt;
	    private LocalDateTime updatedAt;

}
