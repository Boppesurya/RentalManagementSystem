package com.xerox.rental.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class RentalRequestDto {
	private Long rentalId;
    private Long ownerId;
    private Long machineId;
    private LocalDateTime requestDate;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Double monthlyRent;
    private String status;
    private String message;
    
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
