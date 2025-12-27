package com.xerox.rental.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class MaintenanceScheduleRequest {
	private Long machineId;
    private String maintenanceType;
    private LocalDateTime scheduledDate;
    private LocalDateTime completedDate;
    private Long technicianId;
    private String status;
    private String description;
    private String notes;
    private Integer estimatedDuration;
    private Integer actualDuration;
    private Double cost;
    
    // Nested object support for frontend
    private MachineDto machine;
    private TechnicianDto technician;
    
    @Data
    public static class MachineDto {
        private Long id;
        private String name;
    }
    
    @Data
    public static class TechnicianDto {
        private Long id;
        private String name;
    }
    
    // Helper methods to extract IDs
    public Long getMachineId() {
        if (this.machineId != null) {
            return this.machineId;
        }
        if (this.machine != null && this.machine.getId() != null) {
            return this.machine.getId();
        }
        return null;
    }
    
    public Long getTechnicianId() {
        if (this.technicianId != null) {
            return this.technicianId;
        }
        if (this.technician != null && this.technician.getId() != null) {
            return this.technician.getId();
        }
        return null;
    }
}
