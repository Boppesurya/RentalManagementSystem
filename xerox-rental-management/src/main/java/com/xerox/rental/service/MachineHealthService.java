package com.xerox.rental.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.MachineHealth;
import com.xerox.rental.repository.MachineHealthRepository;
import com.xerox.rental.repository.MachineRepository;

@Service
public class MachineHealthService {
	 @Autowired
	    private MachineHealthRepository machineHealthRepository;
	    
	    @Autowired
	    private MachineRepository machineRepository;
	    
	    @Autowired
	    private NotificationService notificationService;
	    
	    public List<MachineHealth> getAllMachineHealth() {
	        return machineHealthRepository.findAll();
	    }
	    
	    public Optional<MachineHealth> getMachineHealthById(Long id) {
	        return machineHealthRepository.findById(id);
	    }
	    
	    public Optional<MachineHealth> getMachineHealthByMachine(Long machineId) {
	        Optional<Machine> machine = machineRepository.findById(machineId);
	        if (machine.isPresent()) {
	            return machineHealthRepository.findByMachine(machine.get());
	        }
	        return Optional.empty();
	    }
	    
	    public MachineHealth updateMachineHealth(Long machineId, MachineHealth healthData) {
	        Optional<Machine> machine = machineRepository.findById(machineId);
	        if (machine.isEmpty()) {
	            throw new RuntimeException("Machine not found");
	        }
	        
	        Optional<MachineHealth> existingHealth = machineHealthRepository.findByMachine(machine.get());
	        MachineHealth machineHealth;
	        
	        if (existingHealth.isPresent()) {
	            machineHealth = existingHealth.get();
	        } else {
	            machineHealth = new MachineHealth();
	            machineHealth.setMachine(machine.get());
	        }
	        
	        // Update health data
	        machineHealth.setHealthScore(healthData.getHealthScore());
	        machineHealth.setTemperature(healthData.getTemperature());
	        machineHealth.setHumidity(healthData.getHumidity());
	        machineHealth.setTonerLevel(healthData.getTonerLevel());
	        machineHealth.setPaperLevel(healthData.getPaperLevel());
	        machineHealth.setErrorCount(healthData.getErrorCount());
	        machineHealth.setPagesPrintedToday(healthData.getPagesPrintedToday());
	        
	        // Calculate health status
	        MachineHealth.HealthStatus status = calculateHealthStatus(machineHealth);
	        machineHealth.setStatus(status);
	        
	        // Generate alerts and recommendations
	        generateAlertsAndRecommendations(machineHealth);
	        
	        MachineHealth savedHealth = machineHealthRepository.save(machineHealth);
	        
	        // Send notifications for critical issues
	        if (status == MachineHealth.HealthStatus.CRITICAL || status == MachineHealth.HealthStatus.WARNING) {
	            notificationService.sendMachineHealthAlert(machine.get(), savedHealth);
	        }
	        
	        return savedHealth;
	    }
	    
	    public List<MachineHealth> getMachinesNeedingMaintenance() {
	        return machineHealthRepository.findMachinesNeedingMaintenance(LocalDateTime.now().plusDays(7));
	    }
	    
	    public List<MachineHealth> getMachinesWithLowSupplies() {
	        List<MachineHealth> lowToner = machineHealthRepository.findMachinesWithLowToner(20);
	        List<MachineHealth> lowPaper = machineHealthRepository.findMachinesWithLowPaper(20);
	        
	        lowToner.addAll(lowPaper);
	        return lowToner.stream().distinct().toList();
	    }
	    
	    private MachineHealth.HealthStatus calculateHealthStatus(MachineHealth health) {
	        double score = health.getHealthScore();
	        
	        if (score >= 90) return MachineHealth.HealthStatus.EXCELLENT;
	        if (score >= 75) return MachineHealth.HealthStatus.GOOD;
	        if (score >= 50) return MachineHealth.HealthStatus.WARNING;
	        if (score >= 25) return MachineHealth.HealthStatus.CRITICAL;
	        return MachineHealth.HealthStatus.OFFLINE;
	    }
	    
	    private void generateAlertsAndRecommendations(MachineHealth health) {
	        StringBuilder alerts = new StringBuilder();
	        StringBuilder recommendations = new StringBuilder();
	        
	        // Check toner level
	        if (health.getTonerLevel() != null && health.getTonerLevel() <= 10) {
	            alerts.append("Critical: Toner level very low (").append(health.getTonerLevel()).append("%); ");
	            recommendations.append("Replace toner cartridge immediately; ");
	        } else if (health.getTonerLevel() != null && health.getTonerLevel() <= 25) {
	            alerts.append("Warning: Toner level low (").append(health.getTonerLevel()).append("%); ");
	            recommendations.append("Order replacement toner cartridge; ");
	        }
	        
	        // Check paper level
	        if (health.getPaperLevel() != null && health.getPaperLevel() <= 10) {
	            alerts.append("Critical: Paper level very low (").append(health.getPaperLevel()).append("%); ");
	            recommendations.append("Refill paper tray immediately; ");
	        }
	        
	        // Check temperature
	        if (health.getTemperature() != null && health.getTemperature() > 40) {
	            alerts.append("Warning: High operating temperature (").append(health.getTemperature()).append("°C); ");
	            recommendations.append("Check ventilation and cooling system; ");
	        }
	        
	        // Check error count
	        if (health.getErrorCount() != null && health.getErrorCount() > 5) {
	            alerts.append("Warning: High error count (").append(health.getErrorCount()).append("); ");
	            recommendations.append("Schedule diagnostic check; ");
	        }
	        
	        health.setAlerts(alerts.toString());
	        health.setRecommendations(recommendations.toString());
	    }
}
