package com.xerox.rental.controller;




import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

import com.xerox.rental.dto.UserRequest;
import com.xerox.rental.dto.UserResponse;
import com.xerox.rental.entity.User;
import com.xerox.rental.service.AuditLogService;
import com.xerox.rental.service.MachineService;
import com.xerox.rental.service.NotificationService;
import com.xerox.rental.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
	 @Autowired
	    private UserService userService;
	    
	    @Autowired
	    private NotificationService notificationService;
	    
	    @Autowired
	    private MachineService machineService;

	    @Autowired
	    private AuditLogService auditLogService;
	    
	    @GetMapping
	    public ResponseEntity<List<UserResponse>> getAllUsers(
	            @RequestParam(required = false) Long currentUserId,
	            @RequestParam(required = false) String currentUserRole) {
	        try {
	            List<User> users;

	            // Admins can see everyone
	            if (currentUserRole == null || "ADMIN".equalsIgnoreCase(currentUserRole)) {
	                users = userService.getAllUsers();
	            }
	            // Owners see their rentals and technicians
	            else if ("OWNER".equalsIgnoreCase(currentUserRole)) {
	                users = userService.getUsersByOwner(currentUserId);
	            }
	            // Technicians see rentals under their owner
	            else if ("TECHNICIAN".equalsIgnoreCase(currentUserRole)) {
	                Optional<User> techOpt = userService.getUserById(currentUserId);
	                if (techOpt.isPresent() && techOpt.get().getOwner() != null) {
	                    Long ownerId = techOpt.get().getOwner().getId();
	                    users = userService.getUsersByOwner(ownerId).stream()
	                            .filter(u -> u.getRole() == User.Role.RENTAL)
	                            .collect(Collectors.toList());
	                } else {
	                    users = List.of();
	                }
	            }
	            // Rentals see their owner + their owner’s technicians
	            else if ("RENTAL".equalsIgnoreCase(currentUserRole)) {
	                Optional<User> rentalOpt = userService.getUserById(currentUserId);
	                if (rentalOpt.isPresent() && rentalOpt.get().getOwner() != null) {
	                    Long ownerId = rentalOpt.get().getOwner().getId();
	                    users = userService.getAllUsers().stream()
	                            .filter(u ->
	                                (u.getRole() == User.Role.OWNER && u.getId().equals(ownerId)) ||
	                                (u.getRole() == User.Role.TECHNICIAN &&
	                                 u.getOwner() != null && u.getOwner().getId().equals(ownerId))
	                            )
	                            .collect(Collectors.toList());
	                    System.out.println("Rental " + currentUserId + " sees " + users.size() + " users (owner + technicians)");
	                } else {
	                    System.out.println("Rental " + currentUserId + " has no owner assigned");
	                    users = List.of();
	                }
	            }
	            // Fallback
	            else {
	                users = List.of();
	            }

	            List<UserResponse> response = users.stream()
	                    .map(u -> {
	                        String masked = null;
	                        try { masked = userService.getMaskedBankAccountNumber(u.getId()); }
	                        catch (Exception ignored) {}
	                        return UserResponse.fromEntity(u, masked);
	                    })
	                    .collect(Collectors.toList());

	            return ResponseEntity.ok(response);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }


	    @GetMapping("/owner/{ownerId}/technicians")
	    public ResponseEntity<List<User>> getTechniciansByOwner(@PathVariable Long ownerId) {
	        List<User> technicians = userService.getTechniciansByOwner(ownerId);
	        return ResponseEntity.ok(technicians);
	    }


	    
	    @GetMapping("/{id}")
	    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
	        return userService.getUserById(id)
	                .map(user -> {
	                    String maskedAccount = null;
	                    try {
	                        maskedAccount = userService.getMaskedBankAccountNumber(user.getId());
	                    } catch (Exception e) {
	                        System.err.println("Error masking bank account: " + e.getMessage());
	                    }
	                    return ResponseEntity.ok(UserResponse.fromEntity(user, maskedAccount));
	                })
	                .orElse(ResponseEntity.notFound().build());
	    }
	    
	    @PostMapping
	    public ResponseEntity<UserResponse> createUser(@RequestBody UserRequest request) {
	        try {
	            System.out.println("Creating user with role: " + request.getRole());
	            System.out.println("Owner ID from request: " + request.getOwnerId());
	            
	            User user = new User();
	            user.setName(request.getName());
	            user.setEmail(request.getEmail());
	            user.setContactNumber(request.getContactNumber());
	            user.setAddress(request.getAddress());
	            user.setGstNumber(request.getGstNumber());
	            user.setIsPasswordChanged(request.getIsPasswordChanged() != null ? request.getIsPasswordChanged() : false);

	            // Set bank details
	            user.setBankAccountHolderName(request.getBankAccountHolderName());
	            user.setBankAccountNumber(request.getBankAccountNumber());  // Will be encrypted in service
	            user.setBankIfscCode(request.getBankIfscCode());
	            user.setBankName(request.getBankName());
	            user.setBankBranch(request.getBankBranch());
	            user.setUpiId(request.getUpiId());

	            // Set role
	            if (request.getRole() != null) {
	                user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
	            }

	            // Set password (will be encoded in service)
	            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
	                user.setPassword(request.getPassword());
	            }
	            
	            // Set owner relationship
	            Long ownerId = request.getOwnerId();
	            if (ownerId != null) {
	                Optional<User> owner = userService.getUserById(ownerId);
	                if (owner.isPresent()) {
	                    user.setOwner(owner.get());
	                    System.out.println("Setting owner " + ownerId + " for " + user.getRole() + " user " + user.getName());
	                } else {
	                    System.out.println("Owner not found: " + ownerId);
	                    return ResponseEntity.badRequest().build();
	                }
	            } else if (request.getRole() != null && ("RENTAL".equalsIgnoreCase(request.getRole()) || "TECHNICIAN".equalsIgnoreCase(request.getRole()))) {
	                System.out.println("Warning: Creating " + request.getRole() + " user without owner ID");
	            }
	            
	            User createdUser = userService.createUser(user);
	            System.out.println("Created user: " + createdUser.getName() + " with owner: " + 
	                (createdUser.getOwner() != null ? createdUser.getOwner().getId() : "null"));
	            
	            // Log user creation
	            try {
	                auditLogService.logEntityCreation(
	                    createdUser, 
	                    "User", 
	                    createdUser.getId().toString(), 
	                    "Created user: " + createdUser.getName() + " with role: " + createdUser.getRole()
	                );
	            } catch (Exception e) {
	                System.err.println("Error logging user creation: " + e.getMessage());
	            }
	            
	            // Send welcome notification
	            try {
	                notificationService.sendWelcomeNotification(createdUser);
	            } catch (Exception e) {
	                System.err.println("Error sending welcome notification: " + e.getMessage());
	            }
	            
	            return ResponseEntity.ok(UserResponse.fromEntity(createdUser));
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }
	    
	    @PutMapping("/{id}")
	    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UserRequest request) {
	        try {
	            User userDetails = new User();
	            userDetails.setName(request.getName());
	            userDetails.setEmail(request.getEmail());
	            userDetails.setContactNumber(request.getContactNumber());
	            userDetails.setAddress(request.getAddress());
	            userDetails.setGstNumber(request.getGstNumber());

	            // Set bank details
	            userDetails.setBankAccountHolderName(request.getBankAccountHolderName());
	            userDetails.setBankAccountNumber(request.getBankAccountNumber());  // Will be encrypted in service
	            userDetails.setBankIfscCode(request.getBankIfscCode());
	            userDetails.setBankName(request.getBankName());
	            userDetails.setBankBranch(request.getBankBranch());
	            userDetails.setUpiId(request.getUpiId());

	            // Set role
	            if (request.getRole() != null) {
	                userDetails.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
	            }

	            // Set password if provided
	            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
	                userDetails.setPassword(request.getPassword());
	            }
	            
	            // Set owner relationship
	            Long ownerId = request.getOwnerId();
	            if (ownerId != null) {
	                Optional<User> owner = userService.getUserById(ownerId);
	                if (owner.isPresent()) {
	                    userDetails.setOwner(owner.get());
	                    System.out.println("Updated owner for user " + userDetails.getName() + " to " + ownerId);
	                }
	            }
	            
	            User updatedUser = userService.updateUser(id, userDetails);
	            return ResponseEntity.ok(UserResponse.fromEntity(updatedUser));
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }
	    
	    @DeleteMapping("/{id}")
	    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
	        userService.deleteUser(id);
	        return ResponseEntity.ok().build();
	    }
	    
	    @GetMapping("/role/{role}")
	    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable User.Role role) {
	        List<User> users = userService.getUsersByRole(role);
	        List<UserResponse> response = users.stream()
	                .map(u -> {
	                    String maskedAccount = null;
	                    try {
	                        maskedAccount = userService.getMaskedBankAccountNumber(u.getId());
	                    } catch (Exception e) {
	                        System.err.println("Error masking bank account: " + e.getMessage());
	                    }
	                    return UserResponse.fromEntity(u, maskedAccount);
	                })
	                .collect(Collectors.toList());
	        return ResponseEntity.ok(response);
	    }

	    /**
	     * Get decrypted bank account number - Only accessible by the user themselves or admin
	     */
	    @GetMapping("/{id}/bank-account")
	    public ResponseEntity<Map<String, String>> getBankAccountNumber(
	            @PathVariable Long id,
	            @RequestParam Long requestingUserId,
	            @RequestParam String requestingUserRole) {
	        try {
	            User.Role role = User.Role.valueOf(requestingUserRole.toUpperCase());
	            String accountNumber = userService.getDecryptedBankAccountNumber(id, requestingUserId, role);

	            Map<String, String> response = new HashMap<>();
	            response.put("bankAccountNumber", accountNumber);

	            return ResponseEntity.ok(response);
	        } catch (RuntimeException e) {
	            return ResponseEntity.status(403).build();
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }
}
