package com.xerox.rental.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlanResponse {
	 private Long id;
	    private String name;
	    private String description;
	    private Integer machineLimit;
	    private Double monthlyPrice;
	    private Double yearlyPrice;
	    private Integer trialDays;
	    private Boolean active;
	    private Double discountPercentage;
	    private Double finalMonthlyPrice;
	    private Double finalYearlyPrice;
	    private LocalDateTime createdAt;
	    private LocalDateTime updatedAt;

}
