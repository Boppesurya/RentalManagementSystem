package com.xerox.rental.dto;

import lombok.Data;

@Data
public class SubscriptionPlanRequest {
	 private String name;
	    private String description;
	    private Integer machineLimit;
	    private Double monthlyPrice;
	    private Double yearlyPrice;
	    private Integer trialDays;
	    private Boolean active;
	    private Double discountPercentage;

}
