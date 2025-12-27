package com.xerox.rental.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvoiceResponse {
	private Long id;
    private String invoiceNumber;
    private UserDto rental;
    private UserDto owner;
    private MachineDto machine;
    private Double amount;
    private Double gstAmount;
    private Double totalAmount;
    private Long startingReading;
    private Long closingReading;
    private Long totalCopies;
    private Double copyRatio;
    private Long freeCopies;
    private Long billableCopies;
    private String classification;
    private Double monthlyRent;
    private String companyLogoUrl;
    private String stampImageUrl;
    private String signatureImageUrl;
    private String status;
    private LocalDateTime dueDate;
    private LocalDateTime paidDate;
    private String paymentMode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // For multi-machine invoices
    private List<InvoiceItemResponse> items;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserDto {
        private Long id;
        private String name;
        private String email;
        private String address;
        private String gstNumber;
        private String phone;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MachineDto {
        private Long id;
        private String name;
        private String model;
        private String serialNumber;
    }
}
