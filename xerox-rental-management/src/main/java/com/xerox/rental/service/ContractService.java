package com.xerox.rental.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.xerox.rental.entity.Contract;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.ContractRepository;
import com.xerox.rental.repository.UserRepository;

@Service
public class ContractService {
	 @Autowired
	    private ContractRepository contractRepository;
	    
	    @Autowired
	    private UserRepository userRepository;
	    
	    public List<Contract> getAllContracts() {
	        return contractRepository.findAll();
	    }
	    
	    public Optional<Contract> getContractById(Long id) {
	        return contractRepository.findById(id);
	    }
	    
	    public Contract createContract(Contract contract) {
	        return contractRepository.save(contract);
	    }
	    
	    public Contract updateContract(Long id, Contract contractDetails) {
	        Contract contract = contractRepository.findById(id)
	                .orElseThrow(() -> new RuntimeException("Contract not found"));
	        
	        if (contractDetails.getOwner() != null) {
	            contract.setOwner(contractDetails.getOwner());
	        }
	        if (contractDetails.getRental() != null) {
	            contract.setRental(contractDetails.getRental());
	        }
	        if (contractDetails.getMachine() != null) {
	            contract.setMachine(contractDetails.getMachine());
	        }
	        if (contractDetails.getStartDate() != null) {
	            contract.setStartDate(contractDetails.getStartDate());
	        }
	        if (contractDetails.getEndDate() != null) {
	            contract.setEndDate(contractDetails.getEndDate());
	        }
	        if (contractDetails.getMonthlyRent() != null) {
	            contract.setMonthlyRent(contractDetails.getMonthlyRent());
	        }
	        if (contractDetails.getTerms() != null) {
	            contract.setTerms(contractDetails.getTerms());
	        }
	        if (contractDetails.getStatus() != null) {
	            contract.setStatus(contractDetails.getStatus());
	        }
	        
	        return contractRepository.save(contract);
	    }
	    
	    public void deleteContract(Long id) {
	        contractRepository.deleteById(id);
	    }
	    
	    public List<Contract> getContractsByOwner(Long ownerId) {
	        User owner = userRepository.findById(ownerId)
	                .orElseThrow(() -> new RuntimeException("Owner not found"));
	        return contractRepository.findByOwner(owner);
	    }
	    
	    public List<Contract> getContractsByRental(Long rentalId) {
	        User rental = userRepository.findById(rentalId)
	                .orElseThrow(() -> new RuntimeException("Rental not found"));
	        return contractRepository.findByRental(rental);
	    }
	    
	    public List<Contract> getContractsByStatus(Contract.Status status) {
	        return contractRepository.findByStatus(status);
	    }
}
