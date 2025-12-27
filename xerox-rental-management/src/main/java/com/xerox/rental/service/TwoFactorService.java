package com.xerox.rental.service;

import java.io.ByteArrayOutputStream;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import com.xerox.rental.entity.TwoFactorAttempt;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.TwoFactorAttemptRepository;
import com.xerox.rental.repository.UserRepository;
import com.xerox.rental.util.EncryptionUtil;

@Service
public class TwoFactorService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TwoFactorAttemptRepository attemptRepository;

    @Autowired
    private EncryptionUtil encryptionUtil;

    private final GoogleAuthenticator googleAuthenticator = new GoogleAuthenticator();
    private static final int BACKUP_CODE_COUNT = 10;
    private static final int BACKUP_CODE_LENGTH = 8;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int RATE_LIMIT_MINUTES = 15;

    @Transactional
    public Map<String, Object> setupTwoFactor(Long userId, String appName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTwoFactorEnabled()) {
            throw new RuntimeException("Two-factor authentication is already enabled");
        }

        GoogleAuthenticatorKey credentials = googleAuthenticator.createCredentials();
        String secretKey = credentials.getKey();

        List<String> backupCodes = generateBackupCodes();

        try {
            String encryptedSecret = encryptionUtil.encrypt(secretKey);
            String encryptedBackupCodes = encryptionUtil.encrypt(String.join(",", backupCodes));

            user.setTwoFactorSecret(encryptedSecret);
            user.setTwoFactorBackupCodes(encryptedBackupCodes);
            user.setTwoFactorEnabled(false);
            userRepository.save(user);

            String otpAuthURL = GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL(
                    appName != null ? appName : "Rental",
                    user.getEmail(),
                    credentials
            );

            String qrCodeBase64 = generateQRCodeImage(otpAuthURL);

            Map<String, Object> response = new HashMap<>();
            response.put("secret", secretKey);
            response.put("qrCode", qrCodeBase64);
            response.put("backupCodes", backupCodes);
            response.put("otpAuthURL", otpAuthURL);

            return response;

        } catch (Exception e) {
            throw new RuntimeException("Failed to setup two-factor authentication: " + e.getMessage());
        }
    }

    @Transactional
    public boolean verifyAndEnableTwoFactor(Long userId, int verificationCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTwoFactorEnabled()) {
            throw new RuntimeException("Two-factor authentication is already enabled");
        }

        if (user.getTwoFactorSecret() == null) {
            throw new RuntimeException("Two-factor authentication is not set up");
        }

        try {
            String decryptedSecret = encryptionUtil.decrypt(user.getTwoFactorSecret());
            boolean isValid = googleAuthenticator.authorize(decryptedSecret, verificationCode);

            logAttempt(userId, TwoFactorAttempt.AttemptType.SETUP, isValid, null, null, null);

            if (isValid) {
                user.setTwoFactorEnabled(true);
                userRepository.save(user);
                return true;
            }

            return false;

        } catch (Exception e) {
            logAttempt(userId, TwoFactorAttempt.AttemptType.SETUP, false, null, null, e.getMessage());
            throw new RuntimeException("Failed to verify code: " + e.getMessage());
        }
    }

    public boolean verifyTwoFactorCode(Long userId, int verificationCode, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getTwoFactorEnabled()) {
            throw new RuntimeException("Two-factor authentication is not enabled");
        }

        if (checkRateLimit(userId)) {
            throw new RuntimeException("Too many failed attempts. Please try again later.");
        }

        try {
            String decryptedSecret = encryptionUtil.decrypt(user.getTwoFactorSecret());
            boolean isValid = googleAuthenticator.authorize(decryptedSecret, verificationCode);

            logAttempt(userId, TwoFactorAttempt.AttemptType.LOGIN, isValid, ipAddress, userAgent, null);

            return isValid;

        } catch (Exception e) {
            logAttempt(userId, TwoFactorAttempt.AttemptType.LOGIN, false, ipAddress, userAgent, e.getMessage());
            throw new RuntimeException("Failed to verify code: " + e.getMessage());
        }
    }

    @Transactional
    public boolean verifyBackupCode(Long userId, String backupCode, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getTwoFactorEnabled()) {
            throw new RuntimeException("Two-factor authentication is not enabled");
        }

        if (checkRateLimit(userId)) {
            throw new RuntimeException("Too many failed attempts. Please try again later.");
        }

        try {
            String decryptedBackupCodes = encryptionUtil.decrypt(user.getTwoFactorBackupCodes());
            List<String> backupCodes = new ArrayList<>(Arrays.asList(decryptedBackupCodes.split(",")));

            boolean isValid = backupCodes.contains(backupCode.trim());

            if (isValid) {
                backupCodes.remove(backupCode.trim());
                String updatedCodes = String.join(",", backupCodes);
                user.setTwoFactorBackupCodes(encryptionUtil.encrypt(updatedCodes));
                userRepository.save(user);

                logAttempt(userId, TwoFactorAttempt.AttemptType.BACKUP_CODE, true, ipAddress, userAgent, null);
                return true;
            }

            logAttempt(userId, TwoFactorAttempt.AttemptType.BACKUP_CODE, false, ipAddress, userAgent, "Invalid backup code");
            return false;

        } catch (Exception e) {
            logAttempt(userId, TwoFactorAttempt.AttemptType.BACKUP_CODE, false, ipAddress, userAgent, e.getMessage());
            throw new RuntimeException("Failed to verify backup code: " + e.getMessage());
        }
    }

    @Transactional
    public boolean disableTwoFactor(Long userId, int verificationCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getTwoFactorEnabled()) {
            throw new RuntimeException("Two-factor authentication is not enabled");
        }

        try {
            String decryptedSecret = encryptionUtil.decrypt(user.getTwoFactorSecret());
            boolean isValid = googleAuthenticator.authorize(decryptedSecret, verificationCode);

            logAttempt(userId, TwoFactorAttempt.AttemptType.DISABLE, isValid, null, null, null);

            if (isValid) {
                user.setTwoFactorEnabled(false);
                user.setTwoFactorSecret(null);
                user.setTwoFactorBackupCodes(null);
                userRepository.save(user);
                return true;
            }

            return false;

        } catch (Exception e) {
            logAttempt(userId, TwoFactorAttempt.AttemptType.DISABLE, false, null, null, e.getMessage());
            throw new RuntimeException("Failed to disable two-factor authentication: " + e.getMessage());
        }
    }

    public List<String> getBackupCodes(Long userId, int verificationCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getTwoFactorEnabled()) {
            throw new RuntimeException("Two-factor authentication is not enabled");
        }

        try {
            String decryptedSecret = encryptionUtil.decrypt(user.getTwoFactorSecret());
            boolean isValid = googleAuthenticator.authorize(decryptedSecret, verificationCode);

            if (!isValid) {
                throw new RuntimeException("Invalid verification code");
            }

            String decryptedBackupCodes = encryptionUtil.decrypt(user.getTwoFactorBackupCodes());
            return Arrays.asList(decryptedBackupCodes.split(","));

        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve backup codes: " + e.getMessage());
        }
    }

    private List<String> generateBackupCodes() {
        SecureRandom random = new SecureRandom();
        List<String> codes = new ArrayList<>();

        for (int i = 0; i < BACKUP_CODE_COUNT; i++) {
            StringBuilder code = new StringBuilder();
            for (int j = 0; j < BACKUP_CODE_LENGTH; j++) {
                code.append(random.nextInt(10));
            }
            codes.add(code.toString());
        }

        return codes;
    }

    private String generateQRCodeImage(String otpAuthURL) {
        try {
            BitMatrix matrix = new MultiFormatWriter()
                    .encode(otpAuthURL, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", outputStream);
            byte[] qrCodeBytes = outputStream.toByteArray();

            return Base64.getEncoder().encodeToString(qrCodeBytes);

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code: " + e.getMessage());
        }
    }

    private void logAttempt(Long userId, TwoFactorAttempt.AttemptType attemptType, boolean success,
                           String ipAddress, String userAgent, String errorMessage) {
        TwoFactorAttempt attempt = new TwoFactorAttempt();
        attempt.setUserId(userId);
        attempt.setAttemptType(attemptType);
        attempt.setSuccess(success);
        attempt.setIpAddress(ipAddress);
        attempt.setUserAgent(userAgent);
        attempt.setErrorMessage(errorMessage);
        attemptRepository.save(attempt);
    }

    private boolean checkRateLimit(Long userId) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(RATE_LIMIT_MINUTES);
        long failedAttempts = attemptRepository.countFailedAttemptsSince(userId, since);
        return failedAttempts >= MAX_FAILED_ATTEMPTS;
    }

    public boolean isTwoFactorEnabled(Long userId) {
        return userRepository.findById(userId)
                .map(User::getTwoFactorEnabled)
                .orElse(false);
    }
}
