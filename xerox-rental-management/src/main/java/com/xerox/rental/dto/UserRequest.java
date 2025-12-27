package com.xerox.rental.dto;

import lombok.Data;

@Data
public class UserRequest {
	private String name;
    private String email;
    private String password;
    private String role;
    private String gstNumber;
    private String contactNumber;
    private String address;
    private Boolean isPasswordChanged;
    private Long ownerId;

    // Bank details
    private String bankAccountHolderName;
    private String bankAccountNumber;  // Will be encrypted
    private String bankIfscCode;
    private String bankName;
    private String bankBranch;
    private String upiId;

    // Nested object support for frontend
    private OwnerDto owner;
    
    @Data
    public static class OwnerDto {
        private Long id;
        private String name;
    }
    
    // Helper method to extract owner ID
    public Long getOwnerId() {
        System.out.println("UserRequest: Getting owner ID - direct: " + this.ownerId + ", from owner object: " + 
            (this.owner != null ? this.owner.getId() : "null"));
        if (this.ownerId != null) {
            return this.ownerId;
        }
        if (this.owner != null) {
            return this.owner.getId();
        }
        return null;
    }
}
