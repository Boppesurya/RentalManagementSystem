package com.xerox.rental.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.MaintenanceSchedule;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.MachineRepository;
import com.xerox.rental.repository.MaintenanceScheduleRepository;
import com.xerox.rental.repository.UserRepository;

@Service
public class MaintenanceScheduleService {
	 @Autowired
	    private MaintenanceScheduleRepository maintenanceScheduleRepository;
	    
	    @Autowired
	    private MachineRepository machineRepository;
	    
	    @Autowired
	    private UserRepository userRepository;
	    
	    @Autowired
	    private NotificationService notificationService;
	    
	    public List<MaintenanceSchedule> getAllMaintenanceSchedules() {
	        return maintenanceScheduleRepository.findAll();
	    }
	    
	    public Optional<MaintenanceSchedule> getMaintenanceScheduleById(Long id) {
	        return maintenanceScheduleRepository.findById(id);
	    }
	    
	    public List<MaintenanceSchedule> getMaintenanceSchedulesByMachine(Long machineId) {
	        Optional<Machine> machine = machineRepository.findById(machineId);
	        if (machine.isPresent()) {
	            return maintenanceScheduleRepository.findByMachine(machine.get());
	        }
	        return List.of();
	    }
	    
	    public List<MaintenanceSchedule> getMaintenanceSchedulesByTechnician(Long technicianId) {
	        Optional<User> technician = userRepository.findById(technicianId);
	        if (technician.isPresent()) {
	            return maintenanceScheduleRepository.findByTechnician(technician.get());
	        }
	        return List.of();
	    }
	    
	    public MaintenanceSchedule createMaintenanceSchedule(MaintenanceSchedule schedule) {
	        // Validate machine exists
	        if (schedule.getMachine() == null || schedule.getMachine().getId() == null) {
	            throw new RuntimeException("Machine is required");
	        }
	        
	        Optional<Machine> machine = machineRepository.findById(schedule.getMachine().getId());
	        if (machine.isEmpty()) {
	            throw new RuntimeException("Machine not found");
	        }
	        
	        schedule.setMachine(machine.get());
	        
	        // Validate technician if provided
	        if (schedule.getTechnician() != null && schedule.getTechnician().getId() != null) {
	            Optional<User> technician = userRepository.findById(schedule.getTechnician().getId());
	            if (technician.isEmpty()) {
	                throw new RuntimeException("Technician not found");
	            }
	            schedule.setTechnician(technician.get());
	        }
	        
	        MaintenanceSchedule savedSchedule = maintenanceScheduleRepository.save(schedule);
	        
	        // Send notification to machine owner
	        notificationService.sendMaintenanceReminder(machine.get(), schedule.getScheduledDate());
	        
	        return savedSchedule;
	    }
	    
	    public MaintenanceSchedule updateMaintenanceSchedule(Long id, MaintenanceSchedule scheduleDetails) {
	        MaintenanceSchedule schedule = maintenanceScheduleRepository.findById(id)
	                .orElseThrow(() -> new RuntimeException("Maintenance schedule not found"));
	        
	        schedule.setMaintenanceType(scheduleDetails.getMaintenanceType());
	        schedule.setScheduledDate(scheduleDetails.getScheduledDate());
	        schedule.setStatus(scheduleDetails.getStatus());
	        schedule.setDescription(scheduleDetails.getDescription());
	        schedule.setNotes(scheduleDetails.getNotes());
	        schedule.setEstimatedDuration(scheduleDetails.getEstimatedDuration());
	        schedule.setActualDuration(scheduleDetails.getActualDuration());
	        schedule.setCost(scheduleDetails.getCost());
	        
	        if (scheduleDetails.getTechnician() != null) {
	            schedule.setTechnician(scheduleDetails.getTechnician());
	        }
	        
	        if (scheduleDetails.getStatus() == MaintenanceSchedule.MaintenanceStatus.COMPLETED) {
	            schedule.setCompletedDate(LocalDateTime.now());
	        }
	        
	        return maintenanceScheduleRepository.save(schedule);
	    }
	    
	    public void deleteMaintenanceSchedule(Long id) {
	        maintenanceScheduleRepository.deleteById(id);
	    }
	    
	    public List<MaintenanceSchedule> getUpcomingMaintenance(int days) {
	        LocalDateTime startDate = LocalDateTime.now();
	        LocalDateTime endDate = startDate.plusDays(days);
	        return maintenanceScheduleRepository.findByScheduledDateBetween(startDate, endDate);
	    }
	    
	    public List<MaintenanceSchedule> getOverdueMaintenance() {
	        return maintenanceScheduleRepository.findOverdueMaintenance(LocalDateTime.now());
	    }
	    
	    public MaintenanceSchedule assignTechnician(Long scheduleId, Long technicianId) {
	        MaintenanceSchedule schedule = maintenanceScheduleRepository.findById(scheduleId)
	                .orElseThrow(() -> new RuntimeException("Maintenance schedule not found"));
	        
	        User technician = userRepository.findById(technicianId)
	                .orElseThrow(() -> new RuntimeException("Technician not found"));
	        
	        schedule.setTechnician(technician);
	        schedule.setStatus(MaintenanceSchedule.MaintenanceStatus.SCHEDULED);
	        
	        return maintenanceScheduleRepository.save(schedule);
	    }
	    
	    public MaintenanceSchedule startMaintenance(Long scheduleId) {
	        MaintenanceSchedule schedule = maintenanceScheduleRepository.findById(scheduleId)
	                .orElseThrow(() -> new RuntimeException("Maintenance schedule not found"));
	        
	        schedule.setStatus(MaintenanceSchedule.MaintenanceStatus.IN_PROGRESS);
	        return maintenanceScheduleRepository.save(schedule);
	    }
	    
	    public MaintenanceSchedule completeMaintenance(Long scheduleId, String notes, Double cost) {
	        MaintenanceSchedule schedule = maintenanceScheduleRepository.findById(scheduleId)
	                .orElseThrow(() -> new RuntimeException("Maintenance schedule not found"));
	        
	        schedule.setStatus(MaintenanceSchedule.MaintenanceStatus.COMPLETED);
	        schedule.setCompletedDate(LocalDateTime.now());
	        schedule.setNotes(notes);
	        schedule.setCost(cost);
	        
	        // Calculate actual duration
	        if (schedule.getStatus() == MaintenanceSchedule.MaintenanceStatus.IN_PROGRESS) {
	            // This would need to be tracked when maintenance starts
	            // For now, we'll use estimated duration
	            schedule.setActualDuration(schedule.getEstimatedDuration());
	        }
	        
	        return maintenanceScheduleRepository.save(schedule);
	    }
}
