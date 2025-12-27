package com.xerox.rental.dto;

import java.time.LocalDateTime;

import com.xerox.rental.entity.User;

import lombok.Data;

@Data
public class UserResponse {
	 private String id;
	    private String name;
	    private String email;
	    private String role;
	    private String gstNumber;
	    private String contactNumber;
	    private String address;
	    private Boolean isPasswordChanged;
	    private OwnerInfo owner;

	    // Bank details (account number will be masked)
	    private String bankAccountHolderName;
	    private String bankAccountNumberMasked;  // Masked version for display
	    private String bankIfscCode;
	    private String bankName;
	    private String bankBranch;
	    private String upiId;

	    private LocalDateTime createdAt;
	    private LocalDateTime updatedAt;
	    
	    @Data
	    public static class OwnerInfo {
	        private String id;
	        private String name;
	        
	        public OwnerInfo(String id, String name) {
	            this.id = id;
	            this.name = name;
	        }
	    }
	    
	    public static UserResponse fromEntity(User user) {
	        return fromEntity(user, null);
	    }

	    public static UserResponse fromEntity(User user, String maskedAccountNumber) {
	        UserResponse response = new UserResponse();
	        response.setId(user.getId().toString());
	        response.setName(user.getName());
	        response.setEmail(user.getEmail());
	        response.setRole(user.getRole().toString());
	        response.setGstNumber(user.getGstNumber());
	        response.setContactNumber(user.getContactNumber());
	        response.setAddress(user.getAddress());
	        response.setIsPasswordChanged(user.getIsPasswordChanged());

	        if (user.getOwner() != null) {
	            response.setOwner(new OwnerInfo(
	                user.getOwner().getId().toString(),
	                user.getOwner().getName()
	            ));
	        }

	        // Bank details (account number masked)
	        response.setBankAccountHolderName(user.getBankAccountHolderName());
	        response.setBankAccountNumberMasked(maskedAccountNumber);
	        response.setBankIfscCode(user.getBankIfscCode());
	        response.setBankName(user.getBankName());
	        response.setBankBranch(user.getBankBranch());
	        response.setUpiId(user.getUpiId());

	        response.setCreatedAt(user.getCreatedAt());
	        response.setUpdatedAt(user.getUpdatedAt());
	        return response;
	    }
}
