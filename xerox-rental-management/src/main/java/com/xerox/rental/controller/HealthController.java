package com.xerox.rental.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class HealthController {
	 @GetMapping("/health")
	    public ResponseEntity<Map<String, Object>> healthCheck() {
	        Map<String, Object> health = new HashMap<>();
	        health.put("status", "ok");
	        health.put("timestamp", LocalDateTime.now().toString());
	        health.put("service", "Rental Management System");
	        health.put("version", "1.0.0");
	        return ResponseEntity.ok(health);
	    }
}
