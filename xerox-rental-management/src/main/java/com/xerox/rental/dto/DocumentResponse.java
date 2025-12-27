package com.xerox.rental.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
	private Long id;
    private String title;
    private String description;
    private String documentType;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String fileType;
    private String entityType;
    private Long entityId;
    private MachineInfo machine;
    private UserInfo user;
    private ContractInfo contract;
    private UserInfo uploadedBy;
    private Integer version;
    private String status;
    private LocalDate expiryDate;
    private String tags;
    private Boolean isPublic;
    private Integer downloadCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MachineInfo {
        private String id;
        private String name;
        private String serialNumber;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String id;
        private String name;
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContractInfo {
        private String id;
        private String contractNumber;
    }
}
