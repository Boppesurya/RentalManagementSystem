package com.xerox.rental.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRequest {
	private String title;
    private String description;
    private String documentType;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String fileType;
    private String entityType;
    private Long entityId;
    private Long machineId;
    private Long userId;
    private Long contractId;
    private Long uploadedBy;
    private Integer version;
    private String status;
    private LocalDate expiryDate;
    private String tags;
    private Boolean isPublic;
}
