package com.xerox.rental.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.xerox.rental.entity.RentalRequest;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.RentalRequestRepository;
import com.xerox.rental.repository.UserRepository;

@Service
public class RentalRequestService {
	  @Autowired
	    private RentalRequestRepository rentalRequestRepository;
	    
	    @Autowired
	    private UserRepository userRepository;
	    
	    public List<RentalRequest> getAllRentalRequests() {
	        return rentalRequestRepository.findAll();
	    }
	    
	    public Optional<RentalRequest> getRentalRequestById(Long id) {
	        return rentalRequestRepository.findById(id);
	    }
	    
	    public RentalRequest createRentalRequest(RentalRequest rentalRequest) {
	        return rentalRequestRepository.save(rentalRequest);
	    }
	    
	    public RentalRequest updateRentalRequest(Long id, RentalRequest requestDetails) {
	        RentalRequest request = rentalRequestRepository.findById(id)
	                .orElseThrow(() -> new RuntimeException("Rental request not found"));
	        
	        if (requestDetails.getRental() != null) {
	            request.setRental(requestDetails.getRental());
	        }
	        if (requestDetails.getOwner() != null) {
	            request.setOwner(requestDetails.getOwner());
	        }
	        if (requestDetails.getMachine() != null) {
	            request.setMachine(requestDetails.getMachine());
	        }
	        if (requestDetails.getRequestDate() != null) {
	            request.setRequestDate(requestDetails.getRequestDate());
	        }
	        if (requestDetails.getStartDate() != null) {
	            request.setStartDate(requestDetails.getStartDate());
	        }
	        if (requestDetails.getEndDate() != null) {
	            request.setEndDate(requestDetails.getEndDate());
	        }
	        if (requestDetails.getMonthlyRent() != null) {
	            request.setMonthlyRent(requestDetails.getMonthlyRent());
	        }
	        if (requestDetails.getStatus() != null) {
	            request.setStatus(requestDetails.getStatus());
	        }
	        if (requestDetails.getMessage() != null) {
	            request.setMessage(requestDetails.getMessage());
	        }
	        
	        return rentalRequestRepository.save(request);
	    }
	    
	    public void deleteRentalRequest(Long id) {
	        rentalRequestRepository.deleteById(id);
	    }
	    
	    public List<RentalRequest> getRentalRequestsByOwner(Long ownerId) {
	        User owner = userRepository.findById(ownerId)
	                .orElseThrow(() -> new RuntimeException("Owner not found"));
	        return rentalRequestRepository.findByOwner(owner);
	    }
	    
	    public List<RentalRequest> getRentalRequestsByRental(Long rentalId) {
	        User rental = userRepository.findById(rentalId)
	                .orElseThrow(() -> new RuntimeException("Rental not found"));
	        return rentalRequestRepository.findByRental(rental);
	    }
	    
	    public List<RentalRequest> getRentalRequestsByStatus(RentalRequest.Status status) {
	        return rentalRequestRepository.findByStatus(status);
	    }
	    
	    public RentalRequest approveRequest(Long id) {
	        RentalRequest request = rentalRequestRepository.findById(id)
	                .orElseThrow(() -> new RuntimeException("Rental request not found"));
	        
	        request.setStatus(RentalRequest.Status.APPROVED);
	        return rentalRequestRepository.save(request);
	    }
	    
	    public RentalRequest rejectRequest(Long id) {
	        RentalRequest request = rentalRequestRepository.findById(id)
	                .orElseThrow(() -> new RuntimeException("Rental request not found"));
	        
	        request.setStatus(RentalRequest.Status.REJECTED);
	        return rentalRequestRepository.save(request);
	    }
}
