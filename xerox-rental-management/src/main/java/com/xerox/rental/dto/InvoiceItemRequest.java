package com.xerox.rental.dto;

import lombok.Data;

@Data
public class InvoiceItemRequest {
	private Long machineId;
    private Long startingReading;
    private Long closingReading;
    private Long totalCopies;
    private Long freeCopies;
    private Long billableCopies;
    private Double copyRatio;
    private Double monthlyRent;
    private Double amount;

}
