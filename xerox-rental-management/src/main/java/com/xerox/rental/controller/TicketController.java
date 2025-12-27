package com.xerox.rental.controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.xerox.rental.dto.TicketRequest;
import com.xerox.rental.dto.TicketResponse;
import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.Ticket;
import com.xerox.rental.entity.User;
import com.xerox.rental.service.MachineService;
import com.xerox.rental.service.TicketService;
import com.xerox.rental.service.UserService;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {
    
    @Autowired
    private TicketService ticketService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private MachineService machineService;
    
    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAllTickets(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String userRole) {

        List<Ticket> tickets;

        if (userId != null && userRole != null) {
            // Role-based filtering
            if ("ADMIN".equalsIgnoreCase(userRole)) {
                // Admin sees all tickets
                tickets = ticketService.getAllTickets();
            } else if ("OWNER".equalsIgnoreCase(userRole)) {
                // Owner sees tickets created by their rental customers and assigned to their technicians
                tickets = ticketService.getTicketsByOwner(userId);
            } else if ("RENTAL".equalsIgnoreCase(userRole)) {
                // Rental sees only their own created tickets
                tickets = ticketService.getTicketsByCreator(userId);
            } else if ("TECHNICIAN".equalsIgnoreCase(userRole)) {
                // Technician sees tickets assigned to them
                tickets = ticketService.getTicketsByAssignedUser(userId);
            } else {
                tickets = ticketService.getAllTickets();
            }
        } else {
            // No filtering - return all (for backward compatibility)
            tickets = ticketService.getAllTickets();
        }

        List<TicketResponse> response = tickets.stream()
                .map(TicketResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        return ticketService.getTicketById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody TicketRequest request) {
        try {
            Ticket ticket = new Ticket();
            ticket.setTitle(request.getTitle());
            ticket.setDescription(request.getDescription());
            
            // Set priority
            if (request.getPriority() != null) {
                ticket.setPriority(Ticket.Priority.valueOf(request.getPriority().toUpperCase()));
            }
            
            // Set status
            if (request.getStatus() != null) {
                ticket.setStatus(Ticket.Status.valueOf(request.getStatus().toUpperCase()));
            }
            
            // Set created by
            Long createdById = request.getCreatedById();
            if (createdById != null) {
                Optional<User> createdBy = userService.getUserById(createdById);
                if (createdBy.isPresent()) {
                    ticket.setCreatedBy(createdBy.get());
                } else {
                    return ResponseEntity.badRequest().build();
                }
            }
            
            // Set assigned to if provided
            Long assignedToId = request.getAssignedToId();
            if (assignedToId != null) {
                Optional<User> assignedTo = userService.getUserById(assignedToId);
                if (assignedTo.isPresent()) {
                    ticket.setAssignedTo(assignedTo.get());
                }
            }
            
            // ✅ Set owner (this was missing before)
            Long ownerId = request.getOwnerId();
            if (ownerId != null) {
                Optional<User> owner = userService.getUserById(ownerId);
                if (owner.isPresent()) {
                    ticket.setOwner(owner.get());
                } else {
                    return ResponseEntity.badRequest().build();
                }
            }
            
            // Set machine if provided
            Long machineId = request.getMachineId();
            if (machineId != null) {
                Optional<Machine> machine = machineService.getMachineById(machineId);
                if (machine.isPresent()) {
                    ticket.setMachine(machine.get());
                }
            }
            
            Ticket createdTicket = ticketService.createTicket(ticket);
            return ResponseEntity.ok(createdTicket);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Ticket> updateTicket(@PathVariable Long id, @RequestBody TicketRequest request) {
        try {
            Optional<Ticket> existingTicket = ticketService.getTicketById(id);
            if (existingTicket.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Ticket ticket = existingTicket.get();
            ticket.setTitle(request.getTitle());
            ticket.setDescription(request.getDescription());
            
            // Set priority
            if (request.getPriority() != null) {
                ticket.setPriority(Ticket.Priority.valueOf(request.getPriority().toUpperCase()));
            }
            
            // Set status
            if (request.getStatus() != null) {
                ticket.setStatus(Ticket.Status.valueOf(request.getStatus().toUpperCase()));
            }
            
            // Set assigned to if provided
            Long assignedToId = request.getAssignedToId();
            if (assignedToId != null) {
                Optional<User> assignedTo = userService.getUserById(assignedToId);
                if (assignedTo.isPresent()) {
                    ticket.setAssignedTo(assignedTo.get());
                }
            }
            
            Ticket updatedTicket = ticketService.updateTicket(id, ticket);
            return ResponseEntity.ok(updatedTicket);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String userRole) {
        try {
            // Get the ticket
            Optional<Ticket> ticketOpt = ticketService.getTicketById(id);
            if (ticketOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Ticket ticket = ticketOpt.get();

            // Check if ticket is closed
            if (ticket.getStatus() != Ticket.Status.CLOSED) {
                return ResponseEntity.badRequest()
                    .body("Only closed tickets can be deleted");
            }

            // Role-based authorization
            if ("ADMIN".equalsIgnoreCase(userRole)) {
                // Admin can delete any closed ticket
                ticketService.deleteTicket(id);
                return ResponseEntity.ok().build();
            } else if ("OWNER".equalsIgnoreCase(userRole)) {
                // Owner can delete closed tickets created by their rental customers
                User creator = ticket.getCreatedBy();
                if (creator != null && creator.getOwner() != null &&
                    creator.getOwner().getId().equals(userId)) {
                    ticketService.deleteTicket(id);
                    return ResponseEntity.ok().build();
                } else {
                    return ResponseEntity.status(403)
                        .body("You can only delete tickets from your rental customers");
                }
            } else {
                return ResponseEntity.status(403)
                    .body("Only admins and owners can delete tickets");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body("Failed to delete ticket: " + e.getMessage());
        }
    }
    
    @GetMapping("/created-by/{userId}")
    public ResponseEntity<List<Ticket>> getTicketsByCreatedBy(@PathVariable Long userId) {
        return ResponseEntity.ok(ticketService.getTicketsByCreatedBy(userId));
    }
    
    @GetMapping("/assigned-to/{userId}")
    public ResponseEntity<List<Ticket>> getTicketsByAssignedTo(@PathVariable Long userId) {
        return ResponseEntity.ok(ticketService.getTicketsByAssignedTo(userId));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Ticket>> getTicketsByStatus(@PathVariable Ticket.Status status) {
        return ResponseEntity.ok(ticketService.getTicketsByStatus(status));
    }
    
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<Ticket>> getTicketsByPriority(@PathVariable Ticket.Priority priority) {
        return ResponseEntity.ok(ticketService.getTicketsByPriority(priority));
    }
    
    @PutMapping("/{ticketId}/assign/{userId}")
    public ResponseEntity<Ticket> assignTicket(@PathVariable Long ticketId, @PathVariable Long userId) {
        return ResponseEntity.ok(ticketService.assignTicket(ticketId, userId));
    }
    
    @PutMapping("/{id}/resolve")
    public ResponseEntity<Ticket> resolveTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.resolveTicket(id));
    }
    
    @PutMapping("/{id}/close")
    public ResponseEntity<Ticket> closeTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.closeTicket(id));
    }

    @PostMapping(value = "/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Ticket> createTicketWithImage(
        @RequestParam("title") String title,
        @RequestParam("description") String description,
        @RequestParam("priority") String priority,
        @RequestParam("createdById") Long createdById,
        @RequestParam("ownerId") Long ownerId,
        @RequestParam(value = "machineId", required = false) Long machineId,
        @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        try {
            Ticket ticket = new Ticket();
            ticket.setTitle(title);
            ticket.setDescription(description);
            ticket.setPriority(Ticket.Priority.valueOf(priority.toUpperCase()));

            Optional<User> createdBy = userService.getUserById(createdById);
            if (createdBy.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            ticket.setCreatedBy(createdBy.get());

            Optional<User> owner = userService.getUserById(ownerId);
            if (owner.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            ticket.setOwner(owner.get());

            if (machineId != null) {
                Optional<Machine> machine = machineService.getMachineById(machineId);
                machine.ifPresent(ticket::setMachine);
            }

            Ticket createdTicket = ticketService.createTicketWithImage(ticket, image);
            return ResponseEntity.ok(createdTicket);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{ticketId}/assign-technician/{technicianId}/by-owner/{ownerId}")
    public ResponseEntity<Ticket> assignTicketToTechnician(
        @PathVariable Long ticketId,
        @PathVariable Long technicianId,
        @PathVariable Long ownerId
    ) {
        try {
            Ticket updatedTicket = ticketService.assignTicketToTechnician(ticketId, technicianId, ownerId);
            return ResponseEntity.ok(updatedTicket);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/by-owner/{ownerId}")
    public ResponseEntity<List<TicketResponse>> getTicketsByOwner(@PathVariable Long ownerId) {
        List<Ticket> tickets = ticketService.getTicketsByOwner(ownerId);
        List<TicketResponse> response = tickets.stream()
                .map(TicketResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // ✅ 6. Get Ticket Image (New & Old versions supported)

    // 🔹 New (direct by filename)
    @GetMapping(value = "/image/{filename:.+}", produces = {
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE
    })
    public ResponseEntity<byte[]> getTicketImageByFile(@PathVariable String filename) {
        try {
            byte[] image = ticketService.getTicketImageByFileName(filename);
            return ResponseEntity.ok(image);
        } catch (Exception e) {
            System.err.println("❌ Error loading image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // 🔹 Old version (ticketId + userId for secure access)
    @GetMapping(value = "/{ticketId}/image", produces = {
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE
    })
    public ResponseEntity<?> getTicketImageSecure(
            @PathVariable Long ticketId,
            @RequestParam Long userId) {
        try {
            byte[] image = ticketService.getTicketImage(ticketId, userId);
            return ResponseEntity.ok(image);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

}