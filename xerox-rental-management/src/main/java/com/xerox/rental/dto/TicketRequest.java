package com.xerox.rental.dto;



import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class TicketRequest {
	private String title;
    private String description;
    private String priority;
    private String status;
    private Long createdById;
    private Long assignedToId;
    private Long machineId;
    private Long ownerId;
    private String imageUrl;
    private String imageFileName;
 
    private List<MultipartFile> images;
    
    // Nested object support for frontend
    private CreatedByDto createdBy;
    private AssignedToDto assignedTo;
    private MachineDto machine;
    
    @Data
    public static class CreatedByDto {
        private Long id;
        private String name;
    }
    
    @Data
    public static class AssignedToDto {
        private Long id;
        private String name;
    }
    
    @Data
    public static class MachineDto {
        private Long id;
        private String name;
    }
    
    
    
    // Helper methods to extract IDs
    public Long getCreatedById() {
        if (this.createdById != null) {
            return this.createdById;
        }
        if (this.createdBy != null && this.createdBy.getId() != null) {
            return this.createdBy.getId();
        }
        return null;
    }
    
    public Long getAssignedToId() {
        if (this.assignedToId != null) {
            return this.assignedToId;
        }
        if (this.assignedTo != null && this.assignedTo.getId() != null) {
            return this.assignedTo.getId();
        }
        return null;
    }
    
    public Long getMachineId() {
        if (this.machineId != null) {
            return this.machineId;
        }
        if (this.machine != null && this.machine.getId() != null) {
            return this.machine.getId();
        }
        return null;
    }
}
