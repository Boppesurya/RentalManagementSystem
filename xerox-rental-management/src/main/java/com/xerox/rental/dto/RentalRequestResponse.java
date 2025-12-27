package com.xerox.rental.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RentalRequestResponse {
	 private Long id;
	    private UserInfo rental;
	    private UserInfo owner;
	    private MachineInfo machine;
	    private LocalDateTime requestDate;
	    private LocalDateTime startDate;
	    private LocalDateTime endDate;
	    private Double monthlyRent;
	    private String status;
	    private String message;
	    private LocalDateTime createdAt;
	    private LocalDateTime updatedAt;

	    @Data
	    @NoArgsConstructor
	    @AllArgsConstructor
	    public static class UserInfo {
	        private String id;
	        private String name;
	    }

	    @Data
	    @NoArgsConstructor
	    @AllArgsConstructor
	    public static class MachineInfo {
	        private String id;
	        private String name;
	    }
}
