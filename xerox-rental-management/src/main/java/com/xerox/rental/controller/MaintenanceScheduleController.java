package com.xerox.rental.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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

import com.xerox.rental.dto.MaintenanceScheduleRequest;
import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.MaintenanceSchedule;
import com.xerox.rental.entity.User;
import com.xerox.rental.service.MachineService;
import com.xerox.rental.service.MaintenanceScheduleService;
import com.xerox.rental.service.UserService;

@RestController
@RequestMapping("/api/maintenance-schedules")
@CrossOrigin(origins = "*")
public class MaintenanceScheduleController {
	 @Autowired
	    private MaintenanceScheduleService maintenanceScheduleService;
	    
	    @Autowired
	    private MachineService machineService;
	    
	    @Autowired
	    private UserService userService;
	    
	    @GetMapping
	    public ResponseEntity<List<MaintenanceSchedule>> getAllMaintenanceSchedules() {
	        return ResponseEntity.ok(maintenanceScheduleService.getAllMaintenanceSchedules());
	    }
	    
	    @GetMapping("/{id}")
	    public ResponseEntity<MaintenanceSchedule> getMaintenanceScheduleById(@PathVariable Long id) {
	        return maintenanceScheduleService.getMaintenanceScheduleById(id)
	                .map(ResponseEntity::ok)
	                .orElse(ResponseEntity.notFound().build());
	    }
	    
	    @GetMapping("/machine/{machineId}")
	    public ResponseEntity<List<MaintenanceSchedule>> getMaintenanceSchedulesByMachine(@PathVariable Long machineId) {
	        return ResponseEntity.ok(maintenanceScheduleService.getMaintenanceSchedulesByMachine(machineId));
	    }
	    
	    @GetMapping("/technician/{technicianId}")
	    public ResponseEntity<List<MaintenanceSchedule>> getMaintenanceSchedulesByTechnician(@PathVariable Long technicianId) {
	        return ResponseEntity.ok(maintenanceScheduleService.getMaintenanceSchedulesByTechnician(technicianId));
	    }
	    
	    @PostMapping
	    public ResponseEntity<MaintenanceSchedule> createMaintenanceSchedule(@RequestBody MaintenanceScheduleRequest request) {
	        try {
	            MaintenanceSchedule schedule = new MaintenanceSchedule();
	            schedule.setMaintenanceType(request.getMaintenanceType());
	            schedule.setScheduledDate(request.getScheduledDate());
	            schedule.setDescription(request.getDescription());
	            schedule.setEstimatedDuration(request.getEstimatedDuration());
	            
	            // Set machine
	            Long machineId = request.getMachineId();
	            if (machineId != null) {
	                Optional<Machine> machine = machineService.getMachineById(machineId);
	                if (machine.isPresent()) {
	                    schedule.setMachine(machine.get());
	                } else {
	                    return ResponseEntity.badRequest().build();
	                }
	            }
	            
	            // Set technician if provided
	            Long technicianId = request.getTechnicianId();
	            if (technicianId != null) {
	                Optional<User> technician = userService.getUserById(technicianId);
	                if (technician.isPresent()) {
	                    schedule.setTechnician(technician.get());
	                }
	            }
	            
	            MaintenanceSchedule createdSchedule = maintenanceScheduleService.createMaintenanceSchedule(schedule);
	            return ResponseEntity.ok(createdSchedule);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }
	    
	    @PutMapping("/{id}")
	    public ResponseEntity<MaintenanceSchedule> updateMaintenanceSchedule(@PathVariable Long id, 
	                                                                        @RequestBody MaintenanceScheduleRequest request) {
	        try {
	            MaintenanceSchedule schedule = new MaintenanceSchedule();
	            schedule.setMaintenanceType(request.getMaintenanceType());
	            schedule.setScheduledDate(request.getScheduledDate());
	            schedule.setCompletedDate(request.getCompletedDate());
	            schedule.setDescription(request.getDescription());
	            schedule.setNotes(request.getNotes());
	            schedule.setEstimatedDuration(request.getEstimatedDuration());
	            schedule.setActualDuration(request.getActualDuration());
	            schedule.setCost(request.getCost());
	            
	            // Set status
	            if (request.getStatus() != null) {
	                schedule.setStatus(MaintenanceSchedule.MaintenanceStatus.valueOf(request.getStatus().toUpperCase().replace("-", "_")));
	            }
	            
	            // Set technician if provided
	            Long technicianId = request.getTechnicianId();
	            if (technicianId != null) {
	                Optional<User> technician = userService.getUserById(technicianId);
	                if (technician.isPresent()) {
	                    schedule.setTechnician(technician.get());
	                }
	            }
	            
	            MaintenanceSchedule updatedSchedule = maintenanceScheduleService.updateMaintenanceSchedule(id, schedule);
	            return ResponseEntity.ok(updatedSchedule);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.notFound().build();
	        }
	    }
	    
	    @DeleteMapping("/{id}")
	    public ResponseEntity<Void> deleteMaintenanceSchedule(@PathVariable Long id) {
	        maintenanceScheduleService.deleteMaintenanceSchedule(id);
	        return ResponseEntity.ok().build();
	    }
	    
	    @GetMapping("/upcoming")
	    public ResponseEntity<List<MaintenanceSchedule>> getUpcomingMaintenance(@RequestParam(defaultValue = "7") int days) {
	        return ResponseEntity.ok(maintenanceScheduleService.getUpcomingMaintenance(days));
	    }
	    
	    @GetMapping("/overdue")
	    public ResponseEntity<List<MaintenanceSchedule>> getOverdueMaintenance() {
	        return ResponseEntity.ok(maintenanceScheduleService.getOverdueMaintenance());
	    }
	    
	    @PutMapping("/{scheduleId}/assign/{technicianId}")
	    public ResponseEntity<MaintenanceSchedule> assignTechnician(@PathVariable Long scheduleId, 
	                                                              @PathVariable Long technicianId) {
	        try {
	            MaintenanceSchedule schedule = maintenanceScheduleService.assignTechnician(scheduleId, technicianId);
	            return ResponseEntity.ok(schedule);
	        } catch (RuntimeException e) {
	            return ResponseEntity.notFound().build();
	        }
	    }
	    
	    @PutMapping("/{id}/start")
	    public ResponseEntity<MaintenanceSchedule> startMaintenance(@PathVariable Long id) {
	        try {
	            MaintenanceSchedule schedule = maintenanceScheduleService.startMaintenance(id);
	            return ResponseEntity.ok(schedule);
	        } catch (RuntimeException e) {
	            return ResponseEntity.notFound().build();
	        }
	    }
	    
	    @PutMapping("/{id}/complete")
	    public ResponseEntity<MaintenanceSchedule> completeMaintenance(@PathVariable Long id, 
	                                                                 @RequestBody Map<String, Object> request) {
	        try {
	            String notes = request.get("notes").toString();
	            Double cost = Double.valueOf(request.get("cost").toString());
	            
	            MaintenanceSchedule schedule = maintenanceScheduleService.completeMaintenance(id, notes, cost);
	            return ResponseEntity.ok(schedule);
	        } catch (RuntimeException e) {
	            return ResponseEntity.notFound().build();
	        }
	    }
}
