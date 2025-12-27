package com.xerox.rental.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.Subscription;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.MachineRepository;
import com.xerox.rental.repository.UserRepository;

@Service
public class MachineService {
    
    @Autowired
    private MachineRepository machineRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SubscriptionService subscriptionService;
    
    public List<Machine> getAllMachines() {
        return machineRepository.findAllWithRelations();
    }
    
    public Optional<Machine> getMachineById(Long id) {
        return machineRepository.findById(id);
    }
    
    public Machine createMachine(Machine machine) {

        // ------------------------------
        // 🔥 MACHINE LIMIT CHECK ADDED
        // ------------------------------
        User owner = machine.getOwner();
        if (owner == null || owner.getId() == null) {
            throw new RuntimeException("Owner is required for machine creation");
        }

        // 1. Get active subscription
        Optional<Subscription> subscriptionOpt =
                subscriptionService.getActiveSubscriptionByUser(owner.getId());

        if (subscriptionOpt.isEmpty()) {
            throw new RuntimeException("No active subscription found for this owner");
        }

        Subscription subscription = subscriptionOpt.get();

        // 2. Count current machines
        int currentCount = machineRepository.countByOwnerId(owner.getId());
        Integer limit = subscription.getMachineLimit();

        // 3. Compare
        if (limit != null && currentCount >= limit) {
            throw new RuntimeException(
                "Machine limit exceeded! Allowed: " + limit + ", Current: " + currentCount
            );
        }

        // ------------------------------------
        // Everything OK → save machine
        // ------------------------------------
        return machineRepository.save(machine);
    }
    
    public Machine updateMachine(Long id, Machine machineDetails) {
        Machine machine = machineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Machine not found"));
        
        if (machineDetails.getName() != null) {
            machine.setName(machineDetails.getName());
        }
        if (machineDetails.getModel() != null) {
            machine.setModel(machineDetails.getModel());
        }
        if (machineDetails.getSerialNumber() != null) {
            machine.setSerialNumber(machineDetails.getSerialNumber());
        }
        if (machineDetails.getLocation() != null) {
            machine.setLocation(machineDetails.getLocation());
        }
        if (machineDetails.getUsage() != null) {
            machine.setUsage(machineDetails.getUsage());
        }
        if (machineDetails.getStatus() != null) {
            machine.setStatus(machineDetails.getStatus());
        }
        if (machineDetails.getMonthlyRent() != null) {
            machine.setMonthlyRent(machineDetails.getMonthlyRent());
        }
        if (machineDetails.getInstallationDate() != null) {
            machine.setInstallationDate(machineDetails.getInstallationDate());
        }
        if (machineDetails.getLastServiceDate() != null) {
            machine.setLastServiceDate(machineDetails.getLastServiceDate());
        }
        if (machineDetails.getOwner() != null) {
            machine.setOwner(machineDetails.getOwner());
        }
        if (machineDetails.getRental() != null) {
            machine.setRental(machineDetails.getRental());
        }
        
        return machineRepository.save(machine);
    }
    
    public void deleteMachine(Long id) {
        machineRepository.deleteById(id);
    }
    
    public List<Machine> getMachinesByOwner(Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        return machineRepository.findByOwner(owner);
    }
    
    public List<Machine> getMachinesByRental(Long rentalId) {
        User rental = userRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Rental not found"));
        return machineRepository.findByRental(rental);
    }
    
    public List<Machine> getMachinesByStatus(Machine.Status status) {
        return machineRepository.findByStatus(status);
    }
}