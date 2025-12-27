package com.xerox.rental.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class InvoiceRequest {
	private String invoiceNumber;
    private Long rentalId;
    private Long ownerId;
    private Long machineId;
    private Double amount;
    private Double gstAmount;
    private Double totalAmount;
    private String status;
    private LocalDateTime dueDate;
    private LocalDateTime paidDate;
    private String paymentMode;
    private Long startingReading;
    private Long closingReading;
    private Long totalCopies;
    private Double copyRatio;
    private Long freeCopies;
    private Long billableCopies;
    private String classification;
    private Double monthlyRent;

    // For multi-machine invoices
    private List<InvoiceItemRequest> items;

    // Nested object support for frontend
    private RentalDto rental;
    private OwnerDto owner;
    private MachineDto machine;
    
    @Data
    public static class RentalDto {
        private Long id;
        private String name;
    }
    
    @Data
    public static class OwnerDto {
        private Long id;
        private String name;
    }
    
    @Data
    public static class MachineDto {
        private Long id;
        private String name;
    }
    
    // Helper methods to extract IDs
    public Long getRentalId() {
        if (this.rentalId != null) {
            return this.rentalId;
        }
        if (this.rental != null && this.rental.getId() != null) {
            return this.rental.getId();
        }
        return null;
    }
    
    public Long getOwnerId() {
        if (this.ownerId != null) {
            return this.ownerId;
        }
        if (this.owner != null && this.owner.getId() != null) {
            return this.owner.getId();
        }
        return null;
    }
    
    public Long getMachineId() {
        if (this.machineId != null) {
            return this.machineId;
        }
        if (this.machine != null && this.machine.getId() != null) {
            return this.machine.getId();
        }
        return null;
    }
}
