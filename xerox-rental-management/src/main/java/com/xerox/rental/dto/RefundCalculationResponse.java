package com.xerox.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefundCalculationResponse {
	private Double amountPaid;
    private Long totalDays;
    private Long daysUsed;
    private Long remainingDays;
    private Double dailyRate;
    private Double refundBeforeFee;
    private Double adminFee;
    private Double finalRefund;
    private String cancellationDate;

}
