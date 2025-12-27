package com.xerox.rental.dto;

import lombok.Data;

@Data
public class MachineHealthRequest {
	 private Long machineId;
	    private Double healthScore;
	    private Double temperature;
	    private Double humidity;
	    private Integer tonerLevel;
	    private Integer paperLevel;
	    private Integer errorCount;
	    private Long pagesPrintedToday;
	    private String alerts;
	    private String recommendations;
	    
	    // Nested object support for frontend
	    private MachineDto machine;
	    
	    @Data
	    public static class MachineDto {
	        private Long id;
	        private String name;
	    }
	    
	    // Helper method to extract machine ID
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
