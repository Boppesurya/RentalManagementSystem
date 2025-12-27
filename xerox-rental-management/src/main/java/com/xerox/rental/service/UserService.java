package com.xerox.rental.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.xerox.rental.entity.User;
import com.xerox.rental.repository.UserRepository;
import com.xerox.rental.util.EncryptionUtil;

@Service
@Transactional
public class UserService {
	  @Autowired
	    private UserRepository userRepository;

	    @Autowired
	    private EncryptionUtil encryptionUtil;

	    @Autowired
	    private AuditLogService auditLogService;

	    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
	    
	    public List<User> getAllUsers() {
	        return userRepository.findAllWithOwner();
	    }
	    
	    public List<User> getUsersByOwner(Long ownerId) {
	        return userRepository.findByOwner_IdAndRoleIn(
	            ownerId, List.of(User.Role.RENTAL, User.Role.TECHNICIAN)
	        );
	    }
	    
	    public List<User> getVisibleUsersForRental(Long rentalId) {
	        User rental = userRepository.findById(rentalId)
	                .orElseThrow(() -> new RuntimeException("Rental not found"));
	        if (rental.getOwner() == null) return List.of();

	        Long ownerId = rental.getOwner().getId();
	        return userRepository.findAllWithOwner().stream()
	                .filter(u ->
	                    (u.getRole() == User.Role.OWNER && u.getId().equals(ownerId)) ||
	                    (u.getRole() == User.Role.TECHNICIAN &&
	                     u.getOwner() != null && u.getOwner().getId().equals(ownerId))
	                )
	                .collect(Collectors.toList());
	    }

	    public List<User> getTechniciansByOwner(Long ownerId) {
	        User owner = userRepository.findById(ownerId)
	            .orElseThrow(() -> new RuntimeException("Owner not found"));
	        return userRepository.findByOwnerAndRole(owner, User.Role.TECHNICIAN);
	    }


	    
	    public Optional<User> getUserById(Long id) {
	        return userRepository.findById(id);
	    }
	    
	    public User createUser(User user) {
	        System.out.println("UserService: Creating user " + user.getName() + " with role " + user.getRole());
	        if (user.getOwner() != null) {
	            System.out.println("UserService: Owner set to " + user.getOwner().getId());
	        }

	        // Set default password if not provided
	        if (user.getPassword() == null || user.getPassword().isEmpty()) {
	            user.setPassword(passwordEncoder.encode("temp123"));
	        } else {
	            // Only encode if not already encoded
	            if (!user.getPassword().startsWith("$2a$")) {
	                user.setPassword(passwordEncoder.encode(user.getPassword()));
	            }
	        }
	        user.setIsPasswordChanged(false);

	        // Encrypt bank account number if provided
	        if (user.getBankAccountNumber() != null && !user.getBankAccountNumber().isEmpty()) {
	            if (!encryptionUtil.isEncrypted(user.getBankAccountNumber())) {
	                user.setBankAccountNumber(encryptionUtil.encrypt(user.getBankAccountNumber()));
	            }
	        }

	        User savedUser = userRepository.save(user);
	        System.out.println("UserService: Saved user " + savedUser.getName() + " with ID " + savedUser.getId());
	        if (savedUser.getOwner() != null) {
	            System.out.println("UserService: Saved user has owner " + savedUser.getOwner().getId());
	        } else {
	            System.out.println("UserService: WARNING - Saved user has NO owner!");
	        }

	        return savedUser;
	    }
	    
	    public User updateUser(Long id, User userDetails) {
	        User user = userRepository.findById(id)
	                .orElseThrow(() -> new RuntimeException("User not found"));
	        
	        if (userDetails.getName() != null) {
	            user.setName(userDetails.getName());
	        }
	        if (userDetails.getEmail() != null) {
	            user.setEmail(userDetails.getEmail());
	        }
	        if (userDetails.getRole() != null) {
	            user.setRole(userDetails.getRole());
	        }
	        if (userDetails.getGstNumber() != null) {
	            user.setGstNumber(userDetails.getGstNumber());
	        }
	        if (userDetails.getContactNumber() != null) {
	            user.setContactNumber(userDetails.getContactNumber());
	        }
	        if (userDetails.getAddress() != null) {
	            user.setAddress(userDetails.getAddress());
	        }
	        if (userDetails.getOwner() != null) {
	            user.setOwner(userDetails.getOwner());
	            System.out.println("UserService: Updated owner for user " + user.getName() + " to " + userDetails.getOwner().getId());
	        }
	        if (userDetails.getIsPasswordChanged() != null) {
	            user.setIsPasswordChanged(userDetails.getIsPasswordChanged());
	        }

	        // Handle bank details updates
	        if (userDetails.getBankAccountHolderName() != null) {
	            user.setBankAccountHolderName(userDetails.getBankAccountHolderName());
	        }
	        if (userDetails.getBankAccountNumber() != null && !userDetails.getBankAccountNumber().isEmpty()) {
	            // Encrypt bank account number if not already encrypted
	            if (!encryptionUtil.isEncrypted(userDetails.getBankAccountNumber())) {
	                user.setBankAccountNumber(encryptionUtil.encrypt(userDetails.getBankAccountNumber()));

	                // Log bank details update
	                try {
	                    auditLogService.logSensitiveDataAccess(
	                        user,
	                        "User",
	                        user.getId().toString(),
	                        "Updated bank account number for user: " + user.getName()
	                    );
	                } catch (Exception e) {
	                    System.err.println("Error logging bank details update: " + e.getMessage());
	                }
	            } else {
	                user.setBankAccountNumber(userDetails.getBankAccountNumber());
	            }
	        }
	        if (userDetails.getBankIfscCode() != null) {
	            user.setBankIfscCode(userDetails.getBankIfscCode());
	        }
	        if (userDetails.getBankName() != null) {
	            user.setBankName(userDetails.getBankName());
	        }
	        if (userDetails.getBankBranch() != null) {
	            user.setBankBranch(userDetails.getBankBranch());
	        }
	        if (userDetails.getUpiId() != null) {
	            user.setUpiId(userDetails.getUpiId());
	        }

	        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
	            // Don't encode password in updateUser - this should only be used for profile updates
	            // Password changes should go through changePassword method
	            System.out.println("UserService: Password update attempted through updateUser - ignoring");
	        }

	        return userRepository.save(user);
	    }
	    
	    public void deleteUser(Long id) {
	        userRepository.deleteById(id);
	    }
	    
	    public List<User> getUsersByRole(User.Role role) {
	        return userRepository.findByRole(role);
	    }
	    
	    public Optional<User> findByEmail(String email) {
	        return userRepository.findByEmail(email);
	    }
	    
	    public boolean validatePassword(String rawPassword, String encodedPassword) {
	        System.out.println("Validating password - Raw password length: " + rawPassword.length() + 
	                          ", Encoded password starts with: " + (encodedPassword != null ? encodedPassword.substring(0, Math.min(10, encodedPassword.length())) : "null"));
	        return passwordEncoder.matches(rawPassword, encodedPassword);
	    }
	    
	    public User changePassword(Long userId, String newPassword) {
	        User user = userRepository.findById(userId)
	                .orElseThrow(() -> new RuntimeException("User not found"));

	        // Encode the new password
	        user.setPassword(passwordEncoder.encode(newPassword));
	        user.setIsPasswordChanged(true);

	        return userRepository.save(user);
	    }

	    /**
	     * Get decrypted bank account number
	     * Only accessible by the user themselves or admin
	     */
	    public String getDecryptedBankAccountNumber(Long userId, Long requestingUserId, User.Role requestingUserRole) {
	        // Check authorization
	        if (!requestingUserRole.equals(User.Role.ADMIN) && !userId.equals(requestingUserId)) {
	            throw new RuntimeException("Unauthorized access to sensitive data");
	        }

	        User user = userRepository.findById(userId)
	                .orElseThrow(() -> new RuntimeException("User not found"));

	        if (user.getBankAccountNumber() == null || user.getBankAccountNumber().isEmpty()) {
	            return null;
	        }

	        // Log sensitive data access
	        try {
	            User requestingUser = userRepository.findById(requestingUserId)
	                    .orElseThrow(() -> new RuntimeException("Requesting user not found"));

	            auditLogService.logSensitiveDataAccess(
	                requestingUser,
	                "User",
	                userId.toString(),
	                "Accessed bank account number for user: " + user.getName()
	            );
	        } catch (Exception e) {
	            System.err.println("Error logging sensitive data access: " + e.getMessage());
	        }

	        return encryptionUtil.decrypt(user.getBankAccountNumber());
	    }

	    /**
	     * Get masked bank account number (safe for display)
	     */
	    public String getMaskedBankAccountNumber(Long userId) {
	        User user = userRepository.findById(userId)
	                .orElseThrow(() -> new RuntimeException("User not found"));

	        if (user.getBankAccountNumber() == null || user.getBankAccountNumber().isEmpty()) {
	            return null;
	        }

	        String decrypted = encryptionUtil.decrypt(user.getBankAccountNumber());
	        return encryptionUtil.maskData(decrypted);
	    }
}
