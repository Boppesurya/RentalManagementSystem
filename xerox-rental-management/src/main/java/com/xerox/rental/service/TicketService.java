package com.xerox.rental.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.Ticket;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.TicketRepository;
import com.xerox.rental.repository.UserRepository;

@Service
public class TicketService {
    
    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Value("${ticket.upload.dir:uploads/tickets}")
    private String uploadDir;
    
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }
    
    public Optional<Ticket> getTicketById(Long id) {
        return ticketRepository.findById(id);
    }
    
    public Ticket createTicket(Ticket ticket) {
        return ticketRepository.save(ticket);
    }
    
    public Ticket updateTicket(Long id, Ticket ticketDetails) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        if (ticketDetails.getTitle() != null) {
            ticket.setTitle(ticketDetails.getTitle());
        }
        if (ticketDetails.getDescription() != null) {
            ticket.setDescription(ticketDetails.getDescription());
        }
        if (ticketDetails.getPriority() != null) {
            ticket.setPriority(ticketDetails.getPriority());
        }
        if (ticketDetails.getStatus() != null) {
            ticket.setStatus(ticketDetails.getStatus());
        }
        if (ticketDetails.getAssignedTo() != null) {
            ticket.setAssignedTo(ticketDetails.getAssignedTo());
        }
        if (ticketDetails.getMachine() != null) {
            ticket.setMachine(ticketDetails.getMachine());
        }
        
        return ticketRepository.save(ticket);
    }
    
    public void deleteTicket(Long id) {
        ticketRepository.deleteById(id);
    }
    
    public List<Ticket> getTicketsByCreatedBy(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ticketRepository.findByCreatedBy(user);
    }
    
    public List<Ticket> getTicketsByAssignedTo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ticketRepository.findByAssignedTo(user);
    }
    
    public List<Ticket> getTicketsByStatus(Ticket.Status status) {
        return ticketRepository.findByStatus(status);
    }
    
    public List<Ticket> getTicketsByPriority(Ticket.Priority priority) {
        return ticketRepository.findByPriority(priority);
    }
    
    public Ticket assignTicket(Long ticketId, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        ticket.setAssignedTo(user);
        ticket.setStatus(Ticket.Status.IN_PROGRESS);
        
        return ticketRepository.save(ticket);
    }
    
    public Ticket resolveTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        ticket.setStatus(Ticket.Status.RESOLVED);
        return ticketRepository.save(ticket);
    }
    
    public Ticket closeTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setStatus(Ticket.Status.CLOSED);
        return ticketRepository.save(ticket);
    }

    // ✅ Fixed: Create ticket with image
    public Ticket createTicketWithImage(Ticket ticket, MultipartFile image) throws IOException {
        if (image != null && !image.isEmpty()) {
            try {
                String originalFilename = image.getOriginalFilename();
                if (originalFilename == null || originalFilename.isEmpty()) {
                    originalFilename = "ticket_image.jpg";
                }

                String fileExtension = "";
                int dotIndex = originalFilename.lastIndexOf(".");
                if (dotIndex > 0) {
                    fileExtension = originalFilename.substring(dotIndex);
                }

                String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

                File uploadDirectory = new File(uploadDir);
                if (!uploadDirectory.exists()) {
                    boolean created = uploadDirectory.mkdirs();
                    if (!created) {
                        throw new IOException("Failed to create upload directory");
                    }
                }

                Path filePath = Paths.get(uploadDir, uniqueFilename);
                Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                String imageUrl = "/api/tickets/image/" + uniqueFilename;
                ticket.setImageUrl(imageUrl);
                ticket.setImageFileName(uniqueFilename);

                System.out.println("✓ Image saved at: " + filePath);
            } catch (Exception e) {
                System.err.println("✗ Error saving image: " + e.getMessage());
            }
        }

        if (ticket.getStatus() == null)
            ticket.setStatus(Ticket.Status.OPEN);

        Ticket savedTicket = ticketRepository.save(ticket);
        sendTicketNotificationEmail(savedTicket);
        return savedTicket;
    }
    
    public void sendTicketNotificationEmail(Ticket ticket) {
        try {
            User owner = ticket.getOwner();
            User assignedTechnician = ticket.getAssignedTo();
            User createdBy = ticket.getCreatedBy();

            String subject = "New Support Ticket Created: " + ticket.getTitle();
            StringBuilder message = new StringBuilder();

            message.append("<h2>New Support Ticket</h2>");
            message.append("<p><strong>Title:</strong> ").append(ticket.getTitle()).append("</p>");
            message.append("<p><strong>Description:</strong> ").append(ticket.getDescription()).append("</p>");
            message.append("<p><strong>Priority:</strong> ").append(ticket.getPriority()).append("</p>");
            message.append("<p><strong>Status:</strong> ").append(ticket.getStatus()).append("</p>");

            if (createdBy != null) {
                message.append("<p><strong>Created By:</strong> ").append(createdBy.getName()).append("</p>");
            }

            if (ticket.getMachine() != null) {
                Machine machine = ticket.getMachine();
                message.append("<p><strong>Machine:</strong> ")
                       .append(machine.getName())
                       .append(" (").append(machine.getSerialNumber()).append(")</p>");
            }

            if (ticket.getImageFileName() != null && !ticket.getImageFileName().isEmpty()) {
                message.append("<p><strong>Image Attached:</strong> ").append(ticket.getImageFileName()).append("</p>");
            }

            message.append("<p><em>Please log in to the system to view and manage this ticket.</em></p>");

            if (owner != null && owner.getEmail() != null) {
                emailService.sendHtmlEmail(owner.getEmail(), subject, message.toString());
            }

            if (assignedTechnician != null && assignedTechnician.getEmail() != null) {
                emailService.sendHtmlEmail(assignedTechnician.getEmail(), subject, message.toString());
            }

            ticket.setEmailSent(true);
            ticketRepository.save(ticket);

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Failed to send ticket notification email: " + e.getMessage());
        }
    }

    public Ticket assignTicketToTechnician(Long ticketId, Long technicianId, Long ownerId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        if (ticket.getOwner() == null || !ticket.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Only the ticket owner can assign technicians");
        }

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Technician not found"));

        // Convert role safely (handle enum or string)
        String role = technician.getRole() != null ? technician.getRole().toString() : "";
        if (!role.equalsIgnoreCase("TECHNICIAN")) {
            throw new RuntimeException("Selected user is not a technician");
        }

        ticket.setAssignedTo(technician);
        ticket.setStatus(Ticket.Status.IN_PROGRESS);

        Ticket updatedTicket = ticketRepository.save(ticket);

        try {
            String subject = "Ticket Assigned: " + ticket.getTitle();
            String message = "<h2>Ticket Assignment</h2>" +
                    "<p>You have been assigned to work on the following ticket:</p>" +
                    "<p><strong>Title:</strong> " + ticket.getTitle() + "</p>" +
                    "<p><strong>Description:</strong> " + ticket.getDescription() + "</p>" +
                    "<p><strong>Priority:</strong> " + ticket.getPriority() + "</p>" +
                    "<p><em>Please log in to the system to view details and start working on this ticket.</em></p>";

            if (technician.getEmail() != null) {
                emailService.sendHtmlEmail(technician.getEmail(), subject, message);
            }

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Failed to send assignment email: " + e.getMessage());
        }

        return updatedTicket;
    }

    public List<Ticket> getTicketsByOwner(Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        return ticketRepository.findByOwner(owner);
    }

    public byte[] getTicketImage(Long ticketId , Long userId) throws IOException {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getImageUrl() == null) {
            throw new RuntimeException("No image attached to this ticket");
        }

        // Extract filename from API URL
        // imageUrl format: /api/tickets/image/abc-123.jpg
        String filename = ticket.getImageUrl().substring(ticket.getImageUrl().lastIndexOf('/') + 1);

        // Construct file path
        Path filePath = Paths.get(uploadDir, filename);

        if (!Files.exists(filePath)) {
            throw new IOException("Image file not found: " + filename);
        }

        return Files.readAllBytes(filePath);
    }

    /**
     * Get ticket image by filename
     */
    /**
     * ✅ FIXED: Get ticket image directly by filename (used by /api/tickets/image/{filename})
     */
    public byte[] getTicketImageByFileName(String filename) throws IOException {
        Path filePath = Paths.get(uploadDir, filename);
        if (!Files.exists(filePath)) {
            throw new IOException("Image file not found: " + filename);
        }
        return Files.readAllBytes(filePath);
    }


    /**
     * Get tickets created by a specific user
     */
    public List<Ticket> getTicketsByCreator(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ticketRepository.findByCreatedBy(user);
    }

    /**
     * Get tickets assigned to a specific user
     */
    public List<Ticket> getTicketsByAssignedUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ticketRepository.findByAssignedTo(user);
    }
    
    
}