package com.xerox.rental.util;

import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Utility class for encrypting and decrypting sensitive data like bank account numbers.
 * Uses AES-256 encryption with CBC mode and PKCS5 padding.
 */

@Component
public class EncryptionUtil {
	
	private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final String KEY_ALGORITHM = "AES";
    private static final int IV_SIZE = 16;

    @Value("${app.encryption.key:DEFAULT_ENCRYPTION_KEY_CHANGE_IN_PRODUCTION_32_CHARS}")
    private String encryptionKey;

    /**
     * Encrypt sensitive data
     *
     * @param data The plain text data to encrypt
     * @return Base64 encoded encrypted data with IV prepended
     */
    public String encrypt(String data) {
        if (data == null || data.isEmpty()) {
            return null;
        }

        try {
            // Generate random IV
            byte[] iv = new byte[IV_SIZE];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            // Create key from encryption key
            SecretKey key = getSecretKey();

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, ivSpec);

            // Encrypt data
            byte[] encryptedData = cipher.doFinal(data.getBytes("UTF-8"));

            // Combine IV and encrypted data
            byte[] combined = new byte[IV_SIZE + encryptedData.length];
            System.arraycopy(iv, 0, combined, 0, IV_SIZE);
            System.arraycopy(encryptedData, 0, combined, IV_SIZE, encryptedData.length);

            // Return Base64 encoded result
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting data", e);
        }
    }

    /**
     * Decrypt sensitive data
     *
     * @param encryptedData Base64 encoded encrypted data with IV prepended
     * @return Decrypted plain text data
     */
    public String decrypt(String encryptedData) {
        if (encryptedData == null || encryptedData.isEmpty()) {
            return null;
        }

        try {
            // Decode Base64
            byte[] combined = Base64.getDecoder().decode(encryptedData);

            // Extract IV
            byte[] iv = new byte[IV_SIZE];
            System.arraycopy(combined, 0, iv, 0, IV_SIZE);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            // Extract encrypted data
            byte[] encrypted = new byte[combined.length - IV_SIZE];
            System.arraycopy(combined, IV_SIZE, encrypted, 0, encrypted.length);

            // Create key from encryption key
            SecretKey key = getSecretKey();

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, ivSpec);

            // Decrypt data
            byte[] decryptedData = cipher.doFinal(encrypted);

            return new String(decryptedData, "UTF-8");
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting data", e);
        }
    }

    /**
     * Mask sensitive data for display purposes
     * Shows only last 4 characters
     *
     * @param data The data to mask
     * @return Masked data (e.g., "****1234")
     */
    public String maskData(String data) {
        if (data == null || data.isEmpty()) {
            return null;
        }

        if (data.length() <= 4) {
            return "****";
        }

        String lastFour = data.substring(data.length() - 4);
        return "****" + lastFour;
    }

    /**
     * Create SecretKey from encryption key string
     */
    private SecretKey getSecretKey() {
        try {
            // Ensure key is exactly 32 bytes for AES-256
            byte[] keyBytes = encryptionKey.getBytes("UTF-8");
            byte[] normalizedKey = new byte[32];

            if (keyBytes.length >= 32) {
                System.arraycopy(keyBytes, 0, normalizedKey, 0, 32);
            } else {
                System.arraycopy(keyBytes, 0, normalizedKey, 0, keyBytes.length);
                // Pad with zeros if key is shorter
                for (int i = keyBytes.length; i < 32; i++) {
                    normalizedKey[i] = 0;
                }
            }

            return new SecretKeySpec(normalizedKey, KEY_ALGORITHM);
        } catch (Exception e) {
            throw new RuntimeException("Error creating encryption key", e);
        }
    }

    /**
     * Check if data appears to be encrypted
     */
    public boolean isEncrypted(String data) {
        if (data == null || data.isEmpty()) {
            return false;
        }

        try {
            // Try to decode as Base64
            byte[] decoded = Base64.getDecoder().decode(data);
            // Encrypted data should be at least IV_SIZE + some data
            return decoded.length > IV_SIZE;
        } catch (Exception e) {
            return false;
        }
    }

}
