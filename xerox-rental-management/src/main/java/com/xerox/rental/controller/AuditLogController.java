package com.xerox.rental.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.xerox.rental.dto.AuditLogResponse;
import com.xerox.rental.entity.AuditLog;
import com.xerox.rental.service.AuditLogService;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {
	 @Autowired
	    private AuditLogService auditLogService;
	    
	    @GetMapping
	    public ResponseEntity<List<AuditLogResponse>> getAllAuditLogs() {
	        List<AuditLog> auditLogs = auditLogService.getAllAuditLogs();
	        List<AuditLogResponse> response = auditLogs.stream()
	                .map(AuditLogResponse::fromEntity)
	                .collect(Collectors.toList());
	        return ResponseEntity.ok(response);
	    }
	    
	    @GetMapping("/entity/{entityType}/{entityId}")
	    public ResponseEntity<List<AuditLogResponse>> getAuditLogsByEntity(@PathVariable String entityType, 
	                                                             @PathVariable String entityId) {
	        List<AuditLog> auditLogs = auditLogService.getAuditLogsByEntity(entityType, entityId);
	        List<AuditLogResponse> response = auditLogs.stream()
	                .map(AuditLogResponse::fromEntity)
	                .collect(Collectors.toList());
	        return ResponseEntity.ok(response);
	    }
	    
	    @GetMapping("/date-range")
	    public ResponseEntity<List<AuditLogResponse>> getAuditLogsByDateRange(
	            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
	            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
	        List<AuditLog> auditLogs = auditLogService.getAuditLogsByDateRange(start, end);
	        List<AuditLogResponse> response = auditLogs.stream()
	                .map(AuditLogResponse::fromEntity)
	                .collect(Collectors.toList());
	        return ResponseEntity.ok(response);
	    }
	    
	    @GetMapping("/user/{userId}")
	    public ResponseEntity<List<AuditLogResponse>> getAuditLogsByUser(@PathVariable Long userId) {
	        try {
	            List<AuditLog> auditLogs = auditLogService.getAuditLogsByUserId(userId);
	            List<AuditLogResponse> response = auditLogs.stream()
	                    .map(AuditLogResponse::fromEntity)
	                    .collect(Collectors.toList());
	            return ResponseEntity.ok(response);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }
}
