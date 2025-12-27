package com.xerox.rental.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MachineLocationRequest {
	 private Long machineId;
	    private BigDecimal latitude;
	    private BigDecimal longitude;
	    private String address;
	    private String city;
	    private String state;
	    private String country;
	    private String postalCode;
	    private String locationType;
	    private String notes;
	    private LocalDateTime recordedAt;
	    private Long recordedBy;
}
