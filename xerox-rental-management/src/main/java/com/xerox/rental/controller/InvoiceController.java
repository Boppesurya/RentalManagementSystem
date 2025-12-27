package com.xerox.rental.controller;

import com.xerox.rental.entity.Invoice;
import com.xerox.rental.entity.InvoiceItem;
import com.xerox.rental.entity.User;
import com.xerox.rental.entity.Machine;
import com.xerox.rental.dto.InvoiceRequest;
import com.xerox.rental.dto.InvoiceItemRequest;
import com.xerox.rental.service.InvoiceService;
import com.xerox.rental.service.UserService;
import com.xerox.rental.service.MachineService;
import com.xerox.rental.service.NotificationService;
import com.xerox.rental.service.PdfGenerationService;
import com.xerox.rental.service.AuditLogService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {
    
    @Autowired
    private InvoiceService invoiceService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private MachineService machineService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private PdfGenerationService pdfGenerationService;

    // ✅ NEW ENDPOINT — fetch rental-related machines only
    @GetMapping("/machines/by-rental/{rentalId}")
    public ResponseEntity<List<Machine>> getMachinesByRental(@PathVariable Long rentalId) {
        try {
            List<Machine> machines = invoiceService.getMachinesByRental(rentalId);
            return ResponseEntity.ok(machines);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices(
            @RequestParam(required = false) String currentUserId,
            @RequestParam(required = false) String currentUserRole) {
        try {
            List<Invoice> invoices = invoiceService.getAllInvoices();

            // Apply role-based filtering
            if (("OWNER".equalsIgnoreCase(currentUserRole)) && currentUserId != null) {
                Long ownerId = Long.parseLong(currentUserId);
                invoices = invoices.stream()
                        .filter(i -> i.getOwner() != null && i.getOwner().getId().equals(ownerId))
                        .toList();
            } else if (("RENTAL".equalsIgnoreCase(currentUserRole)) && currentUserId != null) {
                Long rentalId = Long.parseLong(currentUserId);
                invoices = invoices.stream()
                        .filter(i -> i.getRental() != null && i.getRental().getId().equals(rentalId))
                        .toList();
            } else if (("TECHNICIAN".equalsIgnoreCase(currentUserRole)) && currentUserId != null) {
                Long technicianId = Long.parseLong(currentUserId);
                Optional<User> technician = userService.getUserById(technicianId);

                if (technician.isPresent() && technician.get().getOwner() != null) {
                    Long ownerId = technician.get().getOwner().getId();
                    invoices = invoices.stream()
                            .filter(i -> i.getOwner() != null && i.getOwner().getId().equals(ownerId))
                            .toList();
                }
            }

            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@RequestBody InvoiceRequest request) {
        try {
            Invoice invoice = new Invoice();
            invoice.setAmount(request.getAmount());
            invoice.setDueDate(request.getDueDate());

            // Set rental
            Long rentalId = request.getRentalId();
            if (rentalId != null) {
                Optional<User> rental = userService.getUserById(rentalId);
                if (rental.isPresent()) {
                    invoice.setRental(rental.get());
                } else {
                    return ResponseEntity.badRequest().build();
                }
            }

            // Set owner
            Long ownerId = request.getOwnerId();
            if (ownerId != null) {
                Optional<User> owner = userService.getUserById(ownerId);
                if (owner.isPresent()) {
                    invoice.setOwner(owner.get());
                } else {
                    return ResponseEntity.badRequest().build();
                }
            }

            // Set machine
            Long machineId = request.getMachineId();
            if (machineId != null) {
                Optional<Machine> machine = machineService.getMachineById(machineId);
                if (machine.isPresent()) {
                    invoice.setMachine(machine.get());
                } else {
                    return ResponseEntity.badRequest().build();
                }
            }

            // Meter readings and rental calculations
            if (request.getStartingReading() != null) invoice.setStartingReading(request.getStartingReading());
            if (request.getClosingReading() != null) invoice.setClosingReading(request.getClosingReading());
            if (request.getTotalCopies() != null) invoice.setTotalCopies(request.getTotalCopies());
            if (request.getCopyRatio() != null) invoice.setCopyRatio(request.getCopyRatio());
            if (request.getFreeCopies() != null) invoice.setFreeCopies(request.getFreeCopies());
            if (request.getBillableCopies() != null) invoice.setBillableCopies(request.getBillableCopies());
            if (request.getClassification() != null) invoice.setClassification(request.getClassification());
            if (request.getMonthlyRent() != null) invoice.setMonthlyRent(request.getMonthlyRent());

            // Multi-machine invoice items
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                List<InvoiceItem> invoiceItems = new ArrayList<>();

                for (InvoiceItemRequest itemRequest : request.getItems()) {
                    InvoiceItem item = new InvoiceItem();

                    Optional<Machine> itemMachine = machineService.getMachineById(itemRequest.getMachineId());
                    if (itemMachine.isPresent()) {
                        item.setMachine(itemMachine.get());
                    } else {
                        return ResponseEntity.badRequest().build();
                    }

                    item.setStartingReading(itemRequest.getStartingReading());
                    item.setClosingReading(itemRequest.getClosingReading());
                    item.setTotalCopies(itemRequest.getTotalCopies());
                    item.setFreeCopies(itemRequest.getFreeCopies() != null ? itemRequest.getFreeCopies() : 0L);
                    item.setBillableCopies(itemRequest.getBillableCopies());
                    item.setCopyRatio(itemRequest.getCopyRatio());
                    item.setMonthlyRent(itemRequest.getMonthlyRent());
                    item.setAmount(itemRequest.getAmount() != null ? itemRequest.getAmount() : 0.0);

                    invoiceItems.add(item);
                }

                invoice.setInvoiceItems(invoiceItems);
                invoice.setMachine(null);
            }

            // Status
            if (request.getStatus() != null) {
                invoice.setStatus(Invoice.Status.valueOf(request.getStatus().toUpperCase()));
            }

            Invoice createdInvoice = invoiceService.createInvoice(invoice);

            // Audit logging
            try {
                auditLogService.logEntityCreation(
                        createdInvoice.getOwner(),
                        "Invoice",
                        createdInvoice.getId().toString(),
                        "Created invoice: " + createdInvoice.getInvoiceNumber() + " for ₹" + createdInvoice.getTotalAmount()
                );
            } catch (Exception e) {
                System.err.println("Error logging invoice creation: " + e.getMessage());
            }

            // Notifications
            try {
                notificationService.sendInvoiceGeneratedNotification(
                        createdInvoice.getRental(),
                        createdInvoice.getInvoiceNumber(),
                        createdInvoice.getTotalAmount()
                );
            } catch (Exception e) {
                System.err.println("Error sending invoice notification: " + e.getMessage());
            }

            return ResponseEntity.ok(createdInvoice);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable Long id, @RequestBody InvoiceRequest request) {
        try {
            Optional<Invoice> existingInvoice = invoiceService.getInvoiceById(id);
            if (existingInvoice.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Invoice invoice = existingInvoice.get();
            if (request.getAmount() != null) invoice.setAmount(request.getAmount());
            if (request.getDueDate() != null) invoice.setDueDate(request.getDueDate());
            if (request.getPaidDate() != null) invoice.setPaidDate(request.getPaidDate());

            if (request.getStatus() != null) {
                invoice.setStatus(Invoice.Status.valueOf(request.getStatus().toUpperCase()));
            }
            if (request.getPaymentMode() != null) {
                invoice.setPaymentMode(Invoice.PaymentMode.valueOf(request.getPaymentMode().toUpperCase()));
            }

            Invoice updatedInvoice = invoiceService.updateInvoice(id, invoice);
            return ResponseEntity.ok(updatedInvoice);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Invoice>> getInvoicesByOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByOwner(ownerId));
    }

    @GetMapping("/rental/{rentalId}")
    public ResponseEntity<List<Invoice>> getInvoicesByRental(@PathVariable Long rentalId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByRental(rentalId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Invoice>> getInvoicesByStatus(@PathVariable Invoice.Status status) {
        return ResponseEntity.ok(invoiceService.getInvoicesByStatus(status));
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<Invoice> markAsPaid(@PathVariable Long id, @RequestParam Invoice.PaymentMode paymentMode) {
        return ResponseEntity.ok(invoiceService.markAsPaid(id, paymentMode));
    }

    @GetMapping("/machine/{machineId}/owner/{ownerId}/last-reading")
    public ResponseEntity<Long> getLastClosingReading(
            @PathVariable Long machineId,
            @PathVariable Long ownerId
    ) {
        Long lastReading = invoiceService.getLastClosingReading(machineId, ownerId);
        return ResponseEntity.ok(lastReading);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long id) {
        try {
            Optional<Invoice> invoiceOpt = invoiceService.getInvoiceById(id);
            if (invoiceOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Invoice invoice = invoiceOpt.get();
            Machine machine = invoice.getMachine();
            User rental = invoice.getRental();
            User owner = invoice.getOwner();

            byte[] pdfBytes = pdfGenerationService.generateInvoicePdf(invoice, machine, rental, owner);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "invoice-" + invoice.getInvoiceNumber() + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
