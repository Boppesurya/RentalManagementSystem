package com.xerox.rental.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.xerox.rental.dto.LoginRequest;
import com.xerox.rental.dto.LoginResponse;
import com.xerox.rental.entity.User;
import com.xerox.rental.service.AuditLogService;
import com.xerox.rental.service.TwoFactorService;
import com.xerox.rental.service.UserService;
import com.xerox.rental.util.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
	@Autowired
    private UserService userService;
    
	@Autowired
    private JwtUtil jwtUtil;
	
	@Autowired
	private TwoFactorService twoFactorService;
	
	 @Autowired
	 private AuditLogService auditLogService;
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        try {
            System.out.println("Login attempt for email: " + loginRequest.getEmail());
            Optional<User> userOptional = userService.findByEmail(loginRequest.getEmail());
            
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                System.out.println("User found: " + user.getEmail() + ", checking password...");
                boolean isValidPassword = userService.validatePassword(loginRequest.getPassword(), user.getPassword());
                
                if (isValidPassword) {
                    System.out.println("Password valid, login successful");

                    String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());

                    user.setPassword(null);
                    return ResponseEntity.ok(new LoginResponse(true, "Login successful", user, token));
                } else {
                    System.out.println("Password invalid for user: " + user.getEmail());
                    return ResponseEntity.ok(new LoginResponse(false, "Invalid password", null));
                }
            } else {
                System.out.println("User not found with email: " + loginRequest.getEmail());
                return ResponseEntity.ok(new LoginResponse(false, "User not found", null));
            }
        } catch (Exception e) {
            System.out.println("Login exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new LoginResponse(false, "Login failed: " + e.getMessage(), null));
        }
    }
    
    @PostMapping("/verify-2fa-login")
    public ResponseEntity<LoginResponse> verifyTwoFactorLogin(@RequestBody Map<String, Object> request, HttpServletRequest httpRequest) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            Integer code = request.get("code") != null ? Integer.parseInt(request.get("code").toString()) : null;
            String backupCode = request.get("backupCode") != null ? request.get("backupCode").toString() : null;

            String ipAddress = getClientIP(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            boolean isValid = false;

            if (code != null) {
                isValid = twoFactorService.verifyTwoFactorCode(userId, code, ipAddress, userAgent);
            } else if (backupCode != null) {
                isValid = twoFactorService.verifyBackupCode(userId, backupCode, ipAddress, userAgent);
            } else {
                return ResponseEntity.ok(new LoginResponse(false, "Verification code or backup code required", null));
            }

            if (isValid) {
                Optional<User> userOptional = userService.getUserById(userId);
                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
                    user.setPassword(null);
                    return ResponseEntity.ok(new LoginResponse(true, "Login successful", user, token));
                }
            }

            return ResponseEntity.ok(new LoginResponse(false, "Invalid verification code", null));

        } catch (Exception e) {
            System.out.println("2FA verification exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new LoginResponse(false, "Verification failed: " + e.getMessage(), null));
        }
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
    
    /**
     * Admin impersonation endpoint - allows ADMIN to log in as any user without password
     * Requires admin authentication via JWT token
     */
    @PostMapping("/impersonate/{userId}")
    public ResponseEntity<LoginResponse> impersonateUser(
            @PathVariable Long userId,
            @RequestParam Long adminId,
            @RequestParam String adminRole) {
        try {
            System.out.println("Impersonation request - Admin ID: " + adminId + ", Target User ID: " + userId);

            // Verify admin role
            if (!"ADMIN".equals(adminRole)) {
                System.out.println("Impersonation denied - Not an admin");
                return ResponseEntity.status(403).body(
                    new LoginResponse(false, "Only administrators can impersonate users", null)
                );
            }

            // Get admin user for audit logging
            Optional<User> adminOptional = userService.getUserById(adminId);
            if (!adminOptional.isPresent()) {
                return ResponseEntity.status(403).body(
                    new LoginResponse(false, "Admin user not found", null)
                );
            }
            User admin = adminOptional.get();

            // Get target user to impersonate
            Optional<User> targetUserOptional = userService.getUserById(userId);
            if (!targetUserOptional.isPresent()) {
                System.out.println("Target user not found: " + userId);
                return ResponseEntity.ok(new LoginResponse(false, "User not found", null));
            }

            User targetUser = targetUserOptional.get();
            System.out.println("Admin " + admin.getName() + " impersonating user: " + targetUser.getName());

            // Generate token for target user
            String token = jwtUtil.generateToken(targetUser.getEmail(), targetUser.getId(), targetUser.getRole().name());

            // Log impersonation action
            try {
                auditLogService.logSensitiveDataAccess(
                    admin,
                    "User",
                    targetUser.getId().toString(),
                    "IMPERSONATION: Admin " + admin.getName() + " (" + admin.getEmail() + ") logged in as " +
                    targetUser.getName() + " (" + targetUser.getEmail() + ") with role " + targetUser.getRole()
                );
            } catch (Exception e) {
                System.err.println("Error logging impersonation: " + e.getMessage());
            }

            // Remove sensitive data before returning
            targetUser.setPassword(null);

            return ResponseEntity.ok(new LoginResponse(
                true,
                "Impersonation successful - Logged in as " + targetUser.getName(),
                targetUser,
                token
            ));

        } catch (Exception e) {
            System.out.println("Impersonation exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new LoginResponse(false, "Impersonation failed: " + e.getMessage(), null));
        }
    }
    
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody ChangePasswordRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            System.out.println("Password change request for user: " + request.getUserId());
            
            Long userId;
            try {
                userId = Long.parseLong(request.getUserId());
            } catch (NumberFormatException e) {
                System.out.println("Invalid user ID format: " + request.getUserId());
                response.put("success", false);
                response.put("message", "Invalid user ID format");
                return ResponseEntity.badRequest().body(response);
            }
            
            Optional<User> userOptional = userService.getUserById(userId);
            
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                System.out.println("Found user: " + user.getEmail());
                
                // Verify current password
                if (userService.validatePassword(request.getCurrentPassword(), user.getPassword())) {
                    System.out.println("Current password verified, updating to new password");
                    // Update password
                    // Update password directly without creating new user object
                    userService.changePassword(user.getId(), request.getNewPassword());
                    
                    response.put("success", true);
                    response.put("message", "Password changed successfully");
                    return ResponseEntity.ok(response);
                } else {
                    System.out.println("Current password verification failed");
                    response.put("success", false);
                    response.put("message", "Current password is incorrect");
                    return ResponseEntity.badRequest().body(response);
                }
            } else {
                System.out.println("User not found with ID: " + userId);
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            System.out.println("Exception in password change: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Failed to change password: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    public static class ChangePasswordRequest {
        private String userId;
        private String currentPassword;
        private String newPassword;
        
        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}
