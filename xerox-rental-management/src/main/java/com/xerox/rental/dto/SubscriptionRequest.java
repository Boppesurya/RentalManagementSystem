package com.xerox.rental.dto;

import lombok.Data;

@Data
public class SubscriptionRequest {
	
    private Long userId;

  
    private Long planId;

   
    private String billingCycle;   // You can convert to ENUM in service layer

    private String paymentMethod;   // UPI, CASH, BANK_TRANSFER, CARD, etc.

    private String transactionId;   // Optional for offline payment

    private Double amountPaid;      // Needed if user pays during subscription

    private Boolean autoRenew = true;

    private String paymentDetails;  // Notes (UPI ref, bank details, etc.)

    private Boolean startAsTrial = true; // If false → activate directly
}


