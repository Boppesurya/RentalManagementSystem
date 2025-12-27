package com.xerox.rental.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.xerox.rental.entity.Subscription;

import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;

@Service
public class EmailService {

	  @Autowired
	    private JavaMailSender mailSender;
	    
	  public void sendEmail(String to, String subject, String body) {
	        try {
	            MimeMessage message = mailSender.createMimeMessage();
	            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

	            helper.setTo(to);
	            helper.setSubject(subject);
	            helper.setText(body, true); // true indicates HTML
	            helper.setFrom("boppesuryap@gmail.com");

	            mailSender.send(message);
	        } catch (Exception e) {
	            System.err.println("Failed to send email: " + e.getMessage());
	            e.printStackTrace();
	            // Don't throw exception to prevent ticket creation from failing
	        }
	    }
	    
	    public void sendWelcomeEmail(String to, String name, String tempPassword) {
	        String subject = "Welcome to  Rental Management System";
	        String body = String.format(
	            "Dear %s,\n\n" +
	            "Welcome to Rental Management System!\n\n" +
	            "Your account has been created successfully.\n" +
	            "Temporary Password: %s\n\n" +
	            "Please login and change your password immediately.\n\n" +
	            "Best regards,\n" +
	            "Rental Management Team",
	            name, tempPassword
	        );
	        
	        sendEmail(to, subject, body);
	    }
	    
	    public void sendPasswordResetEmail(String to, String name, String newPassword) {
	        String subject = "Password Reset - Rental Management";
	        String body = String.format(
	            "Dear %s,\n\n" +
	            "Your password has been reset.\n" +
	            "New Password: %s\n\n" +
	            "Please login and change your password.\n\n" +
	            "Best regards,\n" +
	            "Rental Management Team",
	            name, newPassword
	        );
	        
	        sendEmail(to, subject, body);
	    }
	    
	    public void sendInvoiceNotification(String to, String invoiceNumber, Double amount) {
	        String subject = "New Invoice Generated - " + invoiceNumber;
	        String body = String.format(
	            "Dear Customer,\n\n" +
	            "A new invoice has been generated for your account.\n\n" +
	            "Invoice Number: %s\n" +
	            "Amount: ₹%.2f\n\n" +
	            "Please login to view and pay the invoice.\n\n" +
	            "Best regards,\n" +
	            "Rental Management Team",
	            invoiceNumber, amount
	        );
	        
	        sendEmail(to, subject, body);
	    }
	    
	    public void sendRentalRequestNotification(String to, String machineName, String requesterName) {
	        String subject = "New Rental Request Received";
	        String body = String.format(
	            "Dear Owner,\n\n" +
	            "You have received a new rental request.\n\n" +
	            "Machine: %s\n" +
	            "Requested by: %s\n\n" +
	            "Please login to review and respond to the request.\n\n" +
	            "Best regards,\n" +
	            "Rental Management Team",
	            machineName, requesterName
	        );
	        
	        sendEmail(to, subject, body);
	    }
	    
	    public void sendContractNotification(String to, String machineName, String contractId) {
	        String subject = "New Contract Created - " + contractId;
	        String body = String.format(
	            "Dear Customer,\n\n" +
	            "A new rental contract has been created.\n\n" +
	            "Contract ID: %s\n" +
	            "Machine: %s\n\n" +
	            "Please login to view the contract details.\n\n" +
	            "Best regards,\n" +
	            "Rental Management Team",
	            contractId, machineName
	        );
	        
	        sendEmail(to, subject, body);
	    }
	    
	    public void sendHtmlEmail(String to, String subject, String htmlContent) {
	        try {
	            MimeMessage message = mailSender.createMimeMessage();
	            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

	            helper.setTo(to);
	            helper.setSubject(subject);
	            helper.setText(htmlContent, true); // true = HTML

	            mailSender.send(message);
	        } catch (Exception e) {
	            e.printStackTrace();
	            System.err.println("Email send failed: " + e.getMessage());
	        }
	    }
	    
	    /**
	     * Send HTML email with PDF invoice attached
	     * This is the method called from SubscriptionService.sendInvoiceEmail()
	     */
	    public void sendEmailWithAttachment(
	            String to,
	            String name,
	            String subject,
	            String htmlBody,
	            byte[] pdfBytes,
	            String pdfFileName) {

	        try {
	            MimeMessage message = mailSender.createMimeMessage();
	            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

	            helper.setTo(to);
	            helper.setSubject(subject);
	            helper.setFrom("boppesuryap@gmail.com");  // or use ${spring.mail.username} in config

	            // Personalized greeting
	            String fullHtml = "<p>Dear " + name + ",</p>" + htmlBody;

	            helper.setText(fullHtml, true); // true = is HTML

	            // Attach the PDF invoice
	            helper.addAttachment(pdfFileName, new ByteArrayDataSource(pdfBytes, "application/pdf"));

	            mailSender.send(message);

	            System.out.println("Invoice email with attachment sent successfully to: " + to);

	        } catch (Exception e) {
	            System.err.println("Failed to send invoice email with attachment to: " + to);
	            e.printStackTrace();
	            // Don't throw — subscription activation should not fail because of email
	        }
	    }
	    
	    public void sendInvoiceToAdmins(Subscription subscription, byte[] pdf, String fileName) {

	        String adminEmail = "boppesuryap@gmail.com";  // replace OR fetch from DB

	        String message = """
	                <h3>New Subscription Activated</h3>
	                <p>User: %s</p>
	                <p>Plan: %s</p>
	                <p>Invoice: %s</p>
	                """.formatted(
	                subscription.getUser().getName(),
	                subscription.getPlan().getName(),
	                subscription.getInvoiceNumber()
	        );

	        sendEmailWithAttachment(
	                adminEmail,
	                "ADMIN",
	                "New Subscription Activated - Invoice",
	                message,
	                pdf,
	                fileName
	        );
	    }

	

	    
	   
	    
}
