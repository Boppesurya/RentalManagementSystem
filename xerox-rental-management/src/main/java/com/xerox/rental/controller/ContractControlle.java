package com.xerox.rental.controller;

import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;

import com.xerox.rental.dto.ContractRequest;
import com.xerox.rental.entity.Contract;
import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.User;
import com.xerox.rental.service.ContractService;
import com.xerox.rental.service.MachineService;
import com.xerox.rental.service.UserService;

@RestController
@RequestMapping("/api/contracts")
@CrossOrigin(origins = "*")
public class ContractControlle {
    
	@Autowired
    private ContractService contractService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private MachineService machineService;
    
    @GetMapping
    public ResponseEntity<List<Contract>> getAllContracts() {
        return ResponseEntity.ok(contractService.getAllContracts());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Contract> getContractById(@PathVariable Long id) {
        return contractService.getContractById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Contract> createContract(@RequestBody ContractRequest request) {
        try {
            Contract contract = new Contract();
            contract.setStartDate(request.getStartDate());
            contract.setEndDate(request.getEndDate());
            contract.setMonthlyRent(request.getMonthlyRent());
            contract.setTerms(request.getTerms());
            
            // Set status
            if (request.getStatus() != null) {
                contract.setStatus(Contract.Status.valueOf(request.getStatus().toUpperCase()));
            }
            
            // Set owner
            Long ownerId = request.getOwnerId();
            if (ownerId != null) {
                Optional<User> owner = userService.getUserById(ownerId);
                if (owner.isPresent()) {
                    contract.setOwner(owner.get());
                } else {
                    return ResponseEntity.badRequest().build();
                }
            }
            
            // Set rental
            Long rentalId = request.getRentalId();
            if (rentalId != null) {
                Optional<User> rental = userService.getUserById(rentalId);
                if (rental.isPresent()) {
                    contract.setRental(rental.get());
                } else {
                    return ResponseEntity.badRequest().build();
                }
            }
            
            // Set machine
            Long machineId = request.getMachineId();
            if (machineId != null) {
                Optional<Machine> machine = machineService.getMachineById(machineId);
                if (machine.isPresent()) {
                    contract.setMachine(machine.get());
                } else {
                    return ResponseEntity.badRequest().build();
                }
            }
            
            Contract createdContract = contractService.createContract(contract);
            return ResponseEntity.ok(createdContract);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Contract> updateContract(@PathVariable Long id, @RequestBody ContractRequest request) {
        try {
            Optional<Contract> existingContract = contractService.getContractById(id);
            if (existingContract.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Contract contract = existingContract.get();
            contract.setStartDate(request.getStartDate());
            contract.setEndDate(request.getEndDate());
            contract.setMonthlyRent(request.getMonthlyRent());
            contract.setTerms(request.getTerms());
            
            // Set status
            if (request.getStatus() != null) {
                contract.setStatus(Contract.Status.valueOf(request.getStatus().toUpperCase()));
            }
            
            Contract updatedContract = contractService.updateContract(id, contract);
            return ResponseEntity.ok(updatedContract);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContract(@PathVariable Long id) {
        contractService.deleteContract(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Contract>> getContractsByOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(contractService.getContractsByOwner(ownerId));
    }
    
    @GetMapping("/rental/{rentalId}")
    public ResponseEntity<List<Contract>> getContractsByRental(@PathVariable Long rentalId) {
        return ResponseEntity.ok(contractService.getContractsByRental(rentalId));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Contract>> getContractsByStatus(@PathVariable Contract.Status status) {
        return ResponseEntity.ok(contractService.getContractsByStatus(status));
    }
}
