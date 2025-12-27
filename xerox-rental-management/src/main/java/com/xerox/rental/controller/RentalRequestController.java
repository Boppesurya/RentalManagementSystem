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

import com.xerox.rental.dto.RentalRequestDto;
import com.xerox.rental.dto.RentalRequestResponse;
import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.RentalRequest;
import com.xerox.rental.entity.User;
import com.xerox.rental.service.MachineService;
import com.xerox.rental.service.NotificationService;
import com.xerox.rental.service.RentalRequestService;
import com.xerox.rental.service.UserService;

@RestController
@RequestMapping("/api/rental-requests")
@CrossOrigin(origins = "*")
public class RentalRequestController {
	  @Autowired
	    private RentalRequestService rentalRequestService;
	    
	    @Autowired
	    private NotificationService notificationService;
	    
	    @Autowired
	    private UserService userService;
	    
	    @Autowired
	    private MachineService machineService;
	    
	    @GetMapping
	    public ResponseEntity<List<RentalRequestResponse>> getAllRentalRequests(
	            @RequestParam(required = false) String currentUserId,
	            @RequestParam(required = false) String currentUserRole) {
	        List<RentalRequest> requests = rentalRequestService.getAllRentalRequests();

	        // Apply role-based filtering
	        if (("OWNER".equals(currentUserRole) || "owner".equals(currentUserRole)) && currentUserId != null) {
	            Long ownerId = Long.parseLong(currentUserId);
	            requests = requests.stream()
	                .filter(r -> r.getOwner() != null && r.getOwner().getId().equals(ownerId))
	                .collect(Collectors.toList());
	        } else if (("TECHNICIAN".equals(currentUserRole) || "technician".equals(currentUserRole)) && currentUserId != null) {
	            // Technician can see rental requests from their assigned owner
	            Long technicianId = Long.parseLong(currentUserId);
	            Optional<User> technician = userService.getUserById(technicianId);

	            if (technician.isPresent() && technician.get().getOwner() != null) {
	                Long ownerId = technician.get().getOwner().getId();
	                requests = requests.stream()
	                    .filter(r -> r.getOwner() != null && r.getOwner().getId().equals(ownerId))
	                    .collect(Collectors.toList());
	            } else {
	                requests = List.of();
	            }
	        } else if (("RENTAL".equals(currentUserRole) || "rental".equals(currentUserRole)) && currentUserId != null) {
	            Long rentalId = Long.parseLong(currentUserId);
	            requests = requests.stream()
	                .filter(r -> r.getRental() != null && r.getRental().getId().equals(rentalId))
	                .collect(Collectors.toList());
	        }

	        List<RentalRequestResponse> responses = requests.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }
	    
	    @GetMapping("/{id}")
	    public ResponseEntity<RentalRequestResponse> getRentalRequestById(@PathVariable Long id) {
	        return rentalRequestService.getRentalRequestById(id)
	                .map(this::convertToResponse)
	                .map(ResponseEntity::ok)
	                .orElse(ResponseEntity.notFound().build());
	    }
	    
	    @PostMapping
	    public ResponseEntity<RentalRequestResponse> createRentalRequest(@RequestBody RentalRequestDto request) {
	        try {
	            RentalRequest rentalRequest = new RentalRequest();
	            rentalRequest.setRequestDate(request.getRequestDate());
	            rentalRequest.setStartDate(request.getStartDate());
	            rentalRequest.setEndDate(request.getEndDate());
	            rentalRequest.setMonthlyRent(request.getMonthlyRent());
	            rentalRequest.setMessage(request.getMessage());

	            // Set status
	            if (request.getStatus() != null) {
	                rentalRequest.setStatus(RentalRequest.Status.valueOf(request.getStatus()));
	            }

	            // Set rental user
	            Long rentalId = request.getRentalId();
	            if (rentalId != null) {
	                Optional<User> rental = userService.getUserById(rentalId);
	                if (rental.isPresent()) {
	                    rentalRequest.setRental(rental.get());
	                } else {
	                    return ResponseEntity.badRequest().build();
	                }
	            }

	            // Set owner
	            Long ownerId = request.getOwnerId();
	            if (ownerId != null) {
	                Optional<User> owner = userService.getUserById(ownerId);
	                if (owner.isPresent()) {
	                    rentalRequest.setOwner(owner.get());
	                } else {
	                    return ResponseEntity.badRequest().build();
	                }
	            }

	            // Set machine
	            Long machineId = request.getMachineId();
	            if (machineId != null) {
	                Optional<Machine> machine = machineService.getMachineById(machineId);
	                if (machine.isPresent()) {
	                    rentalRequest.setMachine(machine.get());
	                } else {
	                    return ResponseEntity.badRequest().build();
	                }
	            }

	            RentalRequest createdRequest = rentalRequestService.createRentalRequest(rentalRequest);

	            // Send notification to owner
	            try {
	                notificationService.sendRentalRequestNotification(
	                    createdRequest.getOwner(),
	                    createdRequest.getRental().getName(),
	                    createdRequest.getMachine().getName()
	                );
	            } catch (Exception e) {
	                System.err.println("Error sending rental request notification: " + e.getMessage());
	            }

	            return ResponseEntity.ok(convertToResponse(createdRequest));
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }
	    
	    @PutMapping("/{id}")
	    public ResponseEntity<RentalRequestResponse> updateRentalRequest(@PathVariable Long id, @RequestBody RentalRequestDto request) {
	        try {
	            Optional<RentalRequest> existingRequest = rentalRequestService.getRentalRequestById(id);
	            if (existingRequest.isEmpty()) {
	                return ResponseEntity.notFound().build();
	            }

	            RentalRequest rentalRequest = existingRequest.get();
	            if (request.getStartDate() != null) {
	                rentalRequest.setStartDate(request.getStartDate());
	            }
	            if (request.getEndDate() != null) {
	                rentalRequest.setEndDate(request.getEndDate());
	            }
	            if (request.getMonthlyRent() != null) {
	                rentalRequest.setMonthlyRent(request.getMonthlyRent());
	            }
	            if (request.getMessage() != null) {
	                rentalRequest.setMessage(request.getMessage());
	            }

	            // Set status
	            if (request.getStatus() != null) {
	                rentalRequest.setStatus(RentalRequest.Status.valueOf(request.getStatus()));
	            }

	            RentalRequest updatedRequest = rentalRequestService.updateRentalRequest(id, rentalRequest);
	            return ResponseEntity.ok(convertToResponse(updatedRequest));
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }
	    
	    @DeleteMapping("/{id}")
	    public ResponseEntity<Void> deleteRentalRequest(@PathVariable Long id) {
	        rentalRequestService.deleteRentalRequest(id);
	        return ResponseEntity.ok().build();
	    }
	    
	    @GetMapping("/owner/{ownerId}")
	    public ResponseEntity<List<RentalRequestResponse>> getRentalRequestsByOwner(@PathVariable Long ownerId) {
	        List<RentalRequest> requests = rentalRequestService.getRentalRequestsByOwner(ownerId);
	        List<RentalRequestResponse> responses = requests.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @GetMapping("/rental/{rentalId}")
	    public ResponseEntity<List<RentalRequestResponse>> getRentalRequestsByRental(@PathVariable Long rentalId) {
	        List<RentalRequest> requests = rentalRequestService.getRentalRequestsByRental(rentalId);
	        List<RentalRequestResponse> responses = requests.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @GetMapping("/status/{status}")
	    public ResponseEntity<List<RentalRequestResponse>> getRentalRequestsByStatus(@PathVariable RentalRequest.Status status) {
	        List<RentalRequest> requests = rentalRequestService.getRentalRequestsByStatus(status);
	        List<RentalRequestResponse> responses = requests.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }
	    
	    @PutMapping("/{id}/approve")
	    public ResponseEntity<RentalRequestResponse> approveRequest(@PathVariable Long id) {
	        RentalRequest request = rentalRequestService.approveRequest(id);
	        return ResponseEntity.ok(convertToResponse(request));
	    }

	    @PutMapping("/{id}/reject")
	    public ResponseEntity<RentalRequestResponse> rejectRequest(@PathVariable Long id) {
	        RentalRequest request = rentalRequestService.rejectRequest(id);
	        return ResponseEntity.ok(convertToResponse(request));
	    }

	    private RentalRequestResponse convertToResponse(RentalRequest request) {
	        RentalRequestResponse response = new RentalRequestResponse();
	        response.setId(request.getId());

	        if (request.getRental() != null) {
	            RentalRequestResponse.UserInfo rentalInfo = new RentalRequestResponse.UserInfo();
	            rentalInfo.setId(request.getRental().getId().toString());
	            rentalInfo.setName(request.getRental().getName());
	            response.setRental(rentalInfo);
	        }

	        if (request.getOwner() != null) {
	            RentalRequestResponse.UserInfo ownerInfo = new RentalRequestResponse.UserInfo();
	            ownerInfo.setId(request.getOwner().getId().toString());
	            ownerInfo.setName(request.getOwner().getName());
	            response.setOwner(ownerInfo);
	        }

	        if (request.getMachine() != null) {
	            RentalRequestResponse.MachineInfo machineInfo = new RentalRequestResponse.MachineInfo();
	            machineInfo.setId(request.getMachine().getId().toString());
	            machineInfo.setName(request.getMachine().getName());
	            response.setMachine(machineInfo);
	        }

	        response.setRequestDate(request.getRequestDate());
	        response.setStartDate(request.getStartDate());
	        response.setEndDate(request.getEndDate());
	        response.setMonthlyRent(request.getMonthlyRent());
	        response.setStatus(request.getStatus().name());
	        response.setMessage(request.getMessage());
	        response.setCreatedAt(request.getCreatedAt());
	        response.setUpdatedAt(request.getUpdatedAt());

	        return response;
	    }
}
