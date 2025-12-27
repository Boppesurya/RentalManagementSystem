package com.xerox.rental.dto;

import com.xerox.rental.entity.Ticket;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TicketResponse {
    private String id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private UserInfo createdBy;
    private UserInfo assignedTo;
    private UserInfo owner;
    private MachineInfo machine;
    private String imageUrl;
    private String imageFileName;
    private Boolean emailSent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    public static class UserInfo {
        private String id;
        private String name;
        
        public UserInfo(String id, String name) {
            this.id = id;
            this.name = name;
        }
    }
    
    @Data
    public static class MachineInfo {
        private String id;
        private String name;
        
        public MachineInfo(String id, String name) {
            this.id = id;
            this.name = name;
        }
    }
    
    public static TicketResponse fromEntity(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId().toString());
        response.setTitle(ticket.getTitle());
        response.setDescription(ticket.getDescription());
        response.setPriority(ticket.getPriority().toString());
        response.setStatus(ticket.getStatus().toString().replace("_", "-"));

        if (ticket.getCreatedBy() != null) {
            response.setCreatedBy(new UserInfo(
                ticket.getCreatedBy().getId().toString(),
                ticket.getCreatedBy().getName()
            ));
        }

        if (ticket.getAssignedTo() != null) {
            response.setAssignedTo(new UserInfo(
                ticket.getAssignedTo().getId().toString(),
                ticket.getAssignedTo().getName()
            ));
        }

        if (ticket.getOwner() != null) {
            response.setOwner(new UserInfo(
                ticket.getOwner().getId().toString(),
                ticket.getOwner().getName()
            ));
        }

        if (ticket.getMachine() != null) {
            response.setMachine(new MachineInfo(
                ticket.getMachine().getId().toString(),
                ticket.getMachine().getName()
            ));
        }

        response.setImageUrl(ticket.getImageUrl());
        response.setImageFileName(ticket.getImageFileName());
        response.setEmailSent(ticket.getEmailSent());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());
        return response;
    }
}