package com.xerox.rental.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.xerox.rental.service.EmailService;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailController {
	@Autowired
    private EmailService emailService;
    
    @PostMapping("/send")
    public ResponseEntity<String> sendEmail(@RequestBody Map<String, String> emailData) {
        try {
            String to = emailData.get("to");
            String subject = emailData.get("subject");
            String body = emailData.get("body");
            
            emailService.sendEmail(to, subject, body);
            return ResponseEntity.ok("Email sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send email: " + e.getMessage());
        }
    }
    
    @PostMapping("/welcome")
    public ResponseEntity<String> sendWelcomeEmail(@RequestBody Map<String, String> emailData) {
        try {
            String to = emailData.get("to");
            String name = emailData.get("name");
            String tempPassword = emailData.get("tempPassword");
            
            emailService.sendWelcomeEmail(to, name, tempPassword);
            return ResponseEntity.ok("Welcome email sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send welcome email: " + e.getMessage());
        }
    }
    
    @PostMapping("/password-reset")
    public ResponseEntity<String> sendPasswordResetEmail(@RequestBody Map<String, String> emailData) {
        try {
            String to = emailData.get("to");
            String name = emailData.get("name");
            String newPassword = emailData.get("newPassword");
            
            emailService.sendPasswordResetEmail(to, name, newPassword);
            return ResponseEntity.ok("Password reset email sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send password reset email: " + e.getMessage());
        }
    }
    
    @PostMapping("/invoice-notification")
    public ResponseEntity<String> sendInvoiceNotification(@RequestBody Map<String, Object> emailData) {
        try {
            String to = (String) emailData.get("to");
            String invoiceNumber = (String) emailData.get("invoiceNumber");
            Double amount = Double.valueOf(emailData.get("amount").toString());
            
            emailService.sendInvoiceNotification(to, invoiceNumber, amount);
            return ResponseEntity.ok("Invoice notification sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send invoice notification: " + e.getMessage());
        }
    }
    
    @PostMapping("/rental-request-notification")
    public ResponseEntity<String> sendRentalRequestNotification(@RequestBody Map<String, String> emailData) {
        try {
            String to = emailData.get("to");
            String machineName = emailData.get("machineName");
            String requesterName = emailData.get("requesterName");
            
            emailService.sendRentalRequestNotification(to, machineName, requesterName);
            return ResponseEntity.ok("Rental request notification sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send rental request notification: " + e.getMessage());
        }
    }
    
    @PostMapping("/contract-notification")
    public ResponseEntity<String> sendContractNotification(@RequestBody Map<String, String> emailData) {
        try {
            String to = emailData.get("to");
            String machineName = emailData.get("machineName");
            String contractId = emailData.get("contractId");
            
            emailService.sendContractNotification(to, machineName, contractId);
            return ResponseEntity.ok("Contract notification sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send contract notification: " + e.getMessage());
        }
    }
}
