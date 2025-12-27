package com.xerox.rental.controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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

import com.xerox.rental.dto.MachineRequest;
import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.User;
import com.xerox.rental.service.AuditLogService;
import com.xerox.rental.service.MachineService;
import com.xerox.rental.service.UserService;

@RestController
@RequestMapping("/api/machines")
@CrossOrigin(origins = "*")
public class MachineController {
	 @Autowired
	    private MachineService machineService;
	    
	    @Autowired
	    private UserService userService;
	    
	    @Autowired
	    private AuditLogService auditLogService;
	    
	    @GetMapping
	    public ResponseEntity<List<Machine>> getAllMachines(@RequestParam(required = false) String currentUserId,
	                                                       @RequestParam(required = false) String currentUserRole) {
	        try {
	            List<Machine> machines = machineService.getAllMachines();
	            
	            // Apply role-based filtering
	            if (("OWNER".equals(currentUserRole) || "owner".equals(currentUserRole)) && currentUserId != null) {
	                Long ownerId = Long.parseLong(currentUserId);
	                machines = machines.stream()
	                    .filter(m -> m.getOwner() != null && m.getOwner().getId().equals(ownerId))
	                    .collect(Collectors.toList());
	            } else if (("TECHNICIAN".equals(currentUserRole) || "technician".equals(currentUserRole)) && currentUserId != null) {
	                // Technician can see machines from their assigned owner
	                Long technicianId = Long.parseLong(currentUserId);
	                Optional<User> technician = userService.getUserById(technicianId);
	                
	                if (technician.isPresent() && technician.get().getOwner() != null) {
	                    Long ownerId = technician.get().getOwner().getId();
	                    machines = machines.stream()
	                        .filter(m -> m.getOwner() != null && m.getOwner().getId().equals(ownerId))
	                        .collect(Collectors.toList());
	                }
	            } else if (("RENTAL".equals(currentUserRole) || "rental".equals(currentUserRole)) && currentUserId != null) {
	                Long rentalId = Long.parseLong(currentUserId);
	                machines = machines.stream()
	                    .filter(m -> m.getRental() != null && m.getRental().getId().equals(rentalId))
	                    .collect(Collectors.toList());
	            }
	            
	            return ResponseEntity.ok(machines);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }
	    
	    @GetMapping("/{id}")
	    public ResponseEntity<Machine> getMachineById(@PathVariable Long id) {
	        return machineService.getMachineById(id)
	                .map(ResponseEntity::ok)
	                .orElse(ResponseEntity.notFound().build());
	    }
	    
	    @PostMapping
	    public ResponseEntity<Machine> createMachine(@RequestBody MachineRequest request) {
	        try {
	            Machine machine = new Machine();
	            machine.setName(request.getName());
	            machine.setModel(request.getModel());
	            machine.setSerialNumber(request.getSerialNumber());
	            machine.setLocation(request.getLocation());
	            machine.setUsage(request.getUsage() != null ? request.getUsage() : 0L);
	            machine.setMonthlyRent(request.getMonthlyRent());
	            machine.setInstallationDate(request.getInstallationDate());
	            machine.setLastServiceDate(request.getLastServiceDate());
	            
	            // Set status
	            if (request.getStatus() != null) {
	                machine.setStatus(Machine.Status.valueOf(request.getStatus().toUpperCase()));
	            }
	            
	            // Set owner
	            Long ownerId = request.getOwnerId();
	            if (ownerId != null) {
	                Optional<User> owner = userService.getUserById(ownerId);
	                if (owner.isPresent()) {
	                    machine.setOwner(owner.get());
	                } else {
	                    return ResponseEntity.badRequest().build();
	                }
	            }
	            
	            // Set rental if provided
	            Long rentalId = request.getRentalId();
	            if (rentalId != null) {
	                Optional<User> rental = userService.getUserById(rentalId);
	                if (rental.isPresent()) {
	                    machine.setRental(rental.get());
	                }
	            }
	            
	            Machine createdMachine = machineService.createMachine(machine);
	            
	            // Log machine creation
	            try {
	                auditLogService.logEntityCreation(
	                    createdMachine.getOwner(),
	                    "Machine",
	                    createdMachine.getId().toString(),
	                    "Created machine: " + createdMachine.getName() + " (" + createdMachine.getModel() + ")"
	                );
	            } catch (Exception e) {
	                System.err.println("Error logging machine creation: " + e.getMessage());
	            }
	            
	            return ResponseEntity.ok(createdMachine);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }
	    
	    @PutMapping("/{id}")
	    public ResponseEntity<Machine> updateMachine(@PathVariable Long id, @RequestBody MachineRequest request) {
	        try {
	            Optional<Machine> existingMachine = machineService.getMachineById(id);
	            if (existingMachine.isEmpty()) {
	                return ResponseEntity.notFound().build();
	            }
	            
	            Machine machine = existingMachine.get();
	            machine.setName(request.getName());
	            machine.setModel(request.getModel());
	            machine.setSerialNumber(request.getSerialNumber());
	            machine.setLocation(request.getLocation());
	            if (request.getUsage() != null) {
	                machine.setUsage(request.getUsage());
	            }
	            machine.setMonthlyRent(request.getMonthlyRent());
	            machine.setInstallationDate(request.getInstallationDate());
	            machine.setLastServiceDate(request.getLastServiceDate());
	            
	            // Set status
	            if (request.getStatus() != null) {
	                machine.setStatus(Machine.Status.valueOf(request.getStatus()));
	            }
	            
	            // Set owner
	            Long ownerId = request.getOwnerId();
	            if (ownerId != null) {
	                Optional<User> owner = userService.getUserById(ownerId);
	                if (owner.isPresent()) {
	                    machine.setOwner(owner.get());
	                }
	            }
	            
	            // Set rental if provided
	            Long rentalId = request.getRentalId();
	            if (rentalId != null) {
	                Optional<User> rental = userService.getUserById(rentalId);
	                if (rental.isPresent()) {
	                    machine.setRental(rental.get());
	                }
	            }
	            
	            Machine updatedMachine = machineService.updateMachine(id, machine);
	            return ResponseEntity.ok(updatedMachine);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }
	    
	    @DeleteMapping("/{id}")
	    public ResponseEntity<Void> deleteMachine(@PathVariable Long id) {
	        machineService.deleteMachine(id);
	        return ResponseEntity.ok().build();
	    }
	    
	    @GetMapping("/owner/{ownerId}")
	    public ResponseEntity<List<Machine>> getMachinesByOwner(@PathVariable Long ownerId) {
	        return ResponseEntity.ok(machineService.getMachinesByOwner(ownerId));
	    }
	    
	    @GetMapping("/rental/{rentalId}")
	    public ResponseEntity<List<Machine>> getMachinesByRental(@PathVariable Long rentalId) {
	        return ResponseEntity.ok(machineService.getMachinesByRental(rentalId));
	    }
}
