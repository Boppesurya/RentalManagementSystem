package com.xerox.rental.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class MachineRequest {
	 private String name;
	    private String model;
	    private String serialNumber;
	    private String location;
	    private Long usage;
	    private Long ownerId;
	    private Long rentalId;
	    private String status;
	    private Double monthlyRent;
	    private LocalDateTime installationDate;
	    private LocalDateTime lastServiceDate;
	    
	    // Nested object support for frontend
	    private OwnerDto owner;
	    private RentalDto rental;
	    
	    @Data
	    public static class OwnerDto {
	        private Long id;
	        private String name;
	    }
	    
	    @Data
	    public static class RentalDto {
	        private Long id;
	        private String name;
	    }
	    
	    // Helper methods to extract IDs
	    public Long getOwnerId() {
	        if (this.ownerId != null) {
	            return this.ownerId;
	        }
	        if (this.owner != null && this.owner.getId() != null) {
	            return this.owner.getId();
	        }
	        return null;
	    }
	    
	    public Long getRentalId() {
	        if (this.rentalId != null) {
	            return this.rentalId;
	        }
	        if (this.rental != null && this.rental.getId() != null) {
	            return this.rental.getId();
	        }
	        return null;
	    }
}
