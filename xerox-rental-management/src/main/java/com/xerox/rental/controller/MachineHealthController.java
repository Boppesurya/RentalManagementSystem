package com.xerox.rental.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.xerox.rental.dto.MachineHealthRequest;
import com.xerox.rental.entity.MachineHealth;
import com.xerox.rental.service.MachineHealthService;
import com.xerox.rental.service.MachineService;

@RestController
@RequestMapping("/api/machine-health")
@CrossOrigin(origins = "*")
public class MachineHealthController {
	 @Autowired
	    private MachineHealthService machineHealthService;
	    
	    @Autowired
	    private MachineService machineService;
	    
	    @GetMapping
	    public ResponseEntity<List<MachineHealth>> getAllMachineHealth() {
	        return ResponseEntity.ok(machineHealthService.getAllMachineHealth());
	    }
	    
	    @GetMapping("/{id}")
	    public ResponseEntity<MachineHealth> getMachineHealthById(@PathVariable Long id) {
	        return machineHealthService.getMachineHealthById(id)
	                .map(ResponseEntity::ok)
	                .orElse(ResponseEntity.notFound().build());
	    }
	    
	    @GetMapping("/machine/{machineId}")
	    public ResponseEntity<MachineHealth> getMachineHealthByMachine(@PathVariable Long machineId) {
	        return machineHealthService.getMachineHealthByMachine(machineId)
	                .map(ResponseEntity::ok)
	                .orElse(ResponseEntity.notFound().build());
	    }
	    
	    @PostMapping("/machine/{machineId}")
	    public ResponseEntity<MachineHealth> updateMachineHealth(@PathVariable Long machineId, 
	                                                           @RequestBody MachineHealthRequest request) {
	        try {
	            // Convert request to entity
	            MachineHealth healthData = new MachineHealth();
	            healthData.setHealthScore(request.getHealthScore());
	            healthData.setTemperature(request.getTemperature());
	            healthData.setHumidity(request.getHumidity());
	            healthData.setTonerLevel(request.getTonerLevel());
	            healthData.setPaperLevel(request.getPaperLevel());
	            healthData.setErrorCount(request.getErrorCount());
	            healthData.setPagesPrintedToday(request.getPagesPrintedToday());
	            healthData.setAlerts(request.getAlerts());
	            healthData.setRecommendations(request.getRecommendations());
	            
	            MachineHealth updatedHealth = machineHealthService.updateMachineHealth(machineId, healthData);
	            return ResponseEntity.ok(updatedHealth);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }
	    
	    @GetMapping("/maintenance-needed")
	    public ResponseEntity<List<MachineHealth>> getMachinesNeedingMaintenance() {
	        return ResponseEntity.ok(machineHealthService.getMachinesNeedingMaintenance());
	    }
	    
	    @GetMapping("/low-supplies")
	    public ResponseEntity<List<MachineHealth>> getMachinesWithLowSupplies() {
	        return ResponseEntity.ok(machineHealthService.getMachinesWithLowSupplies());
	    }
}
