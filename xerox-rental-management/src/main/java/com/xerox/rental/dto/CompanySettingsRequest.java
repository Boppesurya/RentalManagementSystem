package com.xerox.rental.dto;

import lombok.Data;

@Data
public class CompanySettingsRequest {
	 private Long ownerId;

	    private String companyName;
	    private String companyLogoUrl;
	    private String stampImageUrl;
	    private String signatureImageUrl;

	    private Double defaultCopyRatio;
	    private Long defaultFreeCopies;

	    private String address;
	    private String phone;
	    private String email;
	    private String gstNumber;

}
