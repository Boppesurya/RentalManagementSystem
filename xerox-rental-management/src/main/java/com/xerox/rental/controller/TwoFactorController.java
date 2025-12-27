package com.xerox.rental.controller;

import com.xerox.rental.service.TwoFactorService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/2fa")
@CrossOrigin(origins = "*")
public class TwoFactorController {

    @Autowired
    private TwoFactorService twoFactorService;

    @PostMapping("/setup")
    public ResponseEntity<Map<String, Object>> setupTwoFactor(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            String appName = (String) request.get("appName");

            Map<String, Object> result = twoFactorService.setupTwoFactor(userId, appName);
            result.put("success", true);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/verify-setup")
    public ResponseEntity<Map<String, Object>> verifyAndEnable(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            int code = Integer.parseInt(request.get("code").toString());

            boolean isValid = twoFactorService.verifyAndEnableTwoFactor(userId, code);

            Map<String, Object> response = new HashMap<>();
            response.put("success", isValid);
            response.put("message", isValid ? "Two-factor authentication enabled successfully" : "Invalid verification code");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyCode(@RequestBody Map<String, Object> request, HttpServletRequest httpRequest) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            int code = Integer.parseInt(request.get("code").toString());

            String ipAddress = getClientIP(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            boolean isValid = twoFactorService.verifyTwoFactorCode(userId, code, ipAddress, userAgent);

            Map<String, Object> response = new HashMap<>();
            response.put("success", isValid);
            response.put("message", isValid ? "Verification successful" : "Invalid verification code");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/verify-backup")
    public ResponseEntity<Map<String, Object>> verifyBackupCode(@RequestBody Map<String, Object> request, HttpServletRequest httpRequest) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            String backupCode = request.get("backupCode").toString();

            String ipAddress = getClientIP(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            boolean isValid = twoFactorService.verifyBackupCode(userId, backupCode, ipAddress, userAgent);

            Map<String, Object> response = new HashMap<>();
            response.put("success", isValid);
            response.put("message", isValid ? "Backup code verified successfully" : "Invalid backup code");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/disable")
    public ResponseEntity<Map<String, Object>> disableTwoFactor(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            int code = Integer.parseInt(request.get("code").toString());

            boolean isDisabled = twoFactorService.disableTwoFactor(userId, code);

            Map<String, Object> response = new HashMap<>();
            response.put("success", isDisabled);
            response.put("message", isDisabled ? "Two-factor authentication disabled successfully" : "Invalid verification code");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/backup-codes")
    public ResponseEntity<Map<String, Object>> getBackupCodes(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            int code = Integer.parseInt(request.get("code").toString());

            List<String> backupCodes = twoFactorService.getBackupCodes(userId, code);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("backupCodes", backupCodes);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/status/{userId}")
    public ResponseEntity<Map<String, Object>> getTwoFactorStatus(@PathVariable Long userId) {
        try {
            boolean isEnabled = twoFactorService.isTwoFactorEnabled(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("enabled", isEnabled);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
