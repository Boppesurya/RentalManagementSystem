package com.xerox.rental.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MachineLocationResponse {
	private Long id;
    private MachineInfo machine;
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
    private UserInfo recordedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MachineInfo {
        private String id;
        private String name;
        private String model;
        private String serialNumber;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String id;
        private String name;
    }
}
